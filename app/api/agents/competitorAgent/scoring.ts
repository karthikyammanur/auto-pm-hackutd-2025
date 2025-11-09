/**
 * Scoring Logic
 * 
 * Implements the scoring algorithms specified in the PRD.
 * All scores are normalized to [0, 1] range.
 */

import { SOURCE_WEIGHTS, INTENSITY_WEIGHTS, INSIGHT_CONFIG } from './config';
import type {
  Intensity,
  TrendStance,
  ComponentScores,
  SourceContributions,
  Insight,
  OverallViability,
} from './types';

// ============================================================================
// BASIC NORMALIZATION
// ============================================================================

/**
 * Normalize a count to [0, 1] range
 */
export function normalizeCount(count: number, maxCount: number): number {
  if (maxCount === 0) return 0;
  return Math.min(count / maxCount, 1.0);
}

/**
 * Map intensity to numeric weight
 */
export function mapIntensity(intensity: Intensity): number {
  return INTENSITY_WEIGHTS[intensity];
}

// ============================================================================
// COMPONENT SCORES
// ============================================================================

/**
 * Compute Reddit component score
 * Formula: normalized_mentions * intensity_weight
 */
export function computeRedditComponent(
  mentions: number,
  maxMentions: number,
  intensity: Intensity
): number {
  const normalizedMentions = normalizeCount(mentions, maxMentions);
  const intensityWeight = mapIntensity(intensity);
  return normalizedMentions * intensityWeight;
}

/**
 * Compute competitor component score
 * Formula: num_competitors_addressing / total_competitors
 */
export function computeCompetitorComponent(
  numCompetitorsAddressing: number,
  totalCompetitors: number
): number {
  if (totalCompetitors === 0) return 0;
  return Math.min(numCompetitorsAddressing / totalCompetitors, 1.0);
}

/**
 * Compute trend component score based on stance
 * supportive → 1.0, neutral → 0.5, risky → 0.0
 */
export function computeTrendComponent(stance: TrendStance): number {
  switch (stance) {
    case 'supportive':
      return 1.0;
    case 'neutral':
      return 0.5;
    case 'risky':
      return 0.0;
    default:
      return 0.5;
  }
}

/**
 * Compute weighted average of trend stances
 */
export function computeAverageTrendComponent(stances: TrendStance[]): number {
  if (stances.length === 0) return 0.5;
  
  const total = stances.reduce((sum, stance) => {
    return sum + computeTrendComponent(stance);
  }, 0);
  
  return total / stances.length;
}

// ============================================================================
// INSIGHT SCORING
// ============================================================================

/**
 * Compute final insight score using weighted components
 * Formula: w_reddit * reddit + w_competitors * competitor + w_trends * trend
 */
export function computeInsightScore(components: ComponentScores): number {
  const score =
    SOURCE_WEIGHTS.reddit * components.reddit_component +
    SOURCE_WEIGHTS.competitors * components.competitor_component +
    SOURCE_WEIGHTS.industry_trends * components.trend_component;
  
  // Ensure score is in [0, 1]
  return Math.max(0, Math.min(1, score));
}

/**
 * Normalize source contributions to sum to 1.0
 */
export function normalizeSourceContributions(
  components: ComponentScores
): SourceContributions {
  const total =
    components.reddit_component +
    components.competitor_component +
    components.trend_component;
  
  // Avoid division by zero
  if (total === 0) {
    return {
      reddit: 0.33,
      competitors: 0.33,
      industry_trends: 0.34,
    };
  }
  
  return {
    reddit: components.reddit_component / total,
    competitors: components.competitor_component / total,
    industry_trends: components.trend_component / total,
  };
}

// ============================================================================
// OVERALL VIABILITY
// ============================================================================

/**
 * Compute overall viability from insights
 */
