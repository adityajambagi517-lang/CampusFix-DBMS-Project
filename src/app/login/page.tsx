'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, Wrench, GraduationCap, Lock, Mail, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

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
    <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md saas-card p-8 space-y-6 shadow-2xl"
      >
        <div className="text-center space-y-2">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white mx-auto flex items-center justify-center shadow-glow-primary">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Sign in to CampusFix</h1>
          <p className="text-xs text-slate-400">
            Select a verified role below or enter institutional credentials
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">
              Institutional Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="aditya.student@campusfix.edu"
                className="w-full pl-10 pr-3.5 py-2.5 text-xs saas-input"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 text-xs saas-input"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            isLoading={loading}
            className="w-full mt-2"
            icon={<ArrowRight className="w-4 h-4" />}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </Button>
        </form>

        {/* Quick Demo Evaluation Buttons */}
        <div className="pt-4 border-t border-white/10 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            <span>One-Click Role Access</span>
            <span className="text-[10px] text-brand-400 font-mono">Password@123</span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => setDemoAccount('aditya.student@campusfix.edu')}
              className="group flex items-center justify-between p-2.5 rounded-xl border border-sky-500/20 bg-sky-950/20 hover:bg-sky-900/30 text-xs transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-white group-hover:text-sky-300">
                    Student: Aditya Jambagi
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">aditya.student@campusfix.edu</div>
                </div>
              </div>
              <span className="text-[10px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded">
                Login
              </span>
            </button>

            <button
              type="button"
              onClick={() => setDemoAccount('rajesh.electrician@campusfix.edu')}
              className="group flex items-center justify-between p-2.5 rounded-xl border border-amber-500/20 bg-amber-950/20 hover:bg-amber-900/30 text-xs transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-white group-hover:text-amber-300">
                    Staff: Rajesh (Electrician)
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">rajesh.electrician@campusfix.edu</div>
                </div>
              </div>
              <span className="text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded">
                Login
              </span>
            </button>

            <button
              type="button"
              onClick={() => setDemoAccount('admin@campusfix.edu')}
              className="group flex items-center justify-between p-2.5 rounded-xl border border-purple-500/20 bg-purple-950/20 hover:bg-purple-900/30 text-xs transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-white group-hover:text-purple-300">
                    Admin: Campus Administrator
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">admin@campusfix.edu</div>
                </div>
              </div>
              <span className="text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded">
                Login
              </span>
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-slate-400 pt-1">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-brand-400 font-semibold hover:underline">
            Register here
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
