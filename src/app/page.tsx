'use client';

import { useRouter } from 'next/navigation';
import { storage } from '@/lib/storage';
import VersionInfo from '@/components/VersionInfo';

export default function HomePage() {
  const router = useRouter();

  const handleGetStarted = () => {
    console.log('Get Started button clicked');
    const existingComparisons = storage.getComparisons();
    console.log('Existing comparisons:', existingComparisons);
    
    if (existingComparisons.length === 0) {
      // No comparisons exist, go directly to create new comparison
      console.log('No comparisons found, navigating to create new');
      router.push('/comparisons?create=true');
    } else {
      // Show existing comparisons
      console.log('Existing comparisons found, navigating to list');
      router.push('/comparisons');
    }
  };
  return (
    <div className="container mx-auto px-4 py-16">
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto text-center mb-16">
        <h1 className="text-6xl font-bold text-gray-100 mb-6">
          Make Better Decisions with <span className="text-blue-400">Versus</span>
        </h1>
        <p className="text-xl text-gray-400 mb-8 max-w-3xl mx-auto">
          Compare anything side-by-side. Add properties, pros and cons, and make informed choices with confidence.
        </p>
      </div>

      {/* Features Grid */}
      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 mb-16">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-100 mb-3">
            Structured Comparisons
          </h3>
          <p className="text-gray-400">
            Create organized comparisons with custom properties and criteria that matter to your decision.
          </p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-100 mb-3">
            Pros & Cons Analysis
          </h3>
          <p className="text-gray-400">
            Add detailed pros and cons for each option to evaluate strengths and weaknesses clearly.
          </p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-100 mb-3">
            AI-Powered Insights
          </h3>
          <p className="text-gray-400">
            Extract properties from documents and get AI assistance to enhance your comparison analysis.
          </p>
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-100 mb-4">
          Ready to start comparing?
        </h2>
        <p className="text-lg text-gray-400 mb-8">
          Create your first comparison and make better decisions today.
        </p>
        <button
          onClick={handleGetStarted}
          className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-4 rounded-lg transition-colors text-lg"
        >
          Get Started
        </button>
        
        {/* Version Information */}
        <div className="mt-12 flex justify-center">
          <VersionInfo compact />
        </div>
      </div>
    </div>
  );
}