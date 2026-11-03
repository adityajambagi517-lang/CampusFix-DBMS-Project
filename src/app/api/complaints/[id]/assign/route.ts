import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(req);
    if (!user || user.roleName !== 'ADMIN') {
      return NextResponse.json({ error: 'Only administrators can assign complaints' }, { status: 403 });
    }

    const complaintId = Number(params.id);
    const { staffId, remarks } = await req.json();

    if (!staffId) {
      return NextResponse.json({ error: 'Staff ID is required' }, { status: 400 });
    }

    // Call Advanced DBMS Stored Function
    await query(
      `SELECT fn_assign_complaint($1, $2, $3, $4)`,
      [complaintId, Number(staffId), user.userId, remarks || 'Dispatched by Administrator']
    );

    return NextResponse.json({ success: true, message: 'Complaint assigned successfully' });
  } catch (error: any) {
    console.error('Error assigning complaint:', error);
    return NextResponse.json({ error: error.message || 'Failed to assign complaint' }, { status: 500 });
  }
}

