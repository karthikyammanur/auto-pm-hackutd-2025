/**
 * Slack Notification System - Usage Examples
 * 
 * Comprehensive examples showing how to use the Slack notification system
 * for PM workflow automation.
 * 
 * @module lib/integrations/slack-examples
 */

import {
  sendSlackNotification,
  sendSlackThread,
  formatJiraLink,
  formatConfluenceLink,
  formatSlackLink,
  mentionUser,
  mentionChannel,
  mentionHere,
  sendTestNotification,
  sendBatchNotifications,
  type NotificationType,
  type SlackNotificationPayload,
} from './slack';

// ============================================================================
// Example 1: Task Completed Notification
// ============================================================================

/**
 * Send notification when an agent completes a task
 */
export async function exampleTaskCompleted() {
  const result = await sendSlackNotification(
    '#pm-team',
    'task_completed',
    {
      title: 'User Stories Created',
      description: 'LangGraph agent successfully generated 5 user stories for the Mobile App v2 feature',
      metadata: {
        'Project': 'Mobile App v2',
        'Stories Created': '5',
        'Agent': 'story-generator-agent',
        'Epic': 'MOBILE-123',
      },
      actionUrl: 'https://jira.company.com/browse/MOBILE-123',
      priority: 'medium',
    },
    {
      mentionUsers: ['U123456'], // Mention the PM
    }
  );

  if (result.success) {
    console.log('✅ Task completion notification sent!');
    console.log(`Message timestamp: ${result.messageTs}`);
  }

  return result;
}

// ============================================================================
// Example 2: Analysis Ready Notification
// ============================================================================

/**
 * Notify PM when competitor analysis is complete
 */
export async function exampleAnalysisReady() {
  const result = await sendSlackNotification(
    '#product-analytics',
    'analysis_ready',
    {
      title: 'Competitor Analysis Complete',
      description: 'Market research agent has finished analyzing 5 competitors. Key insights and recommendations are ready for review.',
      metadata: {
        'Competitors Analyzed': '5',
        'Markets': 'Enterprise SaaS, SMB',
        'Data Sources': '12',
        'Analysis Type': 'Feature Comparison',
        'Confidence Score': '95%',
      },
      actionUrl: 'https://confluence.company.com/display/PROD/Q4-Competitor-Analysis',
      priority: 'high',
    },
    {
      mentionUsers: ['U123456', 'U789012'], // Mention PM and Product Lead
    }
  );

  return result;
}

// ============================================================================
// Example 3: Approval Needed Notification
// ============================================================================

/**
 * Request PM approval for wireframes
 */
export async function exampleApprovalNeeded() {
  const result = await sendSlackNotification(
    '#pm-approvals',
    'approval_needed',
    {
      title: 'Wireframes Ready for Review',
      description: 'Design agent has created wireframes for the new dashboard feature. PM approval needed before moving to development.',
      metadata: {
        'Feature': 'Analytics Dashboard',
        'Wireframes': '8 screens',
        'Agent': 'design-agent',
        'Estimated Dev Time': '3 sprints',
        'Deadline': 'Nov 15, 2025',
      },
      actionUrl: 'https://figma.com/file/abc123/Dashboard-Wireframes',
      priority: 'high',
    },
    {
      mentionUsers: ['U123456'], // Mention PM for approval
    }
  );

  // If approval is urgent, also send a thread reminder
  if (result.success && result.messageTs) {
    setTimeout(async () => {
      await sendSlackThread(
        '#pm-approvals',
        result.messageTs!,
        '⏰ Reminder: These wireframes need approval by EOD to stay on schedule.'
      );
    }, 3600000); // 1 hour later
  }

  return result;
}

// ============================================================================
// Example 4: Error Alert Notification
// ============================================================================

/**
 * Alert team about a critical error
 */
export async function exampleErrorAlert() {
  const result = await sendSlackNotification(
    '#pm-alerts',
    'error_alert',
    {
      title: 'Agent Execution Failed',
      description: 'The data-sync-agent encountered a critical error and stopped execution. Manual intervention required.',
      metadata: {
        'Agent': 'data-sync-agent',
        'Error': 'API rate limit exceeded',
        'Failed At': new Date().toLocaleString(),
        'Retry Attempts': '3',
        'Impact': 'Data sync delayed',
      },
      actionUrl: 'https://logs.company.com/errors/abc123',
      priority: 'critical',
    },
    {
      mentionUsers: ['U123456', 'U789012'], // Mention PM and Tech Lead
    }
  );

  return result;
}

// ============================================================================
// Example 5: Threaded Follow-Up Messages
// ============================================================================

/**
 * Send initial notification and follow up with thread replies
 */
