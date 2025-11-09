/**
 * Slack Notifier Agent API Route
 * 
 * Endpoint for triggering Slack notification workflows
 */

import { NextRequest, NextResponse } from 'next/server';
import { SlackNotifierAgent } from './tools';

const slackAgent = new SlackNotifierAgent({
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
      threadContext: body.threadContext,
    };

    const state = await slackAgent.processEvent(event);
    
    if (state.shouldNotify) {
      const result = await slackAgent.sendNotification(state);
      
      return NextResponse.json({
        success: true,
        notificationSent: !!result.lastNotificationTs,
        messageTs: result.lastNotificationTs,
        channel: state.channel,
        notificationType: state.notificationType,
      });
    }
    
    return NextResponse.json({
      success: true,
      notificationSent: false,
      message: 'No notification triggered for this event',
    });
  } catch (error: any) {
    console.error('[Slack Agent API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    agent: 'slack',
    status: 'operational',
    description: 'Slack notification agent for PM workflows',
  });
}
