# Slack Notification System for PM Workflows

Real-time Slack notifications for Product Manager workflow updates. Get instant alerts when agents complete tasks, analyses are ready, approvals are needed, or errors occur.

## 🎯 Features

- **4 Notification Types**

  - `task_completed` - Agent finished a task (user stories, wireframes, etc.)
  - `analysis_ready` - Research/analysis ready for review
  - `approval_needed` - PM approval required
  - `error_alert` - Critical errors requiring attention

- **Rich Formatting with Slack Block Kit**

  - Color-coded priority levels (low/medium/high/critical)
  - Metadata displayed as key-value pairs
  - Action buttons for quick access
  - Emoji indicators
  - Timestamps

- **Advanced Features**
  - Threaded replies for follow-ups
  - User and channel mentions
  - Batch notifications with rate limiting
  - Automatic retry with exponential backoff (max 3 attempts)
  - Channel validation before sending
  - Link formatting helpers (Jira, Confluence, URLs)

## 📦 Setup

### 1. Get Slack Bot Token

1. Go to https://api.slack.com/apps
2. Create a new app or select existing app
3. Go to **OAuth & Permissions**
4. Add these bot token scopes:
   - `chat:write` - Send messages
   - `chat:write.public` - Send to public channels without joining
   - `channels:read` - Validate channel existence
5. Install app to workspace
6. Copy the **Bot User OAuth Token** (starts with `xoxb-`)

### 2. Configure Environment Variables

Add to `.env.local`:

```bash
# Required
SLACK_BOT_TOKEN=xoxb-your-bot-token-here

# Optional (recommended)
SLACK_DEFAULT_CHANNEL=#pm-notifications

# Optional (for link formatting)
JIRA_DOMAIN=yourcompany.atlassian.net
CONFLUENCE_DOMAIN=yourcompany.atlassian.net
```

### 3. Invite Bot to Channels

For each channel you want to send notifications to:

```
/invite @YourBotName
```

Or use `chat:write.public` scope to send without joining.

## 🚀 Quick Start

### Send Your First Notification

```typescript
import { sendSlackNotification } from "@/lib/integrations/slack";

const result = await sendSlackNotification(
  "#pm-team",
  "task_completed",
  {
    title: "User Stories Created",
    description: "LangGraph agent generated 5 user stories for Mobile App v2",
    metadata: {
      Project: "Mobile App v2",
      Stories: "5",
      Agent: "story-generator",
    },
    actionUrl: "https://jira.company.com/browse/MOBILE-123",
    priority: "medium",
  },
  {
    mentionUsers: ["U123456"], // Mention the PM
  }
);

if (result.success) {
  console.log("Notification sent! Message TS:", result.messageTs);
}
```

### Test the Integration

```typescript
import { sendTestNotification } from "@/lib/integrations/slack";

// Test with default channel
await sendTestNotification();

// Test with specific channel
await sendTestNotification("#test-channel");
```

### Use HTTP API

```bash
# Send notification
curl -X POST http://localhost:3000/api/slack/notify \
  -H "Content-Type: application/json" \
  -d '{
    "action": "notify",
    "channel": "#pm-team",
    "notificationType": "task_completed",
    "payload": {
      "title": "Analysis Complete",
      "description": "Competitor analysis ready for review",
      "priority": "high"
    }
  }'

# Check configuration
curl http://localhost:3000/api/slack/notify
```

## 📋 Notification Types

### Task Completed

Agent finished a task - user story creation, wireframe generation, etc.

```typescript
await sendSlackNotification("#pm-team", "task_completed", {
  title: "Wireframes Complete",
  description: "Design agent created 8 wireframes for the dashboard feature",
  metadata: {
    Feature: "Analytics Dashboard",
    Screens: "8",
    Agent: "design-agent",
  },
  actionUrl: "https://figma.com/file/abc123",
  priority: "medium",
});
```

**Visual Style:** ✅ Green checkmark, blue border (medium priority)

---

### Analysis Ready

Research, competitor analysis, or data analysis is complete.

