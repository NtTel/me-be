import { Message, ChatSession } from '../types';

// --- KEY CHANGE 1: KHỞI TẠO TỪ LOCAL STORAGE ---
// Kiểm tra xem trong bộ nhớ trình duyệt đã có tin nhắn cũ chưa
const STORAGE_KEY = 'asking_vn_messages';
const storedMessages = localStorage.getItem(STORAGE_KEY);

// Nếu có thì lấy ra dùng, nếu chưa thì tạo mảng rỗng
let MOCK_MESSAGES: Message[] = storedMessages ? JSON.parse(storedMessages) : [];

let MOCK_CHATS: ChatSession[] = [];

/**
 * Lấy danh sách tin nhắn giữa 2 người
 */
export const getMessages = async (currentUserId: string, otherUserId: string): Promise<Message[]> => {
  // Giả lập delay mạng nhẹ
  await new Promise(resolve => setTimeout(resolve, 200));

  // Lọc tin nhắn giữa 2 người
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
    receiverId, 
    content,
    createdAt: new Date().toISOString(),
    isRead: false,
    type: type,
    storyId: storyData?.storyId,
    storySnapshotUrl: storyData?.snapshotUrl
  };

  // 1. Thêm vào mảng trong RAM để hiện ngay
  MOCK_MESSAGES.push(newMessage);
  
  // --- KEY CHANGE 2: LƯU NGAY VÀO LOCAL STORAGE ---
  // Để khi F5 không bị mất dữ liệu
  localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_MESSAGES));
  
  await updateChatSession(senderId, receiverId, newMessage);

  console.log("LOG: Đã gửi và LƯU tin nhắn:", newMessage);
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
    console.log(`LOG: Đã đánh dấu đọc cho chat ${chatId}`);
};
