import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import connectDB from '@/lib/mongodb';
import Space from '@/models/Space';
import { generateStory } from '@/app/api/agents/story/tools';
import mongoose from 'mongoose';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await auth0.getSession();

    if (!session?.user) {
      console.log('[POST /api/spaces/[id]/run-story-agent] Unauthorized - no session');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log(`[POST /api/spaces/${id}/run-story-agent] Invalid space ID format`);
      return NextResponse.json(
        { error: 'Invalid space ID' },
        { status: 400 }
      );
    }

    await connectDB();

    const space = await Space.findOne({
      _id: id,
      userId: session.user.sub,
    });

    if (!space) {
      console.log(`[POST /api/spaces/${id}/run-story-agent] Space not found or unauthorized`);
      return NextResponse.json(
        { error: 'Space not found' },
        { status: 404 }
      );
    }

    // Validate that we're on step 2
    if (space.currentStep !== 2) {
      console.log(`[POST /api/spaces/${id}/run-story-agent] Agent can only run on step 2. Current step: ${space.currentStep}`);
      return NextResponse.json(
        { error: 'Story agent can only be run on step 2' },
        { status: 400 }
      );
    }

    // Validate that a solution was selected in the previous step
    const selectedSolution = (space.ideaAgent as any)?.selectedSolution;
    if (!selectedSolution) {
      console.log(`[POST /api/spaces/${id}/run-story-agent] No solution selected from Idea Agent`);
      return NextResponse.json(
        { error: 'Please select a solution from the Idea Generation step before proceeding' },
        { status: 400 }
      );
    }

    console.log(`[POST /api/spaces/${id}/run-story-agent] Generating story for solution: ${selectedSolution.substring(0, 50)}...`);

    // Run the story agent with the selected solution as the epic
    const storyMarkdown = await generateStory(selectedSolution);

    console.log('[POST /api/spaces/[id]/run-story-agent] Story generated successfully');

    // Store the story in the database
    const storyAgentData = {
      storyMarkdown: storyMarkdown,
      generatedAt: new Date(),
    };

    space.set('storyAgent', storyAgentData);
    
    // Move to next step only if not already moved
    if (space.currentStep === 2) {
      space.currentStep = 3;
    }

    console.log('[POST /api/spaces/[id]/run-story-agent] About to save space...');
    
    try {
      await space.save();
      console.log('[POST /api/spaces/[id]/run-story-agent] Space saved successfully');
    } catch (saveError: any) {
      console.error('[POST /api/spaces/[id]/run-story-agent] Save error:', saveError);
      console.error('[POST /api/spaces/[id]/run-story-agent] Validation errors:', saveError.errors);
      throw saveError;
    }

    console.log(`[POST /api/spaces/${id}/run-story-agent] Successfully completed story generation`);

    return NextResponse.json({
      success: true,
      data: space.storyAgent,
    });
  } catch (error: any) {
    console.error('[POST /api/spaces/[id]/run-story-agent] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to run story agent', 
        details: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}