export async function exampleThreadedUpdates() {
  // Send initial notification
  const initial = await sendSlackNotification(
    '#pm-team',
    'task_completed',
    {
      title: 'Sprint Planning Started',
      description: 'Agent is now generating sprint plan for Sprint 43',
      metadata: {
        'Sprint': '43',
        'Team': 'Phoenix Team',
        'Start Date': 'Nov 11, 2025',
      },
      priority: 'medium',
    }
  );

  if (!initial.success || !initial.messageTs) {
    console.error('Failed to send initial notification');
    return;
  }

  // Simulate progress updates in thread
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await sendSlackThread(
    '#pm-team',
    initial.messageTs,
    '⏳ Analyzing backlog items... (50 items found)'
  );

  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await sendSlackThread(
    '#pm-team',
    initial.messageTs,
    '📊 Calculating team velocity... (avg 45 points/sprint)'
  );

  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await sendSlackThread(
    '#pm-team',
    initial.messageTs,
    '✅ Sprint plan complete! 18 stories assigned (42 points total)'
  );

  return initial;
}

// ============================================================================
// Example 6: Using Formatting Helpers
// ============================================================================

/**
 * Use formatting helpers for rich messages
 */
export async function exampleFormattedLinks() {
  const jiraLink = formatJiraLink('PROJ-456');
  const confluenceLink = formatConfluenceLink('12345678', 'Product Roadmap');
  const figmaLink = formatSlackLink('https://figma.com/file/abc', 'View Designs');
  
  const result = await sendSlackNotification(
    '#pm-team',
    'task_completed',
    {
      title: 'Requirements Document Updated',
      description: `Updated requirements for ${jiraLink}. See full details in ${confluenceLink}. Review ${figmaLink} for visual mockups.`,
      metadata: {
        'Document': 'PRD v2.0',
        'Last Updated': new Date().toLocaleString(),
        'Changes': '12 sections updated',
      },
      priority: 'medium',
    }
  );

  return result;
}

// ============================================================================
// Example 7: Batch Notifications
// ============================================================================

/**
 * Send multiple notifications in batch (e.g., daily digest)
 */
export async function exampleBatchNotifications() {
  const notifications: Array<{
    channel: string;
    type: NotificationType;
    payload: SlackNotificationPayload;
    options?: { mentionUsers?: string[] };
  }> = [
    {
      channel: '#pm-team',
      type: 'task_completed',
      payload: {
        title: 'Daily Standup Summary',
        description: 'Here\'s what the agents accomplished today',
        metadata: {
          'Stories Created': '12',
          'Bugs Fixed': '8',
          'Docs Updated': '5',
        },
        priority: 'low',
      },
    },
    {
      channel: '#pm-team',
      type: 'analysis_ready',
      payload: {
        title: 'Weekly Analytics Report',
        description: 'User behavior analysis for the past week',
        metadata: {
          'Active Users': '+15%',
          'Feature Adoption': '72%',
          'Top Feature': 'Dark Mode',
        },
        actionUrl: 'https://analytics.company.com/weekly',
        priority: 'medium',
      },
    },
    {
      channel: '#pm-team',
      type: 'approval_needed',
      payload: {
        title: 'Roadmap Review Due',
        description: 'Q1 2026 roadmap needs final approval',
        metadata: {
          'Features': '15',
          'Epic Count': '4',
          'Review Deadline': 'Nov 10, 2025',
        },
        priority: 'high',
      },
      options: {
        mentionUsers: ['U123456'],
      },
    },
  ];

  const results = await sendBatchNotifications(notifications, 1000);
  
  const successful = results.filter(r => r.success).length;
  console.log(`Sent ${successful}/${results.length} batch notifications`);

  return results;
}

// ============================================================================
// Example 8: Different Priority Levels
// ============================================================================

/**
 * Demonstrate different priority levels
 */
export async function examplePriorityLevels() {
  const basePayload = {
    title: 'Priority Level Demo',
    description: 'This notification demonstrates different priority styling',
    metadata: {
      'Test': 'Priority Levels',
    },
  };

  // Low priority (green)
  await sendSlackNotification('#test-channel', 'task_completed', {
    ...basePayload,
    title: 'Low Priority - Informational',
    priority: 'low',
  });

  await new Promise(resolve => setTimeout(resolve, 1000));

  // Medium priority (blue)
  await sendSlackNotification('#test-channel', 'task_completed', {
    ...basePayload,
    title: 'Medium Priority - Normal Task',
    priority: 'medium',
  });

  await new Promise(resolve => setTimeout(resolve, 1000));

  // High priority (orange)
  await sendSlackNotification('#test-channel', 'approval_needed', {
    ...basePayload,
    title: 'High Priority - Needs Attention',
    priority: 'high',
  });

  await new Promise(resolve => setTimeout(resolve, 1000));

  // Critical priority (red)
  await sendSlackNotification('#test-channel', 'error_alert', {
    ...basePayload,
    title: 'Critical Priority - Urgent Action Required',
    priority: 'critical',
  });
}

// ============================================================================
// Example 9: Mentioning Users and Channels
// ============================================================================

/**
 * Use mention helpers to notify specific users or groups
 */
