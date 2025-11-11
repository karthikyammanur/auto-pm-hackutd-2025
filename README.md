# AutoPM — AI-Powered Product Management Copilot

## Inspiration

PMs juggle ideation, user stories, prioritization, OKR alignment, wireframes, emails, and Jira—all under time pressure. We built AutoPM to offload the busywork to specialized AI agents so PMs can focus on strategy and decisions. 

## What it does

AutoPM runs an end-to-end PM workflow inside a “Space” (one project), powered by LangGraph agents:

* **Idea Generation**: Researches your problem, proposes multiple data-backed solutions, with sources.
* **Story Agent**: Expands your chosen solution into user stories, acceptance criteria, and tech notes.
* **Market Research**: Conducts a web search for customer feedback, industry trends and competitor analysis.
* **Story Agent**: Expands your chosen solution into user stories, acceptance criteria, and tech notes.
* **Email Agent**: Drafts stakeholder updates and sends via Gmail with delivery tracking.
* **RICE Agent**: Breaks work into features and prioritizes with sortable RICE scoring.
* **OKR Alignment**: Analyzes your uploaded OKRs (PDF) and maps proposed work to org goals.
* **Wireframe Agent**: Generates interactive HTML/CSS mockups with multi-page navigation.
* **Jira Agent**: Creates tickets (descriptions, AC, labels, assignees) based on RICE.

**NOTE: THIS PROJECT USES THE GEMINI API FOR ALL 8 AGENTS!!**

Plus a **context-aware AI assistant** that knows your project history and a **market research panel** (competitors, activity signals, trends) that avoids black-box “sentiment scores”—we extract themes and pain points instead. 

## How we built it

* **AI & Orchestration**: LangGraph + LangChain, Google Gemini 2.0 Flash, Zod-validated structured outputs.
* **Integrations**: Tavily search, Gmail API, Jira Cloud, PDF ingestion for OKRs. 
* **Frontend**: Next.js 14, React (TS), Tailwind, custom components.
* **Backend**: Next.js API routes, Node.js, MongoDB/Mongoose, Auth0.

## Challenges

* **Cross-agent state**: Keeping outputs instantly usable by the next agent.
* **Typed graph design**: Enforcing schema guarantees across nodes.
* **PDF chunking quality**: Reliable OKR extraction for alignment.
* **API ergonomics**: OAuth flows, rate limits, and robust retries/batching. 

## Accomplishments

* Orchestrated **7+ cooperating agents** with consistent, type-safe outputs.
* Generated **real artifacts** end-to-end: stories, wireframes, emails, and live Jira tickets.
* Built a **clean, intuitive UI** with smooth progress feedback.
* Implemented **context-aware research** that leverages prior agent outputs. 

## What we learned

* Designing resilient LangGraph workflows and schema-first prompts.
* Treating “context as a product” massively boosts perceived AI quality.
* Progressive disclosure and visual feedback reduce cognitive load.
* Balancing hackathon speed with production-grade error handling. 


## Tech Stack

LangGraph • LangChain • Google Gemini • Tavily •Next.js • React/TypeScript • Tailwind • MongoDB • Auth0 •  Gmail API • Jira Cloud • Zod. 
