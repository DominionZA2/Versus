'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Comparison } from '@/types';
import { storage } from '@/lib/storage';

export default function ComparisonsPage() {
  const [comparisons, setComparisons] = useState<Comparison[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newComparisonName, setNewComparisonName] = useState('');

  useEffect(() => {
    setComparisons(storage.getComparisons());
  }, []);

  const handleCreateComparison = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComparisonName.trim()) return;

    const comparison: Comparison = {
      id: storage.generateId(),
      name: newComparisonName.trim(),
      slug: storage.generateSlug(newComparisonName.trim()),
      properties: [],
      createdAt: new Date().toISOString()
    };

    storage.saveComparison(comparison);
    setComparisons(storage.getComparisons());
    setNewComparisonName('');
    setIsCreating(false);
  };

  const handleDeleteComparison = (id: string) => {
    if (confirm('Are you sure you want to delete this comparison?')) {
      storage.deleteComparison(id);
      setComparisons(storage.getComparisons());
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Comparisons</h1>
          <button
            onClick={() => setIsCreating(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
          >
            New Comparison
          </button>
        </div>

        {isCreating && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <form onSubmit={handleCreateComparison}>
              <h2 className="text-xl font-semibold mb-4">Create New Comparison</h2>
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Comparison Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={newComparisonName}
                  onChange={(e) => setNewComparisonName(e.target.value)}
                  placeholder="e.g. Best Coffee Shops, Phone Options, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md transition-colors"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setNewComparisonName('');
                  }}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold px-4 py-2 rounded-md transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {comparisons.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600 mb-4">No comparisons yet</p>
            <p className="text-gray-500">Create your first comparison to get started!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {comparisons.map((comparison) => (
              <div key={comparison.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <Link href={`/comparisons/${comparison.slug}`}>
                      <h2 className="text-xl font-semibold text-blue-600 hover:text-blue-800 mb-2">
                        {comparison.name}
                      </h2>
                    </Link>
                    <p className="text-gray-600 text-sm">
                      Created {new Date(comparison.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteComparison(comparison.id)}
                    className="text-red-600 hover:text-red-800 font-medium text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}