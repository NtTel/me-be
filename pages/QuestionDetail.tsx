
import React, { useState, useEffect, useRef } from 'react';
// @ts-ignore
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Heart, MessageCircle, ShieldCheck, 
  Sparkles, Loader2, Send, MoreVertical, Trash2, Edit2, 
  EyeOff, Share2, CornerDownRight, CheckCircle2, Eye 
} from 'lucide-react';
import { Question, Answer, User } from '../types';
import { generateDraftAnswer } from '../services/gemini';
import { toggleQuestionLikeDb } from '../services/db';
import { ShareModal } from '../components/ShareModal';
import { loginAnonymously } from '../services/auth';

interface DetailProps {
  questions: Question[];
  currentUser: User;
  onAddAnswer: (questionId: string, answer: Answer) => void;
  onMarkBestAnswer: (questionId: string, answerId: string) => void;
  onVerifyAnswer: (questionId: string, answerId: string) => void;
  onOpenAuth: () => void;
  
  // CRUD Actions
  onEditQuestion: (id: string, title: string, content: string) => void;
  onDeleteQuestion: (id: string) => void;
  onHideQuestion: (id: string) => void;
  onEditAnswer: (qId: string, aId: string, content: string) => void;
  onDeleteAnswer: (qId: string, aId: string) => void;
  onHideAnswer: (qId: string, aId: string) => void;
}

// FB Style Image Grid
const FBImageGridDetail: React.FC<{ images: string[] }> = ({ images }) => {
  if (!images || images.length === 0) return null;
  const count = images.length;
  const openImage = (url: string) => window.open(url, '_blank');

  if (count === 1) {
    return (
      <div className="mt-3 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 cursor-pointer" onClick={() => openImage(images[0])}>
        <img src={images[0]} className="w-full max-h-80 object-cover" />
      </div>
    );
  }
  if (count === 2) {
    return (
      <div className="mt-3 grid grid-cols-2 gap-1 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 h-60">
        <img src={images[0]} className="w-full h-full object-cover cursor-pointer" onClick={() => openImage(images[0])} />
        <img src={images[1]} className="w-full h-full object-cover cursor-pointer" onClick={() => openImage(images[1])} />
      </div>
    );
  }
  if (count === 3) {
    return (
      <div className="mt-3 grid grid-cols-2 gap-1 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 h-60">
        <img src={images[0]} className="w-full h-full object-cover row-span-2 cursor-pointer" onClick={() => openImage(images[0])} />
        <div className="grid grid-rows-2 gap-1 h-full">
           <img src={images[1]} className="w-full h-full object-cover cursor-pointer" onClick={() => openImage(images[1])} />
           <img src={images[2]} className="w-full h-full object-cover cursor-pointer" onClick={() => openImage(images[2])} />
        </div>
      </div>
    );
  }
  return (
    <div className="mt-3 grid grid-cols-2 gap-1 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 h-60">
       <img src={images[0]} className="w-full h-full object-cover cursor-pointer" onClick={() => openImage(images[0])} />
       <div className="grid grid-rows-2 gap-1 h-full">
          <img src={images[1]} className="w-full h-full object-cover cursor-pointer" onClick={() => openImage(images[1])} />
          <div className="relative w-full h-full cursor-pointer" onClick={() => openImage(images[2])}>
              <img src={images[2]} className="w-full h-full object-cover" />
              {count > 3 && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-bold text-xl backdrop-blur-[2px]">
                   +{count - 3}
                </div>
              )}
          </div>
       </div>
    </div>
  );
};

