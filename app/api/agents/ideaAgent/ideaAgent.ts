import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { StateGraph, Annotation } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import { internetSearchTool } from "./tools/internetSearch";

export const IdeaAnalysisSchema = z.object({
  title: z.string().describe("The title of the identified problem"),
  summary: z.string().describe("A summary of the problem identified and the solution approach from research"),
  solutions: z.array(z.string()).describe("An array of potential solutions for the user"),
  sources: z.array(z.string()).describe("An array of sources (URLs or references) used during research"),
});

export type IdeaAnalysis = z.infer<typeof IdeaAnalysisSchema>;

const agentModel = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-pro",
  temperature: 0.7,
});

// Create the react agent with tools
const ideaAgentHandler = createReactAgent({
  llm: agentModel,
  tools: [internetSearchTool],
});

const structuredOutputModel = agentModel.withStructuredOutput(IdeaAnalysisSchema);

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
        You are an expert problem analyzer and solution architect with access to Tavily search.

        EFFICIENCY REQUIREMENT: You should call the tavily_search_results_json tool ONLY 1-2 times maximum.
        Make your searches count by using specific, targeted queries.

        Your task:
        1. Call tavily_search_results_json ONCE with a well-crafted query about: "${state.userQuery}"
        2. If absolutely needed, make ONE additional search for critical supplementary information
        3. Summarize the key findings from the search results, including the URLs

        DO NOT make more than 2 search calls. Be efficient and targeted.
        After your research, provide a concise summary of findings and mention the source URLs you found.
      `),
      new HumanMessage(state.userQuery),
    ],
  });

  const lastMessage = result.messages[result.messages.length - 1];
  const researchData = lastMessage.content as string;

  const sources: string[] = [];

  result.messages.forEach((msg: any) => {
    if (msg._getType && msg._getType() === 'tool') {
      try {
        const toolContent = typeof msg.content === 'string' ? JSON.parse(msg.content) : msg.content;
        if (Array.isArray(toolContent)) {
          toolContent.forEach((item: any) => {
            if (item.url && !sources.includes(item.url)) {
              sources.push(item.url);
            }
          });
        }
      } catch (e) {
        console.log("Could not parse tool message as JSON, extracting URLs from text");
      }
    }
  });

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
          3. An array of 3-5 specific, actionable solutions (MUST be an array of separate solution strings, NOT a single string)
          4. An array of sources used during research (already extracted, you will receive them)

          IMPORTANT: The solutions field MUST be an array like ["Solution 1", "Solution 2", "Solution 3"]
          NOT a single long string. Each solution should be a separate, concise item.

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

          Please provide a structured analysis with:
          - title: string
          - summary: string
          - solutions: array of 3-5 separate solution strings
          - sources: array of source URLs

          Each solution must be a separate item in the array, not a single long description.
        `,
      },
    ]);

    console.log("4. Analysis completed:", JSON.stringify(analysis, null, 2));
    
    // Ensure solutions is always an array
    if (!Array.isArray(analysis.solutions)) {
      console.warn("Solutions is not an array, converting:", analysis.solutions);
      if (typeof analysis.solutions === 'string') {
        // If it's a single string, split it into sentences or bullet points
        analysis.solutions = [analysis.solutions];
      } else {
        analysis.solutions = ["Please review the summary for detailed solutions"];
      }
    }

    // Ensure sources is always an array
    if (!Array.isArray(analysis.sources) || analysis.sources.length === 0) {
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

// agent workflow
const agentWorkflow = new StateGraph(StateAnnotation)
  .addNode("researchProblem", researchProblem)
  .addNode("analyzeAndStructure", analyzeAndStructure)
  .addEdge("__start__", "researchProblem")
  .addEdge("researchProblem", "analyzeAndStructure")
  .addEdge("analyzeAndStructure", "__end__")
  .compile();

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