```typescript
await sendSlackNotification("#product-analytics", "analysis_ready", {
  title: "Competitor Analysis Complete",
  description: "Analyzed 5 competitors with key insights and recommendations",
  metadata: {
    Competitors: "5",
    Markets: "Enterprise SaaS, SMB",
    Confidence: "95%",
  },
  actionUrl: "https://confluence.company.com/analysis",
  priority: "high",
});
```

**Visual Style:** 📊 Chart emoji, orange border (high priority)

---

### Approval Needed

PM approval required before proceeding.

```typescript
await sendSlackNotification(
  "#pm-approvals",
  "approval_needed",
  {
    title: "Roadmap Review Required",
    description: "Q1 2026 roadmap needs final approval before dev planning",
    metadata: {
      Features: "15",
      Deadline: "Nov 15, 2025",
    },
    actionUrl: "https://docs.company.com/roadmap",
    priority: "high",
  },
  {
    mentionUsers: ["U123456"], // Mention PM
  }
);
```

**Visual Style:** ⚠️ Warning emoji, orange border, mentions PM

---

### Error Alert

Critical error or issue requiring immediate attention.

```typescript
await sendSlackNotification(
  "#pm-alerts",
  "error_alert",
  {
    title: "Agent Execution Failed",
    description: "Data sync agent encountered API rate limit error",
    metadata: {
      Agent: "data-sync-agent",
      Error: "Rate limit exceeded",
      Impact: "Data sync delayed",
    },
    actionUrl: "https://logs.company.com/error/abc123",
    priority: "critical",
  },
  {
    mentionUsers: ["U123456", "U789012"], // Mention PM and Tech Lead
  }
);
```

**Visual Style:** 🚨 Alert emoji, red border, critical priority badge

## 🎨 Priority Levels

Priority affects the visual styling and attention level:

| Priority   | Color     | Use Case               | Visual Indicator            |
| ---------- | --------- | ---------------------- | --------------------------- |
| `low`      | 🟢 Green  | Informational updates  | -                           |
| `medium`   | 🔵 Blue   | Normal tasks           | -                           |
| `high`     | 🟠 Orange | Needs attention soon   | Priority badge              |
| `critical` | 🔴 Red    | Urgent action required | Priority badge + red button |

```typescript
// Low priority - FYI
priority: "low";

// Medium priority - normal workflow
priority: "medium";

// High priority - review soon
priority: "high";

// Critical priority - urgent
priority: "critical";
```

## 🧵 Threaded Conversations

Send follow-up messages in a thread to keep context together:

```typescript
// Send initial notification
const initial = await sendSlackNotification("#pm-team", "task_completed", {
  title: "Sprint Planning Started",
  description: "Agent generating sprint plan for Sprint 43",
  priority: "medium",
});

// Send progress updates in thread
if (initial.success && initial.messageTs) {
  await sendSlackThread(
    "#pm-team",
    initial.messageTs,
    "⏳ Analyzing backlog... 50 items found"
  );

  await sendSlackThread(
    "#pm-team",
    initial.messageTs,
    "✅ Sprint plan complete! 18 stories assigned"
  );
}
```

## 🔗 Link Formatting

Use helpers to create clickable links in Slack:

```typescript
import {
  formatJiraLink,
  formatConfluenceLink,
  formatSlackLink,
} from "@/lib/integrations/slack";

// Jira issue link
const jira = formatJiraLink("PROJ-123");
// Returns: <https://jira.company.com/browse/PROJ-123|PROJ-123>

// Confluence page link
const confluence = formatConfluenceLink("12345678", "Product Roadmap");
// Returns: <https://confluence.company.com/.../12345678|Product Roadmap>

// Custom URL link
const url = formatSlackLink("https://example.com", "View Details");
// Returns: <https://example.com|View Details>

// Use in notification
await sendSlackNotification("#pm-team", "task_completed", {
  title: "Requirements Updated",
  description: `See ${jira} for details. Full doc: ${confluence}`,
  priority: "medium",
});
```

## 👥 Mentions

Mention users, channels, or groups:

