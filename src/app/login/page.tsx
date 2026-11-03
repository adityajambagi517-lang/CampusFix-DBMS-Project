'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, Wrench, GraduationCap, Lock, Mail, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPassword?: string) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    const loginEmail = customEmail || email;
    const loginPassword = customPassword || password;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed. Please check credentials.');
        setLoading(false);
        return;
      }

      // Route based on role
      switch (data.user.roleName) {
        case 'ADMIN':
          router.push('/dashboard/admin');
          break;
        case 'MAINTENANCE_STAFF':
          router.push('/dashboard/staff');
          break;
        default:
          router.push('/dashboard/student');
          break;
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Connection failed.');
      setLoading(false);
    }
  };

  const setDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password@123');
    handleLogin(undefined, demoEmail, 'Password@123');
  };

  return (
    <div className="max-w-md mx-auto my-12 bg-white rounded-2xl shadow-xl border border-slate-200 p-8 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-xl bg-sky-600 text-white mx-auto flex items-center justify-center shadow-lg shadow-sky-600/30">
          <CheckCircle className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Sign in to CampusFix</h1>
        <p className="text-sm text-slate-500">
          Campus Complaint Prioritization & Smart Routing System
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@campusfix.edu"
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm shadow-md shadow-sky-600/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? 'Authenticating...' : 'Sign In'} <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* Quick Demo Logins for Evaluation */}
      <div className="pt-4 border-t border-slate-100 space-y-3">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">
          One-Click Demo Evaluator Accounts
        </div>
        <div className="grid grid-cols-1 gap-2">
          <button
            type="button"
            onClick={() => setDemoAccount('aditya.student@campusfix.edu')}
            className="flex items-center justify-between p-2.5 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/60 text-xs text-blue-900 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-blue-600" />
              <div>
                <div className="font-bold">Student: Aditya Jambagi</div>
                <div className="text-[10px] text-blue-700">aditya.student@campusfix.edu</div>
              </div>
            </div>
            <span className="text-[10px] font-semibold bg-blue-200 px-2 py-0.5 rounded">Login</span>
          </button>

          <button
            type="button"
            onClick={() => setDemoAccount('rajesh.electrician@campusfix.edu')}
            className="flex items-center justify-between p-2.5 rounded-xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100/60 text-xs text-amber-900 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-600" />
              <div>
                <div className="font-bold">Staff: Rajesh (Electrician)</div>
                <div className="text-[10px] text-amber-700">rajesh.electrician@campusfix.edu</div>
              </div>
            </div>
            <span className="text-[10px] font-semibold bg-amber-200 px-2 py-0.5 rounded">Login</span>
          </button>

          <button
            type="button"
            onClick={() => setDemoAccount('admin@campusfix.edu')}
            className="flex items-center justify-between p-2.5 rounded-xl border border-purple-200 bg-purple-50/60 hover:bg-purple-100/60 text-xs text-purple-900 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-600" />
              <div>
                <div className="font-bold">Admin: Campus Administrator</div>
                <div className="text-[10px] text-purple-700">admin@campusfix.edu</div>
              </div>
            </div>
            <span className="text-[10px] font-semibold bg-purple-200 px-2 py-0.5 rounded">Login</span>
          </button>
        </div>
      </div>

      <div className="text-center text-xs text-slate-500 pt-2">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-sky-600 font-semibold hover:underline">
          Register here
        </Link>
      </div>
    </div>
  );
}

