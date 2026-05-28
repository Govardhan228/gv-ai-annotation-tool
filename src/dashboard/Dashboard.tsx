import React from 'react';
import {
  FolderOpen, Zap, BarChart3, CheckCircle2, Clock,
  Users, TrendingUp, Target, ArrowUpRight, ArrowDownRight,
  Layers, Box, Eye, FileImage, Tag, Cpu, Plus
} from 'lucide-react';
import { Project } from '../types';

interface DashboardProps {
  dark: boolean;
  projects: Project[];
  onNavigate: (view: string) => void;
}

export default function Dashboard({ dark, projects, onNavigate }: DashboardProps) {
  const activeProjects = projects.filter(p => p.status === 'active').length;
  const totalImages = projects.reduce((s, p) => s + p.imageCount, 0);
  const totalAnnotations = projects.reduce((s, p) => s + p.annotationCount, 0);
  const completedProjects = projects.filter(p => p.status === 'completed').length;
  const reviewProjects = projects.filter(p => p.status === 'review').length;
  const avgPerImage = totalImages > 0 ? (totalAnnotations / totalImages).toFixed(1) : '0';

  const dm = dark;
  const card = `rounded-xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
    dm ? 'bg-gray-800/80 border-gray-700/50' : 'bg-white border-gray-200'
  }`;

  const statCards = [
    { label: 'Total Projects', value: projects.length, icon: FolderOpen, color: 'blue', delta: '+2' },
    { label: 'Active Tasks', value: 14, icon: Zap, color: 'amber', delta: '+5' },
    { label: 'Completed', value: completedProjects, icon: CheckCircle2, color: 'emerald', delta: '+1' },
    { label: 'QA Pending', value: reviewProjects, icon: Clock, color: 'rose', delta: '-2' },
  ];

  const cm: Record<string, { icon: string }> = {
    blue: { icon: dm ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600' },
    amber: { icon: dm ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-50 text-amber-600' },
    emerald: { icon: dm ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-600' },
    rose: { icon: dm ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-50 text-rose-600' },
  };

  // Sample data for the chart
  const dailyData = [35, 52, 41, 68, 55, 72, 48, 63, 80, 55, 42, 70, 65, 58];
  const maxVal = Math.max(...dailyData);

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold tracking-tight ${dm ? 'text-white' : 'text-gray-900'}`}>
            Dashboard
          </h1>
          <p className={`mt-1 ${dm ? 'text-gray-400' : 'text-gray-500'}`}>
            Overview of your annotation platform
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('projects')}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium shadow-sm shadow-blue-600/20"
          >
            <FolderOpen size={18} />
            View Projects
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className={card}>
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${cm[s.color].icon}`}>
                  <s.icon size={20} />
                </div>
                <span className={`text-xs font-semibold flex items-center gap-0.5 px-2 py-0.5 rounded-full ${
                  s.delta.startsWith('+')
                    ? dm ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
                    : dm ? 'bg-rose-500/10 text-rose-400' : 'bg-rose-50 text-rose-600'
                }`}>
                  {s.delta.startsWith('+') ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {s.delta}
                </span>
              </div>
              <p className={`text-2xl font-bold ${dm ? 'text-white' : 'text-gray-900'}`}>{s.value}</p>
              <p className={`text-sm mt-0.5 ${dm ? 'text-gray-400' : 'text-gray-500'}`}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Images', value: totalImages.toLocaleString(), icon: FileImage, color: 'blue' },
          { label: 'Total Annotations', value: totalAnnotations.toLocaleString(), icon: Layers, color: 'emerald' },
          { label: 'Avg Per Image', value: avgPerImage, icon: Target, color: 'amber' },
          { label: 'AI Assisted', value: '23%', icon: Cpu, color: 'rose' },
        ].map((s) => (
          <div key={s.label} className={`${card} flex items-center gap-3 p-4`}>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${cm[s.color].icon}`}>
              <s.icon size={18} />
            </div>
            <div>
              <p className={`text-lg font-bold ${dm ? 'text-white' : 'text-gray-900'}`}>{s.value}</p>
              <p className={`text-xs ${dm ? 'text-gray-500' : 'text-gray-400'}`}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Daily Annotations */}
        <div className={`${card} lg:col-span-2 p-5`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-semibold ${dm ? 'text-white' : 'text-gray-900'}`}>Daily Annotation Count</h3>
            <span className={`text-xs ${dm ? 'text-gray-500' : 'text-gray-400'}`}>Last 14 days</span>
          </div>
          <div className="flex items-end gap-1.5 h-36">
            {dailyData.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                <div
                  className={`w-full rounded-t transition-all duration-200 group-hover:opacity-80 ${
                    i === dailyData.length - 1 ? 'bg-blue-500' : dm ? 'bg-blue-500/60' : 'bg-blue-400'
                  }`}
                  style={{ height: `${(v / maxVal) * 100}%` }}
                />
                <span className={`text-[9px] ${dm ? 'text-gray-600' : 'text-gray-400'}`}>
                  {i + 1}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Progress */}
        <div className={`${card} p-5`}>
          <h3 className={`text-sm font-semibold mb-4 ${dm ? 'text-white' : 'text-gray-900'}`}>Dataset Progress</h3>
          <div className="space-y-4">
            {[
              { label: '2D Datasets', pct: 78, icon: Eye, color: 'bg-blue-500' },
              { label: '3D Datasets', pct: 42, icon: Box, color: 'bg-emerald-500' },
              { label: 'QA Review', pct: 61, icon: Tag, color: 'bg-amber-500' },
            ].map(s => (
              <div key={s.label}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className={`flex items-center gap-1.5 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>
                    <s.icon size={14} /> {s.label}
                  </span>
                  <span className={`font-semibold ${dm ? 'text-white' : 'text-gray-900'}`}>{s.pct}%</span>
                </div>
                <div className={`h-1.5 rounded-full ${dm ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  <div className={`h-1.5 rounded-full ${s.color} transition-all duration-500`} style={{ width: `${s.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Team Productivity */}
        <div className={`${card} p-5`}>
          <h3 className={`text-sm font-semibold mb-4 ${dm ? 'text-white' : 'text-gray-900'}`}>Team Productivity</h3>
          <div className="space-y-3">
            {[
              { name: 'Alice Chen', role: 'Annotator', count: 342, trend: '+12%' },
              { name: 'Bob Smith', role: 'Reviewer', count: 186, trend: '+5%' },
              { name: 'Carol Davis', role: 'Annotator', count: 298, trend: '+8%' },
              { name: 'Dan Wilson', role: 'Annotator', count: 245, trend: '-2%' },
            ].map(m => (
              <div key={m.name} className={`flex items-center gap-3 p-2.5 rounded-lg ${dm ? 'bg-gray-700/30' : 'bg-gray-50'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${dm ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                  {m.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${dm ? 'text-white' : 'text-gray-900'}`}>{m.name}</p>
                  <p className={`text-xs ${dm ? 'text-gray-500' : 'text-gray-400'}`}>{m.role}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${dm ? 'text-white' : 'text-gray-900'}`}>{m.count}</p>
                  <p className={`text-xs ${m.trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>{m.trend}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className={`${card} p-5`}>
          <h3 className={`text-sm font-semibold mb-4 ${dm ? 'text-white' : 'text-gray-900'}`}>Recent Activity</h3>
          <div className="space-y-3">
            {[
              { action: 'Completed batch annotation', project: 'Medical Imaging', time: '2m ago', icon: CheckCircle2, color: 'emerald' },
              { action: 'Uploaded 500 new frames', project: 'AV Dataset', time: '15m ago', icon: Upload, color: 'blue' },
              { action: 'QA rejected 3 annotations', project: 'AV Dataset', time: '1h ago', icon: Tag, color: 'rose' },
              { action: 'Auto-segment completed', project: 'Manufacturing QC', time: '2h ago', icon: Cpu, color: 'amber' },
            ].map((a, i) => (
              <div key={i} className={`flex items-start gap-3 p-2.5 rounded-lg ${dm ? 'bg-gray-700/30' : 'bg-gray-50'}`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  a.color === 'emerald' ? cm.emerald.icon :
                  a.color === 'blue' ? cm.blue.icon :
                  a.color === 'rose' ? cm.rose.icon : cm.amber.icon
                }`}>
                  <a.icon size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${dm ? 'text-gray-200' : 'text-gray-700'}`}>{a.action}</p>
                  <p className={`text-xs ${dm ? 'text-gray-500' : 'text-gray-400'}`}>{a.project}</p>
                </div>
                <span className={`text-xs whitespace-nowrap ${dm ? 'text-gray-600' : 'text-gray-400'}`}>{a.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Projects Table */}
      <div className={card}>
        <div className="flex items-center justify-between p-5 pb-3">
          <h3 className={`text-sm font-semibold ${dm ? 'text-white' : 'text-gray-900'}`}>Recent Projects</h3>
          <button onClick={() => onNavigate('projects')} className={`text-xs font-medium ${dm ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}>
            View all
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`text-left text-xs ${dm ? 'text-gray-500' : 'text-gray-400'} border-b ${dm ? 'border-gray-700/50' : 'border-gray-100'}`}>
                <th className="pb-2 px-5 font-medium">Project</th>
                <th className="pb-2 px-3 font-medium">Type</th>
                <th className="pb-2 px-3 font-medium">Status</th>
                <th className="pb-2 px-3 font-medium">Images</th>
                <th className="pb-2 px-3 font-medium">Annotations</th>
                <th className="pb-2 px-3 font-medium">Priority</th>
              </tr>
            </thead>
            <tbody>
              {projects.slice(0, 5).map((p) => (
                <tr
                  key={p.id}
                  className={`border-b last:border-0 cursor-pointer transition-colors ${
                    dm ? 'border-gray-700/30 hover:bg-gray-700/20' : 'border-gray-50 hover:bg-gray-50'
                  }`}
                  onClick={() => onNavigate(p.projectType === '3d' ? 'annotation-3d' : 'annotation-2d')}
                >
                  <td className="py-3 px-5">
                    <span className={`font-medium text-sm ${dm ? 'text-white' : 'text-gray-900'}`}>{p.name}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                      p.projectType === '3d' ? dm ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
                        : p.projectType === '2d+3d' ? dm ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-700'
                        : dm ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {p.projectType === '3d' ? <Box size={11} /> : p.projectType === '2d+3d' ? <Layers size={11} /> : <Eye size={11} />}
                      {p.projectType.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      p.status === 'active' ? dm ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
                        : p.status === 'review' ? dm ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-700'
                        : p.status === 'completed' ? dm ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-700'
                        : dm ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className={`py-3 px-3 text-sm ${dm ? 'text-gray-300' : 'text-gray-600'}`}>{p.imageCount.toLocaleString()}</td>
                  <td className={`py-3 px-3 text-sm ${dm ? 'text-gray-300' : 'text-gray-600'}`}>{p.annotationCount.toLocaleString()}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      p.priority === 'critical' ? dm ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-700'
                        : p.priority === 'high' ? dm ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-700'
                        : dm ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {p.priority}
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