```typescript
import {
  mentionUser,
  mentionChannel,
  mentionHere,
  mentionEveryone,
} from "@/lib/integrations/slack";

// Mention specific users
const pm = mentionUser("U123456");
const lead = mentionUser("U789012");

await sendSlackNotification("#pm-team", "approval_needed", {
  title: "Review Needed",
  description: `${pm} and ${lead} - please review the design`,
  priority: "high",
});

// Mention a channel
const designChannel = mentionChannel("C987654");
// Returns: <#C987654>

// Notify active users in channel
mentionHere(); // Returns: <!here>

// Notify all users in channel (use sparingly!)
mentionEveryone(); // Returns: <!channel>
```

**Tip:** Get user IDs from Slack by right-clicking a user → Copy → Copy member ID

## 📊 Batch Notifications

Send multiple notifications with rate limiting:

```typescript
import { sendBatchNotifications } from "@/lib/integrations/slack";

const notifications = [
  {
    channel: "#pm-team",
    type: "task_completed",
    payload: {
      title: "Daily Summary",
      description: "Today's completed tasks",
      priority: "low",
    },
  },
  {
    channel: "#pm-team",
    type: "analysis_ready",
    payload: {
      title: "Weekly Analytics",
      description: "User behavior analysis",
      priority: "medium",
    },
  },
];

const results = await sendBatchNotifications(notifications, 1000); // 1s delay
const successful = results.filter((r) => r.success).length;
console.log(`Sent ${successful}/${results.length} notifications`);
```

## 🔄 Retry Logic

All notifications automatically retry on failure:

- **Max attempts:** 3
- **Backoff:** Exponential (1s, 2s, 4s)
- **Retries on:** Network errors, rate limits, temporary failures
- **No retry on:** Invalid channel, auth errors, bad requests

```typescript
const result = await sendSlackNotification(...);

if (result.success) {
  console.log(`Sent successfully`);
  if (result.retryCount > 0) {
    console.log(`Required ${result.retryCount} retries`);
  }
}
```

## 🌐 HTTP API Reference

### POST /api/slack/notify

Send a notification via HTTP.

**Request:**

```json
{
  "action": "notify",
  "channel": "#pm-team",
  "notificationType": "task_completed",
  "payload": {
    "title": "Task Complete",
    "description": "Agent finished the task",
    "metadata": {
      "Agent": "story-generator",
      "Count": "5"
    },
    "actionUrl": "https://example.com",
    "priority": "medium"
  },
  "options": {
    "mentionUsers": ["U123456"]
  }
}
```

**Response:**

```json
{
  "success": true,
  "messageTs": "1699473600.123456",
  "channel": "C1234567890",
  "retryCount": 0
}
```

---

### POST /api/slack/notify (Thread Reply)

Send a threaded reply.

**Request:**

```json
{
  "action": "thread",
  "channel": "#pm-team",
  "threadTs": "1699473600.123456",
  "message": "Follow-up message",
  "options": {
    "mentionUsers": ["U123456"]
  }
}
```

---

### POST /api/slack/notify (Test)

Send a test notification.

**Request:**

```json
{
  "action": "test",
  "channel": "#test-channel"
}
```

---

### GET /api/slack/notify

Check Slack configuration status.

**Response:**

```json
{
  "success": true,
  "configured": true,
  "hasToken": true,
  "defaultChannel": "#pm-notifications",
  "status": "ready",
  "message": "Slack integration is configured and ready"
}
```

## 💡 Real-World Examples

### Sprint Planning Workflow

```typescript
// Start notification
const start = await sendSlackNotification("#pm-team", "task_completed", {
  title: "Sprint Planning Started",
  description: "AI analyzing backlog for Sprint 44",
  metadata: { "Backlog Items": "87" },
  priority: "medium",
});

// Progress updates in thread
await sendSlackThread(
  start.channel!,
  start.messageTs!,
  "📝 Selected 20 stories"
);

await sendSlackThread(
  start.channel!,
  start.messageTs!,
  "✅ Sprint plan complete - 48 points"
);

// Final approval request
await sendSlackNotification(
  "#pm-team",
  "approval_needed",
  {
    title: "Sprint Plan Ready",
    description: "20 stories, 48 points. Approve to proceed.",
    actionUrl: "https://jira.company.com/sprint/44",
    priority: "high",
  },
  { mentionUsers: ["U123456"] }
);
```

