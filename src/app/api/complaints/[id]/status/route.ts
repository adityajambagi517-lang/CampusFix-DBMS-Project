import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const complaintId = Number(params.id);
    const { status, remarks } = await req.json();

    if (!status) {
      return NextResponse.json({ error: 'New status is required' }, { status: 400 });
    }

    if (status === 'RESOLVED' && user.staffId) {
      // Use transactional resolve procedure
      await query(
        `SELECT fn_resolve_complaint($1, $2, $3)`,
        [complaintId, user.staffId, remarks || 'Marked resolved by technician']
      );
    } else {
      // Standard status transition (Trigger trg_complaint_status_history and trg_set_resolved_at handle recording & timestamps)
      await query(
        `UPDATE complaint 
         SET status = $1::complaint_status
         WHERE complaint_id = $2`,
        [status, complaintId]
      );

      if (remarks) {
        await query(
          `INSERT INTO comment (complaint_id, author_id, body)
           VALUES ($1, $2, $3)`,
          [complaintId, user.userId, `[Status Update: ${status}] ${remarks}`]
        );
      }
    }

    return NextResponse.json({ success: true, message: `Status updated to ${status}` });
  } catch (error: any) {
    console.error('Error updating status:', error);
    return NextResponse.json({ error: error.message || 'Failed to update status' }, { status: 500 });
  }
}

