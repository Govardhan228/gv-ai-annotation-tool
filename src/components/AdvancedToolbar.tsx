import React from 'react';
import { MousePointer, Square, Circle, Pentagon, Minus, Type, ZoomIn, Move, ArrowRight, CircleEllipsis as Ellipsis, PenTool, MapPin, Ruler, Spline, Wand2, Scissors, RotateCcw, RotateCw, FlipHorizontal, FlipVertical, Copy, Trash2, Lock, Unlock, Eye, EyeOff, Layers, Palette } from 'lucide-react';
import ToolButton from './ToolButton';
import { AnnotationTool } from '../types';

interface AdvancedToolbarProps {
  tool: AnnotationTool;
  onToolChange: (tool: AnnotationTool) => void;
  selectedAnnotation: string | null;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleLock: () => void;
  onToggleVisibility: () => void;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onFlipHorizontal: () => void;
  onFlipVertical: () => void;
  dark?: boolean;
}

export default function AdvancedToolbar({
  tool,
  onToolChange,
  selectedAnnotation,
  onDuplicate,
  onDelete,
  onToggleLock,
  onToggleVisibility,
  onRotateLeft,
  onRotateRight,
  onFlipHorizontal,
  onFlipVertical,
  dark = false
}: AdvancedToolbarProps) {
  const toolGroups = [
    {
      name: 'Selection',
      tools: [
        { id: 'select', icon: MousePointer, label: 'Select', hotkey: 'S' },
      ]
    },
    {
      name: 'Bounding Annotations',
      tools: [
        { id: 'bounding-box', icon: Square, label: 'Bounding Box', hotkey: 'B' },
        { id: 'circle', icon: Circle, label: 'Circle', hotkey: 'C' },
        { id: 'ellipse', icon: Ellipsis, label: 'Ellipse', hotkey: 'E' },
      ]
    },
    {
      name: 'Vector Annotations',
      tools: [
        { id: 'polygon', icon: Pentagon, label: 'Polygon', hotkey: 'P' },
        { id: 'polyline', icon: Minus, label: 'Polyline', hotkey: 'L' },
        { id: 'line', icon: Minus, label: 'Line', hotkey: 'I' },
        { id: 'arrow', icon: ArrowRight, label: 'Arrow', hotkey: 'A' },
      ]
    },
    {
      name: 'Specialized',
      tools: [
        { id: 'keypoints', icon: MapPin, label: 'Key Points', hotkey: 'K' },
        { id: 'cuboid', icon: Square, label: 'Cuboid', hotkey: 'U' },
        { id: 'cuboid-3d', icon: Square, label: '3D Cuboid', hotkey: '3' },
        { id: 'freehand', icon: PenTool, label: 'Freehand', hotkey: 'F' },
      ]
    },
    {
      name: 'Text & Points',
      tools: [
        { id: 'text', icon: Type, label: 'Text', hotkey: 'T' },
        { id: 'point', icon: MapPin, label: 'Point', hotkey: 'O' },
      ]
    },
    {
      name: 'Measurement',
      tools: [
        { id: 'measurement', icon: Ruler, label: 'Measure', hotkey: 'M' },
      ]
    },
    {
      name: 'AI Tools',
      tools: [
        { id: 'magic-wand', icon: Wand2, label: 'Magic Wand', hotkey: 'W' },
        { id: 'auto-segment', icon: Scissors, label: 'Auto Segment', hotkey: 'G' },
      ]
    },
    {
      name: 'Navigation',
      tools: [
        { id: 'zoom', icon: ZoomIn, label: 'Zoom', hotkey: 'Z' },
        { id: 'pan', icon: Move, label: 'Pan', hotkey: 'H' },
      ]
    }
  ];

  return (
    <div className={`${dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r w-16 flex flex-col`}>
      {/* Tool Groups */}
      <div className="flex-1 overflow-y-auto py-2">
        {toolGroups.map((group, groupIndex) => (
          <div key={group.name} className="mb-4">
            {groupIndex > 0 && (
              <div className={`mx-2 mb-2 border-t ${dark ? 'border-gray-700' : 'border-gray-200'}`} />
            )}
            <div className="space-y-1 px-2">
              {group.tools.map((toolItem) => (
                <ToolButton
                  key={toolItem.id}
                  icon={toolItem.icon}
                  label={`${toolItem.label} (${toolItem.hotkey})`}
                  isActive={tool === toolItem.id}
                  onClick={() => onToolChange(toolItem.id as AnnotationTool)}
                  compact
                  dark={dark}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Annotation Actions */}
      {selectedAnnotation && (
        <div className={`border-t ${dark ? 'border-gray-700' : 'border-gray-200'} p-2 space-y-1`}>
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={onDuplicate}
              className={`p-2 rounded transition-colors ${
                dark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
              }`}
              title="Duplicate"
            >
              <Copy size={14} />
            </button>
            <button
              onClick={onDelete}
              className={`p-2 rounded transition-colors ${
                dark ? 'hover:bg-gray-700 text-red-400' : 'hover:bg-gray-100 text-red-600'
              }`}
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
            <button
              onClick={onToggleLock}
              className={`p-2 rounded transition-colors ${
                dark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
              }`}
              title="Toggle Lock"
            >
              <Lock size={14} />
            </button>
            <button
              onClick={onToggleVisibility}
              className={`p-2 rounded transition-colors ${
                dark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
              }`}
              title="Toggle Visibility"
            >
              <Eye size={14} />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={onRotateLeft}
              className={`p-2 rounded transition-colors ${
                dark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
              }`}
              title="Rotate Left"
            >
              <RotateCcw size={14} />
            </button>
            <button
              onClick={onRotateRight}
              className={`p-2 rounded transition-colors ${
                dark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
              }`}
              title="Rotate Right"
            >
              <RotateCw size={14} />
            </button>
            <button
              onClick={onFlipHorizontal}
              className={`p-2 rounded transition-colors ${
                dark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
              }`}
              title="Flip Horizontal"
            >
              <FlipHorizontal size={14} />
            </button>
            <button
              onClick={onFlipVertical}
              className={`p-2 rounded transition-colors ${
                dark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
              }`}
              title="Flip Vertical"
            >
              <FlipVertical size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}