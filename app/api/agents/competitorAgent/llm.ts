/**
 * LLM Utilities
 * 
 * Helper functions for interacting with Google GenAI
 * for classification and analysis tasks.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { GENAI_CONFIG, PROMPTS } from './config';

/**
 * Robust JSON parser that handles markdown code blocks and extra text
 */
function safeJsonParse<T = any>(text: string): T {
  try {
    return JSON.parse(text);
  } catch (e1) {
    // Remove markdown code fences
    let cleaned = text.trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
    
    try {
      return JSON.parse(cleaned);
    } catch (e2) {
      // Try to extract JSON object
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const jsonStr = cleaned.slice(firstBrace, lastBrace + 1);
        try {
          return JSON.parse(jsonStr);
        } catch (e3) {
          console.error('JSON parse failed. Original text:', text.substring(0, 200));
          throw new Error(`Failed to parse JSON: ${e1}`);
        }
      }
      throw e1;
    }
  }
}

import type {
  RedditPost,
  RedditClassificationResult,
  CompetitorAnalysisResult,
  TrendAnalysisResult,
  SolutionContext,
  WebSearchResult,
} from './types';
import { isRedditDirection, isIntensity, isTrendDirection, isTrendStance } from './types';

// ============================================================================
// INITIALIZATION & RATE LIMITING
// ============================================================================

let genAI: GoogleGenerativeAI | null = null;

// Simple rate limiter for free tier (gemini-2.5-flash allows ~15 RPM sustained)
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL_MS = 4000; // 4 seconds = 15 requests per minute (safer than hitting exact limit)

/**
 * Wait if needed to respect rate limits
 */
