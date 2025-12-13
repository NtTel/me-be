import { Message, ChatSession } from '../types';

const STORAGE_KEY = 'asking_vn_messages';

/**
 * Hàm trợ giúp: Luôn lấy dữ liệu mới nhất từ Storage
 */
const getFreshMessages = (): Message[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

/**
 * Lấy danh sách tin nhắn
 * LƯU Ý: Phải gọi getFreshMessages() để thấy tin nhắn từ Tab khác gửi sang
 */
export const getMessages = async (currentUserId: string, otherUserId: string): Promise<Message[]> => {
  // Delay nhẹ
  await new Promise(resolve => setTimeout(resolve, 200));

  const allMessages = getFreshMessages();

  // Lọc tin nhắn giữa 2 người
  return allMessages.filter(msg => 
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
    receiverId, 
    content,
    createdAt: new Date().toISOString(),
    isRead: false,
    type: type,
    storyId: storyData?.storyId,
    storySnapshotUrl: storyData?.snapshotUrl
  };

  // 1. Lấy dữ liệu mới nhất
  const currentMessages = getFreshMessages();
  
  // 2. Thêm tin mới
  currentMessages.push(newMessage);
  
  // 3. Lưu ngay vào Storage
  localStorage.setItem(STORAGE_KEY, JSON.stringify(currentMessages));
  
  console.log("LOG: Đã gửi và đồng bộ:", newMessage);

  // --- TÍNH NĂNG MỚI: GIẢ LẬP ĐỐI PHƯƠNG TRẢ LỜI (AUTO REPLY) ---
  // Chỉ để test, giúp bạn thấy tin nhắn đến mà không cần mở 2 trình duyệt
  simulateAutoReply(receiverId, senderId);

  return newMessage;
};

/**
 * Hàm giả lập đối phương trả lời sau 3 giây
 */
const simulateAutoReply = (botId: string, humanId: string) => {
  setTimeout(() => {
    const currentMessages = getFreshMessages();
    
    // Kiểm tra để tránh bot tự trả lời chính mình
    const lastMsg = currentMessages[currentMessages.length - 1];
    if (lastMsg && lastMsg.senderId === botId) return; 

    const botReply: Message = {
      id: `msg_bot_${Date.now()}`,
      senderId: botId,    // Bot đóng vai người gửi
      receiverId: humanId, // Bạn là người nhận
      content: "Mình đã nhận được tin nhắn rồi nhé! (Auto Reply) 😄",
      createdAt: new Date().toISOString(),
      isRead: false,
      type: 'text'
    };

    currentMessages.push(botReply);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentMessages));
    console.log("LOG: Bot đã trả lời tự động");
    
  }, 3000); // Trả lời sau 3s
};

/**
 * Đánh dấu đã đọc
 */
export const markMessagesAsRead = async (chatId: string, userId: string) => {
    console.log(`LOG: Đã đánh dấu đọc`);
};
