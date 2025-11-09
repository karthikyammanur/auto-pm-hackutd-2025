/**
 * Integration Configuration for Product Manager Automation
 * 
 * This module exports typed configuration objects for all external integrations.
 * Configuration values are loaded from environment variables with validation.
 * 
 * @module lib/integrations/config
 */

import type { ConfigValidationResult } from './types';

/**
 * Resend email service configuration
 */
export const resendConfig = {
  /** Resend API key for authentication */
  apiKey: process.env.RESEND_API_KEY || '',
  /** Default sender email address */
  fromEmail: process.env.RESEND_FROM_EMAIL || 'noreply@yourdomain.com',
  /** Default sender name */
  fromName: process.env.RESEND_FROM_NAME || 'PM Automation',
  /** API base URL */
  baseUrl: 'https://api.resend.com',
  /** Request timeout in milliseconds */
  timeout: 10000,
} as const;

/**
 * Slack Web API configuration
 */
export const slackConfig = {
  /** Slack bot token for authentication (starts with xoxb-) */
  botToken: process.env.SLACK_BOT_TOKEN || '',
  /** Default channel for notifications */
  defaultChannel: process.env.SLACK_DEFAULT_CHANNEL || '#general',
  /** Bot username display */
  botName: process.env.SLACK_BOT_NAME || 'PM Automation Bot',
  /** Bot icon emoji */
  botEmoji: process.env.SLACK_BOT_EMOJI || ':robot_face:',
  /** Request timeout in milliseconds */
  timeout: 10000,
  /** Retry configuration */
  retries: {
    maxAttempts: 3,
    factor: 2,
  },
} as const;

/**
 * Atlassian Confluence API configuration
 */
export const confluenceConfig = {
  /** Confluence domain (e.g., yourcompany.atlassian.net) */
  domain: process.env.CONFLUENCE_DOMAIN || '',
  /** Confluence user email for authentication */
  email: process.env.CONFLUENCE_EMAIL || '',
  /** Confluence API token */
  apiToken: process.env.CONFLUENCE_API_TOKEN || '',
  /** API version */
  apiVersion: 'latest',
  /** Request timeout in milliseconds */
  timeout: 15000,
  /** Default space key for pages */
  defaultSpaceKey: process.env.CONFLUENCE_DEFAULT_SPACE || '',
} as const;

/**
 * Get the full Confluence API base URL
 * @returns The complete base URL for Confluence REST API
 */
export function getConfluenceBaseUrl(): string {
  const domain = confluenceConfig.domain;
  if (!domain) {
    throw new Error('CONFLUENCE_DOMAIN environment variable is not set');
  }
  return `https://${domain}/wiki/rest/api`;
}

/**
 * Validate Resend configuration
 * @returns Validation result with any missing or invalid configuration
 */
export function validateResendConfig(): ConfigValidationResult {
  const missing: string[] = [];
  const errors: string[] = [];

  if (!resendConfig.apiKey) {
    missing.push('RESEND_API_KEY');
  }

  if (!resendConfig.fromEmail) {
    missing.push('RESEND_FROM_EMAIL');
  } else if (!isValidEmail(resendConfig.fromEmail)) {
    errors.push(`Invalid RESEND_FROM_EMAIL format: ${resendConfig.fromEmail}`);
  }

  return {
    valid: missing.length === 0 && errors.length === 0,
    missing,
    errors,
  };
}

/**
 * Validate Slack configuration
 * @returns Validation result with any missing or invalid configuration
 */
export function validateSlackConfig(): ConfigValidationResult {
  const missing: string[] = [];
  const errors: string[] = [];

  if (!slackConfig.botToken) {
    missing.push('SLACK_BOT_TOKEN');
  } else if (!slackConfig.botToken.startsWith('xoxb-')) {
    errors.push('SLACK_BOT_TOKEN must be a bot token (starts with xoxb-)');
  }

  return {
    valid: missing.length === 0 && errors.length === 0,
    missing,
    errors,
  };
}

/**
 * Validate Confluence configuration
 * @returns Validation result with any missing or invalid configuration
 */
export function validateConfluenceConfig(): ConfigValidationResult {
  const missing: string[] = [];
  const errors: string[] = [];

  if (!confluenceConfig.domain) {
    missing.push('CONFLUENCE_DOMAIN');
  }

  if (!confluenceConfig.email) {
    missing.push('CONFLUENCE_EMAIL');
  } else if (!isValidEmail(confluenceConfig.email)) {
    errors.push(`Invalid CONFLUENCE_EMAIL format: ${confluenceConfig.email}`);
  }

  if (!confluenceConfig.apiToken) {
    missing.push('CONFLUENCE_API_TOKEN');
  }

  return {
    valid: missing.length === 0 && errors.length === 0,
    missing,
    errors,
  };
}

/**
 * Validate all integration configurations
 * @returns Combined validation result for all services
 */
export function validateAllConfigs(): ConfigValidationResult {
  const resend = validateResendConfig();
  const slack = validateSlackConfig();
  const confluence = validateConfluenceConfig();

  return {
    valid: resend.valid && slack.valid && confluence.valid,
    missing: [...resend.missing, ...slack.missing, ...confluence.missing],
    errors: [...resend.errors, ...slack.errors, ...confluence.errors],
  };
}

/**
 * Check if a service is configured (has required environment variables)
 * @param service - The service to check
 * @returns True if the service is properly configured
 */
export function isServiceConfigured(
  service: 'resend' | 'slack' | 'confluence'
): boolean {
  switch (service) {
    case 'resend':
      return validateResendConfig().valid;
    case 'slack':
      return validateSlackConfig().valid;
    case 'confluence':
      return validateConfluenceConfig().valid;
    default:
      return false;
  }
}

/**
 * Get a summary of all service configuration statuses
 * @returns Object with configuration status for each service
 */
export function getConfigurationStatus(): {
  resend: boolean;
  slack: boolean;
  confluence: boolean;
  allConfigured: boolean;
} {
  const resend = isServiceConfigured('resend');
  const slack = isServiceConfigured('slack');
  const confluence = isServiceConfigured('confluence');

  return {
    resend,
    slack,
    confluence,
    allConfigured: resend && slack && confluence,
  };
}

/**
 * Simple email validation helper
 * @param email - Email address to validate
 * @returns True if email format is valid
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Get Basic Auth header for Confluence API
 * @returns Base64 encoded credentials for Authorization header
 */
export function getConfluenceAuthHeader(): string {
  const credentials = `${confluenceConfig.email}:${confluenceConfig.apiToken}`;
  return `Basic ${Buffer.from(credentials).toString('base64')}`;
}
