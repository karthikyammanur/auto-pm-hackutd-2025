/**
 * LangGraph Agent Integration for Slack Notifications
 * 
 * This module provides utilities to integrate Slack notifications into LangGraph workflows.
 * Automatically send notifications when agents complete tasks, encounter errors, or need approval.
 * 
 * @module lib/agents/slack-notifier-agent
 */

import {
  sendSlackNotification,
  sendSlackThread,
  type NotificationType,
  type SlackNotificationPayload,
  type Priority,
} from '@/lib/integrations/slack';
import { slackConfig } from '@/lib/integrations/config';

// ============================================================================
// Types
// ============================================================================

/**
 * Workflow event that can trigger a Slack notification
 */
export interface WorkflowEvent {
  /** Type of event */
  type: string;
  
  /** When the event occurred */
  timestamp: Date;
  
  /** Event payload data */
  data: Record<string, any>;
  
  /** Optional thread context from previous notification */
  threadContext?: {
    channel: string;
    messageTs: string;
  };
}

/**
 * Agent state for tracking notifications
 */
export interface SlackNotifierState {
  /** Whether a notification should be sent */
  shouldNotify: boolean;
  
  /** Channel to send notification to */
  channel?: string;
  
  /** Type of notification */
  notificationType?: NotificationType;
  
  /** Notification payload */
  payload?: SlackNotificationPayload;
  
  /** Users to mention */
  mentionUsers?: string[];
  
  /** Thread context if replying */
  threadContext?: {
    channel: string;
    messageTs: string;
  };
  
  /** Last notification result */
  lastNotificationTs?: string;
  
  /** Error if notification failed */
  error?: string;
}

/**
 * Configuration for Slack notifier agent
 */
export interface SlackNotifierConfig {
  /** Default channel for notifications */
  defaultChannel?: string;
  
  /** Default users to mention */
  defaultMentionUsers?: string[];
  
  /** Enable logging */
  enableLogging?: boolean;
  
  /** Dry run mode (preview without sending) */
  dryRun?: boolean;
  
  /** Event type to notification type mapping */
  eventTypeMapping?: Record<string, NotificationType>;
}

// ============================================================================
// Slack Notifier Agent
// ============================================================================

/**
 * Agent for sending Slack notifications based on workflow events
 */
export class SlackNotifierAgent {
  private config: Required<SlackNotifierConfig>;
  
  constructor(config: SlackNotifierConfig = {}) {
    this.config = {
      defaultChannel: config.defaultChannel || slackConfig.defaultChannel || '#pm-notifications',
      defaultMentionUsers: config.defaultMentionUsers || [],
      enableLogging: config.enableLogging ?? true,
      dryRun: config.dryRun ?? false,
      eventTypeMapping: config.eventTypeMapping || this.getDefaultEventMapping(),
    };
  }
  
  /**
   * Get default event type to notification type mapping
   */
  private getDefaultEventMapping(): Record<string, NotificationType> {
    return {
      // Task completion events
      'user_stories_created': 'task_completed',
      'wireframes_generated': 'task_completed',
      'documentation_created': 'task_completed',
      'sprint_plan_generated': 'task_completed',
      
      // Analysis events
      'competitor_analysis_complete': 'analysis_ready',
      'market_research_complete': 'analysis_ready',
      'user_feedback_analyzed': 'analysis_ready',
      'metrics_analyzed': 'analysis_ready',
      
      // Approval events
      'approval_required': 'approval_needed',
      'review_needed': 'approval_needed',
      'sign_off_required': 'approval_needed',
      
      // Error events
      'agent_error': 'error_alert',
      'workflow_failed': 'error_alert',
      'critical_issue': 'error_alert',
    };
  }
  
  /**
   * Process a workflow event and determine if notification should be sent
   * 
   * @param event - Workflow event
   * @returns Updated state
   */
  async processEvent(event: WorkflowEvent): Promise<SlackNotifierState> {
    if (this.config.enableLogging) {
      console.log(`[SlackNotifier] Processing event: ${event.type}`);
    }
    
    // Map event type to notification type
    const notificationType = this.config.eventTypeMapping[event.type];
    
    if (!notificationType) {
      if (this.config.enableLogging) {
        console.log(`[SlackNotifier] No notification mapping for event type: ${event.type}`);
      }
      return { shouldNotify: false };
    }
    
    // Build notification payload from event data
    const payload = this.buildPayloadFromEvent(event);
    
    // Determine channel
    const channel = event.data.channel || this.config.defaultChannel;
    
    // Determine users to mention
    const mentionUsers = event.data.mentionUsers || this.config.defaultMentionUsers;
    
    return {
      shouldNotify: true,
      channel,
      notificationType,
      payload,
      mentionUsers,
      threadContext: event.threadContext,
    };
  }
  
  /**
   * Build notification payload from event data
   */
  private buildPayloadFromEvent(event: WorkflowEvent): SlackNotificationPayload {
    return {
      title: event.data.title || this.formatEventType(event.type),
      description: event.data.description || 'Event occurred',
      metadata: event.data.metadata || {},
      actionUrl: event.data.actionUrl,
      priority: event.data.priority || this.inferPriority(event.type),
    };
  }
  
