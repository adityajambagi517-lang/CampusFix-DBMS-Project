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
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
        <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
          <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500">
            CampusFix • DBMS Experiential Learning — Level 3 Project • Option 2: SQL (PostgreSQL 15) + Vector (pgvector)
          </div>
        </footer>
      </body>
    </html>
  );
}

