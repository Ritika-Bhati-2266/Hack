import './globals.css';
import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import Navbar from '@/components/Navbar';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'PREVISE - Know Before You Decide | Personal Financial Decision Engine',
  description: 'Simulate what will happen BEFORE you spend in real-time. Built on RBI Account Aggregator framework with Financial Firewall protection.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} dark`}>
      <body className="bg-slate-950 text-slate-100 font-sans antialiased min-h-screen selection:bg-emerald-500 selection:text-slate-950 flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
          {children}
        </main>
        
        <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-400">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>PREVISE Decision Engine &bull; RBI Account Aggregator Mock Engine</span>
            </p>
            <p className="text-slate-400">Built for Hackathon Demo &bull; Deterministic Financial Firewall Rules</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
