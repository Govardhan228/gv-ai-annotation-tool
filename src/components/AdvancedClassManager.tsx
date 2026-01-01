import React, { useState } from 'react';
import { Plus, Tag, X, CreditCard as Edit3, Palette, Key, Settings, ChevronDown, ChevronRight, Type, Hash, ToggleLeft, List, CheckSquare } from 'lucide-react';
import { AnnotationClass, ClassAttribute } from '../types';

interface AdvancedClassManagerProps {
  annotationClasses: AnnotationClass[];
  selectedClass: string;
  onClassSelect: (className: string) => void;
  onAddClass: (classData: Omit<AnnotationClass, 'id'>) => void;
  onUpdateClass: (id: string, updates: Partial<AnnotationClass>) => void;
  onRemoveClass: (id: string) => void;
  dark?: boolean;
}

export default function AdvancedClassManager({
  annotationClasses,
  selectedClass,
  onClassSelect,
  onAddClass,
  onUpdateClass,
  onRemoveClass,
  dark = false
}: AdvancedClassManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingClass, setEditingClass] = useState<string | null>(null);
  const [expandedClass, setExpandedClass] = useState<string | null>(null);
  const [newClass, setNewClass] = useState({
    name: '',
    color: '#3b82f6',
    description: '',
    hotkey: '',
    attributes: [] as ClassAttribute[]
  });

  const colors = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', 
    '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280'
  ];

  const handleAddClass = () => {
    if (newClass.name.trim() && !annotationClasses.find(c => c.name === newClass.name.trim())) {
      onAddClass({
        name: newClass.name.trim(),
        color: newClass.color,
        description: newClass.description,
        hotkey: newClass.hotkey,
        attributes: newClass.attributes
      });
      setNewClass({
        name: '',
        color: '#3b82f6',
        description: '',
        hotkey: '',
        attributes: []
      });
      setIsAdding(false);
    }
  };

  const handleAddAttribute = (classId: string) => {
    const newAttribute: ClassAttribute = {
      id: Date.now().toString(),
      name: 'New Attribute',
      type: 'text',
      required: false
    };
    
    const classData = annotationClasses.find(c => c.id === classId);
    if (classData) {
      const updatedAttributes = [...(classData.attributes || []), newAttribute];
      onUpdateClass(classId, { attributes: updatedAttributes });
    }
  };

  const handleUpdateAttribute = (classId: string, attributeId: string, updates: Partial<ClassAttribute>) => {
    const classData = annotationClasses.find(c => c.id === classId);
    if (classData) {
      const updatedAttributes = classData.attributes?.map(attr => 
        attr.id === attributeId ? { ...attr, ...updates } : attr
      ) || [];
      onUpdateClass(classId, { attributes: updatedAttributes });
    }
  };

  const handleRemoveAttribute = (classId: string, attributeId: string) => {
    const classData = annotationClasses.find(c => c.id === classId);
    if (classData) {
      const updatedAttributes = classData.attributes?.filter(attr => attr.id !== attributeId) || [];
      onUpdateClass(classId, { attributes: updatedAttributes });
    }
  };

  return (
    <div className={`${dark ? 'bg-gray-800' : 'bg-white'} ${dark ? '' : 'rounded-xl shadow-sm border border-gray-100'} p-4`}>
      <div className="flex items-center gap-2 mb-4">
        <Tag size={18} className={dark ? 'text-gray-400' : 'text-gray-600'} />
        <h3 className={`font-semibold ${dark ? 'text-white' : 'text-gray-800'}`}>Annotation Classes</h3>
      </div>
      
      <div className="space-y-2 mb-4">
        {annotationClasses.map((classItem) => (
          <div key={classItem.id} className="space-y-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setExpandedClass(expandedClass === classItem.id ? null : classItem.id)}
                className={`p-1 rounded transition-colors ${
                  dark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                {expandedClass === classItem.id ? 
                  <ChevronDown size={14} /> : 
                  <ChevronRight size={14} />
                }
              </button>
              
              <div
                className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                style={{ backgroundColor: classItem.color }}
              />
              
              <button
                onClick={() => onClassSelect(classItem.name)}
                className={`flex-1 text-left px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedClass === classItem.name
                    ? dark 
                      ? 'bg-blue-600 text-white border border-blue-500'
                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                    : dark
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-transparent'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{classItem.name}</span>
                  {classItem.hotkey && (
                    <kbd className={`px-1.5 py-0.5 text-xs rounded ${
                      selectedClass === classItem.name
                        ? dark ? 'bg-blue-700 text-blue-200' : 'bg-blue-200 text-blue-700'
                        : dark ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {classItem.hotkey}
                    </kbd>
                  )}
                </div>
              </button>
              
              <button
                onClick={() => setEditingClass(editingClass === classItem.id ? null : classItem.id)}
                className={`p-1.5 rounded transition-colors ${
                  dark ? 'text-gray-400 hover:text-blue-400 hover:bg-gray-700' : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50'
                }`}
              >
                <Edit3 size={14} />
              </button>
              
              {annotationClasses.length > 1 && (
                <button
                  onClick={() => onRemoveClass(classItem.id)}
                  className={`p-1.5 rounded transition-colors ${
                    dark ? 'text-gray-400 hover:text-red-400 hover:bg-gray-700' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                  }`}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Expanded Details */}
            {expandedClass === classItem.id && (
              <div className={`ml-6 p-3 rounded-lg border ${
                dark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
              }`}>
                {classItem.description && (
                  <p className={`text-sm mb-3 ${dark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {classItem.description}
                  </p>
                )}
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Attributes ({classItem.attributes?.length || 0})
                    </span>
                    <button
                      onClick={() => handleAddAttribute(classItem.id)}
                      className={`text-xs px-2 py-1 rounded transition-colors ${
                        dark 
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                      }`}
                    >
                      Add Attribute
                    </button>
                  </div>
                  
                  {classItem.attributes?.map((attr) => (
                    <div key={attr.id} className={`p-2 rounded border ${
                      dark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="text"
                          value={attr.name}
                          onChange={(e) => handleUpdateAttribute(classItem.id, attr.id, { name: e.target.value })}
                          className={`flex-1 px-2 py-1 text-sm border rounded ${
                            dark 
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        />
                        <select
                          value={attr.type}
                          onChange={(e) => handleUpdateAttribute(classItem.id, attr.id, { type: e.target.value as any })}
                          className={`px-2 py-1 text-sm border rounded ${
                            dark 
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        >
                          <option value="text">Text</option>
                          <option value="number">Number</option>
                          <option value="boolean">Boolean</option>
                          <option value="select">Select</option>
                          <option value="multiselect">Multi-select</option>
                        </select>
                        <button
                          onClick={() => handleRemoveAttribute(classItem.id, attr.id)}
                          className={`p-1 rounded transition-colors ${
                            dark ? 'text-red-400 hover:bg-gray-700' : 'text-red-500 hover:bg-red-50'
                          }`}
                        >
                          <X size={12} />
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={attr.required}
                            onChange={(e) => handleUpdateAttribute(classItem.id, attr.id, { required: e.target.checked })}
                            className="mr-1"
                          />
                          Required
                        </label>
                        
                        {(attr.type === 'select' || attr.type === 'multiselect') && (
                          <input
                            type="text"
                            placeholder="Options (comma-separated)"
                            value={attr.options?.join(', ') || ''}
                            onChange={(e) => handleUpdateAttribute(classItem.id, attr.id, { 
                              options: e.target.value.split(',').map(o => o.trim()).filter(Boolean)
                            })}
                            className={`flex-1 px-2 py-1 border rounded ${
                              dark 
                                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Edit Mode */}
            {editingClass === classItem.id && (
              <div className={`ml-6 p-3 rounded-lg border ${
                dark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="space-y-3">
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Name
                    </label>
                    <input
                      type="text"
                      value={classItem.name}
                      onChange={(e) => onUpdateClass(classItem.id, { name: e.target.value })}
                      className={`w-full px-2 py-1 text-sm border rounded ${
                        dark 
                          ? 'bg-gray-800 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Description
                    </label>
                    <input
                      type="text"
                      value={classItem.description || ''}
                      onChange={(e) => onUpdateClass(classItem.id, { description: e.target.value })}
                      className={`w-full px-2 py-1 text-sm border rounded ${
                        dark 
                          ? 'bg-gray-800 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className={`block text-xs font-medium mb-1 ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Hotkey
                      </label>
                      <input
                        type="text"
                        maxLength={1}
                        value={classItem.hotkey || ''}
                        onChange={(e) => onUpdateClass(classItem.id, { hotkey: e.target.value.toUpperCase() })}
                        className={`w-full px-2 py-1 text-sm border rounded ${
                          dark 
                            ? 'bg-gray-800 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                    
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Color
                      </label>
                      <div className="flex gap-1">
                        {colors.map((color) => (
                          <button
                            key={color}
                            onClick={() => onUpdateClass(classItem.id, { color })}
                            className={`w-6 h-6 rounded border-2 ${
                              classItem.color === color ? 'border-white shadow-lg' : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add New Class */}
      {isAdding ? (
        <div className={`p-3 border-2 border-dashed rounded-lg ${
          dark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'
        }`}>
          <div className="space-y-3">
            <input
              type="text"
              value={newClass.name}
              onChange={(e) => setNewClass(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Class name"
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                dark 
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              autoFocus
            />
            
            <input
              type="text"
              value={newClass.description}
              onChange={(e) => setNewClass(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Description (optional)"
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                dark 
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
            
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={1}
                value={newClass.hotkey}
                onChange={(e) => setNewClass(prev => ({ ...prev, hotkey: e.target.value.toUpperCase() }))}
                placeholder="Key"
                className={`w-16 px-2 py-2 border rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  dark 
                    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
              
              <div className="flex gap-1">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewClass(prev => ({ ...prev, color }))}
                    className={`w-8 h-8 rounded border-2 ${
                      newClass.color === color ? 'border-white shadow-lg' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleAddClass}
                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Add Class
              </button>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setNewClass({
                    name: '',
                    color: '#3b82f6',
                    description: '',
                    hotkey: '',
                    attributes: []
                  });
                }}
                className={`px-3 py-2 border rounded hover:bg-gray-50 transition-colors text-sm ${
                  dark 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-600'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className={`w-full flex items-center justify-center gap-2 px-3 py-3 border-2 border-dashed rounded-lg transition-colors ${
            dark 
              ? 'border-gray-600 text-gray-400 hover:border-blue-400 hover:text-blue-400 hover:bg-gray-700'
              : 'border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50'
          }`}
        >
          <Plus size={16} />
          <span className="text-sm font-medium">Add New Class</span>
        </button>
      )}
    </div>
  );
}