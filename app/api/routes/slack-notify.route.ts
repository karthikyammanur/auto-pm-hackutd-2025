/**
 * Slack Notification API Endpoint
 * 
 * HTTP API for sending Slack notifications from workflows or external systems.
 * 
 * POST /api/slack/notify - Send a notification
 * POST /api/slack/thread - Send a threaded reply
 * POST /api/slack/test - Send a test notification
 * GET /api/slack/notify - Check Slack configuration status
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  sendSlackNotification,
  sendSlackThread,
  sendTestNotification,
  type NotificationType,
  type SlackNotificationPayload,
  type SlackNotificationOptions,
} from '@/lib/integrations/slack';
import { slackConfig } from '@/lib/integrations/config';

// ============================================================================
// POST - Send Notification
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    // Route to different actions
    switch (action) {
      case 'notify':
        return await handleNotify(params);
      
      case 'thread':
        return await handleThread(params);
      
      case 'test':
        return await handleTest(params);
      
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Use "notify", "thread", or "test"' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('[API] Slack notification error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle notify action - send a new notification
 */
async function handleNotify(params: {
  channel: string;
  notificationType: NotificationType;
  payload: SlackNotificationPayload;
  options?: SlackNotificationOptions;
}) {
  const { channel, notificationType, payload, options } = params;

  // Validate required fields
  if (!channel) {
    return NextResponse.json(
      { success: false, error: 'Missing required field: channel' },
      { status: 400 }
    );
  }

  if (!notificationType) {
    return NextResponse.json(
      { success: false, error: 'Missing required field: notificationType' },
      { status: 400 }
    );
  }

  if (!payload || !payload.title || !payload.description) {
    return NextResponse.json(
      { success: false, error: 'Missing required fields in payload: title, description' },
      { status: 400 }
    );
  }

  // Validate notification type
  const validTypes: NotificationType[] = ['task_completed', 'analysis_ready', 'approval_needed', 'error_alert'];
  if (!validTypes.includes(notificationType)) {
    return NextResponse.json(
      { success: false, error: `Invalid notificationType. Must be one of: ${validTypes.join(', ')}` },
      { status: 400 }
    );
  }

  // Send notification
  const result = await sendSlackNotification(
    channel,
    notificationType,
    payload,
    options
  );

  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}

/**
 * Handle thread action - send a threaded reply
 */
async function handleThread(params: {
  channel: string;
  threadTs: string;
  message: string;
  options?: Pick<SlackNotificationOptions, 'mentionUsers' | 'username' | 'iconEmoji'>;
}) {
  const { channel, threadTs, message, options } = params;

  // Validate required fields
  if (!channel || !threadTs || !message) {
    return NextResponse.json(
      { success: false, error: 'Missing required fields: channel, threadTs, message' },
      { status: 400 }
    );
  }

  // Send thread reply
  const result = await sendSlackThread(channel, threadTs, message, options);

  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}

/**
 * Handle test action - send a test notification
 */
async function handleTest(params: { channel?: string }) {
  const result = await sendTestNotification(params.channel);
  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}

// ============================================================================
// GET - Configuration Status
// ============================================================================

export async function GET() {
  try {
    const isConfigured = !!(slackConfig.botToken && slackConfig.defaultChannel);

    return NextResponse.json({
      success: true,
      configured: isConfigured,
      hasToken: !!slackConfig.botToken,
      defaultChannel: slackConfig.defaultChannel || null,
      status: isConfigured ? 'ready' : 'not_configured',
      message: isConfigured 
        ? 'Slack integration is configured and ready'
        : 'Slack integration requires SLACK_BOT_TOKEN and SLACK_DEFAULT_CHANNEL in .env.local',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
