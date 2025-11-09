/**
 * Slack Integration Service
 * 
 * This module provides Slack messaging capabilities using the Slack Web API.
 * Handles channel messages, direct messages, threaded replies, and rich formatting
 * with Block Kit.
 * 
 * @module lib/integrations/slack-service
 */

import { WebClient } from '@slack/web-api';
import { slackConfig, validateSlackConfig } from './config';
import {
  SlackServiceError,
  ConfigurationError,
  ValidationError,
  createErrorResponse,
  withRetry,
} from './errors';
import type {
  BaseResponse,
  SlackNotificationPayload,
  SlackMessageResponse,
} from './types';

/**
 * Initialize Slack Web API client with configuration validation
 * @returns Configured Slack WebClient instance
 * @throws {ConfigurationError} If configuration is invalid
 */
function initializeSlackClient(): WebClient {
  const validation = validateSlackConfig();

  if (!validation.valid) {
    throw new ConfigurationError(
      `Slack configuration is invalid: ${validation.errors.join(', ')}`,
      { missingKeys: validation.missing }
    );
  }

  return new WebClient(slackConfig.botToken, {
    timeout: slackConfig.timeout,
  });
}

/**
 * Validate Slack notification payload
 * @param payload - Notification payload to validate
 * @throws {ValidationError} If payload is invalid
 */
function validateNotificationPayload(
  payload: SlackNotificationPayload
): void {
  if (!payload.channel || payload.channel.trim() === '') {
    throw new ValidationError('Slack channel is required', {
      field: 'channel',
    });
  }

  if (!payload.message || payload.message.trim() === '') {
    throw new ValidationError('Message content is required', {
      field: 'message',
    });
  }
}

/**
 * Send a message to a Slack channel
 * 
 * @param payload - Slack notification payload with channel, message, and optional blocks
 * @returns Response with channel ID and message timestamp
 * 
 * @example
 * const result = await sendSlackMessage({
 *   channel: '#general',
 *   message: 'Deployment completed successfully! 🚀',
 * });
 * 
 * if (result.success) {
 *   console.log('Message sent:', result.data.ts);
 * }
 */
export async function sendSlackMessage(
  payload: SlackNotificationPayload
): Promise<BaseResponse<SlackMessageResponse>> {
  try {
    // Validate payload
    validateNotificationPayload(payload);

    // Initialize client
    const client = initializeSlackClient();

    // Send message with retry logic
    const response = await withRetry(
      async () => {
        const messageOptions: any = {
          channel: payload.channel,
          text: payload.message,
          username: payload.username || slackConfig.botName,
        };

        // Add optional fields only if provided
        if (payload.blocks) messageOptions.blocks = payload.blocks;
        if (payload.thread_ts) messageOptions.thread_ts = payload.thread_ts;
        if (payload.icon_emoji) messageOptions.icon_emoji = payload.icon_emoji || slackConfig.botEmoji;
        if (payload.icon_url) messageOptions.icon_url = payload.icon_url;
        if (payload.attachments) messageOptions.attachments = payload.attachments;

        return await client.chat.postMessage(messageOptions);
      },
      {
        maxAttempts: slackConfig.retries.maxAttempts,
        factor: slackConfig.retries.factor,
        onRetry: (attempt, error) => {
          console.warn(
            `Slack message attempt ${attempt} failed, retrying...`,
            error.message
          );
        },
      }
    );

    if (!response.ok) {
      throw new SlackServiceError(
        response.error || 'Failed to send Slack message',
        { channel: payload.channel }
      );
    }

    return {
      success: true,
      data: {
        ok: response.ok,
        channel: response.channel,
        ts: response.ts,
      },
    };
  } catch (error) {
    console.error('Failed to send Slack message:', error);

    if (
      error instanceof ValidationError ||
      error instanceof ConfigurationError ||
      error instanceof SlackServiceError
    ) {
      return createErrorResponse(error);
    }

    return createErrorResponse(
      new SlackServiceError('Failed to send Slack message', {
        cause: error instanceof Error ? error : undefined,
        channel: payload.channel,
      })
    );
  }
}

/**
 * Send a formatted notification with predefined styling
 * 
 * @param options - Notification options
 * @returns Response with message details
 * 
 * @example
 * await sendFormattedNotification({
 *   channel: '#alerts',
 *   title: 'Build Failed',
 *   message: 'The production build has failed',
 *   type: 'error',
 *   fields: {
 *     'Branch': 'main',
 *     'Commit': 'abc123',
 *   },
 * });
 */
