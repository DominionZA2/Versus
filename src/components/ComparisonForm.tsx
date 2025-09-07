'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Comparison } from '@/types';
import { storage } from '@/lib/storage';

interface ComparisonFormProps {
  mode: 'add' | 'edit';
  existingComparison?: Comparison;
}

export default function ComparisonForm({ mode, existingComparison }: ComparisonFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: existingComparison?.name || ''
  });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Comparison name is required');
      return;
    }

    // Check for duplicate names when adding or when editing with a different name
    const trimmedName = formData.name.trim();
    const existingComparisons = storage.getComparisons();
    const isDuplicate = existingComparisons.some(comp => 
      comp.name.toLowerCase() === trimmedName.toLowerCase() && 
      (mode === 'add' || comp.id !== existingComparison?.id)
    );
    
    if (isDuplicate) {
      setError('A comparison with this name already exists. Please choose a different name.');
      return;
    }

    setError('');

    if (mode === 'add') {
      const comparison: Comparison = {
        id: storage.generateId(),
        name: trimmedName,
        slug: storage.generateSlug(trimmedName),
        properties: [],
        createdAt: new Date().toISOString()
      };
      
      storage.saveComparison(comparison);
      
      // Navigate directly to the newly created comparison
      router.push(`/comparisons/${comparison.slug}`);
    } else if (mode === 'edit' && existingComparison) {
      const updatedComparison: Comparison = {
        ...existingComparison,
        name: trimmedName,
        slug: storage.generateSlug(trimmedName)
      };
      
      storage.saveComparison(updatedComparison);
      
      // Navigate back to comparisons list after editing
      router.push('/comparisons');
    }
  };

  const handleCancel = () => {
    router.push('/comparisons');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-100 mb-2">
            {mode === 'add' ? 'Create New Comparison' : 'Edit Comparison'}
          </h1>
          <p className="text-gray-400">
            {mode === 'add' 
              ? 'Set up your comparison with a name and description. You can add properties and contenders after creating it.' 
              : 'Update your comparison details.'
            }
          </p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Comparison Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, name: e.target.value }));
                  if (error) setError(''); // Clear error when user starts typing
                }}
                placeholder="e.g., Best Laptops for 2024, Coffee Shop Comparison"
                className={`w-full px-3 py-2 bg-gray-700 border text-gray-100 placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 ${
                  error 
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                }`}
                autoFocus
              />
              {error && (
                <p className="mt-1 text-sm text-red-400">{error}</p>
              )}
            </div>


            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-md transition-colors"
              >
                {mode === 'add' ? 'Create Comparison' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-600 hover:bg-gray-500 text-gray-100 font-semibold px-6 py-2 rounded-md transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
