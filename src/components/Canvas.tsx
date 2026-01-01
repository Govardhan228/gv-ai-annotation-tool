import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

interface CanvasProps {
  width: number;
  height: number;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  onWheel: (e: React.WheelEvent) => void;
  drawFunction: (ctx: CanvasRenderingContext2D) => void;
}

export interface CanvasRef {
  getContext: () => CanvasRenderingContext2D | null;
}

const Canvas = forwardRef<CanvasRef, CanvasProps>(({
  width,
  height,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onWheel,
  drawFunction
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useImperativeHandle(ref, () => ({
    getContext: () => canvasRef.current?.getContext('2d') || null
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && canvas.getContext) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = width;
        canvas.height = height;
        drawFunction(ctx);
      }
    }
  }, [width, height, drawFunction]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onWheel={onWheel}
        className="border border-gray-600 rounded cursor-crosshair bg-gray-800"
        style={{ maxWidth: '100%', height: 'auto' }}
      />
      <div className="absolute top-2 right-2 bg-gray-900 bg-opacity-75 text-white px-2 py-1 rounded text-xs">
        {width} × {height}
      </div>
    </div>
  );
});

Canvas.displayName = 'Canvas';

export default Canvas;