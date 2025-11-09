import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";
import { analyzeOKR } from "../okr/tools";
import { analyzeIdea } from "../search/tools";

// Schema for the comprehensive JSON output
export const ComprehensiveAnalysisSchema = z.object({
  metadata: z.object({
    input_prompt: z.string(),
    generated_at: z.string(),
    sources_used: z.array(z.string()),
  }),
  customer_feedback: z.object({
    total_feedback_count: z.number(),
    sentiment_breakdown: z.object({
      positive: z.number(),
      neutral: z.number(),
      negative: z.number(),
    }),
    average_sentiment_score: z.number(),
    themes: z.array(z.object({
      name: z.string(),
      description: z.string(),
      mention_count: z.number(),
      example_ids: z.array(z.string()),
    })),
    top_pain_points: z.array(z.object({
      summary: z.string(),
      occurrence_count: z.number(),
      severity: z.enum(["High", "Medium", "Low"]),
      segments_most_affected: z.array(z.string()),
    })),
    top_delighters: z.array(z.object({
      summary: z.string(),
      why_users_love_this: z.string(),
      mention_count: z.number(),
    })),
    sample_quotes: z.array(z.object({
      id: z.string(),
      segment: z.string(),
      quote: z.string(),
      sentiment: z.enum(["positive", "neutral", "negative"]),
    })),
    segments_summary: z.array(z.object({
      segment: z.string(),
      feedback_count: z.number(),
      avg_sentiment_score: z.number(),
      common_themes: z.array(z.string()),
    })),
    source_urls: z.array(z.string()),
  }),
  okr: z.array(z.object({
    id: z.string(),
    title: z.string(),
    primary_okrs: z.array(z.string()),
    alignment: z.enum(["High", "Medium", "Low", "None"]),
    rationale: z.string(),
    alignment_score: z.number(),
    okr_progress_percent: z.number(),
  })),
  industry_news: z.object({
    article_count: z.number(),
    time_window_days: z.number(),
    top_topics: z.array(z.object({
      topic: z.string(),
      mention_count: z.number(),
      avg_sentiment_score: z.number(),
      trend_change_percent: z.number(),
    })),
    sources_summary: z.array(z.object({
      source: z.string(),
      article_count: z.number(),
      avg_sentiment_score: z.number(),
    })),
    source_urls: z.array(z.string()),
  }),
  competitor_insights: z.object({
    competitor_count: z.number(),
    average_market_share_percent: z.number(),
    competitors: z.array(z.object({
      competitor_name: z.string(),
      activity_summary: z.string(),
      strategic_focus: z.string(),
      impact_level: z.enum(["High", "Medium", "Low"]),
      recent_launches_count: z.number(),
      growth_rate_percent: z.number(),
      share_of_mentions_percent: z.number(),
      user_sentiment_score: z.number(),
    })),
    trend_summary: z.object({
      rising_competitors: z.array(z.string()),
      declining_competitors: z.array(z.string()),
    }),
    source_urls: z.array(z.string()),
  }),
});

export type ComprehensiveAnalysis = z.infer<typeof ComprehensiveAnalysisSchema>;

// Main orchestration function
export async function orchestrateAnalysis(prompt: string): Promise<ComprehensiveAnalysis> {
  console.log("Starting comprehensive analysis orchestration for:", prompt);

  const startTime = new Date().toISOString();
  const sourcesUsed: string[] = [];

  // Step 1: Get OKR analysis
  console.log("1. Fetching OKR analysis...");
  let okrData = "";
  try {
    okrData = await analyzeOKR(`How does "${prompt}" align with our current objectives and key results?`);
    sourcesUsed.push("okr_agent");
    console.log("   ✓ OKR analysis complete");
  } catch (error) {
    console.error("   ✗ OKR analysis failed:", error);
    okrData = "OKR analysis unavailable";
  }

  // Step 2: Get customer feedback search
  console.log("2. Searching for customer feedback...");
  let feedbackData = null;
  try {
    feedbackData = await analyzeIdea(`Find customer feedback, reviews, and user opinions about: ${prompt}`);
    sourcesUsed.push("search_agent_feedback");
    console.log("   ✓ Customer feedback search complete");
    console.log("   📎 Feedback sources:", feedbackData.sources);
  } catch (error) {
    console.error("   ✗ Customer feedback search failed:", error);
  }

  // Step 3: Get industry news
  console.log("3. Gathering industry news...");
  let newsData = null;
  try {
    newsData = await analyzeIdea(`Find recent industry news and trends related to: ${prompt}`);
    sourcesUsed.push("search_agent_news");
    console.log("   ✓ Industry news search complete");
    console.log("   📎 News sources:", newsData.sources);
  } catch (error) {
    console.error("   ✗ Industry news search failed:", error);
  }

  // Step 4: Get competitor insights
  console.log("4. Analyzing competitors...");
  let competitorData = null;
  try {
    competitorData = await analyzeIdea(`Find information about competitors and what they are doing related to: ${prompt}`);
    sourcesUsed.push("search_agent_competitors");
    console.log("   ✓ Competitor analysis complete");
    console.log("   📎 Competitor sources:", competitorData.sources);
  } catch (error) {
    console.error("   ✗ Competitor analysis failed:", error);
  }

  // Step 5: Structure all data into JSON format using AI
  console.log("5. Structuring data into JSON format...");
  const structuredData = await structureDataToJSON(
    prompt,
    startTime,
    sourcesUsed,
    okrData,
    feedbackData,
    newsData,
    competitorData
  );

  console.log("6. Orchestration complete!");
  return structuredData;
}

