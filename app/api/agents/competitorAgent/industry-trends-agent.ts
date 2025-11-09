/**
 * Industry Trends Agent
 * 
 * Analyzes industry trends and regulatory news.
 * Part of the research subgraph pipeline.
 */

import { buildTrendQueries, searchIndustryTrends } from './web-search';
import { analyzeTrends } from './llm';
import { FETCH_LIMITS } from './config';
import type {
  SolutionContext,
  IndustryTrendsAgentOutput,
  TrendSummary,
} from './types';

// ============================================================================
// INDUSTRY TRENDS AGENT
// ============================================================================

/**
 * Main Industry Trends Agent function
 * Searches for industry trends and analyzes their impact
 */
export async function runIndustryTrendsAgent(
  context: SolutionContext
): Promise<IndustryTrendsAgentOutput> {
  console.log('=== Industry Trends Agent Started ===');
  console.log(`Solution: ${context.solution_title}`);
  console.log(`Keywords: ${context.keywords.join(', ')}`);

  try {
    // Step 1: Build trend search queries
    const queries = buildTrendQueries(
      context.keywords,
      context.target_users,
      context.problem
    );
    console.log(`Generated ${queries.length} trend queries`);

    // Step 2: Search for industry trends and news
    console.log('Searching for industry trends...');
    const searchResults = await searchIndustryTrends(queries);
    console.log(`Found ${searchResults.length} trend articles`);

    if (searchResults.length === 0) {
      console.log('No trends found, returning empty result');
      return {
        source: 'industry_trends',
        trends: [],
      };
    }

    // Limit to maxTrends to avoid excessive LLM calls
    const limitedResults = searchResults.slice(0, FETCH_LIMITS.maxTrends);
    if (searchResults.length > FETCH_LIMITS.maxTrends) {
      console.log(`Limiting to ${FETCH_LIMITS.maxTrends} trends (from ${searchResults.length} total)`);
    }

    // Step 3: Analyze trends with LLM
    console.log('Analyzing trends with LLM...');
    const trendAnalyses = await analyzeTrends(limitedResults, context);

    // Step 4: Build trend summaries
    const trends: TrendSummary[] = trendAnalyses.map((analysis, index) => ({
      name: analysis.name,
      direction: analysis.direction,
      stance: analysis.stance,
      evidence_snippet: limitedResults[index].snippet.substring(0, 200),
      implication_for_solution: analysis.implication,
    }));

    // Sort trends by stance priority (risky > supportive > neutral)
    trends.sort((a, b) => {
      const stanceOrder = { risky: 0, supportive: 1, neutral: 2 };
      return stanceOrder[a.stance] - stanceOrder[b.stance];
    });

    console.log(`=== Industry Trends Agent Complete: ${trends.length} trends analyzed ===`);

    return {
      source: 'industry_trends',
      trends,
    };
  } catch (error) {
    console.error('Industry Trends Agent error:', error);
    // Return empty result on error rather than failing the entire pipeline
    return {
      source: 'industry_trends',
      trends: [],
    };
  }
}

