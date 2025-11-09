/**
 * Email Automation Module - Main Exports
 * 
 * Centralized export point for the Product Manager email automation system.
 * Import from this file to access all email functionality.
 * 
 * @module lib/integrations/email
 * 
 * @example
 * // Import main functions
 * import { sendProductEmail, generateEmailPreview } from '@/lib/integrations/email';
 * 
 * // Send an email
 * await sendProductEmail(
 *   'manager@company.com',
 *   'stakeholder_update',
 *   { stakeholderName: 'John', updateTitle: 'Q4 Update', highlights: [...] }
 * );
 * 
 * // Generate preview
 * const preview = generateEmailPreview('sprint_summary', { sprintNumber: '42', ... });
 */

// Re-export types
export type {
  EmailType,
  EmailResponse,
  EmailPayload,
  EmailPreview,
  EmailValidationResult,
  SendEmailOptions,
  StakeholderUpdateData,
  SprintSummaryData,
  FeatureLaunchData,
  GTMAnnouncementData,
  EmailTemplate,
  RateLimitConfig,
} from './types';

// Re-export main email functions
export {
  sendProductEmail,
  generateEmailPreview,
  sendBulkProductEmail,
  getEmailTypeFromEvent,
  validateEmailConfiguration,
  sendTestEmail,
} from './email';

// Re-export templates
export {
  getTemplateByType,
  stakeholderUpdateTemplate,
  sprintSummaryTemplate,
  featureLaunchTemplate,
  gtmAnnouncementTemplate,
} from './templates';
