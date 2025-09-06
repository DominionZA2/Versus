'use client';

import AISettings from '@/components/AISettings';

export default function AISettingsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-100 mb-8">AI Settings</h1>
        <div className="bg-gray-800 border border-gray-700 rounded-lg">
          <AISettings />
        </div>
      </div>
    </div>
  );
}