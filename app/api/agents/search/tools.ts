import { DynamicStructuredTool } from "@langchain/core/tools";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { StateGraph, Annotation } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import { TavilySearch } from "@langchain/tavily";

// Tavily search tool
const internetSearchTool = new TavilySearch({
  maxResults: 3,
});

// Schema for the analysis result
export const IdeaAnalysisSchema = z.object({
  title: z.string().describe("The title of the identified problem"),
  summary: z.string().describe("A summary of the problem identified and the solution approach from research"),
  solutions: z.array(z.string()).describe("An array of potential solutions for the user"),
  sources: z.array(z.string()).describe("An array of sources (URLs or references) used during research"),
});

export type IdeaAnalysis = z.infer<typeof IdeaAnalysisSchema>;

// Initialize models
const agentModel = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash-exp",
  temperature: 0.7,
  apiKey: process.env.GOOGLE_API_KEY,
});

// Create the react agent with tools
const ideaAgentHandler = createReactAgent({
  llm: agentModel,
  tools: [internetSearchTool],
});

const structuredOutputModel = agentModel.withStructuredOutput(IdeaAnalysisSchema);

// State annotation for LangGraph
const StateAnnotation = Annotation.Root({
  userQuery: Annotation<string>,
  researchData: Annotation<string>,
  sources: Annotation<string[]>,
  analysis: Annotation<IdeaAnalysis | null>,
});

// Node 1: Research the problem using the agent with internet search
async function researchProblem(state: typeof StateAnnotation.State) {
  console.log("1. Starting research phase for query:", state.userQuery);

  const result = await ideaAgentHandler.invoke({
    messages: [
      new SystemMessage(`
        You are an expert problem analyzer and solution architect with access to internet search via the tavily_search tool.

        CRITICAL: You MUST use the tavily_search tool to search the internet for current information about the user's query.

        Your task:
        1. IMMEDIATELY call the tavily_search tool with a well-crafted query about: "${state.userQuery}"
        2. If needed, make ONE additional search call for supplementary information
        3. Summarize the key findings from the search results
        4. Include ALL URLs from the search results in your summary

        IMPORTANT:
        - DO NOT answer from general knowledge - you MUST call tavily_search first
        - DO NOT make more than 2 search calls
        - Always include the source URLs in your response

        Start by calling the tavily_search tool now.
      `),
      new HumanMessage(state.userQuery),
    ],
  });

  const lastMessage = result.messages[result.messages.length - 1];
  const researchData = lastMessage.content as string;

  const sources: string[] = [];

  // Log all messages to debug
  console.log("   Total messages in result:", result.messages.length);

  // Extract sources from tool messages
  result.messages.forEach((msg: any, index: number) => {
    const msgType = msg._getType ? msg._getType() : msg.constructor.name;
    console.log(`   Message ${index}: ${msgType}`);

    if (msg._getType && msg._getType() === 'tool') {
      console.log("   Found tool message, content:", typeof msg.content);
      try {
        const toolContent = typeof msg.content === 'string' ? JSON.parse(msg.content) : msg.content;
        console.log("   Parsed tool content:", JSON.stringify(toolContent).substring(0, 200));

        if (Array.isArray(toolContent)) {
          toolContent.forEach((item: any) => {
            if (item.url && !sources.includes(item.url)) {
              sources.push(item.url);
              console.log("   Extracted URL:", item.url);
            }
          });
        }
      } catch (e) {
        console.log("   Could not parse tool message as JSON, extracting URLs from text");
      }
    }
  });

  // Extract URLs from text content
  const urlRegex = /https?:\/\/[^\s\)>\]]+/gi;
  const urlsInText = researchData.match(urlRegex) || [];
  urlsInText.forEach(url => {
    const cleanUrl = url.replace(/[,.\]}>]+$/, ''); // Remove trailing punctuation
    if (!sources.includes(cleanUrl)) {
      sources.push(cleanUrl);
    }
  });

  console.log("2. Research completed. Data collected:", researchData.substring(0, 200) + "...");
  console.log("   Sources found:", sources.length, "URLs:", sources);

  return { researchData, sources };
}

