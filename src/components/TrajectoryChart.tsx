'use client';

import { useState, useRef } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { SimulationResult } from '@/types';

export default function TrajectoryChart({ simulation }: { simulation: SimulationResult }) {
  const data = simulation.trajectory;
  const [showFirewall, setShowFirewall] = useState(true);
  const chartRef = useRef<HTMLDivElement>(null);

  const handleExport = () => {
    if (!chartRef.current) return;
    const svg = chartRef.current.querySelector('svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      if (ctx) {
        ctx.fillStyle = '#0B111E';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
      const a = document.createElement('a');
      a.download = `previse-trajectory-${simulation.itemName.replace(/\s+/g, '-')}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const gap = data.length > 4 ? data[4].baselineSavings - data[4].simulatedSavings : 0;

  return (
    <div className="rounded-[24px] bg-[#0B111E] border border-white/10 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="font-display font-extrabold text-lg">3-Year Wealth Trajectory</h3>
          <p className="text-[11px] text-slate-500 font-mono">
            Baseline vs simulated • firewall {`₹${simulation.todayEarmarked.toLocaleString('en-IN')}`} never counted
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <button
            onClick={() => setShowFirewall(!showFirewall)}
            className={`px-2.5 py-1.5 rounded-full border font-bold ${showFirewall ? 'bg-amber-400/10 border-amber-400/30 text-amber-300' : 'bg-white/5 border-white/10 text-slate-500'}`}
          >
            Firewall {showFirewall ? 'ON' : 'OFF'}
          </button>
          <button onClick={handleExport} className="px-2.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300 font-bold hover:bg-white/10">
            ⤓ PNG
          </button>
        </div>
      </div>

      <div ref={chartRef} className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
            <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11, fill: '#64748b' }} />
            <YAxis stroke="#64748b" tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} width={70} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0B111E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
              formatter={(value: unknown, name: unknown) => [`₹${Number(value).toLocaleString('en-IN')}`, String(name) === 'baselineSavings' ? 'Baseline' : 'Simulated']}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px', color: '#94a3b8' }} />
            {showFirewall && (
              <ReferenceLine y={data[0]?.earmarkedThreshold} stroke="#f59e0b" strokeDasharray="6 4"
                label={{ value: `Firewall ₹${(data[0]?.earmarkedThreshold / 1000).toFixed(0)}k`, fill: '#f59e0b', fontSize: 10, position: 'right' }} />
            )}
            <Line type="monotone" dataKey="baselineSavings" stroke="#10B981" strokeWidth={2.5} dot={false} name="Baseline" />
            <Line type="monotone" dataKey="simulatedSavings" stroke="#f43f5e" strokeWidth={2.5} dot={false} name="Simulated" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-3.5 rounded-2xl bg-black/50 border border-white/[0.07]">
          <span className="text-slate-500 text-[11px] font-semibold">Delay impact</span>
          <p className="font-bold text-amber-300 font-mono text-[15px]">+{simulation.goalDelayMonths} months</p>
        </div>
        <div className="p-3.5 rounded-2xl bg-black/50 border border-white/[0.07]">
          <span className="text-slate-500 text-[11px] font-semibold">Gap at 12 months</span>
          <p className="font-bold text-red-300 font-mono text-[15px]">−₹{gap.toLocaleString('en-IN')}</p>
        </div>
        <div className="p-3.5 rounded-2xl bg-black/50 border border-white/[0.07]">
          <span className="text-slate-500 text-[11px] font-semibold">Recovery</span>
          <p className="font-bold text-slate-100 font-mono text-[15px]">~{Math.ceil(simulation.goalDelayMonths * 4)} weeks</p>
        </div>
      </div>
    </div>
  );
}
