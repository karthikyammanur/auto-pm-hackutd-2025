/**
 * Send Product Email API Route
 * 
 * HTTP endpoint for sending Product Manager emails.
 * Supports all email types: stakeholder updates, sprint summaries, feature launches, and GTM announcements.
 * 
 * @route POST /api/email/send
 * 
 * @example Request body:
 * {
 *   "recipientEmail": "manager@company.com",
 *   "emailType": "stakeholder_update",
 *   "data": {
 *     "stakeholderName": "John Doe",
 *     "updateTitle": "Q4 Progress Update",
 *     "highlights": ["Feature A completed", "Testing started"],
 *     "progressPercentage": 75,
 *     "projectName": "Project Phoenix"
 *   },
 *   "ccEmails": ["team@company.com"]
 * }
 * 
 * @example Response (success):
 * {
 *   "success": true,
 *   "messageId": "abc123xyz",
 *   "message": "Email sent successfully"
 * }
 * 
 * @example Response (error):
 * {
 *   "success": false,
 *   "error": "Invalid email address"
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  sendProductEmail,
  generateEmailPreview,
  validateEmailConfiguration,
} from '@/lib/integrations/email/email';
import type { EmailType } from '@/lib/integrations/email/types';

/**
 * POST - Send a product email
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.recipientEmail) {
      return NextResponse.json(
        {
          success: false,
          error: 'recipientEmail is required',
        },
        { status: 400 }
      );
    }

    if (!body.emailType) {
      return NextResponse.json(
        {
          success: false,
          error: 'emailType is required',
        },
        { status: 400 }
      );
    }

    if (!body.data) {
      return NextResponse.json(
        {
          success: false,
          error: 'data object is required',
        },
        { status: 400 }
      );
    }

    // Check if this is a preview request
    if (body.preview === true) {
      const preview = generateEmailPreview(body.emailType as EmailType, body.data);
      return NextResponse.json({
        success: true,
        preview: {
          subject: preview.subject,
          htmlBody: preview.htmlBody,
        },
      });
    }

    // Send email
    const result = await sendProductEmail(
      body.recipientEmail,
      body.emailType as EmailType,
      body.data,
      body.ccEmails,
      {
        fromEmail: body.fromEmail,
        fromName: body.fromName,
        replyTo: body.replyTo,
        tags: body.tags,
        headers: body.headers,
      }
    );

    // Return response
    if (result.success) {
      return NextResponse.json(
        {
          success: true,
          messageId: result.messageId,
          message: 'Email sent successfully',
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('[API] Email send error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Check email configuration status
 */
export async function GET() {
  try {
    const validation = validateEmailConfiguration();

    if (validation.valid) {
      return NextResponse.json({
        configured: true,
        message: 'Email service is properly configured',
      });
    } else {
      return NextResponse.json(
        {
          configured: false,
          errors: validation.errors,
        },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('[API] Email config check error:', error);

    return NextResponse.json(
      {
        configured: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
