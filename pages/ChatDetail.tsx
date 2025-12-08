
import React, { useState, useEffect, useRef } from 'react';
// @ts-ignore
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Image as ImageIcon, Phone, Video, MoreVertical, ShieldCheck } from 'lucide-react';
import { db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { sendMessage, subscribeToMessages, getChatId } from '../services/db';
import { loginAnonymously } from '../services/auth';
import { User, Message } from '../types';

interface ChatDetailProps {
  currentUser: User;
  onOpenAuth: () => void;
}

export const ChatDetail: React.FC<ChatDetailProps> = ({ currentUser, onOpenAuth }) => {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const [targetUser, setTargetUser] = useState<User | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    // Fetch Target User Info
    useEffect(() => {
        const fetchUser = async () => {
            if (!userId || !db) return;
            try {
                const docRef = doc(db, 'users', userId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    // @ts-ignore
                    setTargetUser({ id: docSnap.id, ...docSnap.data() } as User);
                }
            } catch (error) {
                console.error("Error fetching target user", error);
            }
        };
        fetchUser();
    }, [userId]);

    // Subscribe to Messages
    useEffect(() => {
        // Wait until target user is loaded and we have a valid current user id (or session)
        if (!currentUser || !userId || !targetUser) return;
        
        // Don't subscribe if currentUser is purely Guest UI state (not connected to firebase auth yet)
        // Unless they have logged in anonymously, in which case isGuest might still be true in UI but auth is ready
        // But simply, we rely on the DB service to handle subscription errors gracefully.
        
        const chatId = getChatId(currentUser.id, userId);
        const unsubscribe = subscribeToMessages(chatId, (msgs) => {
            setMessages(msgs);
            setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        });
        return () => unsubscribe();
    }, [currentUser.id, userId, targetUser]);

    const ensureAuth = async (): Promise<User> => {
        if (currentUser.isGuest) {
            try {
                return await loginAnonymously();
            } catch (e: any) {
                console.error("Guest auth failed:", e);
                onOpenAuth();
                throw new Error("LOGIN_REQUIRED");
            }
        }
        return currentUser;
    };

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newMessage.trim() || !targetUser) return;
        
        const content = newMessage;
        setNewMessage('');
        
        try {
            const user = await ensureAuth();
            await sendMessage(user, targetUser, content);
        } catch (error) {
            // Error is handled in ensureAuth or db service
        }
    };

    if (!targetUser) return <div className="p-10 text-center"><div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div></div>;

    return (
        <div className="flex flex-col h-[100dvh] bg-gray-50 fixed inset-0 z-50 overflow-hidden">
            {/* Header */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-gray-100 shadow-sm pt-safe-top shrink-0">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="text-gray-600 hover:bg-gray-100 p-2 rounded-full -ml-2">
                        <ArrowLeft size={22} />
                    </button>
                    <div className="relative">
                        <img src={targetUser.avatar} className="w-9 h-9 rounded-full object-cover border border-gray-100" />
                        {targetUser.isExpert && <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-0.5 border border-white"><ShieldCheck size={10} /></div>}
                    </div>
                    <div>
                        <h2 className="font-bold text-textDark text-sm leading-tight flex items-center gap-1">
                            {targetUser.name}
                        </h2>
                        <span className="text-[11px] text-green-500 font-medium">Đang hoạt động</span>
                    </div>
                </div>
                <div className="flex items-center gap-3 text-primary">
                    <button className="p-2 hover:bg-gray-100 rounded-full"><Phone size={20} /></button>
                    <button className="p-2 hover:bg-gray-100 rounded-full"><Video size={20} /></button>
                    <button className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><MoreVertical size={20} /></button>
                </div>
            </div>

            {/* Messages Area - min-h-0 and flex-1 allows standard scrolling behavior */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#E5DDD5]/10 min-h-0 w-full">
                {(messages.length === 0 && currentUser.isGuest) && (
                     <div className="text-center py-10 opacity-70">
                        <p className="text-sm font-medium text-primary">Bạn đang chat với tư cách Khách.</p>
                        <p className="text-xs text-gray-500">Tin nhắn của bạn sẽ được gửi ẩn danh.</p>
                    </div>
                )}
                {messages.length === 0 && !currentUser.isGuest && (
                    <div className="text-center py-10 opacity-50">
                        <p className="text-sm">Hãy bắt đầu cuộc trò chuyện với {targetUser.name}</p>
                    </div>
                )}
                {messages.map((msg, idx) => {
                    const isMe = msg.senderId === currentUser.id;
                    const showAvatar = !isMe && (idx === messages.length - 1 || messages[idx + 1]?.senderId !== msg.senderId);
                    
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1`}>
                            {!isMe && (
                                <div className="w-8 mr-2 flex flex-col justify-end">
                                    {showAvatar ? <img src={targetUser.avatar} className="w-6 h-6 rounded-full" /> : <div className="w-6" />}
                                </div>
                            )}
                            <div className={`
                                max-w-[75%] px-4 py-2 rounded-2xl text-[15px] leading-relaxed shadow-sm break-words
                                ${isMe ? 'bg-primary text-white rounded-br-sm' : 'bg-white text-textDark rounded-bl-sm'}
                            `}>
                                {msg.content}
                            </div>
                        </div>
                    );
                })}
                <div ref={scrollRef} />
            </div>

            {/* Input Area */}
            <div className="bg-white p-3 pb-safe-bottom border-t border-gray-100 shrink-0 w-full">
                <form onSubmit={handleSend} className="flex items-center gap-2">
                    <button type="button" className="text-primary p-2 hover:bg-gray-50 rounded-full">
                        <ImageIcon size={24} />
                    </button>
                    <input 
                        type="text" 
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder="Nhắn tin..." 
                        className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                    />
                    <button type="submit" disabled={!newMessage.trim()} className="text-white bg-primary p-2.5 rounded-full shadow-md active:scale-90 disabled:opacity-50 transition-all">
                        <Send size={18} className={newMessage.trim() ? "translate-x-0.5" : ""} />
                    </button>
                </form>
            </div>
        </div>
    );
};
