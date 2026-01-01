import React from 'react';
import { ZoomIn, Move, MousePointer } from 'lucide-react';

interface Annotation {
  type: string;
  label: string;
  id: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

interface StatusBarProps {
  tool: string;
  scale: number;
  mousePos?: { x: number; y: number };
  polygonPoints: number;
  selectedAnnotation?: Annotation | null;
  annotationCount: number;
  visibleCount: number;
  lockedCount: number;
}

export default function StatusBar({ 
  tool, 
  scale, 
  mousePos, 
  polygonPoints, 
  selectedAnnotation,
  annotationCount,
  visibleCount,
  lockedCount
}: StatusBarProps) {
  const getToolIcon = () => {
    switch (tool) {
      case 'zoom': return <ZoomIn size={14} />;
      case 'pan': return <Move size={14} />;
      default: return <MousePointer size={14} />;
    }
  };

  return (
    <div className="bg-gray-800 text-white px-4 py-2 flex items-center justify-between text-sm border-t border-gray-700">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {getToolIcon()}
          <span className="capitalize font-medium">{tool}</span>
        </div>
        
        <div className="text-gray-300">
          Annotations: {annotationCount} ({visibleCount} visible, {lockedCount} locked)
        </div>
        
        <div className="text-gray-300">
          Zoom: {Math.round(scale * 100)}%
        </div>
        
        {mousePos && (
          <div className="text-gray-300">
            X: {Math.round(mousePos.x)}, Y: {Math.round(mousePos.y)}
          </div>
        )}
        
        {polygonPoints > 0 && (
          <div className="text-yellow-300">
            Points: {polygonPoints} (Double-click to finish)
          </div>
        )}
        
        {selectedAnnotation && (
          <div className="text-green-300">
            Selected: {selectedAnnotation.type} - {selectedAnnotation.label}
          </div>
        )}
      </div>
      
      <div className="text-gray-400 text-xs">
        Press F1 for help
      </div>
    </div>
  );
}