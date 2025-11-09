# PM Automation - Integration Setup Guide

Quick start guide for setting up the Resend, Slack, and Confluence integrations.

## ✅ Installation Complete

All required packages have been installed:

- `resend` - Email service
- `@slack/web-api` - Slack integration
- `axios` - HTTP client for Confluence API

## 📋 Next Steps

### 1. Configure Environment Variables

Copy the example file and add your API credentials:

```powershell
Copy-Item .env.local.example .env.local
```

Then edit `.env.local` with your actual credentials.

### 2. Get API Credentials

#### Resend (Email)

1. Sign up at https://resend.com
2. Go to https://resend.com/api-keys
3. Create a new API key
4. Add to `.env.local`: `RESEND_API_KEY=re_...`
5. Verify a domain or use their test domain

#### Slack

1. Go to https://api.slack.com/apps
2. Create a new app (or use existing)
3. Go to "OAuth & Permissions"
4. Add bot token scopes:
   - `chat:write`
   - `channels:read`
   - `users:read`
5. Install app to workspace
6. Copy "Bot User OAuth Token" (starts with `xoxb-`)
7. Add to `.env.local`: `SLACK_BOT_TOKEN=xoxb-...`

#### Confluence

1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Create API token
3. Add to `.env.local`:
   - `CONFLUENCE_DOMAIN=yourcompany.atlassian.net`
   - `CONFLUENCE_EMAIL=your-email@company.com`
   - `CONFLUENCE_API_TOKEN=your_token`

### 3. Test the Integration

Start your dev server if not already running:

```powershell
npm run dev
```

Test the health check endpoint:

```powershell
curl http://localhost:3000/api/integrations/health
```

You should see a response with the status of all three services.

## 🚀 Usage Examples

### In API Routes

```typescript
// app/api/your-route/route.ts
import {
  sendEmail,
  sendSlackMessage,
  createConfluencePage,
} from "@/lib/integrations";

export async function POST(request: Request) {
  // Send email
  await sendEmail({
    to: "user@example.com",
    subject: "Hello",
    body: "<p>Welcome!</p>",
  });

  // Send Slack notification
  await sendSlackMessage({
    channel: "#general",
    message: "Task completed!",
  });

  // Create Confluence page
  await createConfluencePage({
    spaceKey: "PROD",
    title: "Documentation",
    content: "<h1>Content</h1>",
  });

  return Response.json({ success: true });
}
```

### Test API Endpoints

```powershell
# Test email
curl -X POST http://localhost:3000/api/integrations/email `
  -H "Content-Type: application/json" `
  -d '{"to":"test@example.com","subject":"Test","body":"<p>Hello!</p>"}'

# Test Slack
curl -X POST http://localhost:3000/api/integrations/slack `
  -H "Content-Type: application/json" `
  -d '{"channel":"#general","message":"Hello from API!"}'

# Test Confluence
curl -X POST http://localhost:3000/api/integrations/confluence `
  -H "Content-Type: application/json" `
  -d '{"spaceKey":"PROD","title":"Test Page","content":"<p>Test</p>"}'
```

## 📁 File Structure

```
lib/integrations/
├── index.ts                    # Main exports
├── types.ts                    # TypeScript interfaces
├── config.ts                   # Configuration & validation
├── errors.ts                   # Error handling
├── resend-service.ts           # Email service
├── slack-service.ts            # Slack service
├── confluence-service.ts       # Confluence service
└── README.md                   # Full documentation

app/api/integrations/
├── health/route.ts             # Health check endpoint
├── email/route.ts              # Email API
├── slack/route.ts              # Slack API
└── confluence/route.ts         # Confluence API
```

## 🔍 Troubleshooting

### Configuration Issues

Check service status:

```typescript
import { checkIntegrationHealth } from "@/lib/integrations";
const health = await checkIntegrationHealth();
console.log(health);
```

### Common Errors

**"Configuration is invalid"**

- Check that all required environment variables are set in `.env.local`
- Restart your dev server after changing `.env.local`

**"Invalid bot token"**

- Slack token must start with `xoxb-`
- Make sure you copied the Bot User OAuth Token, not the App token

**"Authentication failed"**

- For Confluence, verify email and API token are correct
- Check that domain doesn't include `https://` or trailing slashes

## 📚 Full Documentation

See `lib/integrations/README.md` for complete API documentation, examples, and best practices.

## 🎯 What's Next?

Now that integrations are set up, you can:

1. Build workflow automation triggers
2. Create notification systems
3. Auto-generate documentation
4. Set up alerts and monitoring
5. Build multi-channel communication flows

Happy automating! 🚀
