/**
 * Confluence Integration Service
 * 
 * This module provides Confluence documentation automation using the Atlassian REST API.
 * Handles page creation, updates, and content management with proper authentication
 * and error handling.
 * 
 * @module lib/integrations/confluence-service
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  confluenceConfig,
  validateConfluenceConfig,
  getConfluenceBaseUrl,
  getConfluenceAuthHeader,
} from './config';
import {
  ConfluenceServiceError,
  ConfigurationError,
  ValidationError,
  createErrorResponse,
  withRetry,
} from './errors';
import type {
  BaseResponse,
  ConfluencePagePayload,
  ConfluencePageResponse,
} from './types';

/**
 * Initialize Confluence API client with configuration validation
 * @returns Configured Axios instance
 * @throws {ConfigurationError} If configuration is invalid
 */
function initializeConfluenceClient(): AxiosInstance {
  const validation = validateConfluenceConfig();

  if (!validation.valid) {
    throw new ConfigurationError(
      `Confluence configuration is invalid: ${validation.errors.join(', ')}`,
      { missingKeys: validation.missing }
    );
  }

  const baseURL = getConfluenceBaseUrl();

  return axios.create({
    baseURL,
    timeout: confluenceConfig.timeout,
    headers: {
      Authorization: getConfluenceAuthHeader(),
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });
}

/**
 * Validate Confluence page payload
 * @param payload - Page payload to validate
 * @throws {ValidationError} If payload is invalid
 */
function validatePagePayload(payload: ConfluencePagePayload): void {
  if (!payload.spaceKey || payload.spaceKey.trim() === '') {
    throw new ValidationError('Confluence space key is required', {
      field: 'spaceKey',
    });
  }

  if (!payload.title || payload.title.trim() === '') {
    throw new ValidationError('Page title is required', { field: 'title' });
  }

  if (!payload.content || payload.content.trim() === '') {
    throw new ValidationError('Page content is required', {
      field: 'content',
    });
  }
}

/**
 * Handle Confluence API errors
 * @param error - The error to handle
 * @returns Formatted error
 */
function handleConfluenceError(error: unknown): ConfluenceServiceError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;

    return new ConfluenceServiceError(
      axiosError.response?.data
        ? JSON.stringify(axiosError.response.data)
        : axiosError.message,
      {
        cause: axiosError,
        statusCode: axiosError.response?.status,
      }
    );
  }

  return new ConfluenceServiceError(
    error instanceof Error ? error.message : 'Unknown Confluence error',
    {
      cause: error instanceof Error ? error : undefined,
    }
  );
}

/**
 * Create a new Confluence page
 * 
 * @param payload - Page creation payload with space, title, and content
 * @returns Response with created page details
 * 
 * @example
 * const result = await createConfluencePage({
 *   spaceKey: 'PROD',
 *   title: 'API Documentation',
 *   content: '<h1>Overview</h1><p>This is our API documentation.</p>',
 * });
 * 
 * if (result.success) {
 *   console.log('Page created:', result.data._links.webui);
 * }
 */
export async function createConfluencePage(
  payload: ConfluencePagePayload
): Promise<BaseResponse<ConfluencePageResponse>> {
  try {
    // Validate payload
    validatePagePayload(payload);

    // Initialize client
    const client = initializeConfluenceClient();

    // Prepare page data
    const pageData = {
      type: payload.type || 'page',
      title: payload.title,
      space: {
        key: payload.spaceKey,
      },
      body: {
        storage: {
          value: payload.content,
          representation: 'storage',
        },
      },
      status: payload.status || 'current',
      ...(payload.parentId && {
        ancestors: [{ id: payload.parentId }],
      }),
    };

    // Create page with retry logic
    const response = await withRetry(
      async () => {
        return await client.post<ConfluencePageResponse>('/content', pageData);
      },
      {
        maxAttempts: 3,
        onRetry: (attempt, error) => {
          console.warn(
            `Confluence page creation attempt ${attempt} failed, retrying...`,
            error.message
          );
        },
      }
    );

    // Add labels if provided
    if (payload.labels && payload.labels.length > 0) {
      await addLabelsToPage(response.data.id, payload.labels);
    }

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Failed to create Confluence page:', error);

    if (
      error instanceof ValidationError ||
      error instanceof ConfigurationError
    ) {
      return createErrorResponse(error);
    }

    return createErrorResponse(handleConfluenceError(error));
  }
}

/**
 * Update an existing Confluence page
 * 
 * @param pageId - The ID of the page to update
 * @param updates - Updates to apply (title, content, etc.)
 * @returns Response with updated page details
 * 
 * @example
 * await updateConfluencePage('123456', {
 *   title: 'Updated API Documentation',
 *   content: '<h1>New Content</h1>',
 * });
 */
