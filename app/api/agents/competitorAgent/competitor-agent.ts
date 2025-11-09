/**
 * Competitor Agent
 * 
 * Analyzes competitor information from web search results.
 * Part of the research subgraph pipeline.
 */

import { buildCompetitorQueries, searchCompetitors, search } from './web-search';
import { analyzeCompetitors, extractCompetitorNamesFromSearch } from './llm';
import type {
  SolutionContext,
  CompetitorAgentOutput,
  CompetitorSummary,
} from './types';

// ============================================================================
// COMPETITOR AGENT
// ============================================================================

/**
 * Main Competitor Agent function
 * Searches for competitors and analyzes their offerings
 */
export async function runCompetitorAgent(
  context: SolutionContext
): Promise<CompetitorAgentOutput> {
  console.log('=== Competitor Agent Started ===');
  console.log(`Solution: ${context.solution_title}`);
  console.log(`Keywords: ${context.keywords.join(', ')}`);

  try {
    // Step 1: Dynamically discover competitors using Tavily + LLM
    let competitorNames = await discoverCompetitors(context);
    
    // Step 2: If discovery fails, return empty result instead of wrong fallback
    if (competitorNames.length === 0) {
      console.warn('Dynamic discovery found no competitors. Not using fallback to avoid irrelevant results.');
      return {
        source: 'competitors',
        competitors: [],
      };
    }
    
    console.log(`Using ${competitorNames.length} competitors for analysis:`, competitorNames);

    // Step 3: Search for competitor information
    console.log('Searching for competitor information...');
    const searchResults = await searchCompetitors(competitorNames);
    
    // Combine search results into text for each competitor
    const competitorInfoMap = new Map<string, string>();
    searchResults.forEach((results, name) => {
      const combinedInfo = results
        .map(r => `${r.title}\n${r.snippet}`)
        .join('\n\n');
      competitorInfoMap.set(name, combinedInfo);
    });

    if (competitorInfoMap.size === 0) {
      console.log('No competitor information found, returning empty result');
      return {
        source: 'competitors',
        competitors: [],
      };
    }

    // Step 4: Analyze competitors with LLM
    console.log('Analyzing competitors with LLM...');
    const analysisResults = await analyzeCompetitors(competitorInfoMap, context);

    // Step 5: Build competitor summaries
    const competitors: CompetitorSummary[] = [];
    analysisResults.forEach((analysis, name) => {
      competitors.push({
        name,
        relevant_features: analysis.relevant_features,
        unique_edges: analysis.unique_edges,
        weaknesses: analysis.weaknesses,
      });
    });

    console.log(`=== Competitor Agent Complete: ${competitors.length} competitors analyzed ===`);

    return {
      source: 'competitors',
      competitors,
    };
  } catch (error) {
    console.error('Competitor Agent error:', error);
    // Return empty result on error rather than failing the entire pipeline
    return {
      source: 'competitors',
      competitors: [],
    };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Dynamically discover competitors using Tavily search + LLM extraction
 * @param context - The solution context
 * @returns Array of competitor names (3-5 names)
 */
async function discoverCompetitors(
  context: SolutionContext
): Promise<string[]> {
  console.log('Discovering competitors dynamically...');
  
  try {
    // Build a comprehensive search query focused on the specific domain
    const primaryKeywords = context.keywords.slice(0, 2).join(' ');
    const targetUser = context.target_users[0] || 'professionals';
    
    // Use a more specific query that includes the problem domain
    const searchQuery = `${primaryKeywords} ${targetUser} solutions platforms companies alternatives`;
    
    console.log(`Searching for competitors: "${searchQuery}"`);
    
    const searchResults = await search(searchQuery, 15);
    
    if (searchResults.length === 0) {
      console.log('⚠️ No search results found, returning empty competitor list');
      return [];
    }
    
    console.log(`✓ Found ${searchResults.length} search results`);
    console.log('Sample results:', searchResults.slice(0, 3).map(r => r.title).join(' | '));
    console.log('Extracting competitor names with LLM...');
    
    // Extract competitor names using LLM
    const competitorNames = await extractCompetitorNamesFromSearch(
      searchResults,
      context
    );
    
    if (competitorNames.length > 0) {
      console.log(`✓ Successfully discovered ${competitorNames.length} competitors:`, competitorNames);
    } else {
      console.warn('⚠️ LLM extracted 0 competitors from search results');
      console.warn('This might indicate the LLM is being too strict or search results are not relevant');
    }
    
    return competitorNames;
  } catch (error) {
    console.error('Error discovering competitors:', error);
    return [];
  }
}

/**
 * DEPRECATED: This function is no longer used
 * Old hardcoded approach that returned incorrect results
 * Kept for reference only
 */
function inferCompetitorNames_DEPRECATED(keywords: string[]): string[] {
  // This function is deprecated and should not be called
  console.error('DEPRECATED: inferCompetitorNames should not be called');
  return [];
}

