# AutoPM 🚀

**An AI-Powered Product Management Platform**

AutoPM is a comprehensive AI-driven platform that guides product managers through the entire product development lifecycle—from ideation to execution. Built with cutting-edge AI agents powered by LangGraph and Google Gemini, AutoPM automates and streamlines the product management workflow.

---

## 🌟 Inspiration

Product management is complex. From brainstorming ideas to creating user stories, prioritizing features, aligning with OKRs, designing wireframes, and managing Jira tickets—PMs juggle countless tasks daily. We built AutoPM to empower product managers with AI-powered agents that handle the heavy lifting, allowing them to focus on strategy and decision-making.

---

## 💡 What it does

AutoPM provides an **end-to-end AI-powered workflow** organized in **Spaces** (individual projects), each following a 7-step journey:

### Core Features

#### 🔹 **Step 1: Idea Generation Agent**
- Analyzes your problem statement using internet research (Tavily Search)
- Generates multiple innovative solutions backed by real-world data
- Provides source citations for transparency
- Allows you to select the best solution to move forward

#### 🔹 **Step 2: Story Agent**
- Transforms your selected solution into comprehensive user stories
- Generates acceptance criteria and technical requirements
- Creates detailed markdown documentation
- Structures stories using best practices

#### 🔹 **Step 3: Email Agent**
- Automatically notifies relevant team members about the project
- Searches your Gmail contacts and intelligently selects stakeholders
- Sends personalized emails with project context
- Tracks delivery status for each recipient

#### 🔹 **Step 4: RICE Prioritization Agent**
- Breaks down your solution into implementable features
- Calculates RICE scores (Reach, Impact, Confidence, Effort)
- Provides visual prioritization with sortable tables
- Offers AI-powered analysis and recommendations

#### 🔹 **Step 5: OKR Alignment Agent**
- Analyzes your uploaded OKR documents (PDF)
- Evaluates how your project aligns with organizational objectives
- Provides detailed alignment analysis and recommendations
- Ensures strategic fit before execution

#### 🔹 **Step 6: Wireframe Agent**
- Generates interactive HTML/CSS wireframes for your solution
- Creates multiple pages with realistic UI designs
- Provides live preview with navigation
- Exports production-ready wireframe code

#### 🔹 **Step 7: Jira Integration Agent**
- Automatically creates Jira tickets based on your features
- Assigns tickets to team members from the email list
- Sets priorities based on RICE scores
- Includes descriptions, acceptance criteria, and labels

### Additional Features

#### 🤖 **AI Assistant Chatbot**
- Contextual AI assistant that knows your entire project history
- Answers questions about any step in your workflow
- Provides insights and suggestions
- Available throughout the space

#### 📊 **Market Search & Research**
- Comprehensive market intelligence analysis
- Customer feedback sentiment analysis with themes and pain points
- Industry news and trending topics
- Competitor analysis with growth metrics and strategic insights
- **Context-Aware**: Leverages your space's complete agent history for relevant analysis
- Real-time data from multiple sources
- Beautiful tabbed interface with rich visualizations
- Requires OKR document upload for alignment analysis

---

## 🛠️ How we built it

### Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- React with TypeScript
- Tailwind CSS for styling
- Iconify for icons
- Custom component library

**Backend:**
- Next.js API Routes
- MongoDB with Mongoose
- Auth0 for authentication
- Node.js runtime

**AI & Agents:**
- **LangGraph** - Agent orchestration and workflow management
- **Google Gemini 2.0 Flash** - Large language model
- **LangChain** - AI framework
- **Tavily Search** - Internet research tool
- Structured output with Zod schemas

