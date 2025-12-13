// src/services/chat.ts
import { Message, ChatSession } from '../types';

// Dữ liệu giả lập (Lưu vào RAM, reset khi F5)
let MOCK_CHATS: ChatSession[] = [];
let MOCK_MESSAGES: Message[] = [];

/**
 * Lấy danh sách tin nhắn giữa 2 người
 */
export const getMessages = async (currentUserId: string, otherUserId: string): Promise<Message[]> => {
  // Giả lập delay mạng
  await new Promise(resolve => setTimeout(resolve, 300));

  // --- SỬA LỖI LOGIC LỌC ---
  // File cũ của bạn viết sai: (msg.senderId === current && msg.senderId === other) -> Vô lý
  // Logic đúng: (Người gửi là Tôi VÀ Người nhận là Bạn) HOẶC (Người gửi là Bạn VÀ Người nhận là Tôi)
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
    receiverId, // <--- ĐÃ THÊM: Lưu ID người nhận vào tin nhắn
    content,
    createdAt: new Date().toISOString(),
    isRead: false,
    type: type,
    storyId: storyData?.storyId,
    storySnapshotUrl: storyData?.snapshotUrl
  };

  // Lưu vào mảng dữ liệu giả
  MOCK_MESSAGES.push(newMessage);
  
  // Cập nhật session chat (nếu cần)
  await updateChatSession(senderId, receiverId, newMessage);

  console.log("LOG: Đã gửi tin nhắn (Có receiverId):", newMessage);
  return newMessage;
};

/**
 * Cập nhật phiên chat (Mock)
 */
const updateChatSession = async (senderId: string, receiverId: string, lastMessage: Message) => {
    console.log("LOG: Đã cập nhật Chat Session");
};

/**
 * Đánh dấu đã đọc
 */
export const markMessagesAsRead = async (chatId: string, userId: string) => {
    console.log(`LOG: Đã đánh dấu đọc cho chat ${chatId} bởi user ${userId}`);
};
