import { NextRequest, NextResponse } from 'next/server';
import { analyzeRicePrioritization, generateAndAnalyzeRice, Feature } from './tools';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { features, solution } = body;

    // Check if API key is set
    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json(
        { error: 'GOOGLE_API_KEY environment variable is not set' },
        { status: 500 }
      );
    }

    // Two modes: 
    // 1. Generate features from solution (new mode)
    // 2. Analyze provided features (legacy mode)
    
    if (solution) {
      console.log('[RICE Agent API] Generating features from solution:', solution.substring(0, 100) + '...');
      
      const result = await generateAndAnalyzeRice(solution);
      
      return NextResponse.json({
        success: true,
        features: result.features,
        sortedFeatures: result.sortedFeatures,
        analysis: result.analysis,
        message: 'RICE analysis completed successfully'
      });
    } else if (features && Array.isArray(features) && features.length > 0) {
      console.log('[RICE Agent API] Analyzing provided features:', features);
      
      const result = await analyzeRicePrioritization(features as Feature[]);
      
      return NextResponse.json({
        success: true,
        sortedFeatures: result.sortedFeatures,
        analysis: result.analysis,
        message: 'RICE analysis completed successfully'
      });
    } else {
      return NextResponse.json(
        { error: 'Either "solution" string or "features" array is required' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('[RICE Agent API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to analyze features'
      },
      { status: 500 }
    );
  }
}
