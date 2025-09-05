'use client'

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Comparison, Contender, ComparisonProperty } from '@/types';
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
    properties: {} as Record<string, string | number>
  });
  const [editContender, setEditContender] = useState({
    name: '',
    description: '',
    pros: [''],
    cons: [''],
    properties: {} as Record<string, string | number>
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
      createdAt: new Date().toISOString()
    };

    storage.saveContender(contender);
    setContenders(storage.getContenders(comparison.id));
    setNewContender({ name: '', description: '', pros: [''], cons: [''], properties: {} });
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
      properties: { ...contender.properties }
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
      createdAt: existingContender?.createdAt || new Date().toISOString()
    };

    storage.saveContender(updatedContender);
    setContenders(storage.getContenders(comparison.id));
    setEditingContender(null);
    setEditContender({ name: '', description: '', pros: [''], cons: [''], properties: {} });
  };

  const handleCancelEdit = () => {
    setEditingContender(null);
    setEditContender({ name: '', description: '', pros: [''], cons: [''], properties: {} });
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
                    setNewContender({ name: '', description: '', pros: [''], cons: [''], properties: {} });
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
              <div key={contender.id} className="bg-white rounded-lg shadow-md p-6">
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
                            
                            return (
                              <div key={property.key} className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">{property.name}:</span>
                                <span className="font-medium">
                                  {property.type === 'rating' ? (
                                    <div className="flex items-center gap-1">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <span
                                          key={star}
                                          className={`text-sm ${
                                            (value as number) >= star ? 'text-yellow-400' : 'text-gray-300'
                                          }`}
                                        >
                                          ★
                                        </span>
                                      ))}
                                      <span className="ml-1 text-gray-600">({value}/5)</span>
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

                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-green-700 mb-2">Pros</h4>
                        {contender.pros.length > 0 ? (
                          <ul className="space-y-1">
                            {contender.pros.map((pro, index) => (
                              <li key={index} className="text-sm text-gray-700 flex items-start">
                                <span className="text-green-600 mr-2">+</span>
                                {pro}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-500 italic">No pros listed</p>
                        )}
                      </div>

                      <div>
                        <h4 className="font-medium text-red-700 mb-2">Cons</h4>
                        {contender.cons.length > 0 ? (
                          <ul className="space-y-1">
                            {contender.cons.map((con, index) => (
                              <li key={index} className="text-sm text-gray-700 flex items-start">
                                <span className="text-red-600 mr-2">-</span>
                                {con}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-500 italic">No cons listed</p>
                        )}
                      </div>
                    </div>
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