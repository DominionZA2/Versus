'use client'

import { useState } from 'react';
import AnalysisResultsTable from './AnalysisResultsTable';

interface FileAnalysisResult {
  id: string;
  fileName: string;
  contenderName: string;
  status: 'pending' | 'analyzing' | 'completed' | 'error';
  data?: any;
  rawJson?: string;
  error?: string;
}

interface FileAnalysisListProps {
  results: FileAnalysisResult[];
  className?: string;
}

export default function FileAnalysisList({ results, className = '' }: FileAnalysisListProps) {
  const [expandedFile, setExpandedFile] = useState<string | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <div className="w-4 h-4 border-2 border-gray-400 rounded-full"></div>;
      case 'analyzing':
        return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>;
      case 'completed':
        return <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs">✓</span>
        </div>;
      case 'error':
        return <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs">✗</span>
        </div>;
      default:
        return <div className="w-4 h-4 bg-gray-400 rounded-full"></div>;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'analyzing':
        return 'Analyzing...';
      case 'completed':
        return 'Completed';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-gray-400';
      case 'analyzing':
        return 'text-blue-400';
      case 'completed':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  if (results.length === 0) {
    return (
      <div className={`text-gray-400 text-center py-4 ${className}`}>
        No files to analyze
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {results.map((result) => (
        <div key={result.id} className="bg-gray-800 border border-gray-600 rounded-md">
          {/* File Header */}
          <div 
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-700/50 transition-colors"
            onClick={() => {
              if (result.status === 'completed') {
                setExpandedFile(expandedFile === result.id ? null : result.id);
              }
            }}
          >
            <div className="flex items-center space-x-3">
              {getStatusIcon(result.status)}
              <div>
                <div className="text-gray-200 font-medium">{result.fileName}</div>
                <div className="text-gray-400 text-sm">{result.contenderName}</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className={`text-sm font-medium ${getStatusColor(result.status)}`}>
                {getStatusText(result.status)}
              </span>
              
              {result.status === 'completed' && (
                <span className="text-gray-400 text-sm">
                  {expandedFile === result.id ? '▼' : '▶'}
                </span>
              )}
            </div>
          </div>

          {/* Error Message */}
          {result.status === 'error' && result.error && (
            <div className="px-4 pb-4">
              <div className="bg-red-900/20 border border-red-800 rounded-md p-3">
                <div className="text-red-400 text-sm">
                  <strong>Error:</strong> {result.error}
                </div>
              </div>
            </div>
          )}

          {/* Analysis Results */}
          {result.status === 'completed' && expandedFile === result.id && result.data && (
            <div className="px-4 pb-4">
              <AnalysisResultsTable 
                data={result.data}
                sourceInfo={{
                  fileName: result.fileName,
                  contenderName: result.contenderName
                }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
