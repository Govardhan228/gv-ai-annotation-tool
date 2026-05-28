import React, { useState } from 'react';
import { Plus, Trash2, ChevronRight, ChevronDown, Tag, GripVertical, X, Check, AlertCircle, Hash, CreditCard as Edit3, Move, Copy } from 'lucide-react';
import { AnnotationClass, ClassAttribute } from '../types';

interface Props {
  dark: boolean;
  classes: AnnotationClass[];
  onAddClass: (cls: Omit<AnnotationClass, 'id'>) => void;
  onUpdateClass: (id: string, updates: Partial<AnnotationClass>) => void;
  onRemoveClass: (id: string) => void;
  onAddAttribute: (classId: string, attr: Omit<ClassAttribute, 'id'>) => void;
  onRemoveAttribute: (classId: string, attrId: string) => void;
  onReorderClasses?: (classes: AnnotationClass[]) => void;
}

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b'];

export default function TaxonomyPanel({
  dark, classes, onAddClass, onUpdateClass, onRemoveClass,
  onAddAttribute, onRemoveAttribute, onReorderClasses
}: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(classes.map(c => c.id)));
  const [addingClass, setAddingClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassColor, setNewClassColor] = useState(COLORS[0]);
  const [newClassHotkey, setNewClassHotkey] = useState('');
  const [newClassParent, setNewClassParent] = useState<string>('');
  const [addingAttr, setAddingAttr] = useState<string | null>(null);
  const [newAttrName, setNewAttrName] = useState('');
  const [newAttrType, setNewAttrType] = useState<ClassAttribute['type']>('select');
  const [newAttrRequired, setNewAttrRequired] = useState(false);
  const [newAttrOptions, setNewAttrOptions] = useState('');
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  const dm = dark;
  const panel = `rounded-xl border ${dm ? 'bg-gray-800 border-gray-700/50' : 'bg-white border-gray-200'}`;
  const btn = `p-1.5 rounded transition-colors ${dm ? 'hover:bg-gray-700 text-gray-500' : 'hover:bg-gray-100 text-gray-500'}`;

  const toggleExpand = (id: string) => {
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const handleAddClass = () => {
    if (!newClassName.trim()) return;
    onAddClass({ name: newClassName, color: newClassColor, hotkey: newClassHotkey, description: '', parentId: newClassParent || undefined, attributes: [] });
    setNewClassName(''); setNewClassHotkey(''); setAddingClass(false);
  };

  const handleAddAttribute = (classId: string) => {
    if (!newAttrName.trim()) return;
    const attr: Omit<ClassAttribute, 'id'> = {
      name: newAttrName, type: newAttrType, required: newAttrRequired,
      options: ['select', 'multiselect'].includes(newAttrType)
        ? newAttrOptions.split(',').map(o => o.trim()).filter(Boolean) : undefined,
    };
    onAddAttribute(classId, attr);
    setNewAttrName(''); setNewAttrOptions(''); setNewAttrRequired(false); setAddingAttr(null);
  };

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); setDragOverIdx(idx); };
  const handleDrop = (idx: number) => {
    if (dragIdx !== null && dragIdx !== idx && onReorderClasses) {
      const reordered = [...classes];
      const [moved] = reordered.splice(dragIdx, 1);
      reordered.splice(idx, 0, moved);
      onReorderClasses(reordered.map((c, i) => ({ ...c, sortOrder: i })));
    }
    setDragIdx(null); setDragOverIdx(null);
  };

  const topClasses = classes.filter(c => !c.parentId);
  const filteredClasses = searchFilter
    ? topClasses.filter(c => c.name.toLowerCase().includes(searchFilter.toLowerCase()))
    : topClasses;

  const getChildClasses = (parentId: string) => classes.filter(c => c.parentId === parentId);

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={`text-2xl font-bold ${dm ? 'text-white' : 'text-gray-900'}`}>Taxonomy</h1>
          <p className={`text-sm mt-1 ${dm ? 'text-gray-400' : 'text-gray-500'}`}>Manage annotation classes and attributes</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${dm ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <Tag size={14} className={dm ? 'text-gray-500' : 'text-gray-400'} />
            <input
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              placeholder="Filter classes..."
              className={`bg-transparent border-none outline-none text-sm w-36 ${dm ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`}
            />
          </div>
          <button onClick={() => setAddingClass(true)} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
            <Plus size={18} /> Add Class
          </button>
        </div>
      </div>

      {/* Add Class Form */}
      {addingClass && (
        <div className={`${panel} p-4 mb-4 animate-fade-in`}>
          <h3 className={`text-sm font-semibold mb-3 ${dm ? 'text-white' : 'text-gray-900'}`}>New Class</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <label className={`text-xs font-medium w-16 ${dm ? 'text-gray-400' : 'text-gray-500'}`}>Color</label>
              <div className="flex gap-1.5">
                {COLORS.map(c => (
                  <button key={c} onClick={() => setNewClassColor(c)}
                    className={`w-7 h-7 rounded-full transition-all ${newClassColor === c ? 'scale-110 ring-2 ring-white ring-offset-1 ring-offset-transparent' : 'hover:scale-105'}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className={`text-xs font-medium w-16 ${dm ? 'text-gray-400' : 'text-gray-500'}`}>Name</label>
              <input value={newClassName} onChange={e => setNewClassName(e.target.value)}
                placeholder="e.g., Vehicle, Pedestrian..."
                className={`flex-1 px-3 py-2 rounded-lg border text-sm ${dm ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500/20`}
                onKeyDown={e => e.key === 'Enter' && handleAddClass()} autoFocus />
            </div>
            <div className="flex items-center gap-3">
              <label className={`text-xs font-medium w-16 ${dm ? 'text-gray-400' : 'text-gray-500'}`}>Hotkey</label>
              <input value={newClassHotkey} onChange={e => setNewClassHotkey(e.target.value)}
                placeholder="1-9"
                className={`w-20 px-3 py-2 rounded-lg border text-sm ${dm ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500/20`} />
            </div>
            <div className="flex items-center gap-3">
              <label className={`text-xs font-medium w-16 ${dm ? 'text-gray-400' : 'text-gray-500'}`}>Parent</label>
              <select value={newClassParent} onChange={e => setNewClassParent(e.target.value)}
                className={`flex-1 px-3 py-2 rounded-lg border text-sm ${dm ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                <option value="">None (top-level)</option>
                {topClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setAddingClass(false)} className={`px-3 py-1.5 rounded-lg text-sm ${dm ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}>Cancel</button>
              <button onClick={handleAddClass} className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 font-medium">Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Class Tree */}
      <div className="space-y-1.5">
        {filteredClasses.map((cls, idx) => {
          const isExpanded = expanded.has(cls.id);
          const children = getChildClasses(cls.id);
          const isDragging = dragIdx === idx;
          const isDragOver = dragOverIdx === idx;

          const renderClassItem = (c: AnnotationClass, depth: number) => {
            const hasChildren = getChildClasses(c.id).length > 0;
            const hasAttrs = c.attributes && c.attributes.length > 0;
            const isEdit = editingClassId === c.id;
            const isExp = expanded.has(c.id);

            return (
              <div key={c.id} className={`rounded-xl border transition-all ${dm ? 'bg-gray-800 border-gray-700/50' : 'bg-white border-gray-200'} ${isDragOver ? 'ring-2 ring-blue-400' : ''}`}>
                {/* Class header */}
                <div
                  className={`flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-colors ${dm ? 'hover:bg-gray-700/40' : 'hover:bg-gray-50'}`}
                  style={{ paddingLeft: `${12 + depth * 20}px` }}
                  onClick={() => toggleExpand(c.id)}
                >
                  <GripVertical size={12} className={`cursor-grab ${dm ? 'text-gray-600' : 'text-gray-300'}`}
                    draggable onDragStart={() => handleDragStart(idx)} onDragOver={e => handleDragOver(e, idx)} onDrop={() => handleDrop(idx)} />

                  <div className="w-3.5 h-3.5 rounded" style={{ backgroundColor: c.color }} />

                  {(hasChildren || hasAttrs) ? (
                    isExp ? <ChevronDown size={14} className={dm ? 'text-gray-500' : 'text-gray-400'} /> : <ChevronRight size={14} className={dm ? 'text-gray-500' : 'text-gray-400'} />
                  ) : <span className="w-3.5" />}

                  {isEdit ? (
                    <input value={editName} onChange={e => setEditName(e.target.value)}
                      className={`flex-1 px-2 py-0.5 rounded border text-sm ${dm ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                      onKeyDown={e => { if (e.key === 'Enter') { onUpdateClass(c.id, { name: editName }); setEditingClassId(null); } }}
                      onClick={e => e.stopPropagation()} autoFocus />
                  ) : (
                    <span className={`flex-1 text-sm font-medium ${dm ? 'text-white' : 'text-gray-900'}`}>{c.name}</span>
                  )}

                  {c.hotkey && (
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${dm ? 'bg-gray-700 text-gray-500' : 'bg-gray-100 text-gray-400'}`}>{c.hotkey}</span>
                  )}

                  <button onClick={e => { e.stopPropagation(); setEditingClassId(c.id); setEditName(c.name); }} className={btn} title="Edit">
                    <Edit3 size={13} />
                  </button>
                  <button onClick={e => { e.stopPropagation(); onRemoveClass(c.id); }} className={btn} title="Delete">
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* Attributes */}
                {isExp && hasAttrs && (
                  <div className={`border-t ${dm ? 'border-gray-700/50' : 'border-gray-100'}`}>
                    {c.attributes!.map(attr => (
                      <div key={attr.id} className={`flex items-center gap-2 px-3 py-1.5 text-xs ${dm ? 'text-gray-400' : 'text-gray-600'}`}
                        style={{ paddingLeft: `${20 + depth * 20}px` }}>
                        <Hash size={10} className={dm ? 'text-gray-600' : 'text-gray-400'} />
                        <span className="flex-1">{attr.name}</span>
                        <span className={`px-1.5 py-0.5 rounded ${dm ? 'bg-gray-700 text-gray-500' : 'bg-gray-100 text-gray-400'}`}>{attr.type}</span>
                        {attr.required && <AlertCircle size={10} className="text-amber-500" />}
                        {attr.options && attr.options.length > 0 && (
                          <span className={`text-[10px] ${dm ? 'text-gray-600' : 'text-gray-400'}`}>
                            [{attr.options.join(', ')}]
                          </span>
                        )}
                        <button onClick={() => onRemoveAttribute(c.id, attr.id)} className={dm ? 'hover:text-rose-400' : 'hover:text-rose-600'}>
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add attribute */}
                {isExp && addingAttr === c.id && (
                  <div className={`border-t p-3 ${dm ? 'border-gray-700/50' : 'border-gray-100'}`} style={{ paddingLeft: `${20 + depth * 20}px` }}>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input value={newAttrName} onChange={e => setNewAttrName(e.target.value)} placeholder="Attribute name"
                          className={`flex-1 px-2 py-1.5 rounded border text-xs ${dm ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} autoFocus />
                        <select value={newAttrType} onChange={e => setNewAttrType(e.target.value as any)}
                          className={`px-2 py-1.5 rounded border text-xs ${dm ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                          <option value="text">Text</option><option value="number">Number</option><option value="boolean">Boolean</option>
                          <option value="select">Select</option><option value="multiselect">Multi</option>
                        </select>
                      </div>
                      {['select', 'multiselect'].includes(newAttrType) && (
                        <input value={newAttrOptions} onChange={e => setNewAttrOptions(e.target.value)}
                          placeholder="Options (comma-separated)"
                          className={`w-full px-2 py-1.5 rounded border text-xs ${dm ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
                      )}
                      <div className="flex items-center justify-between">
                        <label className={`flex items-center gap-1.5 text-xs ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
                          <input type="checkbox" checked={newAttrRequired} onChange={e => setNewAttrRequired(e.target.checked)} className="rounded" />
                          Required
                        </label>
                        <div className="flex gap-1.5">
                          <button onClick={() => handleAddAttribute(c.id)} className="px-2.5 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">Add</button>
                          <button onClick={() => setAddingAttr(null)} className={`px-2.5 py-1 rounded text-xs ${dm ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}>Cancel</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {isExp && (
                  <div className={`border-t ${dm ? 'border-gray-700/50' : 'border-gray-100'}`}>
                    <button onClick={e => { e.stopPropagation(); setAddingAttr(c.id); setNewAttrName(''); setNewAttrOptions(''); setNewAttrRequired(false); }}
                      className={`flex items-center gap-1 w-full px-3 py-1.5 text-xs transition-colors ${dm ? 'text-blue-400 hover:bg-gray-700/30' : 'text-blue-600 hover:bg-blue-50'}`}
                      style={{ paddingLeft: `${20 + depth * 20}px` }}>
                      <Plus size={12} /> Add attribute
                    </button>
                  </div>
                )}

                {/* Child classes */}
                {isExp && getChildClasses(c.id).map(child => renderClassItem(child, depth + 1))}
              </div>
            );
          };

          return renderClassItem(cls, 0);
        })}
      </div>

      {classes.length === 0 && !addingClass && (
        <div className={`text-center py-16 ${dm ? 'text-gray-600' : 'text-gray-400'}`}>
          <Tag size={56} className="mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">No classes defined</p>
          <p className="text-sm mt-1">Create annotation classes to build your taxonomy</p>
          <button onClick={() => setAddingClass(true)} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
            <Plus size={14} className="inline mr-1" /> Add First Class
          </button>
        </div>
      )}
    </div>
  );
}
