/**
 * Send Email API Route
 * 
 * Sends an email using the Resend service.
 * 
 * @route POST /api/integrations/email
 * 
 * @example Request body:
 * {
 *   "to": "user@example.com",
 *   "subject": "Welcome",
 *   "body": "<h1>Hello!</h1>"
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, sendNotificationEmail } from '@/lib/integrations';
import type { EmailPayload } from '@/lib/integrations';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if this is a notification email (has priority field)
    if ('priority' in body) {
      const result = await sendNotificationEmail({
        to: body.to,
        title: body.title || body.subject,
        message: body.message || body.body,
        priority: body.priority,
        metadata: body.metadata,
      });

      return NextResponse.json(result, {
        status: result.success ? 200 : 400,
      });
    }

    // Standard email
    const payload: EmailPayload = {
      to: body.to,
      subject: body.subject,
      body: body.body,
      from: body.from,
      replyTo: body.replyTo,
      cc: body.cc,
      bcc: body.bcc,
      attachments: body.attachments,
    };

    const result = await sendEmail(payload);

    return NextResponse.json(result, {
      status: result.success ? 200 : 400,
    });
  } catch (error) {
    console.error('Email API error:', error);

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
