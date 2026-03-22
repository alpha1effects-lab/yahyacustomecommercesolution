import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';

/**
 * GET /api/health
 * Health check endpoint
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  let dbStatus = 'disconnected';
  try {
    await dbConnect();
    dbStatus = 'connected';
  } catch (error) {
    dbStatus = 'error';
  }

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    responseTime: Date.now() - startTime,
    database: dbStatus,
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
  });
}
