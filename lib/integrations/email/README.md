# Product Manager Email Automation

Robust email automation system for Product Manager workflows using Resend. Supports stakeholder updates, sprint summaries, feature launches, and go-to-market announcements with professional HTML templates.

## 🚀 Features

- **4 Professional Email Templates**

  - Stakeholder Updates
  - Sprint Summaries
  - Feature Launch Announcements
  - Go-to-Market (GTM) Announcements

- **Production-Ready**

  - Comprehensive error handling
  - Rate limiting (100 emails/hour)
  - Input validation
  - TypeScript strict mode
  - Detailed logging

- **LangGraph Integration**

  - Event-driven email triggers
  - Workflow state management
  - Batch processing support

- **Developer-Friendly**
  - Email preview generation
  - Bulk sending support
  - Easy template customization
  - Comprehensive examples

## 📦 Installation

The email module is already set up! Just configure your Resend API key:

```bash
# Add to .env.local
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=noreply@yourcompany.com
```

Get your API key from: https://resend.com/api-keys

## 🎯 Quick Start

### 1. Send Your First Email

```typescript
import { sendProductEmail } from "@/lib/integrations/email";

const result = await sendProductEmail(
  "manager@company.com",
  "stakeholder_update",
  {
    stakeholderName: "John Doe",
    updateTitle: "Q4 Progress Report",
    projectName: "Project Phoenix",
    highlights: [
      "Completed API integration",
      "Launched beta to 100 users",
      "Received positive feedback",
    ],
    progressPercentage: 75,
    nextSteps: ["Begin production rollout", "Finalize documentation"],
  }
);

if (result.success) {
  console.log("Email sent:", result.messageId);
}
```

### 2. Preview Before Sending

```typescript
import { generateEmailPreview } from "@/lib/integrations/email";

const preview = generateEmailPreview("sprint_summary", {
  sprintNumber: "42",
  startDate: "2025-11-01",
  endDate: "2025-11-14",
  storiesCompleted: 18,
  storiesPlanned: 20,
  accomplishments: ["Feature X completed", "Bugs fixed"],
});

console.log("Subject:", preview.subject);
// Write to file for visual inspection
fs.writeFileSync("preview.html", preview.htmlBody);
```

### 3. Use HTTP API

```bash
curl -X POST http://localhost:3000/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "recipientEmail": "manager@company.com",
    "emailType": "feature_launch",
    "data": {
      "featureName": "Dark Mode",
      "launchDate": "2025-12-01",
      "description": "Beautiful dark theme for better UX",
      "benefits": ["Eye comfort", "Modern design", "Energy savings"]
    }
  }'
```

## 📧 Email Types

### Stakeholder Update

Keep stakeholders informed with progress updates.

```typescript
await sendProductEmail("stakeholder@company.com", "stakeholder_update", {
  stakeholderName: "Sarah Johnson",
  updateTitle: "Monthly Progress Update",
  projectName: "Project Phoenix",
  highlights: ["Milestone achieved", "User growth: +25%"],
  progressPercentage: 80,
  nextSteps: ["Launch marketing campaign"],
  reportLink: "https://dashboard.company.com/report",
});
```

**Required fields:**

- `stakeholderName` - Name of the stakeholder
- `updateTitle` - Title of the update
- `highlights` - Array of key points

**Optional fields:**

- `projectName` - Project name
- `progressPercentage` - Progress bar (0-100)
- `nextSteps` - Array of upcoming actions
- `reportLink` - Link to detailed report
- `updateDate` - Date of update

---

### Sprint Summary

Automated sprint retrospectives and summaries.

```typescript
await sendProductEmail("team@company.com", "sprint_summary", {
  sprintNumber: "42",
  teamName: "Phoenix Team",
  startDate: "2025-11-01",
  endDate: "2025-11-14",
  storiesCompleted: 18,
  storiesPlanned: 20,
  pointsCompleted: 45,
  pointsPlanned: 50,
  accomplishments: [
    "Launched new dashboard",
    "Fixed 15 bugs",
    "Improved performance",
  ],
  carryovers: ["Mobile UI (pending review)"],
  blockers: ["Waiting for API access"],
  boardLink: "https://jira.company.com/board",
});
```

**Required fields:**

- `sprintNumber` - Sprint identifier
- `startDate` - Sprint start date
- `endDate` - Sprint end date
- `storiesCompleted` - Number of completed stories
- `storiesPlanned` - Number of planned stories
- `accomplishments` - Array of achievements

**Optional fields:**

