/**
 * Integration Services Index
 * 
 * Central export point for all integration services.
 * Import from this file to access email, Slack, and Confluence functionality.
 * 
 * @module lib/integrations
 * 
 * @example
 * import { sendEmail, sendSlackMessage, createConfluencePage } from '@/lib/integrations';
 * 
 * // Send an email
 * await sendEmail({
 *   to: 'user@example.com',
 *   subject: 'Welcome',
 *   body: '<p>Hello!</p>',
 * });
 * 
 * // Send a Slack notification
 * await sendSlackMessage({
 *   channel: '#general',
 *   message: 'Deployment complete!',
 * });
 * 
 * // Create a Confluence page
 * await createConfluencePage({
 *   spaceKey: 'PROD',
 *   title: 'Documentation',
 *   content: '<h1>Content</h1>',
 * });
 */

// Re-export all types
export type {
  BaseResponse,
  EmailPayload,
  SlackNotificationPayload,
  ConfluencePagePayload,
  ResendEmailResponse,
  SlackMessageResponse,
  ConfluencePageResponse,
  ConfigValidationResult,
  ServiceStatus,
} from './types';

// Re-export configuration utilities
export {
  resendConfig,
  slackConfig,
  confluenceConfig,
  validateResendConfig,
  validateSlackConfig,
  validateConfluenceConfig,
  validateAllConfigs,
  isServiceConfigured,
  getConfigurationStatus,
} from './config';

// Re-export error classes and utilities
export {
  IntegrationError,
  ConfigurationError,
  EmailServiceError,
  SlackServiceError,
  ConfluenceServiceError,
  ValidationError,
  RateLimitError,
  NetworkError,
  isIntegrationError,
  getErrorMessage,
  getErrorCode,
  handleServiceError,
  createErrorResponse,
  withRetry,
  logError,
} from './errors';

// Re-export Resend (email) service
export {
  sendEmail,
  sendBulkEmail,
  sendNotificationEmail,
  checkResendStatus,
} from './resend-service';

// Re-export Slack service
export {
  sendSlackMessage,
  sendFormattedNotification,
  sendWorkflowNotification,
  sendDirectMessage,
  replyToThread,
  checkSlackStatus,
} from './slack-service';

// Re-export Confluence service
export {
  createConfluencePage,
  updateConfluencePage,
  getConfluencePage,
  searchConfluencePages,
  deleteConfluencePage,
  addLabelsToPage,
  createDocumentationPage,
  checkConfluenceStatus,
} from './confluence-service';

// Integration health check
import { checkResendStatus } from './resend-service';
import { checkSlackStatus } from './slack-service';
import { checkConfluenceStatus } from './confluence-service';
import type { ServiceStatus } from './types';

/**
 * Check the health and configuration status of all integration services
 * 
 * @returns Object with status for each service
 * 
 * @example
 * const health = await checkIntegrationHealth();
 * console.log('Email configured:', health.resend.configured);
 * console.log('Slack available:', health.slack.available);
 * console.log('All systems operational:', health.allOperational);
 */
export async function checkIntegrationHealth(): Promise<{
  resend: ServiceStatus;
  slack: ServiceStatus;
  confluence: ServiceStatus;
  allConfigured: boolean;
  allOperational: boolean;
}> {
  const [resend, slack, confluence] = await Promise.all([
    checkResendStatus(),
    checkSlackStatus(),
    checkConfluenceStatus(),
  ]);

  return {
    resend,
    slack,
    confluence,
    allConfigured: resend.configured && slack.configured && confluence.configured,
    allOperational: resend.available && slack.available && confluence.available,
  };
}

/**
 * Quick helper to send notifications across multiple channels
 * 
 * @param options - Notification options
 * @returns Results from all channels
 * 
 * @example
 * await notifyMultiChannel({
 *   title: 'Deployment Complete',
 *   message: 'Version 2.0 is now live',
 *   email: ['team@example.com'],
 *   slackChannel: '#deployments',
 * });
 */
export async function notifyMultiChannel(options: {
  title: string;
  message: string;
  email?: string[];
  slackChannel?: string;
  priority?: 'low' | 'normal' | 'high';
}) {
  const results = {
    email: null as any,
    slack: null as any,
  };

  // Send email if recipients provided
  if (options.email && options.email.length > 0) {
    const { sendNotificationEmail } = await import('./resend-service');
    results.email = await sendNotificationEmail({
      to: options.email,
      title: options.title,
      message: options.message,
      priority: options.priority,
    });
  }

  // Send Slack if channel provided
  if (options.slackChannel) {
    const { sendFormattedNotification } = await import('./slack-service');
    results.slack = await sendFormattedNotification({
      channel: options.slackChannel,
      title: options.title,
      message: options.message,
      type: options.priority === 'high' ? 'error' : options.priority === 'low' ? 'info' : 'success',
    });
  }

  return results;
}
