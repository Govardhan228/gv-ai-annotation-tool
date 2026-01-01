import React, { useState } from 'react';
import { Plus, Tag, X } from 'lucide-react';

interface ClassManagerProps {
  classList: string[];
  selectedClass: string;
  onClassSelect: (className: string) => void;
  onAddClass: (className: string) => void;
  onRemoveClass: (className: string) => void;
  dark?: boolean;
}

export default function ClassManager({ 
  classList, 
  selectedClass, 
  onClassSelect, 
  onAddClass, 
  onRemoveClass,
  dark = false
}: ClassManagerProps) {
  const [newClass, setNewClass] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddClass = () => {
    if (newClass.trim() && !classList.includes(newClass.trim())) {
      onAddClass(newClass.trim());
      setNewClass('');
      setIsAdding(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddClass();
    } else if (e.key === 'Escape') {
      setNewClass('');
      setIsAdding(false);
    }
  };

  return (
    <div className={`${dark ? 'bg-gray-800' : 'bg-white'} ${dark ? '' : 'rounded-xl shadow-sm border border-gray-100'} p-4`}>
      <div className="flex items-center gap-2 mb-3">
        <Tag size={18} className={dark ? 'text-gray-400' : 'text-gray-600'} />
        <h3 className={`font-semibold ${dark ? 'text-white' : 'text-gray-800'}`}>Classes</h3>
      </div>
      
      <div className="space-y-2 mb-3">
        {classList.map((className) => (
          <div key={className} className="flex items-center gap-2">
            <button
              onClick={() => onClassSelect(className)}
              className={`flex-1 text-left px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                selectedClass === className
                  ? dark 
                    ? 'bg-blue-600 text-white border border-blue-500'
                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                  : dark
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-transparent'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-transparent'
              }`}
            >
              {className}
            </button>
            {classList.length > 1 && (
              <button
                onClick={() => onRemoveClass(className)}
                className={`p-1.5 rounded transition-colors ${
                  dark 
                    ? 'text-gray-400 hover:text-red-400 hover:bg-gray-700'
                    : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                }`}
              >
                <X size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      {isAdding ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={newClass}
            onChange={(e) => setNewClass(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Enter class name"
            className={`flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              dark 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                : 'bg-white border-gray-200 text-gray-900'
            }`}
            autoFocus
          />
          <button
            onClick={handleAddClass}
            className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className={`w-full flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed rounded-lg transition-colors ${
            dark 
              ? 'border-gray-600 text-gray-400 hover:border-blue-400 hover:text-blue-400'
              : 'border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600'
          }`}
        >
          <Plus size={16} />
          <span className="text-sm font-medium">Add Class</span>
        </button>
      )}
    </div>
  );
}