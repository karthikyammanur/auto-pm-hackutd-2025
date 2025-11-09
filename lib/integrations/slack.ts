/**
 * Slack Notification System for Product Manager Workflow Updates
 * 
 * Provides real-time notifications to PM team channels when agents complete tasks,
 * analyses are ready, approvals are needed, or errors occur.
 * 
 * Features:
 * - Rich Block Kit formatted messages
 * - Priority-based color coding
 * - Threaded replies for follow-ups
 * - Retry logic with exponential backoff
 * - Channel validation
 * - User mentions support
 * 
 * @module lib/integrations/slack
 */

import { WebClient, ChatPostMessageResponse, ConversationsInfoResponse } from '@slack/web-api';
import { slackConfig } from './config';

// ============================================================================
// Types
// ============================================================================

/**
 * Notification types for different PM workflow events
 */
export type NotificationType = 
  | 'task_completed'      // Agent completed a task (user story, wireframe, etc.)
  | 'analysis_ready'      // Analysis results are ready for review
  | 'approval_needed'     // PM approval required
  | 'error_alert';        // Error or issue that needs attention

/**
 * Priority levels for notifications (affects message styling)
 */
export type Priority = 'low' | 'medium' | 'high' | 'critical';

/**
 * Payload for Slack notifications
 */
export interface SlackNotificationPayload {
  /** Main title of the notification */
  title: string;
  
  /** Detailed description or message body */
  description: string;
  
  /** Optional metadata displayed as key-value pairs */
  metadata?: Record<string, string>;
  
  /** Optional URL for action button */
  actionUrl?: string;
  
  /** Priority level (affects color and visibility) */
  priority?: Priority;
}

/**
 * Additional options for Slack messages
 */
export interface SlackNotificationOptions {
  /** Thread timestamp to reply to an existing message */
  threadTs?: string;
  
  /** Array of user IDs to mention in the notification */
  mentionUsers?: string[];
  
  /** Optional custom username for the bot */
  username?: string;
  
  /** Optional emoji icon for the bot */
  iconEmoji?: string;
}

/**
 * Response from sending a Slack notification
 */
export interface SlackNotificationResponse {
  /** Whether the notification was sent successfully */
  success: boolean;
  
  /** Message timestamp (used for threading) */
  messageTs?: string;
  
  /** Channel where the message was sent */
  channel?: string;
  
  /** Error message if sending failed */
  error?: string;
  
  /** Number of retry attempts made */
  retryCount?: number;
}

// ============================================================================
// Configuration & Utilities
// ============================================================================

/**
 * Get configured Slack Web API client
 */
function getSlackClient(): WebClient {
  if (!slackConfig.botToken) {
    throw new Error('SLACK_BOT_TOKEN is not configured. Please set it in your .env.local file.');
  }
  
  return new WebClient(slackConfig.botToken);
}

/**
 * Get emoji and label for notification type
 */
function getNotificationTypeInfo(type: NotificationType): { emoji: string; label: string } {
  const typeMap: Record<NotificationType, { emoji: string; label: string }> = {
    task_completed: { emoji: '✅', label: 'Task Completed' },
    analysis_ready: { emoji: '📊', label: 'Analysis Ready' },
    approval_needed: { emoji: '⚠️', label: 'Approval Needed' },
    error_alert: { emoji: '🚨', label: 'Error Alert' },
  };
  
  return typeMap[type];
}

/**
 * Get color code based on priority level
 */
function getPriorityColor(priority: Priority = 'medium'): string {
  const colorMap: Record<Priority, string> = {
    low: '#36a64f',      // Green
    medium: '#2196F3',   // Blue
    high: '#ff9800',     // Orange
    critical: '#f44336', // Red
  };
  
  return colorMap[priority];
}

/**
 * Get priority emoji for visual emphasis
 */
function getPriorityEmoji(priority: Priority = 'medium'): string {
  const emojiMap: Record<Priority, string> = {
    low: '🟢',
    medium: '🔵',
    high: '🟠',
    critical: '🔴',
  };
  
  return emojiMap[priority];
}

/**
 * Validate that a channel exists and bot has access
 * 
 * @param client - Slack Web API client
 * @param channel - Channel ID or name
 * @returns Whether the channel is valid
 */
async function validateChannel(client: WebClient, channel: string): Promise<boolean> {
  try {
    // Remove # prefix if present
    const channelId = channel.startsWith('#') ? channel.slice(1) : channel;
    
    await client.conversations.info({ channel: channelId });
    return true;
  } catch (error: any) {
    console.error(`[Slack] Channel validation failed for ${channel}:`, error.message);
    return false;
  }
}

