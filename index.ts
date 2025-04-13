// User Types
export interface User {
  id: number;
  firebaseId: string;
  email: string;
  displayName: string;
  botName: string;
  isPremium: boolean;
  premiumExpiresAt?: string;
  imageGenerationCount: number;
  lastImageGenerationReset?: string;
  preferredLanguage: string;
  createdAt: string;
  updatedAt: string;
}

// Chat Types
export interface ChatHistory {
  id: number;
  userId: number;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: number;
  chatId: number;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

// Memory Types
export interface MemoryItem {
  id: number;
  userId: number;
  content: string;
  createdAt: string;
}

// File Upload Types
export interface FileUpload {
  id: number;
  userId: number;
  filename: string;
  fileType: string;
  filePath: string;
  createdAt: string;
}

// Generated Image Types
export interface GeneratedImage {
  id: number;
  userId: number;
  prompt: string;
  imageUrl: string;
  createdAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ChatCompletionResponse {
  text: string;
  isTripleChecked?: boolean;
}

export interface ImageGenerationResponse {
  imageUrl: string;
  imageCount: number;
  maxImages: number;
}

export interface TranslationResponse {
  translatedText: string;
  sourceLang: string;
  targetLang: string;
}

export interface CodeCheckResponse {
  isValid: boolean;
  suggestions?: string[];
  errorMessage?: string;
}

// Language Types
export type SupportedLanguage = 'english' | 'hindi' | 'hinglish';
export interface GameState {
  id: string;
  progress: number;
  score: number;
  level: number;
  inventory?: Record<string, any>;
  position?: { x: number; y: number; z?: number };
  saves?: {
    checkpoint: string;
    timestamp: number;
  }[];
}

export interface AppState {
  id: string;
  settings: Record<string, any>;
  userData: Record<string, any>;
  lastAccessed: number;
}

export interface Asset3D {
  type: 'model' | 'texture' | 'animation';
  url: string;
  format: string;
  name: string;
  preview?: string;
  license?: string;
}
