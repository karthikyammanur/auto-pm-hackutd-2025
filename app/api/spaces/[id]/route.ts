import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import connectDB from '@/lib/mongodb';
import Space from '@/models/Space';
import mongoose from 'mongoose';

// Get a single space by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await auth0.getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;

    console.log(`[GET /api/spaces/${id}] Fetching space for user: ${session.user.sub}`);

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log(`[GET /api/spaces/${id}] Invalid space ID format`);
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
    }).lean();

    if (!space) {
      console.log(`[GET /api/spaces/${id}] Space not found or unauthorized`);
      return NextResponse.json(
        { error: 'Space not found' },
        { status: 404 }
      );
    }

    console.log(`[GET /api/spaces/${id}] Successfully fetched space`);
    return NextResponse.json(space);
  } catch (error) {
    console.error(`[GET /api/spaces] Error fetching space:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch space', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Update a space
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await auth0.getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid space ID' },
        { status: 400 }
      );
    }

    const body = await request.json();

    await connectDB();

    // Find space and verify ownership
    const space = await Space.findOne({
      _id: id,
      userId: session.user.sub,
    });

    if (!space) {
      return NextResponse.json(
        { error: 'Space not found' },
        { status: 404 }
      );
    }

    // Update allowed fields
    const allowedUpdates = [
      'name',
      'problemStatement',
      'currentStep',
      'completed',
      'ideaAgent',
      'storyAgent',
      'emailAgent',
      'riceAgent',
      'okrAgent',
      'wireframeAgent',
    ];

    console.log(`[PUT /api/spaces/${id}] Request body:`, JSON.stringify(body, null, 2));
    
    // Handle nested field updates (e.g., 'ideaAgent.selectedSolution')
    Object.keys(body).forEach((key) => {
      if (key.includes('.')) {
        // Handle dot notation for nested fields
        const [parent, child] = key.split('.');
        console.log(`[PUT /api/spaces/${id}] Processing nested field - parent: ${parent}, child: ${child}, value:`, body[key]);
        
        if (allowedUpdates.includes(parent)) {
          if (!(space as any)[parent]) {
            console.log(`[PUT /api/spaces/${id}] Creating new ${parent} object`);
            (space as any)[parent] = {};
          }
          (space as any)[parent][child] = body[key];
          space.markModified(parent);
          console.log(`[PUT /api/spaces/${id}] Set ${parent}.${child}, marked as modified`);
          console.log(`[PUT /api/spaces/${id}] Current ${parent} value:`, (space as any)[parent]);
        }
      } else if (allowedUpdates.includes(key)) {
        console.log(`[PUT /api/spaces/${id}] Setting top-level field ${key}:`, body[key]);
        (space as any)[key] = body[key];
      }
    });

    console.log(`[PUT /api/spaces/${id}] About to save space...`);
    console.log(`[PUT /api/spaces/${id}] ideaAgent before save:`, JSON.stringify(space.ideaAgent, null, 2));
    
    try {
      await space.save();
      console.log(`[PUT /api/spaces/${id}] Successfully saved space`);
      console.log(`[PUT /api/spaces/${id}] ideaAgent after save:`, JSON.stringify(space.ideaAgent, null, 2));
    } catch (saveError) {
      console.error(`[PUT /api/spaces/${id}] Save error:`, saveError);
      throw saveError;
    }

    return NextResponse.json(space);
  } catch (error) {
    console.error('Error updating space:', error);
    return NextResponse.json(
      { error: 'Failed to update space' },
      { status: 500 }
    );
  }
}

// Delete a space
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await auth0.getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid space ID' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find and delete space, verify ownership
    const space = await Space.findOneAndDelete({
      _id: id,
      userId: session.user.sub,
    });

    if (!space) {
      return NextResponse.json(
        { error: 'Space not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Space deleted successfully' });
  } catch (error) {
    console.error('Error deleting space:', error);
    return NextResponse.json(
      { error: 'Failed to delete space' },
      { status: 500 }
    );
  }
}

