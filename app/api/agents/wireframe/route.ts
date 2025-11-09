import { NextRequest, NextResponse } from 'next/server';
import { generateWireframe } from './tools';

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

    // Check if API key is set
    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json(
        { error: 'GOOGLE_API_KEY environment variable is not set' },
        { status: 500 }
      );
    }

    console.log('Generating wireframe for prompt:', prompt);
    const html = await generateWireframe(prompt);

    return NextResponse.json({
      success: true,
      html,
      message: 'Wireframe generated successfully'
    });
  } catch (error) {
    console.error('Error generating wireframe:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to generate wireframe'
      },
      { status: 500 }
    );
  }
}
