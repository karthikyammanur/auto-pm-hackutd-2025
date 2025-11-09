/**
 * Email Template Builder
 * 
 * Professional HTML email templates for Product Manager automation.
 * Each template uses inline CSS for maximum email client compatibility.
 * 
 * @module lib/integrations/email/templates
 */

import type {
  EmailTemplate,
  StakeholderUpdateData,
  SprintSummaryData,
  FeatureLaunchData,
  GTMAnnouncementData,
} from './types';

/**
 * Base HTML wrapper with common styling
 */
function wrapInEmailLayout(content: string, title: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f7f9; line-height: 1.6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">
                Product Management Hub
              </h1>
              <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 14px;">
                Automated Workflow Updates
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 10px 0; font-size: 12px; color: #6c757d; text-align: center;">
                This is an automated message from your Product Management workflow system.
              </p>
              <p style="margin: 0; font-size: 12px; color: #6c757d; text-align: center;">
                <a href="#" style="color: #667eea; text-decoration: none;">Manage Preferences</a> | 
                <a href="#" style="color: #667eea; text-decoration: none;">Unsubscribe</a>
              </p>
              <p style="margin: 15px 0 0 0; font-size: 11px; color: #adb5bd; text-align: center;">
                © ${new Date().getFullYear()} Product Management Hub. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Helper to create a styled button
 */
function createButton(text: string, url: string, color: string = '#667eea'): string {
  return `
    <table role="presentation" style="margin: 20px 0;">
      <tr>
        <td style="border-radius: 4px; background-color: ${color};">
          <a href="${url}" target="_blank" style="border: none; color: #ffffff; padding: 12px 24px; text-decoration: none; display: inline-block; font-weight: 600; font-size: 14px;">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `;
}

/**
 * Helper to create a list item
 */
function createListItem(text: string, isOrdered: boolean = false): string {
  const bullet = isOrdered ? '' : '•';
  return `
    <div style="padding: 8px 0; padding-left: ${isOrdered ? '0' : '20px'};">
      ${bullet} ${text}
    </div>
  `;
}

/**
 * Stakeholder Update Template
 */
export const stakeholderUpdateTemplate: EmailTemplate = {
  subject: (data: StakeholderUpdateData) => 
    `${data.updateTitle} - ${data.projectName || 'Project Update'}`,
  
  senderName: 'Product Management Team',
  
  generateBody: (data: StakeholderUpdateData) => {
    const progressBar = data.progressPercentage !== undefined ? `
      <div style="margin: 25px 0;">
        <p style="margin: 0 0 8px 0; font-size: 14px; color: #495057; font-weight: 600;">
          Progress: ${data.progressPercentage}%
        </p>
        <div style="width: 100%; height: 8px; background-color: #e9ecef; border-radius: 4px; overflow: hidden;">
          <div style="width: ${data.progressPercentage}%; height: 100%; background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); transition: width 0.3s ease;"></div>
        </div>
      </div>
    ` : '';

    const highlightsHtml = data.highlights.map(h => createListItem(h)).join('');
    
    const nextStepsHtml = data.nextSteps ? `
      <div style="margin-top: 30px;">
        <h3 style="margin: 0 0 15px 0; color: #212529; font-size: 18px; font-weight: 600;">
          Next Steps
        </h3>
        ${data.nextSteps.map((step, i) => createListItem(`${i + 1}. ${step}`, true)).join('')}
      </div>
    ` : '';

    const content = `
      <h2 style="margin: 0 0 10px 0; color: #212529; font-size: 24px; font-weight: 600;">
        Hi ${data.stakeholderName},
      </h2>
      <p style="margin: 0 0 20px 0; color: #6c757d; font-size: 14px;">
        ${data.updateDate || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
      </p>
      
      <p style="margin: 0 0 25px 0; color: #495057; font-size: 16px; line-height: 1.6;">
        Here's your latest update on <strong>${data.projectName || 'the project'}</strong>.
      </p>

      ${progressBar}

      <div style="margin: 30px 0;">
        <h3 style="margin: 0 0 15px 0; color: #212529; font-size: 18px; font-weight: 600;">
          Key Highlights
        </h3>
        <div style="color: #495057; font-size: 15px;">
          ${highlightsHtml}
        </div>
      </div>

      ${nextStepsHtml}

      ${data.reportLink ? createButton('View Full Report', data.reportLink) : ''}

      <p style="margin: 30px 0 0 0; color: #495057; font-size: 15px;">
        Best regards,<br>
        <strong>Product Management Team</strong>
      </p>
    `;

    return wrapInEmailLayout(content, data.updateTitle);
  },
};

/**
 * Sprint Summary Template
 */
export const sprintSummaryTemplate: EmailTemplate = {
  subject: (data: SprintSummaryData) => 
    `Sprint ${data.sprintNumber} Summary - ${data.teamName || 'Team'} (${data.startDate} - ${data.endDate})`,
  
  senderName: 'Sprint Management System',
  
  generateBody: (data: SprintSummaryData) => {
    const completionRate = Math.round((data.storiesCompleted / data.storiesPlanned) * 100);
    const completionColor = completionRate >= 80 ? '#28a745' : completionRate >= 60 ? '#ffc107' : '#dc3545';

    const accomplishmentsHtml = data.accomplishments.map(a => createListItem(a)).join('');
    
    const carryoversHtml = data.carryovers && data.carryovers.length > 0 ? `
      <div style="margin-top: 25px; padding: 15px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
        <h4 style="margin: 0 0 10px 0; color: #856404; font-size: 16px; font-weight: 600;">
          Carried Over to Next Sprint
        </h4>
        <div style="color: #856404; font-size: 14px;">
          ${data.carryovers.map(c => createListItem(c)).join('')}
        </div>
      </div>
    ` : '';

    const blockersHtml = data.blockers && data.blockers.length > 0 ? `
      <div style="margin-top: 25px; padding: 15px; background-color: #f8d7da; border-left: 4px solid #dc3545; border-radius: 4px;">
        <h4 style="margin: 0 0 10px 0; color: #721c24; font-size: 16px; font-weight: 600;">
          ⚠️ Blockers & Impediments
        </h4>
        <div style="color: #721c24; font-size: 14px;">
          ${data.blockers.map(b => createListItem(b)).join('')}
        </div>
      </div>
    ` : '';

    const retroHtml = data.retroHighlights && data.retroHighlights.length > 0 ? `
      <div style="margin-top: 30px;">
        <h3 style="margin: 0 0 15px 0; color: #212529; font-size: 18px; font-weight: 600;">
          💡 Retrospective Highlights
        </h3>
        <div style="color: #495057; font-size: 15px;">
          ${data.retroHighlights.map(r => createListItem(r)).join('')}
        </div>
      </div>
    ` : '';

    const content = `
      <h2 style="margin: 0 0 25px 0; color: #212529; font-size: 24px; font-weight: 600;">
        Sprint ${data.sprintNumber} Summary
      </h2>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px 0;">
              <strong style="color: #495057;">Team:</strong>
              <span style="color: #6c757d; margin-left: 10px;">${data.teamName || 'Development Team'}</span>
            </td>
            <td style="padding: 10px 0; text-align: right;">
              <strong style="color: #495057;">Duration:</strong>
              <span style="color: #6c757d; margin-left: 10px;">${data.startDate} - ${data.endDate}</span>
            </td>
          </tr>
        </table>
      </div>

      <div style="margin: 25px 0;">
        <h3 style="margin: 0 0 15px 0; color: #212529; font-size: 18px; font-weight: 600;">
          📊 Sprint Metrics
        </h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 15px; background-color: #f8f9fa; border-radius: 6px; width: 50%;">
              <div style="font-size: 14px; color: #6c757d; margin-bottom: 5px;">Stories Completed</div>
              <div style="font-size: 28px; font-weight: 700; color: ${completionColor};">
                ${data.storiesCompleted}/${data.storiesPlanned}
              </div>
              <div style="font-size: 14px; color: ${completionColor}; margin-top: 5px;">
                ${completionRate}% completion rate
              </div>
            </td>
            ${data.pointsCompleted !== undefined ? `
            <td style="padding: 15px; background-color: #f8f9fa; border-radius: 6px; width: 50%; padding-left: 20px;">
              <div style="font-size: 14px; color: #6c757d; margin-bottom: 5px;">Story Points</div>
              <div style="font-size: 28px; font-weight: 700; color: #667eea;">
                ${data.pointsCompleted}/${data.pointsPlanned || data.pointsCompleted}
              </div>
              <div style="font-size: 14px; color: #6c757d; margin-top: 5px;">
                points delivered
              </div>
            </td>
            ` : ''}
          </tr>
        </table>
      </div>

      <div style="margin: 30px 0;">
        <h3 style="margin: 0 0 15px 0; color: #212529; font-size: 18px; font-weight: 600;">
          ✨ Key Accomplishments
        </h3>
        <div style="color: #495057; font-size: 15px;">
          ${accomplishmentsHtml}
        </div>
      </div>

      ${carryoversHtml}
      ${blockersHtml}
      ${retroHtml}

      ${data.boardLink ? createButton('View Sprint Board', data.boardLink) : ''}

      <p style="margin: 30px 0 0 0; color: #495057; font-size: 15px;">
        Great work, team! 🎉
      </p>
    `;

    return wrapInEmailLayout(content, `Sprint ${data.sprintNumber} Summary`);
  },
};

/**
 * Feature Launch Template
 */
export const featureLaunchTemplate: EmailTemplate = {
  subject: (data: FeatureLaunchData) => 
    `🚀 Feature Launch: ${data.featureName} - ${data.launchDate}`,
  
  senderName: 'Product Launch Team',
  
  generateBody: (data: FeatureLaunchData) => {
    const benefitsHtml = data.benefits.map(b => createListItem(b)).join('');
    
    const audienceHtml = data.targetAudience && data.targetAudience.length > 0 ? `
      <div style="margin: 25px 0; padding: 15px; background-color: #e7f3ff; border-left: 4px solid #0066cc; border-radius: 4px;">
        <h4 style="margin: 0 0 10px 0; color: #004085; font-size: 16px; font-weight: 600;">
          🎯 Target Audience
        </h4>
        <div style="color: #004085; font-size: 14px;">
          ${data.targetAudience.join(' • ')}
        </div>
      </div>
    ` : '';

    const metricsHtml = data.metrics && data.metrics.length > 0 ? `
      <div style="margin-top: 25px;">
        <h3 style="margin: 0 0 15px 0; color: #212529; font-size: 18px; font-weight: 600;">
          📈 Success Metrics
        </h3>
        <div style="color: #495057; font-size: 15px;">
          ${data.metrics.map(m => createListItem(m)).join('')}
        </div>
      </div>
    ` : '';

    const impactHtml = data.expectedImpact ? `
      <div style="margin: 25px 0; padding: 20px; background-color: #d4edda; border-left: 4px solid #28a745; border-radius: 4px;">
        <h4 style="margin: 0 0 10px 0; color: #155724; font-size: 16px; font-weight: 600;">
          💰 Expected Impact
        </h4>
        <p style="margin: 0; color: #155724; font-size: 15px;">
          ${data.expectedImpact}
        </p>
      </div>
    ` : '';

    const teamHtml = data.teamMembers && data.teamMembers.length > 0 ? `
      <p style="margin: 25px 0 0 0; color: #6c757d; font-size: 14px; font-style: italic;">
        Built by: ${data.teamMembers.join(', ')}
      </p>
    ` : '';

    const content = `
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="font-size: 48px; margin-bottom: 10px;">🚀</div>
        <h2 style="margin: 0 0 10px 0; color: #212529; font-size: 28px; font-weight: 700;">
          ${data.featureName}
        </h2>
        <p style="margin: 0; color: #6c757d; font-size: 16px;">
          Launching ${data.launchDate}
        </p>
      </div>

      <p style="margin: 0 0 25px 0; color: #495057; font-size: 16px; line-height: 1.7;">
        ${data.description}
      </p>

      ${audienceHtml}

      <div style="margin: 30px 0;">
        <h3 style="margin: 0 0 15px 0; color: #212529; font-size: 18px; font-weight: 600;">
          ✨ Key Benefits
        </h3>
        <div style="color: #495057; font-size: 15px;">
          ${benefitsHtml}
        </div>
      </div>

      ${impactHtml}
      ${metricsHtml}

      <div style="margin: 30px 0; text-align: center;">
        ${data.demoLink ? createButton('Watch Demo', data.demoLink, '#764ba2') : ''}
        ${data.docsLink ? createButton('Read Documentation', data.docsLink, '#667eea') : ''}
      </div>

      ${teamHtml}

      <p style="margin: 30px 0 0 0; color: #495057; font-size: 15px; text-align: center;">
        Let's make this launch a success! 🎉
      </p>
    `;

    return wrapInEmailLayout(content, `Feature Launch: ${data.featureName}`);
  },
};

/**
 * GTM Announcement Template
 */
export const gtmAnnouncementTemplate: EmailTemplate = {
  subject: (data: GTMAnnouncementData) => 
    `📣 GTM Launch: ${data.productName} - ${data.launchDate}`,
  
  senderName: 'Go-to-Market Team',
  
  generateBody: (data: GTMAnnouncementData) => {
    const marketHtml = `
      <div style="margin: 25px 0; padding: 15px; background-color: #f8f9fa; border-radius: 6px;">
        <h4 style="margin: 0 0 10px 0; color: #495057; font-size: 16px; font-weight: 600;">
          Target Markets
        </h4>
        <p style="margin: 0; color: #6c757d; font-size: 15px;">
          ${data.targetMarket.join(' • ')}
        </p>
      </div>
    `;

    const messagingHtml = data.messagingPoints.map(m => createListItem(m)).join('');

    const pricingHtml = data.pricing ? `
      <div style="margin: 25px 0; padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
        <h4 style="margin: 0 0 10px 0; color: #856404; font-size: 16px; font-weight: 600;">
          💵 Pricing
        </h4>
        <p style="margin: 0; color: #856404; font-size: 15px;">
          ${data.pricing}
        </p>
      </div>
    ` : '';

    const resourcesHtml = data.salesResources && data.salesResources.length > 0 ? `
      <div style="margin-top: 25px;">
        <h3 style="margin: 0 0 15px 0; color: #212529; font-size: 18px; font-weight: 600;">
          📚 Sales Enablement Resources
        </h3>
        <div style="color: #495057; font-size: 15px;">
          ${data.salesResources.map(r => createListItem(r)).join('')}
        </div>
      </div>
    ` : '';

    const competitiveHtml = data.competitivePosition ? `
      <div style="margin: 25px 0; padding: 20px; background-color: #e7f3ff; border-left: 4px solid #0066cc; border-radius: 4px;">
        <h4 style="margin: 0 0 10px 0; color: #004085; font-size: 16px; font-weight: 600;">
          🎯 Competitive Positioning
        </h4>
        <p style="margin: 0; color: #004085; font-size: 15px;">
          ${data.competitivePosition}
        </p>
      </div>
    ` : '';

    const revenueHtml = data.revenueImpact ? `
      <div style="margin: 25px 0; padding: 20px; background-color: #d4edda; border-left: 4px solid #28a745; border-radius: 4px;">
        <h4 style="margin: 0 0 10px 0; color: #155724; font-size: 16px; font-weight: 600;">
          💰 Expected Revenue Impact
        </h4>
        <p style="margin: 0; color: #155724; font-size: 16px; font-weight: 600;">
          ${data.revenueImpact}
        </p>
      </div>
    ` : '';

    const content = `
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="font-size: 48px; margin-bottom: 10px;">📣</div>
        <h2 style="margin: 0 0 10px 0; color: #212529; font-size: 28px; font-weight: 700;">
          Go-to-Market Launch
        </h2>
        <h3 style="margin: 0 0 10px 0; color: #667eea; font-size: 24px; font-weight: 600;">
          ${data.productName}
        </h3>
        <p style="margin: 0; color: #6c757d; font-size: 16px;">
          Launch Date: ${data.launchDate}
        </p>
      </div>

      <div style="margin: 30px 0; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 6px;">
        <h4 style="margin: 0 0 10px 0; color: #ffffff; font-size: 16px; font-weight: 600;">
          Value Proposition
        </h4>
        <p style="margin: 0; color: #ffffff; font-size: 16px; line-height: 1.6;">
          ${data.valueProposition}
        </p>
      </div>

      ${marketHtml}

      <div style="margin: 30px 0;">
        <h3 style="margin: 0 0 15px 0; color: #212529; font-size: 18px; font-weight: 600;">
          🎯 Key Messaging Points
        </h3>
        <div style="color: #495057; font-size: 15px;">
          ${messagingHtml}
        </div>
      </div>

      ${pricingHtml}
      ${revenueHtml}
      ${competitiveHtml}

      ${data.campaignDetails ? `
        <div style="margin: 25px 0;">
          <h3 style="margin: 0 0 15px 0; color: #212529; font-size: 18px; font-weight: 600;">
            📢 Marketing Campaign
          </h3>
          <p style="margin: 0; color: #495057; font-size: 15px; line-height: 1.6;">
            ${data.campaignDetails}
          </p>
        </div>
      ` : ''}

      ${resourcesHtml}

      <div style="margin: 30px 0; text-align: center;">
        ${data.gtmPlanLink ? createButton('View GTM Plan', data.gtmPlanLink, '#764ba2') : ''}
        ${data.marketingLink ? createButton('Marketing Materials', data.marketingLink, '#667eea') : ''}
      </div>

      <p style="margin: 30px 0 0 0; color: #495057; font-size: 15px; text-align: center;">
        Let's drive this to market success! 🚀
      </p>
    `;

    return wrapInEmailLayout(content, `GTM Launch: ${data.productName}`);
  },
};

/**
 * Get template by email type
 */
export function getTemplateByType(emailType: string): EmailTemplate | null {
  const templates: Record<string, EmailTemplate> = {
    stakeholder_update: stakeholderUpdateTemplate,
    sprint_summary: sprintSummaryTemplate,
    feature_launch: featureLaunchTemplate,
    gtm_announcement: gtmAnnouncementTemplate,
  };

  return templates[emailType] || null;
}
