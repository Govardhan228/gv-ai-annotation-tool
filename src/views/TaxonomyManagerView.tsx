import React, { useState } from 'react';
import { Plus, ChevronRight, ChevronDown, Tag, Trash2, CreditCard as Edit3, X, Hash, AlertCircle, Search, GripVertical, FolderTree, GitBranch, History } from 'lucide-react';
import { useAppStore } from '../store/appStore';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#a855f7', '#ec4899', '#64748b'];

interface TaxNode {
  id: string;
  name: string;
  color: string;
  parentId: string | null;
  children?: TaxNode[];
  attributes?: { id: string; name: string; type: string; required: boolean }[];
}

export default function TaxonomyManager() {
  const dm = useAppStore((s) => s.darkMode);
  const taxonomy = useAppStore((s) => s.taxonomy);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(taxonomy.map((t) => t.id)));
  const [search, setSearch] = useState('');
  const [addingParent, setAddingParent] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(COLORS[5]);
  const [versionModal, setVersionModal] = useState(false);

  const card = `rounded-xl border ${dm ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`;
  const inputCls = `w-full px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${dm ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'}`;

  const toggle = (id: string) => setExpanded((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleAdd = () => {
    if (!newName.trim()) return;
    // In a real app this would persist
    setNewName('');
    setAddingParent(false);
  };

  const renderNode = (node: TaxNode, depth: number = 0): React.ReactNode => {
    const isExpanded = expanded.has(node.id);
    const children = node.children || [];
    const hasChildren = children.length > 0;
    const matchesSearch = !search || node.name.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch && !hasChildren) return null;

    return (
      <div key={node.id}>
        <div
          className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors cursor-pointer ${dm ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}
          style={{ paddingLeft: `${8 + depth * 20}px` }}
          onClick={() => toggle(node.id)}
        >
          <GripVertical size={11} className={dm ? 'text-slate-700' : 'text-slate-300'} />
          <div className="w-3.5 h-3.5 rounded" style={{ backgroundColor: node.color }} />
          {hasChildren ? (
            isExpanded ? <ChevronDown size={13} className={dm ? 'text-slate-500' : 'text-slate-400'} /> : <ChevronRight size={13} className={dm ? 'text-slate-500' : 'text-slate-400'} />
          ) : <span className="w-3.5" />}
          <span className={`flex-1 text-sm font-medium ${dm ? 'text-white' : 'text-slate-900'}`}>{node.name}</span>
          {node.attributes && node.attributes.length > 0 && (
            <span className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] ${dm ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
              <Hash size={9} /> {node.attributes.length}
            </span>
          )}
          <button className={`p-1 rounded ${dm ? 'hover:bg-slate-700 text-slate-500' : 'hover:bg-slate-200 text-slate-400'}`}><Edit3 size={12} /></button>
          <button className={`p-1 rounded ${dm ? 'hover:bg-slate-700 text-slate-500' : 'hover:bg-slate-200 text-slate-400'}`}><Plus size={12} /></button>
          <button className={`p-1 rounded ${dm ? 'hover:bg-rose-500/20 text-slate-500 hover:text-rose-400' : 'hover:bg-rose-50 text-slate-400 hover:text-rose-600'}`}><Trash2 size={12} /></button>
        </div>
        {isExpanded && children.map((child) => renderNode(child as TaxNode, depth + 1))}
        {isExpanded && (
          <button
            onClick={(e) => { e.stopPropagation(); setAddingParent(true); }}
            className={`flex items-center gap-1 w-full px-2 py-1.5 text-xs transition-colors ${dm ? 'text-blue-400 hover:bg-slate-800' : 'text-blue-600 hover:bg-blue-50'}`}
            style={{ paddingLeft: `${20 + depth * 20}px` }}
          >
            <Plus size={11} /> Add subcategory
          </button>
        )}
      </div>
    );
  };

  const topLevelCount = taxonomy.length;
  const totalNodes = taxonomy.reduce((sum, t) => sum + 1 + (t.children?.length || 0), 0);
  const withAttrs = taxonomy.reduce((sum, t) => sum + (t.attributes?.length || 0), 0);

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className={`text-2xl font-bold ${dm ? 'text-white' : 'text-slate-900'}`}>Taxonomy Manager</h1>
          <p className={`text-sm mt-0.5 ${dm ? 'text-slate-400' : 'text-slate-500'}`}>Class hierarchy, attributes, and behaviors</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setVersionModal(true)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${dm ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
            <GitBranch size={15} /> v2.3.1
          </button>
          <button onClick={() => setAddingParent(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium shadow-sm">
            <Plus size={16} /> Add Class
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Top-Level Classes', value: topLevelCount, icon: FolderTree },
          { label: 'Total Categories', value: totalNodes, icon: Tag },
          { label: 'With Attributes', value: withAttrs, icon: Hash },
          { label: 'Version', value: 'v2.3.1', icon: GitBranch },
        ].map((s) => (
          <div key={s.label} className={`${card} p-3 flex items-center gap-2.5`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${dm ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
              <s.icon size={14} />
            </div>
            <div>
              <p className={`text-base font-bold ${dm ? 'text-white' : 'text-slate-900'}`}>{s.value}</p>
              <p className={`text-[10px] ${dm ? 'text-slate-500' : 'text-slate-400'}`}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Tree */}
        <div className={`${card} lg:col-span-2 p-4`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-sm font-semibold ${dm ? 'text-white' : 'text-slate-900'}`}>Class Hierarchy</h3>
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${dm ? 'bg-slate-800' : 'bg-slate-100'}`}>
              <Search size={12} className={dm ? 'text-slate-500' : 'text-slate-400'} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter..." className={`bg-transparent border-none outline-none text-xs w-32 ${dm ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'}`} />
            </div>
          </div>
          <div className="space-y-0.5">
            {taxonomy.map((node) => renderNode(node))}
          </div>

          {/* Add form */}
          {addingParent && (
            <div className={`mt-3 p-3 rounded-lg border ${dm ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex gap-1">
                  {COLORS.map((c) => (
                    <button key={c} onClick={() => setNewColor(c)} className={`w-5 h-5 rounded-full transition-transform ${newColor === c ? 'scale-110 ring-2 ring-blue-400' : ''}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Class name..." className={inputCls} autoFocus onKeyDown={(e) => e.key === 'Enter' && handleAdd()} />
                <button onClick={handleAdd} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 whitespace-nowrap">Add</button>
                <button onClick={() => setAddingParent(false)} className={`p-1.5 rounded-lg ${dm ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-200 text-slate-400'}`}><X size={14} /></button>
              </div>
            </div>
          )}
        </div>

        {/* Class details */}
        <div className={`${card} p-4`}>
          <h3 className={`text-sm font-semibold mb-3 ${dm ? 'text-white' : 'text-slate-900'}`}>Class Details</h3>
          <div className={`rounded-lg p-3 mb-3 ${dm ? 'bg-slate-800' : 'bg-slate-50'}`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#3b82f6' }} />
              <span className={`font-medium text-sm ${dm ? 'text-white' : 'text-slate-900'}`}>Person</span>
            </div>
            <p className={`text-xs ${dm ? 'text-slate-400' : 'text-slate-500'}`}>Human actors in the scene including various behaviors</p>
          </div>

          <h4 className={`text-xs font-medium mb-2 ${dm ? 'text-slate-400' : 'text-slate-500'}`}>BEHAVIORS ({5})</h4>
          <div className="space-y-1 mb-4">
            {['Walking', 'Loading Goods', 'Unloading Goods', 'Inspecting Goods', 'Guiding Truck'].map((b, i) => (
              <div key={b} className={`flex items-center gap-2 px-2 py-1.5 rounded ${dm ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className={`text-xs ${dm ? 'text-slate-300' : 'text-slate-700'}`}>{b}</span>
              </div>
            ))}
          </div>

          <h4 className={`text-xs font-medium mb-2 ${dm ? 'text-slate-400' : 'text-slate-500'}`}>ATTRIBUTES</h4>
          <div className="space-y-1">
            {[
              { name: 'occlusion', type: 'select', required: false, options: 'none, partial, heavy' },
              { name: 'truncation', type: 'boolean', required: false, options: '' },
              { name: 'direction', type: 'select', required: true, options: 'N, S, E, W' },
              { name: 'speed', type: 'number', required: false, options: '' },
            ].map((attr) => (
              <div key={attr.name} className={`flex items-center gap-2 px-2 py-1.5 rounded ${dm ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                <Hash size={10} className={dm ? 'text-slate-500' : 'text-slate-400'} />
                <span className={`flex-1 text-xs ${dm ? 'text-slate-300' : 'text-slate-700'}`}>{attr.name}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] ${dm ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500'}`}>{attr.type}</span>
                {attr.required && <AlertCircle size={11} className="text-amber-500" />}
              </div>
            ))}
            <button className={`flex items-center gap-1 w-full px-2 py-1.5 text-xs ${dm ? 'text-blue-400 hover:bg-slate-800' : 'text-blue-600 hover:bg-blue-50'} rounded`}>
              <Plus size={11} /> Add attribute
            </button>
          </div>
        </div>
      </div>

      {/* Version history modal */}
      {versionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setVersionModal(false)} />
          <div className={`relative w-full max-w-md mx-4 rounded-xl shadow-2xl ${dm ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
            <div className={`flex items-center justify-between p-4 border-b ${dm ? 'border-slate-800' : 'border-slate-100'}`}>
              <div className="flex items-center gap-2">
                <History size={16} className={dm ? 'text-blue-400' : 'text-blue-600'} />
                <h2 className={`text-base font-semibold ${dm ? 'text-white' : 'text-slate-900'}`}>Version History</h2>
              </div>
              <button onClick={() => setVersionModal(false)} className={`p-1.5 rounded-md ${dm ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}><X size={16} /></button>
            </div>
            <div className="p-4 space-y-2">
              {[
                { ver: 'v2.3.1', date: 'Today', author: 'Alice Chen', note: 'Added Forklift subcategories' },
                { ver: 'v2.3.0', date: '2 days ago', author: 'Bob Smith', note: 'Added Person behaviors' },
                { ver: 'v2.2.0', date: '1 week ago', author: 'Alice Chen', note: 'Initial release for Q3' },
                { ver: 'v2.1.0', date: '3 weeks ago', author: 'Carol Davis', note: 'Removed deprecated classes' },
              ].map((v, i) => (
                <div key={v.ver} className={`flex items-start gap-3 p-3 rounded-lg ${i === 0 ? (dm ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-100') : (dm ? 'hover:bg-slate-800' : 'hover:bg-slate-50')}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${i === 0 ? 'bg-blue-600 text-white' : (dm ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500')}`}>
                    <GitBranch size={14} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${dm ? 'text-white' : 'text-slate-900'}`}>{v.ver}</span>
                      <span className={`text-xs ${dm ? 'text-slate-500' : 'text-slate-400'}`}>{v.date}</span>
                    </div>
                    <p className={`text-xs mt-0.5 ${dm ? 'text-slate-400' : 'text-slate-500'}`}>{v.note}</p>
                    <p className={`text-[10px] mt-0.5 ${dm ? 'text-slate-500' : 'text-slate-400'}`}>by {v.author}</p>
                  </div>
                  {i === 0 && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-600 text-white">Current</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
