'use client'

interface AILoadingAnimationProps {
  className?: string;
}

export default function AILoadingAnimation({ className = '' }: AILoadingAnimationProps) {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* Main spinner */}
      <div className="relative mb-4">
        {/* Outer rotating ring */}
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
        
        {/* Inner pulsing dot */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
        </div>
      </div>
      
      {/* Text with animated dots */}
      <div className="flex items-center space-x-1">
        <span className="text-gray-300 text-sm">Processing your data with</span>
        <span className="text-blue-400 font-mono text-sm font-bold">AI</span>
        <div className="flex space-x-0.5">
          <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
}
