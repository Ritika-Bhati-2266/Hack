'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useFinanceStore } from '@/store/useFinanceStore';

const EMPTY = { name: '', monthlyIncome: '', totalBalance: '', dailyBurnRate: '', rent: '', sip: '', bills: '' };

const inputCls =
  'mt-1 w-full bg-well/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-dusk/70 focus:border-cyan-400 focus:outline-none';

export default function CreateProfileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createProfile = useFinanceStore((s) => s.createProfile);
  const [form, setForm] = useState(EMPTY);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  // String-backed inputs so fields can be cleared/typed freely; parsed only for validation/submit.
  const toNum = (v: string) => (v.trim() === '' ? 0 : Number(v));
  const incomeNum = toNum(form.monthlyIncome);
  const balanceNum = toNum(form.totalBalance);
  const canCreate =
    form.name.trim().length >= 2 &&
    Number.isFinite(incomeNum) && incomeNum > 0 && incomeNum <= 100000000 &&
    Number.isFinite(balanceNum) && balanceNum > 0 && balanceNum <= 100000000 &&
    [form.dailyBurnRate, form.rent, form.sip, form.bills].every((v) => {
      const n = toNum(v);
      return Number.isFinite(n) && n >= 0 && n <= 100000000;
    });
  const earmarkedTotal = toNum(form.rent) + toNum(form.sip) + toNum(form.bills);

  if (!open || !mounted) return null;

  const close = () => {
    setForm(EMPTY);
    onClose();
  };

  // Portal to <body>: the navbar (and other parents) use backdrop-blur, which
  // redefines the containing block for position:fixed descendants. Without a
  // portal the overlay gets trapped in the tiny header box (cut-off modal).
  return createPortal(
    <div className="fixed inset-0 z-[60] overflow-y-auto overscroll-contain bg-base/80 backdrop-blur-sm" onClick={close}>
      {/* m-auto centering: short cards center, tall cards top-align + page scrolls — never clipped */}
      <div className="min-h-full flex p-4 pb-safe">
        <div className="bg-surface border border-white/[0.08] rounded-3xl p-5 w-full max-w-lg m-auto space-y-3 animate-fade-up" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-extrabold">Create Profile</h3>
            <button onClick={close} className="p-1.5 rounded-full hover:bg-white/10"><X className="w-5 h-5 text-mist" /></button>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="col-span-2">
              <label className="text-[11px] font-bold tracking-widest text-dusk">NAME</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" className={inputCls} />
            </div>
            {([['monthlyIncome', 'MONTHLY INCOME (₹)'], ['totalBalance', 'TOTAL BALANCE (₹)'], ['dailyBurnRate', 'DAILY BURN (₹)'], ['rent', 'RENT (₹)'], ['sip', 'SIP (₹)'], ['bills', 'BILLS (₹)']] as const).map(([k, label]) => (
              <div key={k}>
                <label className="text-[11px] font-bold tracking-widest text-dusk">{label}</label>
                <input type="number" min={0} inputMode="decimal" placeholder="0" value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className={inputCls} />
              </div>
            ))}
          </div>
          {earmarkedTotal > balanceNum && balanceNum > 0 && (
            <p className="text-[11px] text-amber-300 bg-amber-400/10 border border-amber-400/25 rounded-xl px-3 py-2">Monthly earmarked (₹{earmarkedTotal.toLocaleString('en-IN')}) exceeds your balance — runway will start from 0.</p>
          )}
          <button
            disabled={!canCreate}
            onClick={() => { createProfile({ name: form.name.trim(), monthlyIncome: Number(form.monthlyIncome) || 0, totalBalance: Number(form.totalBalance) || 0, dailyBurnRate: Number(form.dailyBurnRate) || 0, rent: Number(form.rent) || 0, sip: Number(form.sip) || 0, bills: Number(form.bills) || 0 }); close(); }}
            className={`w-full py-2.5 rounded-xl font-bold text-sm ${canCreate ? 'bg-primary text-white hover:brightness-110' : 'bg-white/5 text-dusk cursor-not-allowed'}`}
          >
            Create & Switch
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
