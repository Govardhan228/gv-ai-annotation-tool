import React from 'react';
import { Upload, Download, Image, FileText } from 'lucide-react';

interface FileManagerProps {
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  hasImage: boolean;
  annotationCount: number;
}

export default function FileManager({ 
  onImageUpload, 
  onExport, 
  onImport, 
  hasImage, 
  annotationCount 
}: FileManagerProps) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <h3 className="font-semibold text-gray-800 mb-3">File Management</h3>
      
      <div className="space-y-3">
        <div>
          <label className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg cursor-pointer hover:from-blue-700 hover:to-blue-800 transition-all duration-200 hover:scale-105 active:scale-95">
            <Image size={18} />
            <span className="text-sm font-medium">Upload Image</span>
            <input
              type="file"
              accept="image/*"
              onChange={onImageUpload}
              className="hidden"
            />
          </label>
          {hasImage && (
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Image loaded
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onExport}
            disabled={annotationCount === 0}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95 disabled:hover:scale-100"
          >
            <Download size={16} />
            <span className="text-sm font-medium">Export...</span>
          </button>
          
          <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-purple-600 text-white rounded-lg cursor-pointer hover:bg-purple-700 transition-all duration-200 hover:scale-105 active:scale-95">
            <Upload size={16} />
            <span className="text-sm font-medium">Import</span>
            <input
              type="file"
              accept=".json"
              onChange={onImport}
              className="hidden"
            />
          </label>
        </div>

        {annotationCount > 0 && (
          <div className="text-xs text-gray-500 text-center">
            {annotationCount} annotation{annotationCount !== 1 ? 's' : ''} • Multiple formats available
          </div>
        )}
      </div>
    </div>
  );
}