export async function exampleMentions() {
  const pm = mentionUser('U123456');
  const techLead = mentionUser('U789012');
  const designChannel = mentionChannel('C987654');
  
  await sendSlackNotification(
    '#pm-team',
    'approval_needed',
    {
      title: 'Cross-Team Collaboration Needed',
      description: `${pm} and ${techLead} - we need your review on the API design. Also notifying ${designChannel} for UX input.`,
      metadata: {
        'Document': 'API Design v1',
        'Deadline': 'Nov 12, 2025',
      },
      priority: 'high',
    }
  );

  // For urgent notifications, use @here
  await sendSlackNotification(
    '#pm-alerts',
    'error_alert',
    {
      title: 'Production Issue Detected',
      description: `${mentionHere()} Critical error in production requires immediate attention`,
      priority: 'critical',
    }
  );
}

// ============================================================================
// Example 10: Testing the Integration
// ============================================================================

/**
 * Test the Slack integration
 */
export async function exampleTestNotification() {
  console.log('Testing Slack integration...');
  
  // Test with default channel
  const defaultTest = await sendTestNotification();
  
  if (defaultTest.success) {
    console.log('✅ Default channel test passed');
  } else {
    console.error('❌ Default channel test failed:', defaultTest.error);
  }

  // Test with specific channel
  const customTest = await sendTestNotification('#test-channel');
  
  if (customTest.success) {
    console.log('✅ Custom channel test passed');
  } else {
    console.error('❌ Custom channel test failed:', customTest.error);
  }

  return { defaultTest, customTest };
}

// ============================================================================
// Example 11: Real-World PM Workflow Integration
// ============================================================================

/**
 * Complete workflow: Sprint planning automation
 */
export async function exampleSprintPlanningWorkflow() {
  // 1. Notify that sprint planning has started
  const startNotification = await sendSlackNotification(
    '#pm-team',
    'task_completed',
    {
      title: 'Sprint Planning Automation Started',
      description: 'AI agent is analyzing the backlog and creating sprint plan for Sprint 44',
      metadata: {
        'Sprint': '44',
        'Team': 'Phoenix Team',
        'Backlog Items': '87',
      },
      priority: 'medium',
    },
    {
      mentionUsers: ['U123456'], // Mention PM
    }
  );

  if (!startNotification.success) return;

  // 2. Thread update: Stories selected
  await new Promise(resolve => setTimeout(resolve, 3000));
  await sendSlackThread(
    '#pm-team',
    startNotification.messageTs!,
    '📝 Selected 20 stories based on priority and velocity'
  );

  // 3. Thread update: Dependencies analyzed
  await new Promise(resolve => setTimeout(resolve, 3000));
  await sendSlackThread(
    '#pm-team',
    startNotification.messageTs!,
    '🔗 Analyzed dependencies, 3 blockers identified'
  );

  // 4. Final notification with results
  await new Promise(resolve => setTimeout(resolve, 3000));
  const completionNotification = await sendSlackNotification(
    '#pm-team',
    'approval_needed',
    {
      title: 'Sprint Plan Ready for Review',
      description: 'Sprint 44 plan is complete with 20 stories (48 points). Review and approve to proceed.',
      metadata: {
        'Stories': '20',
        'Story Points': '48',
        'Team Capacity': '50 points',
        'Utilization': '96%',
        'Blockers': '3 (assigned)',
      },
      actionUrl: 'https://jira.company.com/secure/RapidBoard.jspa?rapidView=123',
      priority: 'high',
    },
    {
      mentionUsers: ['U123456'],
    }
  );

  return { startNotification, completionNotification };
}

// ============================================================================
// Example 12: Error Recovery with Retry
// ============================================================================

/**
 * The system automatically retries failed notifications up to 3 times
 * with exponential backoff. This example shows it in action.
 */
export async function exampleErrorRecovery() {
  console.log('Testing error recovery with retries...');
  
  // This will automatically retry if there are network issues
  const result = await sendSlackNotification(
    '#pm-team',
    'task_completed',
    {
      title: 'Testing Retry Logic',
      description: 'This notification will be retried automatically if it fails',
      priority: 'low',
    }
  );

  if (result.success) {
    console.log(`✅ Notification sent successfully`);
    if (result.retryCount && result.retryCount > 0) {
      console.log(`🔄 Required ${result.retryCount} retry attempt(s)`);
    }
  } else {
    console.log(`❌ Failed after 3 retry attempts: ${result.error}`);
  }

  return result;
}

// ============================================================================
// Export All Examples
// ============================================================================

export default {
  exampleTaskCompleted,
  exampleAnalysisReady,
  exampleApprovalNeeded,
  exampleErrorAlert,
  exampleThreadedUpdates,
  exampleFormattedLinks,
  exampleBatchNotifications,
  examplePriorityLevels,
  exampleMentions,
  exampleTestNotification,
  exampleSprintPlanningWorkflow,
  exampleErrorRecovery,
};
