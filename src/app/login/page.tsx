'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, Wrench, GraduationCap, Lock, Mail, ArrowRight, AlertCircle, CheckCircle, Sparkles } from 'lucide-react';
import { AmbientGlow } from '@/components/ui/AmbientGlow';
import { GlowButton } from '@/components/ui/GlowButton';

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
    <div className="relative min-h-[calc(100vh-6rem)] flex items-center justify-center py-10 px-4">
      <AmbientGlow variant="cyber" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md glass-panel rounded-3xl border border-white/10 p-8 space-y-6 shadow-2xl relative z-10"
      >
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white mx-auto flex items-center justify-center shadow-glow-cyan">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Sign in to CampusFix</h1>
          <p className="text-xs text-slate-400">
            PostgreSQL 15 · RBAC · pgvector Semantic Search
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="aditya.student@campusfix.edu"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-900/80 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
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
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-900/80 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-colors"
              />
            </div>
          </div>

          <GlowButton
            type="submit"
            variant="primary"
            isLoading={loading}
            className="w-full mt-2"
            icon={<ArrowRight className="w-4 h-4" />}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </GlowButton>
        </form>

        {/* Quick Demo Logins for Evaluation */}
        <div className="pt-4 border-t border-white/10 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            <span>One-Click Demo Roles</span>
            <span className="text-[10px] text-sky-400 font-normal">Password@123</span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => setDemoAccount('aditya.student@campusfix.edu')}
              className="group flex items-center justify-between p-2.5 rounded-xl border border-sky-500/20 bg-sky-950/30 hover:bg-sky-900/40 text-xs text-sky-200 transition-all text-left"
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
              <span className="text-[10px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded-lg">
                Login
              </span>
            </button>

            <button
              type="button"
              onClick={() => setDemoAccount('rajesh.electrician@campusfix.edu')}
              className="group flex items-center justify-between p-2.5 rounded-xl border border-amber-500/20 bg-amber-950/30 hover:bg-amber-900/40 text-xs text-amber-200 transition-all text-left"
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
              <span className="text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-lg">
                Login
              </span>
            </button>

            <button
              type="button"
              onClick={() => setDemoAccount('admin@campusfix.edu')}
              className="group flex items-center justify-between p-2.5 rounded-xl border border-purple-500/20 bg-purple-950/30 hover:bg-purple-900/40 text-xs text-purple-200 transition-all text-left"
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
              <span className="text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-lg">
                Login
              </span>
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-slate-400 pt-1">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-sky-400 font-semibold hover:underline">
            Register here
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