export function computeOverallViability(insights: Insight[]): OverallViability {
  if (insights.length === 0) {
    return {
      score: 0,
      confidence: 0,
      notes: 'No insights available for viability assessment.',
    };
  }
  
  // Sort insights by score (descending)
  const sortedInsights = [...insights].sort((a, b) => b.score - a.score);
  
  // Take top N insights for viability calculation
  const topN = Math.min(INSIGHT_CONFIG.topInsightsForViability, sortedInsights.length);
  const topInsights = sortedInsights.slice(0, topN);
  
  // Calculate base score (average of top insights)
  const baseScore = topInsights.reduce((sum, insight) => sum + insight.score, 0) / topN;
  
  // Count high-risk insights in top insights
  const highRiskCount = topInsights.filter(i => i.risk_level === 'high').length;
  const mediumRiskCount = topInsights.filter(i => i.risk_level === 'medium').length;
  
  // Penalty for risks
  const riskPenalty = (highRiskCount * 0.15) + (mediumRiskCount * 0.05);
  
  // Final score with risk adjustment
  const finalScore = Math.max(0, Math.min(1, baseScore - riskPenalty));
  
  // Calculate confidence based on data completeness
  const avgMentions = insights.reduce((sum, i) => sum + i.metrics.mentions_total, 0) / insights.length;
  const avgCompetitors = insights.reduce((sum, i) => sum + i.metrics.num_competitors_addressing, 0) / insights.length;
  
  // Higher confidence if we have more data points
  let confidence = 0.5; // Base confidence
  
  if (avgMentions > 20) confidence += 0.15;
  else if (avgMentions > 10) confidence += 0.1;
  else if (avgMentions > 5) confidence += 0.05;
  
  if (avgCompetitors > 3) confidence += 0.15;
  else if (avgCompetitors > 1) confidence += 0.1;
  else if (avgCompetitors > 0) confidence += 0.05;
  
  if (insights.length >= INSIGHT_CONFIG.maxInsights) confidence += 0.1;
  else if (insights.length >= INSIGHT_CONFIG.minInsights) confidence += 0.05;
  
  confidence = Math.min(1, confidence);
  
  // Generate notes
  const notes = generateViabilityNotes(finalScore, highRiskCount, mediumRiskCount, insights.length);
  
  return {
    score: finalScore,
    confidence,
    notes,
  };
}

/**
 * Generate human-readable notes for viability assessment
 */
function generateViabilityNotes(
  score: number,
  highRiskCount: number,
  mediumRiskCount: number,
  totalInsights: number
): string {
  const scoreCategory = score > 0.7 ? 'high' : score > 0.4 ? 'moderate' : 'low';
  const riskSummary = highRiskCount > 0
    ? `${highRiskCount} high-risk factor${highRiskCount > 1 ? 's' : ''} identified`
    : mediumRiskCount > 0
    ? `${mediumRiskCount} medium-risk factor${mediumRiskCount > 1 ? 's' : ''} noted`
    : 'minimal risk factors detected';
  
  return `Viability score: ${scoreCategory} (${score.toFixed(2)}). Based on ${totalInsights} insight${totalInsights > 1 ? 's' : ''}, ${riskSummary}.`;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Find maximum mentions across all topics/insights
 */
export function findMaxMentions(mentionCounts: number[]): number {
  if (mentionCounts.length === 0) return 1; // Avoid division by zero
  return Math.max(...mentionCounts);
}

/**
 * Calculate average score across insights
 */
export function calculateAverageScore(insights: Insight[]): number {
  if (insights.length === 0) return 0;
  const total = insights.reduce((sum, insight) => sum + insight.score, 0);
  return total / insights.length;
}

/**
 * Filter insights by minimum score threshold
 */
export function filterInsightsByThreshold(insights: Insight[]): Insight[] {
  return insights.filter(insight => insight.score >= INSIGHT_CONFIG.minScoreThreshold);
}

/**
 * Limit insights to max count, keeping highest scored ones
 */
export function limitInsights(insights: Insight[]): Insight[] {
  if (insights.length <= INSIGHT_CONFIG.maxInsights) {
    return insights;
  }
  
  // Sort by score descending and take top N
  return [...insights]
    .sort((a, b) => b.score - a.score)
    .slice(0, INSIGHT_CONFIG.maxInsights);
}

