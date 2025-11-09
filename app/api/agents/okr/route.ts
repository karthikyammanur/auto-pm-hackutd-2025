import { NextRequest, NextResponse } from 'next/server';
import { analyzeOKR, getOKRSummary, clearOKRCache } from './tools';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, action } = body;

    // Check if API key is set
    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json(
        { error: 'GOOGLE_API_KEY environment variable is not set' },
        { status: 500 }
      );
    }

    // Handle different actions
    if (action === 'summary') {
      console.log('Generating OKR summary...');
      const summary = await getOKRSummary();
      return NextResponse.json({
        success: true,
        answer: summary,
        message: 'OKR summary generated successfully'
      });
    }

    if (action === 'clear-cache') {
      clearOKRCache();
      return NextResponse.json({
        success: true,
        message: 'Cache cleared successfully'
      });
    }

    // Default action: answer question
    if (!question) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    console.log('Analyzing OKR question:', question);

    const answer = await analyzeOKR(question);

    return NextResponse.json({
      success: true,
      answer,
      message: 'Question answered successfully'
    });
  } catch (error) {
    console.error('Error analyzing OKR:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to analyze OKR document'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'OKR Analysis API (RAG-powered)',
    description: 'Ask questions about the NextWave Technologies Q1 2025 OKR document',
    usage: {
      method: 'POST',
      endpoint: '/api/agents/okr',
      body: {
        question: 'Your question about the OKR document (e.g., "What are the Engineering objectives?")',
        action: 'Optional: "summary" to get full summary, "clear-cache" to reload PDF'
      }
    },
    examples: [
      'What are the main objectives for Q1 2025?',
      'What are the key results for the Sales team?',
      'What is the target revenue growth?',
      'Which departments are mentioned in the document?'
    ]
  });
}
