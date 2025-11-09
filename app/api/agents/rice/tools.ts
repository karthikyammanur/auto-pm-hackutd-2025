import { DynamicStructuredTool } from "@langchain/core/tools";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";
import { HumanMessage } from "@langchain/core/messages";

// Define the Feature interface for RICE scoring
export interface Feature {
  name: string;
  reach: number;
  impact: number;
  confidence: number;
  effort: number;
  rice_score?: number;
}

// Hardcoded default features for testing
export const DEFAULT_FEATURES: Feature[] = [
  { name: "AI FAQ chatbot", reach: 8000, impact: 2.0, confidence: 0.6, effort: 20 },
  { name: "Simplified course registration flow", reach: 12000, impact: 3.0, confidence: 0.8, effort: 30 },
  { name: "Smart alerts for assignment deadlines", reach: 15000, impact: 2.5, confidence: 0.7, effort: 15 },
];

// RICE Score Calculator
export function calculateRiceScore(feature: Feature): number {
  return (feature.reach * feature.impact * feature.confidence) / feature.effort;
}

export function calculateAndSortFeatures(features: Feature[]): Feature[] {
  // Calculate RICE scores
  const featuresWithScores = features.map(feature => ({
    ...feature,
    rice_score: calculateRiceScore(feature)
  }));

  // Sort by RICE score in descending order
  return featuresWithScores.sort((a, b) => (b.rice_score || 0) - (a.rice_score || 0));
}

// Create the RICE prioritization tool using LangGraph
export const createRicePrioritizationTool = () => {
  return new DynamicStructuredTool({
    name: "rice_prioritization",
    description: "Calculates RICE scores for product features and provides prioritization analysis. RICE = (Reach � Impact � Confidence) / Effort. Helps product managers prioritize features with AI-powered insights.",
    schema: z.object({
      features: z.array(
        z.object({
          name: z.string().describe("Name of the feature"),
          reach: z.number().describe("Number of users/customers affected per time period"),
          impact: z.number().describe("Impact score: 3=massive, 2=high, 1=medium, 0.5=low, 0.25=minimal"),
          confidence: z.number().describe("Confidence level: 0.0 to 1.0 (e.g., 0.8 = 80% confident)"),
          effort: z.number().describe("Effort in person-months or story points"),
        })
      ).optional().describe("Array of features to prioritize (uses default features if not provided)"),
    }),
    func: async ({ features }) => {
      try {
        const featuresToAnalyze = features && features.length > 0 ? features : DEFAULT_FEATURES;
        const result = await analyzeWithLangGraph(featuresToAnalyze);
        return JSON.stringify({
          success: true,
          sortedFeatures: result.sortedFeatures,
          analysis: result.analysis,
          message: "RICE analysis completed successfully"
        }, null, 2);
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error occurred",
          message: "Failed to analyze features"
        });
      }
    },
  });
};

// LangGraph workflow for RICE analysis
async function analyzeWithLangGraph(features: Feature[]): Promise<{ sortedFeatures: Feature[], analysis: string }> {
  // Initialize the Gemini model
  const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash-exp",
    temperature: 0.7,
    apiKey: process.env.GOOGLE_API_KEY,
  });

  // Calculate and sort features
  const sortedFeatures = calculateAndSortFeatures(features);

  // Prepare data for analysis
  const rawTable = sortedFeatures.map(f => ({
    name: f.name,
    reach: f.reach,
    impact: f.impact,
    confidence: f.confidence,
    effort: f.effort,
    rice_score: f.rice_score?.toFixed(2)
  }));

  const prompt = `You are helping a Product Manager explain prioritization to non-technical stakeholders.

Here are features with pre-computed RICE scores (as JSON list):
${JSON.stringify(rawTable, null, 2)}

Please provide a clear, concise analysis:

1) Briefly explain what RICE means in simple language (2-3 sentences max).
2) Explain why the top-ranked item is likely first (consider all four factors).
3) Point out any assumptions or data gaps in the scoring.
4) Suggest 2 specific checks or questions that would increase confidence before committing to this prioritization.

Keep your response professional but accessible to non-technical stakeholders.`;

  const response = await model.invoke([new HumanMessage(prompt)]);
  const analysis = response.content as string;

  return {
    sortedFeatures,
    analysis
  };
}
export async function analyzeRicePrioritization(features?: Feature[]): Promise<{
  sortedFeatures: Feature[];
  analysis: string;
}> {
  const featuresToAnalyze = features && features.length > 0 ? features : DEFAULT_FEATURES;
  return analyzeWithLangGraph(featuresToAnalyze);
}
export async function exampleUsage() {
  const result = await analyzeRicePrioritization();
  console.log("Sorted Features:", result.sortedFeatures);
  console.log("\nAnalysis:", result.analysis);
  return result;
}