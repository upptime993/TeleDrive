import { NextResponse } from 'next/server'

// GET /api/health — health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'TeleDrive Web',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  })
}
