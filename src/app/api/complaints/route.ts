import { NextRequest, NextResponse } from 'next/server';
import { query, withTransaction } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { generateEmbedding, toPgVector } from '@/lib/vector';

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    const { searchParams } = new URL(req.url);

    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const categoryId = searchParams.get('category_id');
    const locationId = searchParams.get('location_id');
    const search = searchParams.get('search');
    const myComplaints = searchParams.get('my') === 'true';

    const conditions: string[] = [];
    const params: any[] = [];
    let pIdx = 1;

    // Role-based scoping
    if (user && user.roleName === 'STUDENT') {
      conditions.push(`reporter_id = $${pIdx++}`);
      params.push(user.userId);
    } else if (user && user.roleName === 'MAINTENANCE_STAFF' && user.staffId) {
      if (myComplaints) {
        conditions.push(`assigned_staff_id = $${pIdx++}`);
        params.push(user.staffId);
      }
    } else if (myComplaints && user) {
      conditions.push(`reporter_id = $${pIdx++}`);
      params.push(user.userId);
    }

    if (status) {
      conditions.push(`status = $${pIdx++}`);
      params.push(status);
    }

    if (priority) {
      conditions.push(`priority = $${pIdx++}`);
      params.push(priority);
    }

    if (categoryId) {
      conditions.push(`category_id = $${pIdx++}`);
      params.push(Number(categoryId));
    }

    if (locationId) {
      conditions.push(`location_id = $${pIdx++}`);
      params.push(Number(locationId));
    }

    if (search) {
      conditions.push(`(title ILIKE $${pIdx} OR description ILIKE $${pIdx} OR building ILIKE $${pIdx} OR room ILIKE $${pIdx})`);
      params.push(`%${search}%`);
      pIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT *
      FROM vw_complaint_details
      ${whereClause}
      ORDER BY 
        CASE 
          WHEN priority = 'CRITICAL' THEN 1
          WHEN priority = 'HIGH' THEN 2
          WHEN priority = 'MEDIUM' THEN 3
          ELSE 4
        END,
        created_at DESC
    `;

    const res = await query(sql, params);
    return NextResponse.json({ complaints: res.rows });
  } catch (error: any) {
    console.error('Error fetching complaints:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch complaints' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { title, description, categoryId, locationId, priority = 'MEDIUM' } = await req.json();

    if (!title || !description || !categoryId || !locationId) {
      return NextResponse.json(
        { error: 'Title, description, category, and location are required' },
        { status: 400 }
      );
    }

    // 1. Generate 384-dimensional dense semantic embedding
    const embedding = generateEmbedding(`${title} ${description}`);
    const pgVectorStr = toPgVector(embedding);

    // 2. Check for potentially duplicate complaints using vector cosine similarity
    const similarRes = await query(
      `SELECT * FROM fn_match_similar_complaints($1::vector, 0.70, 3)`,
      [pgVectorStr]
    );

    // 3. Insert complaint and vector transactionally (Advanced DBMS Concept)
    const newComplaint = await withTransaction(async (client) => {
      // Insert complaint (Trigger trg_set_sla_due_at and trg_complaint_status_history execute automatically)
      const cRes = await client.query(
        `INSERT INTO complaint (title, description, user_id, category_id, location_id, priority)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [title, description, user.userId, Number(categoryId), Number(locationId), priority]
      );

      const created = cRes.rows[0];

      // Insert vector into 1-to-1 complaint_vector table
      await client.query(
        `INSERT INTO complaint_vector (complaint_id, embedding)
         VALUES ($1, $2::vector)`,
        [created.complaint_id, pgVectorStr]
      );

      // Log in audit_log
      await client.query(
        `INSERT INTO audit_log (user_id, action, entity, entity_id)
         VALUES ($1, 'CREATE_COMPLAINT', 'complaint', $2)`,
        [user.userId, created.complaint_id.toString()]
      );

      return created;
    });

    return NextResponse.json({
      success: true,
      complaint: newComplaint,
      potentialDuplicates: similarRes.rows,
      hasPotentialDuplicate: similarRes.rows.length > 0
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating complaint:', error);
    return NextResponse.json({ error: error.message || 'Failed to submit complaint' }, { status: 500 });
  }
}
