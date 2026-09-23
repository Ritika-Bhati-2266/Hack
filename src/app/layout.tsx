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
  weight: ['400', '500', '600', '700', '800', '900'],
});

export const metadata: Metadata = {
  title: 'PREVISE — Know Before You Decide',
  description:
    'Expense trackers show the past. Previse simulates the future — runway, buffer & goal impact before you swipe. Deterministic engine on RBI Account Aggregator.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} dark bg-base`} style={{ backgroundColor: 'var(--color-base)' }}>
      <body className="bg-base text-slate-100 font-sans antialiased min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
          {children}
        </main>

        <footer className="border-t border-white/15 bg-well/50 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#10B981] flex items-center justify-center font-display font-black text-black text-lg">
                P
              </div>
              <div>
                <p className="font-display font-800 font-extrabold tracking-tight leading-none">
                  PREVISE <span className="text-[#10B981]">.</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Deterministic decision engine • RBI AA mock • No LLM hallucination
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span className="px-2.5 py-1 rounded-full border border-white/15 bg-white/5 font-mono">
                QA 24/24
              </span>
              <span className="px-2.5 py-1 rounded-full border border-white/15 bg-white/5 font-mono">
                FW-RBI-2026
              </span>
              <span className="hidden sm:inline">Built for hackathon demo</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
