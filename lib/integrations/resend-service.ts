/**
 * Resend Email Service
 * 
 * This module provides email automation capabilities using the Resend API.
 * Handles transactional emails, notifications, and bulk sending with proper
 * error handling and validation.
 * 
 * @module lib/integrations/resend-service
 */

import { Resend } from 'resend';
import { resendConfig, validateResendConfig } from './config';
import {
  EmailServiceError,
  ConfigurationError,
  ValidationError,
  createErrorResponse,
  withRetry,
} from './errors';
import type {
  BaseResponse,
  EmailPayload,
  ResendEmailResponse,
} from './types';

/**
 * Initialize Resend client with configuration validation
 * @returns Configured Resend client instance
 * @throws {ConfigurationError} If configuration is invalid
 */
function initializeResendClient(): Resend {
  const validation = validateResendConfig();

  if (!validation.valid) {
    throw new ConfigurationError(
      `Resend configuration is invalid: ${validation.errors.join(', ')}`,
      { missingKeys: validation.missing }
    );
  }

  return new Resend(resendConfig.apiKey);
}

/**
 * Validate email payload before sending
 * @param payload - Email payload to validate
 * @throws {ValidationError} If payload is invalid
 */
function validateEmailPayload(payload: EmailPayload): void {
  if (!payload.to || (Array.isArray(payload.to) && payload.to.length === 0)) {
    throw new ValidationError('Email recipient (to) is required', {
      field: 'to',
    });
  }

  if (!payload.subject || payload.subject.trim() === '') {
    throw new ValidationError('Email subject is required', {
      field: 'subject',
    });
  }

  if (!payload.body || payload.body.trim() === '') {
    throw new ValidationError('Email body is required', { field: 'body' });
  }

  // Validate email format
  const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
  for (const email of recipients) {
    if (!isValidEmail(email)) {
      throw new ValidationError(`Invalid email address: ${email}`, {
        field: 'to',
        value: email,
      });
    }
  }
}

/**
 * Send a single email using Resend
 * 
 * @param payload - Email payload with recipient, subject, body, and optional attachments
 * @returns Response with email ID on success
 * 
 * @example
 * const result = await sendEmail({
 *   to: 'user@example.com',
 *   subject: 'Welcome to PM Automation',
 *   body: '<h1>Welcome!</h1><p>Get started with our platform.</p>',
 * });
 * 
 * if (result.success) {
 *   console.log('Email sent:', result.data.id);
 * }
 */
export async function sendEmail(
  payload: EmailPayload
): Promise<BaseResponse<ResendEmailResponse>> {
  try {
    // Validate payload
    validateEmailPayload(payload);

    // Initialize client
    const resend = initializeResendClient();

    // Send email with retry logic
    const response = await withRetry(
      async () => {
        return await resend.emails.send({
          from: payload.from || resendConfig.fromEmail,
          to: payload.to,
          subject: payload.subject,
          html: payload.body,
          replyTo: payload.replyTo,
          cc: payload.cc,
          bcc: payload.bcc,
          attachments: payload.attachments,
        });
      },
      {
        maxAttempts: 3,
        onRetry: (attempt, error) => {
          console.warn(
            `Email send attempt ${attempt} failed, retrying...`,
            error.message
          );
        },
      }
    );

    if (!response.data) {
      throw new EmailServiceError('No response data from Resend API');
    }

    return {
      success: true,
      data: {
        id: response.data.id,
      },
    };
  } catch (error) {
    console.error('Failed to send email:', error);

    if (
      error instanceof ValidationError ||
      error instanceof ConfigurationError ||
      error instanceof EmailServiceError
    ) {
      return createErrorResponse(error);
    }

    return createErrorResponse(
      new EmailServiceError('Failed to send email', {
        cause: error instanceof Error ? error : undefined,
        recipient: payload.to,
      })
    );
  }
}

