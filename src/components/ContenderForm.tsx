'use client'

import { useState } from 'react';
import { Comparison, Contender, ComparisonProperty, AttachedFile } from '@/types';
import { storage } from '@/lib/storage';

interface ContenderFormData {
  name: string;
  description: string;
  pros: string[];
  cons: string[];
  hyperlinks: string[];
  properties: Record<string, string | number>;
  attachments: AttachedFile[];
}

interface ContenderFormProps {
  comparison: Comparison;
  mode: 'add' | 'edit';
  existingContender?: Contender;
  onSubmit: (contender: Contender) => void;
  onCancel: () => void;
}

export default function ContenderForm({ comparison, mode, existingContender, onSubmit, onCancel }: ContenderFormProps) {
  const [formData, setFormData] = useState<ContenderFormData>(() => {
    if (mode === 'edit' && existingContender) {
      return {
        name: existingContender.name,
        description: existingContender.description || '',
        pros: [...existingContender.pros, ''],
        cons: [...existingContender.cons, ''],
        hyperlinks: [...(existingContender.hyperlinks || []).map(h => h.url), ''],
        properties: { ...existingContender.properties },
        attachments: [...(existingContender.attachments || [])]
      };
    }
    return {
      name: '',
      description: '',
      pros: [''],
      cons: [''],
      hyperlinks: [''],
      properties: {},
      attachments: []
    };
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const contender: Contender = {
      id: mode === 'edit' ? existingContender!.id : storage.generateId(),
      comparisonId: comparison.id,
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      pros: formData.pros.filter(p => p.trim()),
      cons: formData.cons.filter(c => c.trim()),
      properties: { ...formData.properties },
      attachments: [...formData.attachments],
      hyperlinks: formData.hyperlinks
        .filter(url => url.trim())
        .map(url => ({
          id: storage.generateId(),
          url: url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`,
          addedAt: new Date().toISOString()
        })),
      createdAt: existingContender?.createdAt || new Date().toISOString()
    };

    onSubmit(contender);
  };

  const updateArray = (type: 'pros' | 'cons' | 'hyperlinks', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].map((item, i) => i === index ? value : item)
    }));
  };

  const addItem = (type: 'pros' | 'cons' | 'hyperlinks') => {
    setFormData(prev => ({
      ...prev,
      [type]: [...prev[type], '']
    }));
  };

  const removeItem = (type: 'pros' | 'cons' | 'hyperlinks', index: number) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const handleFileUpload = async (file: File) => {
    return new Promise<AttachedFile>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const attachedFile: AttachedFile = {
          id: storage.generateId(),
          name: file.name,
          type: file.type,
          size: file.size,
          data: reader.result as string,
          uploadedAt: new Date().toISOString()
        };
        resolve(attachedFile);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const processFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    try {
      const attachedFile = await handleFileUpload(file);
      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, attachedFile]
      }));
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file. Please try again.');
    }
  };

  const handleAddFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await processFile(file);
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await processFile(files[0]);
    }
  };

  const handleRemoveFile = (fileId: string) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter(f => f.id !== fileId)
    }));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderPropertyInput = (
    property: ComparisonProperty,
    value: string | number | undefined,
    onChange: (key: string, value: string | number) => void
  ) => {
    const currentValue = value !== undefined ? value : '';

    switch (property.type) {
      case 'text':
        return (
          <input
            type="text"
            value={currentValue}
            onChange={(e) => onChange(property.key, e.target.value)}
            placeholder={`Enter ${property.name.toLowerCase()}`}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={currentValue}
            onChange={(e) => onChange(property.key, parseFloat(e.target.value) || 0)}
            placeholder={`Enter ${property.name.toLowerCase()}`}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
      case 'rating':
        return (
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => onChange(property.key, star)}
                className={`text-2xl ${
                  (currentValue as number) >= star ? 'text-yellow-400' : 'text-gray-300'
                } hover:text-yellow-400 transition-colors`}
              >
                ★
              </button>
            ))}
            <span className="ml-2 text-sm text-gray-400">
              {currentValue ? `${currentValue}/5` : 'Not rated'}
            </span>
          </div>
        );
      case 'datetime':
        return (
          <input
            type="datetime-local"
            value={currentValue ? new Date(currentValue as string).toISOString().slice(0, 16) : ''}
            onChange={(e) => onChange(property.key, e.target.value ? new Date(e.target.value).toISOString() : '')}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
      <form onSubmit={handleSubmit}>
        <h2 className="text-xl font-semibold text-gray-100 mb-4">
          {mode === 'add' ? 'Add New Contender' : 'Edit Contender'}
        </h2>
        
        <div className="mb-4">
          <label htmlFor="contender-name" className="block text-sm font-medium text-gray-300 mb-2">
            Name
          </label>
          <input
            type="text"
            id="contender-name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Contender name"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>

        <div className="mb-4">
          <label htmlFor="contender-description" className="block text-sm font-medium text-gray-300 mb-2">
            Description (optional)
          </label>
          <textarea
            id="contender-description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Brief description of this contender"
            rows={2}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {comparison.properties.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-200 mb-3">Properties</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {comparison.properties.map((property) => (
                <div key={property.key}>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {property.name} ({property.type})
                  </label>
                  {renderPropertyInput(
                    property,
                    formData.properties[property.key],
                    (key, value) => setFormData(prev => ({
                      ...prev,
                      properties: { ...prev.properties, [key]: value }
                    }))
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-200 mb-3">File Attachments</h3>
          <div 
            className="border border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 hover:bg-blue-50 transition-colors"
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              onChange={handleAddFile}
              className="mb-3 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-sm text-gray-500 mb-3">Drag & drop a file here or click to browse • Maximum file size: 5MB</p>
            
            {formData.attachments.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-gray-700">Attached Files:</h4>
                {formData.attachments.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{file.name}</span>
                      <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(file.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Hyperlinks
          </label>
          {formData.hyperlinks.map((link, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                value={link}
                onChange={(e) => updateArray('hyperlinks', index, e.target.value)}
                placeholder="Enter a URL (e.g., https://example.com)"
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {formData.hyperlinks.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem('hyperlinks', index)}
                  className="text-red-600 hover:text-red-800 px-2"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => addItem('hyperlinks')}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            + Add Hyperlink
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Pros
            </label>
            {formData.pros.map((pro, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={pro}
                  onChange={(e) => updateArray('pros', index, e.target.value)}
                  placeholder="Enter a pro"
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                {formData.pros.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem('pros', index)}
                    className="text-red-600 hover:text-red-800 px-2"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addItem('pros')}
              className="text-green-600 hover:text-green-800 text-sm"
            >
              + Add Pro
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Cons
            </label>
            {formData.cons.map((con, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={con}
                  onChange={(e) => updateArray('cons', index, e.target.value)}
                  placeholder="Enter a con"
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                {formData.cons.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem('cons', index)}
                    className="text-red-600 hover:text-red-800 px-2"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addItem('cons')}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              + Add Con
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md transition-colors"
          >
            {mode === 'add' ? 'Add Contender' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-600 hover:bg-gray-500 text-gray-100 font-semibold px-4 py-2 rounded-md transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