**Integrations:**
- Gmail API for email operations
- Jira Cloud API for ticket management
- PDF processing for OKR documents

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  (Next.js + React + Tailwind CSS)                           │
└───────────────────┬─────────────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────────────┐
│                    API Routes (Next.js)                      │
│  - Space Management                                          │
│  - Agent Orchestration                                       │
│  - Authentication (Auth0)                                    │
└───────────────────┬─────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│ MongoDB  │ │   AI     │ │  APIs    │
│ Database │ │ Agents   │ │ (Gmail,  │
│          │ │(LangGraph│ │  Jira)   │
└──────────┘ └──────────┘ └──────────┘
```

### Key Technical Decisions

1. **LangGraph for Agent Orchestration** - Enables complex multi-step workflows with state management
2. **Server-Side Rendering** - Next.js App Router for optimal performance
3. **MongoDB Document Model** - Flexible schema for storing agent outputs
4. **Structured Outputs** - Zod schemas ensure type-safe AI responses
5. **Component-Based Architecture** - Reusable React components for each agent view

---

## 🚧 Challenges we ran into

1. **State Synchronization** - Ensuring agent outputs were immediately available to subsequent agents without requiring page refreshes. Solved by implementing strategic `window.location.reload()` after critical state changes.

2. **LangGraph State Management** - Managing complex state across multiple agent nodes while maintaining type safety. Solved by using TypeScript annotations and careful state flow design.

3. **PDF Processing** - Extracting and chunking OKR documents for AI analysis. Implemented using LangChain's PDFLoader with recursive text splitting.

4. **AI Response Consistency** - Getting reliable structured outputs from LLMs. Used `withStructuredOutput()` and Zod validation to enforce schema compliance.

5. **Context Awareness** - Making the Market Search agent understand the full project history. Solved by building comprehensive context summaries from all previous agent outputs.

6. **Gmail API Complexity** - Managing OAuth tokens and email sending permissions. Implemented robust error handling and token refresh logic.

7. **Jira API Rate Limits** - Handling bulk ticket creation efficiently. Added batching and error recovery mechanisms.

---

## 🏆 Accomplishments that we're proud of

✨ **Built a complete AI-powered product management platform in a hackathon timeframe**

✨ **Successfully orchestrated 7+ AI agents** working together seamlessly with LangGraph

✨ **Integrated multiple complex APIs** (Gmail, Jira) with production-ready error handling

✨ **Created beautiful, intuitive UI** with custom components and smooth animations

✨ **Implemented context-aware AI** that leverages entire project history for intelligent insights

✨ **Generated real, production-ready outputs** including:
- Comprehensive user stories
- Interactive wireframes with live preview
- Actual Jira tickets in user's workspace
- Automated stakeholder emails

✨ **Built market research agent** that provides comprehensive competitive intelligence

✨ **Achieved end-to-end workflow automation** from problem statement to Jira tickets

---

## 📚 What we learned

### Technical Learnings

- **LangGraph Workflows** - How to design and implement complex multi-agent systems
- **AI Prompt Engineering** - Crafting prompts for consistent, high-quality outputs
- **PDF Document Processing** - Techniques for extracting and analyzing structured documents
- **State Management at Scale** - Managing complex application state across multiple agents
- **API Integration Patterns** - Best practices for third-party API integration

### Product Learnings

- **PM Workflow Optimization** - Understanding the actual pain points PMs face daily
- **Context Matters** - AI agents are exponentially more valuable when they understand project history
- **Progressive Disclosure** - Breaking complex workflows into digestible steps improves UX
- **Visual Feedback** - Real-time progress indicators and rich visualizations enhance trust

### Team Learnings

- **Rapid Prototyping** - Building production-quality features under time constraints
- **Architecture Planning** - Importance of planning scalable architecture upfront
- **Testing Strategies** - Balancing comprehensive testing with rapid development

---

## 🚀 What's next for AutoPM

### Immediate Roadmap

🔹 **Real-time Collaboration**
- Live editing and commenting on agent outputs
- Team member notifications and activity feeds
- Shared spaces for collaborative product development

🔹 **Enhanced Analytics**
- Dashboard with project metrics and insights
- Time tracking and velocity measurements
- Success rate analysis for predictions vs. reality

🔹 **More Agent Types**
- **Requirements Agent** - Generate PRDs and technical specifications
- **Risk Assessment Agent** - Identify potential project risks
- **Budget Planning Agent** - Estimate costs and resources
- **Testing Strategy Agent** - Create comprehensive test plans

### Advanced Features

🔹 **AI-Powered Roadmapping**
- Visual timeline generation
- Dependency mapping between features
- Resource allocation optimization

🔹 **Integration Expansion**
- Slack integration for notifications
- Confluence for documentation
- Linear, Asana, Monday.com support
- GitHub/GitLab for engineering sync

🔹 **Custom Agent Builder**
- No-code interface to create custom agents
- Template library for common PM tasks
- Agent marketplace for sharing workflows

🔹 **Advanced Market Research**
- Real-time competitive monitoring
- Social listening and sentiment tracking
- Trend prediction using ML models
- Automated SWOT analysis

🔹 **Enterprise Features**
- Role-based access control
- Audit logs and compliance
- Custom branding and white-labeling
- SSO integration

### Long-term Vision

Transform AutoPM into the **operating system for product management teams**—where AI handles routine tasks, provides intelligent recommendations, and empowers PMs to focus on strategy, creativity, and human connection.

---

## 🎯 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB instance
- Auth0 account
- Google API key (Gemini)
- Tavily API key
- (Optional) Gmail API credentials
- (Optional) Jira API credentials

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/autopm.git
cd autopm

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run the development server
npm run dev
```

Visit `http://localhost:3000` to start using AutoPM!

---

## 📝 Environment Variables

```env
# Auth0
AUTH0_SECRET=
AUTH0_BASE_URL=
AUTH0_ISSUER_BASE_URL=
AUTH0_CLIENT_ID=
AUTH0_CLIENT_SECRET=

# MongoDB
MONGODB_URI=

# Google AI
GOOGLE_API_KEY=

# Tavily Search
TAVILY_API_KEY=

# Gmail (Optional)
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
GMAIL_REFRESH_TOKEN=

# Jira (Optional)
JIRA_DOMAIN=
JIRA_EMAIL=
JIRA_API_TOKEN=
```

---

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for more details.

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- **Google Gemini** for powerful AI capabilities
- **LangGraph** for agent orchestration
- **Tavily** for internet search
- **Auth0** for authentication
- All the amazing open-source libraries that made this possible

---

**Built with ❤️ for HackUTD 2024**
