/**
 * Email Automation Examples
 * 
 * Comprehensive examples for using the Product Manager email automation system.
 * Copy and adapt these examples for your workflows.
 * 
 * @module examples/email-examples
 */

import {
  sendProductEmail,
  generateEmailPreview,
  sendBulkProductEmail,
  sendTestEmail,
} from '@/lib/integrations/email';

/**
 * Example 1: Send a Stakeholder Update
 */
export async function exampleStakeholderUpdate() {
  const result = await sendProductEmail(
    'stakeholder@company.com',
    'stakeholder_update',
    {
      stakeholderName: 'Sarah Johnson',
      updateTitle: 'Q4 2025 Product Progress',
      projectName: 'Project Phoenix',
      highlights: [
        'Completed core API development ahead of schedule',
        'User testing shows 92% satisfaction rate',
        'Successfully onboarded 3 enterprise clients',
        'Resolved all P0 bugs from previous sprint',
      ],
      progressPercentage: 78,
      nextSteps: [
        'Begin integration testing with partner systems',
        'Finalize UI/UX improvements based on feedback',
        'Prepare launch materials for marketing team',
      ],
      reportLink: 'https://dashboard.company.com/projects/phoenix/q4-report',
      updateDate: new Date().toLocaleDateString(),
    },
    ['product-team@company.com', 'engineering@company.com']
  );

  if (result.success) {
    console.log('✓ Stakeholder update sent:', result.messageId);
  } else {
    console.error('✗ Failed to send:', result.error);
  }

  return result;
}

/**
 * Example 2: Send a Sprint Summary
 */
export async function exampleSprintSummary() {
  const result = await sendProductEmail(
    'team@company.com',
    'sprint_summary',
    {
      sprintNumber: '42',
      teamName: 'Phoenix Development Team',
      startDate: '2025-11-01',
      endDate: '2025-11-14',
      storiesCompleted: 18,
      storiesPlanned: 20,
      pointsCompleted: 45,
      pointsPlanned: 50,
      accomplishments: [
        'Launched new dashboard with real-time analytics',
        'Improved API response time by 40%',
        'Fixed 15 high-priority bugs',
        'Completed security audit with zero findings',
        'Updated documentation for all new features',
      ],
      carryovers: [
        'Mobile responsive design (pending UX review)',
        'Advanced filtering feature (80% complete)',
      ],
      blockers: [
        'Waiting for third-party API access',
      ],
      boardLink: 'https://jira.company.com/board/phoenix-sprint-42',
      retroHighlights: [
        'Daily standups improved team communication',
        'Pairing sessions helped knowledge sharing',
        'Need to allocate more time for technical debt',
      ],
    },
    ['managers@company.com']
  );

  return result;
}

/**
 * Example 3: Send a Feature Launch Announcement
 */
export async function exampleFeatureLaunch() {
  const result = await sendProductEmail(
    'all-staff@company.com',
    'feature_launch',
    {
      featureName: 'Real-Time Collaboration Suite',
      launchDate: 'December 15, 2025',
      description: 'Our new Real-Time Collaboration Suite enables teams to work together seamlessly with live editing, instant notifications, and smart conflict resolution.',
      targetAudience: [
        'Enterprise customers',
        'Development teams',
        'Project managers',
        'Remote workers',
      ],
      benefits: [
        'Reduce coordination time by 60% with live editing',
        'Zero data loss with automatic conflict resolution',
        'Seamless integration with existing workflows',
        'Enterprise-grade security and compliance',
        'Works offline with smart sync when reconnected',
      ],
      metrics: [
        'User adoption rate (target: 80% in first month)',
        'Daily active users and session time',
        'Feature usage patterns and engagement',
        'Customer satisfaction scores',
      ],
      docsLink: 'https://docs.company.com/collaboration-suite',
      demoLink: 'https://demo.company.com/collab-walkthrough',
      expectedImpact: 'Expected to increase team productivity by 35% and reduce project delays by 50%, generating an estimated $2M in additional annual revenue.',
      teamMembers: [
        'Emma Chen (Product Lead)',
        'Michael Torres (Engineering)',
        'Priya Patel (Design)',
        'David Kim (QA)',
      ],
    }
  );

  return result;
}

/**
 * Example 4: Send a GTM Announcement
 */
