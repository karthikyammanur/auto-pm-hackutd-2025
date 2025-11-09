import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import connectDB from '@/lib/mongodb';
import Space from '@/models/Space';
import { analyzeOKR, getOKRSummary } from '@/app/api/agents/okr/tools';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const resolvedParams = await Promise.resolve(params);
  const { id } = resolvedParams;

  console.log(`[POST /api/spaces/${id}/run-okr-agent] Starting OKR agent...`);

  try {
    // Check authentication
    const session = await auth0.getSession();
    if (!session?.user) {
      console.log(`[POST /api/spaces/${id}/run-okr-agent] Unauthorized`);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Connect to MongoDB
    await connectDB();
    console.log(`[POST /api/spaces/${id}/run-okr-agent] Connected to MongoDB`);

    // Find the space
    const space = await Space.findById(id);
    if (!space) {
      console.log(`[POST /api/spaces/${id}/run-okr-agent] Space not found`);
      return NextResponse.json(
        { error: 'Space not found' },
        { status: 404 }
      );
    }

    // Verify user owns this space
    if (space.userId !== session.user.sub) {
      console.log(`[POST /api/spaces/${id}/run-okr-agent] User does not own space`);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }


    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const question = formData.get('question') as string | null;
    const action = formData.get('action') as string | null;

    // Validate file is provided
    if (!file) {
      console.log(`[POST /api/spaces/${id}/run-okr-agent] No file provided`);
      return NextResponse.json(
        { error: 'PDF file is required' },
        { status: 400 }
      );
    }

    // Validate file is PDF
    if (file.type !== 'application/pdf') {
      console.log(`[POST /api/spaces/${id}/run-okr-agent] Invalid file type: ${file.type}`);
      return NextResponse.json(
        { error: 'File must be a PDF' },
        { status: 400 }
      );
    }

    console.log(`[POST /api/spaces/${id}/run-okr-agent] Processing PDF file: ${file.name}`);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let analysis: string;

    // Handle different actions
    if (action === 'summary') {
      console.log(`[POST /api/spaces/${id}/run-okr-agent] Generating OKR summary...`);
      analysis = await getOKRSummary(buffer);
    } else {
      // Validate question is provided for Q&A mode
      if (!question || question.trim() === '') {
        console.log(`[POST /api/spaces/${id}/run-okr-agent] No question provided`);
        return NextResponse.json(
          { error: 'Question is required' },
          { status: 400 }
        );
      }

      console.log(`[POST /api/spaces/${id}/run-okr-agent] Analyzing question: ${question.substring(0, 50)}...`);
      analysis = await analyzeOKR(question, buffer);
    }

    console.log(`[POST /api/spaces/${id}/run-okr-agent] OKR analysis complete`);

    // Prepare OKR agent data for MongoDB
    const okrAgentData = {
      summary: action === 'summary' ? analysis : undefined,
      analysis: action !== 'summary' ? analysis : undefined,
      question: question || undefined,
      fileName: file.name,
      generatedAt: new Date(),
    };

    // Update space with OKR data
    space.set('okrAgent', okrAgentData);
    space.markModified('okrAgent');

    // Advance to next step (step 6 - Wireframe) if this is the first time
    if (space.currentStep === 5) {
      space.currentStep = 6;
      console.log(`[POST /api/spaces/${id}/run-okr-agent] Advanced to step 6`);
    }

    // Save the updated space
    try {
      await space.save();
      console.log(`[POST /api/spaces/${id}/run-okr-agent] Space saved successfully`);
    } catch (saveError) {
      console.error(`[POST /api/spaces/${id}/run-okr-agent] Error saving space:`, saveError);
      throw saveError;
    }

    return NextResponse.json({
      success: true,
      data: okrAgentData,
      message: 'OKR analysis completed successfully',
    });
  } catch (error) {
    console.error('[POST /api/spaces/[id]/run-okr-agent] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to run OKR agent',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

