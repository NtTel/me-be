import { Message } from '../types';
// SỬA ĐÚNG TÊN FILE CẤU HÌNH CỦA BẠN
import { db } from '../firebaseConfig'; 
import { 
  collection, addDoc, query, where, orderBy, getDocs 
} from 'firebase/firestore';

const getConversationId = (uid1: string, uid2: string) => {
  return [uid1, uid2].sort().join('_');
};

export const getMessages = async (currentUserId: string, otherUserId: string): Promise<Message[]> => {
  try {
    const conversationId = getConversationId(currentUserId, otherUserId);
    const messagesRef = collection(db, 'messages');
    
    const q = query(
      messagesRef,
      where('conversationId', '==', conversationId),
      orderBy('createdAt', 'asc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return { id: doc.id, ...data } as Message;
    });
  } catch (error) {
    console.error("Lỗi lấy tin nhắn:", error);
    return [];
  }
};

export const sendMessage = async (
  senderId: string, 
  receiverId: string, 
  content: string, 
  type: 'text' | 'image' | 'story_reply' = 'text',
  storyData?: { storyId: string, snapshotUrl: string }
): Promise<Message> => {
  
  const conversationId = getConversationId(senderId, receiverId);

  const newMessageData = {
    conversationId, 
    senderId,
    receiverId,
    content,
    createdAt: new Date().toISOString(),
    isRead: false,
    type,
    storyId: storyData?.storyId || null,
    storySnapshotUrl: storyData?.snapshotUrl || null
  };

  const docRef = await addDoc(collection(db, 'messages'), newMessageData);
  return { id: docRef.id, ...newMessageData } as Message;
};

export const markMessagesAsRead = async (chatId: string, userId: string) => {};
