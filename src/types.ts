export interface Project {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  nodes: StoryNode[];
}

export interface NodePosition {
  x: number;
  y: number;
}

export interface StoryNode {
  id: string;
  title: string;
  description: string;
  causes: string[];
  tags: string[];
  order: number;
  createdAt: Date;
  updatedAt: Date;
  position?: NodePosition;
  aiSuggestions?: string[];
}

export interface AppSettings {
  theme: "dark" | "light";
  language: "pl" | "en";
  geminiApiKey?: string;
  initialBackupAdded?: boolean;
}

export type Theme = "dark" | "light";
export type Language = "pl" | "en";
