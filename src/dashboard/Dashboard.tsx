import React from 'react';
import {
  FolderOpen, Zap, BarChart3, CheckCircle2, Clock, AlertTriangle,
  Users, TrendingUp, Target, Activity, ArrowUpRight, ArrowDownRight,
  Layers, Box, Eye, FileImage, Tag, Cpu
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

  const card = `rounded-xl p-6 transition-all duration-200 hover:shadow-lg ${
    dark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200 shadow-sm'
  }`;

  const statCards = [
    { label: 'Total Projects', value: projects.length, icon: FolderOpen, color: 'blue', delta: '+2' },
    { label: 'Active Tasks', value: 14, icon: Zap, color: 'amber', delta: '+5' },
    { label: 'Completed', value: completedProjects, icon: CheckCircle2, color: 'emerald', delta: '+1' },
    { label: 'QA Pending', value: reviewProjects, icon: Clock, color: 'rose', delta: '-2' },
  ];

  const colorMap: Record<string, { bg: string; text: string; icon: string }> = {
    blue: { bg: dark ? 'bg-blue-900/30' : 'bg-blue-50', text: dark ? 'text-blue-400' : 'text-blue-600', icon: dark ? 'bg-blue-800/50 text-blue-300' : 'bg-blue-100 text-blue-600' },
    amber: { bg: dark ? 'bg-amber-900/30' : 'bg-amber-50', text: dark ? 'text-amber-400' : 'text-amber-600', icon: dark ? 'bg-amber-800/50 text-amber-300' : 'bg-amber-100 text-amber-600' },
    emerald: { bg: dark ? 'bg-emerald-900/30' : 'bg-emerald-50', text: dark ? 'text-emerald-400' : 'text-emerald-600', icon: dark ? 'bg-emerald-800/50 text-emerald-300' : 'bg-emerald-100 text-emerald-600' },
    rose: { bg: dark ? 'bg-rose-900/30' : 'bg-rose-50', text: dark ? 'text-rose-400' : 'text-rose-600', icon: dark ? 'bg-rose-800/50 text-rose-300' : 'bg-rose-100 text-rose-600' },
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className={`text-3xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Dashboard</h1>
          <p className={`mt-1 ${dark ? 'text-gray-400' : 'text-gray-600'}`}>Overview of your annotation platform</p>
        </div>
        <button
          onClick={() => onNavigate('projects')}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <FolderOpen size={18} />
          View All Projects
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {statCards.map((s) => {
          const c = colorMap[s.color];
          return (
            <div key={s.label} className={card}>
              <div className="flex items-center justify-between mb-4">
                <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${c.icon}`}>
                  <s.icon size={22} />
                </div>
                <span className={`text-xs font-medium flex items-center gap-1 ${
                  s.delta.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'
                }`}>
                  {s.delta.startsWith('+') ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {s.delta} this week
                </span>
              </div>
              <p className={`text-3xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{s.value}</p>
              <p className={`text-sm mt-1 ${dark ? 'text-gray-400' : 'text-gray-600'}`}>{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {[
          { label: 'Total Images', value: totalImages.toLocaleString(), icon: FileImage, color: 'blue' },
          { label: 'Total Annotations', value: totalAnnotations.toLocaleString(), icon: Layers, color: 'emerald' },
          { label: 'Avg Per Image', value: avgPerImage, icon: Target, color: 'amber' },
          { label: 'AI Assisted', value: '23%', icon: Cpu, color: 'rose' },
        ].map((s) => {
          const c = colorMap[s.color];
          return (
            <div key={s.label} className={`${card} flex items-center gap-4`}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${c.icon}`}>
                <s.icon size={20} />
              </div>
              <div>
                <p className={`text-xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{s.value}</p>
                <p className={`text-xs ${dark ? 'text-gray-400' : 'text-gray-600'}`}>{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
        {/* Daily Annotations Chart */}
        <div className={`${card} lg:col-span-2`}>
          <h3 className={`text-lg font-semibold mb-4 ${dark ? 'text-white' : 'text-gray-900'}`}>
            Daily Annotation Count
          </h3>
          <div className="flex items-end gap-2 h-40">
            {[35, 52, 41, 68, 55, 72, 48, 63, 80, 55, 42, 70, 65, 58].map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-400"
                  style={{ height: `${(v / 80) * 100}%` }}
                />
                <span className={`text-[10px] ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {i + 1}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 2D vs 3D Progress */}
        <div className={card}>
          <h3 className={`text-lg font-semibold mb-4 ${dark ? 'text-white' : 'text-gray-900'}`}>
            Dataset Progress
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className={`flex items-center gap-1.5 ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <Eye size={14} className="text-blue-500" /> 2D Datasets
                </span>
                <span className={`font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>78%</span>
              </div>
              <div className={`h-2 rounded-full ${dark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div className="h-2 rounded-full bg-blue-500" style={{ width: '78%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className={`flex items-center gap-1.5 ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <Box size={14} className="text-emerald-500" /> 3D Datasets
                </span>
                <span className={`font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>42%</span>
              </div>
              <div className={`h-2 rounded-full ${dark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div className="h-2 rounded-full bg-emerald-500" style={{ width: '42%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className={`flex items-center gap-1.5 ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <Tag size={14} className="text-amber-500" /> QA Review
                </span>
                <span className={`font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>61%</span>
              </div>
              <div className={`h-2 rounded-full ${dark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div className="h-2 rounded-full bg-amber-500" style={{ width: '61%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      <div className={card}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>Recent Projects</h3>
          <button onClick={() => onNavigate('projects')} className={`text-sm ${dark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}>
            View all
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`text-left text-sm ${dark ? 'text-gray-400' : 'text-gray-600'} border-b ${dark ? 'border-gray-700' : 'border-gray-200'}`}>
                <th className="pb-3 font-medium">Project</th>
                <th className="pb-3 font-medium">Type</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Images</th>
                <th className="pb-3 font-medium">Annotations</th>
                <th className="pb-3 font-medium">Priority</th>
              </tr>
            </thead>
            <tbody>
              {projects.slice(0, 5).map((p) => (
                <tr key={p.id} className={`border-b last:border-0 ${dark ? 'border-gray-700/50' : 'border-gray-100'}`}>
                  <td className={`py-3 font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>{p.name}</td>
                  <td>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                      p.projectType === '3d'
                        ? dark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                        : p.projectType === '2d+3d'
                        ? dark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700'
                        : dark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {p.projectType === '3d' ? <Box size={12} /> : p.projectType === '2d+3d' ? <Layers size={12} /> : <Eye size={12} />}
                      {p.projectType.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      p.status === 'active' ? dark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                        : p.status === 'review' ? dark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-700'
                        : dark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className={dark ? 'text-gray-300' : 'text-gray-700'}>{p.imageCount.toLocaleString()}</td>
                  <td className={dark ? 'text-gray-300' : 'text-gray-700'}>{p.annotationCount.toLocaleString()}</td>
                  <td>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      p.priority === 'critical' ? dark ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'
                        : p.priority === 'high' ? dark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-700'
                        : dark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
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
