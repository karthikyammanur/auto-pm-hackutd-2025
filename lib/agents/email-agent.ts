/**
 * Email Agent for LangGraph Workflows
 * 
 * LangGraph agent integration that listens to workflow events and triggers
 * automated Product Manager emails. This agent can be integrated into
 * LangGraph state machines for event-driven email automation.
 * 
 * @module lib/agents/email-agent
 * 
 * @example
 * // In your LangGraph workflow
 * import { EmailAgent, createEmailNode } from '@/lib/agents/email-agent';
 * 
 * const emailAgent = new EmailAgent();
 * const emailNode = createEmailNode(emailAgent);
 * 
 * // Add to your graph
 * graph.addNode('send_email', emailNode);
 * graph.addEdge('sprint_completed', 'send_email');
 */

import {
  sendProductEmail,
  getEmailTypeFromEvent,
  generateEmailPreview,
} from '@/lib/integrations/email/email';
import type { EmailType, EmailResponse } from '@/lib/integrations/email/types';

/**
 * Workflow event that can trigger an email
 */
export interface WorkflowEvent {
  /** Event type identifier */
  type: string;
  /** Event timestamp */
  timestamp: Date;
  /** Event payload data */
  data: Record<string, any>;
  /** Event source/origin */
  source?: string;
  /** Event metadata */
  metadata?: Record<string, any>;
}

/**
 * Email sending state for LangGraph
 */
export interface EmailAgentState {
  /** Whether email should be sent */
  shouldSendEmail: boolean;
  /** Email type to send */
  emailType?: EmailType;
  /** Recipient email address */
  recipientEmail?: string;
  /** Email data payload */
  emailData?: Record<string, any>;
  /** CC recipients */
  ccEmails?: string[];
  /** Email sending result */
  emailResult?: EmailResponse;
  /** Processing errors */
  errors?: string[];
}

/**
 * Email agent configuration
 */
export interface EmailAgentConfig {
  /** Default sender email */
  defaultSender?: string;
  /** Enable dry run mode (preview only) */
  dryRun?: boolean;
  /** Event type to email type mapping */
  eventMapping?: Record<string, EmailType>;
  /** Default CC recipients for all emails */
  defaultCcEmails?: string[];
  /** Enable logging */
  enableLogging?: boolean;
}

/**
 * Email Agent for LangGraph workflows
 * 
 * Processes workflow events and sends appropriate Product Manager emails.
 */
export class EmailAgent {
  private config: EmailAgentConfig;
  private sentEmails: Map<string, EmailResponse>;

  constructor(config: EmailAgentConfig = {}) {
    this.config = {
      dryRun: false,
      enableLogging: true,
      ...config,
    };
    this.sentEmails = new Map();
  }

  /**
   * Process a workflow event and determine if email should be sent
   * 
   * @param event - Workflow event to process
   * @returns Agent state with email decision
   */
  async processEvent(event: WorkflowEvent): Promise<EmailAgentState> {
    const state: EmailAgentState = {
      shouldSendEmail: false,
      errors: [],
    };

    try {
      this.log(`Processing event: ${event.type}`);

      // Get email type from event
      const emailType = this.getEmailType(event.type);
      if (!emailType) {
        this.log(`No email mapping for event type: ${event.type}`);
        return state;
      }

      // Extract recipient from event data
      const recipientEmail = this.extractRecipient(event);
      if (!recipientEmail) {
        state.errors?.push('No recipient email found in event data');
        return state;
      }

      // Prepare email data
      const emailData = this.prepareEmailData(event, emailType);

      // Update state
      state.shouldSendEmail = true;
      state.emailType = emailType;
      state.recipientEmail = recipientEmail;
      state.emailData = emailData;
      state.ccEmails = this.extractCcEmails(event);

      this.log(`Email prepared: ${emailType} to ${recipientEmail}`);

      return state;
    } catch (error) {
      this.log(`Error processing event: ${error}`);
      state.errors?.push(error instanceof Error ? error.message : 'Unknown error');
      return state;
    }
  }

  /**
   * Send email based on agent state
   * 
   * @param state - Email agent state
   * @returns Updated state with email result
   */
  async sendEmail(state: EmailAgentState): Promise<EmailAgentState> {
    if (!state.shouldSendEmail) {
      this.log('Email sending skipped (shouldSendEmail = false)');
      return state;
    }

    if (!state.emailType || !state.recipientEmail || !state.emailData) {
      state.errors?.push('Missing required email fields');
      return state;
    }

    try {
      // Dry run mode - generate preview only
      if (this.config.dryRun) {
        this.log('[DRY RUN] Generating email preview');
        const preview = generateEmailPreview(state.emailType, state.emailData);
        
        state.emailResult = {
          success: true,
          messageId: `preview-${Date.now()}`,
        };

        this.log(`[DRY RUN] Preview generated: ${preview.subject}`);
        return state;
      }

      // Send actual email
      this.log(`Sending ${state.emailType} email to ${state.recipientEmail}`);
      
      const result = await sendProductEmail(
        state.recipientEmail,
        state.emailType,
        state.emailData,
        state.ccEmails || this.config.defaultCcEmails
      );

      state.emailResult = result;

      // Track sent email
      if (result.success && result.messageId) {
        this.sentEmails.set(result.messageId, result);
      }

      if (result.success) {
        this.log(`Email sent successfully: ${result.messageId}`);
      } else {
        this.log(`Email sending failed: ${result.error}`);
        state.errors?.push(result.error || 'Unknown send error');
      }

      return state;
    } catch (error) {
      this.log(`Error sending email: ${error}`);
      state.errors?.push(error instanceof Error ? error.message : 'Unknown error');
      state.emailResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      return state;
    }
  }

