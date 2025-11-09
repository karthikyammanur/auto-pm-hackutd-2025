/**
 * Aggregator Agent
 * 
 * Synthesizes data from all sources into clean, human-readable output.
 * Part of the research subgraph pipeline.
 */

import type {
  SolutionContext,
  RedditAgentOutput,
  CompetitorAgentOutput,
  IndustryTrendsAgentOutput,
  ResearchModuleOutput,
  SimplifiedTrend,
  SimplifiedCompetitor,
} from './types';

// ============================================================================
// AGGREGATOR AGENT
// ============================================================================

/**
 * Main Aggregator Agent function
 * Combines all research data and generates clean, simplified output
 */
export async function runAggregatorAgent(
  context: SolutionContext,
  redditData: RedditAgentOutput,
  competitorData: CompetitorAgentOutput,
  trendsData: IndustryTrendsAgentOutput
): Promise<ResearchModuleOutput> {
  console.log('=== Aggregator Agent Started ===');
  console.log(`Solution: ${context.solution_title}`);

  try {
    // Step 1: Generate PM summary
    const summaryForPM = generatePMSummary(
      context,
      redditData,
      competitorData,
      trendsData
    );

    // Step 2: Generate customer voice paragraph
    const customerVoice = generateCustomerVoice(redditData);

    // Step 3: Simplify industry trends
    const simplifiedTrends = simplifyTrends(trendsData);

    // Step 4: Build competitive analysis
    const competitiveAnalysis = buildCompetitiveAnalysis(competitorData);

    // Step 5: Build final output
    const result: ResearchModuleOutput = {
      solution_id: context.solution_id,
      summary_for_pm: summaryForPM,
      customer_voice: customerVoice,
      industry_trends: simplifiedTrends,
      competitive_analysis: competitiveAnalysis,
    };

    console.log('=== Aggregator Agent Complete ===');
    return result;
  } catch (error) {
    console.error('Aggregator Agent error:', error);
    throw error;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate comprehensive PM summary
 */
function generatePMSummary(
  context: SolutionContext,
  redditData: RedditAgentOutput,
  competitorData: CompetitorAgentOutput,
  trendsData: IndustryTrendsAgentOutput
): string {
  const parts: string[] = [];

  // Opening statement
  parts.push(`Research for '${context.solution_title}' analyzed ${redditData.total_items} Reddit posts, ${competitorData.competitors.length} competitors, and ${trendsData.trends.length} industry trends.`);

  // Key customer frustrations from Reddit
  if (redditData.topics.length > 0) {
    const painPoints = redditData.topics.filter(t => t.dominant_direction === 'pain_point');
    if (painPoints.length > 0) {
      const topTopics = painPoints.slice(0, 2).map(t => t.name).join(' and ');
      parts.push(`Key customer frustrations include ${topTopics}.`);
    }
  }

  // Market trends
  const supportiveTrends = trendsData.trends.filter(t => t.stance === 'supportive');
  if (supportiveTrends.length > 0) {
    parts.push(`Market trends are favorable with ${supportiveTrends[0].name} ${trendsData.trends[0].direction}.`);
  }

  // Competition
  if (competitorData.competitors.length > 0) {
    const competitorNames = competitorData.competitors.map(c => c.name).join(', ');
    parts.push(`Competition is strong with ${competitorNames}, but they're expensive and complex.`);
  }

  // Overall assessment
  const hasHighCompetition = competitorData.competitors.length >= 3;
  const hasLowCustomerPain = redditData.total_items < 10;
  
  let assessment = 'moderate opportunity';
  if (hasHighCompetition && hasLowCustomerPain) {
    assessment = 'challenging market with significant competition';
  } else if (!hasHighCompetition && redditData.total_items > 20) {
    assessment = 'strong market opportunity with clear demand';
  }

  parts.push(`Overall assessment: ${assessment}.`);

  return parts.join(' ');
}

/**
 * Generate customer voice paragraph from Reddit data
 */
function generateCustomerVoice(redditData: RedditAgentOutput): string {
  if (redditData.total_items === 0) {
    return 'No customer voice data available from Reddit posts.';
  }

  const sentences: string[] = [];

  // Identify main problems
  const painPoints = redditData.topics.filter(t => t.dominant_direction === 'pain_point');
  const highIntensity = painPoints.filter(t => t.dominant_intensity === 'high');

  if (highIntensity.length > 0) {
    const problems = highIntensity.map(t => t.name).join(', ');
    sentences.push(`Customers are deeply frustrated with ${problems}.`);
  }

  // Add context from quotes
  const allQuotes = redditData.topics.flatMap(t => t.sample_quotes);
  if (allQuotes.length > 0) {
    // Extract sentiment from quotes
    const hasComplaintsAboutDoctors = allQuotes.some(q => 
      q.toLowerCase().includes('doctor') || 
      q.toLowerCase().includes('physician') ||
      q.toLowerCase().includes('gp')
    );
    
    const hasDiagnosisIssues = allQuotes.some(q => 
      q.toLowerCase().includes('diagnos') || 
      q.toLowerCase().includes('misdiagnos')
    );

    if (hasDiagnosisIssues) {
      sentences.push('Many report misdiagnoses, medical errors, and difficulty getting accurate diagnoses.');
    }

    if (hasComplaintsAboutDoctors) {
      sentences.push('Common complaints include doctors who don\'t take concerns seriously and difficulty accessing specialist support.');
    }
  }

  // Add demand/opportunity
  const demandSignals = redditData.topics.filter(t => t.dominant_direction === 'demand_signal');
  if (demandSignals.length > 0) {
    sentences.push(`There's strong demand for better solutions in ${demandSignals.map(d => d.name).join(' and ')}.`);
  } else {
    sentences.push('There\'s strong demand for more accurate, accessible diagnostic tools.');
  }

  return sentences.join(' ');
}

/**
 * Simplify industry trends for output
 */
function simplifyTrends(trendsData: IndustryTrendsAgentOutput): SimplifiedTrend[] {
  return trendsData.trends.map(trend => {
    // Determine impact based on stance
    let impact: 'positive' | 'neutral' | 'negative';
    if (trend.stance === 'supportive') {
      impact = 'positive';
    } else if (trend.stance === 'risky') {
      impact = 'negative';
    } else {
      impact = 'neutral';
    }

    // Create readable summary
    const directionText = trend.direction === 'growing' ? 'increasing' : 
                          trend.direction === 'declining' ? 'decreasing' : 'stable';
    
    const summary = `${trend.evidence_snippet.substring(0, 150)}... ${trend.implication_for_solution}`;

    return {
      trend: trend.name,
      summary: summary,
      impact: impact,
    };
  });
}

/**
 * Build competitive analysis section
 */
function buildCompetitiveAnalysis(competitorData: CompetitorAgentOutput) {
  const competitors: SimplifiedCompetitor[] = competitorData.competitors.map(comp => {
    // Combine relevant features into description
    const description = comp.relevant_features.length > 0
      ? comp.relevant_features[0] + (comp.relevant_features.length > 1 ? ' and more' : '')
      : 'Competitor in this space';

    // Format strengths
    const strengths = comp.unique_edges.length > 0
      ? comp.unique_edges.join(', ')
      : (comp.relevant_features.slice(0, 2).join(', ') || 'Established market presence');

    // Format weaknesses  
    const weaknesses = comp.weaknesses.length > 0
      ? comp.weaknesses.join(', ')
      : 'No significant weaknesses identified';

    return {
      name: comp.name,
      description: description,
      strengths: strengths,
      weaknesses: weaknesses,
    };
  });

  // Generate market position summary
  let marketPosition = '';
  if (competitors.length === 0) {
    marketPosition = 'No direct competitors identified. Opportunity to enter an underserved market.';
  } else if (competitors.length === 1) {
    marketPosition = `One main competitor (${competitors[0].name}). Opportunity to differentiate and capture market share.`;
  } else if (competitors.length <= 3) {
    marketPosition = `Competitive market with ${competitors.length} main players. Competitors are established but have weaknesses you can exploit. Focus on being simpler, faster, or more accessible.`;
  } else {
    marketPosition = `Highly competitive market with ${competitors.length}+ players. Differentiation will be critical. Look for underserved niches or gaps in existing solutions.`;
  }

  return {
    competitors: competitors,
    market_position: marketPosition,
  };
}
