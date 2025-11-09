# API Agents & Routes Structure

Clean organization of agents and routes following consistent folder structure.

## 📁 Directory Structure

```
app/api/
├── agents/                    # LangGraph workflow agents
│   ├── email/
│   │   ├── route.ts          # API endpoint
│   │   └── tools.ts          # Agent logic
│   │
│   └── slack/
│       ├── route.ts          # API endpoint
│       └── tools.ts          # Agent logic
│
└── routes/                    # API route handlers
    ├── email-send.route.ts
    ├── slack-notify.route.ts
    ├── integrations-health.route.ts
    ├── integrations-email.route.ts
    ├── integrations-slack.route.ts
    ├── integrations-confluence.route.ts
    └── README.md
```

## 🤖 Agents

### Email Agent (`/api/agents/email`)

**Purpose:** Automate Product Manager email workflows via LangGraph

**Files:**
- `route.ts` - HTTP endpoint for triggering email agent
- `tools.ts` - EmailAgent class and LangGraph integration

**API Usage:**
```bash
POST /api/agents/email
{
  "eventType": "sprint_completed",
  "data": {
    "recipientEmail": "pm@company.com",
    "sprintNumber": "43",
    "storiesCompleted": 18,
    "storiesPlanned": 20
  }
}
```

**Import Usage:**
```typescript
import { EmailAgent, createEmailNode } from '@/app/api/agents/email/tools';

const agent = new EmailAgent();
const emailNode = createEmailNode(agent);
```

---

### Slack Agent (`/api/agents/slack`)

**Purpose:** Send Slack notifications when agents complete tasks

**Files:**
- `route.ts` - HTTP endpoint for triggering Slack notifications
- `tools.ts` - SlackNotifierAgent class and LangGraph integration

**API Usage:**
```bash
POST /api/agents/slack
{
  "eventType": "user_stories_created",
  "data": {
    "title": "User Stories Created",
    "description": "5 stories generated",
    "metadata": { "Stories": "5" }
  }
}
```

**Import Usage:**
```typescript
import { SlackNotifierAgent, createSlackNotifierNode } from '@/app/api/agents/slack/tools';

const agent = new SlackNotifierAgent();
const slackNode = createSlackNotifierNode(agent);
```

---

## 📮 Routes

Centralized API route handlers in `/api/routes/`

See `app/api/routes/README.md` for detailed documentation.

---

## 🔄 Structure Benefits

### Consistent Pattern

Each agent follows the same structure:
```
agent-name/
├── route.ts     # HTTP endpoint
└── tools.ts     # Agent logic & LangGraph helpers
```

### Easy Navigation

- All agents in `app/api/agents/`
- All routes in `app/api/routes/`
- Clear separation of concerns

### Scalability

Add new agents by creating a new folder:
```bash
app/api/agents/new-agent/
├── route.ts
└── tools.ts
```

---

## 🚀 Quick Reference

### Agent Endpoints

| Agent | Endpoint | Purpose |
|-------|----------|---------|
| Email | `/api/agents/email` | Email automation |
| Slack | `/api/agents/slack` | Slack notifications |

### Integration Endpoints

| Route | Endpoint | Purpose |
|-------|----------|---------|
| Email Send | `/api/email/send` | Product emails |
| Slack Notify | `/api/slack/notify` | Slack messages |
| Health | `/api/integrations/health` | Health check |

---

## 📝 Usage Examples

### Using Agents in LangGraph

```typescript
import { EmailAgent } from '@/app/api/agents/email/tools';
import { SlackNotifierAgent } from '@/app/api/agents/slack/tools';

// Create agents
const emailAgent = new EmailAgent({ enableLogging: true });
const slackAgent = new SlackNotifierAgent({ defaultChannel: '#pm-team' });

// Process events
const emailState = await emailAgent.processEvent(event);
const slackState = await slackAgent.processEvent(event);

// Execute actions
if (emailState.shouldSendEmail) {
  await emailAgent.sendEmail(emailState);
}

if (slackState.shouldNotify) {
  await slackAgent.sendNotification(slackState);
}
```

### Using Agents via HTTP

```bash
# Trigger email agent
curl -X POST http://localhost:3000/api/agents/email \
  -H "Content-Type: application/json" \
  -d '{"eventType": "sprint_completed", "data": {...}}'

# Trigger Slack agent  
curl -X POST http://localhost:3000/api/agents/slack \
  -H "Content-Type: application/json" \
  -d '{"eventType": "task_completed", "data": {...}}'
```

---

## ✅ Migration Complete

All agents and routes are now organized following the consistent folder structure pattern.

**Last Updated:** November 8, 2025
