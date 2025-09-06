'use client'

import { useState } from 'react';

interface TreeNode {
  name: string;
  value?: string | number;
  type?: 'text' | 'number' | 'rating' | 'datetime';
  children?: TreeNode[];
}

interface TreeViewProps {
  data: TreeNode[];
  className?: string;
}

interface TreeNodeComponentProps {
  node: TreeNode;
  level: number;
}

function TreeNodeComponent({ node, level }: TreeNodeComponentProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  const indentLevel = level * 16; // 16px per level

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
    <div className="select-none">
      <div 
        className="flex items-center py-1 hover:bg-gray-700/50 rounded cursor-pointer"
        style={{ paddingLeft: `${indentLevel}px` }}
        onClick={() => hasChildren && setIsExpanded(!isExpanded)}
      >
        {hasChildren && (
          <span className="mr-2 text-gray-400 text-sm">
            {isExpanded ? '▼' : '▶'}
          </span>
        )}
        {!hasChildren && <span className="mr-6" />}
        
        <div className="flex items-center w-full max-w-2xl">
          <span className="text-gray-200 font-medium">{node.name}</span>
          
          {node.value !== undefined && (
            <span className="text-gray-300 text-sm ml-2">
              {formatValue(node.value, node.type)}
            </span>
          )}
        </div>
      </div>
      
      {hasChildren && isExpanded && (
        <div>
          {node.children!.map((child, index) => (
            <TreeNodeComponent 
              key={index} 
              node={child} 
              level={level + 1} 
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function TreeView({ data, className = '' }: TreeViewProps) {
  if (!data || data.length === 0) {
    return (
      <div className={`text-gray-400 text-center py-4 ${className}`}>
        No data available
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 rounded-md border border-gray-600 ${className}`}>
      <div className="p-4">
        {data.map((node, index) => (
          <TreeNodeComponent 
            key={index} 
            node={node} 
            level={0} 
          />
        ))}
      </div>
    </div>
  );
}
