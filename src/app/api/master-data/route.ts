import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [categoriesRes, locationsRes, departmentsRes, staffRes] = await Promise.all([
      query(`
        SELECT c.category_id, c.category_name, c.default_sla_hours, d.department_id, d.department_name
        FROM category c
        JOIN department d ON c.department_id = d.department_id
        ORDER BY d.department_name, c.category_name
      `),
      query(`
        SELECT location_id, building, floor, room, zone
        FROM location
        ORDER BY building, floor, room
      `),
      query(`
        SELECT department_id, department_name, description
        FROM department
        ORDER BY department_name
      `),
      query(`
        SELECT s.staff_id, s.user_id, u.full_name, u.email, s.specialization, s.availability_status
        FROM staff s
        JOIN app_user u ON s.user_id = u.user_id
        ORDER BY u.full_name
      `)
    ]);

    return NextResponse.json({
      categories: categoriesRes.rows,
      locations: locationsRes.rows,
      departments: departmentsRes.rows,
      staff: staffRes.rows,
    });
  } catch (error: any) {
    console.error('Error fetching master data:', error);
    return NextResponse.json({ error: error.message || 'Failed to load master data' }, { status: 500 });
  }
}
