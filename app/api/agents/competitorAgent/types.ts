/**
 * TypeScript Type Definitions for Customer & Market Research Subgraph
 * 
 * This file contains all interfaces and types used throughout the research module,
 * ensuring type safety and contract compliance with the PRD.
 */

// ============================================================================
// INPUT TYPES
// ============================================================================

/**
 * Input contract to the Research Subgraph
 * Describes the solution that needs to be researched
 */
export interface SolutionContext {
  /** Short description of the user's problem area */
  problem: string;
  
  /** Unique identifier for this solution (snake_case) */
  solution_id: string;
  
  /** Human-readable solution name */
  solution_title: string;
  
  /** 1-3 sentence description of what this solution does */
  solution_summary: string;
  
  /** List of user segments (e.g., 'SMB merchants', 'retail investors') */
  target_users: string[];
  
  /** List of search keywords relevant to the solution/problem */
  keywords: string[];
}

// ============================================================================
// REDDIT AGENT TYPES
// ============================================================================

/**
 * Classification for Reddit post direction
 */
export type RedditDirection = 'pain_point' | 'demand_signal' | 'neutral_observation';

/**
 * Intensity level for Reddit mentions
 */
export type Intensity = 'low' | 'medium' | 'high';

/**
 * Summary of a single topic found in Reddit data
 */
export interface RedditTopicSummary {
  /** Topic name (e.g., pricing, UX, reliability) */
  name: string;
  
  /** Number of times this topic was mentioned */
  mentions: number;
  
  /** Most frequent direction for this topic */
  dominant_direction: RedditDirection;
  
  /** Most frequent or severe intensity for this topic */
  dominant_intensity: Intensity;
  
  /** 1-3 representative quotes or paraphrases */
  sample_quotes: string[];
}

/**
 * Output from the Reddit Agent
 */
export interface RedditAgentOutput {
  source: 'reddit';
  
  /** Total number of posts/comments analyzed */
  total_items: number;
  
  /** Aggregated topics from Reddit research */
  topics: RedditTopicSummary[];
}

/**
 * Raw Reddit post data structure
 */
export interface RedditPost {
  title: string;
  body: string;
  subreddit: string;
  created_at: string;
  url: string;
  score?: number;
  num_comments?: number;
}

/**
 * Classified Reddit post after LLM analysis
 */
export interface ClassifiedRedditPost extends RedditPost {
  topic: string;
  direction: RedditDirection;
  intensity: Intensity;
}

// ============================================================================
// COMPETITOR AGENT TYPES
// ============================================================================

/**
 * Summary of a single competitor
 */
export interface CompetitorSummary {
  /** Competitor name */
  name: string;
  
  /** Features/capabilities related to the solution area */
  relevant_features: string[];
  
  /** What they do especially well or differently */
  unique_edges: string[];
  
  /** Pain points, missing features, or complexity issues */
  weaknesses: string[];
}

/**
 * Output from the Competitor Agent
 */
export interface CompetitorAgentOutput {
  source: 'competitors';
  
  /** List of analyzed competitors */
  competitors: CompetitorSummary[];
}

/**
 * Raw competitor data from web search
 */
export interface CompetitorSearchResult {
  name: string;
  features: string[];
  pricing_notes: string[];
  pros: string[];
  cons: string[];
  url?: string;
}

// ============================================================================
// INDUSTRY TRENDS AGENT TYPES
// ============================================================================

/**
 * Direction of a trend
 */
export type TrendDirection = 'growing' | 'stable' | 'declining';

/**
 * Stance of a trend relative to the solution
 */
export type TrendStance = 'supportive' | 'neutral' | 'risky';

/**
 * Summary of a single industry trend
 */
export interface TrendSummary {
  /** Short name for the trend */
  name: string;
  
  /** Whether the trend is growing, stable, or declining */
  direction: TrendDirection;
  
