export interface ComparisonProperty {
  key: string;
  name: string;
  type: 'text' | 'number' | 'rating' | 'datetime'; // rating is 1-5 stars
  higherIsBetter?: boolean; // for number/rating/datetime types, default true
}

export interface Comparison {
  id: string;
  name: string;
  slug: string;
  properties: ComparisonProperty[];
  createdAt: string;
}

export interface AttachedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  data: string; // base64 encoded file data
  uploadedAt: string;
}

export interface Hyperlink {
  id: string;
  url: string;
  addedAt: string;
}

export interface Contender {
  id: string;
  comparisonId: string;
  name: string;
  description?: string;
  pros: string[];
  cons: string[];
  properties: Record<string, string | number>; // key -> value mapping
  attachments: AttachedFile[];
  hyperlinks: Hyperlink[];
  score?: number;
  createdAt: string;
}