'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { UserSession } from '@/types';
import { Shield, Wrench, GraduationCap, BarChart3, LogOut, CheckCircle, MapPin, Menu, X, Sparkles } from 'lucide-react';
import { GlowButton } from '@/components/ui/GlowButton';

export default function Navbar() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30 shadow-sm">
            <Shield className="w-3.5 h-3.5 text-purple-400" /> Admin
          </span>
        );
      case 'MAINTENANCE_STAFF':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm">
            <Wrench className="w-3.5 h-3.5 text-amber-400" /> Staff
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/30 shadow-sm">
            <GraduationCap className="w-3.5 h-3.5 text-sky-400" /> Student
          </span>
        );
    }
  };

  const navLinks = [
    ...(user?.roleName === 'STUDENT'
      ? [{ href: '/dashboard/student', label: 'My Complaints' }]
      : []),
    ...(user?.roleName === 'MAINTENANCE_STAFF'
      ? [{ href: '/dashboard/staff', label: 'Assigned Work' }]
      : []),
    ...(user?.roleName === 'ADMIN'
      ? [{ href: '/dashboard/admin', label: 'Dispatch Center' }]
      : []),
    { href: '/campus-map', label: 'Campus Map', icon: <MapPin className="w-4 h-4" /> },
    { href: '/analytics', label: 'Analytics & Views', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-50 px-4 sm:px-6 lg:px-8 pt-3 pb-1">
      <div className="max-w-7xl mx-auto">
        <div className="glass-panel rounded-2xl px-4 sm:px-6 h-16 flex items-center justify-between shadow-2xl border border-white/10">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-glow-cyan group-hover:scale-105 transition-transform">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold tracking-tight text-white group-hover:text-sky-300 transition-colors">
                    CampusFix
                  </span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono tracking-wider uppercase bg-sky-500/15 text-sky-300 border border-sky-500/30">
                    <Sparkles className="w-2.5 h-2.5" /> L3
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  PES University · Intelligence System
                </p>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-sky-500/20 text-sky-300 font-semibold border border-sky-500/30 shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {link.icon}
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Action / Auth Controls */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-semibold text-slate-100 leading-tight">
                    {user.fullName}
                  </div>
                  <div className="text-xs text-slate-400 font-mono">{user.email}</div>
                </div>

                <div>{getRoleBadge(user.roleName)}</div>

                <button
                  onClick={handleLogout}
                  title="Sign out of CampusFix"
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors border border-white/5 hover:border-rose-500/30"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-sm font-medium text-slate-300 hover:text-white px-3.5 py-1.5 rounded-xl hover:bg-white/5 transition-colors"
                >
                  Sign In
                </Link>
                <Link href="/register">
                  <GlowButton variant="primary" size="sm">
                    Register
                  </GlowButton>
                </Link>
              </div>
            )}

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 md:hidden text-slate-300 hover:text-white rounded-xl hover:bg-white/5"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="md:hidden mt-2 p-4 glass-panel rounded-2xl border border-white/10 space-y-2"
            >
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${
                    pathname === link.href
                      ? 'bg-sky-500/20 text-sky-300 font-semibold'
                      : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
