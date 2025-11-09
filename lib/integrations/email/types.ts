/**
 * Email Automation Type Definitions
 * 
 * TypeScript interfaces and types for the Product Manager email automation system.
 * Supports stakeholder updates, sprint summaries, feature launches, and GTM announcements.
 * 
 * @module lib/integrations/email/types
 */

/**
 * Supported email types for Product Manager workflows
 */
export type EmailType =
  | 'stakeholder_update'
  | 'sprint_summary'
  | 'feature_launch'
  | 'gtm_announcement';

/**
 * Standard response from email operations
 */
export interface EmailResponse {
  /** Whether the email was sent successfully */
  success: boolean;
  /** Resend message ID (present on success) */
  messageId?: string;
  /** Error message (present on failure) */
  error?: string;
}

/**
 * Base email payload structure
 */
export interface EmailPayload {
  /** Primary recipient email address */
  recipientEmail: string;
  /** Type of email to send */
  emailType: EmailType;
  /** Dynamic data for template rendering */
  data: Record<string, any>;
  /** Optional CC recipients */
  ccEmails?: string[];
}

/**
 * Stakeholder update data structure
 */
export interface StakeholderUpdateData {
  /** Name of the stakeholder */
  stakeholderName: string;
  /** Update title/subject */
  updateTitle: string;
  /** Key highlights as array of strings */
  highlights: string[];
  /** Current progress percentage (0-100) */
  progressPercentage?: number;
  /** Next steps or action items */
  nextSteps?: string[];
  /** Link to detailed report or dashboard */
  reportLink?: string;
  /** Date of the update */
  updateDate?: string;
  /** Project or initiative name */
  projectName?: string;
}

/**
 * Sprint summary data structure
 */
export interface SprintSummaryData {
  /** Sprint number or identifier */
  sprintNumber: string;
  /** Sprint start date */
  startDate: string;
  /** Sprint end date */
  endDate: string;
  /** Stories completed */
  storiesCompleted: number;
  /** Total stories planned */
  storiesPlanned: number;
  /** Story points completed */
  pointsCompleted?: number;
  /** Story points planned */
  pointsPlanned?: number;
  /** Key accomplishments */
  accomplishments: string[];
  /** Items carried over to next sprint */
  carryovers?: string[];
  /** Blockers or impediments */
  blockers?: string[];
  /** Link to sprint board */
  boardLink?: string;
  /** Team name */
  teamName?: string;
  /** Sprint retrospective highlights */
  retroHighlights?: string[];
}

/**
 * Feature launch data structure
 */
export interface FeatureLaunchData {
  /** Name of the feature being launched */
  featureName: string;
  /** Launch date */
  launchDate: string;
  /** Brief description of the feature */
  description: string;
  /** Target user segments */
  targetAudience?: string[];
  /** Key benefits */
  benefits: string[];
  /** Success metrics to track */
  metrics?: string[];
  /** Link to feature documentation */
  docsLink?: string;
  /** Link to feature demo or walkthrough */
  demoLink?: string;
  /** Expected impact or business value */
  expectedImpact?: string;
  /** Team members involved */
  teamMembers?: string[];
}

/**
 * Go-to-market announcement data structure
 */
export interface GTMAnnouncementData {
  /** Product or feature name */
  productName: string;
  /** Launch date */
  launchDate: string;
  /** Target market segments */
  targetMarket: string[];
  /** Value proposition */
  valueProposition: string;
  /** Key messaging points */
  messagingPoints: string[];
  /** Pricing information */
  pricing?: string;
  /** Marketing campaign details */
  campaignDetails?: string;
  /** Sales enablement resources */
  salesResources?: string[];
  /** Link to GTM plan */
  gtmPlanLink?: string;
  /** Link to marketing materials */
  marketingLink?: string;
  /** Competitive positioning */
  competitivePosition?: string;
  /** Expected revenue impact */
  revenueImpact?: string;
}

/**
 * Email template configuration
 */
export interface EmailTemplate {
  /** Email subject line (string or function) */
  subject: string | ((data: any) => string);
  /** Function to generate HTML body */
  generateBody: (data: any) => string;
  /** Preferred sender name */
  senderName?: string;
}

/**
 * Email preview result
 */
export interface EmailPreview {
  /** Email subject line */
  subject: string;
  /** HTML body content */
  htmlBody: string;
  /** Plain text version (optional) */
  textBody?: string;
}

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /** Maximum emails per time window */
  maxEmails: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Current count (for tracking) */
  currentCount?: number;
  /** Window reset timestamp */
  resetAt?: number;
}

/**
 * Email sending options
 */
export interface SendEmailOptions {
  /** Override default sender email */
  fromEmail?: string;
  /** Override default sender name */
  fromName?: string;
  /** Reply-to email address */
  replyTo?: string;
  /** Email priority */
  priority?: 'high' | 'normal' | 'low';
  /** Schedule send for later (timestamp) */
  scheduledFor?: Date;
  /** Tags for tracking and analytics */
  tags?: string[];
  /** Custom headers */
  headers?: Record<string, string>;
}

/**
 * Email validation result
 */
export interface EmailValidationResult {
  /** Whether the email is valid */
  valid: boolean;
  /** Validation errors */
  errors: string[];
  /** Warnings (non-blocking) */
  warnings?: string[];
}
