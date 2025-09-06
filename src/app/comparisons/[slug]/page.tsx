'use client'

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Comparison, Contender, ComparisonProperty, AttachedFile, Hyperlink } from '@/types';
import { aiService } from '@/lib/ai-service';
import { storage } from '@/lib/storage';
import ContenderForm from '@/components/ContenderForm';

export default function ComparisonDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [contenders, setContenders] = useState<Contender[]>([]);
  const [isAddingContender, setIsAddingContender] = useState(false);
  const [editingContender, setEditingContender] = useState<string | null>(null);
  const [isManagingProperties, setIsManagingProperties] = useState(false);
  const [activePropertiesTab, setActivePropertiesTab] = useState<'properties' | 'ai-analysis'>('properties');
  const [isAnalyzingFiles, setIsAnalyzingFiles] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<string | null>(null);
  const defaultInstructions = `For tables or lists with product information:
- Combine code + description as property name (e.g., "ABC123 - Product Name")
- Use net price, final price, or total as the value
- For multiple columns, prioritize: Net Price > Total > Price > Amount
- Include currency symbol if present
- Skip header rows and totals

For general documents:
- Look for key-value pairs, specifications, or feature lists
- Extract meaningful properties with their values
- Convert text descriptions to structured data`;

  const [customInstructions, setCustomInstructions] = useState<string>('');
  const [editingProperty, setEditingProperty] = useState<string | null>(null);
  const [newProperty, setNewProperty] = useState({ 
    name: '', 
    type: 'text' as 'text' | 'number' | 'rating' | 'datetime',
    higherIsBetter: true
  });
  const [editProperty, setEditProperty] = useState({ 
    name: '', 
    type: 'text' as 'text' | 'number' | 'rating' | 'datetime',
    higherIsBetter: true
  });
  const [newPropertyError, setNewPropertyError] = useState('');
  const [editPropertyError, setEditPropertyError] = useState('');
  const [draggedProperty, setDraggedProperty] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      const comp = storage.getComparisonBySlug(slug);
      setComparison(comp);
      if (comp) {
        setContenders(storage.getContenders(comp.id));
      }
    }

    // Load custom instructions from localStorage
    const savedInstructions = localStorage.getItem('ai_custom_instructions');
    setCustomInstructions(savedInstructions || defaultInstructions);
  }, [slug, defaultInstructions]);

  const handleAddContender = (contender: Contender) => {
    if (!comparison) return;
    storage.saveContender(contender);
    setContenders(storage.getContenders(comparison.id));
    setIsAddingContender(false);
  };

  const handleDeleteContender = (id: string) => {
    if (confirm('Are you sure you want to delete this contender?')) {
      storage.deleteContender(id);
      setContenders(comparison ? storage.getContenders(comparison.id) : []);
    }
  };

  const handleAnalyzeFiles = async () => {
    if (!aiService.isEnabled()) {
      alert('Please configure an AI model in AI Settings first.');
      return;
    }

    // Check if we have any contenders with files
    const contendersWithFiles = contenders.filter(c => c.attachments && c.attachments.length > 0);
    if (contendersWithFiles.length === 0) {
      alert('No files found to analyze. Please attach files to a contender first.');
      return;
    }

    setIsAnalyzingFiles(true);
    setAnalysisResults(null);

    try {
      // For testing: Use first contender and first file
      const firstContender = contendersWithFiles[0];
      const firstFile = firstContender.attachments[0];

      console.log(`Analyzing file "${firstFile.name}" from contender "${firstContender.name}"`);
      
      // Send the file data as-is to the AI
      const fileContent = firstFile.data;
      
      console.log('File details:', {
        name: firstFile.name,
        type: firstFile.type,
        size: firstFile.size,
        dataLength: firstFile.data.length
      });

      const analysisRequest = {
        type: 'extract_properties' as const,
        content: fileContent,
        context: {
          comparisonName: comparison?.name,
          attachmentType: firstFile.type,
          contenderName: firstContender.name,
          customInstructions: customInstructions.trim() || undefined
        }
      };

      console.log('=== FILE CONTENT ===');
      console.log(fileContent);
      console.log('=== ANALYSIS REQUEST ===');
      console.log(analysisRequest);

      const result = await aiService.analyze(analysisRequest);
      
      console.log('=== ANALYSIS RESULT ===');
      console.log(result);
      console.log('=== RAW RESPONSE ===');
      if (result.success && result.data) {
        console.log('Parsed data:', result.data);
      }
      
      if (result.success) {
        setAnalysisResults(JSON.stringify(result.data, null, 2));
      } else {
        setAnalysisResults(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setAnalysisResults(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAnalyzingFiles(false);
    }
  };

  const handleEditContender = (contender: Contender) => {
    setEditingContender(contender.id);
  };

  const handleSaveEdit = (contender: Contender) => {
    if (!comparison) return;
    storage.saveContender(contender);
    setContenders(storage.getContenders(comparison.id));
    setEditingContender(null);
  };

  const handleCancelEdit = () => {
    setEditingContender(null);
  };

  const handleAddProperty = () => {
    if (!comparison) return;
    
    if (!newProperty.name.trim()) {
      setNewPropertyError('Property name is required');
      return;
    }
    
    // Clear any previous error
    setNewPropertyError('');
    
    const property: ComparisonProperty = {
      key: storage.generateSlug(newProperty.name.trim()),
      name: newProperty.name.trim(),
      type: newProperty.type,
      higherIsBetter: (newProperty.type === 'number' || newProperty.type === 'rating' || newProperty.type === 'datetime') ? newProperty.higherIsBetter : undefined
    };

    const updatedComparison: Comparison = {
      ...comparison,
      properties: [...comparison.properties, property]
    };

    storage.saveComparison(updatedComparison);
    setComparison(updatedComparison);
    setNewProperty({ name: '', type: 'text', higherIsBetter: true });
  };

  const handleEditProperty = (property: ComparisonProperty) => {
    setEditingProperty(property.key);
    setEditProperty({
      name: property.name,
      type: property.type,
      higherIsBetter: property.higherIsBetter !== false
    });
  };

  const handleSavePropertyEdit = () => {
    if (!comparison || !editingProperty) return;
    
    if (!editProperty.name.trim()) {
      setEditPropertyError('Property name is required');
      return;
    }
    
    // Clear any previous error
    setEditPropertyError('');
    
    const oldProperty = comparison.properties.find(p => p.key === editingProperty);
    const typeChanged = oldProperty && oldProperty.type !== editProperty.type;
    
    const updatedProperties = comparison.properties.map(prop => 
      prop.key === editingProperty 
        ? { 
            ...prop, 
            name: editProperty.name.trim(),
            type: editProperty.type,
            higherIsBetter: (editProperty.type === 'number' || editProperty.type === 'rating' || editProperty.type === 'datetime') ? editProperty.higherIsBetter : undefined
          }
        : prop
    );

    // Convert existing values if type changed
    let updatedContenders = contenders;
    if (typeChanged) {
      updatedContenders = contenders.map(contender => {
        const currentValue = contender.properties[editingProperty];
        let convertedValue: string | number = currentValue;

        if (currentValue !== undefined && currentValue !== '') {
          switch (editProperty.type) {
            case 'number':
              const numValue = parseFloat(currentValue as string);
              convertedValue = isNaN(numValue) ? 0 : numValue;
              break;
            case 'rating':
              const ratingValue = parseInt(currentValue as string);
              convertedValue = isNaN(ratingValue) ? 1 : Math.max(1, Math.min(5, ratingValue));
              break;
            case 'text':
              convertedValue = String(currentValue);
              break;
            case 'datetime':
              if (typeof currentValue === 'string') {
                // Try to parse as date, fallback to current date if invalid
                const dateValue = new Date(currentValue);
                convertedValue = isNaN(dateValue.getTime()) ? new Date().toISOString() : currentValue;
              } else {
                convertedValue = new Date().toISOString();
              }
              break;
          }
        } else {
          // Set default values for empty properties
          switch (editProperty.type) {
            case 'number':
              convertedValue = 0;
              break;
            case 'rating':
              convertedValue = 1;
              break;
            case 'datetime':
              convertedValue = '';
              break;
            default:
              convertedValue = '';
          }
        }

        return {
          ...contender,
          properties: {
            ...contender.properties,
            [editingProperty]: convertedValue
          }
        };
      });

      // Save updated contenders
      updatedContenders.forEach(contender => storage.saveContender(contender));
      setContenders(updatedContenders);
    }

    const updatedComparison: Comparison = {
      ...comparison,
      properties: updatedProperties
    };

    storage.saveComparison(updatedComparison);
    setComparison(updatedComparison);
    setEditingProperty(null);
    setEditProperty({ name: '', type: 'text', higherIsBetter: true });
  };

  const handleCancelPropertyEdit = () => {
    setEditingProperty(null);
    setEditProperty({ name: '', type: 'text', higherIsBetter: true });
    setEditPropertyError(''); // Clear any validation error
  };

  const handlePropertyDragStart = (e: React.DragEvent, propertyKey: string) => {
    setDraggedProperty(propertyKey);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handlePropertyDragEnd = () => {
    setDraggedProperty(null);
  };

  const handlePropertyDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handlePropertyDrop = (e: React.DragEvent, targetPropertyKey: string) => {
    e.preventDefault();
    
    if (!comparison || !draggedProperty || draggedProperty === targetPropertyKey) return;

    const currentProperties = [...comparison.properties];
    const draggedIndex = currentProperties.findIndex(p => p.key === draggedProperty);
    const targetIndex = currentProperties.findIndex(p => p.key === targetPropertyKey);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Remove the dragged property and insert it at the target position
    const [removed] = currentProperties.splice(draggedIndex, 1);
    currentProperties.splice(targetIndex, 0, removed);

    const updatedComparison: Comparison = {
      ...comparison,
      properties: currentProperties
    };

    storage.saveComparison(updatedComparison);
    setComparison(updatedComparison);
    setDraggedProperty(null);
  };

  const handleDeleteProperty = (propertyKey: string) => {
    if (!comparison) return;
    
    if (confirm('Are you sure you want to delete this property? All values for this property will be lost.')) {
      const updatedComparison: Comparison = {
        ...comparison,
        properties: comparison.properties.filter(p => p.key !== propertyKey)
      };

      // Remove this property from all contenders
      const updatedContenders = contenders.map(contender => ({
        ...contender,
        properties: Object.fromEntries(
          Object.entries(contender.properties).filter(([key]) => key !== propertyKey)
        )
      }));

      storage.saveComparison(updatedComparison);
      updatedContenders.forEach(contender => storage.saveContender(contender));
      
      setComparison(updatedComparison);
      setContenders(storage.getContenders(comparison.id));
    }
  };


  const getBestPropertyValues = () => {
    const bestValues: Record<string, number | string> = {};
    
    comparison?.properties.forEach(property => {
      if (property.type === 'number' || property.type === 'rating') {
        const higherIsBetter = property.higherIsBetter !== false; // default to true
        let bestValue = higherIsBetter ? -Infinity : Infinity;
        
        contenders.forEach(contender => {
          const value = contender.properties[property.key];
          if (typeof value === 'number' && value > 0) {
            if (higherIsBetter && value > bestValue) {
              bestValue = value;
            } else if (!higherIsBetter && value < bestValue) {
              bestValue = value;
            }
          }
        });
        
        if (bestValue !== -Infinity && bestValue !== Infinity) {
          bestValues[property.key] = bestValue;
        }
      } else if (property.type === 'datetime') {
        const higherIsBetter = property.higherIsBetter !== false; // default to true (later dates are better)
        let bestValue: string | null = null;
        let bestTimestamp = higherIsBetter ? -Infinity : Infinity;
        
        contenders.forEach(contender => {
          const value = contender.properties[property.key];
          if (typeof value === 'string' && value.trim()) {
            const timestamp = new Date(value).getTime();
            if (!isNaN(timestamp)) {
              if (higherIsBetter && timestamp > bestTimestamp) {
                bestValue = value;
                bestTimestamp = timestamp;
              } else if (!higherIsBetter && timestamp < bestTimestamp) {
                bestValue = value;
                bestTimestamp = timestamp;
              }
            }
          }
        });
        
        if (bestValue) {
          bestValues[property.key] = bestValue;
        }
      }
    });
    
    return bestValues;
  };


  const handleDropOnCard = async (e: React.DragEvent, contenderId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const file = files[0];
    
    // Check file size
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    try {
      const reader = new FileReader();
      const attachedFile = await new Promise<AttachedFile>((resolve, reject) => {
        reader.onload = () => {
          resolve({
            id: storage.generateId(),
            name: file.name,
            type: file.type,
            size: file.size,
            data: reader.result as string,
            uploadedAt: new Date().toISOString()
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      // Find the contender and update it
      const contender = contenders.find(c => c.id === contenderId);
      if (contender) {
        const updatedContender: Contender = {
          ...contender,
          attachments: [...(contender.attachments || []), attachedFile]
        };
        
        storage.saveContender(updatedContender);
        setContenders(storage.getContenders(comparison!.id));
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file. Please try again.');
    }
  };

  const handleDownloadFile = (file: AttachedFile) => {
    const link = document.createElement('a');
    link.href = file.data;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  if (!comparison) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xl text-gray-600">Comparison not found</p>
          <Link href="/comparisons" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
            Back to Comparisons
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link href="/comparisons" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← Back to Comparisons
          </Link>
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">{comparison.name}</h1>
            <div className="flex gap-3">
              <button
                onClick={() => setIsManagingProperties(true)}
                className="bg-gray-600 hover:bg-gray-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
              >
                Manage Properties
              </button>
              {!isAddingContender && !editingContender && (
                <button
                  onClick={() => setIsAddingContender(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
                >
                  Add Contender
                </button>
              )}
            </div>
          </div>
        </div>


        {isManagingProperties && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Manage Comparison Properties</h2>
            
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 mb-6">
              <button
                onClick={() => setActivePropertiesTab('properties')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activePropertiesTab === 'properties' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                Properties
              </button>
              {aiService.isEnabled() && (
                <button
                  onClick={() => setActivePropertiesTab('ai-analysis')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ml-4 ${
                    activePropertiesTab === 'ai-analysis' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                >
                  AI Analysis
                </button>
              )}
            </div>

            {/* Properties Tab Content */}
            {activePropertiesTab === 'properties' && (
              <div>
                <p className="text-gray-600 text-sm mb-4">
                  Properties are criteria that each contender can be evaluated on (e.g., Price, Quality, Features).
                  <br />
                  <span className="text-blue-600">Drag the ⋮⋮ icon to reorder properties.</span>
                </p>

            {comparison.properties.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">Current Properties</h3>
                <div className="space-y-2">
                  {comparison.properties.map((property, index) => (
                    <div 
                      key={property.key} 
                      className={`p-3 bg-gray-50 rounded-md transition-all duration-200 ${
                        draggedProperty === property.key ? 'opacity-50 scale-95' : ''
                      } ${
                        draggedProperty && draggedProperty !== property.key ? 'border-2 border-dashed border-blue-300' : ''
                      }`}
                      draggable={editingProperty !== property.key}
                      onDragStart={(e) => handlePropertyDragStart(e, property.key)}
                      onDragEnd={handlePropertyDragEnd}
                      onDragOver={handlePropertyDragOver}
                      onDrop={(e) => handlePropertyDrop(e, property.key)}
                    >
                      {editingProperty === property.key ? (
                        <div className="space-y-3">
                          <div className="flex gap-3 items-end">
                            <div className="flex-1">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Property Name
                              </label>
                              <input
                                type="text"
                                value={editProperty.name}
                                onChange={(e) => {
                                  setEditProperty(prev => ({ ...prev, name: e.target.value }));
                                  if (editPropertyError) setEditPropertyError(''); // Clear error when user starts typing
                                }}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                                  editPropertyError 
                                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                }`}
                              />
                              {editPropertyError && (
                                <p className="mt-1 text-sm text-red-600">{editPropertyError}</p>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Type
                              </label>
                              <select
                                value={editProperty.type}
                                onChange={(e) => setEditProperty(prev => ({ ...prev, type: e.target.value as 'text' | 'number' | 'rating' | 'datetime' }))}
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="text">Text</option>
                                <option value="number">Number</option>
                                <option value="rating">Rating (1-5)</option>
                                <option value="datetime">Date & Time</option>
                              </select>
                            </div>
                          </div>
                          
                          {(editProperty.type === 'number' || editProperty.type === 'rating' || editProperty.type === 'datetime') && (
                            <div className="flex items-center space-x-4 p-3 bg-blue-50 rounded-md">
                              <label className="block text-sm font-medium text-gray-700">
                                Comparison Direction:
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name="editHigherIsBetter"
                                  checked={editProperty.higherIsBetter}
                                  onChange={() => setEditProperty(prev => ({ ...prev, higherIsBetter: true }))}
                                  className="mr-2"
                                />
                                <span className="text-sm">Higher is better</span>
                                <span className="ml-1 text-xs text-gray-500">(Quality, Rating)</span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name="editHigherIsBetter"
                                  checked={!editProperty.higherIsBetter}
                                  onChange={() => setEditProperty(prev => ({ ...prev, higherIsBetter: false }))}
                                  className="mr-2"
                                />
                                <span className="text-sm">Lower is better</span>
                                <span className="ml-1 text-xs text-gray-500">(Price, Time)</span>
                              </label>
                            </div>
                          )}
                          
                          <div className="flex gap-2">
                            <button
                              onClick={handleSavePropertyEdit}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1 text-sm rounded transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancelPropertyEdit}
                              className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold px-3 py-1 text-sm rounded transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center">
                          <div className="flex items-center flex-1">
                            <div 
                              className="cursor-move mr-3 text-gray-400 hover:text-gray-600"
                              title="Drag to reorder"
                            >
                              <span className="text-lg leading-none">⋮⋮</span>
                            </div>
                            <div 
                              className="cursor-pointer hover:text-blue-600 flex-1"
                              onClick={() => handleEditProperty(property)}
                            >
                              <span className="font-medium">{property.name}</span>
                              <span className="ml-2 text-sm text-gray-500">
                                ({property.type}
                                {(property.type === 'number' || property.type === 'rating' || property.type === 'datetime') && 
                                  `, ${property.higherIsBetter !== false ? 'higher is better' : 'lower is better'}`
                                })
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteProperty(property.key)}
                            className="text-red-600 hover:text-red-800 font-medium text-sm ml-2"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <h3 className="text-lg font-medium mb-3">Add New Property</h3>
              <div className="space-y-4">
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Property Name
                    </label>
                    <input
                      type="text"
                      value={newProperty.name}
                      onChange={(e) => {
                        setNewProperty(prev => ({ ...prev, name: e.target.value }));
                        if (newPropertyError) setNewPropertyError(''); // Clear error when user starts typing
                      }}
                      placeholder="e.g., Price, Quality, Ease of Use"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                        newPropertyError 
                          ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                    />
                    {newPropertyError && (
                      <p className="mt-1 text-sm text-red-600">{newPropertyError}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type
                    </label>
                    <select
                      value={newProperty.type}
                      onChange={(e) => setNewProperty(prev => ({ ...prev, type: e.target.value as 'text' | 'number' | 'rating' | 'datetime' }))}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="rating">Rating (1-5)</option>
                      <option value="datetime">Date & Time</option>
                    </select>
                  </div>
                  <button
                    onClick={handleAddProperty}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-md transition-colors"
                  >
                    Add
                  </button>
                </div>
                
                {(newProperty.type === 'number' || newProperty.type === 'rating' || newProperty.type === 'datetime') && (
                  <div className="flex items-center space-x-4 p-3 bg-blue-50 rounded-md">
                    <label className="block text-sm font-medium text-gray-700">
                      Comparison Direction:
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="higherIsBetter"
                        checked={newProperty.higherIsBetter}
                        onChange={() => setNewProperty(prev => ({ ...prev, higherIsBetter: true }))}
                        className="mr-2"
                      />
                      <span className="text-sm">Higher is better</span>
                      <span className="ml-1 text-xs text-gray-500">(Quality, Rating)</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="higherIsBetter"
                        checked={!newProperty.higherIsBetter}
                        onChange={() => setNewProperty(prev => ({ ...prev, higherIsBetter: false }))}
                        className="mr-2"
                      />
                      <span className="text-sm">Lower is better</span>
                      <span className="ml-1 text-xs text-gray-500">(Price, Time)</span>
                    </label>
                  </div>
                )}
              </div>
            </div>
              </div>
            )}

            {/* AI Analysis Tab Content */}
            {activePropertiesTab === 'ai-analysis' && (
              <div>
                <p className="text-gray-600 text-sm mb-4">
                  Analyze attached files to automatically extract properties and values for comparison.
                </p>
                
                {/* Custom Instructions */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parsing Instructions
                  </label>
                  <textarea
                    value={customInstructions}
                    onChange={(e) => {
                      setCustomInstructions(e.target.value);
                      localStorage.setItem('ai_custom_instructions', e.target.value);
                    }}
                    placeholder="Describe how to extract properties from your files..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    rows={6}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Customize how the AI should extract properties and values from your files. The AI will always return JSON format.
                  </p>
                </div>
                
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={handleAnalyzeFiles}
                    disabled={isAnalyzingFiles}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold px-4 py-2 rounded-md transition-colors"
                  >
                    {isAnalyzingFiles ? 'Analyzing Files...' : 'Analyze Attachments'}
                  </button>
                </div>
                {analysisResults && (
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                    <h4 className="font-medium text-gray-700 mb-2">Analysis Results:</h4>
                    <pre className="text-sm text-gray-600 whitespace-pre-wrap overflow-auto max-h-64">
                      {analysisResults}
                    </pre>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setIsManagingProperties(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold px-4 py-2 rounded-md transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {isAddingContender && (
          <ContenderForm
            comparison={comparison}
            mode="add"
            onSubmit={handleAddContender}
            onCancel={() => setIsAddingContender(false)}
          />
        )}

        {editingContender && (
          <ContenderForm
            comparison={comparison}
            mode="edit"
            existingContender={contenders.find(c => c.id === editingContender)}
            onSubmit={handleSaveEdit}
            onCancel={handleCancelEdit}
          />
        )}

        {contenders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600 mb-4">No contenders yet</p>
            <p className="text-gray-500">Add some options to start comparing!</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {contenders.filter(c => editingContender !== c.id).map((contender) => (
              <div 
                key={contender.id} 
                className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:shadow-lg transition-all duration-200 hover:border-blue-500"
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => handleDropOnCard(e, contender.id)}
              >
                  <div className="flex justify-between items-start mb-4">
                      <h3 
                        className="text-xl font-semibold text-blue-400 hover:text-blue-300 cursor-pointer"
                        onClick={() => handleEditContender(contender)}
                      >
                        {contender.name}
                      </h3>
                      <button
                        onClick={() => handleDeleteContender(contender.id)}
                        className="text-red-400 hover:text-red-300 font-medium text-sm"
                      >
                        Delete
                      </button>
                    </div>

                    {contender.description && (
                      <div className="mb-4">
                        <p className="text-gray-400 text-sm italic">{contender.description}</p>
                      </div>
                    )}

                    {comparison.properties.length > 0 && Object.keys(contender.properties).length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-200 mb-2">Properties</h4>
                        <div className="space-y-2">
                          {comparison.properties.map((property) => {
                            const value = contender.properties[property.key];
                            if (value === undefined || value === '') return null;
                            
                            const bestValues = getBestPropertyValues();
                            const isBest = ((property.type === 'number' || property.type === 'rating') && 
                                         typeof value === 'number' && 
                                         value === bestValues[property.key] &&
                                         value > 0) ||
                                         (property.type === 'datetime' &&
                                         typeof value === 'string' &&
                                         value === bestValues[property.key]);
                            
                            return (
                              <div key={property.key} className="flex justify-between items-center text-sm">
                                <span className={`${isBest ? 'text-green-400 font-medium' : 'text-gray-300'}`}>{property.name}:</span>
                                <span className={`font-medium ${isBest ? 'text-green-400' : 'text-gray-100'}`}>
                                  {property.type === 'rating' ? (
                                    <div className="flex items-center gap-1">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <span
                                          key={star}
                                          className={`text-sm ${
                                            (value as number) >= star 
                                              ? isBest ? 'text-green-400' : 'text-yellow-400' 
                                              : 'text-gray-300'
                                          }`}
                                        >
                                          ★
                                        </span>
                                      ))}
                                      <span className={`ml-1 ${isBest ? 'text-green-400' : 'text-gray-300'}`}>({value}/5)</span>
                                    </div>
                                  ) : property.type === 'datetime' ? (
                                    new Date(value as string).toLocaleString()
                                  ) : (
                                    value
                                  )}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {contender.attachments && contender.attachments.length > 0 && (
                      <div className="mb-4 pt-3 border-t border-gray-600">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-300">Attachments:</span>
                          <span className="font-medium text-gray-100">{contender.attachments.length}</span>
                        </div>
                      </div>
                    )}

                    {contender.hyperlinks && contender.hyperlinks.length > 0 && (
                      <div className="mb-4 pt-3 border-t border-gray-600">
                        <h4 className="font-medium text-gray-200 mb-2">Links</h4>
                        <div className="space-y-1">
                          {contender.hyperlinks.map((hyperlink) => (
                            <div key={hyperlink.id}>
                              <a
                                href={hyperlink.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-400 hover:text-blue-300 underline break-all"
                              >
                                {hyperlink.url}
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(contender.pros.length > 0 || contender.cons.length > 0) && (
                      <div className="space-y-4">
                        {contender.pros.length > 0 && (
                          <div>
                            <h4 className="font-medium text-green-400 mb-2">Pros</h4>
                            <ul className="space-y-1">
                              {contender.pros.map((pro, index) => (
                                <li key={index} className="text-sm text-gray-300 flex items-start">
                                  <span className="text-green-400 mr-2">+</span>
                                  {pro}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {contender.cons.length > 0 && (
                          <div>
                            <h4 className="font-medium text-red-400 mb-2">Cons</h4>
                            <ul className="space-y-1">
                              {contender.cons.map((con, index) => (
                                <li key={index} className="text-sm text-gray-300 flex items-start">
                                  <span className="text-red-400 mr-2">-</span>
                                  {con}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}