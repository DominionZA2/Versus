export interface ComparisonProperty {
  key: string;
  name: string;
  type: 'text' | 'number' | 'rating'; // rating is 1-5 stars
}

export interface Comparison {
  id: string;
  name: string;
  slug: string;
  properties: ComparisonProperty[];
  createdAt: string;
}

export interface Contender {
  id: string;
  comparisonId: string;
  name: string;
  description?: string;
  pros: string[];
  cons: string[];
  properties: Record<string, string | number>; // key -> value mapping
  score?: number;
  createdAt: string;
}