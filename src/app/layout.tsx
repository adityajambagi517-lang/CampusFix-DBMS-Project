import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'CampusFix — Campus Complaint & Maintenance Intelligence System',
  description: 'DBMS Experiential Learning Level 3 Project with PostgreSQL & pgvector',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#090d16] text-slate-100 min-h-screen flex flex-col font-sans antialiased selection:bg-sky-500/30 selection:text-sky-200">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
        <footer className="border-t border-white/5 bg-slate-950/80 backdrop-blur-md py-6 mt-auto">
          <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-400 space-y-1">
            <div className="font-semibold text-slate-300">
              CampusFix · PES University · DBMS Experiential Learning Level 3
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              PostgreSQL 15 · pgvector (384-D HNSW) · Automated Triggers · Relational Views
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
