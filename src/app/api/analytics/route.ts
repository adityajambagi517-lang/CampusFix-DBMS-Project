import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [deptWorkload, locationHotspots, staffMetrics, statusDistribution] = await Promise.all([
      query(`SELECT * FROM vw_department_workload ORDER BY total_complaints DESC`),
      query(`SELECT * FROM vw_location_hotspots ORDER BY total_complaints DESC LIMIT 10`),
      query(`SELECT * FROM vw_staff_metrics ORDER BY lifetime_assigned DESC`),
      query(`
        SELECT 
          status,
          COUNT(*) as count,
          ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM complaint), 1) as percentage
        FROM complaint
        GROUP BY status
      `)
    ]);

    return NextResponse.json({
      departmentWorkload: deptWorkload.rows,
      locationHotspots: locationHotspots.rows,
      staffMetrics: staffMetrics.rows,
      statusDistribution: statusDistribution.rows,
    });
  } catch (error: any) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch analytics' }, { status: 500 });
  }
}
