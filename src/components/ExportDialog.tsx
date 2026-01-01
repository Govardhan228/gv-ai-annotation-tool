import React, { useState } from 'react';
import { 
  X, 
  Download, 
  FileText, 
  Image, 
  Database, 
  Code, 
  Package,
  Settings,
  Check
} from 'lucide-react';
import { Annotation, ExportFormat } from '../types';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  annotations: Annotation[];
  imageName?: string;
  dark?: boolean;
}

export default function ExportDialog({
  isOpen,
  onClose,
  annotations,
  imageName,
  dark = false
}: ExportDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<string>('json');
  const [exportOptions, setExportOptions] = useState({
    includeMetadata: true,
    includeAttributes: true,
    includeConfidence: true,
    coordinateSystem: 'absolute', // 'absolute' | 'relative'
    imageInfo: true,
    prettyFormat: true
  });

  const exportFormats: ExportFormat[] = [
    {
      id: 'json',
      name: 'JSON',
      extension: 'json',
      description: 'Standard JSON format with full annotation data',
      supportsImages: false,
      supportsAnnotations: true
    },
    {
      id: 'coco',
      name: 'COCO Format',
      extension: 'json',
      description: 'Microsoft COCO dataset format',
      supportsImages: true,
      supportsAnnotations: true
    },
    {
      id: 'yolo',
      name: 'YOLO',
      extension: 'txt',
      description: 'YOLO training format (one file per image)',
      supportsImages: false,
      supportsAnnotations: true
    },
    {
      id: 'pascal-voc',
      name: 'Pascal VOC',
      extension: 'xml',
      description: 'Pascal VOC XML format',
      supportsImages: true,
      supportsAnnotations: true
    },
    {
      id: 'csv',
      name: 'CSV',
      extension: 'csv',
      description: 'Comma-separated values format',
      supportsImages: false,
      supportsAnnotations: true
    },
    {
      id: 'labelme',
      name: 'LabelMe',
      extension: 'json',
      description: 'LabelMe annotation format',
      supportsImages: true,
      supportsAnnotations: true
    },
    {
      id: 'tensorflow',
      name: 'TensorFlow Record',
      extension: 'tfrecord',
      description: 'TensorFlow training format',
      supportsImages: true,
      supportsAnnotations: true
    }
  ];

  if (!isOpen) return null;

  const handleExport = () => {
    const format = exportFormats.find(f => f.id === selectedFormat);
    if (!format) return;

    let exportData: any;
    let filename = `annotations.${format.extension}`;

    switch (selectedFormat) {
      case 'json':
        exportData = {
          ...(exportOptions.imageInfo && imageName && { image: imageName }),
          annotations: annotations.map(ann => ({
            id: ann.id,
            type: ann.type,
            label: ann.label,
            points: exportOptions.coordinateSystem === 'relative' 
              ? ann.points.map(p => ({ x: p.x / 1000, y: p.y / 1000 })) // Assuming 1000x1000 canvas
              : ann.points,
            ...(exportOptions.includeMetadata && {
              visible: ann.visible,
              locked: ann.locked,
              createdAt: ann.createdAt,
              updatedAt: ann.updatedAt
            }),
            ...(exportOptions.includeAttributes && ann.attributes && { attributes: ann.attributes }),
            ...(exportOptions.includeConfidence && ann.confidence && { confidence: ann.confidence }),
            ...(ann.text && { text: ann.text }),
            ...(ann.fontSize && { fontSize: ann.fontSize }),
            ...(ann.color && { color: ann.color }),
            ...(ann.strokeWidth && { strokeWidth: ann.strokeWidth }),
            ...(ann.fillOpacity && { fillOpacity: ann.fillOpacity }),
            ...(ann.tags && { tags: ann.tags })
          })),
          exportOptions,
          exportedAt: new Date().toISOString()
        };
        break;

      case 'coco':
        exportData = {
          info: {
            description: "GV.AI Annotation Export",
            version: "1.0",
            year: new Date().getFullYear(),
            contributor: "GV.AI",
            date_created: new Date().toISOString()
          },
          licenses: [],
          images: imageName ? [{
            id: 1,
            width: 1000, // You might want to get actual image dimensions
            height: 1000,
            file_name: imageName,
            license: 0,
            flickr_url: "",
            coco_url: "",
            date_captured: new Date().toISOString()
          }] : [],
          annotations: annotations.map((ann, index) => ({
            id: index + 1,
            image_id: 1,
            category_id: 1, // You might want to map labels to category IDs
            segmentation: ann.type === 'polygon' ? [ann.points.flatMap(p => [p.x, p.y])] : [],
            area: ann.type === 'rectangle' && ann.points.length >= 2 
              ? Math.abs((ann.points[1].x - ann.points[0].x) * (ann.points[1].y - ann.points[0].y))
              : 0,
            bbox: ann.type === 'rectangle' && ann.points.length >= 2
              ? [
                  Math.min(ann.points[0].x, ann.points[1].x),
                  Math.min(ann.points[0].y, ann.points[1].y),
                  Math.abs(ann.points[1].x - ann.points[0].x),
                  Math.abs(ann.points[1].y - ann.points[0].y)
                ]
              : [0, 0, 0, 0],
            iscrowd: 0
          })),
          categories: [{
            id: 1,
            name: "object",
            supercategory: ""
          }]
        };
        break;

      case 'yolo':
        // YOLO format: class_id center_x center_y width height (normalized)
        exportData = annotations
          .filter(ann => ann.type === 'rectangle' && ann.points.length >= 2)
          .map(ann => {
            const [p1, p2] = ann.points;
            const centerX = (p1.x + p2.x) / 2 / 1000; // Normalize to 0-1
            const centerY = (p1.y + p2.y) / 2 / 1000;
            const width = Math.abs(p2.x - p1.x) / 1000;
            const height = Math.abs(p2.y - p1.y) / 1000;
            return `0 ${centerX} ${centerY} ${width} ${height}`;
          })
          .join('\n');
        filename = `${imageName?.split('.')[0] || 'annotations'}.txt`;
        break;

      case 'csv':
        const csvHeaders = [
          'id', 'type', 'label', 'x1', 'y1', 'x2', 'y2', 'points_count',
          ...(exportOptions.includeConfidence ? ['confidence'] : []),
          ...(exportOptions.includeMetadata ? ['visible', 'locked', 'created_at'] : [])
        ];
        
        const csvRows = annotations.map(ann => [
          ann.id,
          ann.type,
          ann.label,
          ann.points[0]?.x || '',
          ann.points[0]?.y || '',
          ann.points[1]?.x || '',
          ann.points[1]?.y || '',
          ann.points.length,
          ...(exportOptions.includeConfidence ? [ann.confidence || ''] : []),
          ...(exportOptions.includeMetadata ? [ann.visible, ann.locked, ann.createdAt.toISOString()] : [])
        ]);

        exportData = [csvHeaders, ...csvRows]
          .map(row => row.map(cell => `"${cell}"`).join(','))
          .join('\n');
        break;

      default:
        exportData = JSON.stringify(annotations, null, exportOptions.prettyFormat ? 2 : 0);
    }

    // Create and download file
    const blob = new Blob([
      typeof exportData === 'string' ? exportData : JSON.stringify(exportData, null, exportOptions.prettyFormat ? 2 : 0)
    ], { 
      type: selectedFormat === 'csv' ? 'text/csv' : 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${dark ? 'bg-gray-800 border border-gray-700' : 'bg-white'} rounded-xl p-6 shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Download className={dark ? 'text-blue-400' : 'text-blue-600'} size={24} />
            <h3 className={`text-xl font-semibold ${dark ? 'text-white' : 'text-gray-800'}`}>
              Export Annotations
            </h3>
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
          {/* Format Selection */}
          <div>
            <h4 className={`font-semibold mb-3 ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
              Export Format
            </h4>
            <div className="space-y-2">
              {exportFormats.map((format) => (
                <label
                  key={format.id}
                  className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedFormat === format.id
                      ? dark 
                        ? 'bg-blue-900/30 border-blue-500'
                        : 'bg-blue-50 border-blue-200'
                      : dark
                        ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="format"
                    value={format.id}
                    checked={selectedFormat === format.id}
                    onChange={(e) => setSelectedFormat(e.target.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>
                        {format.name}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        dark ? 'bg-gray-600 text-gray-300' : 'bg-gray-100 text-gray-600'
                      }`}>
                        .{format.extension}
                      </span>
                    </div>
                    <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {format.description}
                    </p>
                    <div className="flex gap-2 mt-2">
                      {format.supportsImages && (
                        <span className={`text-xs px-2 py-1 rounded ${
                          dark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'
                        }`}>
                          Images
                        </span>
                      )}
                      {format.supportsAnnotations && (
                        <span className={`text-xs px-2 py-1 rounded ${
                          dark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700'
                        }`}>
                          Annotations
                        </span>
                      )}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Export Options */}
          <div>
            <h4 className={`font-semibold mb-3 ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
              Export Options
            </h4>
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={exportOptions.includeMetadata}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, includeMetadata: e.target.checked }))}
                />
                <span className={`text-sm ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Include metadata (visibility, lock status, timestamps)
                </span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={exportOptions.includeAttributes}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, includeAttributes: e.target.checked }))}
                />
                <span className={`text-sm ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Include custom attributes
                </span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={exportOptions.includeConfidence}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, includeConfidence: e.target.checked }))}
                />
                <span className={`text-sm ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Include confidence scores
                </span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={exportOptions.imageInfo}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, imageInfo: e.target.checked }))}
                />
                <span className={`text-sm ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Include image information
                </span>
              </label>

              <div>
                <label className={`block text-sm font-medium mb-2 ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Coordinate System
                </label>
                <select
                  value={exportOptions.coordinateSystem}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, coordinateSystem: e.target.value as any }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    dark 
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="absolute">Absolute coordinates</option>
                  <option value="relative">Relative coordinates (0-1)</option>
                </select>
              </div>

              {selectedFormat === 'json' && (
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={exportOptions.prettyFormat}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, prettyFormat: e.target.checked }))}
                  />
                  <span className={`text-sm ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Pretty format (indented JSON)
                  </span>
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className={`mt-6 p-4 rounded-lg ${dark ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="flex items-center gap-2 mb-2">
            <Package size={16} className={dark ? 'text-gray-400' : 'text-gray-600'} />
            <span className={`text-sm font-medium ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
              Export Summary
            </span>
          </div>
          <div className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
            <p>Format: {exportFormats.find(f => f.id === selectedFormat)?.name}</p>
            <p>Annotations: {annotations.length}</p>
            {imageName && <p>Image: {imageName}</p>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleExport}
            disabled={annotations.length === 0}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Download size={18} />
            Export {annotations.length} Annotation{annotations.length !== 1 ? 's' : ''}
          </button>
          <button
            onClick={onClose}
            className={`px-4 py-2 border rounded-lg transition-colors ${
              dark 
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}