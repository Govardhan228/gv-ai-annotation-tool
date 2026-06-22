import React from 'react';
import {
  FolderKanban, Activity, CheckCircle2, AlertTriangle, Clock,
  TrendingUp, ArrowUpRight, ArrowDownRight, Cpu, Layers,
  Target, Zap, Eye, Box, FileImage, Users, ChevronRight, Sparkles
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import type { ViewId } from '../App';

interface Props { onNavigate: (v: ViewId) => void; }

export default function Dashboard({ onNavigate }: Props) {
  const dm = useAppStore((s) => s.darkMode);
  const projects = useAppStore((s) => s.projects);
  const activity = useAppStore((s) => s.activity);
  const checks = useAppStore((s) => s.qualityChecks);

  const activeCount = projects.filter((p) => p.status === 'active').length;
  const reviewCount = projects.filter((p) => p.status === 'review').length;
  const totalImgs = projects.reduce((s, p) => s + p.imageCount, 0);
  const totalAnns = projects.reduce((s, p) => s + p.annotationCount, 0);
  const avgPct = projects.length ? Math.round(projects.reduce((s, p) => s + p.progress, 0) / projects.length) : 0;
  const failedChecks = checks.filter((c) => c.status === 'fail').length;

  const card = `rounded-xl border transition-all duration-300 hover:shadow-lg ${dm ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`;

  const stats = [
    { label: 'Active Projects', value: activeCount, icon: FolderKanban, color: 'blue', delta: '+2', up: true },
    { label: 'Pending Review', value: reviewCount, icon: Clock, color: 'amber', delta: '+1', up: false },
    { label: 'QA Issues', value: failedChecks, icon: AlertTriangle, color: 'rose', delta: '-3', up: false },
    { label: 'Avg Progress', value: avgPct + '%', icon: TrendingUp, color: 'emerald', delta: '+8%', up: true },
  ];

  const cm: Record<string, string> = {
    blue: dm ? 'bg-blue-500/15 text-blue-400' : 'bg-blue-50 text-blue-600',
    amber: dm ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-50 text-amber-600',
    rose: dm ? 'bg-rose-500/15 text-rose-400' : 'bg-rose-50 text-rose-600',
    emerald: dm ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-600',
  };

  const dailyData = [35, 52, 41, 68, 55, 72, 48, 63, 80, 55, 42, 70, 65, 88];
  const maxVal = Math.max(...dailyData);

  const activityIcon = (type: string) => {
    const map: Record<string, { icon: React.FC<any>; cls: string }> = {
      complete: { icon: CheckCircle2, cls: dm ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-600' },
      upload: { icon: FileImage, cls: dm ? 'bg-blue-500/15 text-blue-400' : 'bg-blue-50 text-blue-600' },
      review: { icon: Eye, cls: dm ? 'bg-cyan-500/15 text-cyan-400' : 'bg-cyan-50 text-cyan-600' },
      ai: { icon: Sparkles, cls: dm ? 'bg-violet-500/15 text-violet-400' : 'bg-violet-50 text-violet-600' },
      reject: { icon: AlertTriangle, cls: dm ? 'bg-rose-500/15 text-rose-400' : 'bg-rose-50 text-rose-600' },
    };
    return map[type] || map.review;
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-5">
      <div>
        <h1 className={`text-2xl font-bold ${dm ? 'text-white' : 'text-slate-900'}`}>Welcome back, Alice</h1>
        <p className={`text-sm mt-0.5 ${dm ? 'text-slate-400' : 'text-slate-500'}`}>Your annotation platform overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className={`${card} p-4`}>
            <div className="flex items-center justify-between mb-2">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${cm[s.color]}`}>
                <s.icon size={18} />
              </div>
              <span className={`text-[10px] font-semibold flex items-center gap-0.5 px-1.5 py-0.5 rounded-full ${
                s.up ? (dm ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600') : (dm ? 'bg-rose-500/10 text-rose-400' : 'bg-rose-50 text-rose-600')
              }`}>
                {s.up ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                {s.delta}
              </span>
            </div>
            <p className={`text-xl font-bold ${dm ? 'text-white' : 'text-slate-900'}`}>{s.value}</p>
            <p className={`text-xs ${dm ? 'text-slate-400' : 'text-slate-500'}`}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Chart */}
        <div className={`${card} lg:col-span-2 p-4`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className={`text-sm font-semibold ${dm ? 'text-white' : 'text-slate-900'}`}>Annotation Throughput</h3>
              <p className={`text-xs ${dm ? 'text-slate-500' : 'text-slate-400'}`}>Last 14 days</p>
            </div>
            <div className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${dm ? 'bg-blue-400' : 'bg-blue-500'}`} />
              <span className={`text-xs ${dm ? 'text-slate-400' : 'text-slate-500'}`}>Annotations/day</span>
            </div>
          </div>
          <div className="flex items-end gap-1 h-32">
            {dailyData.map((v, i) => (
              <div key={i} className="flex-1 group relative">
                <div
                  className={`w-full rounded-t transition-all duration-300 group-hover:opacity-80 ${i === dailyData.length - 1 ? 'bg-blue-500' : dm ? 'bg-blue-500/50' : 'bg-blue-300'}`}
                  style={{ height: `${(v / maxVal) * 100}%` }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Progress by type */}
        <div className={`${card} p-4`}>
          <h3 className={`text-sm font-semibold mb-3 ${dm ? 'text-white' : 'text-slate-900'}`}>Dataset Breakdown</h3>
          <div className="space-y-3">
            {[
              { label: '2D Images', value: totalImgs, icon: Eye, color: 'bg-blue-500' },
              { label: '3D Frames', value: projects.reduce((s, p) => s + p.frameCount, 0), icon: Box, color: 'bg-emerald-500' },
              { label: 'Annotations', value: totalAnns, icon: Layers, color: 'bg-amber-500' },
              { label: 'AI Assisted', value: Math.round(totalAnns * 0.23), icon: Cpu, color: 'bg-violet-500' },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${dm ? 'bg-slate-800' : 'bg-slate-100'}`}>
                  <s.icon size={14} className={dm ? 'text-slate-400' : 'text-slate-500'} />
                </div>
                <div className="flex-1">
                  <p className={`text-xs ${dm ? 'text-slate-400' : 'text-slate-500'}`}>{s.label}</p>
                  <p className={`text-sm font-semibold ${dm ? 'text-white' : 'text-slate-900'}`}>{s.value.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Projects */}
        <div className={`${card} p-4`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-sm font-semibold ${dm ? 'text-white' : 'text-slate-900'}`}>Active Projects</h3>
            <button onClick={() => onNavigate('projects')} className={`text-xs flex items-center gap-0.5 ${dm ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}>
              View all <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-2">
            {projects.slice(0, 4).map((p) => (
              <div key={p.id} onClick={() => onNavigate('projects')}
                className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${dm ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${p.type === '3d' ? (dm ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-600') : p.type === '2d+3d' ? (dm ? 'bg-blue-500/15 text-blue-400' : 'bg-blue-50 text-blue-600') : (dm ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500')}`}>
                  {p.type === '3d' ? <Box size={16} /> : p.type === '2d+3d' ? <Layers size={16} /> : <Eye size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${dm ? 'text-white' : 'text-slate-900'}`}>{p.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className={`h-1 w-20 rounded-full ${dm ? 'bg-slate-800' : 'bg-slate-200'}`}>
                      <div className="h-1 rounded-full bg-blue-500" style={{ width: `${p.progress}%` }} />
                    </div>
                    <span className={`text-[10px] ${dm ? 'text-slate-500' : 'text-slate-400'}`}>{p.progress}%</span>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                  p.status === 'active' ? (dm ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700')
                    : p.status === 'review' ? (dm ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-700')
                    : p.status === 'completed' ? (dm ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-700')
                    : (dm ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500')
                }`}>{p.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Activity */}
        <div className={`${card} p-4`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-sm font-semibold ${dm ? 'text-white' : 'text-slate-900'}`}>Recent Activity</h3>
            <Activity size={14} className={dm ? 'text-slate-500' : 'text-slate-400'} />
          </div>
          <div className="space-y-2">
            {activity.slice(0, 5).map((a) => {
              const { icon: Icon, cls } = activityIcon(a.type);
              return (
                <div key={a.id} className={`flex items-start gap-2.5 p-2 rounded-lg ${dm ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${cls}`}>
                    <Icon size={13} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs ${dm ? 'text-slate-200' : 'text-slate-700'}`}>
                      <span className="font-medium">{a.user}</span> {a.action}
                    </p>
                    <p className={`text-[10px] ${dm ? 'text-slate-500' : 'text-slate-400'}`}>{a.project} · {a.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Team productivity */}
      <div className={card}>
        <div className="flex items-center justify-between p-4 pb-2">
          <h3 className={`text-sm font-semibold ${dm ? 'text-white' : 'text-slate-900'}`}>Team Productivity</h3>
          <Users size={14} className={dm ? 'text-slate-500' : 'text-slate-400'} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className={`text-left ${dm ? 'text-slate-500' : 'text-slate-400'} border-b ${dm ? 'border-slate-800' : 'border-slate-100'}`}>
                <th className="pb-2 px-4 font-medium">Annotator</th>
                <th className="pb-2 px-3 font-medium">Today</th>
                <th className="pb-2 px-3 font-medium">Week</th>
                <th className="pb-2 px-3 font-medium">Accuracy</th>
                <th className="pb-2 px-3 font-medium">SLA</th>
                <th className="pb-2 px-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Alice Chen', role: 'Lead', today: 142, week: 980, acc: 98.5, sla: 'On Track', initials: 'AC', color: 'from-blue-500 to-cyan-500' },
                { name: 'Bob Smith', role: 'Reviewer', today: 0, week: 412, acc: 99.1, sla: 'On Track', initials: 'BS', color: 'from-emerald-500 to-teal-500' },
                { name: 'Carol Davis', role: 'Annotator', today: 98, week: 745, acc: 96.2, sla: 'At Risk', initials: 'CD', color: 'from-amber-500 to-orange-500' },
                { name: 'Dan Wilson', role: 'Annotator', today: 67, week: 523, acc: 94.8, sla: 'On Track', initials: 'DW', color: 'from-violet-500 to-purple-500' },
                { name: 'Eve Park', role: 'Annotator', today: 112, week: 801, acc: 97.3, sla: 'On Track', initials: 'EP', color: 'from-rose-500 to-pink-500' },
              ].map((m) => (
                <tr key={m.name} className={`border-b last:border-0 ${dm ? 'border-slate-800/50' : 'border-slate-50'}`}>
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${m.color} flex items-center justify-center text-white text-[10px] font-semibold`}>{m.initials}</div>
                      <div>
                        <p className={`font-medium ${dm ? 'text-white' : 'text-slate-900'}`}>{m.name}</p>
                        <p className={`text-[10px] ${dm ? 'text-slate-500' : 'text-slate-400'}`}>{m.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className={`px-3 ${dm ? 'text-slate-300' : 'text-slate-600'}`}>{m.today}</td>
                  <td className={`px-3 ${dm ? 'text-slate-300' : 'text-slate-600'}`}>{m.week}</td>
                  <td className="px-3">
                    <div className="flex items-center gap-1.5">
                      <span className={dm ? 'text-slate-300' : 'text-slate-600'}>{m.acc}%</span>
                      <div className={`h-1 w-12 rounded-full ${dm ? 'bg-slate-800' : 'bg-slate-200'}`}>
                        <div className={`h-1 rounded-full ${m.acc > 97 ? 'bg-emerald-500' : m.acc > 95 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${m.acc}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-3">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${m.sla === 'On Track' ? (dm ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700') : (dm ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-700')}`}>{m.sla}</span>
                  </td>
                  <td className="px-4">
                    <span className={`flex items-center gap-1 ${dm ? 'text-slate-400' : 'text-slate-500'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
