'use client'

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import ComparisonForm from '@/components/ComparisonForm';
import { Comparison } from '@/types';
import { storage } from '@/lib/storage';

export default function EditComparisonPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      const comp = storage.getComparisonBySlug(slug);
      setComparison(comp);
      setLoading(false);
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!comparison) {
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-xl text-gray-400 mb-4">Comparison not found</p>
            <Link href="/comparisons" className="text-blue-400 hover:text-blue-300">
              ← Back to Comparisons
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="mb-6 px-4 pt-8">
        <Link href="/comparisons" className="text-blue-400 hover:text-blue-300 inline-block">
          ← Back to Comparisons
        </Link>
      </div>
      <ComparisonForm mode="edit" existingComparison={comparison} />
    </div>
  );
}
