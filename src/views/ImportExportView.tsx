import React, { useState } from 'react';
import { Download, Upload, FileText, Code, Database, Package, Check, X, ArrowRight, ArrowLeft, Settings, FileJson, FileCode, FileSpreadsheet } from 'lucide-react';
import { useAppStore } from '../store/appStore';

const FORMATS = [
  { id: 'coco', name: 'COCO', ext: 'json', icon: FileJson, desc: 'Microsoft COCO dataset format', color: 'blue' },
  { id: 'yolo', name: 'YOLO', ext: 'txt', icon: FileText, desc: 'YOLO training format', color: 'emerald' },
  { id: 'cvat', name: 'CVAT', ext: 'xml', icon: FileCode, desc: 'CVAT video annotation XML', color: 'violet' },
  { id: 'supervisely', name: 'Supervisely', ext: 'json', icon: FileJson, desc: 'Supervisely JSON format', color: 'amber' },
  { id: 'kitti', name: 'KITTI', ext: 'txt', icon: FileText, desc: 'KITTI 3D detection format', color: 'rose' },
  { id: 'pascal', name: 'Pascal VOC', ext: 'xml', icon: FileCode, desc: 'Pascal VOC XML', color: 'cyan' },
  { id: 'csv', name: 'CSV', ext: 'csv', icon: FileSpreadsheet, desc: 'Comma-separated values', color: 'slate' },
  { id: 'custom', name: 'Custom JSON', ext: 'json', icon: FileJson, desc: 'GV.AI native format', color: 'blue' },
];

