import React, { useState } from 'react';
import {
  Plus, Search, Filter, Box, Eye, Layers, Clock, CheckCircle2,
  Pause, MoreVertical, Calendar, Users, Image as ImageIcon, Target,
  X, LayoutGrid, List, ChevronRight, AlertCircle
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import type { ViewId } from '../App';

interface Props { onNavigate: (v: ViewId) => void; }

const STATUS_FILTERS = ['all', 'active', 'review', 'completed', 'paused'] as const;
const TYPE_FILTERS = ['all', '2d', '3d', '2d+3d'] as const;

export default function ProjectsView({ onNavigate }: Props) {
  const dm = useAppStore((s) => s.darkMode);
  const projects = useAppStore((s) => s.projects);
  const addProject = useAppStore((s) => s.addProject);
  const [search, setSearch] = useState('');
  const [statusF, setStatusF] = useState<string>('all');
  const [typeF, setTypeF] = useState<string>('all');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', type: '2d' as '2d' | '3d' | '2d+3d', priority: 'medium' as 'low' | 'medium' | 'high' | 'critical', dueDate: '' });

  const filtered = projects.filter((p) =>
    (statusF === 'all' || p.status === statusF) &&
    (typeF === 'all' || p.type === typeF) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const card = `rounded-xl border transition-all duration-300 ${dm ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:shadow-md'}`;
  const inputCls = `w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${dm ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'}`;

  const typeIcon = (type: string) => {
    if (type === '3d') return <Box size={14} />;
    if (type === '2d+3d') return <Layers size={14} />;
    return <Eye size={14} />;
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'active': return dm ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700';
      case 'review': return dm ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-700';
      case 'completed': return dm ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-700';
      default: return dm ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500';
    }
  };

  const priorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return dm ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-700';
      case 'high': return dm ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-700';
      default: return dm ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500';
    }
  };

  const handleCreate = () => {
    if (!form.name.trim()) return;
    addProject(form);
    setShowCreate(false);
    setForm({ name: '', description: '', type: '2d', priority: 'medium', dueDate: '' });
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className={`text-2xl font-bold ${dm ? 'text-white' : 'text-slate-900'}`}>Projects</h1>
          <p className={`text-sm mt-0.5 ${dm ? 'text-slate-400' : 'text-slate-500'}`}>{projects.length} projects · {projects.filter(p => p.status === 'active').length} active</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm">
          <Plus size={16} /> New Project
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${dm ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-200'}`}>
          <Search size={14} className={dm ? 'text-slate-500' : 'text-slate-400'} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search projects..." className={`bg-transparent border-none outline-none text-sm w-48 ${dm ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'}`} />
        </div>
        <div className="flex items-center gap-1">
          <Filter size={13} className={dm ? 'text-slate-500' : 'text-slate-400'} />
          {STATUS_FILTERS.map((f) => (
            <button key={f} onClick={() => setStatusF(f)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors capitalize ${statusF === f ? 'bg-blue-600 text-white' : (dm ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}`}>
              {f}
            </button>
          ))}
        </div>
        <div className={`h-5 w-px ${dm ? 'bg-slate-800' : 'bg-slate-200'}`} />
        <div className="flex items-center gap-1">
          {TYPE_FILTERS.map((f) => (
            <button key={f} onClick={() => setTypeF(f)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors uppercase ${typeF === f ? 'bg-blue-600 text-white' : (dm ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}`}>
              {f}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1">
          <button onClick={() => setView('grid')} className={`p-1.5 rounded-md ${view === 'grid' ? (dm ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-900') : (dm ? 'text-slate-500 hover:bg-slate-800' : 'text-slate-400 hover:bg-slate-100')}`}><LayoutGrid size={15} /></button>
          <button onClick={() => setView('list')} className={`p-1.5 rounded-md ${view === 'list' ? (dm ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-900') : (dm ? 'text-slate-500 hover:bg-slate-800' : 'text-slate-400 hover:bg-slate-100')}`}><List size={15} /></button>
        </div>
      </div>

      {/* Grid */}
      {view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((p) => (
            <div key={p.id} className={`${card} p-4 cursor-pointer group`} onClick={() => onNavigate('studio')}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${p.type === '3d' ? (dm ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-600') : p.type === '2d+3d' ? (dm ? 'bg-blue-500/15 text-blue-400' : 'bg-blue-50 text-blue-600') : (dm ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500')}`}>
                    {typeIcon(p.type)}
                  </div>
                  <div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColor(p.status)} uppercase`}>{p.status}</span>
                  </div>
                </div>
                <button className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${dm ? 'text-slate-500' : 'text-slate-400'}`}><MoreVertical size={14} /></button>
              </div>
              <h3 className={`font-semibold text-sm mb-1 ${dm ? 'text-white' : 'text-slate-900'}`}>{p.name}</h3>
              <p className={`text-xs mb-3 line-clamp-2 ${dm ? 'text-slate-400' : 'text-slate-500'}`}>{p.description}</p>
              <div className="mb-3">
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className={dm ? 'text-slate-500' : 'text-slate-400'}>Progress</span>
                  <span className={`font-medium ${dm ? 'text-slate-300' : 'text-slate-700'}`}>{p.progress}%</span>
                </div>
                <div className={`h-1.5 rounded-full ${dm ? 'bg-slate-800' : 'bg-slate-100'}`}>
                  <div className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" style={{ width: `${p.progress}%` }} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex -space-x-1.5">
                  {p.assignees.slice(0, 3).map((init, i) => (
                    <div key={i} className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-[9px] font-semibold border-2 border-white dark:border-slate-900">{init}</div>
                  ))}
                </div>
                <div className="flex items-center gap-3 text-[10px]">
                  <span className={`flex items-center gap-0.5 ${dm ? 'text-slate-400' : 'text-slate-500'}`}><ImageIcon size={11} /> {p.imageCount.toLocaleString()}</span>
                  <span className={`flex items-center gap-0.5 ${dm ? 'text-slate-400' : 'text-slate-500'}`}><Target size={11} /> {p.annotationCount.toLocaleString()}</span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${priorityColor(p.priority)}`}>{p.priority}</span>
                <span className={`text-[10px] ${dm ? 'text-slate-500' : 'text-slate-400'}`}>Due {p.dueDate}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`${card} overflow-hidden`}>
          <table className="w-full text-sm">
            <thead>
              <tr className={`text-left text-xs ${dm ? 'text-slate-500' : 'text-slate-400'} border-b ${dm ? 'border-slate-800' : 'border-slate-100'}`}>
                <th className="px-4 py-2 font-medium">Project</th>
                <th className="px-3 py-2 font-medium">Type</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Progress</th>
                <th className="px-3 py-2 font-medium">Images</th>
                <th className="px-3 py-2 font-medium">Annotations</th>
                <th className="px-3 py-2 font-medium">Team</th>
                <th className="px-3 py-2 font-medium">Due</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} onClick={() => onNavigate('studio')} className={`border-b last:border-0 cursor-pointer transition-colors ${dm ? 'border-slate-800/50 hover:bg-slate-800/50' : 'border-slate-50 hover:bg-slate-50'}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${p.type === '3d' ? (dm ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-600') : p.type === '2d+3d' ? (dm ? 'bg-blue-500/15 text-blue-400' : 'bg-blue-50 text-blue-600') : (dm ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500')}`}>
                        {typeIcon(p.type)}
                      </div>
                      <div>
                        <p className={`font-medium ${dm ? 'text-white' : 'text-slate-900'}`}>{p.name}</p>
                        <p className={`text-xs ${dm ? 'text-slate-500' : 'text-slate-400'}`}>{p.description.slice(0, 40)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3"><span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase ${dm ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>{p.type}</span></td>
                  <td className="px-3 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColor(p.status)}`}>{p.status}</span></td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`h-1.5 w-16 rounded-full ${dm ? 'bg-slate-800' : 'bg-slate-100'}`}><div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${p.progress}%` }} /></div>
                      <span className={`text-xs ${dm ? 'text-slate-300' : 'text-slate-600'}`}>{p.progress}%</span>
                    </div>
                  </td>
                  <td className={`px-3 py-3 text-xs ${dm ? 'text-slate-300' : 'text-slate-600'}`}>{p.imageCount.toLocaleString()}</td>
                  <td className={`px-3 py-3 text-xs ${dm ? 'text-slate-300' : 'text-slate-600'}`}>{p.annotationCount.toLocaleString()}</td>
                  <td className="px-3 py-3">
                    <div className="flex -space-x-1.5">
                      {p.assignees.slice(0, 3).map((init, i) => (
                        <div key={i} className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-[9px] font-semibold border-2 border-white dark:border-slate-900">{init}</div>
                      ))}
                    </div>
                  </td>
                  <td className={`px-3 py-3 text-xs ${dm ? 'text-slate-400' : 'text-slate-500'}`}>{p.dueDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length === 0 && (
        <div className={`text-center py-16 ${dm ? 'text-slate-600' : 'text-slate-400'}`}>
          <AlertCircle size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">No projects found</p>
          <p className="text-xs mt-0.5">Try adjusting your filters</p>
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowCreate(false)} />
          <div className={`relative w-full max-w-lg mx-4 rounded-xl shadow-2xl ${dm ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
            <div className={`flex items-center justify-between p-4 border-b ${dm ? 'border-slate-800' : 'border-slate-100'}`}>
              <h2 className={`text-base font-semibold ${dm ? 'text-white' : 'text-slate-900'}`}>Create New Project</h2>
              <button onClick={() => setShowCreate(false)} className={`p-1.5 rounded-md ${dm ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}><X size={16} /></button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className={`text-xs font-medium ${dm ? 'text-slate-300' : 'text-slate-700'}`}>Project Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={`${inputCls} mt-1`} placeholder="e.g., Urban Driving Dataset Q4" autoFocus />
              </div>
              <div>
                <label className={`text-xs font-medium ${dm ? 'text-slate-300' : 'text-slate-700'}`}>Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${inputCls} mt-1 h-20 resize-none`} placeholder="Project scope and goals..." />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={`text-xs font-medium ${dm ? 'text-slate-300' : 'text-slate-700'}`}>Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })} className={`${inputCls} mt-1`}>
                    <option value="2d">2D Image</option>
                    <option value="3d">3D Point Cloud</option>
                    <option value="2d+3d">2D + 3D Fusion</option>
                  </select>
                </div>
                <div>
                  <label className={`text-xs font-medium ${dm ? 'text-slate-300' : 'text-slate-700'}`}>Priority</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as any })} className={`${inputCls} mt-1`}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className={`text-xs font-medium ${dm ? 'text-slate-300' : 'text-slate-700'}`}>Due Date</label>
                  <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className={`${inputCls} mt-1`} />
                </div>
              </div>
              <div className={`border-2 border-dashed rounded-lg p-6 text-center ${dm ? 'border-slate-700' : 'border-slate-200'}`}>
                <ImageIcon size={24} className={`mx-auto mb-2 ${dm ? 'text-slate-600' : 'text-slate-300'}`} />
                <p className={`text-sm ${dm ? 'text-slate-300' : 'text-slate-700'}`}>Upload Dataset</p>
                <p className={`text-xs mt-0.5 ${dm ? 'text-slate-500' : 'text-slate-400'}`}>Drag & drop images, point clouds, or video</p>
                <label className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-blue-600 text-white rounded-md cursor-pointer hover:bg-blue-700 text-xs font-medium">
                  <Plus size={13} /> Browse Files
                  <input type="file" className="hidden" multiple />
                </label>
              </div>
            </div>
            <div className={`flex items-center justify-end gap-2 p-4 border-t ${dm ? 'border-slate-800' : 'border-slate-100'}`}>
              <button onClick={() => setShowCreate(false)} className={`px-4 py-2 rounded-lg text-sm font-medium ${dm ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'}`}>Cancel</button>
              <button onClick={handleCreate} disabled={!form.name.trim()} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">Create Project</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
