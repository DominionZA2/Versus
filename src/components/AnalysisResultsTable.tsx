'use client'

interface AnalysisResultsTableProps {
  data: any;
  sourceInfo?: {
    fileName?: string;
    url?: string;
    contenderName?: string;
  };
  className?: string;
}

export default function AnalysisResultsTable({ data, sourceInfo, className = '' }: AnalysisResultsTableProps) {
  if (!data) {
    return (
      <div className={`text-gray-400 text-center py-4 ${className}`}>
        No data available
      </div>
    );
  }

  // Extract properties from the analysis data
  const properties = data.properties || [];
  
  // Determine source display
  const getSourceDisplay = () => {
    if (sourceInfo?.fileName) {
      return `📄 ${sourceInfo.fileName}`;
    }
    if (sourceInfo?.url) {
      return `🔗 ${sourceInfo.url}`;
    }
    if (sourceInfo?.contenderName) {
      return `📋 ${sourceInfo.contenderName}`;
    }
    return '📄 Source File';
  };

  const formatValue = (value: string | number | undefined, type?: string) => {
    if (value === undefined) return '';
    
    if (type === 'datetime') {
      return new Date(value as string).toLocaleString();
    }
    
    if (type === 'rating') {
      const rating = value as number;
      return (
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={`text-sm ${
                rating >= star ? 'text-yellow-400' : 'text-gray-300'
              }`}
            >
              ★
            </span>
          ))}
          <span className="ml-1 text-gray-300">({rating}/5)</span>
        </div>
      );
    }
    
    return String(value);
  };

  return (
    <div className={`bg-gray-800 rounded-md border border-gray-600 ${className}`}>
      {/* Source Header */}
      <div className="bg-gray-700 px-4 py-3 border-b border-gray-600">
        <h3 className="text-gray-200 font-medium text-sm">
          {getSourceDisplay()}
        </h3>
      </div>

      {/* Properties Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-600">
              <th className="text-left py-3 px-4 text-gray-300 font-medium text-sm">Property</th>
              <th className="text-left py-3 px-4 text-gray-300 font-medium text-sm">Value</th>
              <th className="text-left py-3 px-4 text-gray-300 font-medium text-sm">Type</th>
            </tr>
          </thead>
          <tbody>
            {properties.length > 0 ? (
              properties.map((property: any, index: number) => (
                <tr 
                  key={index} 
                  className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors"
                >
                  <td className="py-3 px-4 text-gray-200 font-medium">
                    {property.name || 'Unknown Property'}
                  </td>
                  <td className="py-3 px-4 text-gray-300">
                    {formatValue(property.value, property.type)}
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-sm">
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-600">
                      {property.type || 'text'}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="py-8 px-4 text-center text-gray-400">
                  No properties found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
