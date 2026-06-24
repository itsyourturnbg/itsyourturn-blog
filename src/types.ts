export interface Review {
  id: number;
  title: string;
  subtitle: string;
  type: string;
  players: string;
  time: string;
  score: number;
  verdict: string;
  body: string;
  tags: string[];
  date: string;
  featured: boolean;
  emoji: string;
  spoons: "low" | "medium" | "high";
  image?: string;
  images?: string[];
  isUserAdded?: boolean;
  instagramUrl?: string;
  buyUrl?: string;
  likesCount?: number;
  commentsCount?: number;
}

export interface ReviewList {
  id: string;
  title: string;
  desc: string;
  tag: string; // Category, e.g., "Low Spoon", "Cooperative", "Social", etc.
  reviewIds: number[];
  customNotes?: Record<number, string>; // Review ID -> custom note for this list
  isUserAdded?: boolean;
}
