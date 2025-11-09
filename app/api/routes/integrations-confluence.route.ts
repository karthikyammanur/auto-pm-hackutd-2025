/**
 * Confluence Pages API Route
 * 
 * Manages Confluence pages - create, update, search, and retrieve.
 * 
 * @route POST /api/integrations/confluence - Create a page
 * @route GET /api/integrations/confluence?pageId=123 - Get a page
 * @route PUT /api/integrations/confluence?pageId=123 - Update a page
 * 
 * @example Create page:
 * POST {
 *   "spaceKey": "PROD",
 *   "title": "API Documentation",
 *   "content": "<h1>Overview</h1><p>Content here</p>"
 * }
 * 
 * @example Create structured documentation:
 * POST {
 *   "type": "documentation",
 *   "spaceKey": "PROD",
 *   "title": "Feature Spec",
 *   "sections": [
 *     { "title": "Overview", "content": "..." },
 *     { "title": "Requirements", "content": "..." }
 *   ],
 *   "author": "John Doe"
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createConfluencePage,
  updateConfluencePage,
  getConfluencePage,
  searchConfluencePages,
  createDocumentationPage,
} from '@/lib/integrations';

// Create a new page
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Structured documentation page
    if (body.type === 'documentation') {
      const result = await createDocumentationPage({
        spaceKey: body.spaceKey,
        title: body.title,
        sections: body.sections,
        author: body.author,
        parentId: body.parentId,
        labels: body.labels,
      });

      return NextResponse.json(result, {
        status: result.success ? 201 : 400,
      });
    }

    // Standard page creation
    const result = await createConfluencePage({
      spaceKey: body.spaceKey,
      title: body.title,
      content: body.content,
      parentId: body.parentId,
      type: body.pageType,
      status: body.status,
      labels: body.labels,
    });

    return NextResponse.json(result, {
      status: result.success ? 201 : 400,
    });
  } catch (error) {
    console.error('Confluence create API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'API_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

// Get a page by ID or search
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const pageId = searchParams.get('pageId');
    const spaceKey = searchParams.get('spaceKey');
    const title = searchParams.get('title');
    const expand = searchParams.get('expand');

    // Search pages
    if (spaceKey && title) {
      const result = await searchConfluencePages(spaceKey, title);
      return NextResponse.json(result);
    }

    // Get specific page
    if (pageId) {
      const result = await getConfluencePage(pageId, expand || undefined);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Missing required parameters: pageId or (spaceKey + title)',
          code: 'MISSING_PARAMETERS',
        },
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('Confluence get API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'API_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

// Update an existing page
export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const pageId = searchParams.get('pageId');

    if (!pageId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Missing required parameter: pageId',
            code: 'MISSING_PAGE_ID',
          },
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const result = await updateConfluencePage(pageId, {
      title: body.title,
      content: body.content,
      version: body.version,
    });

    return NextResponse.json(result, {
      status: result.success ? 200 : 400,
    });
  } catch (error) {
    console.error('Confluence update API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'API_ERROR',
        },
      },
      { status: 500 }
    );
  }
}
