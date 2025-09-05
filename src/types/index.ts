export interface Comparison {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export interface Contender {
  id: string;
  comparisonId: string;
  name: string;
  pros: string[];
  cons: string[];
  score?: number;
  createdAt: string;
}