export const QuestionDetail: React.FC<DetailProps> = ({ 
  questions, 
  currentUser, 
  onAddAnswer, 
  onMarkBestAnswer, 
  onVerifyAnswer, 
  onOpenAuth, 
  onEditQuestion, 
  onDeleteQuestion, 
  onHideQuestion, 
  onEditAnswer, 
  onDeleteAnswer, 
  onHideAnswer 
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const question = questions.find(q => q.id === id);
  
  // State
  const [newAnswer, setNewAnswer] = useState('');
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  
  // Edit State
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [editQTitle, setEditQTitle] = useState('');
  const [editQContent, setEditQContent] = useState('');
  const [editingAnswerId, setEditingAnswerId] = useState<string | null>(null);
  const [editAContent, setEditAContent] = useState('');
  
  // Refs
  const menuRef = useRef<HTMLDivElement>(null);
  const answerInputRef = useRef<HTMLTextAreaElement>(null);
  const scrollEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!question) return <div className="p-10 text-center">Không tìm thấy câu hỏi.</div>;

  const isOwner = currentUser.id === question.author.id;
  const isAdmin = currentUser.isAdmin;

  // Helper to ensure guest becomes anonymous user
  const ensureAuth = async (): Promise<User> => {
    if (currentUser.isGuest) {
        try {
            return await loginAnonymously();
        } catch (e: any) {
            console.error("Guest auth failed:", e);
            // Fallback to regular auth modal immediately for any error
            onOpenAuth();
            throw new Error("LOGIN_REQUIRED"); 
        }
    }
    return currentUser;
  };

  // --- ACTIONS ---
  const handleLike = async () => {
    try {
      const user = await ensureAuth();
      toggleQuestionLikeDb(question, user);
    } catch (e) {
      // Handled in ensureAuth or stop execution
    }
  };

  const handleSubmitAnswer = async () => {
    if (!newAnswer.trim()) return;
    
    try {
      const user = await ensureAuth();
      
      const answer: Answer = {
        id: Date.now().toString(),
        questionId: question.id,
        author: user,
        content: newAnswer,
        likes: 0,
        isBestAnswer: false,
        createdAt: new Date().toISOString(),
        isAi: false
      };

      await onAddAnswer(question.id, answer);
      setNewAnswer('');
      
      // Smooth scroll to bottom
      setTimeout(() => {
          scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (e) {
      // Stop
    }
  };

  const handleAiDraft = async () => {
    setIsGeneratingDraft(true);
    const draft = await generateDraftAnswer(question.title, question.content);
    setNewAnswer(draft);
    setIsGeneratingDraft(false);
  };

  const toggleMenu = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  // --- EDIT/DELETE HANDLERS ---
  const startEditQuestion = () => {
    setIsEditingQuestion(true);
    setEditQTitle(question.title);
    setEditQContent(question.content);
    setActiveMenuId(null);
  };

  const saveQuestionEdit = () => {
    onEditQuestion(question.id, editQTitle, editQContent);
    setIsEditingQuestion(false);
  };

  const handleDeleteQuestion = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa câu hỏi này?")) {
      onDeleteQuestion(question.id);
      navigate('/');
    }
  };

  const startEditAnswer = (ans: Answer) => {
    setEditingAnswerId(ans.id);
    setEditAContent(ans.content);
    setActiveMenuId(null);
  };

  const saveAnswerEdit = (ansId: string) => {
    onEditAnswer(question.id, ansId, editAContent);
    setEditingAnswerId(null);
  };

  const handleDeleteAnswer = (ansId: string) => {
    if (window.confirm("Xóa câu trả lời này?")) {
      onDeleteAnswer(question.id, ansId);
    }
  };

  const handleCommentClick = () => {
    answerInputRef.current?.focus();
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F0F2F5] pb-32">
      
      {/* 1. HEADER */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-gray-200 flex items-center justify-between pt-safe-top shadow-sm transition-all">
        <div className="flex items-center gap-3 overflow-hidden">
           <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full active:scale-95 transition-all text-gray-600">
             <ArrowLeft size={22} />
           </button>
           
           <Link to={`/profile/${question.author.id}`} className="flex items-center gap-2 overflow-hidden hover:bg-gray-50 p-1 pr-2 rounded-full transition-colors active:scale-95">
              <img src={question.author.avatar} className="w-8 h-8 rounded-full object-cover border border-gray-100" />
              <div className="flex flex-col min-w-0">
                  <span className="font-bold text-sm text-textDark truncate">{question.author.name}</span>
                  <span className="text-[10px] text-gray-400">Xem trang cá nhân</span>
              </div>
           </Link>
        </div>
        
        {/* Question Menu */}
        {(isOwner || isAdmin) && (
            <div className="relative">
                <button onClick={(e) => toggleMenu('q_menu', e)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                    <MoreVertical size={20} />
                </button>
                {activeMenuId === 'q_menu' && (
                    <div ref={menuRef} className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 w-40 overflow-hidden z-30 animate-pop-in">
                        <button onClick={startEditQuestion} className="w-full text-left px-4 py-3 text-sm font-medium hover:bg-gray-50 flex items-center gap-2">
                            <Edit2 size={16} /> Chỉnh sửa
                        </button>
                        <button onClick={() => onHideQuestion(question.id)} className="w-full text-left px-4 py-3 text-sm font-medium hover:bg-gray-50 flex items-center gap-2 text-orange-600">
                            {question.isHidden ? <Eye size={16} /> : <EyeOff size={16} />} {question.isHidden ? 'Hiện bài' : 'Ẩn bài'}
                        </button>
                        <button onClick={handleDeleteQuestion} className="w-full text-left px-4 py-3 text-sm font-medium hover:bg-red-50 text-red-600 flex items-center gap-2">
                            <Trash2 size={16} /> Xóa bài
                        </button>
                    </div>
                )}
            </div>
        )}
      </div>

      {/* 2. SCROLLABLE CONTENT (CHAT STYLE) */}
      <div className="flex-1 p-4 space-y-5 bg-[#E5DDD5]/10">
        
        {/* --- QUESTION BUBBLE (TOPIC) --- */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative group animate-fade-in">
            {isEditingQuestion ? (
                <div className="space-y-3">
                    <input type="text" value={editQTitle} onChange={e => setEditQTitle(e.target.value)} className="w-full font-bold text-lg border-b border-gray-200 p-1" />
                    <textarea value={editQContent} onChange={e => setEditQContent(e.target.value)} className="w-full p-2 bg-gray-50 rounded-lg min-h-[100px]" />
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setIsEditingQuestion(false)} className="px-3 py-1.5 text-sm font-bold text-gray-500">Hủy</button>
                        <button onClick={saveQuestionEdit} className="px-3 py-1.5 text-sm font-bold bg-primary text-white rounded-lg">Lưu</button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="flex justify-between items-start mb-2">
                         <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">{question.category}</span>
                         <span className="text-[11px] text-gray-400">{new Date(question.createdAt).toLocaleString('vi-VN')}</span>
                    </div>
                    <h1 className="text-lg font-bold text-textDark mb-2 leading-snug">{question.title}</h1>
                    <p className="text-textDark/80 text-[15px] leading-relaxed whitespace-pre-wrap">{question.content}</p>
                    
                    <FBImageGridDetail images={question.images || []} />

                    {/* ACTIONS BAR: LIKE - COMMENT - SHARE */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                        <button onClick={handleLike} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold transition-all active:scale-95 ${question.likes > 0 ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-500'}`}>
                            <Heart size={16} className={question.likes > 0 ? "fill-red-500" : ""} />
                            <span>{question.likes > 0 ? question.likes : 'Thích'}</span>
                        </button>

                        <button onClick={handleCommentClick} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 text-gray-600 text-sm font-bold hover:bg-gray-100 active:scale-95 transition-all">
                             <MessageCircle size={16} />
                             <span>Bình luận</span>
                        </button>

                        <button onClick={() => setShowShareModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 text-sm font-bold hover:bg-blue-100 active:scale-95 transition-all">
                            <Share2 size={16} />
                            <span>Chia sẻ</span>
                        </button>
                    </div>
                </>
            )}
        </div>

        {/* --- ANSWERS LIST --- */}
        {question.answers.length > 0 && (
            <div className="flex items-center gap-2 opacity-50 my-2">
                <div className="h-[1px] bg-gray-300 flex-1"></div>
                <span className="text-xs font-medium text-gray-500">Trả lời ({question.answers.length})</span>
                <div className="h-[1px] bg-gray-300 flex-1"></div>
            </div>
        )}

        {question.answers.map((ans) => {
            const isAnsOwner = currentUser.id === ans.author.id;
            const isEditing = editingAnswerId === ans.id;

            return (
                <div key={ans.id} className={`flex flex-col gap-1 ${isAnsOwner ? 'items-end' : 'items-start'} animate-slide-up`}>
                    
                    {/* Author Name Label */}
                    <Link to={`/profile/${ans.author.id}`} className={`flex items-center gap-1.5 text-[11px] text-gray-500 px-2 hover:underline ${isAnsOwner ? 'flex-row-reverse' : ''}`}>
                         <span className="font-bold">{ans.author.name}</span>
                         {ans.author.isExpert && <ShieldCheck size={10} className="text-blue-500" />}
                         <span>• {new Date(ans.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </Link>

                    {/* Bubble */}
                    <div className={`
                        relative max-w-[90%] p-3.5 rounded-2xl text-[15px] leading-relaxed shadow-sm group
                        ${isAnsOwner 
                            ? 'bg-gradient-to-br from-primary to-[#26A69A] text-white rounded-tr-sm' 
                            : 'bg-white text-textDark rounded-tl-sm border border-gray-100'}
                        ${ans.isBestAnswer ? 'ring-2 ring-yellow-400' : ''}
                    `}>
                        
                        {/* Special Badges */}
                        {ans.isBestAnswer && (
                            <div className="absolute -top-3 -right-3 bg-yellow-400 text-white p-1 rounded-full shadow-sm z-10">
                                <Sparkles size={12} fill="currentColor" />
                            </div>
                        )}
                        {ans.isExpertVerified && (
                             <div className="absolute -top-3 -right-8 bg-green-500 text-white px-2 py-0.5 rounded-full shadow-sm text-[9px] font-bold flex items-center gap-1 z-10">
                                <ShieldCheck size={10} /> Verified
                             </div>
                        )}

                        {isEditing ? (
                            <div className="min-w-[200px]">
                                <textarea value={editAContent} onChange={e => setEditAContent(e.target.value)} className="w-full text-black p-2 rounded-lg text-sm" />
                                <div className="flex justify-end gap-2 mt-2">
                                    <button onClick={() => setEditingAnswerId(null)} className="text-xs font-bold underline">Hủy</button>
                                    <button onClick={() => saveAnswerEdit(ans.id)} className="text-xs font-bold bg-white text-primary px-2 py-1 rounded">Lưu</button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <p className="whitespace-pre-wrap break-words">{ans.content}</p>
                                
                                {/* Menu for Answer */}
                                {(isAnsOwner || isAdmin || isOwner) && (
                                    <button 
                                        onClick={(e) => toggleMenu(ans.id, e)} 
                                        className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full ${isAnsOwner ? 'hover:bg-white/20 text-white' : 'hover:bg-gray-100 text-gray-400'}`}
                                    >
                                        <MoreVertical size={14} />
                                    </button>
                                )}

                                {activeMenuId === ans.id && (
                                    <div ref={menuRef} className="absolute right-0 top-8 bg-white rounded-xl shadow-lg border border-gray-100 w-40 overflow-hidden z-30 text-textDark animate-pop-in">
                                        {(isOwner || isAdmin) && (
                                            <>
                                              <button onClick={() => onMarkBestAnswer(question.id, ans.id)} className="w-full text-left px-3 py-2.5 text-xs font-bold hover:bg-yellow-50 text-yellow-600 flex items-center gap-2">
                                                  <Sparkles size={14} /> Chọn hay nhất
                                              </button>
                                              {currentUser.isExpert && (
                                                <button onClick={() => onVerifyAnswer(question.id, ans.id)} className="w-full text-left px-3 py-2.5 text-xs font-bold hover:bg-green-50 text-green-600 flex items-center gap-2">
                                                    <CheckCircle2 size={14} /> Xác thực y khoa
                                                </button>
                                              )}
                                            </>
                                        )}
                                        {(isAnsOwner || isAdmin) && (
                                            <>
                                                <button onClick={() => startEditAnswer(ans)} className="w-full text-left px-3 py-2.5 text-xs font-medium hover:bg-gray-50 flex items-center gap-2">
                                                    <Edit2 size={14} /> Chỉnh sửa
                                                </button>
                                                <button onClick={() => handleDeleteAnswer(ans.id)} className="w-full text-left px-3 py-2.5 text-xs font-medium hover:bg-red-50 text-red-600 flex items-center gap-2">
                                                    <Trash2 size={14} /> Xóa
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            );
        })}
        <div ref={scrollEndRef} className="h-10"></div>
      </div>

      {/* 3. STICKY INPUT BAR (Lifted above bottom nav) */}
      <div className="fixed bottom-[85px] md:bottom-0 left-0 right-0 px-3 z-30 pointer-events-none">
         <div className="max-w-5xl mx-auto pointer-events-auto shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-[2rem]">
            <div className="bg-white/95 backdrop-blur-xl border border-gray-100 px-3 py-2 rounded-[2rem] flex items-end gap-2">
                <button 
                    onClick={handleAiDraft}
                    disabled={isGeneratingDraft}
                    className="p-2.5 text-orange-500 bg-orange-50 hover:bg-orange-100 rounded-full transition-colors active:scale-90 border border-orange-100"
                    title="AI Gợi ý câu trả lời"
                >
                    {isGeneratingDraft ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
                </button>
                
                <textarea
                    ref={answerInputRef}
                    value={newAnswer}
                    onChange={(e) => setNewAnswer(e.target.value)}
                    placeholder="Viết câu trả lời..."
                    className="flex-1 bg-gray-50 border-none outline-none py-3 px-4 rounded-xl text-[15px] text-textDark placeholder-gray-400 max-h-32 min-h-[44px] resize-none focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all"
                    rows={1}
                />
                
                <button 
                    onClick={handleSubmitAnswer}
                    disabled={!newAnswer.trim()}
                    className="p-3 bg-gradient-to-tr from-primary to-[#26A69A] text-white rounded-full shadow-lg shadow-primary/30 hover:shadow-xl disabled:opacity-50 disabled:shadow-none active:scale-90 transition-all mb-0.5"
                >
                    <Send size={18} className={newAnswer.trim() ? "translate-x-0.5" : ""} />
                </button>
            </div>
         </div>
      </div>

      <ShareModal 
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        url={window.location.href}
        title={question.title}
      />
    </div>
  );
};
