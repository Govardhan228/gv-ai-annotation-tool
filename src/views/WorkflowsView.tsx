import React, { useState } from 'react';
import { GitBranch, Plus, CheckCircle2, Clock, Circle, ChevronRight, Settings, User, Users, ArrowRight, GitCommitVertical as GitCommit } from 'lucide-react';
import { useAppStore } from '../store/appStore';

const STAGES_INFO: Record<string, { icon: React.FC<any>; desc: string }> = {
  'Project Creation': { icon: GitCommit, desc: 'Initial project setup and configuration' },
  'Annotation': { icon: User, desc: 'Primary labeling work' },
  'QA Review': { icon: CheckCircle2, desc: 'First-pass quality review' },
  'Rework': { icon: ChevronRight, desc: 'Fixes based on QA feedback' },
  'Final QA': { icon: CheckCircle2, desc: 'Senior reviewer final approval' },
  'Client Review': { icon: Users, desc: 'Client validation and feedback' },
  'Submission': { icon: CheckCircle2, desc: 'Final delivery' },
};

export default function WorkflowsView() {
  const dm = useAppStore((s) => s.darkMode);
  const workflowStages = useAppStore((s) => s.workflowStages);
  const [selectedStage, setSelectedStage] = useState(workflowStages[0].id);

  const card = `rounded-xl border ${dm ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`;

  const stageIcon = (status: string) => {
    if (status === 'done') return <CheckCircle2 size={14} className="text-emerald-500" />;
    if (status === 'in_progress') return <Clock size={14} className="text-amber-500" />;
    return <Circle size={14} className={dm ? 'text-slate-600' : 'text-slate-300'} />;
  };

  const stageColor = (status: string) => {
    if (status === 'done') return dm ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200';
    if (status === 'in_progress') return dm ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-200';
    return dm ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200';
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className={`text-2xl font-bold ${dm ? 'text-white' : 'text-slate-900'}`}>Workflows</h1>
          <p className={`text-sm mt-0.5 ${dm ? 'text-slate-400' : 'text-slate-500'}`}>Configurable project lifecycle stages</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium shadow-sm">
          <Plus size={16} /> Add Stage
        </button>
      </div>

      {/* Workflow pipeline */}
      <div className={`${card} p-6 mb-4`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-sm font-semibold ${dm ? 'text-white' : 'text-slate-900'}`}>Pipeline: Standard Annotation Workflow</h3>
          <button className={`flex items-center gap-1 text-xs ${dm ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'}`}><Settings size={13} /> Configure</button>
        </div>
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {workflowStages.map((stage, i) => (
            <React.Fragment key={stage.id}>
              <button
                onClick={() => setSelectedStage(stage.id)}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 min-w-[140px] transition-all ${stageColor(stage.status)} ${selectedStage === stage.id ? 'ring-2 ring-blue-400' : ''}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stage.status === 'done' ? 'bg-emerald-500' : stage.status === 'in_progress' ? 'bg-amber-500' : dm ? 'bg-slate-700' : 'bg-slate-300'}`}>
                  {stageIcon(stage.status)}
                </div>
                <div className="text-center">
                  <p className={`text-xs font-medium ${dm ? 'text-white' : 'text-slate-900'}`}>{stage.name}</p>
                  <p className={`text-[10px] ${dm ? 'text-slate-500' : 'text-slate-400'}`}>{stage.assigneeRole}</p>
                </div>
                {stage.status === 'in_progress' && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-amber-500/20 text-amber-600">{stage.itemCount} active</span>
                )}
                {stage.status === 'done' && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-emerald-500/20 text-emerald-600">{stage.itemCount} done</span>
                )}
              </button>
              {i < workflowStages.length - 1 && (
                <ArrowRight size={16} className={dm ? 'text-slate-600' : 'text-slate-300'} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Stage detail */}
        {(() => {
          const stage = workflowStages.find((s) => s.id === selectedStage);
          if (!stage) return null;
          const info = STAGES_INFO[stage.name] || { icon: Circle, desc: 'Workflow stage' };
          return (
            <div className={`${card} p-4`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${dm ? 'bg-slate-800' : 'bg-slate-100'}`}>
                  <info.icon size={18} className={dm ? 'text-slate-300' : 'text-slate-600'} />
                </div>
                <div>
                  <h3 className={`text-sm font-semibold ${dm ? 'text-white' : 'text-slate-900'}`}>{stage.name}</h3>
                  <p className={`text-xs ${dm ? 'text-slate-400' : 'text-slate-500'}`}>{info.desc}</p>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className={`flex items-center justify-between p-2.5 rounded-lg ${dm ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                  <span className={`text-xs ${dm ? 'text-slate-400' : 'text-slate-500'}`}>Assignee Role</span>
                  <span className={`text-xs font-medium ${dm ? 'text-white' : 'text-slate-900'}`}>{stage.assigneeRole}</span>
                </div>
                <div className={`flex items-center justify-between p-2.5 rounded-lg ${dm ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                  <span className={`text-xs ${dm ? 'text-slate-400' : 'text-slate-500'}`}>Current Status</span>
                  <span className={`text-xs font-medium capitalize ${stage.status === 'done' ? 'text-emerald-500' : stage.status === 'in_progress' ? 'text-amber-500' : dm ? 'text-slate-400' : 'text-slate-500'}`}>{stage.status.replace('_', ' ')}</span>
                </div>
                <div className={`flex items-center justify-between p-2.5 rounded-lg ${dm ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                  <span className={`text-xs ${dm ? 'text-slate-400' : 'text-slate-500'}`}>Items in Stage</span>
                  <span className={`text-xs font-medium ${dm ? 'text-white' : 'text-slate-900'}`}>{stage.itemCount}</span>
                </div>
                <div className={`flex items-center justify-between p-2.5 rounded-lg ${dm ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                  <span className={`text-xs ${dm ? 'text-slate-400' : 'text-slate-500'}`}>Auto-Assignment</span>
                  <label className="inline-flex items-center cursor-pointer">
                    <span className="w-9 h-5 rounded-full bg-blue-600 relative">
                      <span className="absolute right-0.5 top-0.5 w-4 h-4 rounded-full bg-white" />
                    </span>
                  </label>
                </div>
              </div>

              <h4 className={`text-xs font-medium mb-2 ${dm ? 'text-slate-400' : 'text-slate-500'}`}>ASSIGNED USERS</h4>
              <div className="space-y-2">
                {[
                  { name: 'Alice Chen', role: 'Lead', count: 142, initials: 'AC' },
                  { name: 'Carol Davis', role: 'Annotator', count: 98, initials: 'CD' },
                ].map((u) => (
                  <div key={u.name} className={`flex items-center gap-2.5 p-2 rounded-lg ${dm ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-[10px] font-semibold">{u.initials}</div>
                    <div className="flex-1">
                      <p className={`text-xs font-medium ${dm ? 'text-white' : 'text-slate-900'}`}>{u.name}</p>
                      <p className={`text-[10px] ${dm ? 'text-slate-500' : 'text-slate-400'}`}>{u.role}</p>
                    </div>
                    <span className={`text-xs ${dm ? 'text-slate-400' : 'text-slate-500'}`}>{u.count} items</span>
                  </div>
                ))}
                <button className={`flex items-center gap-1 w-full px-2 py-2 text-xs ${dm ? 'text-blue-400 hover:bg-slate-800' : 'text-blue-600 hover:bg-blue-50'} rounded`}>
                  <Plus size={14} /> Assign user
                </button>
              </div>
            </div>
          );
        })()}

        {/* Recent transitions */}
        <div className={`${card} p-4`}>
          <h3 className={`text-sm font-semibold mb-3 ${dm ? 'text-white' : 'text-slate-900'}`}>Recent Transitions</h3>
          <div className="space-y-2">
            {[
              { project: 'Urban Driving Q3', from: 'Annotation', to: 'QA Review', user: 'Alice Chen', time: '2m ago' },
              { project: 'Retail Analytics', from: 'QA Review', to: 'Final QA', user: 'Bob Smith', time: '15m ago' },
              { project: 'Medical Imaging', from: 'Rework', to: 'QA Review', user: 'Carol Davis', time: '38m ago' },
              { project: 'Warehouse Robotics', from: 'Rework', to: 'QA Review', user: 'Dan Wilson', time: '1h ago' },
              { project: 'Urban Driving Q3', from: 'Annotation', to: 'QA Review', user: 'Eve Park', time: '2h ago' },
              { project: 'Retail Analytics', from: 'QA Review', to: 'Rework', user: 'Bob Smith', time: '3h ago' },
            ].map((t, i) => (
              <div key={i} className={`flex items-center gap-2 p-2.5 rounded-lg ${dm ? 'bg-slate-800/50 hover:bg-slate-800' : 'bg-slate-50 hover:bg-slate-100'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center ${dm ? 'bg-slate-800' : 'bg-white'}`}>
                  <GitBranch size={13} className={dm ? 'text-slate-400' : 'text-slate-500'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs ${dm ? 'text-white' : 'text-slate-900'}`}>{t.project}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className={`text-[10px] px-1 py-0.5 rounded ${dm ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500'}`}>{t.from}</span>
                    <ArrowRight size={10} className={dm ? 'text-slate-600' : 'text-slate-400'} />
                    <span className={`text-[10px] px-1 py-0.5 rounded ${dm ? 'bg-blue-500/15 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>{t.to}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-[10px] ${dm ? 'text-slate-500' : 'text-slate-400'}`}>{t.user}</p>
                  <p className={`text-[10px] ${dm ? 'text-slate-600' : 'text-slate-400'}`}>{t.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