- `teamName` - Team name
- `pointsCompleted` - Story points delivered
- `pointsPlanned` - Story points planned
- `carryovers` - Items moved to next sprint
- `blockers` - Current impediments
- `boardLink` - Link to sprint board
- `retroHighlights` - Retrospective notes

---

### Feature Launch

Announce new features with impact.

```typescript
await sendProductEmail("all-staff@company.com", "feature_launch", {
  featureName: "Real-Time Collaboration",
  launchDate: "December 15, 2025",
  description:
    "Teams can now collaborate in real-time with live editing and instant sync.",
  targetAudience: ["Enterprise users", "Remote teams"],
  benefits: [
    "Reduce coordination time by 60%",
    "Zero data loss with conflict resolution",
    "Works offline with smart sync",
  ],
  metrics: ["Adoption rate", "Daily active users"],
  docsLink: "https://docs.company.com/collab",
  demoLink: "https://demo.company.com/collab",
  expectedImpact: "$2M additional annual revenue",
  teamMembers: ["Emma Chen", "Michael Torres"],
});
```

**Required fields:**

- `featureName` - Name of the feature
- `launchDate` - Launch date
- `description` - Feature description
- `benefits` - Array of key benefits

**Optional fields:**

- `targetAudience` - Target user segments
- `metrics` - Success metrics to track
- `docsLink` - Documentation link
- `demoLink` - Demo/walkthrough link
- `expectedImpact` - Business impact
- `teamMembers` - Contributors

---

### GTM Announcement

Coordinate go-to-market launches.

```typescript
await sendProductEmail("sales@company.com", "gtm_announcement", {
  productName: "Analytics Platform v3.0",
  launchDate: "January 10, 2026",
  targetMarket: ["Enterprise SaaS", "Financial services"],
  valueProposition: "10x faster insights with AI-powered analysis",
  messagingPoints: [
    "Lightning-fast performance",
    "AI-powered insights",
    "Compliance-ready",
  ],
  pricing: "Starting at $10,000/month",
  campaignDetails: "Multi-channel launch with webinars and trade shows",
  salesResources: [
    "Sales playbook with objection handling",
    "ROI calculator",
    "Competitive battle cards",
  ],
  gtmPlanLink: "https://internal.company.com/gtm-plan",
  marketingLink: "https://internal.company.com/marketing",
  competitivePosition: "We outperform Tableau on speed by 5x",
  revenueImpact: "$15M ARR in first year",
});
```

**Required fields:**

- `productName` - Product name
- `launchDate` - Launch date
- `targetMarket` - Array of target markets
- `valueProposition` - Value prop statement
- `messagingPoints` - Array of key messages

**Optional fields:**

- `pricing` - Pricing information
- `campaignDetails` - Marketing campaign details
- `salesResources` - Sales enablement materials
- `gtmPlanLink` - GTM plan link
- `marketingLink` - Marketing materials link
- `competitivePosition` - Competitive differentiation
- `revenueImpact` - Expected revenue

## 🔧 Advanced Usage

### With CC Recipients

```typescript
await sendProductEmail("primary@company.com", "stakeholder_update", data, [
  "cc1@company.com",
  "cc2@company.com",
]);
```

### Bulk Sending

```typescript
import { sendBulkProductEmail } from "@/lib/integrations/email";

const results = await sendBulkProductEmail(
  ["user1@company.com", "user2@company.com", "user3@company.com"],
  "feature_launch",
  data
);

const successful = results.filter((r) => r.success).length;
console.log(`Sent ${successful}/${results.length} emails`);
```

### Test Configuration

```typescript
import { sendTestEmail } from "@/lib/integrations/email";

const result = await sendTestEmail("your-email@company.com");
```

## 🤖 LangGraph Integration

Use the Email Agent for workflow-driven automation:

```typescript
import { EmailAgent, createEmailNode } from "@/lib/agents/email-agent";

// Create agent
const emailAgent = new EmailAgent({
  enableLogging: true,
  dryRun: false, // Set true for testing
  defaultCcEmails: ["notifications@company.com"],
});

// Process workflow event
const event = {
  type: "sprint_completed",
  timestamp: new Date(),
  data: {
    recipientEmail: "team@company.com",
    sprintNumber: "43",
    // ... other sprint data
  },
};

const state = await emailAgent.processEvent(event);
if (state.shouldSendEmail) {
  await emailAgent.sendEmail(state);
}

// Or use as LangGraph node
const emailNode = createEmailNode(emailAgent);
// Add to your LangGraph workflow
```

### Event Mapping