export async function exampleGTMAnnouncement() {
  const result = await sendProductEmail(
    'sales@company.com',
    'gtm_announcement',
    {
      productName: 'Enterprise Analytics Platform v3.0',
      launchDate: 'January 10, 2026',
      targetMarket: [
        'Enterprise SaaS companies (1000+ employees)',
        'Financial services firms',
        'Healthcare organizations',
        'Government agencies',
      ],
      valueProposition: 'Enterprise Analytics Platform v3.0 delivers 10x faster insights with AI-powered analysis, predictive forecasting, and compliance-ready reporting - all in a single, intuitive platform.',
      messagingPoints: [
        'Lightning-fast performance: Query billions of records in seconds',
        'AI-powered insights: Automatically surface trends and anomalies',
        'Compliance-ready: SOC 2, HIPAA, GDPR certified out of the box',
        'Zero-touch integration: Connect to 100+ data sources instantly',
        'ROI guarantee: Customers see 300% ROI in first year or money back',
      ],
      pricing: 'Starting at $10,000/month for Standard plan, $25,000/month for Enterprise. Volume discounts available.',
      campaignDetails: 'Multi-channel launch campaign includes: industry analyst briefings (Dec 20), webinar series (Jan 5-8), trade show presence at AnalyticsCon (Jan 15-17), and coordinated social media blitz.',
      salesResources: [
        'Complete sales playbook with objection handling',
        'ROI calculator and value assessment tools',
        'Competitive battle cards (vs. Tableau, PowerBI)',
        'Demo environment with sample datasets',
        'Customer success stories and case studies',
      ],
      gtmPlanLink: 'https://internal.company.com/gtm-analytics-v3',
      marketingLink: 'https://internal.company.com/marketing/analytics-v3',
      competitivePosition: 'We outperform Tableau on speed (5x faster), beat PowerBI on ease of use (40% reduction in training time), and undercut both on total cost of ownership by 30%.',
      revenueImpact: '$15M ARR in first year, $40M by year three',
    },
    ['marketing@company.com', 'executives@company.com']
  );

  return result;
}

/**
 * Example 5: Generate Email Preview (for testing)
 */
export async function exampleGeneratePreview() {
  const preview = generateEmailPreview('stakeholder_update', {
    stakeholderName: 'John Doe',
    updateTitle: 'Test Preview',
    projectName: 'Test Project',
    highlights: [
      'This is a test highlight',
      'Preview generation works correctly',
      'Templates render properly',
    ],
    progressPercentage: 50,
  });

  console.log('Subject:', preview.subject);
  console.log('HTML length:', preview.htmlBody.length, 'characters');

  // You can write this to a file for visual inspection
  // fs.writeFileSync('preview.html', preview.htmlBody);

  return preview;
}

/**
 * Example 6: Send Bulk Emails
 */
export async function exampleBulkEmails() {
  const recipients = [
    'manager1@company.com',
    'manager2@company.com',
    'manager3@company.com',
  ];

  const results = await sendBulkProductEmail(
    recipients,
    'feature_launch',
    {
      featureName: 'Bulk Email Test',
      launchDate: 'TBD',
      description: 'Testing bulk email functionality',
      benefits: ['Fast', 'Reliable', 'Scalable'],
    }
  );

  const successful = results.filter(r => r.success).length;
  console.log(`Sent ${successful}/${recipients.length} emails successfully`);

  return results;
}

/**
 * Example 7: Test Email Configuration
 */
export async function exampleTestConfiguration() {
  const result = await sendTestEmail('your-email@company.com');

  if (result.success) {
    console.log('✓ Test email sent successfully!');
    console.log('Check your inbox to verify email rendering.');
  } else {
    console.error('✗ Test email failed:', result.error);
    console.error('Please check your Resend configuration.');
  }

  return result;
}

/**
 * Example 8: LangGraph Integration
 */
export async function exampleLangGraphIntegration() {
  // This would be used in your LangGraph workflow
  const { EmailAgent, createEmailNode } = await import('@/lib/agents/email-agent');

  const agent = new EmailAgent({
    enableLogging: true,
    dryRun: false, // Set to true for testing
  });

  // Process a workflow event
  const event = {
    type: 'sprint_completed',
    timestamp: new Date(),
    data: {
      recipientEmail: 'team@company.com',
      sprintNumber: '43',
      startDate: '2025-11-15',
      endDate: '2025-11-28',
      storiesCompleted: 22,
      storiesPlanned: 25,
      accomplishments: ['Great sprint!', 'Delivered key features'],
    },
  };

  const state = await agent.processEvent(event);
  if (state.shouldSendEmail) {
    const result = await agent.sendEmail(state);
    console.log('Email sent from workflow:', result);
  }

  return state;
}

// Export all examples
export const examples = {
  stakeholderUpdate: exampleStakeholderUpdate,
  sprintSummary: exampleSprintSummary,
  featureLaunch: exampleFeatureLaunch,
  gtmAnnouncement: exampleGTMAnnouncement,
  generatePreview: exampleGeneratePreview,
  bulkEmails: exampleBulkEmails,
  testConfiguration: exampleTestConfiguration,
  langGraphIntegration: exampleLangGraphIntegration,
};
