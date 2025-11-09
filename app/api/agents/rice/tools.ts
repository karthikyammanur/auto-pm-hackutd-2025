import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage } from "@langchain/core/messages";
import { z } from "zod";

// Define the Feature interface for RICE scoring
export interface Feature {
  name: string;
  reach: number;
  impact: number;
  confidence: number;
  effort: number;
  rice_score?: number;
}

// Zod schema for feature generation
export const FeatureSchema = z.object({
  name: z.string().describe("Name of the feature"),
  reach: z.number().describe("Number of users/customers this feature will impact per time period (e.g., per quarter)"),
  impact: z.number().min(0.25).max(3).describe("Impact score: 3 = massive impact, 2 = high, 1 = medium, 0.5 = low, 0.25 = minimal"),
  confidence: z.number().min(0).max(1).describe("Confidence percentage as decimal: 1.0 = 100% confident, 0.8 = 80% confident, etc."),
  effort: z.number().describe("Estimated effort in person-weeks"),
});

export const RiceAnalysisOutputSchema = z.object({
  features: z.array(FeatureSchema).describe("Array of features with their RICE metrics"),
});

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
// Generate features from solution using AI
export async function generateFeaturesFromSolution(solution: string): Promise<Feature[]> {
  console.log('[RICE Agent] Generating features from solution:', solution.substring(0, 100) + '...');

  const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash-exp",
    temperature: 0.7,
    apiKey: process.env.GOOGLE_API_KEY,
  });

  const prompt = `You are a Product Manager analyzing a product solution to break it down into implementable features with RICE scoring.

**Solution to Analyze:**
${solution}

**Your Task:**
1. Break down this solution into 4-6 concrete, implementable features
2. For each feature, estimate the RICE metrics:
   - **Reach**: How many users/customers will this feature impact per quarter? (Use realistic numbers like 1000, 5000, 10000, etc.)
   - **Impact**: How much will this feature impact each user? Use this scale:
     * 3.0 = Massive impact (transforms the product experience)
     * 2.0 = High impact (significantly improves experience)
     * 1.5 = Medium-high impact
     * 1.0 = Medium impact (noticeable improvement)
     * 0.5 = Low impact (minor improvement)
     * 0.25 = Minimal impact
   - **Confidence**: How confident are you in your reach and impact estimates? (0.0 to 1.0, where 1.0 = 100% confident)
   - **Effort**: How many person-weeks will this feature take to build? (e.g., 2, 10, 25, 60)

**Important Guidelines:**
- Think about the solution holistically and identify key components
- Be realistic with estimates based on typical product development
- Consider both technical complexity and design requirements for effort
- Higher reach doesn't always mean higher impact
- Consider dependencies between features
- Features should be specific enough to estimate accurately

**Output Format:**
Return a valid JSON object with this exact structure:
{
  "features": [
    {
      "name": "Feature name here",
      "reach": 10000,
      "impact": 1.5,
      "confidence": 0.9,
      "effort": 10
    }
  ]
}

Generate the features now:`;

  try {
    const response = await model.invoke([new HumanMessage(prompt)]);
    let content = response.content as string;
    
    console.log('[RICE Agent] Raw AI response:', content.substring(0, 200) + '...');

    // Extract JSON from markdown code blocks if present
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      content = jsonMatch[1];
      console.log('[RICE Agent] Extracted JSON from code block');
    }

    // Parse the JSON response
    const parsed = JSON.parse(content.trim());
    console.log('[RICE Agent] Parsed JSON successfully');

    // Validate with Zod schema
    const validated = RiceAnalysisOutputSchema.parse(parsed);
    console.log('[RICE Agent] Generated', validated.features.length, 'features');

    return validated.features;
  } catch (error) {
    console.error('[RICE Agent] Error generating features:', error);
    throw new Error(`Failed to generate features from solution: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function analyzeRicePrioritization(features: Feature[]): Promise<{
  sortedFeatures: Feature[];
  analysis: string;
}> {
  if (!features || features.length === 0) {
    throw new Error("Features array is required and cannot be empty");
  }
  return analyzeWithLangGraph(features);
}

// Main function that combines feature generation and analysis
export async function generateAndAnalyzeRice(solution: string): Promise<{
  features: Feature[];
  sortedFeatures: Feature[];
  analysis: string;
}> {
  console.log('[RICE Agent] Starting full RICE analysis pipeline...');
  
  // Step 1: Generate features from solution
  const features = await generateFeaturesFromSolution(solution);
  console.log('[RICE Agent] Features generated, calculating RICE scores...');
  
  // Step 2: Analyze and sort features
  const { sortedFeatures, analysis } = await analyzeRicePrioritization(features);
  console.log('[RICE Agent] Analysis complete');
  
  return {
    features,
    sortedFeatures,
    analysis,
  };
}