/**
 * Retry a function with exponential backoff
 * 
 * @param fn - Async function to retry
 * @param maxAttempts - Maximum number of retry attempts (default: 3)
 * @param baseDelay - Base delay in milliseconds (default: 1000)
 * @returns Result from successful function call
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000
): Promise<{ result: T; attempts: number }> {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await fn();
      return { result, attempts: attempt };
    } catch (error: any) {
      lastError = error;
      
      if (attempt < maxAttempts) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`[Slack] Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Max retry attempts reached');
}

// ============================================================================
// Main Notification Function
// ============================================================================

/**
 * Send a Slack notification to a PM team channel
 * 
 * Creates a rich, formatted message using Slack Block Kit with:
 * - Color-coded priority indicator
 * - Header with notification type
 * - Description
 * - Metadata fields
 * - Optional action button
 * - User mentions
 * - Thread support
 * 
 * @param channel - Channel ID (e.g., 'C1234567890') or name (e.g., '#pm-notifications')
 * @param notificationType - Type of notification being sent
 * @param payload - Notification content and metadata
 * @param options - Additional options (threading, mentions, etc.)
 * @returns Response with success status and message timestamp
 * 
 * @example
 * ```typescript
 * const result = await sendSlackNotification(
 *   '#pm-team',
 *   'task_completed',
 *   {
 *     title: 'User Story Created',
 *     description: 'LangGraph agent created 5 user stories for the mobile app feature',
 *     metadata: {
 *       'Project': 'Mobile App v2',
 *       'Stories': '5',
 *       'Agent': 'story-generator'
 *     },
 *     actionUrl: 'https://jira.company.com/browse/PROJ-123',
 *     priority: 'medium'
 *   },
 *   {
 *     mentionUsers: ['U123456', 'U789012']
 *   }
 * );
 * ```
 */