export default function ImportExportView() {
  const dm = useAppStore((s) => s.darkMode);
  const projects = useAppStore((s) => s.projects);
  const [mode, setMode] = useState<'export' | 'import'>('export');
  const [selectedFormat, setSelectedFormat] = useState('coco');
  const [selectedProject, setSelectedProject] = useState('all');
  const [options, setOptions] = useState({ includeImages: false, includeAttributes: true, includeConfidence: true, prettyPrint: true, splitByImage: true });
  const [step, setStep] = useState(1);

  const card = `rounded-xl border ${dm ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`;

  return (
    <div className="p-6 max-w-[1000px] mx-auto">
      <div className="mb-5">
        <h1 className={`text-2xl font-bold ${dm ? 'text-white' : 'text-slate-900'}`}>Import / Export</h1>
        <p className={`text-sm mt-0.5 ${dm ? 'text-slate-400' : 'text-slate-500'}`}>Transfer annotations between formats</p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-1 mb-4">
        <button onClick={() => setMode('export')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'export' ? 'bg-blue-600 text-white' : (dm ? 'bg-slate-900 text-slate-400 hover:bg-slate-800' : 'bg-white text-slate-600 hover:bg-slate-100')}`}>
          <ArrowRight size={15} /> Export
        </button>
        <button onClick={() => setMode('import')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'import' ? 'bg-blue-600 text-white' : (dm ? 'bg-slate-900 text-slate-400 hover:bg-slate-800' : 'bg-white text-slate-600 hover:bg-slate-100')}`}>
          <ArrowLeft size={15} /> Import
        </button>
      </div>

      <div className={card}>
        {/* Step indicator */}
        <div className="flex items-center gap-2 p-4 border-b border-slate-100 dark:border-slate-800">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div className={`flex items-center gap-1.5 ${step >= s ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${step >= s ? 'bg-blue-600 text-white' : (dm ? 'bg-slate-800 text-slate-500' : 'bg-slate-200 text-slate-500')}`}>{s}</div>
                <span className={`text-xs font-medium ${dm ? 'text-white' : 'text-slate-900'}`}>{s === 1 ? (mode === 'export' ? 'Format' : 'Source') : s === 2 ? (mode === 'export' ? 'Project' : 'Map') : 'Options'}</span>
              </div>
              {s < 3 && <div className="flex-1 h-px mx-2 bg-slate-200 dark:bg-slate-700" />}
            </React.Fragment>
          ))}
        </div>

        <div className="p-4">
          {/* Step 1: Format */}
          {step === 1 && (
            <>
              <h3 className={`text-sm font-semibold mb-3 ${dm ? 'text-white' : 'text-slate-900'}`}>Select {mode === 'export' ? 'Export Format' : 'Import Format'}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {FORMATS.map((f) => (
                  <button key={f.id} onClick={() => setSelectedFormat(f.id)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${selectedFormat === f.id ? 'border-blue-500 bg-blue-500/10' : dm ? 'border-slate-700 hover:border-slate-600' : 'border-slate-200 hover:border-slate-300'}`}>
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${dm ? 'bg-slate-800' : 'bg-slate-100'}`}>
                      <f.icon size={16} className={selectedFormat === f.id ? 'text-blue-500' : dm ? 'text-slate-400' : 'text-slate-500'} />
                    </div>
                    <div className="text-center">
                      <p className={`text-xs font-medium ${dm ? 'text-white' : 'text-slate-900'}`}>{f.name}</p>
                      <p className={`text-[9px] ${dm ? 'text-slate-500' : 'text-slate-400'}`}>.{f.ext}</p>
                    </div>
                  </button>
                ))}
              </div>
              <p className={`text-xs mt-3 ${dm ? 'text-slate-400' : 'text-slate-500'}`}>{FORMATS.find((f) => f.id === selectedFormat)?.desc}</p>
            </>
          )}

          {/* Step 2: Project / Mapping */}
          {step === 2 && (
            <>
              <h3 className={`text-sm font-semibold mb-3 ${dm ? 'text-white' : 'text-slate-900'}`}>{mode === 'export' ? 'Select Project' : 'Map Classes'}</h3>
              {mode === 'export' ? (
                <div className="space-y-2">
                  <button onClick={() => setSelectedProject('all')} className={`flex items-center gap-2 w-full p-3 rounded-lg border transition-colors ${selectedProject === 'all' ? 'border-blue-500 bg-blue-500/10' : dm ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <Package size={16} className={selectedProject === 'all' ? 'text-blue-500' : dm ? 'text-slate-400' : 'text-slate-500'} />
                    <span className={`text-sm font-medium ${dm ? 'text-white' : 'text-slate-900'}`}>All Projects</span>
                    <span className={`ml-auto text-xs ${dm ? 'text-slate-500' : 'text-slate-400'}`}>{projects.length}</span>
                  </button>
                  {projects.map((p) => (
                    <button key={p.id} onClick={() => setSelectedProject(p.id)} className={`flex items-center gap-2 w-full p-3 rounded-lg border transition-colors ${selectedProject === p.id ? 'border-blue-500 bg-blue-500/10' : dm ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50'}`}>
                      <FileText size={16} className={selectedProject === p.id ? 'text-blue-500' : dm ? 'text-slate-400' : 'text-slate-500'} />
                      <div className="flex-1 text-left">
                        <p className={`text-sm font-medium ${dm ? 'text-white' : 'text-slate-900'}`}>{p.name}</p>
                        <p className={`text-xs ${dm ? 'text-slate-500' : 'text-slate-400'}`}>{p.annotationCount.toLocaleString()} annotations</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {['Person', 'Vehicle', 'Truck', 'Forklift', 'Pallet'].map((c, i) => (
                    <div key={c} className={`flex items-center gap-2 p-2.5 rounded-lg ${dm ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                      <span className={`text-sm font-medium ${dm ? 'text-white' : 'text-slate-900'}`}>{c}</span>
                      <ArrowRight size={14} className={dm ? 'text-slate-600' : 'text-slate-400'} />
                      <select className={`flex-1 px-2 py-1 rounded border text-sm ${dm ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                        <option>Person</option><option>Vehicle</option><option>Truck</option><option>Forklift</option><option>Pallet</option>
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Step 3: Options */}
          {step === 3 && (
            <>
              <h3 className={`text-sm font-semibold mb-3 ${dm ? 'text-white' : 'text-slate-900'}`}>Options</h3>
              <div className="space-y-3">
                {[
                  { key: 'includeImages', label: 'Include image data', desc: 'Embed or reference image files' },
                  { key: 'includeAttributes', label: 'Include attributes', desc: 'Export custom annotation attributes' },
                  { key: 'includeConfidence', label: 'Include confidence scores', desc: 'AI confidence values' },
                  { key: 'prettyPrint', label: 'Pretty print JSON', desc: 'Indented, human-readable output' },
                  { key: 'splitByImage', label: 'Split by image', desc: 'One file per image (YOLO/Pascal)' },
                ].map((opt) => (
                  <label key={opt.key} className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer ${dm ? 'bg-slate-800/50 hover:bg-slate-800' : 'bg-slate-50 hover:bg-slate-100'}`}>
                    <input type="checkbox" checked={(options as any)[opt.key]} onChange={(e) => setOptions({ ...options, [opt.key]: e.target.checked })} className="mt-0.5 rounded" />
                    <div>
                      <p className={`text-sm font-medium ${dm ? 'text-white' : 'text-slate-900'}`}>{opt.label}</p>
                      <p className={`text-xs ${dm ? 'text-slate-400' : 'text-slate-500'}`}>{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </>
          )}

          {/* Nav buttons */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button onClick={() => step !== 1 && setStep(step - 1)} disabled={step === 1} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${step === 1 ? 'opacity-30' : dm ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'}`}>
              <ArrowLeft size={14} /> Back
            </button>
            {step < 3 ? (
              <button onClick={() => setStep(step + 1)} className="flex items-center gap-1 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Next <ArrowRight size={14} /></button>
            ) : (
              <button className={`flex items-center gap-2 px-4 py-1.5 text-white rounded-lg text-sm font-medium ${mode === 'export' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                {mode === 'export' ? <Download size={14} /> : <Upload size={14} />}
                {mode === 'export' ? 'Export' : 'Import'} ({FORMATS.find((f) => f.id === selectedFormat)?.name})
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
