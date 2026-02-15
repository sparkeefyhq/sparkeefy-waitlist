/**
 * Health Check API Route
 * 
 * HTTP endpoint for monitoring and health checks.
 * Returns service status, version, and database connectivity.
 * 
 * @module app/api/health
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";

export const dynamic = "force-dynamic"; // Disable caching for health checks

/**
 * GET /api/health
 * 
 * Returns health status of the application.
 */
export async function GET() {
  try {
    // Check database connectivity
    const dbHealthy = await db.healthCheck();

    const health = {
      status: dbHealthy ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      service: "sparkeefy-waitlist",
      version: "1.0.0",
      checks: {
        database: dbHealthy ? "ok" : "error",
      },
    };

    const statusCode = dbHealthy ? 200 : 503;

    return NextResponse.json(health, { status: statusCode });
  } catch (error) {
    return NextResponse.json(
      {
        status: "down",
        timestamp: new Date().toISOString(),
        service: "sparkeefy-waitlist",
        version: "1.0.0",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
