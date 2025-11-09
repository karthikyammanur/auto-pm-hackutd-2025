/**
 * Send Slack Message API Route
 * 
 * Sends a message to a Slack channel or user.
 * 
 * @route POST /api/integrations/slack
 * 
 * @example Basic message:
 * {
 *   "channel": "#general",
 *   "message": "Hello from the API!"
 * }
 * 
 * @example Formatted notification:
 * {
 *   "type": "formatted",
 *   "channel": "#alerts",
 *   "title": "Build Status",
 *   "message": "Build completed",
 *   "notificationType": "success",
 *   "fields": {
 *     "Branch": "main",
 *     "Duration": "2m 34s"
 *   }
 * }
 * 
 * @example Workflow notification:
 * {
 *   "type": "workflow",
 *   "channel": "#workflows",
 *   "workflowName": "Data Pipeline",
 *   "status": "completed",
 *   "duration": "5m 12s"
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  sendSlackMessage,
  sendFormattedNotification,
  sendWorkflowNotification,
} from '@/lib/integrations';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Workflow notification
    if (body.type === 'workflow') {
      const result = await sendWorkflowNotification({
        channel: body.channel,
        workflowName: body.workflowName,
        status: body.status,
        duration: body.duration,
        details: body.details,
        link: body.link,
      });

      return NextResponse.json(result, {
        status: result.success ? 200 : 400,
      });
    }

    // Formatted notification
    if (body.type === 'formatted') {
      const result = await sendFormattedNotification({
        channel: body.channel,
        title: body.title,
        message: body.message,
        type: body.notificationType,
        fields: body.fields,
        url: body.url,
        threadTs: body.threadTs,
      });

      return NextResponse.json(result, {
        status: result.success ? 200 : 400,
      });
    }

    // Basic message
    const result = await sendSlackMessage({
      channel: body.channel,
      message: body.message,
      blocks: body.blocks,
      thread_ts: body.thread_ts,
      username: body.username,
      icon_emoji: body.icon_emoji,
      icon_url: body.icon_url,
    });

    return NextResponse.json(result, {
      status: result.success ? 200 : 400,
    });
  } catch (error) {
    console.error('Slack API error:', error);

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
