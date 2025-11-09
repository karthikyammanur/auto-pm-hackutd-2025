import { NextRequest, NextResponse } from 'next/server';
import { analyzeIdea } from './tools';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Check if API keys are set
    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json(
        { error: 'GOOGLE_API_KEY environment variable is not set' },
        { status: 500 }
      );
    }

    if (!process.env.TAVILY_API_KEY) {
      return NextResponse.json(
        { error: 'TAVILY_API_KEY environment variable is not set' },
        { status: 500 }
      );
    }

    console.log('Analyzing idea/problem:', query);

    const analysis = await analyzeIdea(query);

    return NextResponse.json({
      success: true,
      analysis,
      message: 'Idea analysis completed successfully'
    });
  } catch (error) {
    console.error('Error analyzing idea:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to analyze idea'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Internet Search & Idea Analysis API',
    description: 'Analyzes problems and ideas using internet search with Tavily and provides structured solutions',
    usage: {
      method: 'POST',
      endpoint: '/api/agents/search',
      body: {
        query: 'Your problem or idea to research (e.g., "How to improve customer retention in SaaS")'
      }
    },
    examples: [
      'How to reduce app loading time',
      'Best practices for user onboarding',
      'Ways to improve team productivity',
      'Strategies for increasing website conversion rates'
    ]
  });
}