// Structure all collected data into the required JSON format
async function structureDataToJSON(
  prompt: string,
  timestamp: string,
  sources: string[],
  okrData: string,
  feedbackData: any,
  newsData: any,
  competitorData: any
): Promise<ComprehensiveAnalysis> {
  const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash-exp",
    temperature: 0.3,
    apiKey: process.env.GOOGLE_API_KEY,
  });

  const structuredOutputModel = model.withStructuredOutput(ComprehensiveAnalysisSchema);

  const prompt_text = `You are a data analyst tasked with structuring research data into a comprehensive JSON format for visualization.

ORIGINAL PROMPT: ${prompt}

DATA COLLECTED:

=== OKR ANALYSIS ===
${okrData}

=== CUSTOMER FEEDBACK RESEARCH ===
${feedbackData ? `Title: ${feedbackData.title}
Summary: ${feedbackData.summary}
Solutions: ${feedbackData.solutions.join(', ')}
Sources: ${feedbackData.sources.join(', ')}` : 'No data available'}

=== INDUSTRY NEWS RESEARCH ===
${newsData ? `Title: ${newsData.title}
Summary: ${newsData.summary}
Solutions: ${newsData.solutions.join(', ')}
Sources: ${newsData.sources.join(', ')}` : 'No data available'}

=== COMPETITOR INSIGHTS RESEARCH ===
${competitorData ? `Title: ${competitorData.title}
Summary: ${competitorData.summary}
Solutions: ${competitorData.solutions.join(', ')}
Sources: ${competitorData.sources.join(', ')}` : 'No data available'}

INSTRUCTIONS:
Create a comprehensive JSON structure following this exact schema. Use the research data above to populate all fields intelligently:

1. **metadata**: Use provided timestamp "${timestamp}" and sources ${JSON.stringify(sources)}

2. **customer_feedback**: Extract and structure feedback insights
   - Analyze sentiment (estimate positive/neutral/negative breakdown)
   - Identify themes from the feedback summary
   - Extract pain points and delighters mentioned
   - Create realistic sample quotes based on the data
   - Provide segment breakdowns if mentioned

3. **okr**: Structure OKR alignment data
   - Create entries for each relevant objective
   - Rate alignment (High/Medium/Low/None) based on OKR analysis
   - Provide rationale and scores (0.0-1.0)

4. **industry_news**: Structure news insights
   - Count articles/sources mentioned
   - Identify top topics
   - Estimate sentiment and trends
   - Summarize sources

5. **competitor_insights**: Structure competitor data
   - List competitors mentioned
   - Summarize their activities and strategic focus
   - Rate impact level (High/Medium/Low)
   - Estimate market metrics (use reasonable estimates if exact data unavailable)

IMPORTANT:
- All numerical fields must be valid numbers (not strings)
- Use realistic estimates based on the data when exact numbers aren't available
- Ensure all required fields are populated
- Sentiment scores should be between -1.0 and 1.0
- Percentages should be 0-100
- Use "N/A" or empty arrays only when absolutely no data is available

CRITICAL - SOURCE URLS (THIS IS MANDATORY):
- customer_feedback.source_urls MUST contain the URLs from "CUSTOMER FEEDBACK RESEARCH > Sources: ..."
  Extract ONLY the URLs (starting with http:// or https://) from that sources list
- industry_news.source_urls MUST contain the URLs from "INDUSTRY NEWS RESEARCH > Sources: ..."
  Extract ONLY the URLs (starting with http:// or https://) from that sources list
- competitor_insights.source_urls MUST contain the URLs from "COMPETITOR INSIGHTS RESEARCH > Sources: ..."
  Extract ONLY the URLs (starting with http:// or https://) from that sources list
- Each source_urls array should contain the actual web URLs (e.g., https://example.com/article)
- Do NOT include non-URL text like "General knowledge base" in source_urls arrays
- If no URLs are available, use an empty array []

Return a complete, valid JSON structure.`;

  try {
    const result = await structuredOutputModel.invoke([
      {
        role: "system",
        content: "You are an expert data analyst who structures research data into precise JSON formats for data visualization.",
      },
      {
        role: "user",
        content: prompt_text,
      },
    ]);

    return result;
  } catch (error) {
    console.error("Error structuring data:", error);

    // Return a fallback structure
    return {
      metadata: {
        input_prompt: prompt,
        generated_at: timestamp,
        sources_used: sources,
      },
      customer_feedback: {
        total_feedback_count: 0,
        sentiment_breakdown: { positive: 0, neutral: 0, negative: 0 },
        average_sentiment_score: 0.0,
        themes: [],
        top_pain_points: [],
        top_delighters: [],
        sample_quotes: [],
        segments_summary: [],
        source_urls: [],
      },
      okr: [],
      industry_news: {
        article_count: 0,
        time_window_days: 30,
        top_topics: [],
        sources_summary: [],
        source_urls: [],
      },
      competitor_insights: {
        competitor_count: 0,
        average_market_share_percent: 0.0,
        competitors: [],
        trend_summary: {
          rising_competitors: [],
          declining_competitors: [],
        },
        source_urls: [],
      },
    };
  }
}

// Example usage
export async function exampleUsage() {
  const result = await orchestrateAnalysis("AI-powered customer support chatbot");
  console.log(JSON.stringify(result, null, 2));
  return result;
}
