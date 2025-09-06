'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Comparison } from '@/types';
import { storage } from '@/lib/storage';

function ComparisonsContent() {
  const [comparisons, setComparisons] = useState<Comparison[]>([]);

  useEffect(() => {
    setComparisons(storage.getComparisons());
  }, []);

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
          <h1 className="text-3xl font-bold text-gray-100">Your Comparisons</h1>
          <Link 
            href="/comparisons/new"
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-2 rounded-lg transition-colors inline-block"
          >
            New Comparison
          </Link>
        </div>

        {comparisons.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-400 mb-4">No comparisons yet</p>
            <p className="text-gray-500">Create your first comparison to get started!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {comparisons.map((comparison) => (
              <div key={comparison.id} className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <Link href={`/comparisons/${comparison.slug}/edit`}>
                      <h2 className="text-xl font-semibold text-blue-400 hover:text-blue-300 mb-2">
                        {comparison.name}
                      </h2>
                    </Link>
                    {comparison.description && (
                      <p className="text-gray-300 text-sm mb-2">{comparison.description}</p>
                    )}
                    <p className="text-gray-400 text-sm">
                      Created {new Date(comparison.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="ml-4">
                    <button
                      onClick={() => handleDeleteComparison(comparison.id)}
                      className="text-red-400 hover:text-red-300 font-medium text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ComparisonsPage() {
  return <ComparisonsContent />;
}