export async function sendSlackNotification(
  channel: string,
  notificationType: NotificationType,
  payload: SlackNotificationPayload,
  options: SlackNotificationOptions = {}
): Promise<SlackNotificationResponse> {
  const startTime = Date.now();
  
  try {
    // Get Slack client
    const client = getSlackClient();
    
    // Validate channel
    const isValidChannel = await validateChannel(client, channel);
    if (!isValidChannel) {
      return {
        success: false,
        error: `Channel ${channel} not found or bot doesn't have access`,
      };
    }
    
    // Get notification type info
    const typeInfo = getNotificationTypeInfo(notificationType);
    const priority = payload.priority || 'medium';
    const priorityColor = getPriorityColor(priority);
    const priorityEmoji = getPriorityEmoji(priority);
    
    // Build message blocks
    const blocks: any[] = [];
    
    // Header section
    blocks.push({
      type: 'header',
      text: {
        type: 'plain_text',
        text: `${typeInfo.emoji} ${typeInfo.label}`,
        emoji: true,
      },
    });
    
    // Priority indicator if high or critical
    if (priority === 'high' || priority === 'critical') {
      blocks.push({
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `${priorityEmoji} *${priority.toUpperCase()} PRIORITY*`,
          },
        ],
      });
    }
    
    // Divider
    blocks.push({ type: 'divider' });
    
    // Title and description
    let descriptionText = `*${payload.title}*\n${payload.description}`;
    
    // Add user mentions if provided
    if (options.mentionUsers && options.mentionUsers.length > 0) {
      const mentions = options.mentionUsers.map(userId => `<@${userId}>`).join(' ');
      descriptionText = `${mentions}\n\n${descriptionText}`;
    }
    
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: descriptionText,
      },
    });
    
    // Metadata fields
    if (payload.metadata && Object.keys(payload.metadata).length > 0) {
      blocks.push({ type: 'divider' });
      
      const fields = Object.entries(payload.metadata).map(([key, value]) => ({
        type: 'mrkdwn',
        text: `*${key}:*\n${value}`,
      }));
      
      blocks.push({
        type: 'section',
        fields: fields,
      });
    }
    
    // Action button
    if (payload.actionUrl) {
      blocks.push({
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '🔗 View Details',
              emoji: true,
            },
            url: payload.actionUrl,
            style: priority === 'critical' ? 'danger' : priority === 'high' ? 'primary' : undefined,
          },
        ],
      });
    }
    
    // Timestamp footer
    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `⏰ <!date^${Math.floor(Date.now() / 1000)}^{date_short_pretty} at {time}|${new Date().toLocaleString()}>`,
        },
      ],
    });
    
    // Send message with retry logic
    const { result: response, attempts } = await withRetry(
      () => client.chat.postMessage({
        channel: channel,
        blocks: blocks,
        text: `${typeInfo.label}: ${payload.title}`, // Fallback text for notifications
        thread_ts: options.threadTs,
        username: options.username,
        icon_emoji: options.iconEmoji,
        attachments: [
          {
            color: priorityColor,
            blocks: [], // Color bar on the left
          },
        ],
      }),
      3,
      1000
    );
    
    const duration = Date.now() - startTime;
    console.log(`[Slack] Notification sent successfully in ${duration}ms (${attempts} attempt${attempts > 1 ? 's' : ''})`);
    
    return {
      success: true,
      messageTs: response.ts,
      channel: response.channel,
      retryCount: attempts > 1 ? attempts - 1 : 0,
    };
    
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[Slack] Failed to send notification after ${duration}ms:`, error.message);
    
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
    };
  }
}

// ============================================================================
// Thread Reply Function
// ============================================================================

/**
 * Send a threaded reply to an existing Slack message
 * 
 * Useful for follow-up notifications or status updates on the same topic.
 * 
 * @param channel - Channel ID or name where the original message was sent
 * @param threadTs - Timestamp of the parent message (from original notification response)
 * @param message - Reply message (supports Markdown formatting)
 * @param options - Additional options
 * @returns Response with success status
 * 
 * @example
 * ```typescript
 * // Send initial notification
 * const initial = await sendSlackNotification('#pm-team', 'task_completed', payload);
 * 
 * // Send follow-up in thread
 * if (initial.success && initial.messageTs) {
 *   await sendSlackThread(
 *     '#pm-team',
 *     initial.messageTs,
 *     '✅ All stories have been reviewed and approved!'
 *   );
 * }
 * ```
 */
export async function sendSlackThread(
  channel: string,
  threadTs: string,
  message: string,
  options: Pick<SlackNotificationOptions, 'mentionUsers' | 'username' | 'iconEmoji'> = {}
): Promise<SlackNotificationResponse> {
  try {
    const client = getSlackClient();
    
    // Add user mentions if provided
    let fullMessage = message;
    if (options.mentionUsers && options.mentionUsers.length > 0) {
      const mentions = options.mentionUsers.map(userId => `<@${userId}>`).join(' ');
      fullMessage = `${mentions} ${message}`;
    }
    
    // Send reply with retry logic
    const { result: response, attempts } = await withRetry(
      () => client.chat.postMessage({
        channel: channel,
        text: fullMessage,
        thread_ts: threadTs,
        username: options.username,
        icon_emoji: options.iconEmoji,
      }),
      3,
      1000
    );
    
    console.log(`[Slack] Thread reply sent successfully (${attempts} attempt${attempts > 1 ? 's' : ''})`);
    
    return {
      success: true,
      messageTs: response.ts,
      channel: response.channel,
      retryCount: attempts > 1 ? attempts - 1 : 0,
    };
    
  } catch (error: any) {
    console.error('[Slack] Failed to send thread reply:', error.message);
    
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
    };
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format a Jira issue key as a clickable Slack link
 * 
 * Requires JIRA_DOMAIN environment variable to be set.
 * 
 * @param issueKey - Jira issue key (e.g., 'PROJ-123')
 * @returns Slack-formatted link
 * 
 * @example
 * ```typescript
 * const link = formatJiraLink('PROJ-123');
 * // Returns: '<https://jira.company.com/browse/PROJ-123|PROJ-123>'
 * 
 * // Use in message:
 * await sendSlackThread(channel, threadTs, `Issue ${link} has been updated`);
 * ```
 */
export function formatJiraLink(issueKey: string): string {
  const jiraDomain = process.env.JIRA_DOMAIN || process.env.CONFLUENCE_DOMAIN;
  
  if (!jiraDomain) {
    console.warn('[Slack] JIRA_DOMAIN not configured, returning plain issue key');
    return issueKey;
  }
  
  // Slack link format: <url|text>
  const url = `https://${jiraDomain}/browse/${issueKey}`;
  return `<${url}|${issueKey}>`;
}

/**
 * Format a Confluence page as a clickable Slack link
 * 
 * @param pageId - Confluence page ID
 * @param title - Display title for the link
 * @returns Slack-formatted link
 */
