import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import type { Signals } from '@/types'
import { SIGNAL_LABELS, SIGNAL_WEIGHTS } from '@/lib/utils'

interface SignalTrendChartProps {
  signals: Signals
  accentColor: string
}

const SHORT_LABEL: Record<string, string> = {
  infrastructure: 'Infra',
  population: 'Population',
  satellite: 'Satellite',
  rera: 'RERA',
  employment: 'Jobs',
  priceVelocity: 'Price',
  govtScheme: 'Govt',
}

export default function SignalTrendChart({ signals, accentColor }: SignalTrendChartProps) {
  const chartData = (Object.keys(SIGNAL_LABELS) as Array<keyof Signals>)
    .map(key => ({
      key,
      label: SHORT_LABEL[key] ?? SIGNAL_LABELS[key],
      score: signals[key],
      weight: SIGNAL_WEIGHTS[key] ?? 0,
    }))
    .filter(item => item.score !== null && item.score !== undefined)

  if (chartData.length === 0) return null

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-[10px] font-sans font-bold uppercase tracking-[0.1em] text-slate-400">DNA signal breakdown</p>
      <p className="mt-1 text-[10px] text-slate-500">Score vs weight in the DNA formula for each signal.</p>
      <div className="mt-3 h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
            <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} interval={0} />
            <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: 'rgba(5,8,16,0.96)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#e2e8f0' }}
              labelStyle={{ color: '#e2e8f0', fontWeight: 700 }}
            />
            <Bar dataKey="score" name="Signal score" radius={[6, 6, 0, 0]} fill={accentColor} />
            <Bar dataKey="weight" name="DNA weight" radius={[6, 6, 0, 0]} fill="#38bdf8" opacity={0.72} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
