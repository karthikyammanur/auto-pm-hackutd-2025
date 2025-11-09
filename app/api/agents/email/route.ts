/**
 * Email Agent API Route
 * 
 * Endpoint for triggering email agent workflows
 */

import { NextRequest, NextResponse } from 'next/server';
import { EmailAgent } from './tools';

const emailAgent = new EmailAgent({
  enableLogging: true,
  dryRun: false,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const event = {
      type: body.eventType || 'unknown',
      timestamp: new Date(),
      data: body.data || {},
      source: body.source,
      metadata: body.metadata,
    };

    const state = await emailAgent.processEvent(event);
    
    if (state.shouldSendEmail) {
      const result = await emailAgent.sendEmail(state);
      
      return NextResponse.json({
        success: true,
        emailSent: result.shouldSendEmail && !result.errors,
        emailType: result.emailType,
        recipientEmail: result.recipientEmail,
      });
    }
    
    return NextResponse.json({
      success: true,
      emailSent: false,
      message: 'No email triggered for this event',
    });
  } catch (error: any) {
    console.error('[Email Agent API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    agent: 'email',
    status: 'operational',
    description: 'Email automation agent for PM workflows',
  });
}
