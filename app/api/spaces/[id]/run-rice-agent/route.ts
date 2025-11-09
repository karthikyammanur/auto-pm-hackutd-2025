import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import connectDB from '@/lib/mongodb';
import Space from '@/models/Space';
import { generateAndAnalyzeRice } from '@/app/api/agents/rice/tools';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const resolvedParams = await Promise.resolve(params);
  const { id } = resolvedParams;

  console.log(`[POST /api/spaces/${id}/run-rice-agent] Starting RICE agent...`);

  try {
    // Check authentication
    const session = await auth0.getSession();
    if (!session?.user) {
      console.log(`[POST /api/spaces/${id}/run-rice-agent] Unauthorized`);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Connect to MongoDB
    await connectDB();
    console.log(`[POST /api/spaces/${id}/run-rice-agent] Connected to MongoDB`);

    // Find the space
    const space = await Space.findById(id);
    if (!space) {
      console.log(`[POST /api/spaces/${id}/run-rice-agent] Space not found`);
      return NextResponse.json(
        { error: 'Space not found' },
        { status: 404 }
      );
    }

    // Verify user owns this space
    if (space.userId !== session.user.sub) {
      console.log(`[POST /api/spaces/${id}/run-rice-agent] User does not own space`);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Validate that user is on step 4
    if (space.currentStep !== 4) {
      console.log(`[POST /api/spaces/${id}/run-rice-agent] Wrong step: ${space.currentStep}`);
      return NextResponse.json(
        { error: 'RICE agent can only be run on step 4' },
        { status: 400 }
      );
    }

    // Validate that a solution was selected in Step 1
    const selectedSolution = (space.ideaAgent as any)?.selectedSolution;
    if (!selectedSolution) {
      console.log(`[POST /api/spaces/${id}/run-rice-agent] No selected solution found from Idea Agent`);
      return NextResponse.json(
        { error: 'Please select a solution in Step 1 before proceeding' },
        { status: 400 }
      );
    }

    console.log(`[POST /api/spaces/${id}/run-rice-agent] Running RICE analysis with solution: ${selectedSolution.substring(0, 50)}...`);

    // Run the RICE agent with the selected solution
    const result = await generateAndAnalyzeRice(selectedSolution);
    console.log(`[POST /api/spaces/${id}/run-rice-agent] RICE analysis complete. Generated ${result.features.length} features`);

    // Prepare RICE agent data for MongoDB
    const riceAgentData = {
      features: result.features,
      sortedFeatures: result.sortedFeatures,
      analysis: result.analysis,
      generatedAt: new Date(),
    };

    // Update space with RICE data
    space.set('riceAgent', riceAgentData);
    space.markModified('riceAgent');

    // Advance to next step (step 5 - OKR) if this is the first time
    if (space.currentStep === 4) {
      space.currentStep = 5;
      console.log(`[POST /api/spaces/${id}/run-rice-agent] Advanced to step 5`);
    }

    // Save the updated space
    try {
      await space.save();
      console.log(`[POST /api/spaces/${id}/run-rice-agent] Space saved successfully`);
    } catch (saveError) {
      console.error(`[POST /api/spaces/${id}/run-rice-agent] Error saving space:`, saveError);
      throw saveError;
    }

    return NextResponse.json({
      success: true,
      data: riceAgentData,
      message: 'RICE analysis completed successfully',
    });
  } catch (error) {
    console.error('[POST /api/spaces/[id]/run-rice-agent] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to run RICE agent',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

