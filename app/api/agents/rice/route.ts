import { NextRequest, NextResponse } from 'next/server';
import { analyzeRicePrioritization, Feature } from './tools';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { features } = body;

    // Check if API key is set
    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json(
        { error: 'GOOGLE_API_KEY environment variable is not set' },
        { status: 500 }
      );
    }

    console.log('Analyzing RICE prioritization for features:', features || 'using defaults');

    const result = await analyzeRicePrioritization(features as Feature[] | undefined);

    return NextResponse.json({
      success: true,
      sortedFeatures: result.sortedFeatures,
      analysis: result.analysis,
      message: 'RICE analysis completed successfully'
    });
  } catch (error) {
    console.error('Error analyzing RICE:', error);
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

export async function GET() {
  return NextResponse.json({
    message: 'RICE Prioritization API',
    usage: {
      method: 'POST',
      endpoint: '/api/agents/rice',
      body: {
        features: [
          {
            name: 'Feature name',
            reach: 10000,
            impact: 2.0,
            confidence: 0.8,
            effort: 15
          }
        ]
      },
      note: 'Features parameter is optional. If not provided, default features will be used.'
    }
  });
}