export function formatConfluenceLink(pageId: string, title?: string): string {
  const confluenceDomain = process.env.CONFLUENCE_DOMAIN;
  
  if (!confluenceDomain) {
    console.warn('[Slack] CONFLUENCE_DOMAIN not configured, returning plain page ID');
    return title || pageId;
  }
  
  const url = `https://${confluenceDomain}/wiki/spaces/viewpage.action?pageId=${pageId}`;
  return `<${url}|${title || `Page ${pageId}`}>`;
}

/**
 * Format a URL as a clickable Slack link
 * 
 * @param url - URL to link to
 * @param text - Display text for the link
 * @returns Slack-formatted link
 */
export function formatSlackLink(url: string, text?: string): string {
  return `<${url}|${text || url}>`;
}

/**
 * Mention a user in Slack message
 * 
 * @param userId - Slack user ID
 * @returns Slack mention format
 */
export function mentionUser(userId: string): string {
  return `<@${userId}>`;
}

/**
 * Mention a channel in Slack message
 * 
 * @param channelId - Slack channel ID
 * @returns Slack channel mention format
 */
export function mentionChannel(channelId: string): string {
  return `<#${channelId}>`;
}

/**
 * Mention @here (active users in channel)
 * 
 * @returns Slack @here mention
 */
export function mentionHere(): string {
  return '<!here>';
}

/**
 * Mention @channel (all users in channel)
 * 
 * @returns Slack @channel mention
 */
export function mentionEveryone(): string {
  return '<!channel>';
}

// ============================================================================
// Testing Function
// ============================================================================

/**
 * Send a test notification to verify Slack integration
 * 
 * Sends a sample notification to the configured default channel or a specified test channel.
 * Useful for testing bot permissions, channel access, and message formatting.
 * 
 * @param testChannel - Optional channel to send test to (defaults to SLACK_DEFAULT_CHANNEL)
 * @returns Response with success status
 * 
 * @example
 * ```typescript
 * // Test with default channel
 * const result = await sendTestNotification();
 * 
 * // Test with specific channel
 * const result = await sendTestNotification('#test-channel');
 * ```
 */
export async function sendTestNotification(testChannel?: string): Promise<SlackNotificationResponse> {
  const channel = testChannel || slackConfig.defaultChannel || '#general';
  
  console.log(`[Slack] Sending test notification to ${channel}...`);
  
  const testPayload: SlackNotificationPayload = {
    title: 'Test Notification',
    description: 'This is a test notification from the PM Workflow Automation system. If you see this, the Slack integration is working correctly!',
    metadata: {
      'Test Time': new Date().toLocaleString(),
      'System': 'HackUTD PM Automation',
      'Status': 'Operational',
      'Environment': process.env.NODE_ENV || 'development',
    },
    priority: 'low',
  };
  
  const result = await sendSlackNotification(
    channel,
    'task_completed',
    testPayload
  );
  
  if (result.success) {
    console.log(`[Slack] ✅ Test notification sent successfully! Message TS: ${result.messageTs}`);
  } else {
    console.error(`[Slack] ❌ Test notification failed: ${result.error}`);
  }
  
  return result;
}

/**
 * Send a batch of notifications with rate limiting
 * 
 * Sends multiple notifications with a delay between each to avoid rate limits.
 * 
 * @param notifications - Array of notification configurations
 * @param delayMs - Delay between notifications in milliseconds (default: 1000)
 * @returns Array of responses
 */
export async function sendBatchNotifications(
  notifications: Array<{
    channel: string;
    type: NotificationType;
    payload: SlackNotificationPayload;
    options?: SlackNotificationOptions;
  }>,
  delayMs: number = 1000
): Promise<SlackNotificationResponse[]> {
  const results: SlackNotificationResponse[] = [];
  
  console.log(`[Slack] Sending ${notifications.length} notifications with ${delayMs}ms delay...`);
  
  for (let i = 0; i < notifications.length; i++) {
    const { channel, type, payload, options } = notifications[i];
    
    const result = await sendSlackNotification(channel, type, payload, options);
    results.push(result);
    
    // Add delay between notifications (except for the last one)
    if (i < notifications.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  const successful = results.filter(r => r.success).length;
  console.log(`[Slack] Batch complete: ${successful}/${notifications.length} sent successfully`);
  
  return results;
}

// ============================================================================
// Export All
// ============================================================================

export default {
  sendSlackNotification,
  sendSlackThread,
  formatJiraLink,
  formatConfluenceLink,
  formatSlackLink,
  mentionUser,
  mentionChannel,
  mentionHere,
  mentionEveryone,
  sendTestNotification,
  sendBatchNotifications,
};
