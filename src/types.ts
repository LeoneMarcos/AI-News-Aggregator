export interface FeedSource {
  id: string;
  name: string;
  feedUrl: string;
}

export interface Article {
  id: string;
  sourceId: string;
  sourceName: string;
  title: string;
  description: string;
  link: string;
  pubDate: string;
  author: string;
}

export interface FeedProgress {
  completed: number;
  total: number;
  sourceId: string | null;
  status: 'loaded' | 'failed' | 'cached';
}

export interface FeedOptions {
  forceRefresh?: boolean;
  hoursLimit?: number;
  selectedSourceIds?: string[] | null;
  onProgress?: ((progress: FeedProgress) => void) | null;
}

export interface Preferences {
  sources: string[];
}
