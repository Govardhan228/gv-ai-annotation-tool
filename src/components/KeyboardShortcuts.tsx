import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsProps {
  onClose: () => void;
  dark?: boolean;
}

export default function KeyboardShortcuts({ onClose, dark = false }: KeyboardShortcutsProps) {
  const shortcuts = [
    { category: 'Tools', items: [
      { key: 'B', description: 'Bounding Box tool' },
      { key: 'C', description: 'Circle tool' },
      { key: 'E', description: 'Ellipse tool' },
      { key: 'P', description: 'Polygon tool' },
      { key: 'L', description: 'Polyline tool' },
      { key: 'K', description: 'Key Points tool' },
      { key: 'U', description: 'Cuboid tool' },
      { key: '3', description: '3D Cuboid tool' },
      { key: 'A', description: 'Arrow tool' },
      { key: 'I', description: 'Line tool' },
      { key: 'F', description: 'Freehand tool' },
      { key: 'O', description: 'Point tool' },
      { key: 'T', description: 'Text tool' },
      { key: 'S', description: 'Select tool' },
      { key: 'Z', description: 'Zoom tool' },
      { key: 'H', description: 'Pan tool' },
      { key: 'M', description: 'Measurement tool' },
      { key: 'W', description: 'Magic wand tool' },
      { key: 'G', description: 'Auto segment tool' },
      { key: 'G', description: 'Toggle grid' },
      { key: 'V', description: 'Toggle all visibility' },
    ]},
    { category: 'File Operations', items: [
      { key: 'Ctrl + O', description: 'Open image' },
      { key: 'Ctrl + S', description: 'Save annotations' },
      { key: 'Ctrl + E', description: 'Export annotations' },
      { key: 'Ctrl + I', description: 'Import annotations' },
    ]},
    { category: 'View & Navigation', items: [
      { key: 'Ctrl + +', description: 'Zoom in' },
      { key: 'Ctrl + -', description: 'Zoom out' },
      { key: 'Ctrl + 0', description: 'Reset zoom' },
      { key: 'Mouse wheel', description: 'Zoom (with Ctrl)' },
      { key: 'Space + Drag', description: 'Pan view' },
      { key: 'Fit to Screen', description: 'F' },
    ]},
    { category: 'Editing', items: [
      { key: 'Ctrl + C', description: 'Copy selected annotation' },
      { key: 'Ctrl + V', description: 'Paste annotation' },
      { key: 'Ctrl + D', description: 'Duplicate annotation' },
      { key: 'Ctrl + Z', description: 'Undo last action' },
      { key: 'Ctrl + Y', description: 'Redo action' },
      { key: 'Ctrl + A', description: 'Select all' },
      { key: 'Delete', description: 'Delete selected annotation' },
      { key: 'Backspace', description: 'Delete selected annotation' },
      { key: 'Ctrl + L', description: 'Lock/unlock annotation' },
      { key: 'Ctrl + H', description: 'Hide/show annotation' },
    ]},
    { category: 'Transform', items: [
      { key: 'Ctrl + R', description: 'Rotate right' },
      { key: 'Ctrl + Shift + R', description: 'Rotate left' },
      { key: 'Ctrl + F', description: 'Flip horizontal' },
      { key: 'Ctrl + Shift + F', description: 'Flip vertical' },
      { key: 'Arrow Keys', description: 'Move annotation' },
      { key: 'Shift + Arrow', description: 'Move annotation (fine)' },
    ]},
    { category: 'General', items: [
      { key: 'Escape', description: 'Cancel current action' },
      { key: 'F1', description: 'Show/hide shortcuts' },
      { key: 'Double-click', description: 'Finish polygon/polyline' },
      { key: 'Enter', description: 'Confirm current action' },
      { key: 'Tab', description: 'Switch between tools' },
    ]},
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${dark ? 'bg-gray-800 border border-gray-700' : 'bg-white'} rounded-xl p-6 shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Keyboard className={dark ? 'text-blue-400' : 'text-blue-600'} size={24} />
            <h3 className={`text-xl font-semibold ${dark ? 'text-white' : 'text-gray-800'}`}>Keyboard Shortcuts</h3>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              dark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {shortcuts.map((section) => (
            <div key={section.category} className="space-y-3">
              <h4 className={`font-semibold ${dark ? 'text-gray-300 border-gray-600' : 'text-gray-700 border-gray-200'} border-b pb-2`}>
                {section.category}
              </h4>
              <div className="space-y-2">
                {section.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-600'}`}>{item.description}</span>
                    <kbd className={`px-2 py-1 border rounded text-xs font-mono ${
                      dark 
                        ? 'bg-gray-700 border-gray-600 text-gray-300'
                        : 'bg-gray-100 border-gray-300 text-gray-700'
                    }`}>
                      {item.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className={`mt-6 p-4 rounded-lg ${dark ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
          <p className={`text-sm ${dark ? 'text-blue-300' : 'text-blue-800'}`}>
            <strong>Pro Tip:</strong> Hold Ctrl while using the mouse wheel to zoom in/out at the cursor position.
            Use the select tool to drag annotations, resize rectangles with 8 control handles, and edit polygon/polyline nodes.
          </p>
        </div>
      </div>
    </div>
  );
}