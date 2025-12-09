
export interface User {
  id: string;
  name: string;
  avatar: string;
  isExpert: boolean;
  expertStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  specialty?: string; // e.g., "Bác sĩ Nhi khoa", "Chuyên gia Dinh dưỡng"
  workplace?: string;
  isAdmin?: boolean;
  isBanned?: boolean; // New field for banning users
  bio?: string;
  points?: number;
  joinedAt?: string;
  isGuest?: boolean;
  followers?: string[];
  following?: string[];
  savedQuestions?: string[]; // List of saved question IDs
  isOnline?: boolean;
  lastActiveAt?: string;
  email?: string; // Add email for admin management
  isFake?: boolean; // For seed data management
}

export interface Answer {
  id: string;
  questionId: string;
  author: User;
  content: string;
  likes: number;
  isBestAnswer: boolean;
  isExpertVerified?: boolean;
  createdAt: string;
  isAi: boolean;
  isHidden?: boolean;
  reportCount?: number;
  isFake?: boolean; // For seed data management
}

export interface Question {
  id: string;
  title: string;
  content: string;
  category: string;
  author: User;
  answers: Answer[];
  likes: number;
  views: number;
  createdAt: string;
  images?: string[]; 
  isHidden?: boolean;
  reportCount?: number;
  isFake?: boolean; // For seed data management
}

export interface Notification {
  id: string;
  userId: string; 
  sender: { name: string; avatar: string };
  type: 'LIKE' | 'ANSWER' | 'VERIFY' | 'SYSTEM' | 'BEST_ANSWER' | 'FOLLOW' | 'MESSAGE';
  content: string;
  link: string;
  isRead: boolean;
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  type: 'text' | 'image';
}

export interface ChatSession {
  id: string;
  participants: string[]; 
  participantData: { [uid: string]: { name: string; avatar: string; isExpert?: boolean } };
  lastMessage: string;
  lastMessageTime: string;
  updatedAt: string;
  unreadCount: { [uid: string]: number };
}

// --- GAME TYPES ---

export type GameCategory = 'general' | 'math' | 'english' | 'vietnamese' | 'logic' | 'story' | 'music' | 'art';
export type GameType = 'quiz' | 'html5' | 'story' | 'ai-story';
export type GameOrientation = 'portrait' | 'landscape' | 'auto';

export interface Game {
  id: string;
  title: string;
  icon: string; // Emoji or URL
  color: string; // Tailwind class like 'bg-blue-400'
  gameType: GameType;
  category: GameCategory;
  orientation?: GameOrientation; // New field for screen orientation
  
  // Specific fields based on type
  gameUrl?: string; // For HTML5 games
  storyContent?: string; // For Stories
  
  minAge: number;
  maxAge: number;
  isActive: boolean;
  order: number;
  createdAt: string;
  questionCount?: number; // Optional, for UI display
}

export interface GameQuestion {
  id: string;
  q: string; // Question text
  opts: string[]; // Options
  a: string; // Correct answer
  displayType: 'text' | 'emoji' | 'color';
  order: number;
  isActive: boolean;
  createdAt: string;
}

export interface ExpertApplication {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  workplace: string;
  specialty: string;
  proofImages: string[];
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedBy?: string;
  rejectionReason?: string;
  reviewedAt?: string;
}

export interface Report {
  id: string;
  targetId: string; // Question ID or Answer ID
  targetType: 'question' | 'answer';
  reason: string;
  reportedBy: string; // User ID
  createdAt: string;
  status: 'open' | 'resolved' | 'dismissed';
}

export const CATEGORIES = [
  "Mang thai",
  "Dinh dưỡng",
  "Sức khỏe",
  "0-1 tuổi",
  "1-3 tuổi",
  "Tâm lý",
  "Giáo dục sớm",
  "Gia đình"
];

export const GAME_CATEGORIES: {id: GameCategory, label: string, icon: string, color: string}[] = [
  { id: 'general', label: 'Tổng hợp', icon: '🎮', color: 'bg-indigo-400' },
  { id: 'math', label: 'Toán học', icon: '🔢', color: 'bg-blue-500' },
  { id: 'vietnamese', label: 'Tiếng Việt', icon: 'abc', color: 'bg-red-400' },
  { id: 'english', label: 'Tiếng Anh', icon: '🔤', color: 'bg-purple-500' },
  { id: 'logic', label: 'Tư duy', icon: '🧠', color: 'bg-yellow-400' },
  { id: 'story', label: 'Truyện kể', icon: '📖', color: 'bg-pink-400' },
  { id: 'art', label: 'Mỹ thuật', icon: '🎨', color: 'bg-rose-400' },
  { id: 'music', label: 'Âm nhạc', icon: '🎵', color: 'bg-teal-400' },
];
