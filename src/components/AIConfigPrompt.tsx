'use client';

import { useRouter } from 'next/navigation';
import { aiService } from '@/lib/ai-service';
import { useEffect, useState } from 'react';

interface AIConfigPromptProps {
  title?: string;
  description?: string;
  className?: string;
  onDismiss?: () => void;
}

export default function AIConfigPrompt({ 
  title = "No AI Model Configured",
  description = "To use AI analysis features, you need to configure an AI model with a valid API key.",
  className = "",
  onDismiss
}: AIConfigPromptProps) {
  const router = useRouter();

  const handleConfigureClick = () => {
    router.push('/ai-settings');
  };

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss();
    }
  };

  return (
    <div className={`bg-yellow-900/20 border border-yellow-600 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">
          <svg 
            className="w-5 h-5 text-yellow-500" 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path 
              fillRule="evenodd" 
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" 
              clipRule="evenodd" 
            />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-yellow-400 mb-1">
            {title}
          </h3>
          <p className="text-sm text-yellow-200/90 mb-3">
            {description}
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleConfigureClick}
              className="bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors focus:outline-hidden focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-gray-800"
            >
              Configure AI Settings
            </button>
            {onDismiss && (
              <button
                onClick={handleDismiss}
                className="bg-gray-600 hover:bg-gray-500 text-gray-300 text-sm font-medium px-3 py-2 rounded-md transition-colors focus:outline-hidden focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Export a hook to check AI configuration status
export function useAIConfigured() {
  const [isConfigured, setIsConfigured] = useState(true);

  useEffect(() => {
    setIsConfigured(aiService.isEnabled());
    
    // Listen for storage changes (when user updates API key)
    const handleStorageChange = () => {
      setIsConfigured(aiService.isEnabled());
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return isConfigured;
}
