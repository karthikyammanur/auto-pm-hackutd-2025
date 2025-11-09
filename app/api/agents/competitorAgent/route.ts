/**
 * Customer & Market Research API Endpoint
 * 
 * POST endpoint that accepts a SolutionContext and returns comprehensive
 * market research including Reddit analysis, competitor analysis, and industry trends.
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateConfig } from './config';
import { runResearchPipeline } from './orchestrator';
import type { SolutionContext, ResearchModuleOutput } from './types';

// ============================================================================
// INPUT VALIDATION
// ============================================================================

/**
 * Validate that the request body contains a valid SolutionContext
 */
function validateSolutionContext(body: any): { valid: boolean; errors: string[]; data?: SolutionContext } {
  const errors: string[] = [];

  if (!body) {
    errors.push('Request body is required');
    return { valid: false, errors };
  }

  // Required string fields
  const requiredStringFields = ['problem', 'solution_id', 'solution_title', 'solution_summary'];
  for (const field of requiredStringFields) {
    if (!body[field] || typeof body[field] !== 'string' || body[field].trim() === '') {
      errors.push(`Field '${field}' is required and must be a non-empty string`);
    }
  }

  // Required array fields
  if (!Array.isArray(body.target_users) || body.target_users.length === 0) {
    errors.push('Field \'target_users\' is required and must be a non-empty array');
  } else if (!body.target_users.every((item: any) => typeof item === 'string')) {
    errors.push('All items in \'target_users\' must be strings');
  }

  if (!Array.isArray(body.keywords) || body.keywords.length === 0) {
    errors.push('Field \'keywords\' is required and must be a non-empty array');
  } else if (!body.keywords.every((item: any) => typeof item === 'string')) {
    errors.push('All items in \'keywords\' must be strings');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    data: {
      problem: body.problem.trim(),
      solution_id: body.solution_id.trim(),
      solution_title: body.solution_title.trim(),
      solution_summary: body.solution_summary.trim(),
      target_users: body.target_users.map((u: string) => u.trim()),
      keywords: body.keywords.map((k: string) => k.trim()),
    },
  };
}

// ============================================================================
// API ENDPOINT
// ============================================================================

/**
 * POST /api/competitorAgent
 * 
 * Performs comprehensive customer and market research for a given solution.
 * 
 * Request Body (SolutionContext):
 * {
 *   "problem": "Short description of the problem",
 *   "solution_id": "unique_solution_id",
 *   "solution_title": "Solution Name",
 *   "solution_summary": "Brief summary of the solution",
 *   "target_users": ["user segment 1", "user segment 2"],
 *   "keywords": ["keyword1", "keyword2", "keyword3"]
 * }
 * 
 * Response (ResearchModuleOutput):
 * {
 *   "solution_id": "same_solution_id",
 *   "summary_for_pm": "3-8 sentence plain English summary",
 *   "research_result": { ... }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Check configuration
    const configValidation = validateConfig();
    if (!configValidation.valid) {
      return NextResponse.json(
        {
          error: 'Configuration Error',
          message: 'Server configuration is invalid. Please check environment variables.',
          details: configValidation.errors,
        },
        { status: 500 }
      );
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        {
          error: 'Invalid JSON',
          message: 'Request body must be valid JSON',
        },
        { status: 400 }
      );
    }

    // Validate input
    const validation = validateSolutionContext(body);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Invalid request body',
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    const solutionContext = validation.data!;

    // Run the complete research pipeline
    console.log(`Starting research for solution: ${solutionContext.solution_id}`);
    const result = await runResearchPipeline(solutionContext);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Research API error:', error);
    
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      },
      { status: 500 }
    );
  }
}
