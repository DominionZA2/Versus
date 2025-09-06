'use client'

interface AnalysisResult {
  id: string;
  fileName: string;
  contenderName: string;
  status: 'pending' | 'analyzing' | 'completed' | 'error';
  data?: any;
  rawJson?: string;
  error?: string;
}

interface UnifiedAnalysisResultsGridProps {
  results: AnalysisResult[];
  className?: string;
}

export default function UnifiedAnalysisResultsGrid({ results, className = '' }: UnifiedAnalysisResultsGridProps) {
  // Filter only completed results
  const completedResults = results.filter(result => result.status === 'completed' && result.data);

  if (completedResults.length === 0) {
    return (
      <div className={`text-gray-400 text-center py-8 ${className}`}>
        No analysis results available
      </div>
    );
  }

  // Collect all unique properties from all files
  const allProperties = new Map<string, {
    name: string;
    type: string;
    sources: Array<{ fileName: string; contenderName: string; value: any; }>
  }>();

  completedResults.forEach(result => {
    const properties = result.data.properties || [];
    properties.forEach((property: any) => {
      const key = property.name || 'Unknown Property';
      if (!allProperties.has(key)) {
        allProperties.set(key, {
          name: key,
          type: property.type || 'text',
          sources: []
        });
      }
      allProperties.get(key)?.sources.push({
        fileName: result.fileName,
        contenderName: result.contenderName,
        value: property.value
      });
    });
  });

  const formatValue = (value: string | number | undefined, type?: string) => {
    if (value === undefined || value === null || value === '') return '-';
    
    if (type === 'datetime') {
      try {
        return new Date(value as string).toLocaleString();
      } catch {
        return String(value);
      }
    }
    
    if (type === 'rating') {
      const rating = Number(value);
      if (isNaN(rating)) return String(value);
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
    <div className={`bg-gray-800 rounded-lg border border-gray-600 ${className}`}>
      {/* Header */}
      <div className="bg-gray-700 px-6 py-4 border-b border-gray-600">
        <h3 className="text-lg font-semibold text-gray-200">
          Analysis Results Summary
        </h3>
        <p className="text-sm text-gray-400 mt-1">
          Properties extracted from {completedResults.length} file{completedResults.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Results Grid */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-600">
              <th className="text-left py-4 px-6 text-gray-300 font-medium">Property</th>
              <th className="text-left py-4 px-6 text-gray-300 font-medium">Type</th>
              {completedResults.map(result => (
                <th key={result.id} className="text-left py-4 px-6 text-gray-300 font-medium min-w-[200px]">
                  <div>
                    <div className="font-medium">{result.contenderName}</div>
                    <div className="text-xs text-gray-400 font-normal">{result.fileName}</div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from(allProperties.entries()).map(([propertyKey, propertyData]) => (
              <tr key={propertyKey} className="border-b border-gray-700 hover:bg-gray-700/30 transition-colors">
                <td className="py-4 px-6 text-gray-200 font-medium">
                  {propertyData.name}
                </td>
                <td className="py-4 px-6">
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-600 text-gray-300">
                    {propertyData.type}
                  </span>
                </td>
                {completedResults.map(result => {
                  const sourceData = propertyData.sources.find(
                    source => source.fileName === result.fileName && source.contenderName === result.contenderName
                  );
                  return (
                    <td key={result.id} className="py-4 px-6 text-gray-300">
                      {sourceData ? formatValue(sourceData.value, propertyData.type) : '-'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Show any errors from failed analyses */}
      {results.some(r => r.status === 'error') && (
        <div className="border-t border-gray-600 p-4">
          <h4 className="text-sm font-medium text-red-400 mb-2">Analysis Errors:</h4>
          {results.filter(r => r.status === 'error').map(result => (
            <div key={result.id} className="text-xs text-red-300 mb-1">
              <strong>{result.fileName} ({result.contenderName}):</strong> {result.error}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