The agent automatically maps workflow events to email types:

- `stakeholder_update_triggered` → `stakeholder_update`
- `sprint_completed` → `sprint_summary`
- `feature_launched` → `feature_launch`
- `gtm_launch_initiated` → `gtm_announcement`

## 📁 File Structure

```
lib/integrations/email/
├── index.ts            # Main exports
├── types.ts            # TypeScript types
├── email.ts            # Core email functions
├── templates.ts        # HTML templates
├── examples.ts         # Usage examples
└── README.md           # This file

lib/agents/
└── email-agent.ts      # LangGraph integration

app/api/email/send/
└── route.ts            # HTTP API endpoint
```

## 🎨 Customizing Templates

Templates are in `lib/integrations/email/templates.ts`. Each template has:

1. **Subject line** (can be string or function)
2. **Body generator** (function that returns HTML)
3. **Sender name** (optional)

Example of adding a custom template:

```typescript
export const customTemplate: EmailTemplate = {
  subject: (data: any) => `Custom: ${data.title}`,
  senderName: "Custom Sender",
  generateBody: (data: any) => {
    const content = `
      <h2>Custom Template</h2>
      <p>${data.message}</p>
    `;
    return wrapInEmailLayout(content, data.title);
  },
};
```

## 🔒 Rate Limiting

Built-in rate limiting: 100 emails per hour per sender.

Rate limits are tracked in-memory. For production:

1. Use Redis or similar distributed cache
2. Adjust limits in `email.ts`:

```typescript
const RATE_LIMIT = {
  maxEmails: 100,
  windowMs: 60 * 60 * 1000,
};
```

## ⚡ Performance

- Email generation: < 50ms
- Resend API call: ~ 200-500ms
- Total send time: < 1 second
- Bulk sends: Parallel processing

## 🐛 Error Handling

All functions return a standardized response:

```typescript
interface EmailResponse {
  success: boolean;
  messageId?: string; // Present on success
  error?: string; // Present on failure
}
```

Errors are logged but sanitized before returning to caller.

## 🧪 Testing

### 1. Generate Previews

```typescript
import { generateEmailPreview } from "@/lib/integrations/email";

const preview = generateEmailPreview("sprint_summary", testData);
fs.writeFileSync("test-email.html", preview.htmlBody);
// Open test-email.html in browser
```

### 2. Dry Run Mode (LangGraph)

```typescript
const agent = new EmailAgent({ dryRun: true });
// Emails will be previewed but not sent
```

### 3. Test Configuration

```bash
curl http://localhost:3000/api/email/send
```

## 📊 Monitoring

Logs include:

- Email type and recipient
- Execution time
- Message IDs
- Errors (sanitized)

Example log output:

```
[Email] Sending stakeholder_update to manager@company.com
[Email] Sent successfully in 342ms. ID: abc123xyz
```

## 🚨 Common Issues

### "RESEND_API_KEY is not configured"

Add your API key to `.env.local`:

```bash
RESEND_API_KEY=re_your_key_here
```

### "Rate limit exceeded"

Wait for the rate limit window to reset, or increase limits for your use case.

### "Invalid email address"

Ensure email addresses are properly formatted and valid.

## 📚 API Reference

### Core Functions

- `sendProductEmail(email, type, data, cc?, options?)` - Send an email
- `generateEmailPreview(type, data)` - Generate preview
- `sendBulkProductEmail(emails, type, data, options?)` - Bulk send
- `validateEmailConfiguration()` - Check config
- `sendTestEmail(email)` - Send test email

### Types

All TypeScript types are exported from `@/lib/integrations/email/types`

### Templates

All templates are exported from `@/lib/integrations/email/templates`

## 🎓 Examples

See `lib/integrations/email/examples.ts` for comprehensive examples of:

- All email types
- Bulk sending
- Preview generation
- LangGraph integration
- Error handling

## 💡 Tips

1. **Always test with previews first**
2. **Use meaningful subject lines** - they're searchable
3. **Keep data objects consistent** - helps with templating
4. **Monitor rate limits** - especially for bulk operations
5. **Log message IDs** - for tracking and debugging

## 🔗 Resources

- [Resend Documentation](https://resend.com/docs)
- [Resend API Reference](https://resend.com/docs/api-reference)
- [Email Best Practices](https://resend.com/docs/knowledge-base/email-best-practices)

## 📝 License

Part of HackUTD2 Product Manager Automation Platform

---

**Need help?** Check the examples in `lib/integrations/email/examples.ts` or test your setup with `sendTestEmail()`.