// Node 2: Analyze and structure the findings
async function analyzeAndStructure(state: typeof StateAnnotation.State) {
  console.log("3. Starting analysis and structuring phase");

  try {
    const analysis = await structuredOutputModel.invoke([
      {
        role: "system",
        content: `
          You are an expert at analyzing problems and providing structured solutions.

          Based on the research data provided, you must create a comprehensive analysis with:

          1. A clear, concise title that captures the essence of the problem
          2. A comprehensive summary that includes:
             - The core problem identified from the user's query
             - Key insights from the internet research
             - The overall solution approach
          3. An array of 3-5 specific, actionable solutions
          4. An array of sources used during research (already extracted, you will receive them)

          Be specific and practical. Base your solutions on the research findings.
        `,
      },
      {
        role: "user",
        content: `
          Original User Query: ${state.userQuery}

          Research Findings:
          ${state.researchData}

          Sources Found: ${state.sources.length > 0 ? state.sources.join(", ") : "General knowledge base"}

          Please provide a structured analysis with title, summary, solutions array, and sources array.
          Use the sources found above for the sources field.
        `,
      },
    ]);

    console.log("4. Analysis completed:", analysis);
    if (!analysis.sources || analysis.sources.length === 0) {
      analysis.sources = state.sources.length > 0 ? state.sources : ["General knowledge and research principles"];
    }

    return { analysis };
  } catch (error) {
    console.error("Error in analyzeAndStructure:", error);

    const fallbackAnalysis: IdeaAnalysis = {
      title: "Problem Analysis: " + state.userQuery.substring(0, 50),
      summary: state.researchData || "Unable to complete analysis. Please try again.",
      solutions: [
        "Review the research findings in the summary",
        "Break down the problem into smaller components",
        "Consult with domain experts for guidance",
      ],
      sources: state.sources.length > 0 ? state.sources : ["General knowledge base"],
    };

    return { analysis: fallbackAnalysis };
  }
}

// Agent workflow
const agentWorkflow = new StateGraph(StateAnnotation)
  .addNode("researchProblem", researchProblem)
  .addNode("analyzeAndStructure", analyzeAndStructure)
  .addEdge("__start__", "researchProblem")
  .addEdge("researchProblem", "analyzeAndStructure")
  .addEdge("analyzeAndStructure", "__end__")
  .compile();

// Create the search analysis tool
export const createSearchAnalysisTool = () => {
  return new DynamicStructuredTool({
    name: "search_analysis",
    description: "Analyzes problems and ideas using internet search with Tavily to provide structured solutions.",
    schema: z.object({
      query: z.string().describe("The problem or idea to research and analyze"),
    }),
    func: async ({ query }) => {
      try {
        const analysis = await analyzeIdea(query);
        return JSON.stringify({
          success: true,
          analysis,
          message: "Idea analysis completed successfully"
        }, null, 2);
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error occurred",
          message: "Failed to analyze idea"
        });
      }
    },
  });
};

// Main analysis function
export async function analyzeIdea(query: string): Promise<IdeaAnalysis> {
  console.log("Starting idea analysis for query:", query);

  try {
    const state = await agentWorkflow.invoke({
      userQuery: query,
    });

    const result = state.analysis;

    if (!result) {
      throw new Error("Analysis failed to produce results");
    }

    console.log("5. Idea analysis completed successfully");
    return result;
  } catch (err) {
    console.error("Error in analyzeIdea:", err);

    return {
      title: "Error Processing Request",
      summary: "An error occurred while analyzing your idea. Please try again with a different query.",
      solutions: [
        "Rephrase your question more specifically",
        "Try breaking down your problem into smaller parts",
        "Check your internet connection and try again",
      ],
      sources: ["Error - no sources available"],
    };
  }
}

// Example usage function for testing
export async function exampleUsage() {
  const query = "How to improve customer retention in SaaS products";
  const result = await analyzeIdea(query);
  console.log(result);
  return result;
}