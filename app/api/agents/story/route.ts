import { NextRequest, NextResponse } from 'next/server';
import { generateStory } from './tools';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { epic } = body;

    if (!epic) {
      return NextResponse.json(
        { error: 'Epic description is required' },
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

    console.log('Generating user story for epic:', epic);

    const story = await generateStory(epic);

    return NextResponse.json({
      success: true,
      story,
      message: 'User story generated successfully'
    });
  } catch (error) {
    console.error('Error generating user story:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to generate user story'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'User Story Generator API',
    description: 'Generates user stories with acceptance criteria, NFRs, and telemetry plan from epic descriptions',
    usage: {
      method: 'POST',
      endpoint: '/api/agents/story',
      body: {
        epic: 'Your epic description here (e.g., "As a university, we want to provide students with...")'
      }
    }
  });
}