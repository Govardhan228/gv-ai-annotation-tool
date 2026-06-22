import React, { useState } from 'react';
import { TrendingUp, Target, BarChart3, Clock, CheckCircle2, AlertTriangle, Cpu, Users, Activity, Timer } from 'lucide-react';
import { useAppStore } from '../store/appStore';

type Tab = 'productivity' | 'quality' | 'sla';

export default function AnalyticsView() {
  const dm = useAppStore((s) => s.darkMode);
  const projects = useAppStore((s) => s.projects);
  const [tab, setTab] = useState<Tab>('productivity');

  const card = `rounded-xl border ${dm ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`;

  const TABS: { id: Tab; label: string; icon: React.FC<any> }[] = [
    { id: 'productivity', label: 'Productivity', icon: TrendingUp },
    { id: 'quality', label: 'QA Accuracy', icon: Target },
    { id: 'sla', label: 'SLA Tracking', icon: Clock },
  ];

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="mb-5">
        <h1 className={`text-2xl font-bold ${dm ? 'text-white' : 'text-slate-900'}`}>Analytics</h1>
        <p className={`text-sm mt-0.5 ${dm ? 'text-slate-400' : 'text-slate-500'}`}>Productivity, QA, and SLA insights</p>
      </div>

      <div className="flex gap-1 mb-4">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? 'bg-blue-600 text-white' : (dm ? 'bg-slate-900 text-slate-400 hover:bg-slate-800' : 'bg-white text-slate-600 hover:bg-slate-100')}`}>
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Annotations Today', value: '419', icon: Target, delta: '+12%', color: 'blue' },
          { label: 'QA Pass Rate', value: '96.8%', icon: CheckCircle2, delta: '+2.1%', color: 'emerald' },
          { label: 'Rework Rate', value: '3.2%', icon: AlertTriangle, delta: '-0.8%', color: 'amber' },
          { label: 'AI Assistance', value: '23%', icon: Cpu, delta: '+5%', color: 'violet' },
        ].map((k) => (
          <div key={k.label} className={`${card} p-4`}>
            <div className="flex items-center justify-between mb-2">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${dm ? 'bg-slate-800' : 'bg-slate-100'}`}>
                <k.icon size={16} className={dm ? 'text-slate-300' : 'text-slate-500'} />
              </div>
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${k.delta.startsWith('+') ? (dm ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600') : (dm ? 'bg-rose-500/10 text-rose-400' : 'bg-rose-50 text-rose-600')}`}>{k.delta}</span>
            </div>
            <p className={`text-xl font-bold ${dm ? 'text-white' : 'text-slate-900'}`}>{k.value}</p>
            <p className={`text-xs ${dm ? 'text-slate-400' : 'text-slate-500'}`}>{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Chart */}
        <div className={`${card} p-4`}>
          <h3 className={`text-sm font-semibold mb-3 ${dm ? 'text-white' : 'text-slate-900'}`}>
            {tab === 'productivity' ? 'Daily Output' : tab === 'quality' ? 'QA Accuracy Trend' : 'SLA Compliance'}
          </h3>
          <div className="flex items-end gap-1 h-40">
            {tab === 'productivity' && [35, 52, 41, 68, 55, 72, 48, 63, 80, 55, 42, 70, 88, 65].map((v, i) => (
              <div key={i} className="flex-1"><div className="w-full rounded-t bg-gradient-to-t from-blue-600 to-cyan-500" style={{ height: `${(v / 88) * 100}%` }} /></div>
            ))}
            {tab === 'quality' && [92, 94, 93, 95, 96, 97, 96, 97, 98, 97, 96, 97, 98, 97].map((v, i) => (
              <div key={i} className="flex-1"><div className={`w-full rounded-t ${dm ? 'bg-emerald-500/60' : 'bg-emerald-400'}`} style={{ height: `${((v - 90) / 8) * 100}%` }} /></div>
            ))}
            {tab === 'sla' && [88, 91, 94, 92, 96, 98, 97, 99, 98, 96, 94, 97, 98, 99].map((v, i) => (
              <div key={i} className="flex-1"><div className={`w-full rounded-t ${dm ? 'bg-amber-500/60' : 'bg-amber-400'}`} style={{ height: `${((v - 85) / 15) * 100}%` }} /></div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-slate-400">
            <span>Day 1</span><span>Day 14</span>
          </div>
        </div>

        {/* Breakdown */}
        <div className={`${card} p-4`}>
          <h3 className={`text-sm font-semibold mb-3 ${dm ? 'text-white' : 'text-slate-900'}`}>
            {tab === 'productivity' ? 'By Project' : tab === 'quality' ? 'Error Categories' : 'SLA Status'}
          </h3>
          <div className="space-y-3">
            {tab === 'productivity' && projects.slice(0, 5).map((p) => (
              <div key={p.id}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className={dm ? 'text-slate-300' : 'text-slate-700'}>{p.name}</span>
                  <span className={dm ? 'text-slate-400' : 'text-slate-500'}>{p.annotationCount.toLocaleString()}</span>
                </div>
                <div className={`h-2 rounded-full ${dm ? 'bg-slate-800' : 'bg-slate-100'}`}>
                  <div className="h-2 rounded-full bg-blue-500" style={{ width: `${Math.min(100, (p.annotationCount / 40000) * 100)}%` }} />
                </div>
              </div>
            ))}
            {tab === 'quality' && [
              { label: 'Tracking Gaps', count: 15, color: 'bg-rose-500' },
              { label: 'Mislabels', count: 8, color: 'bg-amber-500' },
              { label: 'Geometry Errors', count: 6, color: 'bg-blue-500' },
              { label: 'Attribute Missing', count: 4, color: 'bg-violet-500' },
              { label: 'Duplicate IDs', count: 3, color: 'bg-cyan-500' },
            ].map((e) => (
              <div key={e.label}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className={dm ? 'text-slate-300' : 'text-slate-700'}>{e.label}</span>
                  <span className={dm ? 'text-slate-400' : 'text-slate-500'}>{e.count}</span>
                </div>
                <div className={`h-2 rounded-full ${dm ? 'bg-slate-800' : 'bg-slate-100'}`}>
                  <div className={`h-2 rounded-full ${e.color}`} style={{ width: `${(e.count / 15) * 100}%` }} />
                </div>
              </div>
            ))}
            {tab === 'sla' && [
              { label: 'On Track', value: 5, total: 6, color: 'bg-emerald-500' },
              { label: 'At Risk', value: 1, total: 6, color: 'bg-amber-500' },
              { label: 'Overdue', value: 0, total: 6, color: 'bg-rose-500' },
            ].map((s) => (
              <div key={s.label} className={`flex items-center justify-between p-2.5 rounded-lg ${dm ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${s.color}`} />
                  <span className={`text-xs ${dm ? 'text-slate-300' : 'text-slate-700'}`}>{s.label}</span>
                </div>
                <span className={`text-xs font-medium ${dm ? 'text-white' : 'text-slate-900'}`}>{s.value}/{s.total}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User performance table */}
      <div className={`${card} mt-4`}>
        <div className="p-4 pb-2 flex items-center gap-2">
          <Users size={15} className={dm ? 'text-slate-400' : 'text-slate-500'} />
          <h3 className={`text-sm font-semibold ${dm ? 'text-white' : 'text-slate-900'}`}>User Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className={`text-left ${dm ? 'text-slate-500' : 'text-slate-400'} border-b ${dm ? 'border-slate-800' : 'border-slate-100'}`}>
                <th className="pb-2 px-4 font-medium">User</th>
                <th className="pb-2 px-3 font-medium">Annotations</th>
                <th className="pb-2 px-3 font-medium">Avg Time</th>
                <th className="pb-2 px-3 font-medium">Accuracy</th>
                <th className="pb-2 px-3 font-medium">Rework %</th>
                <th className="pb-2 px-4 font-medium">Trend</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Alice Chen', role: 'Lead', count: 980, time: '2.1m', acc: 98.5, rework: 1.5, initials: 'AC', trend: 'up' },
                { name: 'Bob Smith', role: 'Reviewer', count: 412, time: '3.5m', acc: 99.1, rework: 0.9, initials: 'BS', trend: 'up' },
                { name: 'Carol Davis', role: 'Annotator', count: 745, time: '2.8m', acc: 96.2, rework: 3.8, initials: 'CD', trend: 'down' },
                { name: 'Dan Wilson', role: 'Annotator', count: 523, time: '3.1m', acc: 94.8, rework: 5.2, initials: 'DW', trend: 'up' },
                { name: 'Eve Park', role: 'Annotator', count: 801, time: '2.4m', acc: 97.3, rework: 2.7, initials: 'EP', trend: 'up' },
              ].map((u) => (
                <tr key={u.name} className={`border-b last:border-0 ${dm ? 'border-slate-800/50' : 'border-slate-50'}`}>
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-[10px] font-semibold">{u.initials}</div>
                      <div><p className={`font-medium ${dm ? 'text-white' : 'text-slate-900'}`}>{u.name}</p><p className={`text-[10px] ${dm ? 'text-slate-500' : 'text-slate-400'}`}>{u.role}</p></div>
                    </div>
                  </td>
                  <td className={`px-3 ${dm ? 'text-slate-300' : 'text-slate-600'}`}>{u.count}</td>
                  <td className="px-3"><span className={`flex items-center gap-1 ${dm ? 'text-slate-300' : 'text-slate-600'}`}><Timer size={11} /> {u.time}</span></td>
                  <td className="px-3">
                    <div className="flex items-center gap-1.5">
                      <div className={`h-1.5 w-12 rounded-full ${dm ? 'bg-slate-800' : 'bg-slate-200'}`}><div className={`h-1.5 rounded-full ${u.acc > 97 ? 'bg-emerald-500' : u.acc > 95 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${u.acc}%` }} /></div>
                      <span className={dm ? 'text-slate-300' : 'text-slate-600'}>{u.acc}%</span>
                    </div>
                  </td>
                  <td className="px-3"><span className={u.rework < 2 ? 'text-emerald-500' : u.rework < 4 ? 'text-amber-500' : 'text-rose-500'}>{u.rework}%</span></td>
                  <td className="px-4">{u.trend === 'up' ? <TrendingUp size={14} className="text-emerald-500" /> : <TrendingUp size={14} className="text-rose-500 rotate-180" />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
