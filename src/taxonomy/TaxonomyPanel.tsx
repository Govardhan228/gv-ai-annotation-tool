import React, { useState } from 'react';
import { Plus, Trash2, CreditCard as Edit3, ChevronRight, ChevronDown, Tag, Palette, GripVertical, X, Check, AlertCircle, Hash } from 'lucide-react';
import { AnnotationClass, ClassAttribute } from '../types';

interface Props {
  dark: boolean;
  classes: AnnotationClass[];
  onAddClass: (cls: Omit<AnnotationClass, 'id'>) => void;
  onUpdateClass: (id: string, updates: Partial<AnnotationClass>) => void;
  onRemoveClass: (id: string) => void;
  onAddAttribute: (classId: string, attr: Omit<ClassAttribute, 'id'>) => void;
  onRemoveAttribute: (classId: string, attrId: string) => void;
}

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b'];

export default function TaxonomyPanel({ dark, classes, onAddClass, onUpdateClass, onRemoveClass, onAddAttribute, onRemoveAttribute }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(classes.map(c => c.id)));
  const [addingClass, setAddingClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassColor, setNewClassColor] = useState(COLORS[0]);
  const [addingAttr, setAddingAttr] = useState<string | null>(null);
  const [newAttrName, setNewAttrName] = useState('');
  const [newAttrType, setNewAttrType] = useState<ClassAttribute['type']>('select');
  const [newAttrOptions, setNewAttrOptions] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleAddClass = () => {
    if (!newClassName.trim()) return;
    onAddClass({ name: newClassName, color: newClassColor, attributes: [], hotkey: '', description: '' });
    setNewClassName('');
    setAddingClass(false);
  };

  const handleAddAttribute = (classId: string) => {
    if (!newAttrName.trim()) return;
    const attr: Omit<ClassAttribute, 'id'> = {
      name: newAttrName,
      type: newAttrType,
      required: false,
      options: newAttrType === 'select' || newAttrType === 'multiselect'
        ? newAttrOptions.split(',').map(o => o.trim()).filter(Boolean)
        : undefined,
    };
    onAddAttribute(classId, attr);
    setNewAttrName('');
    setNewAttrOptions('');
    setAddingAttr(null);
  };

  const panel = `rounded-xl border ${dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`;
  const btn = `p-1.5 rounded transition-colors ${dark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`;

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={`text-2xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Taxonomy</h1>
          <p className={`text-sm mt-1 ${dark ? 'text-gray-400' : 'text-gray-600'}`}>Manage annotation classes and attributes</p>
        </div>
        <button
          onClick={() => setAddingClass(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus size={18} /> Add Class
        </button>
      </div>

      {/* Add Class Form */}
      {addingClass && (
        <div className={`${panel} p-4 mb-4`}>
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setNewClassColor(c)}
                  className={`w-6 h-6 rounded-full transition-transform ${newClassColor === c ? 'scale-125 ring-2 ring-white' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <input
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              placeholder="Class name..."
              className={`flex-1 px-3 py-2 rounded-lg border ${
                dark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              onKeyDown={(e) => e.key === 'Enter' && handleAddClass()}
              autoFocus
            />
            <button onClick={handleAddClass} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Check size={18} />
            </button>
            <button onClick={() => setAddingClass(false)} className={`p-2 rounded-lg ${dark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Classes Tree */}
      <div className="space-y-2">
        {classes.map((cls) => {
          const isExpanded = expanded.has(cls.id);
          const childClasses = classes.filter(c => c.parentId === cls.id);
          const isTopLevel = !cls.parentId;

          if (!isTopLevel) return null;

          const renderClass = (c: AnnotationClass, depth: number = 0) => (
            <div key={c.id}>
              <div className={`${panel} p-0`}>
                <div
                  className={`flex items-center gap-2 p-3 cursor-pointer transition-colors ${
                    dark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'
                  }`}
                  style={{ paddingLeft: `${12 + depth * 24}px` }}
                  onClick={() => toggleExpand(c.id)}
                >
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: c.color }} />
                  {childClasses.length > 0 || c.attributes?.length ? (
                    isExpanded ? <ChevronDown size={16} className={dark ? 'text-gray-500' : 'text-gray-400'} /> : <ChevronRight size={16} className={dark ? 'text-gray-500' : 'text-gray-400'} />
                  ) : <span className="w-4" />}
                  <span className={`flex-1 font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>{c.name}</span>
                  {c.hotkey && (
                    <span className={`px-1.5 py-0.5 rounded text-xs font-mono ${dark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                      {c.hotkey}
                    </span>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); onRemoveClass(c.id); }} className={btn} title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Attributes */}
                {isExpanded && c.attributes && c.attributes.length > 0 && (
                  <div className={`border-t ${dark ? 'border-gray-700' : 'border-gray-100'}`}>
                    {c.attributes.map((attr) => (
                      <div
                        key={attr.id}
                        className={`flex items-center gap-2 px-4 py-2 text-sm ${dark ? 'text-gray-300' : 'text-gray-700'}`}
                        style={{ paddingLeft: `${24 + depth * 24}px` }}
                      >
                        <Hash size={12} className={dark ? 'text-gray-600' : 'text-gray-400'} />
                        <span className="flex-1">{attr.name}</span>
                        <span className={`px-1.5 py-0.5 rounded text-xs ${dark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                          {attr.type}
                        </span>
                        {attr.required && <AlertCircle size={12} className="text-amber-500" />}
                        <button onClick={() => onRemoveAttribute(c.id, attr.id)} className={btn} title="Remove">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Attribute */}
                {isExpanded && addingAttr === c.id && (
                  <div className={`border-t p-3 ${dark ? 'border-gray-700' : 'border-gray-100'}`} style={{ paddingLeft: `${24 + depth * 24}px` }}>
                    <div className="flex items-center gap-2">
                      <input
                        value={newAttrName}
                        onChange={(e) => setNewAttrName(e.target.value)}
                        placeholder="Attribute name"
                        className={`flex-1 px-3 py-1.5 rounded border text-sm ${
                          dark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                        } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                        autoFocus
                      />
                      <select
                        value={newAttrType}
                        onChange={(e) => setNewAttrType(e.target.value as any)}
                        className={`px-2 py-1.5 rounded border text-sm ${
                          dark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean</option>
                        <option value="select">Select</option>
                        <option value="multiselect">Multi-select</option>
                      </select>
                      {(newAttrType === 'select' || newAttrType === 'multiselect') && (
                        <input
                          value={newAttrOptions}
                          onChange={(e) => setNewAttrOptions(e.target.value)}
                          placeholder="Options (comma-separated)"
                          className={`flex-1 px-3 py-1.5 rounded border text-sm ${
                            dark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                          } focus:outline-none`}
                        />
                      )}
                      <button onClick={() => handleAddAttribute(c.id)} className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700">
                        <Check size={14} />
                      </button>
                      <button onClick={() => setAddingAttr(null)} className={`p-1.5 rounded ${dark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {isExpanded && (
                  <div className={`border-t ${dark ? 'border-gray-700' : 'border-gray-100'}`}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setAddingAttr(c.id); setNewAttrName(''); setNewAttrOptions(''); }}
                      className={`flex items-center gap-1.5 w-full px-4 py-2 text-sm transition-colors ${
                        dark ? 'text-blue-400 hover:bg-gray-700/50' : 'text-blue-600 hover:bg-blue-50'
                      }`}
                      style={{ paddingLeft: `${24 + depth * 24}px` }}
                    >
                      <Plus size={14} /> Add attribute
                    </button>
                  </div>
                )}
              </div>

              {/* Child classes */}
              {isExpanded && classes.filter(ch => ch.parentId === c.id).map(ch => renderClass(ch, depth + 1))}
            </div>
          );

          return renderClass(cls);
        })}
      </div>

      {classes.length === 0 && !addingClass && (
        <div className={`text-center py-12 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
          <Tag size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No classes defined</p>
          <p className="text-sm mt-1">Add annotation classes to build your taxonomy</p>
        </div>
      )}
    </div>
  );
}
