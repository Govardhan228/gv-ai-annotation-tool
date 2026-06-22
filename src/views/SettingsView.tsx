import React, { useState } from 'react';
import { Settings, Globe, Palette, Keyboard, Database, Bell, Shield, Cpu, Save, Moon, Sun } from 'lucide-react';
import { useAppStore } from '../store/appStore';

type Tab = 'general' | 'appearance' | 'shortcuts' | 'ai' | 'notifications' | 'security';

export default function SettingsView() {
  const dm = useAppStore((s) => s.darkMode);
  const toggleDark = useAppStore((s) => s.toggleDark);
  const [tab, setTab] = useState<Tab>('general');

  const card = `rounded-xl border ${dm ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`;

  const TABS: { id: Tab; label: string; icon: React.FC<any> }[] = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
    { id: 'ai', label: 'AI Settings', icon: Cpu },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <div className="p-6 max-w-[900px] mx-auto">
      <h1 className={`text-2xl font-bold mb-5 ${dm ? 'text-white' : 'text-slate-900'}`}>Settings</h1>

      <div className="flex gap-4">
        {/* Tabs sidebar */}
        <div className="w-48 shrink-0 space-y-1">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? (dm ? 'bg-blue-600/15 text-blue-400' : 'bg-blue-50 text-blue-700') : (dm ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100')}`}>
              <t.icon size={15} /> {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1">
          {tab === 'general' && (
            <div className={`${card} p-4 space-y-4`}>
              <h3 className={`text-sm font-semibold ${dm ? 'text-white' : 'text-slate-900'}`}>General Settings</h3>
              <div className="space-y-3">
                {[
                  { label: 'Workspace Name', value: 'GV.AI Annotation Platform' },
                  { label: 'Default Language', value: 'English (US)' },
                  { label: 'Timezone', value: 'UTC−08:00 Pacific' },
                ].map((f) => (
                  <div key={f.label}>
                    <label className={`text-xs font-medium ${dm ? 'text-slate-400' : 'text-slate-500'}`}>{f.label}</label>
                    <input defaultValue={f.value} className={`w-full mt-1 px-3 py-2 rounded-lg border text-sm ${dm ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`} />
                  </div>
                ))}
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <div>
                    <p className={`text-sm font-medium ${dm ? 'text-white' : 'text-slate-900'}`}>Auto-save annotations</p>
                    <p className={`text-xs ${dm ? 'text-slate-400' : 'text-slate-500'}`}>Save every 30 seconds</p>
                  </div>
                  <label className="inline-flex items-center cursor-pointer"><span className="w-9 h-5 rounded-full bg-blue-600 relative"><span className="absolute right-0.5 top-0.5 w-4 h-4 rounded-full bg-white" /></span></label>
                </div>
              </div>
            </div>
          )}

          {tab === 'appearance' && (
            <div className={`${card} p-4 space-y-4`}>
              <h3 className={`text-sm font-semibold ${dm ? 'text-white' : 'text-slate-900'}`}>Appearance</h3>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => !dm && toggleDark()} className={`p-4 rounded-lg border-2 text-center ${dm ? 'border-blue-500 bg-blue-500/10' : 'border-slate-200'}`}>
                  <Moon size={24} className={`mx-auto mb-2 ${dm ? 'text-blue-400' : 'text-slate-400'}`} />
                  <p className={`text-sm font-medium ${dm ? 'text-white' : 'text-slate-900'}`}>Dark</p>
                </button>
                <button onClick={() => dm && toggleDark()} className={`p-4 rounded-lg border-2 text-center ${!dm ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700'}`}>
                  <Sun size={24} className={`mx-auto mb-2 ${!dm ? 'text-blue-400' : 'text-slate-400'}`} />
                  <p className={`text-sm font-medium ${dm ? 'text-white' : 'text-slate-900'}`}>Light</p>
                </button>
              </div>
              <div>
                <label className={`text-xs font-medium ${dm ? 'text-slate-400' : 'text-slate-500'}`}>Accent Color</label>
                <div className="flex gap-2 mt-2">
                  {['#3b82f6', '#22c55e', '#f97316', '#a855f7', '#06b6d4'].map((c) => (
                    <button key={c} className="w-8 h-8 rounded-full ring-2 ring-offset-2 ring-offset-transparent" style={{ backgroundColor: c, boxShadow: c === '#3b82f6' ? '0 0 0 2px white' : 'none' }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'shortcuts' && (
            <div className={`${card} p-4`}>
              <h3 className={`text-sm font-semibold mb-3 ${dm ? 'text-white' : 'text-slate-900'}`}>Keyboard Shortcuts</h3>
              <div className="space-y-1.5">
                {[
                  { keys: ['B'], action: 'Bounding Box tool' },
                  { keys: ['P'], action: 'Polygon tool' },
                  { keys: ['L'], action: 'Polyline tool' },
                  { keys: ['C'], action: 'Circle tool' },
                  { keys: ['S'], action: 'Select tool' },
                  { keys: ['Z'], action: 'Zoom tool' },
                  { keys: ['H'], action: 'Pan tool' },
                  { keys: ['Ctrl', 'Z'], action: 'Undo' },
                  { keys: ['Ctrl', 'Y'], action: 'Redo' },
                  { keys: ['Ctrl', 'S'], action: 'Save' },
                  { keys: ['Delete'], action: 'Delete annotation' },
                  { keys: ['Space'], action: 'Play/Pause (video)' },
                  { keys: ['F1'], action: 'Show shortcuts' },
                ].map((s) => (
                  <div key={s.action} className={`flex items-center justify-between p-2 rounded ${dm ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}>
                    <span className={`text-sm ${dm ? 'text-slate-300' : 'text-slate-700'}`}>{s.action}</span>
                    <div className="flex items-center gap-1">
                      {s.keys.map((k) => <kbd key={k} className={`px-2 py-0.5 text-xs rounded font-mono ${dm ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>{k}</kbd>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'ai' && (
            <div className={`${card} p-4 space-y-4`}>
              <h3 className={`text-sm font-semibold ${dm ? 'text-white' : 'text-slate-900'}`}>AI Assistance</h3>
              {[
                { label: 'Auto Tracking', desc: 'Track objects across frames automatically', on: true },
                { label: 'Interpolation', desc: 'Interpolate annotations between keyframes', on: true },
                { label: 'Object Detection', desc: 'Pre-label objects with AI models', on: false },
                { label: 'Smart Segmentation', desc: 'Auto-segment using SAM-style models', on: true },
                { label: 'Annotation Suggestions', desc: 'Suggest next annotations based on patterns', on: false },
              ].map((setting) => (
                <div key={setting.label} className={`flex items-center justify-between p-3 rounded-lg ${dm ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                  <div>
                    <p className={`text-sm font-medium ${dm ? 'text-white' : 'text-slate-900'}`}>{setting.label}</p>
                    <p className={`text-xs ${dm ? 'text-slate-400' : 'text-slate-500'}`}>{setting.desc}</p>
                  </div>
                  <label className="inline-flex items-center cursor-pointer">
                    <span className={`w-9 h-5 rounded-full relative transition-colors ${setting.on ? 'bg-blue-600' : dm ? 'bg-slate-700' : 'bg-slate-300'}`}>
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${setting.on ? 'right-0.5' : 'left-0.5'}`} />
                    </span>
                  </label>
                </div>
              ))}
            </div>
          )}

          {tab === 'notifications' && (
            <div className={`${card} p-4 space-y-4`}>
              <h3 className={`text-sm font-semibold ${dm ? 'text-white' : 'text-slate-900'}`}>Notifications</h3>
              {[
                { label: 'Task assignments', on: true },
                { label: 'QA review results', on: true },
                { label: 'Project deadlines', on: true },
                { label: 'AI auto-tracking completion', on: false },
                { label: 'Weekly summary reports', on: true },
              ].map((n) => (
                <div key={n.label} className={`flex items-center justify-between p-3 rounded-lg ${dm ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                  <span className={`text-sm ${dm ? 'text-white' : 'text-slate-900'}`}>{n.label}</span>
                  <label className="inline-flex items-center cursor-pointer">
                    <span className={`w-9 h-5 rounded-full relative transition-colors ${n.on ? 'bg-blue-600' : dm ? 'bg-slate-700' : 'bg-slate-300'}`}>
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${n.on ? 'right-0.5' : 'left-0.5'}`} />
                    </span>
                  </label>
                </div>
              ))}
            </div>
          )}

          {tab === 'security' && (
            <div className={`${card} p-4 space-y-4`}>
              <h3 className={`text-sm font-semibold ${dm ? 'text-white' : 'text-slate-900'}`}>Security</h3>
              <div className={`p-3 rounded-lg ${dm ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={16} className="text-emerald-500" />
                  <span className={`text-sm font-medium ${dm ? 'text-white' : 'text-slate-900'}`}>Two-Factor Authentication</span>
                </div>
                <p className={`text-xs ${dm ? 'text-slate-400' : 'text-slate-500'}`}>Enabled · Authenticator app</p>
              </div>
              <div className={`p-3 rounded-lg ${dm ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Database size={16} className="text-blue-500" />
                  <span className={`text-sm font-medium ${dm ? 'text-white' : 'text-slate-900'}`}>Data Encryption</span>
                </div>
                <p className={`text-xs ${dm ? 'text-slate-400' : 'text-slate-500'}`}>AES-256 encryption at rest · TLS 1.3 in transit</p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                <Save size={14} /> Save Changes
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
