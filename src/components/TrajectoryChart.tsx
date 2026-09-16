'use client';

import { useState, useRef } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { SimulationResult } from '@/types';

interface Props {
  simulation: SimulationResult;
}

export default function TrajectoryChart({ simulation }: Props) {
  const data = simulation.trajectory;
  const [showFirewall, setShowFirewall] = useState(true);
  const chartRef = useRef<HTMLDivElement>(null);

  const handleExport = () => {
    // Simple SVG export for PPT — captures chart wrapper
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
        ctx.fillStyle = '#0f172a';
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

  return (
    <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            3-Year Wealth Trajectory
            <span className="text-xs font-normal text-slate-400 font-mono">(PPT Slide 6 Spec)</span>
          </h3>
          <p className="text-xs text-slate-400">
            Baseline vs Simulated savings over 36 months • Earmarked firewall ₹{simulation.todayEarmarked.toLocaleString('en-IN')} never counted
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-emerald-400 inline-block" /> Baseline
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-rose-400 inline-block" /> Simulated
          </span>
          <button
            onClick={() => setShowFirewall(!showFirewall)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-full border text-[11px] ${showFirewall ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
          >
            <span className="w-3 h-0.5 bg-amber-400/60 border-dashed border-t border-amber-400 inline-block" /> Firewall {showFirewall ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={handleExport}
            className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[11px] hover:bg-slate-700"
          >
            ⤓ Export PNG
          </button>
        </div>
      </div>

      <div ref={chartRef} className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11 }} />
            <YAxis
              stroke="#64748b"
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              width={70}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: '12px',
                fontSize: '12px',
              }}
              formatter={(value: unknown, name: unknown) => [
                `₹${Number(value).toLocaleString('en-IN')}`,
                String(name) === 'baselineSavings' ? 'Baseline Savings' : 'Simulated Savings',
              ]}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            {showFirewall && (
              <ReferenceLine
                y={data[0]?.earmarkedThreshold}
                stroke="#f59e0b"
                strokeDasharray="6 4"
                label={{ value: `Firewall ₹${(data[0]?.earmarkedThreshold / 1000).toFixed(0)}k`, fill: '#f59e0b', fontSize: 10, position: 'right' }}
              />
            )}
            <Line
              type="monotone"
              dataKey="baselineSavings"
              stroke="#10b981"
              strokeWidth={2.5}
              dot={false}
              name="Baseline Savings"
              activeDot={{ r: 4, fill: '#10b981' }}
            />
            <Line
              type="monotone"
              dataKey="simulatedSavings"
              stroke="#f43f5e"
              strokeWidth={2.5}
              dot={false}
              name="Simulated Savings"
              activeDot={{ r: 4, fill: '#f43f5e' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
          <span className="text-slate-400">Delay Impact</span>
          <p className="font-bold text-amber-400 font-mono">+{simulation.goalDelayMonths} months</p>
          <p className="text-slate-500">Goal arrival pushed</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
          <span className="text-slate-400">Gap at 12 months</span>
          <p className="font-bold text-rose-400 font-mono">
            -₹{(data[4].baselineSavings - data[4].simulatedSavings).toLocaleString('en-IN')}
          </p>
          <p className="text-slate-500">Wealth difference</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
          <span className="text-slate-400">Recovery</span>
          <p className="font-bold text-slate-200">~{Math.ceil(simulation.goalDelayMonths * 4)} weeks</p>
          <p className="text-slate-500">With ₹{simulation.todayBalance.toLocaleString('en-IN')} balance</p>
        </div>
      </div>
    </div>
  );
}
