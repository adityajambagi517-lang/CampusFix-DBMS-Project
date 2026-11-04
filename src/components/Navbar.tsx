'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { UserSession } from '@/types';
import { 
  Shield, 
  Wrench, 
  GraduationCap, 
  BarChart3, 
  LogOut, 
  CheckCircle2, 
  MapPin, 
  Menu, 
  X, 
  Sparkles,
  ChevronRight,
  Layers,
  Workflow,
  Home
} from 'lucide-react';
import { Button } from './ui/Button';

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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/25">
            <Shield className="w-3 h-3 text-purple-400" /> Admin
          </span>
        );
      case 'MAINTENANCE_STAFF':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/25">
            <Wrench className="w-3 h-3 text-amber-400" /> Staff
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/10 text-sky-300 border border-sky-500/25">
            <GraduationCap className="w-3 h-3 text-sky-400" /> Student
          </span>
        );
    }
  };

  // Public & Authenticated Navigation links
  const publicLinks = [
    { href: '/', label: 'Home' },
    { href: '/#features', label: 'Features' },
    { href: '/#how-it-works', label: 'How It Works' },
    { href: '/campus-map', label: 'Campus Map', icon: <MapPin className="w-3.5 h-3.5" /> },
    { href: '/analytics', label: 'Analytics', icon: <BarChart3 className="w-3.5 h-3.5" /> },
  ];

  const roleDashboardLink = user?.roleName === 'ADMIN'
    ? { href: '/dashboard/admin', label: 'Dispatch Center', icon: <Shield className="w-3.5 h-3.5" /> }
    : user?.roleName === 'MAINTENANCE_STAFF'
    ? { href: '/dashboard/staff', label: 'Work Orders', icon: <Wrench className="w-3.5 h-3.5" /> }
    : user?.roleName === 'STUDENT'
    ? { href: '/dashboard/student', label: 'My Complaints', icon: <GraduationCap className="w-3.5 h-3.5" /> }
    : null;

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0e17]/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand identity */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3 group focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-glow-primary group-hover:scale-[1.02] transition-transform">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-white tracking-tight group-hover:text-brand-300 transition-colors">
                CampusFix
              </span>
              <span className="text-[10px] font-mono text-slate-400 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">
                PES L3
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {roleDashboardLink && (
              <Link
                href={roleDashboardLink.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold mr-1 transition-all ${
                  pathname === roleDashboardLink.href
                    ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                    : 'text-brand-400 hover:bg-brand-500/10'
                }`}
              >
                {roleDashboardLink.icon}
                <span>{roleDashboardLink.label}</span>
              </Link>
            )}

            {publicLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-white/10 text-white font-semibold border border-white/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User / Authentication Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-white leading-tight">
                  {user.fullName}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">{user.email}</div>
              </div>

              <div>{getRoleBadge(user.roleName)}</div>

              <button
                onClick={handleLogout}
                title="Sign out of CampusFix"
                aria-label="Sign out"
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-500/20"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="primary" size="sm">
                  Register
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="p-2 md:hidden text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-b border-white/10 bg-[#0a0e17] px-4 py-3 space-y-1"
          >
            {roleDashboardLink && (
              <Link
                href={roleDashboardLink.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2 rounded-lg text-xs bg-brand-500/15 text-brand-300 font-semibold mb-2"
              >
                <div className="flex items-center gap-2">
                  {roleDashboardLink.icon}
                  <span>{roleDashboardLink.label}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-brand-400" />
              </Link>
            )}

            {publicLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${
                  pathname === link.href
                    ? 'bg-white/10 text-white font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2">
                  {link.icon}
                  <span>{link.label}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
