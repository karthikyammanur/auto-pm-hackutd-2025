# PM Automation Integration Services

Production-ready integration modules for Product Manager workflow automation. Provides email, Slack notifications, and Confluence documentation capabilities with comprehensive error handling and TypeScript support.

## Features

- **Email Automation** (Resend) - Transactional emails, bulk sending, notifications
- **Slack Integration** - Channel messages, DMs, formatted notifications, Block Kit
- **Confluence API** - Page creation, updates, search, documentation automation
- **Error Handling** - Custom error classes, retry logic, structured error responses
- **Type Safety** - Full TypeScript support with comprehensive interfaces
- **Configuration Validation** - Built-in validation for all service configurations

## Installation

All required packages are already installed:

```bash
npm install resend @slack/web-api axios --legacy-peer-deps
```

## Configuration

### 1. Copy the environment template

```bash
cp .env.local.example .env.local
```

### 2. Add your API credentials

Edit `.env.local` and add your actual API keys:

```env
# Resend (Email)
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Slack
SLACK_BOT_TOKEN=xoxb-your-bot-token-here
SLACK_DEFAULT_CHANNEL=#general

# Confluence
CONFLUENCE_DOMAIN=yourcompany.atlassian.net
CONFLUENCE_EMAIL=your-email@company.com
CONFLUENCE_API_TOKEN=your_api_token_here
```

### 3. Verify configuration

```typescript
import { checkIntegrationHealth } from "@/lib/integrations";

const health = await checkIntegrationHealth();
console.log("All services configured:", health.allConfigured);
```

## Usage Examples

### Email (Resend)

```typescript
import { sendEmail, sendNotificationEmail } from "@/lib/integrations";

// Basic email
const result = await sendEmail({
  to: "user@example.com",
  subject: "Welcome to PM Automation",
  body: "<h1>Welcome!</h1><p>Get started with our platform.</p>",
});

// Notification email with priority
await sendNotificationEmail({
  to: "admin@example.com",
  title: "System Alert",
  message: "Critical workflow has been triggered",
  priority: "high",
  metadata: {
    workflowId: "12345",
    triggeredBy: "John Doe",
  },
});

// Bulk email
await sendBulkEmail(
  ["user1@example.com", "user2@example.com"],
  "Product Update",
  "<p>Check out our latest features!</p>"
);
```

### Slack

```typescript
import {
  sendSlackMessage,
  sendFormattedNotification,
  sendWorkflowNotification,
} from "@/lib/integrations";

// Basic message
await sendSlackMessage({
  channel: "#general",
  message: "Deployment completed successfully! 🚀",
});

// Formatted notification with fields
await sendFormattedNotification({
  channel: "#alerts",
  title: "Build Status",
  message: "Production build completed",
  type: "success",
  fields: {
    Branch: "main",
    Commit: "abc123",
    Duration: "2m 34s",
  },
  url: "https://github.com/your-repo/actions",
});

// Workflow status update
await sendWorkflowNotification({
  channel: "#workflows",
  workflowName: "Data Pipeline",
  status: "completed",
  duration: "5m 12s",
  details: "Processed 10,000 records",
});

// Direct message
await sendDirectMessage("U1234567890", "Your report is ready!");

// Thread reply
await replyToThread("#general", "1234567890.123456", "Thanks for the update!");
```

### Confluence

```typescript
import {
  createConfluencePage,
  updateConfluencePage,
  createDocumentationPage,
} from "@/lib/integrations";

// Create a page
const result = await createConfluencePage({
  spaceKey: "PROD",
  title: "API Documentation",
  content: "<h1>Overview</h1><p>This is our API documentation.</p>",
  labels: [{ name: "api" }, { name: "documentation" }],
});

if (result.success) {
  console.log("Page URL:", result.data._links.webui);
}

// Update existing page
await updateConfluencePage("123456", {
  title: "Updated API Documentation",
  content: "<h1>New Content</h1>",
});

// Create structured documentation
await createDocumentationPage({
  spaceKey: "PROD",
  title: "Feature Spec: User Authentication",
  sections: [
    { title: "Overview", content: "This feature adds SSO support..." },
    { title: "Requirements", content: "1. Must support OAuth 2.0..." },
    { title: "Implementation", content: "We will use NextAuth.js..." },
  ],
  author: "John Doe",
  labels: ["feature-spec", "authentication"],
});
```

