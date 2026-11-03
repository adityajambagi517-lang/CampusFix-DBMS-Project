'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { UserSession } from '@/types';
import { Shield, Wrench, GraduationCap, BarChart3, LogOut, CheckCircle, Bell } from 'lucide-react';

export default function Navbar() {
  const [user, setUser] = useState<UserSession | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null));
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/login');
    router.refresh();
  };

  const getRoleBadge = (roleName: string) => {
    switch (roleName) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-300">
            <Shield className="w-3 h-3" /> Admin
          </span>
        );
      case 'MAINTENANCE_STAFF':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <Wrench className="w-3 h-3" /> Staff
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
            <GraduationCap className="w-3 h-3" /> Student
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-sky-700 to-indigo-800 bg-clip-text text-transparent">
                CampusFix
              </span>
              <span className="hidden sm:inline-block text-[10px] text-slate-500 ml-2 font-mono uppercase tracking-wider bg-slate-100 px-1.5 py-0.5 rounded">
                DBMS L3
              </span>
            </div>
          </Link>

          {user && (
            <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
              {user.roleName === 'STUDENT' && (
                <Link
                  href="/dashboard/student"
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    pathname === '/dashboard/student'
                      ? 'bg-sky-50 text-sky-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  My Complaints
                </Link>
              )}

              {user.roleName === 'MAINTENANCE_STAFF' && (
                <Link
                  href="/dashboard/staff"
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    pathname === '/dashboard/staff'
                      ? 'bg-sky-50 text-sky-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Assigned Work
                </Link>
              )}

              {user.roleName === 'ADMIN' && (
                <Link
                  href="/dashboard/admin"
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    pathname === '/dashboard/admin'
                      ? 'bg-sky-50 text-sky-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Admin Dispatch
                </Link>
              )}

              <Link
                href="/analytics"
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors ${
                  pathname === '/analytics'
                    ? 'bg-sky-50 text-sky-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <BarChart3 className="w-4 h-4" /> Analytics & Views
              </Link>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold text-slate-800 leading-tight">
                  {user.fullName}
                </div>
                <div className="text-xs text-slate-500">{user.email}</div>
              </div>
              <div>{getRoleBadge(user.roleName)}</div>
              <button
                onClick={handleLogout}
                title="Log out"
                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-slate-200"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-sm font-medium text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-md transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 px-3.5 py-1.5 rounded-md shadow-sm transition-colors"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
