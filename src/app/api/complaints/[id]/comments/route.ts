import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const complaintId = Number(params.id);
    const { body } = await req.json();

    if (!body || !body.trim()) {
      return NextResponse.json({ error: 'Comment body cannot be empty' }, { status: 400 });
    }

    const res = await query(
      `INSERT INTO comment (complaint_id, author_id, body)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [complaintId, user.userId, body.trim()]
    );

    return NextResponse.json({ success: true, comment: res.rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error('Error posting comment:', error);
    return NextResponse.json({ error: error.message || 'Failed to post comment' }, { status: 500 });
  }
}
