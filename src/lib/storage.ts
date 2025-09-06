import { Comparison, Contender } from '@/types';

const COMPARISONS_KEY = 'versus_comparisons';
const CONTENDERS_KEY = 'versus_contenders';

export const storage = {
  // Comparisons
  getComparisons(): Comparison[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(COMPARISONS_KEY);
    const comparisons = data ? JSON.parse(data) : [];
    
    // Ensure backwards compatibility - add properties array if missing
    return comparisons.map((comp: any) => ({
      ...comp,
      properties: comp.properties || []
    }));
  },

  saveComparison(comparison: Comparison): void {
    if (typeof window === 'undefined') return;
    const comparisons = this.getComparisons();
    const existingIndex = comparisons.findIndex(c => c.id === comparison.id);
    
    if (existingIndex >= 0) {
      comparisons[existingIndex] = comparison;
    } else {
      comparisons.push(comparison);
    }
    
    localStorage.setItem(COMPARISONS_KEY, JSON.stringify(comparisons));
  },

  deleteComparison(id: string): void {
    if (typeof window === 'undefined') return;
    const comparisons = this.getComparisons().filter(c => c.id !== id);
    localStorage.setItem(COMPARISONS_KEY, JSON.stringify(comparisons));
    
    // Also delete related contenders
    const contenders = this.getContenders().filter(c => c.comparisonId !== id);
    localStorage.setItem(CONTENDERS_KEY, JSON.stringify(contenders));
  },

  getComparison(id: string): Comparison | null {
    return this.getComparisons().find(c => c.id === id) || null;
  },

  getComparisonBySlug(slug: string): Comparison | null {
    return this.getComparisons().find(c => c.slug === slug) || null;
  },

  // Contenders
  getContenders(comparisonId?: string): Contender[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(CONTENDERS_KEY);
    const contenders = data ? JSON.parse(data) : [];
    
    // Ensure backwards compatibility - add properties, attachments, and hyperlinks if missing
    const compatibleContenders = contenders.map((contender: any) => ({
      ...contender,
      properties: contender.properties || {},
      attachments: contender.attachments || [],
      hyperlinks: contender.hyperlinks || []
    }));
    
    return comparisonId 
      ? compatibleContenders.filter((c: Contender) => c.comparisonId === comparisonId)
      : compatibleContenders;
  },

  saveContender(contender: Contender): void {
    if (typeof window === 'undefined') return;
    const contenders = this.getContenders();
    const existingIndex = contenders.findIndex(c => c.id === contender.id);
    
    if (existingIndex >= 0) {
      contenders[existingIndex] = contender;
    } else {
      contenders.push(contender);
    }
    
    localStorage.setItem(CONTENDERS_KEY, JSON.stringify(contenders));
  },

  deleteContender(id: string): void {
    if (typeof window === 'undefined') return;
    const contenders = this.getContenders().filter(c => c.id !== id);
    localStorage.setItem(CONTENDERS_KEY, JSON.stringify(contenders));
  },

  // Utility
  generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
};