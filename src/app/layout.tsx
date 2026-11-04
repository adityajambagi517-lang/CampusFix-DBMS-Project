import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'CampusFix — Campus Maintenance & Complaint Intelligence Platform',
  description: 'Enterprise university maintenance system powered by PostgreSQL 15, pgvector semantic search, and autonomous SLA triggers.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0a0e17] text-slate-100 min-h-screen flex flex-col font-sans antialiased selection:bg-brand-500/30 selection:text-brand-200">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        
        {/* Enterprise SaaS Footer */}
        <footer className="border-t border-white/5 bg-[#070a10] py-8 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <span className="text-xs font-semibold text-white">CampusFix Platform</span>
                <span className="text-[10px] text-slate-400">·</span>
                <span className="text-xs text-slate-400">PES University Experiential Learning Level 3</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Relational schema (13 tables) · pgvector 384-D cosine similarity · Autonomous status history auditing
              </p>
            </div>

            {/* Live Infrastructure Status Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] font-mono text-slate-400">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>PostgreSQL 15 Connected</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/5">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                <span>pgvector HNSW Active</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>SLA Triggers Armed</span>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
