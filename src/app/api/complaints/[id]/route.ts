import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const complaintId = Number(params.id);
    if (isNaN(complaintId)) {
      return NextResponse.json({ error: 'Invalid complaint ID' }, { status: 400 });
    }

    // 1. Fetch complaint summary
    const cRes = await query(
      `SELECT * FROM vw_complaint_details WHERE complaint_id = $1`,
      [complaintId]
    );

    if (cRes.rows.length === 0) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    const complaint = cRes.rows[0];

    // 2. Fetch status history timeline
    const historyRes = await query(
      `SELECT 
        sh.history_id,
        sh.complaint_id,
        sh.old_status,
        sh.new_status,
        sh.remarks,
        sh.changed_at,
        sh.changed_by,
        u.full_name AS changer_name
      FROM status_history sh
      LEFT JOIN app_user u ON sh.changed_by = u.user_id
      WHERE sh.complaint_id = $1
      ORDER BY sh.changed_at ASC`,
      [complaintId]
    );

    // 3. Fetch comments thread
    const commentsRes = await query(
      `SELECT 
        c.comment_id,
        c.complaint_id,
        c.author_id,
        c.body,
        c.created_at,
        u.full_name AS author_name,
        r.role_name AS author_role
      FROM comment c
      JOIN app_user u ON c.author_id = u.user_id
      JOIN role r ON u.role_id = r.role_id
      WHERE c.complaint_id = $1
      ORDER BY c.created_at ASC`,
      [complaintId]
    );

    // 4. Fetch attachments
    const attachRes = await query(
      `SELECT * FROM attachment WHERE complaint_id = $1 ORDER BY uploaded_at ASC`,
      [complaintId]
    );

    // 5. Fetch semantically similar complaints using pgvector function
    const similarRes = await query(
      `SELECT * 
       FROM fn_match_similar_complaints(
         (SELECT embedding FROM complaint_vector WHERE complaint_id = $1),
         0.60,
         4
       )
       WHERE complaint_id != $1`,
      [complaintId]
    );

    return NextResponse.json({
      complaint,
      statusHistory: historyRes.rows,
      comments: commentsRes.rows,
      attachments: attachRes.rows,
      similarComplaints: similarRes.rows,
    });
  } catch (error: any) {
    console.error('Error fetching complaint details:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch complaint' }, { status: 500 });
  }
}

