/**
 * Reddit Agent
 * 
 * Analyzes Reddit posts to extract customer voice insights.
 * Part of the research subgraph pipeline.
 */

import { buildRedditQueries, fetchRedditPosts } from './reddit';
import { classifyRedditPosts, filterIrrelevantPosts } from './llm';
import { FETCH_LIMITS } from './config';
import type {
  SolutionContext,
  RedditAgentOutput,
  RedditTopicSummary,
  ClassifiedRedditPost,
  RedditDirection,
  Intensity,
} from './types';

// ============================================================================
// REDDIT AGENT
// ============================================================================

/**
 * Main Reddit Agent function
 * Fetches Reddit posts, classifies them, and aggregates by topic
 */
export async function runRedditAgent(
  context: SolutionContext
): Promise<RedditAgentOutput> {
  console.log('=== Reddit Agent Started ===');
  console.log(`Solution: ${context.solution_title}`);
  console.log(`Keywords: ${context.keywords.join(', ')}`);

  try {
    // Step 1: Build search queries from context
    const queries = buildRedditQueries(
      context.keywords,
      context.problem,
      context.solution_summary
    );
    console.log(`Generated ${queries.length} Reddit queries`);

    // Step 2: Fetch Reddit posts (site-wide search)
    const allPosts = await fetchRedditPosts(queries);
    console.log(`Fetched ${allPosts.length} raw Reddit posts`);

    // Step 2b: Filter out irrelevant subreddits using user's context
    const filteredPosts = filterRelevantPosts(allPosts, context);
    console.log(`After subreddit filtering: ${filteredPosts.length} posts (removed ${allPosts.length - filteredPosts.length} from irrelevant subreddits)`);

    if (filteredPosts.length === 0) {
      console.log('No Reddit posts found after subreddit filtering, returning empty result');
      return {
        source: 'reddit',
        total_items: 0,
        topics: [],
      };
    }

    // Step 2c: LLM-based relevance filtering (OPTIONAL - controlled by config)
    let posts = filteredPosts;
    if (FETCH_LIMITS.enableLLMRelevanceFilter) {
      console.log('Filtering posts for relevance with LLM...');
      posts = await filterIrrelevantPosts(filteredPosts, context);
      console.log(`After LLM filtering: ${posts.length} relevant posts (removed ${filteredPosts.length - posts.length} irrelevant)`);

      if (posts.length === 0) {
        console.log('No relevant posts found after LLM filtering, returning empty result');
        return {
          source: 'reddit',
          total_items: 0,
          topics: [],
        };
      }
    } else {
      console.log('Skipping LLM relevance filter (disabled in config for speed)');
    }

    // Step 3: Classify posts with LLM
    console.log('Classifying posts with LLM...');
    const classifications = await classifyRedditPosts(posts);

    // Combine posts with classifications
    const classifiedPosts: ClassifiedRedditPost[] = posts.map((post, i) => ({
      ...post,
      topic: classifications[i].topic,
      direction: classifications[i].direction,
      intensity: classifications[i].intensity,
    }));

    // Step 4: Aggregate by topic
    console.log('Aggregating posts by topic...');
    const topics = aggregateByTopic(classifiedPosts);

    console.log(`=== Reddit Agent Complete: ${topics.length} topics identified ===`);

    return {
      source: 'reddit',
      total_items: posts.length,
      topics,
    };
  } catch (error) {
    console.error('Reddit Agent error:', error);
    // Return empty result on error rather than failing the entire pipeline
    return {
      source: 'reddit',
      total_items: 0,
      topics: [],
    };
  }
}

// ============================================================================
// AGGREGATION LOGIC
// ============================================================================

/**
 * Aggregate classified posts by topic
 */
