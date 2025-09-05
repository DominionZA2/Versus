'use client'

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Comparison, Contender } from '@/types';
import { storage } from '@/lib/storage';

export default function ComparisonDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [contenders, setContenders] = useState<Contender[]>([]);
  const [isAddingContender, setIsAddingContender] = useState(false);
  const [editingContender, setEditingContender] = useState<string | null>(null);
  const [newContender, setNewContender] = useState({
    name: '',
    pros: [''],
    cons: ['']
  });
  const [editContender, setEditContender] = useState({
    name: '',
    pros: [''],
    cons: ['']
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
      pros: newContender.pros.filter(p => p.trim()),
      cons: newContender.cons.filter(c => c.trim()),
      createdAt: new Date().toISOString()
    };

    storage.saveContender(contender);
    setContenders(storage.getContenders(comparison.id));
    setNewContender({ name: '', pros: [''], cons: [''] });
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
      pros: [...contender.pros, ''], // Add empty string for new entries
      cons: [...contender.cons, ''] // Add empty string for new entries
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comparison || !editingContender || !editContender.name.trim()) return;

    const updatedContender: Contender = {
      id: editingContender,
      comparisonId: comparison.id,
      name: editContender.name.trim(),
      pros: editContender.pros.filter(p => p.trim()),
      cons: editContender.cons.filter(c => c.trim()),
      createdAt: contenders.find(c => c.id === editingContender)?.createdAt || new Date().toISOString()
    };

    storage.saveContender(updatedContender);
    setContenders(storage.getContenders(comparison.id));
    setEditingContender(null);
    setEditContender({ name: '', pros: [''], cons: [''] });
  };

  const handleCancelEdit = () => {
    setEditingContender(null);
    setEditContender({ name: '', pros: [''], cons: [''] });
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
            <button
              onClick={() => setIsAddingContender(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
            >
              Add Contender
            </button>
          </div>
        </div>

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
                    setNewContender({ name: '', pros: [''], cons: [''] });
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