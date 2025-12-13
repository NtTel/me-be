// src/services/chat.ts
import { Message, ChatSession, User } from '../types';

// MOCK DATA (Dữ liệu giả để chạy thử giao diện)
let MOCK_CHATS: ChatSession[] = [];
let MOCK_MESSAGES: Message[] = [];

/**
 * Lấy danh sách tin nhắn giữa 2 người
 */
export const getMessages = async (currentUserId: string, otherUserId: string): Promise<Message[]> => {
  // Giả lập delay mạng
  await new Promise(resolve => setTimeout(resolve, 300));

  // --- SỬA LOGIC LỌC ---
  // Lấy tin nhắn mà:
  // 1. Tôi gửi cho Bạn (sender = me, receiver = you)
  // HOẶC
  // 2. Bạn gửi cho Tôi (sender = you, receiver = me)
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
    receiverId, // <--- QUAN TRỌNG: Đã thêm trường này để lưu người nhận
    content,
    createdAt: new Date().toISOString(),
    isRead: false,
    type: type,
    storyId: storyData?.storyId,
    storySnapshotUrl: storyData?.snapshotUrl
  };

  MOCK_MESSAGES.push(newMessage);
  
  // Cập nhật hoặc tạo mới Chat Session
  await updateChatSession(senderId, receiverId, newMessage);

  console.log("LOG: Đã gửi tin nhắn (Saved):", newMessage);
  return newMessage;
};

/**
 * Tạo hoặc cập nhật phiên chat (Chat Session) để hiển thị ở danh sách tin nhắn
 */
const updateChatSession = async (senderId: string, receiverId: string, lastMessage: Message) => {
    // Logic tìm chat session tồn tại (Giả lập)
    // Trong thực tế, bạn sẽ update document 'chats' trong Firebase tại đây
    console.log("LOG: Đã cập nhật Chat Session giữa", senderId, "và", receiverId);
};

/**
 * Đánh dấu đã đọc
 */
export const markMessagesAsRead = async (chatId: string, userId: string) => {
    console.log(`LOG: Đã đánh dấu đọc cho chat ${chatId} bởi user ${userId}`);
};
