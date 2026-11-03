import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { comparePassword, signToken } from '@/lib/auth';
import { UserSession } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Query user with joined role and optional staff profile
    const result = await query(
      `SELECT 
        u.user_id,
        u.full_name,
        u.email,
        u.password_hash,
        r.role_name,
        s.staff_id,
        s.specialization
      FROM app_user u
      JOIN role r ON u.role_id = r.role_id
      LEFT JOIN staff s ON u.user_id = s.user_id
      WHERE LOWER(u.email) = LOWER($1)`,
      [email]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const user = result.rows[0];
    const passwordMatch = await comparePassword(password, user.password_hash);

    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const session: UserSession = {
      userId: user.user_id,
      fullName: user.full_name,
      email: user.email,
      roleName: user.role_name,
      staffId: user.staff_id || null,
      specialization: user.specialization || null,
    };

    const token = signToken(session);

    const response = NextResponse.json({
      success: true,
      user: session,
      token,
    });

    // Set secure HTTP-only cookie
    response.cookies.set('campusfix_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
