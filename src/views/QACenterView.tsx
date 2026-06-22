import React, { useState } from 'react';
import {
  ShieldCheck, AlertTriangle, CheckCircle2, XCircle, Clock,
  Filter, Play, RefreshCw, ChevronRight, Eye, AlertCircle,
  Layers, GitCompare, Box, TrendingDown, Copy, Activity
} from 'lucide-react';
import { useAppStore } from '../store/appStore';

const CHECK_ICONS: Record<string, React.FC<any>> = {
  'Missing Annotations': Eye,
  'Duplicate Track IDs': Copy,
  'Track Consistency': Activity,
  'Behavior Consistency': AlertCircle,
  'Box Displacement': Box,
  'Attribute Validation': CheckCircle2,
  'Cross-Camera Validation': GitCompare,
  'Label Confidence': TrendingDown,
};

export default function QACenter() {
  const dm = useAppStore((s) => s.darkMode);
  const checks = useAppStore((s) => s.qualityChecks);
  const toggleCheck = useAppStore((s) => s.toggleCheck);

  const [selectedProject, setSelectedProject] = useState('all');
  const [running, setRunning] = useState(false);

  const card = `rounded-xl border ${dm ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`;

  const failed = checks.filter((c) => c.status === 'fail');
  const passed = checks.filter((c) => c.status === 'pass');
  const pending = checks.filter((c) => c.status === 'pending');
  const totalIssues = failed.reduce((s, c) => s + c.count, 0);

  const sevColor = (sev: string) => {
    if (sev === 'critical') return dm ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-700';
    if (sev === 'warning') return dm ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-700';
    return dm ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-700';
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle2 size={16} className="text-emerald-500" />;
      case 'fail': return <XCircle size={16} className="text-rose-500" />;
      default: return <Clock size={16} className="text-amber-500" />;
    }
  };

  const runChecks = () => {
    setRunning(true);
    setTimeout(() => setRunning(false), 2000);
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className={`text-2xl font-bold ${dm ? 'text-white' : 'text-slate-900'}`}>QA Center</h1>
          <p className={`text-sm mt-0.5 ${dm ? 'text-slate-400' : 'text-slate-500'}`}>Automated validation and quality assurance checks</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}
            className={`px-3 py-2 rounded-lg border text-sm ${dm ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <option value="all">All Projects</option>
            <option value="p1">Urban Driving Dataset</option>
            <option value="p2">Retail Store Analytics</option>
            <option value="p3">Warehouse Robotics QC</option>
            <option value="p4">Medical Imaging</option>
          </select>
          <button onClick={runChecks} disabled={running}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium shadow-sm">
            {running ? <RefreshCw size={15} className="animate-spin" /> : <Play size={15} />}
            {running ? 'Running...' : 'Run Checks'}
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className={`${card} p-4`}>
          <div className="flex items-center justify-between mb-1">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${dm ? 'bg-rose-500/15 text-rose-400' : 'bg-rose-50 text-rose-600'}`}><AlertTriangle size={18} /></div>
          </div>
          <p className={`text-2xl font-bold ${dm ? 'text-white' : 'text-slate-900'}`}>{totalIssues}</p>
          <p className={`text-xs ${dm ? 'text-slate-400' : 'text-slate-500'}`}>Total Issues</p>
        </div>
        <div className={`${card} p-4`}>
          <div className="flex items-center justify-between mb-1">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${dm ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-50 text-amber-600'}`}><AlertCircle size={18} /></div>
          </div>
          <p className={`text-2xl font-bold ${dm ? 'text-white' : 'text-slate-900'}`}>{failed.length}</p>
          <p className={`text-xs ${dm ? 'text-slate-400' : 'text-slate-500'}`}>Failed Checks</p>
        </div>
        <div className={`${card} p-4`}>
          <div className="flex items-center justify-between mb-1">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${dm ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}><CheckCircle2 size={18} /></div>
          </div>
          <p className={`text-2xl font-bold ${dm ? 'text-white' : 'text-slate-900'}`}>{passed.length}</p>
          <p className={`text-xs ${dm ? 'text-slate-400' : 'text-slate-500'}`}>Passed</p>
        </div>
        <div className={`${card} p-4`}>
          <div className="flex items-center justify-between mb-1">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${dm ? 'bg-blue-500/15 text-blue-400' : 'bg-blue-50 text-blue-600'}`}><ShieldCheck size={18} /></div>
          </div>
          <p className={`text-2xl font-bold ${dm ? 'text-white' : 'text-slate-900'}`}>{Math.round((passed.length / checks.length) * 100)}%</p>
          <p className={`text-xs ${dm ? 'text-slate-400' : 'text-slate-500'}`}>Quality Score</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Checks list */}
        <div className={`${card} lg:col-span-2 p-4`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-sm font-semibold ${dm ? 'text-white' : 'text-slate-900'}`}>Validation Checks</h3>
            <button className={`flex items-center gap-1 text-xs ${dm ? 'text-slate-400' : 'text-slate-500'}`}><Filter size={12} /> Filter</button>
          </div>
          <div className="space-y-2">
            {checks.map((check) => {
              const Icon = CHECK_ICONS[check.name] || AlertCircle;
              return (
                <div key={check.id} className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${dm ? 'bg-slate-800/50 hover:bg-slate-800' : 'bg-slate-50 hover:bg-slate-100'}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${dm ? 'bg-slate-800' : 'bg-white'}`}>
                    <Icon size={14} className={dm ? 'text-slate-400' : 'text-slate-500'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${dm ? 'text-white' : 'text-slate-900'}`}>{check.name}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase ${sevColor(check.severity)}`}>{check.severity}</span>
                    </div>
                    <p className={`text-xs ${dm ? 'text-slate-400' : 'text-slate-500'}`}>{check.description}</p>
                  </div>
                  {check.count > 0 && (
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${check.status === 'fail' ? (dm ? 'bg-rose-500/15 text-rose-400' : 'bg-rose-50 text-rose-600') : 'bg-slate-200 text-slate-600'}`}>{check.count}</span>
                  )}
                  {statusIcon(check.status)}
                  <button onClick={() => toggleCheck(check.id)} className={`p-1.5 rounded ${dm ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-200 text-slate-500'}`}>
                    <ChevronRight size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Issue details */}
        <div className={`${card} p-4`}>
          <h3 className={`text-sm font-semibold mb-3 ${dm ? 'text-white' : 'text-slate-900'}`}>Issue Details</h3>
          <div className={`rounded-lg p-3 mb-3 ${dm ? 'bg-rose-500/10 border border-rose-500/20' : 'bg-rose-50 border border-rose-100'}`}>
            <div className="flex items-center gap-2 mb-1">
              <Copy size={14} className="text-rose-500" />
              <span className={`text-sm font-medium ${dm ? 'text-rose-400' : 'text-rose-700'}`}>Duplicate Track IDs</span>
            </div>
            <p className={`text-xs ${dm ? 'text-slate-400' : 'text-slate-600'}`}>8 instances detected across 3 projects</p>
          </div>
          <div className="space-y-2">
            {[
              { track: 'TRK-0142', project: 'Urban Driving', frame: 427, count: 2 },
              { track: 'TRK-0156', project: 'Urban Driving', frame: 812, count: 2 },
              { track: 'TRK-0203', project: 'Warehouse QC', frame: 145, count: 3 },
              { track: 'TRK-0287', project: 'Urban Driving', frame: 1203, count: 2 },
            ].map((issue) => (
              <div key={`${issue.track}-${issue.frame}`} className={`flex items-center gap-2 p-2.5 rounded-lg ${dm ? 'bg-slate-800/50 hover:bg-slate-800' : 'bg-slate-50 hover:bg-slate-100'} cursor-pointer`}>
                <div className="flex-1">
                  <p className={`text-xs font-medium ${dm ? 'text-white' : 'text-slate-900'}`}>{issue.track}</p>
                  <p className={`text-[10px] ${dm ? 'text-slate-500' : 'text-slate-400'}`}>{issue.project} · Frame {issue.frame}</p>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-500/15 text-rose-400">{issue.count}x</span>
              </div>
            ))}
          </div>
          <button className={`mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium ${dm ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
            <Eye size={14} /> View All Issues
          </button>
        </div>
      </div>
    </div>
  );
}
