/**
 * Product Manager Email Automation Module
 * 
 * Robust email automation system using Resend for Product Manager workflows.
 * Supports stakeholder updates, sprint summaries, feature launches, and GTM announcements.
 * 
 * @module lib/integrations/email/email
 * 
 * @example
 * // Send a stakeholder update
 * const result = await sendProductEmail(
 *   'stakeholder@company.com',
 *   'stakeholder_update',
 *   {
 *     stakeholderName: 'John Doe',
 *     updateTitle: 'Q4 Progress Update',
 *     highlights: ['Feature A completed', 'Beta testing started'],
 *     progressPercentage: 75,
 *     projectName: 'Project Phoenix'
 *   }
 * );
 * 
 * @example
 * // Send a sprint summary
 * await sendProductEmail(
 *   'team@company.com',
 *   'sprint_summary',
 *   {
 *     sprintNumber: '23',
 *     startDate: '2025-01-01',
 *     endDate: '2025-01-14',
 *     storiesCompleted: 18,
 *     storiesPlanned: 20,
 *     accomplishments: ['Completed API integration', 'Fixed 12 bugs']
 *   },
 *   ['manager@company.com']
 * );
 */

import { Resend } from 'resend';
import { resendConfig } from '../config';
import {
  getTemplateByType,
  stakeholderUpdateTemplate,
  sprintSummaryTemplate,
  featureLaunchTemplate,
  gtmAnnouncementTemplate,
} from './templates';
import type {
  EmailType,
  EmailResponse,
  EmailPayload,
  EmailPreview,
  EmailValidationResult,
  SendEmailOptions,
} from './types';

/**
 * Rate limiting state (simple in-memory implementation)
 * In production, use Redis or similar distributed cache
 */
const rateLimitState = new Map<string, { count: number; resetAt: number }>();

/**
 * Rate limit configuration
 */
const RATE_LIMIT = {
  maxEmails: 100,
  windowMs: 60 * 60 * 1000, // 1 hour
};

/**
 * Initialize Resend client
 */
function getResendClient(): Resend {
  if (!resendConfig.apiKey) {
    throw new Error('RESEND_API_KEY is not configured');
  }
  return new Resend(resendConfig.apiKey);
}

/**
 * Validate email address format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate email payload
 */