### Multi-Channel Notifications

```typescript
import { notifyMultiChannel } from "@/lib/integrations";

// Send to both email and Slack
await notifyMultiChannel({
  title: "Deployment Complete",
  message: "Version 2.0 is now live in production",
  email: ["team@example.com", "stakeholders@example.com"],
  slackChannel: "#deployments",
  priority: "high",
});
```

## Error Handling

All service functions return a standardized response:

```typescript
import { BaseResponse } from '@/lib/integrations';

const result: BaseResponse<EmailResponse> = await sendEmail({...});

if (result.success) {
  console.log('Email ID:', result.data.id);
} else {
  console.error('Error:', result.error.message);
  console.error('Code:', result.error.code);
}
```

Custom error classes available:

```typescript
import {
  IntegrationError,
  ConfigurationError,
  EmailServiceError,
  SlackServiceError,
  ConfluenceServiceError,
  ValidationError,
  RateLimitError,
  NetworkError,
} from "@/lib/integrations";
```

## API Routes (Next.js App Router)

Create API endpoints to expose integration functionality:

```typescript
// app/api/notifications/email/route.ts
import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/integrations";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = await sendEmail(body);

  return NextResponse.json(result, {
    status: result.success ? 200 : 400,
  });
}
```

## Testing Service Status

```typescript
import { checkIntegrationHealth } from "@/lib/integrations";

// Check all services
const health = await checkIntegrationHealth();

console.log("Email configured:", health.resend.configured);
console.log("Slack available:", health.slack.available);
console.log("Confluence operational:", health.confluence.available);
console.log("All systems go:", health.allOperational);
```

## File Structure

```
lib/integrations/
├── index.ts                  # Main export (use this for imports)
├── types.ts                  # TypeScript interfaces and types
├── config.ts                 # Configuration and validation
├── errors.ts                 # Error classes and handling utilities
├── resend-service.ts         # Email service (Resend)
├── slack-service.ts          # Slack notifications
├── confluence-service.ts     # Confluence documentation
└── README.md                 # This file
```

## Best Practices

1. **Always check configuration before deploying**

   ```typescript
   const status = await checkIntegrationHealth();
   if (!status.allConfigured) {
     throw new Error("Missing integration configuration");
   }
   ```

2. **Use structured error handling**

   ```typescript
   try {
     await sendEmail({...});
   } catch (error) {
     if (isIntegrationError(error)) {
       // Handle integration-specific errors
       console.error(error.code, error.message);
     }
   }
   ```

3. **Leverage retry logic** - All services include built-in retry with exponential backoff

4. **Validate inputs** - Use TypeScript types and runtime validation

5. **Monitor service health** - Implement health checks in your application

## Environment Variables Reference

| Variable                   | Required | Description                                     |
| -------------------------- | -------- | ----------------------------------------------- |
| `RESEND_API_KEY`           | Yes      | Resend API key for email sending                |
| `RESEND_FROM_EMAIL`        | Yes      | Verified sender email address                   |
| `SLACK_BOT_TOKEN`          | Yes      | Slack bot token (xoxb-...)                      |
| `SLACK_DEFAULT_CHANNEL`    | No       | Default channel for notifications               |
| `CONFLUENCE_DOMAIN`        | Yes      | Confluence domain (e.g., company.atlassian.net) |
| `CONFLUENCE_EMAIL`         | Yes      | Email for Confluence authentication             |
| `CONFLUENCE_API_TOKEN`     | Yes      | Confluence API token                            |
| `CONFLUENCE_DEFAULT_SPACE` | No       | Default space key for pages                     |

## Getting API Credentials

- **Resend**: https://resend.com/api-keys
- **Slack**: https://api.slack.com/apps (Create app → OAuth & Permissions)
- **Confluence**: https://id.atlassian.com/manage-profile/security/api-tokens

## Support

For issues or questions about the integration services, check:

1. Configuration validation output
2. Service health check results
3. Error logs with structured error information
