import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import connectDB from '@/lib/mongodb';
import Space from '@/models/Space';
import mongoose from 'mongoose';
import { analyzeIdea } from '@/app/api/agents/ideaAgent/ideaAgent';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await auth0.getSession();
    
    if (!session?.user) {
      console.log('[POST /api/spaces/[id]/run-idea-agent] Unauthorized - no session');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;

    console.log(`[POST /api/spaces/${id}/run-idea-agent] Running idea agent for user: ${session.user.sub}`);

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log(`[POST /api/spaces/${id}/run-idea-agent] Invalid space ID format`);
      return NextResponse.json(
        { error: 'Invalid space ID' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find space and verify ownership
    const space = await Space.findOne({
      _id: id,
      userId: session.user.sub,
    });

    if (!space) {
      console.log(`[POST /api/spaces/${id}/run-idea-agent] Space not found or unauthorized`);
      return NextResponse.json(
        { error: 'Space not found' },
        { status: 404 }
      );
    }

    // Allow running if on step 1, or if user is backtracking to rerun
    // (we allow rerunning even if they've moved past step 1)
    console.log(`[POST /api/spaces/${id}/run-idea-agent] Current step: ${space.currentStep}`);

    console.log(`[POST /api/spaces/${id}/run-idea-agent] Analyzing problem: ${space.problemStatement.substring(0, 50)}...`);

    // Run the idea agent
    const analysis = await analyzeIdea(space.problemStatement);

    console.log('[POST /api/spaces/[id]/run-idea-agent] RAW Analysis result:', JSON.stringify(analysis, null, 2));
    console.log('[POST /api/spaces/[id]/run-idea-agent] solutions type:', typeof analysis.solutions);
    console.log('[POST /api/spaces/[id]/run-idea-agent] solutions isArray:', Array.isArray(analysis.solutions));

    // Ensure solutions is properly formatted as an array
    let solutionsArray: string[] = [];
    if (Array.isArray(analysis.solutions)) {
      solutionsArray = analysis.solutions.filter((s): s is string => typeof s === 'string');
      console.log('[POST /api/spaces/[id]/run-idea-agent] Solutions was array, filtered to:', solutionsArray.length, 'items');
    } else if (typeof analysis.solutions === 'string') {
      // If it's a single string, wrap it in an array
      solutionsArray = [analysis.solutions];
      console.log('[POST /api/spaces/[id]/run-idea-agent] Solutions was string, wrapped in array');
    } else {
      console.error('[POST /api/spaces/[id]/run-idea-agent] Solutions is neither array nor string:', analysis.solutions);
      solutionsArray = ['Solution processing error - please check summary'];
    }

    // Ensure sources is properly formatted as an array
    let sourcesArray: string[] = [];
    if (Array.isArray(analysis.sources)) {
      sourcesArray = analysis.sources.filter((s): s is string => typeof s === 'string');
    } else if (typeof analysis.sources === 'string') {
      sourcesArray = [analysis.sources];
    } else {
      sourcesArray = ['General knowledge'];
    }

    console.log('[POST /api/spaces/[id]/run-idea-agent] FINAL Processed solutions:', JSON.stringify(solutionsArray));
    console.log('[POST /api/spaces/[id]/run-idea-agent] FINAL Processed sources:', JSON.stringify(sourcesArray));

    // Create a clean object that matches the schema exactly
    const ideaAgentData = {
      title: String(analysis.title || 'Idea Analysis'),
      summary: String(analysis.summary || 'Analysis completed'),
      solutions: solutionsArray,
      sources: sourcesArray,
      generatedAt: new Date(),
    };

    console.log('[POST /api/spaces/[id]/run-idea-agent] Setting ideaAgent to:', JSON.stringify(ideaAgentData));

    // Use set() method to update the subdocument
    space.set('ideaAgent', ideaAgentData);
    
    // Move to next step only if not already moved
    if (space.currentStep === 1) {
      space.currentStep = 2;
    }

    console.log('[POST /api/spaces/[id]/run-idea-agent] About to save space...');
    console.log('[POST /api/spaces/[id]/run-idea-agent] Space before save:', JSON.stringify(space.ideaAgent));
    
    try {
      await space.save();
      console.log('[POST /api/spaces/[id]/run-idea-agent] Space saved successfully');
    } catch (saveError: any) {
      console.error('[POST /api/spaces/[id]/run-idea-agent] Save error:', saveError);
      console.error('[POST /api/spaces/[id]/run-idea-agent] Validation errors:', saveError.errors);
      throw saveError;
    }

    console.log(`[POST /api/spaces/${id}/run-idea-agent] Successfully completed idea analysis`);

    return NextResponse.json({
      success: true,
      data: space.ideaAgent,
    });
  } catch (error) {
    console.error('[POST /api/spaces/[id]/run-idea-agent] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to run idea agent', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

