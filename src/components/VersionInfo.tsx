'use client';

import { getVersionInfo, getShortCommit, formatBuildTime } from '@/lib/version';
import { useState } from 'react';

interface VersionInfoProps {
  compact?: boolean;
  className?: string;
}

export default function VersionInfo({ compact = false, className = '' }: VersionInfoProps) {
  const [showDetails, setShowDetails] = useState(false);
  const versionInfo = getVersionInfo();

  if (compact) {
    return (
      <div className={`text-gray-500 text-xs ${className}`}>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="hover:text-gray-400 transition-colors"
          title="Click to show version details"
        >
          v{versionInfo.version}
        </button>
        
        {showDetails && (
          <div className="absolute bg-gray-800 border border-gray-600 rounded-lg p-3 mt-1 shadow-lg z-50 min-w-48">
            <div className="text-gray-300 space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-400">Version:</span>
                <span className="font-mono">v{versionInfo.version}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Commit:</span>
                <span className="font-mono">{getShortCommit(versionInfo.gitCommit)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Built:</span>
                <span className="text-xs">{formatBuildTime(versionInfo.buildTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Env:</span>
                <span className="text-xs capitalize">{versionInfo.environment}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 border border-gray-700 rounded-lg p-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-100 mb-3">Version Information</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Version:</span>
          <span className="text-gray-100 font-mono">v{versionInfo.version}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Git Commit:</span>
          <span className="text-gray-100 font-mono">{getShortCommit(versionInfo.gitCommit)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Build Time:</span>
          <span className="text-gray-100">{formatBuildTime(versionInfo.buildTime)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Environment:</span>
          <span className="text-gray-100 capitalize">{versionInfo.environment}</span>
        </div>
      </div>
    </div>
  );
}