  /** How the trend affects the solution */
  stance: TrendStance;
  
  /** Short quote or paraphrase from the source */
  evidence_snippet: string;
  
  /** One sentence about what this means for the solution */
  implication_for_solution: string;
}

/**
 * Output from the Industry Trends Agent
 */
export interface IndustryTrendsAgentOutput {
  source: 'industry_trends';
  
  /** List of identified trends */
  trends: TrendSummary[];
}

/**
 * Raw trend/news data from web search
 */
export interface TrendSearchResult {
  title: string;
  snippet: string;
  published_at: string;
  url: string;
  source?: string;
}

// ============================================================================
// AGGREGATOR & INSIGHT TYPES
// ============================================================================

/**
 * Type of insight
 */
export type InsightType = 'problem' | 'feature_request' | 'opportunity' | 'risk';

/**
 * Risk level associated with an insight
 */
export type RiskLevel = 'low' | 'medium' | 'high';

/**
 * Contribution of each source to an insight (must sum to ~1.0)
 */
export interface SourceContributions {
  reddit: number;
  competitors: number;
  industry_trends: number;
}

/**
 * Metrics associated with an insight
 */
export interface InsightMetrics {
  /** Total mentions from Reddit */
  mentions_total: number;
  
  /** Number of competitors addressing this area */
  num_competitors_addressing: number;
  
  /** Optional time window for the data */
  time_window?: string;
}

/**
 * A single insight derived from research data
 */
export interface Insight {
  /** Unique identifier for this insight (snake_case) */
  id: string;
  
  /** Concise insight title */
  title: string;
  
  /** Overall score for this insight (0-1) */
  score: number;
  
  /** How much each source contributed to this insight */
  source_contributions: SourceContributions;
  
  /** Quantitative metrics */
  metrics: InsightMetrics;
  
  /** Topic category (e.g., pricing, UX, reliability, onboarding, regulation) */
  topic: string;
  
  /** Direction of the insight */
  direction: RedditDirection;
  
  /** Type of insight */
  type: InsightType;
  
  /** Intensity level */
  intensity: Intensity;
  
  /** What this means for the solution's design, priority, or risk */
  implication: string;
  
  /** Risk level associated with this insight */
  risk_level: RiskLevel;
  
  /** Concrete recommended next steps for the PM/team */
  suggested_actions: string[];
  
  /** Short paraphrased or direct user/market quotes */
  example_quotes: string[];
}

/**
 * Overall viability assessment for the solution
 */
export interface OverallViability {
  /** Viability score (0-1) */
  score: number;
  
  /** Confidence in the assessment (0-1) */
  confidence: number;
  
  /** Short explanation behind score and confidence */
  notes: string;
}

/**
 * Summary of raw data sources
 */
export interface RawSourcesSummary {
  reddit: {
    total_items: number;
    notes: string;
  };
  competitors: {
    num_competitors: number;
    notes: string;
  };
  industry_trends: {
    num_trends: number;
    notes: string;
  };
}

/**
 * Complete research result with all insights and metadata
 */
export interface ResearchResult {
  /** Solution ID this research is for */
  solution_id: string;
  
  /** Overall viability assessment */
  overall_viability: OverallViability;
  
  /** List of insights (typically 3-7) */
  insights: Insight[];
  
  /** Summary of raw data sources */
  raw_sources_summary: RawSourcesSummary;
}

// ============================================================================
// OUTPUT TYPES
// ============================================================================

/**
 * Simplified trend for output
 */
export interface SimplifiedTrend {
  trend: string;
  summary: string;
  impact: 'positive' | 'neutral' | 'negative';
}

/**
 * Simplified competitor for output
 */
export interface SimplifiedCompetitor {
  name: string;
  description: string;
  strengths: string;
  weaknesses: string;
}

/**
 * Competitive analysis section
 */
export interface CompetitiveAnalysis {
  competitors: SimplifiedCompetitor[];
  market_position: string;
}

