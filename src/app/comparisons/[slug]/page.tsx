'use client'

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Comparison, Contender, ComparisonProperty, AttachedFile, Hyperlink } from '@/types';
import { aiService } from '@/lib/ai-service';
import { storage } from '@/lib/storage';
import AnalysisResultsTabs from '@/components/AnalysisResultsTabs';
import AILoadingAnimation from '@/components/AILoadingAnimation';
import FileAnalysisList from '@/components/FileAnalysisList';
import UnifiedAnalysisResultsGrid from '@/components/UnifiedAnalysisResultsGrid';
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
  const [analysisAbortController, setAnalysisAbortController] = useState<AbortController | null>(null);
  const [analysisResults, setAnalysisResults] = useState<Array<{
    id: string;
    fileName: string;
    contenderName: string;
    status: 'pending' | 'analyzing' | 'completed' | 'error';
    data?: any;
    rawJson?: string;
    error?: string;
  }>>([]);
  const [isAiAvailable, setIsAiAvailable] = useState(false);

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

    // Load additional instructions from localStorage (default to empty since core prompt is always used)
    const savedInstructions = localStorage.getItem('ai_custom_instructions');
    setCustomInstructions(savedInstructions || '');
  }, [slug]);

  // Check AI availability
  useEffect(() => {
    const checkAiAvailability = () => {
      setIsAiAvailable(aiService.isEnabled());
    };
    
    checkAiAvailability();
    
    // Check periodically in case settings change in another tab
    const interval = setInterval(checkAiAvailability, 2000);
    return () => clearInterval(interval);
  }, []);

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

  const handleCancelAnalysis = () => {
    if (analysisAbortController) {
      analysisAbortController.abort();
      setAnalysisAbortController(null);
    }
    setIsAnalyzingFiles(false);
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

    // Create abort controller for cancellation
    const abortController = new AbortController();
    setAnalysisAbortController(abortController);
    setIsAnalyzingFiles(true);

    // Collect all files to analyze
    const filesToAnalyze: Array<{
      id: string;
      fileName: string;
      contenderName: string;
      fileData: string;
      fileType: string;
    }> = [];

    contendersWithFiles.forEach(contender => {
      contender.attachments?.forEach(file => {
        filesToAnalyze.push({
          id: `${contender.id}-${file.name}`,
          fileName: file.name,
          contenderName: contender.name,
          fileData: file.data,
          fileType: file.type
        });
      });
    });

    // Initialize analysis results
    setAnalysisResults(filesToAnalyze.map(file => ({
      id: file.id,
      fileName: file.fileName,
      contenderName: file.contenderName,
      status: 'analyzing' as const
    })));

    try {
      // Process files sequentially
      for (const file of filesToAnalyze) {
        // Check if the request was aborted before processing each file
        if (abortController.signal.aborted) {
          return;
        }

        // File is being analyzed (status already set to 'analyzing' in initialization)

        try {
          const analysisRequest = {
            type: 'extract_properties' as const,
            content: file.fileData,
            context: {
              comparisonName: comparison?.name,
              attachmentType: file.fileType,
              contenderName: file.contenderName,
              customInstructions: customInstructions.trim() || undefined
            }
          };

          console.log(`Analyzing file "${file.fileName}" from contender "${file.contenderName}"`);

          const result = await aiService.analyze(analysisRequest);
          
          // Check if the request was aborted after analysis
          if (abortController.signal.aborted) {
            return;
          }

          if (result.success) {
            setAnalysisResults(prev => prev.map(prevResult => 
              prevResult.id === file.id 
                ? { 
                    ...prevResult, 
                    status: 'completed' as const,
                    data: result.data,
                    rawJson: JSON.stringify(result.data, null, 2)
                  }
                : prevResult
            ));
          } else {
            setAnalysisResults(prev => prev.map(prevResult => 
              prevResult.id === file.id 
                ? { 
                    ...prevResult, 
                    status: 'error' as const,
                    error: result.error || 'Unknown error'
                  }
                : prevResult
            ));
          }
        } catch (error) {
          setAnalysisResults(prev => prev.map(prevResult => 
            prevResult.id === file.id 
              ? { 
                  ...prevResult, 
                  status: 'error' as const,
                  error: error instanceof Error ? error.message : 'Unknown error'
                }
              : prevResult
          ));
        }
      }

    } catch (error) {
      // Check if the error is due to abortion
      if (abortController.signal.aborted) {
        console.log('Analysis was cancelled');
        return;
      }
      
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzingFiles(false);
      setAnalysisAbortController(null);
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

    // Check for URLs first
    const urlData = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
    if (urlData) {
      const urls = urlData.split('\n').filter(url => url.trim() && !url.startsWith('#'));
      if (urls.length > 0) {
        const url = urls[0].trim();
        // Basic URL validation
        try {
          new URL(url);
          
          const contender = contenders.find(c => c.id === contenderId);
          if (contender) {
            const newHyperlink: Hyperlink = {
              id: storage.generateId(),
              url: url,
              addedAt: new Date().toISOString()
            };
            
            const updatedContender: Contender = {
              ...contender,
              hyperlinks: [...(contender.hyperlinks || []), newHyperlink]
            };
            
            storage.saveContender(updatedContender);
            setContenders(storage.getContenders(comparison!.id));
          }
          return;
        } catch {
          // Not a valid URL, continue to file handling
        }
      }
    }

    // Handle files if no URL was found
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
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-100">{comparison.name}</h1>
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
          <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-100 mb-4">Manage comparison properties for {comparison.name}</h2>
            
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-600 mb-6">
              <button
                onClick={() => setActivePropertiesTab('properties')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activePropertiesTab === 'properties' 
                    ? 'border-blue-500 text-blue-400' 
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                Properties
              </button>
              <button
                onClick={() => setActivePropertiesTab('ai-analysis')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ml-4 ${
                  activePropertiesTab === 'ai-analysis' 
                    ? 'border-blue-500 text-blue-400' 
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                AI Analysis
              </button>
            </div>

            {/* Properties Tab Content */}
            {activePropertiesTab === 'properties' && (
              <div>
                <p className="text-gray-400 text-sm mb-4">
                  Properties are criteria that each contender can be evaluated on (e.g., Price, Quality, Features).
                  <br />
                  <span className="text-blue-400">Drag the ⋮⋮ icon to reorder properties.</span>
                </p>

            {comparison.properties.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-200 mb-3">Current Properties</h3>
                <div className="space-y-2">
                  {comparison.properties.map((property, index) => (
                    <div 
                      key={property.key} 
                      className={`p-3 bg-gray-700 border border-gray-600 rounded-md transition-all duration-200 ${
                        draggedProperty === property.key ? 'opacity-50 scale-95' : ''
                      } ${
                        draggedProperty && draggedProperty !== property.key ? 'border-2 border-dashed border-blue-400' : ''
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
                              <label className="block text-sm font-medium text-gray-300 mb-1">
                                Property Name
                              </label>
                              <input
                                type="text"
                                value={editProperty.name}
                                onChange={(e) => {
                                  setEditProperty(prev => ({ ...prev, name: e.target.value }));
                                  if (editPropertyError) setEditPropertyError(''); // Clear error when user starts typing
                                }}
                                className={`w-full px-3 py-2 bg-gray-600 border rounded-md text-gray-100 focus:outline-none focus:ring-2 ${
                                  editPropertyError 
                                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                                    : 'border-gray-500 focus:ring-blue-500 focus:border-blue-500'
                                }`}
                              />
                              {editPropertyError && (
                                <p className="mt-1 text-sm text-red-600">{editPropertyError}</p>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-1">
                                Type
                              </label>
                              <select
                                value={editProperty.type}
                                onChange={(e) => setEditProperty(prev => ({ ...prev, type: e.target.value as 'text' | 'number' | 'rating' | 'datetime' }))}
                                className="px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="text">Text</option>
                                <option value="number">Number</option>
                                <option value="rating">Rating (1-5)</option>
                                <option value="datetime">Date & Time</option>
                              </select>
                            </div>
                          </div>
                          
                          {(editProperty.type === 'number' || editProperty.type === 'rating' || editProperty.type === 'datetime') && (
                            <div className="flex items-center space-x-4 p-3 bg-gray-600 rounded-md">
                              <label className="block text-sm font-medium text-gray-300">
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
                                <span className="text-sm text-gray-100">Higher is better</span>
                                <span className="ml-1 text-xs text-gray-400">(Quality, Rating)</span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name="editHigherIsBetter"
                                  checked={!editProperty.higherIsBetter}
                                  onChange={() => setEditProperty(prev => ({ ...prev, higherIsBetter: false }))}
                                  className="mr-2"
                                />
                                <span className="text-sm text-gray-100">Lower is better</span>
                                <span className="ml-1 text-xs text-gray-400">(Price, Time)</span>
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

            <div className="border-t border-gray-600 pt-4">
              <h3 className="text-lg font-medium text-gray-200 mb-3">Add New Property</h3>
              <div className="space-y-4">
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
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
                      className={`w-full px-3 py-2 bg-gray-600 border rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 ${
                        newPropertyError 
                          ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                          : 'border-gray-500 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                    />
                    {newPropertyError && (
                      <p className="mt-1 text-sm text-red-600">{newPropertyError}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Type
                    </label>
                    <select
                      value={newProperty.type}
                      onChange={(e) => setNewProperty(prev => ({ ...prev, type: e.target.value as 'text' | 'number' | 'rating' | 'datetime' }))}
                      className="px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <div className="flex items-center space-x-4 p-3 bg-gray-600 rounded-md">
                    <label className="block text-sm font-medium text-gray-300">
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
                      <span className="text-sm text-gray-100">Higher is better</span>
                      <span className="ml-1 text-xs text-gray-400">(Quality, Rating)</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="higherIsBetter"
                        checked={!newProperty.higherIsBetter}
                        onChange={() => setNewProperty(prev => ({ ...prev, higherIsBetter: false }))}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-100">Lower is better</span>
                      <span className="ml-1 text-xs text-gray-400">(Price, Time)</span>
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
                <p className="text-gray-400 text-sm mb-4">
                  Analyze attached files to automatically extract properties and values for comparison.
                </p>
                
                {!isAiAvailable && (
                  <div className="bg-amber-900/20 border border-amber-800 rounded-md p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <span className="text-amber-400 text-lg">⚠️</span>
                      </div>
                      <div>
                        <h3 className="text-amber-300 font-medium mb-2">No AI Model Configured</h3>
                        <p className="text-amber-200 text-sm mb-3">
                          To use AI analysis features, you need to configure an AI model with a valid API key.
                        </p>
                        <Link 
                          href="/ai-settings" 
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-amber-900 bg-amber-400 rounded-md hover:bg-amber-300 transition-colors"
                        >
                          Configure AI Settings
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Custom Instructions */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Additional Instructions (Optional)
                  </label>
                  <textarea
                    value={customInstructions}
                    onChange={(e) => {
                      setCustomInstructions(e.target.value);
                      localStorage.setItem('ai_custom_instructions', e.target.value);
                    }}
                    placeholder="Add specific instructions for your file type or domain (e.g., 'Focus on pricing tables', 'Extract server configuration settings', etc.)"
                    className={`w-full px-3 py-2 border rounded-md text-sm ${
                      isAiAvailable 
                        ? 'bg-gray-600 border-gray-500 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
                        : 'bg-gray-700 border-gray-600 text-gray-400 placeholder-gray-500 cursor-not-allowed'
                    }`}
                    rows={6}
                    disabled={!isAiAvailable}
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    The AI uses a core configuration extraction prompt. Your instructions here will be added as additional guidance for your specific use case.
                  </p>
                </div>
                
                <div className="bg-blue-900/20 border border-blue-800 rounded-md p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <span className="text-blue-400 text-lg">ℹ️</span>
                    </div>
                    <div>
                      <h4 className="text-blue-400 font-medium mb-1">What does Analyse do?</h4>
                      <p className="text-blue-200 text-sm">
                        The AI will examine attached files and scrape related hyperlinks to automatically extract 
                        configuration properties, technical specifications, and key values that can be used for 
                        comparison. This saves you time by automatically populating property values from documents 
                        like quotes, specifications, configuration files, and web pages.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mb-4">
                  {isAnalyzingFiles ? (
                    <button
                      onClick={handleCancelAnalysis}
                      className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-md transition-colors"
                    >
                      Cancel
                    </button>
                  ) : (
                    <button
                      onClick={handleAnalyzeFiles}
                      disabled={!isAiAvailable}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-semibold px-4 py-2 rounded-md transition-colors"
                    >
                      Analyse
                    </button>
                  )}
                </div>
                
                {/* Show busy indicator during analysis */}
                {isAnalyzingFiles && (
                  <div className="mt-4 flex items-center justify-center py-8">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-gray-300 text-lg">🧠 Analysing data like a digital detective...</span>
                    </div>
                  </div>
                )}
                
                {/* Show unified results grid when analysis is complete */}
                {!isAnalyzingFiles && analysisResults.length > 0 && analysisResults.some(r => r.status === 'completed') && (
                  <div className="mt-4">
                    <UnifiedAnalysisResultsGrid results={analysisResults} />
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setIsManagingProperties(false)}
                className="bg-gray-600 hover:bg-gray-500 text-gray-100 font-semibold px-4 py-2 rounded-md transition-colors"
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


                    {comparison.properties.length > 0 && Object.keys(contender.properties).length > 0 && (
                      <div className="mb-4">
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
                                <span className={`${isBest ? 'text-green-400 font-medium' : 'text-gray-300'}`}>{property.name}</span>
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

                    <div className="mb-4 pt-3 border-t border-gray-600">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-300">Attachments</span>
                        <span className="font-medium text-gray-100">{contender.attachments?.length || 0}</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between items-center text-sm mb-2">
                        <span className="text-gray-300">Links</span>
                        <span className="font-medium text-gray-100">{contender.hyperlinks?.length || 0}</span>
                      </div>
                      {contender.hyperlinks && contender.hyperlinks.length > 0 && (
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
                      )}
                    </div>

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