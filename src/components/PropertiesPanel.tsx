import React, { useState } from 'react';
import { 
  Palette, 
  Sliders, 
  Type, 
  Tag, 
  Info, 
  Clock, 
  User,
  Hash,
  Percent,
  Eye,
  Lock,
  Star
} from 'lucide-react';
import { Annotation, AnnotationClass } from '../types';

interface PropertiesPanelProps {
  selectedAnnotation: Annotation | null;
  annotationClasses: AnnotationClass[];
  onUpdateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  dark?: boolean;
}

export default function PropertiesPanel({
  selectedAnnotation,
  annotationClasses,
  onUpdateAnnotation,
  dark = false
}: PropertiesPanelProps) {
  const [activeTab, setActiveTab] = useState<'style' | 'attributes' | 'info'>('style');

  if (!selectedAnnotation) {
    return (
      <div className={`w-80 ${dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-l p-4`}>
        <div className={`text-center py-8 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
          <Info size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-sm">Select an annotation to view properties</p>
        </div>
      </div>
    );
  }

  const selectedClass = annotationClasses.find(cls => cls.name === selectedAnnotation.label);

  const tabs = [
    { id: 'style', label: 'Style', icon: Palette },
    { id: 'attributes', label: 'Attributes', icon: Tag },
    { id: 'info', label: 'Info', icon: Info }
  ];

  const handleStyleUpdate = (property: string, value: any) => {
    onUpdateAnnotation(selectedAnnotation.id, { [property]: value });
  };

  const handleAttributeUpdate = (key: string, value: any) => {
    const attributes = { ...selectedAnnotation.attributes, [key]: value };
    onUpdateAnnotation(selectedAnnotation.id, { attributes });
  };

  return (
    <div className={`w-80 ${dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-l flex flex-col`}>
      {/* Header */}
      <div className={`p-4 border-b ${dark ? 'border-gray-700' : 'border-gray-200'}`}>
        <h3 className={`font-semibold ${dark ? 'text-white' : 'text-gray-800'} mb-2`}>
          Properties
        </h3>
        <div className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
          {selectedAnnotation.type} - {selectedAnnotation.label}
        </div>
      </div>

      {/* Tabs */}
      <div className={`flex border-b ${dark ? 'border-gray-700' : 'border-gray-200'}`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? dark 
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-100 text-blue-800 border-b-2 border-blue-600'
                : dark
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'style' && (
          <div className="space-y-6">
            {/* Color */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
                Color
              </label>
              <div className="flex gap-2 flex-wrap">
                {['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280'].map((color) => (
                  <button
                    key={color}
                    onClick={() => handleStyleUpdate('color', color)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      selectedAnnotation.color === color 
                        ? 'border-white shadow-lg scale-110' 
                        : dark ? 'border-gray-600' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Stroke Width */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
                Stroke Width: {selectedAnnotation.strokeWidth || 2}px
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={selectedAnnotation.strokeWidth || 2}
                onChange={(e) => handleStyleUpdate('strokeWidth', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Fill Opacity */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
                Fill Opacity: {Math.round((selectedAnnotation.fillOpacity || 0.2) * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={selectedAnnotation.fillOpacity || 0.2}
                onChange={(e) => handleStyleUpdate('fillOpacity', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Font Size (for text) */}
            {selectedAnnotation.type === 'text' && (
              <div>
                <label className={`block text-sm font-medium mb-2 ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Font Size: {selectedAnnotation.fontSize || 16}px
                </label>
                <input
                  type="range"
                  min="8"
                  max="72"
                  value={selectedAnnotation.fontSize || 16}
                  onChange={(e) => handleStyleUpdate('fontSize', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            )}

            {/* Confidence */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
                Confidence: {Math.round((selectedAnnotation.confidence || 1) * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={selectedAnnotation.confidence || 1}
                onChange={(e) => handleStyleUpdate('confidence', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        )}

        {activeTab === 'attributes' && (
          <div className="space-y-4">
            {/* Class Selection */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
                Class
              </label>
              <select
                value={selectedAnnotation.label}
                onChange={(e) => handleStyleUpdate('label', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  dark 
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {annotationClasses.map((cls) => (
                  <option key={cls.id} value={cls.name}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Dynamic Attributes */}
            {selectedClass?.attributes?.map((attr) => (
              <div key={attr.id}>
                <label className={`block text-sm font-medium mb-2 ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {attr.name} {attr.required && <span className="text-red-500">*</span>}
                </label>
                
                {attr.type === 'text' && (
                  <input
                    type="text"
                    value={selectedAnnotation.attributes?.[attr.name] || ''}
                    onChange={(e) => handleAttributeUpdate(attr.name, e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      dark 
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                )}
                
                {attr.type === 'number' && (
                  <input
                    type="number"
                    value={selectedAnnotation.attributes?.[attr.name] || ''}
                    onChange={(e) => handleAttributeUpdate(attr.name, parseFloat(e.target.value))}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      dark 
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                )}
                
                {attr.type === 'boolean' && (
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedAnnotation.attributes?.[attr.name] || false}
                      onChange={(e) => handleAttributeUpdate(attr.name, e.target.checked)}
                      className="mr-2"
                    />
                    <span className={`text-sm ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {attr.name}
                    </span>
                  </label>
                )}
                
                {attr.type === 'select' && (
                  <select
                    value={selectedAnnotation.attributes?.[attr.name] || ''}
                    onChange={(e) => handleAttributeUpdate(attr.name, e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      dark 
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="">Select...</option>
                    {attr.options?.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ))}

            {/* Tags */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
                Tags
              </label>
              <input
                type="text"
                value={selectedAnnotation.tags?.join(', ') || ''}
                onChange={(e) => handleStyleUpdate('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                placeholder="Enter tags separated by commas"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  dark 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
          </div>
        )}

        {activeTab === 'info' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-3 rounded-lg ${dark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Hash size={16} className={dark ? 'text-gray-400' : 'text-gray-600'} />
                  <span className={`text-xs font-medium ${dark ? 'text-gray-400' : 'text-gray-600'}`}>ID</span>
                </div>
                <div className={`text-sm font-mono ${dark ? 'text-white' : 'text-gray-900'}`}>
                  {selectedAnnotation.id.slice(0, 8)}...
                </div>
              </div>
              
              <div className={`p-3 rounded-lg ${dark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Type size={16} className={dark ? 'text-gray-400' : 'text-gray-600'} />
                  <span className={`text-xs font-medium ${dark ? 'text-gray-400' : 'text-gray-600'}`}>Type</span>
                </div>
                <div className={`text-sm capitalize ${dark ? 'text-white' : 'text-gray-900'}`}>
                  {selectedAnnotation.type}
                </div>
              </div>
            </div>

            <div className={`p-3 rounded-lg ${dark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-2 mb-1">
                <Clock size={16} className={dark ? 'text-gray-400' : 'text-gray-600'} />
                <span className={`text-xs font-medium ${dark ? 'text-gray-400' : 'text-gray-600'}`}>Created</span>
              </div>
              <div className={`text-sm ${dark ? 'text-white' : 'text-gray-900'}`}>
                {selectedAnnotation.createdAt.toLocaleString()}
              </div>
            </div>

            <div className={`p-3 rounded-lg ${dark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-2 mb-1">
                <Clock size={16} className={dark ? 'text-gray-400' : 'text-gray-600'} />
                <span className={`text-xs font-medium ${dark ? 'text-gray-400' : 'text-gray-600'}`}>Modified</span>
              </div>
              <div className={`text-sm ${dark ? 'text-white' : 'text-gray-900'}`}>
                {selectedAnnotation.updatedAt.toLocaleString()}
              </div>
            </div>

            {selectedAnnotation.createdBy && (
              <div className={`p-3 rounded-lg ${dark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <User size={16} className={dark ? 'text-gray-400' : 'text-gray-600'} />
                  <span className={`text-xs font-medium ${dark ? 'text-gray-400' : 'text-gray-600'}`}>Created By</span>
                </div>
                <div className={`text-sm ${dark ? 'text-white' : 'text-gray-900'}`}>
                  {selectedAnnotation.createdBy}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <div className={`flex-1 p-3 rounded-lg ${dark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Eye size={16} className={dark ? 'text-gray-400' : 'text-gray-600'} />
                  <span className={`text-xs font-medium ${dark ? 'text-gray-400' : 'text-gray-600'}`}>Visible</span>
                </div>
                <div className={`text-sm ${dark ? 'text-white' : 'text-gray-900'}`}>
                  {selectedAnnotation.visible ? 'Yes' : 'No'}
                </div>
              </div>
              
              <div className={`flex-1 p-3 rounded-lg ${dark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Lock size={16} className={dark ? 'text-gray-400' : 'text-gray-600'} />
                  <span className={`text-xs font-medium ${dark ? 'text-gray-400' : 'text-gray-600'}`}>Locked</span>
                </div>
                <div className={`text-sm ${dark ? 'text-white' : 'text-gray-900'}`}>
                  {selectedAnnotation.locked ? 'Yes' : 'No'}
                </div>
              </div>
            </div>

            {selectedAnnotation.confidence && (
              <div className={`p-3 rounded-lg ${dark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Star size={16} className={dark ? 'text-gray-400' : 'text-gray-600'} />
                  <span className={`text-xs font-medium ${dark ? 'text-gray-400' : 'text-gray-600'}`}>Confidence</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`text-sm ${dark ? 'text-white' : 'text-gray-900'}`}>
                    {Math.round(selectedAnnotation.confidence * 100)}%
                  </div>
                  <div className={`flex-1 h-2 rounded-full ${dark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                    <div 
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${selectedAnnotation.confidence * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}