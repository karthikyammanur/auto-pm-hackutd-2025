# API Routes Directory

All API route handlers for the HackUTD Product Manager automation platform.

## 📁 Directory Structure

```
routes/
├── email-send.route.ts              # Product email automation endpoint
├── slack-notify.route.ts            # Slack notifications endpoint
├── integrations-health.route.ts     # Health check for all services
├── integrations-email.route.ts      # Generic email sending
├── integrations-slack.route.ts      # Generic Slack messaging
├── integrations-confluence.route.ts # Confluence pages management
└── README.md                        # This file
```

## 🔗 Route Mappings

### Email Routes

#### **Product Email** - `/api/email/send`

- **File:** `email-send.route.ts`
- **Methods:** POST, GET
- **Purpose:** Send PM-specific emails (stakeholder updates, sprint summaries, etc.)
- **Endpoint in app/api:** `app/api/email/send/route.ts`

#### **Generic Email** - `/api/integrations/email`

- **File:** `integrations-email.route.ts`
- **Methods:** POST
- **Purpose:** Send standard emails via Resend
- **Endpoint in app/api:** `app/api/integrations/email/route.ts`

---

### Slack Routes

#### **Slack Notifications** - `/api/slack/notify`

- **File:** `slack-notify.route.ts`
- **Methods:** POST, GET
- **Purpose:** Send rich Block Kit notifications to PM team
- **Actions:** `notify`, `thread`, `test`
- **Endpoint in app/api:** `app/api/slack/notify/route.ts`

#### **Generic Slack** - `/api/integrations/slack`

- **File:** `integrations-slack.route.ts`
- **Methods:** POST
- **Purpose:** Send basic Slack messages
- **Types:** `basic`, `formatted`, `workflow`
- **Endpoint in app/api:** `app/api/integrations/slack/route.ts`

---

### Confluence Routes

#### **Confluence Pages** - `/api/integrations/confluence`

- **File:** `integrations-confluence.route.ts`
- **Methods:** POST, GET, PUT
- **Purpose:** Manage Confluence documentation pages
- **Endpoint in app/api:** `app/api/integrations/confluence/route.ts`

---

### Health Routes

#### **Integration Health** - `/api/integrations/health`

- **File:** `integrations-health.route.ts`
- **Methods:** GET
- **Purpose:** Check status of all integration services
- **Endpoint in app/api:** `app/api/integrations/health/route.ts`

---

## 📝 Usage Notes

### Why Two Directories?

The route handlers are stored in **two locations**:

1. **`routes/`** (this directory) - Source of truth, organized for easy navigation
2. **`app/api/`** - Next.js App Router requires routes here for actual endpoints

To use these routes in your Next.js app:

1. **Option A:** Import from `routes/` into `app/api/[endpoint]/route.ts`:

   ```typescript
   // app/api/email/send/route.ts
   export * from "@/routes/email-send.route";
   ```

2. **Option B:** Keep route logic in `routes/`, endpoint files in `app/api/` as wrappers

3. **Option C:** Use these as reference while keeping actual routes in `app/api/`

### Current Status

Currently, the actual Next.js endpoints are still in `app/api/`. The files in this `routes/` directory serve as:

- ✅ **Clean reference** - Easy to find all route logic
- ✅ **Documentation** - Clear API structure
- ✅ **Future migration** - Ready to refactor into shared modules

---

## 🚀 Quick Reference

### Send Product Email

```bash
POST /api/email/send
{
  "recipientEmail": "pm@company.com",
  "emailType": "stakeholder_update",
  "data": { "title": "Update", ... }
}
```

### Send Slack Notification

```bash
POST /api/slack/notify
{
  "action": "notify",
  "channel": "#pm-team",
  "notificationType": "task_completed",
  "payload": { "title": "Done", ... }
}
```

### Check Health

```bash
GET /api/integrations/health
```

### Create Confluence Page

```bash
POST /api/integrations/confluence
{
  "spaceKey": "PROD",
  "title": "API Docs",
  "content": "<h1>Overview</h1>"
}
```

---

## 🔧 Integration with Agents

Routes work seamlessly with LangGraph agents in `lib/agents/`:

- **Email Agent** (`lib/agents/email-agent.ts`) → Uses `email-send.route.ts`
- **Slack Agent** (`lib/agents/slack-notifier-agent.ts`) → Uses `slack-notify.route.ts`

Agents can trigger routes programmatically or via HTTP for external workflows.

---

## 📊 TypeScript Support

All routes are fully typed with:

- Request body validation
- Response type definitions
- Error handling interfaces
- JSDoc documentation

Check each route file for detailed type information.

---

## 🛠️ Development

### Adding a New Route

1. Create `routes/my-new-route.route.ts`
2. Export `GET`, `POST`, `PUT`, `DELETE` handlers
3. Add comprehensive JSDoc documentation
4. Update this README
5. Create corresponding `app/api/my-endpoint/route.ts` if needed

### Testing Routes

```bash
# Start dev server
npm run dev

# Test with curl
curl -X POST http://localhost:3000/api/email/send \
  -H "Content-Type: application/json" \
  -d '{"recipientEmail": "test@example.com", ...}'
```

---

## 📚 Related Documentation

- Email automation: `lib/integrations/email/README.md`
- Slack notifications: `lib/integrations/slack/README.md`
- Integration services: `lib/integrations/README.md`
- LangGraph agents: `lib/agents/`

---

**Last Updated:** November 8, 2025  
**Status:** ✅ All routes organized and documented
