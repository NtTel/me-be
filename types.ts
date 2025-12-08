
export interface User {
  id: string;
  name: string;
  avatar: string;
  isExpert: boolean;
  expertStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  specialty?: string; // e.g., "Bác sĩ Nhi khoa", "Chuyên gia Dinh dưỡng"
  workplace?: string;
  isAdmin?: boolean;
  bio?: string;
  points?: number;
  joinedAt?: string;
  isGuest?: boolean;
  followers?: string[]; // Array of User IDs
  following?: string[]; // Array of User IDs
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
  participants: string[]; // [uid1, uid2]
  participantData: { [uid: string]: { name: string; avatar: string; isExpert?: boolean } };
  lastMessage: string;
  lastMessageTime: string;
  updatedAt: string;
  unreadCount: { [uid: string]: number };
}

export enum GameType {
  NUMBERS = 'NUMBERS',
  COLORS = 'COLORS',
  ANIMALS = 'ANIMALS',
  EMOTIONS = 'EMOTIONS'
}

export interface GameItem {
  id: string;
  question: string;
  value: string;
  display: string;
  options: string[];
  audio: string;
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
