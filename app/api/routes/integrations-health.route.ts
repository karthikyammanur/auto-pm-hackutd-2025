/**
 * Integration Health Check API Route
 * 
 * Returns the configuration and availability status of all integration services.
 * Use this endpoint to verify that all services are properly configured.
 * 
 * @route GET /api/integrations/health
 */

import { NextResponse } from 'next/server';
import { checkIntegrationHealth } from '@/lib/integrations';

export async function GET() {
  try {
    const health = await checkIntegrationHealth();

    return NextResponse.json(health, {
      status: health.allOperational ? 200 : 503,
    });
  } catch (error) {
    console.error('Health check failed:', error);

    return NextResponse.json(
      {
        error: 'Failed to check integration health',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