export async function sendFormattedNotification(options: {
  channel: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  fields?: Record<string, string>;
  url?: string;
  threadTs?: string;
}): Promise<BaseResponse<SlackMessageResponse>> {
  const typeConfig = {
    info: { emoji: 'ℹ️', color: '#0066CC' },
    success: { emoji: '✅', color: '#28A745' },
    warning: { emoji: '⚠️', color: '#FFC107' },
    error: { emoji: '❌', color: '#DC3545' },
  };

  const config = typeConfig[options.type || 'info'];

  // Build Block Kit blocks for rich formatting
  const blocks: Array<{
    type: string;
    [key: string]: unknown;
  }> = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `${config.emoji} ${options.title}`,
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: options.message,
      },
    },
  ];

  // Add fields if provided
  if (options.fields && Object.keys(options.fields).length > 0) {
    const fields = Object.entries(options.fields).map(([key, value]) => ({
      type: 'mrkdwn',
      text: `*${key}:*\n${value}`,
    }));

    blocks.push({
      type: 'section',
      fields,
    });
  }

  // Add action button if URL provided
  if (options.url) {
    blocks.push({
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'View Details',
            emoji: true,
          },
          url: options.url,
        },
      ],
    });
  }

  // Add divider and timestamp
  blocks.push(
    {
      type: 'divider',
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `Sent at: ${new Date().toLocaleString()} | PM Automation`,
        },
      ],
    }
  );

  return sendSlackMessage({
    channel: options.channel,
    message: `${config.emoji} ${options.title}: ${options.message}`,
    blocks,
    thread_ts: options.threadTs,
  });
}

/**
 * Send a workflow status update notification
 * 
 * @param options - Workflow status options
 * @returns Response with message details
 * 
 * @example
 * await sendWorkflowNotification({
 *   channel: '#workflows',
 *   workflowName: 'Data Pipeline',
 *   status: 'completed',
 *   duration: '2m 34s',
 *   details: 'Processed 1,234 records',
 * });
 */
export async function sendWorkflowNotification(options: {
  channel: string;
  workflowName: string;
  status: 'started' | 'completed' | 'failed' | 'cancelled';
  duration?: string;
  details?: string;
  link?: string;
}): Promise<BaseResponse<SlackMessageResponse>> {
  const statusConfig = {
    started: { emoji: '🚀', color: '#0066CC', text: 'Started' },
    completed: { emoji: '✅', color: '#28A745', text: 'Completed' },
    failed: { emoji: '❌', color: '#DC3545', text: 'Failed' },
    cancelled: { emoji: '⏹️', color: '#6C757D', text: 'Cancelled' },
  };

  const config = statusConfig[options.status];

  const fields: Record<string, string> = {
    Workflow: options.workflowName,
    Status: config.text,
  };

  if (options.duration) {
    fields.Duration = options.duration;
  }

  if (options.details) {
    fields.Details = options.details;
  }

  return sendFormattedNotification({
    channel: options.channel,
    title: `Workflow ${config.text}`,
    message: `The workflow *${options.workflowName}* has ${config.text.toLowerCase()}`,
    type: options.status === 'completed' ? 'success' : options.status === 'failed' ? 'error' : 'info',
    fields,
    url: options.link,
  });
}

/**
 * Send a direct message to a user
 * 
 * @param userId - Slack user ID (e.g., U1234567890)
 * @param message - Message content
 * @param blocks - Optional Block Kit blocks
 * @returns Response with message details
 * 
 * @example
 * await sendDirectMessage('U1234567890', 'Your report is ready!');
 */
export async function sendDirectMessage(
  userId: string,
  message: string,
  blocks?: SlackNotificationPayload['blocks']
): Promise<BaseResponse<SlackMessageResponse>> {
  if (!userId || !userId.startsWith('U')) {
    return createErrorResponse(
      new ValidationError('Invalid Slack user ID format', {
        field: 'userId',
        value: userId,
      })
    );
  }

  return sendSlackMessage({
    channel: userId,
    message,
    blocks,
  });
}

/**
 * Reply to a message in a thread
 * 
 * @param channel - Channel ID or name
 * @param threadTs - Parent message timestamp
 * @param message - Reply message
 * @returns Response with message details
 */
export async function replyToThread(
  channel: string,
  threadTs: string,
  message: string
): Promise<BaseResponse<SlackMessageResponse>> {
  return sendSlackMessage({
    channel,
    message,
    thread_ts: threadTs,
  });
}

/**
 * Check if Slack service is configured and available
 * @returns Service status
 */
export async function checkSlackStatus() {
  const validation = validateSlackConfig();

  if (!validation.valid) {
    return {
      service: 'slack' as const,
      configured: false,
      available: false,
      message: `Configuration issues: ${validation.errors.join(', ')}`,
      lastChecked: new Date(),
    };
  }

  // Test authentication
  try {
    const client = initializeSlackClient();
    const response = await client.auth.test();

    return {
      service: 'slack' as const,
      configured: true,
      available: response.ok,
      message: response.ok
        ? `Connected as ${response.user} to ${response.team}`
        : 'Authentication failed',
      lastChecked: new Date(),
    };
  } catch (error) {
    return {
      service: 'slack' as const,
      configured: true,
      available: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      lastChecked: new Date(),
    };
  }
}
