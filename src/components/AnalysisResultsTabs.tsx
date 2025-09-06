'use client'

import { useState } from 'react';
import AnalysisResultsTable from './AnalysisResultsTable';

interface AnalysisResultsTabsProps {
  data: any;
  rawJson: string;
  sourceInfo?: {
    fileName?: string;
    url?: string;
    contenderName?: string;
  };
  className?: string;
}


export default function AnalysisResultsTabs({ data, rawJson, sourceInfo, className = '' }: AnalysisResultsTabsProps) {
  const [activeTab, setActiveTab] = useState<'main' | 'log'>('main');


  return (
    <div className={className}>
      {/* Tab Headers */}
      <div className="flex border-b border-gray-600 mb-6">
        <button
          onClick={() => setActiveTab('main')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'main'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          Main
        </button>
        <button
          onClick={() => setActiveTab('log')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ml-4 ${
            activeTab === 'log'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          Log
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'main' && (
          <div>
            <AnalysisResultsTable data={data} sourceInfo={sourceInfo} />
          </div>
        )}
        
        {activeTab === 'log' && (
          <div>
            <pre className="text-sm text-gray-300 whitespace-pre-wrap overflow-auto max-h-96 bg-gray-800 p-4 rounded border">
              {rawJson}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
