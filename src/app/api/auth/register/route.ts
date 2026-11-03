import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword, signToken } from '@/lib/auth';
import { UserSession } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { fullName, email, password, roleName = 'STUDENT' } = await req.json();

    if (!fullName || !email || !password) {
      return NextResponse.json(
        { error: 'Full name, email, and password are required' },
        { status: 400 }
      );
    }

    if (!['STUDENT', 'STAFF_USER'].includes(roleName)) {
      return NextResponse.json(
        { error: 'Only student or staff user accounts can be self-registered' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existing = await query(
      'SELECT user_id FROM app_user WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);

    // Get role ID
    const roleRes = await query(
      'SELECT role_id FROM role WHERE role_name = $1',
      [roleName]
    );

    if (roleRes.rows.length === 0) {
      return NextResponse.json(
        { error: 'Designated role not found in database' },
        { status: 500 }
      );
    }

    const roleId = roleRes.rows[0].role_id;

    // Insert user
    const insertRes = await query(
      `INSERT INTO app_user (full_name, email, password_hash, role_id)
       VALUES ($1, $2, $3, $4)
       RETURNING user_id, full_name, email, created_at`,
      [fullName, email.toLowerCase().trim(), hashedPassword, roleId]
    );

    const newUser = insertRes.rows[0];

    const session: UserSession = {
      userId: newUser.user_id,
      fullName: newUser.full_name,
      email: newUser.email,
      roleName,
    };

    const token = signToken(session);

    const response = NextResponse.json({
      success: true,
      user: session,
      token,
    });

    response.cookies.set('campusfix_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