function aggregateByTopic(posts: ClassifiedRedditPost[]): RedditTopicSummary[] {
  // Group posts by topic
  const topicGroups = new Map<string, ClassifiedRedditPost[]>();

  posts.forEach(post => {
    const topic = post.topic;
    if (!topicGroups.has(topic)) {
      topicGroups.set(topic, []);
    }
    topicGroups.get(topic)!.push(post);
  });

  // Create topic summaries
  const topics: RedditTopicSummary[] = [];

  topicGroups.forEach((posts, topicName) => {
    // Count directions
    const directionCounts = new Map<RedditDirection, number>();
    posts.forEach(post => {
      const count = directionCounts.get(post.direction) || 0;
      directionCounts.set(post.direction, count + 1);
    });

    // Find dominant direction
    let dominantDirection: RedditDirection = 'neutral_observation';
    let maxDirectionCount = 0;
    directionCounts.forEach((count, direction) => {
      if (count > maxDirectionCount) {
        maxDirectionCount = count;
        dominantDirection = direction;
      }
    });

    // Count intensities
    const intensityCounts = new Map<Intensity, number>();
    posts.forEach(post => {
      const count = intensityCounts.get(post.intensity) || 0;
      intensityCounts.set(post.intensity, count + 1);
    });

    // Find dominant intensity (prioritize higher intensity)
    let dominantIntensity: Intensity = 'low';
    if (intensityCounts.get('high')! > 0) {
      dominantIntensity = 'high';
    } else if (intensityCounts.get('medium')! > 0) {
      dominantIntensity = 'medium';
    }

    // Collect sample quotes (up to 3, prefer high engagement posts)
    const sortedPosts = [...posts].sort((a, b) => (b.score || 0) - (a.score || 0));
    const sampleQuotes: string[] = [];

    for (let i = 0; i < Math.min(3, sortedPosts.length); i++) {
      const post = sortedPosts[i];
      let quote = post.title;
      
      // Add body snippet if available and not too long
      if (post.body && post.body.length > 0) {
        const bodySnippet = post.body.substring(0, 100).trim();
        if (bodySnippet) {
          quote = `"${quote}" - ${bodySnippet}${post.body.length > 100 ? '...' : ''}`;
        }
      }
      
      sampleQuotes.push(quote);
    }

    topics.push({
      name: topicName,
      mentions: posts.length,
      dominant_direction: dominantDirection,
      dominant_intensity: dominantIntensity,
      sample_quotes: sampleQuotes,
    });
  });

  // Sort topics by mention count (descending)
  topics.sort((a, b) => b.mentions - a.mentions);

  return topics;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Filter out posts from irrelevant subreddits
 * Uses the user's context (keywords, problem, target users) to determine relevance
 * Removes personal, entertainment, and off-topic subreddits
 */
function filterRelevantPosts(
  posts: import('./types').RedditPost[],
  context: SolutionContext
): import('./types').RedditPost[] {
  // Subreddits to ALWAYS EXCLUDE (universally irrelevant)
  const irrelevantSubreddits = new Set([
    // Personal/relationship
    'relationship_advice', 'relationships', 'dating_advice', 'dating', 'marriage',
    'divorce', 'family', 'parenting', 'amitheasshole', 'advice',
    
    // Entertainment/media
    'movies', 'television', 'anime', 'sports',
    'nfl', 'nba', 'soccer', 'music', 'hiphopheads',
    
    // Politics/news (too noisy for product research)
    'politics', 'worldnews', 'news', 'conservative', 'liberal',
    
    // Memes/humor
    'funny', 'memes', 'dankmemes', 'jokes', 'holup',
    
    // NSFW/adult
    'nsfw', 'askredditafterdark',
    
    // Random/general (too broad, low signal)
    'askreddit', 'tifu', 'casualconversation', 'nostupidquestions',
    'explainlikeimfive', 'todayilearned', 'showerthoughts',
  ]);
  
  // Extract user's domain-specific keywords (lowercase for matching)
  const userKeywords = [
    ...context.keywords.map(k => k.toLowerCase()),
    // Add words from problem and solution
    ...context.problem.toLowerCase().split(' ').filter(w => w.length > 4),
    ...context.solution_summary.toLowerCase().split(' ').filter(w => w.length > 4),
    ...context.target_users.map(u => u.toLowerCase()),
  ];
  
  // Remove duplicates and common words
  const commonWords = new Set(['that', 'this', 'with', 'from', 'have', 'been', 'their', 'about', 'would', 'there', 'which']);
  const relevantKeywords = [...new Set(userKeywords)].filter(word => !commonWords.has(word));
  
  console.log(`Filtering with user keywords: ${relevantKeywords.slice(0, 10).join(', ')}...`);
  
  return posts.filter(post => {
    const subreddit = post.subreddit.toLowerCase();
    
    // Step 1: Exclude universally irrelevant subreddits
    if (irrelevantSubreddits.has(subreddit)) {
      return false;
    }
    
    // Step 2: Keep if subreddit name contains ANY user keyword
    const subredditMatchesKeywords = relevantKeywords.some(keyword => 
      subreddit.includes(keyword)
    );
    
    if (subredditMatchesKeywords) {
      return true;
    }
    
    // Step 3: Check post content for user's keywords
    const titleLower = post.title.toLowerCase();
    const bodyLower = post.body.toLowerCase();
    const content = titleLower + ' ' + bodyLower;
    
    // Count how many of the user's keywords appear in the post
    const keywordMatches = relevantKeywords.reduce((count, keyword) => {
      // Use word boundaries to avoid partial matches
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      return count + (regex.test(content) ? 1 : 0);
    }, 0);
    
    // Keep post if it has at least 2 of the user's keywords
    // This catches relevant posts from unexpected subreddits
    return keywordMatches >= 2;
  });
}