/**
 * Final output from the Research Module (Clean, simplified version)
 * This is what the subgraph returns to the caller
 */
export interface ResearchModuleOutput {
  /** Solution ID (same as input) */
  solution_id: string;
  
  /** Comprehensive summary for PM/chatbot */
  summary_for_pm: string;
  
  /** Customer voice - single paragraph summary */
  customer_voice: string;
  
  /** Industry trends - 2-3 liner summaries */
  industry_trends: SimplifiedTrend[];
  
  /** Competitive analysis with market position */
  competitive_analysis: CompetitiveAnalysis;
}

// ============================================================================
// LANGGRAPH STATE TYPES
// ============================================================================

/**
 * Internal state object used by LangGraph during execution
 */
export interface ResearchGraphState {
  /** Input solution context */
  solutionContext: SolutionContext;
  
  /** Reddit agent output (populated after reddit agent runs) */
  redditData?: RedditAgentOutput;
  
  /** Competitor agent output (populated after competitor agent runs) */
  competitorData?: CompetitorAgentOutput;
  
  /** Industry trends agent output (populated after trends agent runs) */
  trendsData?: IndustryTrendsAgentOutput;
  
  /** Final research output (populated by aggregator agent) */
  result?: ResearchModuleOutput;
  
  /** Error tracking */
  errors?: string[];
}

// ============================================================================
// LLM CLASSIFICATION RESULT TYPES
// ============================================================================

/**
 * Result from LLM classification of a Reddit post
 */
export interface RedditClassificationResult {
  topic: string;
  direction: RedditDirection;
  intensity: Intensity;
  reasoning?: string;
}

/**
 * Result from LLM analysis of competitor data
 */
export interface CompetitorAnalysisResult {
  relevant_features: string[];
  unique_edges: string[];
  weaknesses: string[];
}

/**
 * Result from LLM analysis of a trend
 */
export interface TrendAnalysisResult {
  name: string;
  direction: TrendDirection;
  stance: TrendStance;
  implication: string;
  reasoning?: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Generic API response wrapper for error handling
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  retries?: number;
}

/**
 * Web search result (generic structure for both Tavily and Serper)
 */
export interface WebSearchResult {
  title: string;
  snippet: string;
  url: string;
  published_date?: string;
  source?: string;
}

/**
 * Component scores used in aggregator calculations
 */
export interface ComponentScores {
  reddit_component: number;
  competitor_component: number;
  trend_component: number;
}

/**
 * Intermediate insight data before final Insight object is created
 */
export interface InsightCandidate {
  topic: string;
  direction: RedditDirection;
  type: InsightType;
  intensity: Intensity;
  reddit_mentions: number;
  num_competitors: number;
  trend_stance: TrendStance;
  quotes: string[];
  related_trends: string[];
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if a value is a valid RedditDirection
 */
export function isRedditDirection(value: string): value is RedditDirection {
  return ['pain_point', 'demand_signal', 'neutral_observation'].includes(value);
}

/**
 * Type guard to check if a value is a valid Intensity
 */
export function isIntensity(value: string): value is Intensity {
  return ['low', 'medium', 'high'].includes(value);
}

/**
 * Type guard to check if a value is a valid TrendDirection
 */
export function isTrendDirection(value: string): value is TrendDirection {
  return ['growing', 'stable', 'declining'].includes(value);
}

/**
 * Type guard to check if a value is a valid TrendStance
 */
export function isTrendStance(value: string): value is TrendStance {
  return ['supportive', 'neutral', 'risky'].includes(value);
}

/**
 * Type guard to check if source contributions sum to approximately 1.0
 */
export function isValidSourceContributions(contributions: SourceContributions): boolean {
  const sum = contributions.reddit + contributions.competitors + contributions.industry_trends;
  return Math.abs(sum - 1.0) < 0.01; // Allow small rounding error
}