/**
 * Send bulk emails (multiple recipients with same content)
 * 
 * @param recipients - Array of recipient email addresses
 * @param subject - Email subject
 * @param body - Email body (HTML)
 * @param options - Additional email options
 * @returns Response with array of email IDs
 * 
 * @example
 * const result = await sendBulkEmail(
 *   ['user1@example.com', 'user2@example.com'],
 *   'Product Update',
 *   '<p>Check out our latest features!</p>'
 * );
 */
export async function sendBulkEmail(
  recipients: string[],
  subject: string,
  body: string,
  options?: {
    from?: string;
    replyTo?: string;
    attachments?: EmailPayload['attachments'];
  }
): Promise<BaseResponse<ResendEmailResponse[]>> {
  try {
    if (!recipients || recipients.length === 0) {
      throw new ValidationError('At least one recipient is required');
    }

    // Send emails in parallel (be mindful of rate limits)
    const promises = recipients.map((to) =>
      sendEmail({
        to,
        subject,
        body,
        from: options?.from,
        replyTo: options?.replyTo,
        attachments: options?.attachments,
      })
    );

    const results = await Promise.allSettled(promises);

    // Collect successful sends
    const successful: ResendEmailResponse[] = [];
    const failed: string[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.success) {
        successful.push(result.value.data!);
      } else {
        failed.push(recipients[index]);
      }
    });

    if (failed.length > 0) {
      console.warn(`Failed to send to ${failed.length} recipients:`, failed);
    }

    return {
      success: successful.length > 0,
      data: successful,
      error:
        failed.length > 0
          ? {
              message: `Failed to send to ${failed.length} recipients`,
              details: { failed },
            }
          : undefined,
    };
  } catch (error) {
    console.error('Failed to send bulk emails:', error);
    return createErrorResponse(
      new EmailServiceError('Failed to send bulk emails', {
        cause: error instanceof Error ? error : undefined,
      })
    );
  }
}

/**
 * Send a notification email to administrators or stakeholders
 * 
 * @param options - Notification options
 * @returns Response with email ID
 * 
 * @example
 * await sendNotificationEmail({
 *   to: 'admin@example.com',
 *   title: 'System Alert',
 *   message: 'A critical workflow has been triggered',
 *   priority: 'high',
 * });
 */
export async function sendNotificationEmail(options: {
  to: string | string[];
  title: string;
  message: string;
  priority?: 'low' | 'normal' | 'high';
  metadata?: Record<string, unknown>;
}): Promise<BaseResponse<ResendEmailResponse>> {
  const priorityEmoji = {
    low: 'ℹ️',
    normal: '📢',
    high: '🚨',
  };

  const emoji = priorityEmoji[options.priority || 'normal'];

  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f4f4f4; padding: 20px; border-radius: 5px; }
          .content { padding: 20px 0; }
          .footer { font-size: 12px; color: #666; margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px; }
          .metadata { background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-top: 15px; }
          .priority-high { border-left: 4px solid #dc3545; }
          .priority-normal { border-left: 4px solid #007bff; }
          .priority-low { border-left: 4px solid #6c757d; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header priority-${options.priority || 'normal'}">
            <h2>${emoji} ${options.title}</h2>
          </div>
          <div class="content">
            <p>${options.message}</p>
            ${
              options.metadata
                ? `
              <div class="metadata">
                <h4>Additional Information:</h4>
                <pre>${JSON.stringify(options.metadata, null, 2)}</pre>
              </div>
            `
                : ''
            }
          </div>
          <div class="footer">
            <p>This is an automated notification from PM Automation.</p>
            <p>Sent at: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: options.to,
    subject: `${emoji} ${options.title}`,
    body: htmlBody,
  });
}

/**
 * Simple email validation
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if Resend service is configured and available
 * @returns Service status
 */
export function checkResendStatus() {
  const validation = validateResendConfig();

  return {
    service: 'resend' as const,
    configured: validation.valid,
    available: validation.valid,
    message: validation.valid
      ? 'Resend is properly configured'
      : `Configuration issues: ${validation.errors.join(', ')}`,
    lastChecked: new Date(),
  };
}