  /**
   * Get email type from event type
   */
  private getEmailType(eventType: string): EmailType | null {
    // Check custom mapping first
    if (this.config.eventMapping && this.config.eventMapping[eventType]) {
      return this.config.eventMapping[eventType];
    }

    // Fall back to default mapping
    return getEmailTypeFromEvent(eventType);
  }

  /**
   * Extract recipient email from event data
   */
  private extractRecipient(event: WorkflowEvent): string | null {
    // Check common field names
    const recipientFields = [
      'recipientEmail',
      'recipient',
      'to',
      'email',
      'stakeholderEmail',
      'managerEmail',
    ];

    for (const field of recipientFields) {
      if (event.data[field] && typeof event.data[field] === 'string') {
        return event.data[field];
      }
    }

    // Check nested objects
    if (event.data.recipient && typeof event.data.recipient === 'object') {
      if (event.data.recipient.email) {
        return event.data.recipient.email;
      }
    }

    return null;
  }

  /**
   * Extract CC emails from event data
   */
  private extractCcEmails(event: WorkflowEvent): string[] | undefined {
    if (event.data.ccEmails && Array.isArray(event.data.ccEmails)) {
      return event.data.ccEmails;
    }
    if (event.data.cc && Array.isArray(event.data.cc)) {
      return event.data.cc;
    }
    return undefined;
  }

  /**
   * Prepare email data from event
   */
  private prepareEmailData(event: WorkflowEvent, emailType: EmailType): Record<string, any> {
    // Start with all event data
    const emailData = { ...event.data };

    // Remove fields that shouldn't be in email data
    delete emailData.recipientEmail;
    delete emailData.recipient;
    delete emailData.to;
    delete emailData.ccEmails;
    delete emailData.cc;

    // Add event metadata if available
    if (event.metadata) {
      emailData.eventMetadata = event.metadata;
    }

    // Add timestamp if not present
    if (!emailData.date && !emailData.updateDate && !emailData.launchDate) {
      emailData.date = event.timestamp.toLocaleDateString();
    }

    return emailData;
  }

  /**
   * Log message (if logging enabled)
   */
  private log(message: string): void {
    if (this.config.enableLogging) {
      console.log(`[EmailAgent] ${message}`);
    }
  }

  /**
   * Get history of sent emails
   */
  getSentEmails(): EmailResponse[] {
    return Array.from(this.sentEmails.values());
  }

  /**
   * Clear sent email history
   */
  clearHistory(): void {
    this.sentEmails.clear();
  }
}

/**
 * Create a LangGraph node function for email sending
 * 
 * @param agent - Email agent instance
 * @returns Node function for LangGraph
 * 
 * @example
 * const emailAgent = new EmailAgent();
 * const emailNode = createEmailNode(emailAgent);
 * 
 * // In your LangGraph workflow
 * graph.addNode('send_stakeholder_email', emailNode);
 */
export function createEmailNode(agent: EmailAgent) {
  return async (state: any) => {
    try {
      // Convert state to workflow event
      const event: WorkflowEvent = {
        type: state.eventType || state.type || 'unknown',
        timestamp: state.timestamp || new Date(),
        data: state.data || state,
        source: state.source,
        metadata: state.metadata,
      };

      // Process event
      const emailState = await agent.processEvent(event);

      // Send email if needed
      if (emailState.shouldSendEmail) {
        const result = await agent.sendEmail(emailState);
        return {
          ...state,
          emailSent: result.emailResult?.success || false,
          emailMessageId: result.emailResult?.messageId,
          emailErrors: result.errors,
        };
      }

      return {
        ...state,
        emailSent: false,
        emailSkipped: true,
      };
    } catch (error) {
      console.error('[EmailNode] Error:', error);
      return {
        ...state,
        emailSent: false,
        emailError: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };
}

/**
 * Create a conditional edge function for email routing
 * 
 * @param condition - Condition function to determine if email should be sent
 * @returns Edge condition function for LangGraph
 * 
 * @example
 * const shouldSendEmail = createEmailCondition((state) => {
 *   return state.priority === 'high';
 * });
 * 
 * graph.addConditionalEdge('process_data', shouldSendEmail, {
 *   true: 'send_email',
 *   false: 'skip_email'
 * });
 */
export function createEmailCondition(
  condition: (state: any) => boolean
): (state: any) => string {
  return (state: any) => {
    try {
      return condition(state) ? 'send_email' : 'skip_email';
    } catch (error) {
      console.error('[EmailCondition] Error:', error);
      return 'skip_email';
    }
  };
}

/**
 * Batch email processor for multiple recipients
 * 
 * @param events - Array of workflow events
 * @param agent - Email agent instance
 * @returns Array of email results
 * 
 * @example
 * const events = [
 *   { type: 'sprint_completed', data: {...}, timestamp: new Date() },
 *   { type: 'feature_launched', data: {...}, timestamp: new Date() }
 * ];
 * 
 * const results = await processBatchEmails(events, emailAgent);
 */
export async function processBatchEmails(
  events: WorkflowEvent[],
  agent: EmailAgent
): Promise<EmailAgentState[]> {
  console.log(`[EmailAgent] Processing batch of ${events.length} events`);

  const results = await Promise.all(
    events.map(async (event) => {
      const state = await agent.processEvent(event);
      if (state.shouldSendEmail) {
        return agent.sendEmail(state);
      }
      return state;
    })
  );

  const successful = results.filter(r => r.emailResult?.success).length;
  console.log(`[EmailAgent] Batch complete: ${successful}/${events.length} emails sent`);

  return results;
}

// Export default agent instance
export const defaultEmailAgent = new EmailAgent({
  enableLogging: process.env.NODE_ENV !== 'production',
});