  /**
   * Format event type into a readable title
   */
  private formatEventType(eventType: string): string {
    return eventType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  /**
   * Infer priority from event type
   */
  private inferPriority(eventType: string): Priority {
    if (eventType.includes('error') || eventType.includes('critical') || eventType.includes('failed')) {
      return 'critical';
    }
    if (eventType.includes('approval') || eventType.includes('urgent')) {
      return 'high';
    }
    if (eventType.includes('complete') || eventType.includes('ready')) {
      return 'medium';
    }
    return 'low';
  }
  
  /**
   * Send notification based on state
   * 
   * @param state - Agent state
   * @returns Updated state with result
   */
  async sendNotification(state: SlackNotifierState): Promise<SlackNotifierState> {
    if (!state.shouldNotify || !state.channel || !state.notificationType || !state.payload) {
      return { ...state, error: 'Invalid state for sending notification' };
    }
    
    if (this.config.dryRun) {
      if (this.config.enableLogging) {
        console.log('[SlackNotifier] DRY RUN - Would send notification:');
        console.log(`  Channel: ${state.channel}`);
        console.log(`  Type: ${state.notificationType}`);
        console.log(`  Title: ${state.payload.title}`);
        console.log(`  Mentions: ${state.mentionUsers?.join(', ') || 'none'}`);
      }
      return {
        ...state,
        lastNotificationTs: 'dry-run-' + Date.now(),
      };
    }
    
    try {
      // Send as thread reply if context exists
      if (state.threadContext) {
        const threadMessage = `**${state.payload.title}**\n${state.payload.description}`;
        const result = await sendSlackThread(
          state.threadContext.channel,
          state.threadContext.messageTs,
          threadMessage,
          { mentionUsers: state.mentionUsers }
        );
        
        if (!result.success) {
          return { ...state, error: result.error };
        }
        
        return {
          ...state,
          lastNotificationTs: result.messageTs,
          error: undefined,
        };
      }
      
      // Send new notification
      const result = await sendSlackNotification(
        state.channel,
        state.notificationType,
        state.payload,
        { mentionUsers: state.mentionUsers }
      );
      
      if (!result.success) {
        return { ...state, error: result.error };
      }
      
      if (this.config.enableLogging) {
        console.log(`[SlackNotifier] Notification sent successfully. Message TS: ${result.messageTs}`);
      }
      
      return {
        ...state,
        lastNotificationTs: result.messageTs,
        threadContext: result.messageTs ? {
          channel: result.channel || state.channel,
          messageTs: result.messageTs,
        } : undefined,
        error: undefined,
      };
      
    } catch (error: any) {
      console.error('[SlackNotifier] Error sending notification:', error);
      return {
        ...state,
        error: error.message || 'Unknown error',
      };
    }
  }
}

// ============================================================================
// LangGraph Helper Functions
// ============================================================================

/**
 * Create a LangGraph node for Slack notifications
 * 
 * @param agent - Slack notifier agent instance
 * @returns Node function for LangGraph
 * 
 * @example
 * ```typescript
 * const notifierAgent = new SlackNotifierAgent();
 * const slackNode = createSlackNotifierNode(notifierAgent);
 * 
 * // Add to LangGraph
 * graph.addNode('notify_slack', slackNode);
 * ```
 */
export function createSlackNotifierNode(agent: SlackNotifierAgent) {
  return async (state: any) => {
    // Extract workflow event from state
    const event: WorkflowEvent = {
      type: state.eventType || 'unknown',
      timestamp: new Date(),
      data: state.eventData || {},
      threadContext: state.slackThreadContext,
    };
    
    // Process event
    const notifierState = await agent.processEvent(event);
    
    // Send notification if needed
    if (notifierState.shouldNotify) {
      const result = await agent.sendNotification(notifierState);
      
      return {
        ...state,
        slackNotificationSent: result.lastNotificationTs ? true : false,
        slackMessageTs: result.lastNotificationTs,
        slackThreadContext: result.threadContext,
        slackError: result.error,
      };
    }
    
    return {
      ...state,
      slackNotificationSent: false,
    };
  };
}

/**
 * Create a conditional routing function based on notification success
 * 
 * @returns Routing function
 * 
 * @example
 * ```typescript
 * const condition = createNotificationCondition();
 * graph.addConditionalEdges('notify_slack', condition, {
 *   'success': 'continue_workflow',
 *   'failed': 'handle_error'
 * });
 * ```
 */
export function createNotificationCondition() {
  return (state: any): string => {
    if (state.slackNotificationSent === true) {
      return 'success';
    }
    if (state.slackError) {
      return 'failed';
    }
    return 'skipped';
  };
}

/**
 * Create a default Slack notifier agent instance
 */
export const defaultSlackNotifier = new SlackNotifierAgent({
  enableLogging: true,
  dryRun: process.env.NODE_ENV === 'test',
});

// ============================================================================
// Export All
// ============================================================================

export default {
  SlackNotifierAgent,
  createSlackNotifierNode,
  createNotificationCondition,
  defaultSlackNotifier,
};