export async function updateConfluencePage(
  pageId: string,
  updates: {
    title?: string;
    content?: string;
    version?: number;
  }
): Promise<BaseResponse<ConfluencePageResponse>> {
  try {
    if (!pageId) {
      throw new ValidationError('Page ID is required', { field: 'pageId' });
    }

    const client = initializeConfluenceClient();

    // Get current page to retrieve version number
    const currentPage = await client.get<ConfluencePageResponse>(
      `/content/${pageId}?expand=version`
    );

    const nextVersion =
      updates.version || (currentPage.data as any).version.number + 1;

    // Prepare update data
    const updateData = {
      version: {
        number: nextVersion,
      },
      title: updates.title || currentPage.data.title,
      type: currentPage.data.type,
      body: updates.content
        ? {
            storage: {
              value: updates.content,
              representation: 'storage',
            },
          }
        : undefined,
    };

    const response = await withRetry(
      async () => {
        return await client.put<ConfluencePageResponse>(
          `/content/${pageId}`,
          updateData
        );
      },
      {
        maxAttempts: 3,
      }
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Failed to update Confluence page:', error);

    if (error instanceof ValidationError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(handleConfluenceError(error));
  }
}

/**
 * Get a Confluence page by ID
 * 
 * @param pageId - The page ID to retrieve
 * @param expand - Optional expansion parameters (e.g., 'body.storage,version')
 * @returns Response with page details
 */
export async function getConfluencePage(
  pageId: string,
  expand?: string
): Promise<BaseResponse<ConfluencePageResponse>> {
  try {
    if (!pageId) {
      throw new ValidationError('Page ID is required', { field: 'pageId' });
    }

    const client = initializeConfluenceClient();

    const url = expand
      ? `/content/${pageId}?expand=${expand}`
      : `/content/${pageId}`;

    const response = await client.get<ConfluencePageResponse>(url);

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Failed to get Confluence page:', error);
    return createErrorResponse(handleConfluenceError(error));
  }
}

/**
 * Search for Confluence pages
 * 
 * @param spaceKey - Space key to search in
 * @param title - Page title to search for
 * @returns Response with array of matching pages
 */
export async function searchConfluencePages(
  spaceKey: string,
  title: string
): Promise<BaseResponse<ConfluencePageResponse[]>> {
  try {
    const client = initializeConfluenceClient();

    const cql = `space="${spaceKey}" AND title~"${title}"`;
    const response = await client.get<{ results: ConfluencePageResponse[] }>(
      `/content/search?cql=${encodeURIComponent(cql)}`
    );

    return {
      success: true,
      data: response.data.results,
    };
  } catch (error) {
    console.error('Failed to search Confluence pages:', error);
    return createErrorResponse(handleConfluenceError(error));
  }
}

/**
 * Delete a Confluence page
 * 
 * @param pageId - The ID of the page to delete
 * @returns Response indicating success
 */
export async function deleteConfluencePage(
  pageId: string
): Promise<BaseResponse<void>> {
  try {
    if (!pageId) {
      throw new ValidationError('Page ID is required', { field: 'pageId' });
    }

    const client = initializeConfluenceClient();
    await client.delete(`/content/${pageId}`);

    return {
      success: true,
    };
  } catch (error) {
    console.error('Failed to delete Confluence page:', error);
    return createErrorResponse(handleConfluenceError(error));
  }
}

/**
 * Add labels to a Confluence page
 * 
 * @param pageId - The page ID
 * @param labels - Array of labels to add
 * @returns Response indicating success
 */
export async function addLabelsToPage(
  pageId: string,
  labels: Array<{ name: string }>
): Promise<BaseResponse<void>> {
  try {
    const client = initializeConfluenceClient();

    await client.post(`/content/${pageId}/label`, labels);

    return {
      success: true,
    };
  } catch (error) {
    console.error('Failed to add labels:', error);
    return createErrorResponse(handleConfluenceError(error));
  }
}

/**
 * Create a structured documentation page with common formatting
 * 
 * @param options - Documentation options
 * @returns Response with created page details
 * 
 * @example
 * await createDocumentationPage({
 *   spaceKey: 'PROD',
 *   title: 'Feature Spec: User Authentication',
 *   sections: [
 *     { title: 'Overview', content: 'This feature adds SSO support...' },
 *     { title: 'Requirements', content: '1. Must support OAuth 2.0...' },
 *   ],
 *   author: 'John Doe',
 * });
 */
export async function createDocumentationPage(options: {
  spaceKey: string;
  title: string;
  sections: Array<{ title: string; content: string }>;
  author?: string;
  parentId?: string;
  labels?: string[];
}): Promise<BaseResponse<ConfluencePageResponse>> {
  const timestamp = new Date().toLocaleDateString();

  // Build HTML content with sections
  const sectionsHtml = options.sections
    .map(
      (section) => `
    <h2>${section.title}</h2>
    <div>${section.content}</div>
  `
    )
    .join('');

  const content = `
    <div>
      <p><em>Created on ${timestamp}${options.author ? ` by ${options.author}` : ''}</em></p>
      ${sectionsHtml}
      <hr />
      <p><small>This page was automatically generated by PM Automation</small></p>
    </div>
  `;

  return createConfluencePage({
    spaceKey: options.spaceKey,
    title: options.title,
    content,
    parentId: options.parentId,
    labels: options.labels?.map((name) => ({ name })),
  });
}

/**
 * Check if Confluence service is configured and available
 * @returns Service status
 */
export async function checkConfluenceStatus() {
  const validation = validateConfluenceConfig();

  if (!validation.valid) {
    return {
      service: 'confluence' as const,
      configured: false,
      available: false,
      message: `Configuration issues: ${validation.errors.join(', ')}`,
      lastChecked: new Date(),
    };
  }

  // Test API connection
  try {
    const client = initializeConfluenceClient();
    const response = await client.get('/space');

    return {
      service: 'confluence' as const,
      configured: true,
      available: response.status === 200,
      message: 'Successfully connected to Confluence API',
      lastChecked: new Date(),
    };
  } catch (error) {
    return {
      service: 'confluence' as const,
      configured: true,
      available: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      lastChecked: new Date(),
    };
  }
}
