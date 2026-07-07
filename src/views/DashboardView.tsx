import React from 'react';
import {
  FolderKanban, Activity, CheckCircle2, AlertTriangle, Clock,
  TrendingUp, ArrowUpRight, ArrowDownRight, Cpu, Layers,
  Target, Zap, Eye, Box, FileImage, Users, ChevronRight, Sparkles,
  Calendar, BarChart3, Car, Bike, Truck, Bus, PersonStanding, TrafficCone, Building2, Route
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
  const totalFrames = projects.reduce((s, p) => s + p.frameCount, 0);
  const avgPct = projects.length ? Math.round(projects.reduce((s, p) => s + p.progress, 0) / projects.length) : 0;
  const failedChecks = checks.filter((c) => c.status === 'fail').length;
  const passedChecks = checks.filter((c) => c.status === 'pass').length;

  const card = `rounded-xl border transition-all duration-300 hover:shadow-lg card-hover ${dm ? 'bg-slate-900/80 border-slate-800/80' : 'bg-white border-slate-200/80'}`;

  const stats = [
    { label: 'Active Datasets', value: activeCount, icon: FolderKanban, color: 'blue', delta: '+2', up: true, desc: '3 completed this week' },
    { label: 'Pending Review', value: reviewCount, icon: Clock, color: 'amber', delta: '+1', up: false, desc: 'Awaiting QA validation' },
    { label: 'QA Issues', value: failedChecks, icon: AlertTriangle, color: 'rose', delta: '-3', up: false, desc: 'Resolved today' },
    { label: 'Avg Progress', value: avgPct + '%', icon: TrendingUp, color: 'emerald', delta: '+8%', up: true, desc: 'Above target' },
  ];

  const cm: Record<string, string> = {
    blue: dm ? 'bg-blue-500/15 text-blue-400' : 'bg-blue-50 text-blue-600',
    amber: dm ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-50 text-amber-600',
    rose: dm ? 'bg-rose-500/15 text-rose-400' : 'bg-rose-50 text-rose-600',
    emerald: dm ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-600',
  };

  // LiDAR/vehicle throughput data
  const dailyData = [35, 52, 41, 68, 55, 72, 48, 63, 80, 55, 42, 70, 65, 88];
  const maxVal = Math.max(...dailyData);

  const activityIcon = (type: string) => {
    const map: Record<string, { icon: React.FC<any>; cls: string }> = {
      complete: { icon: CheckCircle2, cls: dm ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-600' },
      upload: { icon: Box, cls: dm ? 'bg-blue-500/15 text-blue-400' : 'bg-blue-50 text-blue-600' },
      review: { icon: Eye, cls: dm ? 'bg-cyan-500/15 text-cyan-400' : 'bg-cyan-50 text-cyan-600' },
      ai: { icon: Sparkles, cls: dm ? 'bg-violet-500/15 text-violet-400' : 'bg-violet-50 text-violet-600' },
      reject: { icon: AlertTriangle, cls: dm ? 'bg-rose-500/15 text-rose-400' : 'bg-rose-50 text-rose-600' },
    };
    return map[type] || map.review;
  };

  // Vehicle/object class breakdown (autonomous vehicle classes)
  const objectClasses = [
    { label: 'Vehicles', value: Math.round(totalAnns * 0.35), icon: Car, color: 'from-blue-500 to-blue-600' },
    { label: 'Pedestrians', value: Math.round(totalAnns * 0.18), icon: PersonStanding, color: 'from-emerald-500 to-teal-500' },
    { label: 'Cyclists', value: Math.round(totalAnns * 0.08), icon: Bike, color: 'from-cyan-500 to-sky-500' },
    { label: 'Trucks', value: Math.round(totalAnns * 0.12), icon: Truck, color: 'from-amber-500 to-orange-500' },
    { label: 'Buses', value: Math.round(totalAnns * 0.05), icon: Bus, color: 'from-violet-500 to-purple-500' },
    { label: 'Traffic Signs', value: Math.round(totalAnns * 0.15), icon: TrafficCone, color: 'from-rose-500 to-pink-500' },
  ];

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="p-6 max-w-[1440px] mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="animate-fade-in">
          <h1 className={`text-2xl font-bold tracking-tight ${dm ? 'text-white' : 'text-slate-900'}`}>AV Dataset Dashboard</h1>
          <p className={`text-sm mt-0.5 flex items-center gap-1.5 ${dm ? 'text-slate-400' : 'text-slate-500'}`}>
            <Calendar size={12} /> {dateStr}
          </p>
        </div>
        <div className="flex items-center gap-2 animate-fade-in stagger-1">
          <button onClick={() => onNavigate('studio')} className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-cyan-600 transition-all shadow-sm hover:shadow-md btn-press">
            <Car size={14} /> Annotate LiDAR
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <div key={s.label} className={`${card} p-4 animate-fade-in-up stagger-${i + 1}`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${cm[s.color]} shadow-sm`}>
                <s.icon size={18} strokeWidth={1.75} />
              </div>
              <span className={`text-[10px] font-semibold flex items-center gap-0.5 px-2 py-0.5 rounded-full transition-colors ${
                s.up ? (dm ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600') : (dm ? 'bg-rose-500/10 text-rose-400' : 'bg-rose-50 text-rose-600')
              }`}>
                {s.up ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                {s.delta}
              </span>
            </div>
            <p className={`text-2xl font-bold tracking-tight ${dm ? 'text-white' : 'text-slate-900'}`}>{s.value}</p>
            <p className={`text-xs font-medium ${dm ? 'text-slate-400' : 'text-slate-500'}`}>{s.label}</p>
            <p className={`text-[10px] mt-1 ${dm ? 'text-slate-600' : 'text-slate-400'}`}>{s.desc}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Throughput chart */}
        <div className={`${card} lg:col-span-2 p-4 animate-fade-in-scale stagger-2`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={`text-sm font-semibold ${dm ? 'text-white' : 'text-slate-900'}`}>LiDAR Frame Throughput</h3>
              <p className={`text-xs ${dm ? 'text-slate-500' : 'text-slate-400'}`}>Last 14 days · Frames annotated per day</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500" />
                <span className={`text-xs ${dm ? 'text-slate-400' : 'text-slate-500'}`}>Point Clouds</span>
              </div>
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${dm ? 'bg-slate-800 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                <TrendingUp size={12} /> +12.4%
              </div>
            </div>
          </div>
          <div className="flex items-end gap-1.5 h-36 pt-2">
            {dailyData.map((v, i) => (
              <div key={i} className="flex-1 group relative chart-bar" style={{ animationDelay: `${i * 0.03}s` }}>
                <div
                  className={`w-full rounded-t transition-all duration-200 group-hover:opacity-90 ${
                    i === dailyData.length - 1
                      ? 'bg-gradient-to-t from-blue-600 to-cyan-500 shadow-sm'
                      : dm ? 'bg-slate-700/60 hover:bg-slate-600/60' : 'bg-slate-300/60 hover:bg-slate-400/60'
                  }`}
                  style={{ height: `${(v / maxVal) * 100}%` }}
                />
                {i === dailyData.length - 1 && (
                  <div className={`absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap ${dm ? 'bg-slate-800 text-white' : 'bg-slate-900 text-white'}`}>
                    {v}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Dataset breakdown - Waymo-style statistics */}
        <div className={`${card} p-4 animate-fade-in-scale stagger-3`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-semibold ${dm ? 'text-white' : 'text-slate-900'}`}>AV Dataset Stats</h3>
            <Route size={14} className={dm ? 'text-slate-500' : 'text-slate-400'} />
          </div>
          <div className="space-y-3">
            {[
              { label: 'LiDAR Frames', value: totalFrames, icon: Box, desc: 'point clouds' },
              { label: 'Camera Images', value: totalImgs, icon: Eye, desc: 'frames' },
              { label: '3D Bounding Boxes', value: totalAnns, icon: Layers, desc: 'objects' },
              { label: 'AI Pre-labeled', value: Math.round(totalAnns * 0.42), icon: Cpu, desc: 'auto-annotated' },
            ].map((s, i) => (
              <div key={s.label} className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${dm ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}>
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center text-white shadow-sm ${objectClasses[i].color}`}>
                  <s.icon size={14} />
                </div>
                <div className="flex-1">
                  <p className={`text-xs font-medium ${dm ? 'text-slate-400' : 'text-slate-500'}`}>{s.label}</p>
                  <p className={`text-sm font-bold ${dm ? 'text-white' : 'text-slate-900'}`}>{s.value.toLocaleString()} <span className={`font-normal ${dm ? 'text-slate-600' : 'text-slate-400'}`}>{s.desc}</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Object Classes Breakdown */}
      <div className={`${card} p-4 animate-fade-in stagger-4`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-sm font-semibold ${dm ? 'text-white' : 'text-slate-900'}`}>Object Class Distribution</h3>
          <Target size={14} className={dm ? 'text-slate-500' : 'text-slate-400'} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {objectClasses.map((cls, i) => (
            <div key={cls.label} className={`p-3 rounded-xl text-center ${dm ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${cls.color} flex items-center justify-center mx-auto mb-2 text-white shadow-sm`}>
                <cls.icon size={18} />
              </div>
              <p className={`text-lg font-bold ${dm ? 'text-white' : 'text-slate-900'}`}>{cls.value.toLocaleString()}</p>
              <p className={`text-[10px] font-medium ${dm ? 'text-slate-500' : 'text-slate-400'}`}>{cls.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Projects and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Projects */}
        <div className={`${card} p-4 animate-fade-in stagger-5`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-semibold ${dm ? 'text-white' : 'text-slate-900'}`}>Sensor Datasets</h3>
            <button onClick={() => onNavigate('projects')} className={`text-xs flex items-center gap-0.5 px-2 py-1 rounded-md transition-colors ${dm ? 'text-blue-400 hover:bg-blue-500/10' : 'text-blue-600 hover:bg-blue-50'}`}>
              View all <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-2">
            {projects.slice(0, 4).map((p, i) => (
              <div key={p.id} onClick={() => onNavigate('projects')}
                className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all duration-200 ${dm ? 'hover:bg-slate-800/70' : 'hover:bg-slate-50'} animate-slide-in stagger-${i + 1}`}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  p.type === '3d' ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white'
                    : p.type === '2d+3d' ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white'
                    : dm ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
                }`}>
                  {p.type === '3d' ? <Box size={16} /> : p.type === '2d+3d' ? <Layers size={16} /> : <Eye size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${dm ? 'text-white' : 'text-slate-900'}`}>{p.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`h-1.5 w-24 rounded-full overflow-hidden ${dm ? 'bg-slate-800' : 'bg-slate-200'}`}>
                      <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 progress-pulse transition-all duration-500" style={{ width: `${p.progress}%` }} />
                    </div>
                    <span className={`text-[10px] font-semibold ${dm ? 'text-slate-500' : 'text-slate-400'}`}>{p.progress}%</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    p.status === 'active' ? (dm ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-700')
                      : p.status === 'review' ? (dm ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-50 text-amber-700')
                      : p.status === 'completed' ? (dm ? 'bg-blue-500/15 text-blue-400' : 'bg-blue-50 text-blue-700')
                      : (dm ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500')
                  }`}>{p.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity */}
        <div className={`${card} p-4 animate-fade-in stagger-6`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-semibold ${dm ? 'text-white' : 'text-slate-900'}`}>Recent Annotation Activity</h3>
            <Activity size={14} className={dm ? 'text-slate-500' : 'text-slate-400'} />
          </div>
          <div className="space-y-1">
            {activity.slice(0, 5).map((a, i) => {
              const { icon: Icon, cls } = activityIcon(a.type);
              return (
                <div key={a.id} className={`flex items-start gap-3 p-2 rounded-lg transition-colors ${dm ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'} animate-slide-in-right stagger-${i + 1}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cls}`}>
                    <Icon size={13} strokeWidth={1.75} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs leading-relaxed ${dm ? 'text-slate-200' : 'text-slate-700'}`}>
                      <span className="font-semibold">{a.user}</span> {a.action}
                    </p>
                    <p className={`text-[10px] mt-0.5 ${dm ? 'text-slate-600' : 'text-slate-400'}`}>{a.project} · {a.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Team productivity */}
      <div className={`${card} animate-fade-in stagger-6`}>
        <div className="flex items-center justify-between p-4 pb-3">
          <h3 className={`text-sm font-semibold ${dm ? 'text-white' : 'text-slate-900'}`}>Annotation Team Performance</h3>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 text-xs ${dm ? 'text-slate-400' : 'text-slate-500'}`}>
              <Users size={13} className={dm ? 'text-slate-500' : 'text-slate-400'} />
              <span>5 annotators</span>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className={`text-left ${dm ? 'text-slate-500' : 'text-slate-400'} border-b ${dm ? 'border-slate-800' : 'border-slate-100'}`}>
                <th className="pb-2.5 px-4 font-medium">Annotator</th>
                <th className="pb-2.5 px-3 font-medium text-center">Today</th>
                <th className="pb-2.5 px-3 font-medium text-center">Week</th>
                <th className="pb-2.5 px-3 font-medium text-center">Accuracy</th>
                <th className="pb-2.5 px-3 font-medium text-center">SLA</th>
                <th className="pb-2.5 px-4 font-medium text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Alice Chen', role: 'Lead', today: 142, week: 980, acc: 98.5, sla: 'On Track', initials: 'AC', color: 'from-blue-500 to-cyan-500' },
                { name: 'Bob Smith', role: 'Reviewer', today: 0, week: 412, acc: 99.1, sla: 'On Track', initials: 'BS', color: 'from-emerald-500 to-teal-500' },
                { name: 'Carol Davis', role: 'Annotator', today: 98, week: 745, acc: 96.2, sla: 'At Risk', initials: 'CD', color: 'from-amber-500 to-orange-500' },
                { name: 'Dan Wilson', role: 'Annotator', today: 67, week: 523, acc: 94.8, sla: 'On Track', initials: 'DW', color: 'from-sky-500 to-blue-500' },
                { name: 'Eve Park', role: 'Annotator', today: 112, week: 801, acc: 97.3, sla: 'On Track', initials: 'EP', color: 'from-rose-500 to-pink-500' },
              ].map((m, i) => (
                <tr key={m.name} className={`table-row-hover border-b last:border-0 ${dm ? 'border-slate-800/50 hover:bg-slate-800/30' : 'border-slate-50 hover:bg-slate-50/50'} animate-fade-in stagger-${(i % 4) + 1}`}>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${m.color} flex items-center justify-center text-white text-[10px] font-bold shadow-sm`}>{m.initials}</div>
                      <div>
                        <p className={`font-semibold ${dm ? 'text-white' : 'text-slate-900'}`}>{m.name}</p>
                        <p className={`text-[10px] ${dm ? 'text-slate-500' : 'text-slate-400'}`}>{m.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className={`px-3 text-center font-semibold ${dm ? 'text-slate-200' : 'text-slate-700'}`}>{m.today}</td>
                  <td className={`px-3 text-center ${dm ? 'text-slate-300' : 'text-slate-600'}`}>{m.week}</td>
                  <td className="px-3">
                    <div className="flex items-center justify-center gap-2">
                      <span className={`font-semibold ${dm ? 'text-slate-200' : 'text-slate-700'}`}>{m.acc}%</span>
                      <div className={`h-1.5 w-14 rounded-full overflow-hidden ${dm ? 'bg-slate-800' : 'bg-slate-200'}`}>
                        <div className={`h-full rounded-full ${m.acc > 97 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : m.acc > 95 ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-rose-500 to-pink-500'}`} style={{ width: `${m.acc}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-3 text-center">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${m.sla === 'On Track' ? (dm ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-700') : (dm ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-50 text-amber-700')}`}>{m.sla}</span>
                  </td>
                  <td className="px-4 text-center">
                    <span className={`flex items-center justify-center gap-1.5 ${dm ? 'text-slate-400' : 'text-slate-500'}`}>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 notification-dot" /> Active
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
