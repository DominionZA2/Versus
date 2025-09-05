'use client'

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Comparison, Contender, ComparisonProperty, AttachedFile } from '@/types';
import { storage } from '@/lib/storage';

export default function ComparisonDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [contenders, setContenders] = useState<Contender[]>([]);
  const [isAddingContender, setIsAddingContender] = useState(false);
  const [editingContender, setEditingContender] = useState<string | null>(null);
  const [isManagingProperties, setIsManagingProperties] = useState(false);
  const [newProperty, setNewProperty] = useState({ name: '', type: 'text' as 'text' | 'number' | 'rating' });
  const [newContender, setNewContender] = useState({
    name: '',
    description: '',
    pros: [''],
    cons: [''],
    properties: {} as Record<string, string | number>,
    attachments: [] as AttachedFile[]
  });
  const [editContender, setEditContender] = useState({
    name: '',
    description: '',
    pros: [''],
    cons: [''],
    properties: {} as Record<string, string | number>,
    attachments: [] as AttachedFile[]
  });

  useEffect(() => {
    if (slug) {
      const comp = storage.getComparisonBySlug(slug);
      setComparison(comp);
      if (comp) {
        setContenders(storage.getContenders(comp.id));
      }
    }
  }, [slug]);

  const handleAddContender = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comparison || !newContender.name.trim()) return;

    const contender: Contender = {
      id: storage.generateId(),
      comparisonId: comparison.id,
      name: newContender.name.trim(),
      description: newContender.description.trim() || undefined,
      pros: newContender.pros.filter(p => p.trim()),
      cons: newContender.cons.filter(c => c.trim()),
      properties: { ...newContender.properties },
      attachments: [...newContender.attachments],
      createdAt: new Date().toISOString()
    };

    storage.saveContender(contender);
    setContenders(storage.getContenders(comparison.id));
    setNewContender({ name: '', description: '', pros: [''], cons: [''], properties: {}, attachments: [] });
    setIsAddingContender(false);
  };

  const handleDeleteContender = (id: string) => {
    if (confirm('Are you sure you want to delete this contender?')) {
      storage.deleteContender(id);
      setContenders(comparison ? storage.getContenders(comparison.id) : []);
    }
  };

  const handleEditContender = (contender: Contender) => {
    setEditingContender(contender.id);
    setEditContender({
      name: contender.name,
      description: contender.description || '',
      pros: [...contender.pros, ''], // Add empty string for new entries
      cons: [...contender.cons, ''], // Add empty string for new entries
      properties: { ...contender.properties },
      attachments: [...(contender.attachments || [])]
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comparison || !editingContender || !editContender.name.trim()) return;

    const existingContender = contenders.find(c => c.id === editingContender);
    const updatedContender: Contender = {
      id: editingContender,
      comparisonId: comparison.id,
      name: editContender.name.trim(),
      description: editContender.description.trim() || undefined,
      pros: editContender.pros.filter(p => p.trim()),
      cons: editContender.cons.filter(c => c.trim()),
      properties: { ...editContender.properties },
      attachments: [...editContender.attachments],
      createdAt: existingContender?.createdAt || new Date().toISOString()
    };

    storage.saveContender(updatedContender);
    setContenders(storage.getContenders(comparison.id));
    setEditingContender(null);
    setEditContender({ name: '', description: '', pros: [''], cons: [''], properties: {}, attachments: [] });
  };

  const handleCancelEdit = () => {
    setEditingContender(null);
    setEditContender({ name: '', description: '', pros: [''], cons: [''], properties: {}, attachments: [] });
  };

  const handleAddProperty = () => {
    if (!comparison || !newProperty.name.trim()) return;
    
    const property: ComparisonProperty = {
      key: storage.generateSlug(newProperty.name.trim()),
      name: newProperty.name.trim(),
      type: newProperty.type
    };

    const updatedComparison: Comparison = {
      ...comparison,
      properties: [...comparison.properties, property]
    };

    storage.saveComparison(updatedComparison);
    setComparison(updatedComparison);
    setNewProperty({ name: '', type: 'text' });
  };

  const handleDeleteProperty = (propertyKey: string) => {
    if (!comparison) return;
    
    if (confirm('Are you sure you want to delete this property? All values for this property will be lost.')) {
      const updatedComparison: Comparison = {
        ...comparison,
        properties: comparison.properties.filter(p => p.key !== propertyKey)
      };

      // Remove this property from all contenders
      const updatedContenders = contenders.map(contender => ({
        ...contender,
        properties: Object.fromEntries(
          Object.entries(contender.properties).filter(([key]) => key !== propertyKey)
        )
      }));

      storage.saveComparison(updatedComparison);
      updatedContenders.forEach(contender => storage.saveContender(contender));
      
      setComparison(updatedComparison);
      setContenders(storage.getContenders(comparison.id));
    }
  };

  const updateNewContenderArray = (type: 'pros' | 'cons', index: number, value: string) => {
    setNewContender(prev => ({
      ...prev,
      [type]: prev[type].map((item, i) => i === index ? value : item)
    }));
  };

  const addNewItem = (type: 'pros' | 'cons') => {
    setNewContender(prev => ({
      ...prev,
      [type]: [...prev[type], '']
    }));
  };

  const removeItem = (type: 'pros' | 'cons', index: number) => {
    setNewContender(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const updateEditContenderArray = (type: 'pros' | 'cons', index: number, value: string) => {
    setEditContender(prev => ({
      ...prev,
      [type]: prev[type].map((item, i) => i === index ? value : item)
    }));
  };

  const addEditItem = (type: 'pros' | 'cons') => {
    setEditContender(prev => ({
      ...prev,
      [type]: [...prev[type], '']
    }));
  };

  const removeEditItem = (type: 'pros' | 'cons', index: number) => {
    setEditContender(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const getHighestPropertyValues = () => {
    const highestValues: Record<string, number> = {};
    
    comparison?.properties.forEach(property => {
      if (property.type === 'number' || property.type === 'rating') {
        let maxValue = -Infinity;
        contenders.forEach(contender => {
          const value = contender.properties[property.key];
          if (typeof value === 'number' && value > maxValue) {
            maxValue = value;
          }
        });
        if (maxValue !== -Infinity) {
          highestValues[property.key] = maxValue;
        }
      }
    });
    
    return highestValues;
  };

  const handleFileUpload = async (file: File, isEdit = false) => {
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

  const processFile = async (file: File, isEdit = false) => {
    // Check file size (limit to 5MB to avoid localStorage issues)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    try {
      const attachedFile = await handleFileUpload(file);
      
      if (isEdit) {
        setEditContender(prev => ({
          ...prev,
          attachments: [...prev.attachments, attachedFile]
        }));
      } else {
        setNewContender(prev => ({
          ...prev,
          attachments: [...prev.attachments, attachedFile]
        }));
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file. Please try again.');
    }
  };

  const handleAddFile = async (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await processFile(file, isEdit);
    
    // Clear the input
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

  const handleDrop = async (e: React.DragEvent, isEdit = false) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await processFile(files[0], isEdit);
    }
  };

  const handleDropOnCard = async (e: React.DragEvent, contenderId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const file = files[0];
    
    // Check file size
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    try {
      const attachedFile = await handleFileUpload(file);
      
      // Find the contender and update it
      const contender = contenders.find(c => c.id === contenderId);
      if (contender) {
        const updatedContender: Contender = {
          ...contender,
          attachments: [...(contender.attachments || []), attachedFile]
        };
        
        storage.saveContender(updatedContender);
        setContenders(storage.getContenders(comparison!.id));
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file. Please try again.');
    }
  };

  const handleRemoveFile = (fileId: string, isEdit = false) => {
    if (isEdit) {
      setEditContender(prev => ({
        ...prev,
        attachments: prev.attachments.filter(f => f.id !== fileId)
      }));
    } else {
      setNewContender(prev => ({
        ...prev,
        attachments: prev.attachments.filter(f => f.id !== fileId)
      }));
    }
  };

  const handleDownloadFile = (file: AttachedFile) => {
    const link = document.createElement('a');
    link.href = file.data;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={currentValue}
            onChange={(e) => onChange(property.key, parseFloat(e.target.value) || 0)}
            placeholder={`Enter ${property.name.toLowerCase()}`}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <span className="ml-2 text-sm text-gray-600">
              {currentValue ? `${currentValue}/5` : 'Not rated'}
            </span>
          </div>
        );
      default:
        return null;
    }
  };

  if (!comparison) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xl text-gray-600">Comparison not found</p>
          <Link href="/comparisons" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
            Back to Comparisons
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link href="/comparisons" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← Back to Comparisons
          </Link>
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">{comparison.name}</h1>
            <div className="flex gap-3">
              <button
                onClick={() => setIsManagingProperties(true)}
                className="bg-gray-600 hover:bg-gray-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
              >
                Manage Properties
              </button>
              <button
                onClick={() => setIsAddingContender(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
              >
                Add Contender
              </button>
            </div>
          </div>
        </div>

        {isManagingProperties && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Manage Comparison Properties</h2>
            <p className="text-gray-600 text-sm mb-4">
              Properties are criteria that each contender can be evaluated on (e.g., Price, Quality, Features).
            </p>

            {comparison.properties.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">Current Properties</h3>
                <div className="space-y-2">
                  {comparison.properties.map((property) => (
                    <div key={property.key} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <div>
                        <span className="font-medium">{property.name}</span>
                        <span className="ml-2 text-sm text-gray-500">({property.type})</span>
                      </div>
                      <button
                        onClick={() => handleDeleteProperty(property.key)}
                        className="text-red-600 hover:text-red-800 font-medium text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <h3 className="text-lg font-medium mb-3">Add New Property</h3>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Property Name
                  </label>
                  <input
                    type="text"
                    value={newProperty.name}
                    onChange={(e) => setNewProperty(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Price, Quality, Ease of Use"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    value={newProperty.type}
                    onChange={(e) => setNewProperty(prev => ({ ...prev, type: e.target.value as 'text' | 'number' | 'rating' }))}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="rating">Rating (1-5)</option>
                  </select>
                </div>
                <button
                  onClick={handleAddProperty}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-md transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setIsManagingProperties(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold px-4 py-2 rounded-md transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {isAddingContender && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <form onSubmit={handleAddContender}>
              <h2 className="text-xl font-semibold mb-4">Add New Contender</h2>
              
              <div className="mb-4">
                <label htmlFor="contender-name" className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="contender-name"
                  value={newContender.name}
                  onChange={(e) => setNewContender(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Contender name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              <div className="mb-4">
                <label htmlFor="contender-description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optional)
                </label>
                <textarea
                  id="contender-description"
                  value={newContender.description}
                  onChange={(e) => setNewContender(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this contender"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {comparison.properties.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-3">Properties</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {comparison.properties.map((property) => (
                      <div key={property.key}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {property.name} ({property.type})
                        </label>
                        {renderPropertyInput(
                          property,
                          newContender.properties[property.key],
                          (key, value) => setNewContender(prev => ({
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
                <h3 className="text-lg font-medium mb-3">File Attachments</h3>
                <div 
                  className="border border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, false)}
                >
                  <input
                    type="file"
                    onChange={(e) => handleAddFile(e, false)}
                    className="mb-3 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="text-sm text-gray-500 mb-3">Drag & drop a file here or click to browse • Maximum file size: 5MB</p>
                  
                  {newContender.attachments.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-gray-700">Attached Files:</h4>
                      {newContender.attachments.map((file) => (
                        <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">{file.name}</span>
                            <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(file.id, false)}
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

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pros
                  </label>
                  {newContender.pros.map((pro, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={pro}
                        onChange={(e) => updateNewContenderArray('pros', index, e.target.value)}
                        placeholder="Enter a pro"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      {newContender.pros.length > 1 && (
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
                    onClick={() => addNewItem('pros')}
                    className="text-green-600 hover:text-green-800 text-sm"
                  >
                    + Add Pro
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cons
                  </label>
                  {newContender.cons.map((con, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={con}
                        onChange={(e) => updateNewContenderArray('cons', index, e.target.value)}
                        placeholder="Enter a con"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                      {newContender.cons.length > 1 && (
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
                    onClick={() => addNewItem('cons')}
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
                  Add Contender
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingContender(false);
                    setNewContender({ name: '', description: '', pros: [''], cons: [''], properties: {}, attachments: [] });
                  }}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold px-4 py-2 rounded-md transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {contenders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600 mb-4">No contenders yet</p>
            <p className="text-gray-500">Add some options to start comparing!</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {contenders.map((contender) => (
              <div 
                key={contender.id} 
                className={`bg-white rounded-lg shadow-md p-6 ${
                  editingContender !== contender.id 
                    ? 'hover:shadow-lg transition-all duration-200 hover:border-blue-200 border border-transparent' 
                    : ''
                }`}
                onDragOver={editingContender !== contender.id ? handleDragOver : undefined}
                onDragEnter={editingContender !== contender.id ? handleDragEnter : undefined}
                onDragLeave={editingContender !== contender.id ? handleDragLeave : undefined}
                onDrop={editingContender !== contender.id ? (e) => handleDropOnCard(e, contender.id) : undefined}
              >
                {editingContender === contender.id ? (
                  <form onSubmit={handleSaveEdit}>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Name
                      </label>
                      <input
                        type="text"
                        value={editContender.name}
                        onChange={(e) => setEditContender(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description (optional)
                      </label>
                      <textarea
                        value={editContender.description}
                        onChange={(e) => setEditContender(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Brief description of this contender"
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {comparison.properties.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium mb-3">Properties</h4>
                        <div className="grid gap-4">
                          {comparison.properties.map((property) => (
                            <div key={property.key}>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                {property.name} ({property.type})
                              </label>
                              {renderPropertyInput(
                                property,
                                editContender.properties[property.key],
                                (key, value) => setEditContender(prev => ({
                                  ...prev,
                                  properties: { ...prev.properties, [key]: value }
                                }))
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mb-4">
                      <h4 className="font-medium mb-3">File Attachments</h4>
                      <div 
                        className="border border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                        onDragOver={handleDragOver}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, true)}
                      >
                        <input
                          type="file"
                          onChange={(e) => handleAddFile(e, true)}
                          className="mb-3 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        <p className="text-sm text-gray-500 mb-3">Drag & drop a file here or click to browse • Maximum file size: 5MB</p>
                        
                        {editContender.attachments.length > 0 && (
                          <div className="space-y-2">
                            <h5 className="font-medium text-sm text-gray-700">Attached Files:</h5>
                            {editContender.attachments.map((file) => (
                              <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium">{file.name}</span>
                                  <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFile(file.id, true)}
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

                    <div className="space-y-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-green-700 mb-2">
                          Pros
                        </label>
                        {editContender.pros.map((pro, index) => (
                          <div key={index} className="flex gap-2 mb-2">
                            <input
                              type="text"
                              value={pro}
                              onChange={(e) => updateEditContenderArray('pros', index, e.target.value)}
                              placeholder="Enter a pro"
                              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                            {editContender.pros.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeEditItem('pros', index)}
                                className="text-red-600 hover:text-red-800 px-2"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addEditItem('pros')}
                          className="text-green-600 hover:text-green-800 text-sm"
                        >
                          + Add Pro
                        </button>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-red-700 mb-2">
                          Cons
                        </label>
                        {editContender.cons.map((con, index) => (
                          <div key={index} className="flex gap-2 mb-2">
                            <input
                              type="text"
                              value={con}
                              onChange={(e) => updateEditContenderArray('cons', index, e.target.value)}
                              placeholder="Enter a con"
                              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                            {editContender.cons.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeEditItem('cons', index)}
                                className="text-red-600 hover:text-red-800 px-2"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addEditItem('cons')}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          + Add Con
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1 text-sm rounded transition-colors"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold px-3 py-1 text-sm rounded transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-4">
                      <h3 
                        className="text-xl font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
                        onClick={() => handleEditContender(contender)}
                      >
                        {contender.name}
                      </h3>
                      <button
                        onClick={() => handleDeleteContender(contender.id)}
                        className="text-red-600 hover:text-red-800 font-medium text-sm"
                      >
                        Delete
                      </button>
                    </div>

                    {contender.description && (
                      <div className="mb-4">
                        <p className="text-gray-600 text-sm italic">{contender.description}</p>
                      </div>
                    )}

                    {comparison.properties.length > 0 && Object.keys(contender.properties).length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-700 mb-2">Properties</h4>
                        <div className="space-y-2">
                          {comparison.properties.map((property) => {
                            const value = contender.properties[property.key];
                            if (value === undefined || value === '') return null;
                            
                            const highestValues = getHighestPropertyValues();
                            const isHighest = (property.type === 'number' || property.type === 'rating') && 
                                            typeof value === 'number' && 
                                            value === highestValues[property.key] &&
                                            value > 0;
                            
                            return (
                              <div key={property.key} className="flex justify-between items-center text-sm">
                                <span className={`${isHighest ? 'text-green-600 font-medium' : 'text-gray-600'}`}>{property.name}:</span>
                                <span className={`font-medium ${isHighest ? 'text-green-600' : ''}`}>
                                  {property.type === 'rating' ? (
                                    <div className="flex items-center gap-1">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <span
                                          key={star}
                                          className={`text-sm ${
                                            (value as number) >= star 
                                              ? isHighest ? 'text-green-500' : 'text-yellow-400' 
                                              : 'text-gray-300'
                                          }`}
                                        >
                                          ★
                                        </span>
                                      ))}
                                      <span className={`ml-1 ${isHighest ? 'text-green-600' : 'text-gray-600'}`}>({value}/5)</span>
                                    </div>
                                  ) : (
                                    value
                                  )}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {contender.attachments && contender.attachments.length > 0 && (
                      <div className="mb-4 pt-3 border-t border-gray-200">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Attachments:</span>
                          <span className="font-medium">{contender.attachments.length}</span>
                        </div>
                      </div>
                    )}

                    {(contender.pros.length > 0 || contender.cons.length > 0) && (
                      <div className="space-y-4">
                        {contender.pros.length > 0 && (
                          <div>
                            <h4 className="font-medium text-green-700 mb-2">Pros</h4>
                            <ul className="space-y-1">
                              {contender.pros.map((pro, index) => (
                                <li key={index} className="text-sm text-gray-700 flex items-start">
                                  <span className="text-green-600 mr-2">+</span>
                                  {pro}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {contender.cons.length > 0 && (
                          <div>
                            <h4 className="font-medium text-red-700 mb-2">Cons</h4>
                            <ul className="space-y-1">
                              {contender.cons.map((con, index) => (
                                <li key={index} className="text-sm text-gray-700 flex items-start">
                                  <span className="text-red-600 mr-2">-</span>
                                  {con}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}