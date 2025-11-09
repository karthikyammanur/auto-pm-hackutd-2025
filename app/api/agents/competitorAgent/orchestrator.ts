/**
 * Research Orchestrator
 * 
 * Orchestrates the execution of all research agents in the correct order.
 * Runs Reddit, Competitor, and Industry agents in parallel, then aggregates results.
 */

import { runRedditAgent } from './reddit-agent';
import { runCompetitorAgent } from './competitor-agent';
import { runIndustryTrendsAgent } from './industry-trends-agent';
import { runAggregatorAgent } from './aggregator-agent';
import type { SolutionContext, ResearchModuleOutput } from './types';

// ============================================================================
// ORCHESTRATOR
// ============================================================================

/**
 * Main orchestrator function
 * Runs the complete research pipeline
 * 
 * @param context - The solution context to research
 * @returns Complete research results with insights and viability assessment
 */
export async function runResearchPipeline(
  context: SolutionContext
): Promise<ResearchModuleOutput> {
  console.log('\n' + '='.repeat(80));
  console.log('🚀 RESEARCH PIPELINE STARTED');
  console.log('='.repeat(80));
  console.log(`Solution: ${context.solution_title}`);
  console.log(`Problem: ${context.problem}`);
  console.log(`Keywords: ${context.keywords.join(', ')}`);
  console.log(`Target Users: ${context.target_users.join(', ')}`);
  console.log('='.repeat(80) + '\n');

  const startTime = Date.now();

  try {
    // PHASE 1: Run data collection agents sequentially (to respect rate limits)
    console.log('📊 PHASE 1: Running data collection agents sequentially...\n');
    
    // Step 1: Reddit Agent
    console.log('🔍 Step 1/3: Running Reddit Agent...');
    const redditData = await runRedditAgent(context);
    console.log(`✅ Reddit Agent complete: ${redditData.total_items} posts, ${redditData.topics.length} topics\n`);
    
    // Step 2: Competitor Agent
    console.log('🏢 Step 2/3: Running Competitor Agent...');
    const competitorData = await runCompetitorAgent(context);
    console.log(`✅ Competitor Agent complete: ${competitorData.competitors.length} competitors analyzed\n`);
    
    // Step 3: Industry Trends Agent
    console.log('📈 Step 3/3: Running Industry Trends Agent...');
    const trendsData = await runIndustryTrendsAgent(context);
    console.log(`✅ Trends Agent complete: ${trendsData.trends.length} trends identified\n`);

    console.log('\n✅ PHASE 1 COMPLETE: All data collected\n');
    console.log('Summary:');
    console.log(`  - Reddit: ${redditData.total_items} posts, ${redditData.topics.length} topics`);
    console.log(`  - Competitors: ${competitorData.competitors.length} analyzed`);
    console.log(`  - Trends: ${trendsData.trends.length} identified\n`);

    // PHASE 2: Aggregate and generate insights
    console.log('🔬 PHASE 2: Aggregating data and generating insights...\n');
    
    const result = await runAggregatorAgent(
      context,
      redditData,
      competitorData,
      trendsData
    );

    const endTime = Date.now();
    const totalTime = ((endTime - startTime) / 1000).toFixed(2);

    console.log('\n✅ PHASE 2 COMPLETE: Research aggregated\n');
    console.log('Final Results:');
    console.log(`  - Customer Voice: ${result.customer_voice.substring(0, 80)}...`);
    console.log(`  - Industry Trends: ${result.industry_trends.length} trends`);
    console.log(`  - Competitors: ${result.competitive_analysis.competitors.length} analyzed`);
    console.log('\n' + '='.repeat(80));
    console.log(`✨ PIPELINE COMPLETE in ${totalTime}s`);
    console.log('='.repeat(80) + '\n');

    return result;
  } catch (error) {
    const endTime = Date.now();
    const totalTime = ((endTime - startTime) / 1000).toFixed(2);

    console.error('\n' + '='.repeat(80));
    console.error('❌ PIPELINE FAILED');
    console.error('='.repeat(80));
    console.error(`Error after ${totalTime}s:`, error);
    console.error('='.repeat(80) + '\n');

    throw error;
  }
}

