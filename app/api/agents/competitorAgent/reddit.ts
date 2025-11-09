/**
 * Reddit API Integration
 * 
 * Handles OAuth2 authentication and data fetching from Reddit API
 * for customer voice research.
 */

import { REDDIT_CONFIG, FETCH_LIMITS, API_CONFIG } from './config';
import type { RedditPost, ApiResponse } from './types';

// ============================================================================
// TYPES
// ============================================================================

interface RedditAuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  expires_at: number; // Timestamp when token expires
}

interface RedditSearchResponse {
  data: {
    children: Array<{
      data: {
        title: string;
        selftext: string;
        subreddit: string;
        created_utc: number;
        permalink: string;
        score: number;
        num_comments: number;
        author: string;
      };
    }>;
    after: string | null;
  };
}

// ============================================================================
// STATE
// ============================================================================

let cachedToken: RedditAuthToken | null = null;

// ============================================================================
// AUTHENTICATION
// ============================================================================

/**
 * Get Reddit OAuth2 access token
 * Uses cached token if still valid, otherwise fetches a new one
 */
async function getAccessToken(): Promise<string> {
  // Check if we have a valid cached token
  if (cachedToken && cachedToken.expires_at > Date.now()) {
    return cachedToken.access_token;
  }

  // Validate configuration
  if (!REDDIT_CONFIG.clientId || !REDDIT_CONFIG.clientSecret) {
    throw new Error('Reddit API credentials not configured. Please set REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET');
  }

  // Prepare Basic Auth credentials
  const credentials = Buffer.from(
    `${REDDIT_CONFIG.clientId}:${REDDIT_CONFIG.clientSecret}`
  ).toString('base64');

  try {
    const response = await fetch(REDDIT_CONFIG.tokenUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': REDDIT_CONFIG.userAgent,
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Reddit auth failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Cache the token with expiration time
    cachedToken = {
      access_token: data.access_token,
      token_type: data.token_type,
      expires_in: data.expires_in,
      scope: data.scope,
      expires_at: Date.now() + (data.expires_in * 1000) - 60000, // Expire 1 minute early
    };

    return cachedToken.access_token;
  } catch (error) {
    console.error('Reddit authentication error:', error);
    throw new Error(`Failed to authenticate with Reddit: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ============================================================================
// SEARCH
// ============================================================================

/**
 * Search Reddit with a single query
 * @param query - Search query string
 * @param limit - Number of results to return
 * @param subreddit - Optional subreddit to restrict search to
 */
async function searchReddit(
  query: string,
  limit: number = 25,
  subreddit?: string
): Promise<RedditPost[]> {
  const accessToken = await getAccessToken();

  // Build search URL
  const params = new URLSearchParams({
    q: query,
    limit: limit.toString(),
    sort: 'relevance',
    t: 'month', // Search posts from last month for recency
    type: 'link', // Include both links and self posts
  });

  if (subreddit) {
    params.append('restrict_sr', 'true');
  }

  const searchPath = subreddit 
    ? `/r/${subreddit}/search`
    : '/search';

  const url = `${REDDIT_CONFIG.searchUrl.replace('/search', searchPath)}?${params}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': REDDIT_CONFIG.userAgent,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Reddit search failed: ${response.status} - ${errorText}`);
    }

    const data: RedditSearchResponse = await response.json();

    // Transform Reddit API response to our RedditPost format
    return data.data.children.map((child) => ({
      title: child.data.title,
      body: child.data.selftext || '', // selftext is empty for link posts
      subreddit: child.data.subreddit,
      created_at: new Date(child.data.created_utc * 1000).toISOString(),
      url: `https://www.reddit.com${child.data.permalink}`,
      score: child.data.score,
      num_comments: child.data.num_comments,
    }));
  } catch (error) {
    console.error(`Reddit search error for query "${query}":`, error);
    throw error;
  }
}

/**
 * Search Reddit with retry logic and exponential backoff
 */
async function searchRedditWithRetry(
  query: string,
  limit: number = 25,
  subreddit?: string,
  retries: number = 0
): Promise<ApiResponse<RedditPost[]>> {
  try {
    const posts = await searchReddit(query, limit, subreddit);
    return {
      success: true,
      data: posts,
      retries,
    };
  } catch (error) {
    if (retries < API_CONFIG.maxRetries) {
      // Calculate backoff delay
      const delay = API_CONFIG.retryDelayMs * Math.pow(API_CONFIG.retryBackoffMultiplier, retries);
      console.log(`Retrying Reddit search after ${delay}ms (attempt ${retries + 1}/${API_CONFIG.maxRetries})`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return searchRedditWithRetry(query, limit, subreddit, retries + 1);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      retries,
    };
  }
}

// ============================================================================
// MAIN API
// ============================================================================

/**
 * Fetch Reddit posts for multiple search queries
 * @param queries - Array of search query strings
 * @param limitPerQuery - Maximum number of posts to fetch per query
 * @returns Array of Reddit posts from all queries
 */
export async function fetchRedditPosts(
  queries: string[],
  limitPerQuery: number = FETCH_LIMITS.redditPostsPerQuery
): Promise<RedditPost[]> {
  console.log(`Fetching Reddit posts for ${queries.length} queries...`);

  // Search all queries in parallel
  const searchPromises = queries.map(query => 
    searchRedditWithRetry(query, limitPerQuery)
  );

  const results = await Promise.all(searchPromises);

  // Collect all successful results
  const allPosts: RedditPost[] = [];
  const errors: string[] = [];

  results.forEach((result, index) => {
    if (result.success && result.data) {
      allPosts.push(...result.data);
      console.log(`Query "${queries[index]}" returned ${result.data.length} posts`);
    } else {
      errors.push(`Query "${queries[index]}" failed: ${result.error}`);
      console.error(`Query "${queries[index]}" failed:`, result.error);
    }
  });

  if (errors.length > 0 && allPosts.length === 0) {
    throw new Error(`All Reddit searches failed: ${errors.join('; ')}`);
  }

  // Deduplicate posts by URL
  const uniquePosts = Array.from(
    new Map(allPosts.map(post => [post.url, post])).values()
  );

  console.log(`Fetched ${uniquePosts.length} unique Reddit posts (${allPosts.length} total, ${allPosts.length - uniquePosts.length} duplicates removed)`);

  return uniquePosts;
}

/**
 * Build search queries from solution context
 * Generates 3-7 problem-focused search queries that frame the user's problem
 */
export function buildRedditQueries(
  keywords: string[],
  problem: string,
  solutionSummary: string
): string[] {
  const queries: string[] = [];

  // Extract key phrases from problem (not just long words)
  const problemKeyPhrase = extractKeyPhrase(problem, 3);
  const primaryKeyword = keywords[0];
  const secondaryKeyword = keywords[1] || keywords[0];

  // Query 1: Problem + pain points
  // Example: "inventory management pain points"
  if (primaryKeyword) {
    queries.push(`${primaryKeyword} pain points`);
  }

  // Query 2: Struggling with + keywords
  // Example: "struggling with inventory management"
  if (primaryKeyword) {
    queries.push(`struggling with ${primaryKeyword}`);
  }

  // Query 3: Problem statement framed as user question
  // Example: "problems with managing inventory"
  if (problemKeyPhrase) {
    queries.push(`problems with ${problemKeyPhrase}`);
  }

  // Query 4: Looking for alternatives
  // Example: "inventory management alternatives"
  if (primaryKeyword) {
    queries.push(`${primaryKeyword} alternatives`);
  }

  // Query 5: Issues + keywords
  // Example: "retail inventory issues"
  if (keywords.length >= 2) {
    queries.push(`${secondaryKeyword} ${primaryKeyword} issues`);
  }

  // Query 6: Frustration-focused query
  // Example: "frustrated with inventory tracking"
  if (problemKeyPhrase) {
    queries.push(`frustrated with ${problemKeyPhrase}`);
  }

  // Query 7: Need help with + keywords
  // Example: "need help with inventory management"
  if (primaryKeyword) {
    queries.push(`need help with ${primaryKeyword}`);
  }

  // Remove duplicates and limit to max queries
  const uniqueQueries = Array.from(new Set(queries));
  const limitedQueries = uniqueQueries.slice(0, FETCH_LIMITS.redditMaxQueries);
  
  // Ensure we have at least the minimum number of queries
  if (limitedQueries.length < FETCH_LIMITS.redditMinQueries && primaryKeyword) {
    // Add fallback generic query if needed
    limitedQueries.push(primaryKeyword);
  }

  return limitedQueries;
}

/**
 * Extract a meaningful key phrase from problem or solution text
 * Tries to get the core concept rather than just long words
 */
function extractKeyPhrase(text: string, maxWords: number = 3): string {
  // Remove common filler words
  const fillerWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'are', 'was', 'were', 'be',
    'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
    'would', 'should', 'could', 'may', 'might', 'must', 'can', 'that',
    'this', 'these', 'those', 'it', 'its', 'their', 'there', 'they',
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ') // Remove punctuation
    .split(/\s+/)
    .filter(w => w.length > 3 && !fillerWords.has(w));

  // Take first N meaningful words
  return words.slice(0, maxWords).join(' ');
}

/**
 * Search specific subreddits related to financial products
 * Useful for targeted research in the financial services domain
 */
export async function searchFinancialSubreddits(
  query: string,
  limitPerSubreddit: number = 10
): Promise<RedditPost[]> {
  const subreddits = REDDIT_CONFIG.defaultSubreddits;
  
  console.log(`Searching ${subreddits.length} financial subreddits for: "${query}"`);

  const searchPromises = subreddits.map(subreddit =>
    searchRedditWithRetry(query, limitPerSubreddit, subreddit)
  );

  const results = await Promise.all(searchPromises);

  const allPosts: RedditPost[] = [];
  results.forEach((result, index) => {
    if (result.success && result.data) {
      allPosts.push(...result.data);
      console.log(`Subreddit r/${subreddits[index]} returned ${result.data.length} posts`);
    }
  });

  // Deduplicate
  const uniquePosts = Array.from(
    new Map(allPosts.map(post => [post.url, post])).values()
  );

  return uniquePosts;
}

/**
 * Clear cached authentication token (useful for testing)
 */
export function clearTokenCache(): void {
  cachedToken = null;
}

