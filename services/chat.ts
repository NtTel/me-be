// src/services/chat.ts
import { Message, ChatSession, User } from '../types';

let MOCK_CHATS: ChatSession[] = [];
let MOCK_MESSAGES: Message[] = [];

/**
 * Lấy danh sách tin nhắn giữa 2 người
 */
export const getMessages = async (currentUserId: string, otherUserId: string): Promise<Message[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));

  // LỌC CHUẨN XÁC: Tin nhắn giữa tôi và bạn (2 chiều)
  return MOCK_MESSAGES.filter(msg => 
    (msg.senderId === currentUserId && msg.receiverId === otherUserId) || 
    (msg.senderId === otherUserId && msg.receiverId === currentUserId)
  ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
};

/**
 * Gửi tin nhắn
 */
export const sendMessage = async (
  senderId: string, 
  receiverId: string, 
  content: string, 
  type: 'text' | 'image' | 'story_reply' = 'text',
  storyData?: { storyId: string, snapshotUrl: string }
): Promise<Message> => {
  
  await new Promise(resolve => setTimeout(resolve, 300));

  const newMessage: Message = {
    id: `msg_${Date.now()}`,
    senderId,
    receiverId, // ĐÃ CÓ TRONG TYPE
    content,
    createdAt: new Date().toISOString(),
    isRead: false,
    type: type,
    storyId: storyData?.storyId,
    storySnapshotUrl: storyData?.snapshotUrl
  };

  MOCK_MESSAGES.push(newMessage);
  
  await updateChatSession(senderId, receiverId, newMessage);

  console.log("LOG: Đã gửi tin nhắn (Saved):", newMessage);
  return newMessage;
};

const updateChatSession = async (senderId: string, receiverId: string, lastMessage: Message) => {
    // Logic giả lập update session
    console.log("LOG: Đã cập nhật Chat Session");
};

export const markMessagesAsRead = async (chatId: string, userId: string) => {
    console.log(`LOG: Đã đánh dấu đọc cho chat ${chatId} bởi user ${userId}`);
};
