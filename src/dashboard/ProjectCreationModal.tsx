import React, { useState } from 'react';
import { X, Upload, Calendar, Users, Tag, FolderOpen, Box, Eye, Layers } from 'lucide-react';
import { Project } from '../types';

interface Props {
  dark: boolean;
  onClose: () => void;
  onCreate: (project: Partial<Project>) => void;
}

export default function ProjectCreationModal({ dark, onClose, onCreate }: Props) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    projectType: '2d' as '2d' | '3d' | '2d+3d',
    annotationMode: '2d' as '2d' | '3d' | 'hybrid',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    dueDate: '',
  });

  const inputCls = `w-full px-4 py-2.5 rounded-lg border transition-colors ${
    dark
      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
  } focus:outline-none focus:ring-2 focus:ring-blue-500/20`;

  const labelCls = `block text-sm font-medium mb-1.5 ${dark ? 'text-gray-300' : 'text-gray-700'}`;

  const selectCls = `${inputCls} appearance-none`;

  const typeOptions = [
    { value: '2d', label: '2D Annotation', icon: Eye, desc: 'Images, video frames' },
    { value: '3d', label: '3D Annotation', icon: Box, desc: 'Point clouds, LiDAR' },
    { value: '2d+3d', label: '2D + 3D Fusion', icon: Layers, desc: 'Sensor fusion, multi-modal' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onCreate({
      name: form.name,
      description: form.description,
      projectType: form.projectType,
      annotationMode: form.annotationMode,
      priority: form.priority,
      dueDate: form.dueDate ? new Date(form.dueDate) : undefined,
      imageCount: 0,
      annotationCount: 0,
      frameCount: 0,
      lastModified: new Date(),
      status: 'active',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className={`relative w-full max-w-2xl mx-4 rounded-2xl shadow-2xl ${
        dark ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${dark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <FolderOpen size={20} className="text-white" />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Create New Project</h2>
              <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-600'}`}>Set up a new annotation project</p>
            </div>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg transition-colors ${dark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Project Name */}
          <div>
            <label className={labelCls}>Project Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputCls}
              placeholder="e.g., Autonomous Vehicle Dataset"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className={labelCls}>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={`${inputCls} h-20 resize-none`}
              placeholder="Describe the project scope and goals..."
            />
          </div>

          {/* Project Type */}
          <div>
            <label className={labelCls}>Project Type</label>
            <div className="grid grid-cols-3 gap-3">
              {typeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm({
                    ...form,
                    projectType: opt.value as any,
                    annotationMode: opt.value === '2d+3d' ? 'hybrid' : opt.value === '3d' ? '3d' : '2d',
                  })}
                  className={`p-4 rounded-lg border-2 text-center transition-all ${
                    form.projectType === opt.value
                      ? 'border-blue-500 bg-blue-500/10'
                      : dark ? 'border-gray-600 hover:border-gray-500' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <opt.icon size={24} className={`mx-auto mb-2 ${form.projectType === opt.value ? 'text-blue-500' : dark ? 'text-gray-400' : 'text-gray-500'}`} />
                  <p className={`text-sm font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>{opt.label}</p>
                  <p className={`text-xs mt-1 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Priority & Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>
                <Tag size={14} className="inline mr-1" /> Priority
              </label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as any })}
                className={selectCls}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>
                <Calendar size={14} className="inline mr-1" /> Due Date
              </label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>

          {/* Dataset Upload placeholder */}
          <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dark ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'
          }`}>
            <Upload size={32} className={`mx-auto mb-3 ${dark ? 'text-gray-500' : 'text-gray-400'}`} />
            <p className={`font-medium ${dark ? 'text-gray-300' : 'text-gray-700'}`}>Upload Dataset</p>
            <p className={`text-sm mt-1 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
              Drag & drop images, point clouds, or video files
            </p>
            <label className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors text-sm">
              <Upload size={16} />
              Browse Files
              <input type="file" className="hidden" multiple accept="image/*,.pcd,.bin,.ply,.las" />
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-5 py-2.5 rounded-lg font-medium transition-colors ${
                dark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
