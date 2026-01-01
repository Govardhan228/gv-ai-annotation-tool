import React from 'react';

interface Annotation {
  id: string;
  text: string;
  x: number;
  y: number;
  timestamp: Date;
}

interface AnnotationListProps {
  annotations: Annotation[];
  onAnnotationSelect?: (annotation: Annotation) => void;
  onAnnotationDelete?: (id: string) => void;
}

export const AnnotationList: React.FC<AnnotationListProps> = ({
  annotations,
  onAnnotationSelect,
  onAnnotationDelete
}) => {
  if (annotations.length === 0) {
    return (
      <div className="p-4 text-gray-500 text-center">
        No annotations yet
      </div>
    );
  }

  return (
    <div className="space-y-2 p-4">
      {annotations.map((annotation) => (
        <div
          key={annotation.id}
          className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onAnnotationSelect?.(annotation)}
        >
          <div className="text-sm text-gray-900 mb-1">
            {annotation.text}
          </div>
          <div className="text-xs text-gray-500 flex justify-between items-center">
            <span>
              Position: ({annotation.x}, {annotation.y})
            </span>
            <span>
              {annotation.timestamp.toLocaleTimeString()}
            </span>
          </div>
          {onAnnotationDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAnnotationDelete(annotation.id);
              }}
              className="mt-2 text-xs text-red-600 hover:text-red-800"
            >
              Delete
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default AnnotationList;