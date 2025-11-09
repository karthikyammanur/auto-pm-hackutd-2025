/**
 * Web Search Integration
 * 
 * Handles web search for competitor research and industry trends
 * Supports both Tavily and Serper APIs
 */

import { WEB_SEARCH_CONFIG, FETCH_LIMITS, API_CONFIG, getWebSearchProvider } from './config';
import type { WebSearchResult, ApiResponse } from './types';

// ============================================================================
// TAVILY API
// ============================================================================

interface TavilySearchRequest {
  api_key: string;
  query: string;
  search_depth?: 'basic' | 'advanced';
  max_results?: number;
  include_domains?: string[];
  exclude_domains?: string[];
}

interface TavilySearchResponse {
  results: Array<{
    title: string;
    url: string;
    content: string;
    score: number;
    published_date?: string;
  }>;
}

/**
 * Search using Tavily API
 */
async function searchTavily(
  query: string,
  maxResults: number = 10
): Promise<WebSearchResult[]> {
  if (!WEB_SEARCH_CONFIG.tavilyApiKey) {
    throw new Error('Tavily API key not configured. Please set TAVILY_API_KEY');
  }

  const requestBody: TavilySearchRequest = {
    api_key: WEB_SEARCH_CONFIG.tavilyApiKey,
    query,
    search_depth: 'basic',
    max_results: maxResults,
  };

  try {
    const response = await fetch(WEB_SEARCH_CONFIG.tavilyApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Tavily search failed: ${response.status} - ${errorText}`);
    }

    const data: TavilySearchResponse = await response.json();

    return data.results.map(result => ({
      title: result.title,
      snippet: result.content,
      url: result.url,
      published_date: result.published_date,
      source: 'tavily',
    }));
  } catch (error) {
    console.error('Tavily search error:', error);
    throw error;
  }
}

// ============================================================================
// SERPER API
// ============================================================================

interface SerperSearchRequest {
  q: string;
  num?: number;
  gl?: string;
  hl?: string;
}

interface SerperSearchResponse {
  organic: Array<{
    title: string;
    link: string;
    snippet: string;
    date?: string;
    source?: string;
  }>;
}

/**
 * Search using Serper API (Google Search)
 */
async function searchSerper(
  query: string,
  maxResults: number = 10
): Promise<WebSearchResult[]> {
  if (!WEB_SEARCH_CONFIG.serperApiKey) {
    throw new Error('Serper API key not configured. Please set SERPER_API_KEY');
  }

  const requestBody: SerperSearchRequest = {
    q: query,
    num: maxResults,
  };

  try {
    const response = await fetch(WEB_SEARCH_CONFIG.serperApiUrl, {
      method: 'POST',
      headers: {
        'X-API-KEY': WEB_SEARCH_CONFIG.serperApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Serper search failed: ${response.status} - ${errorText}`);
    }

    const data: SerperSearchResponse = await response.json();

    return data.organic.map(result => ({
      title: result.title,
      snippet: result.snippet,
      url: result.link,
      published_date: result.date,
      source: result.source || 'serper',
    }));
  } catch (error) {
    console.error('Serper search error:', error);
    throw error;
  }
}

// ============================================================================
// UNIFIED SEARCH INTERFACE
// ============================================================================

/**
 * Perform web search using the configured provider
 */
async function webSearch(
  query: string,
  maxResults: number = 10
): Promise<WebSearchResult[]> {
  const provider = getWebSearchProvider();

  if (provider === 'tavily') {
    return searchTavily(query, maxResults);
  } else {
    return searchSerper(query, maxResults);
  }
}

/**
 * Perform web search with retry logic and exponential backoff
 */