### Error Monitoring

```typescript
try {
  // Agent execution
  await runDataSyncAgent();
} catch (error) {
  // Alert team immediately
  await sendSlackNotification(
    "#pm-alerts",
    "error_alert",
    {
      title: "Data Sync Failed",
      description: `Agent error: ${error.message}`,
      metadata: {
        Agent: "data-sync-agent",
        Time: new Date().toLocaleString(),
        Impact: "Data sync delayed",
      },
      priority: "critical",
    },
    {
      mentionUsers: ["U123456", "U789012"], // PM + Tech Lead
    }
  );
}
```

## 🐛 Troubleshooting

### "Channel not found or bot doesn't have access"

**Solution:**

1. Invite bot to channel: `/invite @YourBotName`
2. Or add `chat:write.public` scope to bot
3. Use channel ID instead of name: `C1234567890`

### "SLACK_BOT_TOKEN is not configured"

**Solution:**
Add to `.env.local`:

```bash
SLACK_BOT_TOKEN=xoxb-your-token-here
```

### "Invalid token"

**Solution:**

1. Verify token starts with `xoxb-`
2. Regenerate token in Slack App settings
3. Make sure bot is installed to workspace

### Messages not formatted correctly

**Solution:**

- Check that metadata values are strings
- Ensure actionUrl is a valid URL
- Verify priority is one of: low, medium, high, critical

## 📚 API Reference

### Core Functions

```typescript
// Send notification
sendSlackNotification(
  channel: string,
  notificationType: NotificationType,
  payload: SlackNotificationPayload,
  options?: SlackNotificationOptions
): Promise<SlackNotificationResponse>

// Send thread reply
sendSlackThread(
  channel: string,
  threadTs: string,
  message: string,
  options?: Options
): Promise<SlackNotificationResponse>

// Send test notification
sendTestNotification(
  testChannel?: string
): Promise<SlackNotificationResponse>

// Send batch notifications
sendBatchNotifications(
  notifications: Array<NotificationConfig>,
  delayMs?: number
): Promise<SlackNotificationResponse[]>
```

### Types

```typescript
type NotificationType =
  | "task_completed"
  | "analysis_ready"
  | "approval_needed"
  | "error_alert";

type Priority = "low" | "medium" | "high" | "critical";

interface SlackNotificationPayload {
  title: string;
  description: string;
  metadata?: Record<string, string>;
  actionUrl?: string;
  priority?: Priority;
}

interface SlackNotificationResponse {
  success: boolean;
  messageTs?: string;
  channel?: string;
  error?: string;
  retryCount?: number;
}
```

## 📁 File Structure

```
lib/integrations/
├── slack.ts              # Main notification functions
├── slack-examples.ts     # Usage examples
└── config.ts             # Configuration

app/api/slack/notify/
└── route.ts              # HTTP API endpoint
```

## 🎓 Best Practices

1. **Use appropriate priority levels** - Critical should be rare
2. **Include actionUrl** - Makes notifications actionable
3. **Add metadata** - Provides context without cluttering description
4. **Use threads for updates** - Keeps related messages together
5. **Test in a test channel first** - Use `sendTestNotification()`
6. **Mention sparingly** - Don't overuse @here or @channel
7. **Handle errors gracefully** - Check `result.success` before assuming sent

## 🔗 Resources

- [Slack Block Kit Builder](https://app.slack.com/block-kit-builder) - Design message layouts
- [Slack API Documentation](https://api.slack.com/docs) - Official docs
- [Message Formatting](https://api.slack.com/reference/surfaces/formatting) - Text formatting guide

## 📝 Examples File

See `lib/integrations/slack-examples.ts` for 12 comprehensive examples including:

- Task completed notifications
- Analysis ready alerts
- Approval requests
- Error alerts
- Threaded conversations
- Formatted links
- Batch notifications
- Priority levels
- User mentions
- Sprint planning workflow
- Error recovery

---

**Need help?** Run `sendTestNotification()` to verify your setup!
