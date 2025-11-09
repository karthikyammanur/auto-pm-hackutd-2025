import { NextRequest, NextResponse } from 'next/server';
import { orchestrateAnalysis } from './tools';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
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

    console.log('Starting comprehensive analysis orchestration for:', prompt);

    const analysis = await orchestrateAnalysis(prompt);

    return NextResponse.json({
      success: true,
      data: analysis,
      message: 'Comprehensive analysis completed successfully'
    });
  } catch (error) {
    console.error('Error in orchestration:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to complete comprehensive analysis'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Comprehensive Analysis Orchestrator API',
    description: 'Orchestrates multiple agents (OKR, Search, Feedback, News, Competitors) and returns structured JSON data',
    usage: {
      method: 'POST',
      endpoint: '/api/agents/orchestrator',
      body: {
        prompt: 'Your product or idea to analyze (e.g., "AI-powered customer support chatbot")'
      }
    },
    data_structure: {
      metadata: 'Prompt, timestamp, sources',
      customer_feedback: 'Sentiment analysis, themes, pain points, quotes',
      okr: 'OKR alignment analysis',
      industry_news: 'Recent news and trends',
      competitor_insights: 'Competitor analysis and market position'
    },
    examples: [
      'AI-powered customer support chatbot',
      'Mobile app for fitness tracking',
      'SaaS platform for project management',
      'E-commerce marketplace for handmade goods'
    ]
  });
}