async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL_MS) {
    const waitTime = MIN_REQUEST_INTERVAL_MS - timeSinceLastRequest;
    console.log(`Rate limiting: waiting ${waitTime}ms before next LLM call...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastRequestTime = Date.now();
}

/**
 * Initialize Google GenAI client
 */
function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    if (!GENAI_CONFIG.apiKey) {
      throw new Error('Google GenAI API key not configured. Please set GOOGLE_API_KEY environment variable.');
    }
    genAI = new GoogleGenerativeAI(GENAI_CONFIG.apiKey);
  }
  return genAI;
}

/**
 * Get the generative model instance
 */
function getModel() {
  const ai = getGenAI();
  return ai.getGenerativeModel({
    model: GENAI_CONFIG.model,
    generationConfig: {
      temperature: GENAI_CONFIG.temperature,
      maxOutputTokens: GENAI_CONFIG.maxOutputTokens,
      responseMimeType: 'application/json',
    },
  });
}

// ============================================================================
// REDDIT POST CLASSIFICATION
// ============================================================================

/**
 * Classify a Reddit post to extract topic, direction, and intensity
 */
export async function classifyRedditPost(
  post: RedditPost
): Promise<RedditClassificationResult> {
  try {
    await waitForRateLimit();
    const model = getModel();
    
    // Fill in the prompt template
    const prompt = PROMPTS.classifyRedditPost
      .replace('{title}', post.title || '')
      .replace('{body}', post.body || '');

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Parse JSON response
    const parsed = safeJsonParse(text);
    
    // Validate and return
    return {
      topic: parsed.topic || 'other',
      direction: isRedditDirection(parsed.direction) ? parsed.direction : 'neutral_observation',
      intensity: isIntensity(parsed.intensity) ? parsed.intensity : 'medium',
      reasoning: parsed.reasoning,
    };
  } catch (error) {
    console.error('Error classifying Reddit post:', error);
    
    // Return safe defaults on error
    return {
      topic: 'other',
      direction: 'neutral_observation',
      intensity: 'low',
      reasoning: `Classification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Classify multiple Reddit posts in parallel
 */
export async function classifyRedditPosts(
  posts: RedditPost[]
): Promise<RedditClassificationResult[]> {
  console.log(`Classifying ${posts.length} Reddit posts (with rate limiting)...`);
  
  // Process sequentially to respect rate limits (not in parallel)
  const results: RedditClassificationResult[] = [];
  
  for (let i = 0; i < posts.length; i++) {
    const result = await classifyRedditPost(posts[i]);
    results.push(result);
    
    if ((i + 1) % 5 === 0) {
      console.log(`  Classified ${i + 1}/${posts.length} posts...`);
    }
  }
  
  console.log(`Classified ${results.length} posts`);
  return results;
}

// ============================================================================
// COMPETITOR ANALYSIS
// ============================================================================

/**
 * Analyze competitor information to extract features, edges, and weaknesses
 */
export async function analyzeCompetitor(
  competitorName: string,
  competitorInfo: string,
  solutionContext: SolutionContext
): Promise<CompetitorAnalysisResult> {
  try {
    await waitForRateLimit();
    const model = getModel();
    
    // Build context summary
    const contextSummary = `
Solution: ${solutionContext.solution_title}
Summary: ${solutionContext.solution_summary}
Target Users: ${solutionContext.target_users.join(', ')}
Keywords: ${solutionContext.keywords.join(', ')}
`.trim();
    
    // Fill in the prompt template
    const prompt = PROMPTS.analyzeCompetitor
      .replace('{solutionContext}', contextSummary)
      .replace('{competitorInfo}', `Competitor: ${competitorName}\n\n${competitorInfo}`);

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Parse JSON response
    const parsed = safeJsonParse(text);
    
    return {
      relevant_features: Array.isArray(parsed.relevant_features) ? parsed.relevant_features : [],
      unique_edges: Array.isArray(parsed.unique_edges) ? parsed.unique_edges : [],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
    };
  } catch (error) {
    console.error(`Error analyzing competitor ${competitorName}:`, error);
    
    // Return empty arrays on error
    return {
      relevant_features: [],
      unique_edges: [],
      weaknesses: [],
    };
  }
}

/**
 * Analyze multiple competitors in parallel
 */
export async function analyzeCompetitors(
  competitorData: Map<string, string>,
  solutionContext: SolutionContext
): Promise<Map<string, CompetitorAnalysisResult>> {
  console.log(`Analyzing ${competitorData.size} competitors (with rate limiting)...`);
  
  const results = new Map<string, CompetitorAnalysisResult>();
  const entries = Array.from(competitorData.entries());
  
  // Process sequentially to respect rate limits
  for (let i = 0; i < entries.length; i++) {
    const [name, info] = entries[i];
    const analysis = await analyzeCompetitor(name, info, solutionContext);
    results.set(name, analysis);
    console.log(`  Analyzed ${i + 1}/${entries.length} competitors...`);
  }
  
  console.log(`Analyzed ${results.size} competitors`);
  return results;
}

// ============================================================================
// TREND ANALYSIS
// ============================================================================

/**
 * Analyze an industry trend to determine direction, stance, and implications
 */
export async function analyzeTrend(
  trendData: WebSearchResult,
  solutionContext: SolutionContext
): Promise<TrendAnalysisResult> {
  try {
    await waitForRateLimit();
    const model = getModel();
    
    // Build context summary
    const contextSummary = `
Solution: ${solutionContext.solution_title}
Summary: ${solutionContext.solution_summary}
Target Users: ${solutionContext.target_users.join(', ')}
Keywords: ${solutionContext.keywords.join(', ')}
`.trim();
    
    // Build trend info
    const trendInfo = `
Title: ${trendData.title}
Content: ${trendData.snippet}
Source: ${trendData.url}
Date: ${trendData.published_date || 'Recent'}
`.trim();
    
    // Fill in the prompt template
    const prompt = PROMPTS.analyzeTrend
      .replace('{solutionContext}', contextSummary)
      .replace('{trendInfo}', trendInfo);

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Parse JSON response (robust)
    const parsed = safeJsonParse(text);
    
    // Validate parsed data
    if (!parsed.implication || parsed.implication === 'No clear implication identified.') {
      console.warn('Trend analysis returned incomplete implication:', text.substring(0, 200));
    }
    
    return {
      name: parsed.name || trendData.title.substring(0, 50),
      direction: isTrendDirection(parsed.direction) ? parsed.direction : 'stable',
      stance: isTrendStance(parsed.stance) ? parsed.stance : 'neutral',
      implication: parsed.implication || 'Unable to determine impact on this solution.',
      reasoning: parsed.reasoning,
    };
  } catch (error) {
    console.error('Error analyzing trend:', error);
    console.error('Trend data was:', trendData.title);
    
    // Return safe defaults on error
    return {
      name: trendData.title.substring(0, 50),
      direction: 'stable',
      stance: 'neutral',
      implication: 'Unable to analyze trend impact.',
      reasoning: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Analyze multiple trends in parallel
 */
export async function analyzeTrends(
  trendData: WebSearchResult[],
  solutionContext: SolutionContext
): Promise<TrendAnalysisResult[]> {
  console.log(`Analyzing ${trendData.length} trends (with rate limiting)...`);
  
  // Process sequentially to respect rate limits
  const results: TrendAnalysisResult[] = [];
  
  for (let i = 0; i < trendData.length; i++) {
    const result = await analyzeTrend(trendData[i], solutionContext);
    results.push(result);
    
    if ((i + 1) % 5 === 0) {
      console.log(`  Analyzed ${i + 1}/${trendData.length} trends...`);
    }
  }
  
  console.log(`Analyzed ${results.length} trends`);
  return results;
}

// ============================================================================
// REDDIT POST RELEVANCE FILTERING
// ============================================================================

/**
 * Filter out irrelevant Reddit posts using LLM
 * Processes posts in batches to minimize API calls
 */
export async function filterIrrelevantPosts(
  posts: RedditPost[],
  solutionContext: SolutionContext
): Promise<RedditPost[]> {
  if (posts.length === 0) return [];

  console.log(`Filtering ${posts.length} posts for relevance (with rate limiting)...`);

  const problemArea = `${solutionContext.problem}. Focus area: ${solutionContext.keywords.join(', ')}`;
  const targetUsers = solutionContext.target_users.join(', ');

  const relevantPosts: RedditPost[] = [];
  let totalFiltered = 0;

  // Process sequentially to respect rate limits
  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    try {
      await waitForRateLimit();
      const model = getModel();

      // Truncate body to avoid token limits
      const truncatedBody = post.body.substring(0, 500);

      // Fill in the prompt template
      const prompt = PROMPTS.filterRedditRelevance
        .replace('{problemArea}', problemArea)
        .replace('{targetUsers}', targetUsers)
        .replace('{title}', post.title)
        .replace('{body}', truncatedBody || '(no body text)')
        .replace('{subreddit}', post.subreddit);

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // Parse JSON response
      const parsed = safeJsonParse(text);

      if (parsed.relevant === true) {
        relevantPosts.push(post);
      } else {
        totalFiltered++;
      }
    } catch (error) {
      console.error(`Error filtering post "${post.title}":`, error);
      // On error, keep the post (fail open)
      relevantPosts.push(post);
    }
    
    if ((i + 1) % 5 === 0) {
      console.log(`  Filtered ${i + 1}/${posts.length} posts (${totalFiltered} removed so far)...`);
    }
  }

  console.log(`Filtered out ${totalFiltered} irrelevant posts, kept ${relevantPosts.length} relevant posts`);
  return relevantPosts;
}

// ============================================================================
// COMPETITOR NAME EXTRACTION
// ============================================================================

/**
 * Extract competitor names from web search results using LLM
 */
export async function extractCompetitorNamesFromSearch(
  searchResults: WebSearchResult[],
  solutionContext: SolutionContext
): Promise<string[]> {
  try {
    await waitForRateLimit();
    const model = getModel();
    
    // Build context summary
    const contextSummary = `
Solution: ${solutionContext.solution_title}
Summary: ${solutionContext.solution_summary}
Target Users: ${solutionContext.target_users.join(', ')}
Keywords: ${solutionContext.keywords.join(', ')}
`.trim();
    
    // Format search results (limit to top 10 to avoid token limits)
    const formattedResults = searchResults
      .slice(0, 10)
      .map((result, i) => `${i + 1}. ${result.title}\n   ${result.snippet}\n   URL: ${result.url}`)
      .join('\n\n');
    
    // Fill in the prompt template
    const prompt = PROMPTS.extractCompetitorNames
      .replace('{solutionContext}', contextSummary)
      .replace('{searchResults}', formattedResults);

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    console.log('LLM response for competitor extraction:', text.substring(0, 300));
    
    // Parse JSON response
    const parsed = safeJsonParse(text);
    
    // Validate and return competitor names
    if (Array.isArray(parsed.competitors)) {
      const validCompetitors = parsed.competitors
        .filter((name: any) => typeof name === 'string' && name.trim().length > 0)
        .map((name: string) => name.trim());
      
      console.log(`Extracted ${validCompetitors.length} competitors from search results`);
      if (parsed.reasoning) {
        console.log(`Reasoning: ${parsed.reasoning}`);
      }
      
      return validCompetitors;
    }
    
    return [];
  } catch (error) {
    console.error('Error extracting competitor names:', error);
    return [];
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Test LLM connection
 */
export async function testLLMConnection(): Promise<boolean> {
  try {
    const model = getModel();
    const result = await model.generateContent('Respond with {"status": "OK"} and nothing else.');
    const text = result.response.text();
    const parsed = safeJsonParse(text);
    return parsed.status === 'OK';
  } catch (error) {
    console.error('LLM connection test failed:', error);
    return false;
  }
}