async function webSearchWithRetry(
  query: string,
  maxResults: number = 10,
  retries: number = 0
): Promise<ApiResponse<WebSearchResult[]>> {
  try {
    const results = await webSearch(query, maxResults);
    return {
      success: true,
      data: results,
      retries,
    };
  } catch (error) {
    if (retries < API_CONFIG.maxRetries) {
      const delay = API_CONFIG.retryDelayMs * Math.pow(API_CONFIG.retryBackoffMultiplier, retries);
      console.log(`Retrying web search after ${delay}ms (attempt ${retries + 1}/${API_CONFIG.maxRetries})`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return webSearchWithRetry(query, maxResults, retries + 1);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      retries,
    };
  }
}

// ============================================================================
// COMPETITOR SEARCH
// ============================================================================

/**
 * Search for competitor information
 * @param competitorName - Name of the competitor or general query
 * @returns Web search results about the competitor
 */
export async function searchCompetitor(
  competitorName: string
): Promise<WebSearchResult[]> {
  const query = `${competitorName} features pricing review comparison`;
  
  console.log(`Searching for competitor: "${competitorName}"`);

  const result = await webSearchWithRetry(query, FETCH_LIMITS.competitorSearchResults);

  if (!result.success) {
    console.error(`Competitor search failed for "${competitorName}":`, result.error);
    return [];
  }

  return result.data || [];
}

/**
 * Search for multiple competitors in parallel
 */
export async function searchCompetitors(
  competitorNames: string[]
): Promise<Map<string, WebSearchResult[]>> {
  console.log(`Searching for ${competitorNames.length} competitors...`);

  const searchPromises = competitorNames.map(name => 
    searchCompetitor(name).then(results => ({ name, results }))
  );

  const allResults = await Promise.all(searchPromises);

  const competitorMap = new Map<string, WebSearchResult[]>();
  allResults.forEach(({ name, results }) => {
    competitorMap.set(name, results);
    console.log(`Competitor "${name}" returned ${results.length} results`);
  });

  return competitorMap;
}

/**
 * Generate competitor queries from solution context
 */
export function buildCompetitorQueries(
  keywords: string[],
  solutionSummary: string,
  targetUsers: string[]
): string[] {
  const queries: string[] = [];

  // Generic competitor search
  queries.push(`${keywords[0]} competitors alternatives`);

  // Target user specific
  if (targetUsers.length > 0) {
    queries.push(`${keywords[0]} for ${targetUsers[0]}`);
  }

  // Solution-focused
  const mainConcept = solutionSummary.split(' ').slice(0, 5).join(' ');
  queries.push(`${mainConcept} solutions`);

  // Combine multiple keywords
  if (keywords.length >= 2) {
    queries.push(`${keywords[0]} ${keywords[1]} providers`);
  }

  return queries.slice(0, FETCH_LIMITS.maxCompetitors);
}

// ============================================================================
// INDUSTRY TRENDS SEARCH
// ============================================================================

/**
 * Search for industry trends and news
 * @param query - Search query for trends/news
 * @returns Web search results about industry trends
 */
export async function searchIndustryTrend(
  query: string
): Promise<WebSearchResult[]> {
  // Add temporal and news-focused keywords
  const enhancedQuery = `${query} news trends 2024 2025`;
  
  console.log(`Searching for industry trend: "${query}"`);

  const result = await webSearchWithRetry(enhancedQuery, FETCH_LIMITS.trendSearchResults);

  if (!result.success) {
    console.error(`Trend search failed for "${query}":`, result.error);
    return [];
  }

  return result.data || [];
}

/**
 * Search for multiple industry trends in parallel
 */
export async function searchIndustryTrends(
  queries: string[]
): Promise<WebSearchResult[]> {
  console.log(`Searching for ${queries.length} industry trends...`);

  const searchPromises = queries.map(query => searchIndustryTrend(query));
  const allResults = await Promise.all(searchPromises);

  // Flatten and deduplicate by URL
  const allTrends = allResults.flat();
  const uniqueTrends = Array.from(
    new Map(allTrends.map(trend => [trend.url, trend])).values()
  );

  console.log(`Found ${uniqueTrends.length} unique trends (${allTrends.length} total)`);

  return uniqueTrends;
}

/**
 * Generate industry trend queries from solution context
 */
export function buildTrendQueries(
  keywords: string[],
  targetUsers: string[],
  problem: string
): string[] {
  const queries: string[] = [];

  // Keyword-based trends
  keywords.slice(0, 2).forEach(keyword => {
    queries.push(`${keyword} trends`);
    queries.push(`${keyword} regulation`);
  });

  // Target user trends
  if (targetUsers.length > 0) {
    queries.push(`${targetUsers[0]} trends`);
  }

  // Problem space trends
  const problemKeywords = problem.split(' ').filter(w => w.length > 5).slice(0, 2);
  if (problemKeywords.length > 0) {
    queries.push(`${problemKeywords.join(' ')} industry trends`);
  }

  // Combine keywords for industry-specific trends
  if (keywords.length >= 2) {
    queries.push(`${keywords[0]} ${keywords[1]} industry outlook`);
  }

  return queries.slice(0, FETCH_LIMITS.maxTrends);
}

// ============================================================================
// GENERAL SEARCH
// ============================================================================

/**
 * General web search function
 * Can be used for any custom search needs
 */
export async function search(
  query: string,
  maxResults: number = 10
): Promise<WebSearchResult[]> {
  console.log(`Performing web search: "${query}"`);

  const result = await webSearchWithRetry(query, maxResults);

  if (!result.success) {
    console.error(`Web search failed for "${query}":`, result.error);
    throw new Error(result.error);
  }

  return result.data || [];
}