function validateEmailPayload(payload: EmailPayload): EmailValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate recipient email
  if (!payload.recipientEmail) {
    errors.push('Recipient email is required');
  } else if (!isValidEmail(payload.recipientEmail)) {
    errors.push(`Invalid recipient email format: ${payload.recipientEmail}`);
  }

  // Validate email type
  const validTypes: EmailType[] = [
    'stakeholder_update',
    'sprint_summary',
    'feature_launch',
    'gtm_announcement',
  ];
  if (!validTypes.includes(payload.emailType)) {
    errors.push(`Invalid email type: ${payload.emailType}`);
  }

  // Validate data object
  if (!payload.data || typeof payload.data !== 'object') {
    errors.push('Data object is required and must be an object');
  }

  // Validate CC emails if provided
  if (payload.ccEmails) {
    if (!Array.isArray(payload.ccEmails)) {
      errors.push('ccEmails must be an array');
    } else {
      payload.ccEmails.forEach((email, index) => {
        if (!isValidEmail(email)) {
          errors.push(`Invalid CC email at index ${index}: ${email}`);
        }
      });
    }
  }

  // Warnings for missing optional data
  if (payload.emailType === 'stakeholder_update' && !payload.data.stakeholderName) {
    warnings.push('stakeholderName is recommended for stakeholder_update');
  }
  if (payload.emailType === 'sprint_summary' && !payload.data.sprintNumber) {
    warnings.push('sprintNumber is recommended for sprint_summary');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check rate limit for sender
 */
function checkRateLimit(sender: string): { allowed: boolean; resetAt?: number } {
  const now = Date.now();
  const key = `rate_limit:${sender}`;
  const state = rateLimitState.get(key);

  if (!state || now > state.resetAt) {
    // Reset or initialize
    rateLimitState.set(key, {
      count: 1,
      resetAt: now + RATE_LIMIT.windowMs,
    });
    return { allowed: true };
  }

  if (state.count >= RATE_LIMIT.maxEmails) {
    return {
      allowed: false,
      resetAt: state.resetAt,
    };
  }

  state.count++;
  return { allowed: true };
}

/**
 * Generate subject line from template
 */
function generateSubject(template: any, data: any): string {
  if (typeof template.subject === 'function') {
    return template.subject(data);
  }
  return template.subject;
}

/**
 * Send a Product Manager email
 * 
 * @param recipientEmail - Primary recipient email address
 * @param emailType - Type of email to send
 * @param data - Dynamic data for template rendering
 * @param ccEmails - Optional array of CC email addresses
 * @param options - Optional sending options
 * @returns Promise with email response
 * 
 * @example
 * // Basic usage
 * const result = await sendProductEmail(
 *   'manager@company.com',
 *   'feature_launch',
 *   {
 *     featureName: 'Dark Mode',
 *     launchDate: '2025-12-01',
 *     description: 'Users can now switch to dark mode',
 *     benefits: ['Better eye comfort', 'Modern UI', 'Energy savings']
 *   }
 * );
 * 
 * if (result.success) {
 *   console.log('Email sent:', result.messageId);
 * } else {
 *   console.error('Failed:', result.error);
 * }
 */
export async function sendProductEmail(
  recipientEmail: string,
  emailType: EmailType,
  data: Record<string, any>,
  ccEmails?: string[],
  options?: SendEmailOptions
): Promise<EmailResponse> {
  const startTime = Date.now();

  try {
    // Validate payload
    const validation = validateEmailPayload({
      recipientEmail,
      emailType,
      data,
      ccEmails,
    });

    if (!validation.valid) {
      console.error('[Email] Validation failed:', validation.errors);
      return {
        success: false,
        error: `Validation failed: ${validation.errors.join(', ')}`,
      };
    }

    // Log warnings if any
    if (validation.warnings && validation.warnings.length > 0) {
      console.warn('[Email] Validation warnings:', validation.warnings);
    }

    // Check rate limit
    const rateLimitCheck = checkRateLimit(recipientEmail);
    if (!rateLimitCheck.allowed) {
      const resetDate = new Date(rateLimitCheck.resetAt!);
      console.error('[Email] Rate limit exceeded for:', recipientEmail);
      return {
        success: false,
        error: `Rate limit exceeded. Try again after ${resetDate.toISOString()}`,
      };
    }

    // Get template
    const template = getTemplateByType(emailType);
    if (!template) {
      console.error('[Email] Template not found for type:', emailType);
      return {
        success: false,
        error: `Unknown email type: ${emailType}`,
      };
    }

    // Generate email content
    const subject = generateSubject(template, data);
    const htmlBody = template.generateBody(data);

    // Initialize Resend client
    const resend = getResendClient();

    // Prepare email payload
    const emailPayload: any = {
      from: options?.fromEmail || resendConfig.fromEmail,
      to: recipientEmail,
      subject,
      html: htmlBody,
    };

    // Add optional fields
    if (ccEmails && ccEmails.length > 0) {
      emailPayload.cc = ccEmails;
    }
    if (options?.replyTo) {
      emailPayload.replyTo = options.replyTo;
    }
    if (options?.tags && options.tags.length > 0) {
      emailPayload.tags = options.tags.map(tag => ({ name: tag }));
    }
    if (options?.headers) {
      emailPayload.headers = options.headers;
    }

    // Send email via Resend
    console.log(`[Email] Sending ${emailType} to ${recipientEmail}`);
    const response = await resend.emails.send(emailPayload);

    const duration = Date.now() - startTime;
    console.log(`[Email] Sent successfully in ${duration}ms. ID: ${response.data?.id}`);

    if (!response.data) {
      throw new Error('No response data from Resend API');
    }

    return {
      success: true,
      messageId: response.data.id,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Email] Failed after ${duration}ms:`, {
      emailType,
      recipient: recipientEmail,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    // Don't expose internal errors to caller
    const errorMessage = error instanceof Error
      ? error.message.includes('API')
        ? 'Email service error. Please try again later.'
        : error.message
      : 'Unknown error occurred while sending email';

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Generate email preview for testing
 * 
 * Returns the HTML body and subject line without sending the email.
 * Useful for testing templates and data formatting.
 * 
 * @param emailType - Type of email to preview
 * @param data - Data object for template
 * @returns Email preview with subject and HTML body
 * 
 * @example
 * const preview = generateEmailPreview('sprint_summary', {
 *   sprintNumber: '42',
 *   startDate: '2025-11-01',
 *   endDate: '2025-11-14',
 *   storiesCompleted: 20,
 *   storiesPlanned: 22,
 *   accomplishments: ['Feature A done', 'Bug fixes completed']
 * });
 * 
 * console.log('Subject:', preview.subject);
 * // Write HTML to file for visual inspection
 * fs.writeFileSync('preview.html', preview.htmlBody);
 */
export function generateEmailPreview(
  emailType: EmailType,
  data: Record<string, any>
): EmailPreview {
  const template = getTemplateByType(emailType);

  if (!template) {
    throw new Error(`Unknown email type: ${emailType}`);
  }

  const subject = generateSubject(template, data);
  const htmlBody = template.generateBody(data);

  return {
    subject,
    htmlBody,
  };
}

/**
 * Send bulk emails (same template, different recipients)
 * 
 * Sends the same email to multiple recipients with rate limiting.
 * Failed sends don't block successful ones.
 * 
 * @param recipients - Array of recipient email addresses
 * @param emailType - Type of email to send
 * @param data - Data object for template
 * @param options - Optional sending options
 * @returns Array of results for each recipient
 * 
 * @example
 * const results = await sendBulkProductEmail(
 *   ['user1@example.com', 'user2@example.com', 'user3@example.com'],
 *   'feature_launch',
 *   {
 *     featureName: 'API v2.0',
 *     launchDate: '2025-12-15',
 *     description: 'New REST API with better performance',
 *     benefits: ['50% faster', 'Better docs', 'New endpoints']
 *   }
 * );
 * 
 * results.forEach((result, i) => {
 *   if (result.success) {
 *     console.log(`Sent to recipient ${i + 1}`);
 *   }
 * });
 */
export async function sendBulkProductEmail(
  recipients: string[],
  emailType: EmailType,
  data: Record<string, any>,
  options?: SendEmailOptions
): Promise<EmailResponse[]> {
  console.log(`[Email] Sending bulk ${emailType} to ${recipients.length} recipients`);

  // Send to all recipients in parallel
  const promises = recipients.map(recipient =>
    sendProductEmail(recipient, emailType, data, undefined, options)
  );

  const results = await Promise.allSettled(promises);

  // Convert settled promises to responses
  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      console.error(`[Email] Bulk send failed for recipient ${index}:`, result.reason);
      return {
        success: false,
        error: result.reason instanceof Error ? result.reason.message : 'Unknown error',
      };
    }
  });
}

/**
 * Get email type from workflow event
 * 
 * Helper function to map LangGraph workflow events to email types.
 * 
 * @param eventType - Workflow event type
 * @returns Corresponding email type or null
 * 
 * @example
 * const emailType = getEmailTypeFromEvent('sprint_completed');
 * if (emailType) {
 *   await sendProductEmail(recipient, emailType, eventData);
 * }
 */
export function getEmailTypeFromEvent(eventType: string): EmailType | null {
  const mapping: Record<string, EmailType> = {
    stakeholder_update_triggered: 'stakeholder_update',
    sprint_completed: 'sprint_summary',
    sprint_summary_requested: 'sprint_summary',
    feature_launched: 'feature_launch',
    feature_ready_announcement: 'feature_launch',
    gtm_launch_initiated: 'gtm_announcement',
    product_launch_ready: 'gtm_announcement',
  };

  return mapping[eventType] || null;
}

/**
 * Validate email configuration
 * 
 * Checks if Resend is properly configured.
 * 
 * @returns Validation result
 */
export function validateEmailConfiguration(): EmailValidationResult {
  const errors: string[] = [];

  if (!resendConfig.apiKey) {
    errors.push('RESEND_API_KEY is not set');
  }

  if (!resendConfig.fromEmail) {
    errors.push('RESEND_FROM_EMAIL is not set');
  } else if (!isValidEmail(resendConfig.fromEmail)) {
    errors.push(`RESEND_FROM_EMAIL is invalid: ${resendConfig.fromEmail}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Test email configuration
 * 
 * Sends a test email to verify Resend is working.
 * 
 * @param testEmail - Email address to send test to
 * @returns Email response
 */
export async function sendTestEmail(testEmail: string): Promise<EmailResponse> {
  return sendProductEmail(
    testEmail,
    'stakeholder_update',
    {
      stakeholderName: 'Test User',
      updateTitle: 'Test Email Configuration',
      highlights: [
        'This is a test email',
        'Resend integration is working',
        'Email templates are rendering correctly',
      ],
      progressPercentage: 100,
      projectName: 'Email System Test',
      updateDate: new Date().toLocaleDateString(),
    }
  );
}

// Export all templates for direct access if needed
export {
  stakeholderUpdateTemplate,
  sprintSummaryTemplate,
  featureLaunchTemplate,
  gtmAnnouncementTemplate,
};
