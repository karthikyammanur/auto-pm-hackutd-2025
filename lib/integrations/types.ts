/**
 * Integration Types for Product Manager Automation
 * 
 * This module defines TypeScript interfaces for all external integrations
 * including Resend (email), Slack (notifications), and Confluence (documentation).
 */

/**
 * Generic base response structure for all API integrations
 * @template T - The type of data returned on success
 */
export interface BaseResponse<T = unknown> {
  /** Indicates whether the operation was successful */
  success: boolean;
  /** The data returned from the API (present on success) */
  data?: T;
  /** Error information (present on failure) */
  error?: {
    /** Error message */
    message: string;
    /** Error code for programmatic handling */
    code?: string;
    /** Additional error details */
    details?: unknown;
  };
}

/**
 * Email payload for Resend API
 * Used to send transactional emails and notifications
 */
export interface EmailPayload {
  /** Recipient email address or array of addresses */
  to: string | string[];
  /** Email subject line */
  subject: string;
  /** Email body content (supports HTML) */
  body: string;
  /** Optional file attachments */
  attachments?: Array<{
    /** Filename to display */
    filename: string;
    /** File content (base64 encoded or Buffer) */
    content: string | Buffer;
    /** MIME type of the attachment */
    contentType?: string;
  }>;
  /** Optional sender email (defaults to configured from address) */
  from?: string;
  /** Optional reply-to address */
  replyTo?: string;
  /** Optional CC recipients */
  cc?: string | string[];
  /** Optional BCC recipients */
  bcc?: string | string[];
}

/**
 * Slack notification payload for Web API
 * Used to send messages and notifications to Slack channels
 */
export interface SlackNotificationPayload {
  /** Slack channel ID or name (e.g., #general or C1234567890) */
  channel: string;
  /** Plain text message content */
  message: string;
  /** Optional Block Kit blocks for rich formatting */
  blocks?: Array<{
    type: string;
    [key: string]: unknown;
  }>;
  /** Optional thread timestamp to reply to an existing message */
  thread_ts?: string;
  /** Optional username override for the bot */
  username?: string;
  /** Optional icon emoji override (e.g., :rocket:) */
  icon_emoji?: string;
  /** Optional icon URL override */
  icon_url?: string;
  /** Optional attachments (legacy formatting) */
  attachments?: Array<{
    color?: string;
    text?: string;
    [key: string]: unknown;
  }>;
}

/**
 * Confluence page payload for Atlassian REST API
 * Used to create or update documentation pages
 */
export interface ConfluencePagePayload {
  /** Confluence space key where the page will be created */
  spaceKey: string;
  /** Page title */
  title: string;
  /** Page content in Confluence storage format (XHTML) */
  content: string;
  /** Optional parent page ID to nest the page under */
  parentId?: string;
  /** Optional page type (default: 'page') */
  type?: 'page' | 'blogpost';
  /** Optional status (default: 'current') */
  status?: 'current' | 'draft';
  /** Optional labels to apply to the page */
  labels?: Array<{
    name: string;
  }>;
}

/**
 * Resend API response types
 */
export interface ResendEmailResponse {
  /** Unique identifier for the sent email */
  id: string;
}

/**
 * Slack API response types
 */
export interface SlackMessageResponse {
  /** Whether the message was successfully sent */
  ok: boolean;
  /** Channel ID where the message was posted */
  channel?: string;
  /** Timestamp of the message (used for threading) */
  ts?: string;
  /** Error message if ok is false */
  error?: string;
}

/**
 * Confluence API response types
 */
export interface ConfluencePageResponse {
  /** Unique page ID */
  id: string;
  /** Page type */
  type: string;
  /** Page status */
  status: string;
  /** Page title */
  title: string;
  /** URL links to the page */
  _links: {
    /** Web UI link */
    webui: string;
    /** API link */
    self: string;
  };
}

/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
  /** Whether all required configuration is present */
  valid: boolean;
  /** Missing configuration keys */
  missing: string[];
  /** Configuration errors or warnings */
  errors: string[];
}

/**
 * Integration service status
 */
export interface ServiceStatus {
  /** Service name */
  service: 'resend' | 'slack' | 'confluence';
  /** Whether the service is properly configured */
  configured: boolean;
  /** Whether the service is currently available */
  available: boolean;
  /** Optional status message */
  message?: string;
  /** Last health check timestamp */
  lastChecked?: Date;
}
