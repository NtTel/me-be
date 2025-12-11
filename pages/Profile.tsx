import React, { useState, useEffect } from 'react';
import { User, Question, toSlug } from '../types';
import { 
  Settings, ShieldCheck, MessageCircle, HelpCircle, Heart, Star, Briefcase, 
  Share2, Users, UserPlus, UserCheck, ArrowLeft, Loader2, LogIn, X, Save, AtSign 
} from 'lucide-react';
// @ts-ignore
import { Link, useNavigate, useParams } from 'react-router-dom';
import { followUser, unfollowUser, sendNotification } from '../services/db';
import { db } from '../firebaseConfig';
// Import đầy đủ các hàm cần thiết
import { doc, updateDoc, onSnapshot, query, where, getDocs, collection, limit, getDoc } from 'firebase/firestore'; 
import { ShareModal } from '../components/ShareModal';

interface ProfileProps {
  user: User;
  questions: Question[];
  onLogout: () => void;
  onOpenAuth: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, questions, onLogout, onOpenAuth }) => {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>(); 
  
  const [activeTab, setActiveTab] = useState<'overview' | 'questions'>('overview');
  const [profileData, setProfileData] = useState<User | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  
  // Form State (Đã thêm username)
  const [editForm, setEditForm] = useState({ name: '', bio: '', avatar: '', username: '' });
  const [isSaving, setIsSaving] = useState(false);

  // Trạng thái theo dõi
  const [isFollowing, setIsFollowing] = useState(false);

  // --- 1. LOGIC TÌM KIẾM NGƯỜI DÙNG THÔNG MINH & REAL-TIME ---
  useEffect(() => {
    let unsubscribe: () => void;

    const setupProfileListener = async () => {
        setLoadingProfile(true);
        let foundId = '';

        // Case 1: Không có ID trên URL -> Xem chính mình
        if (!userId) {
            if (user && !user.isGuest) foundId = user.id;
        } 
        // Case 2: Có ID hoặc Username trên URL
        else {
            // A. Thử tìm theo ID trước (nhanh nhất)
            const docRef = doc(db, 'users', userId);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                foundId = docSnap.id;
            } else {
                // B. Nếu không phải ID, tìm theo Username (custom id)
                const q = query(collection(db, 'users'), where('username', '==', userId), limit(1));
                const querySnap = await getDocs(q);
                if (!querySnap.empty) {
                    foundId = querySnap.docs[0].id;
                }
            }
        }

        // Nếu tìm thấy ID hợp lệ -> Lắng nghe thay đổi Real-time
        if (foundId) {
            unsubscribe = onSnapshot(doc(db, 'users', foundId), (docSnap) => {
                if (docSnap.exists()) {
                    // @ts-ignore
                    setProfileData({ id: docSnap.id, ...docSnap.data() });
                } else {
                    setProfileData(null);
                }
                setLoadingProfile(false);
            });
        } else {
            setProfileData(null);
            setLoadingProfile(false);
        }
    };

    setupProfileListener();

    return () => {
        if (unsubscribe) unsubscribe();
    };
  }, [userId, user]); // Chạy lại khi URL thay đổi

  // Xác định có phải đang xem chính mình không
  const isViewingSelf = user && profileData && user.id === profileData.id;

  // --- 2. LOGIC THEO DÕI REAL-TIME ---
  useEffect(() => {
    if (user && !user.isGuest && profileData && user.id !== profileData.id) {
        const unsub = onSnapshot(doc(db, 'users', user.id), (docSnap) => {
            if (docSnap.exists()) {
                const userData = docSnap.data();
                setIsFollowing((userData.following || []).includes(profileData.id));
            }
        });
        return () => unsub();
    } else {
        setIsFollowing(false);
    }
  }, [user.id, profileData?.id]);

  // --- ACTIONS ---
  const handleFollowToggle = async () => {
    if (user.isGuest) return onOpenAuth();
    if (!profileData) return;
    try {
        if (isFollowing) await unfollowUser(user.id, profileData.id);
        else {
            await followUser(user.id, profileData);
            await sendNotification(profileData.id, user, 'FOLLOW', 'đã theo dõi bạn.', `/profile/${user.id}`);
        }
    } catch (e) { alert("Lỗi kết nối."); }
  };

  const openEditModal = () => {
    if (!profileData) return;
    setEditForm({ 
        name: profileData.name, 
        bio: profileData.bio || '', 
        avatar: profileData.avatar || '',
        username: profileData.username || '' // Load username hiện tại lên form
    });
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    if (!profileData) return;
    setIsSaving(true);

    try {
        // --- LOGIC KIỂM TRA USERNAME ---
        let finalUsername = editForm.username.trim().toLowerCase(); 
        
        // 1. Validate ký tự
        if (finalUsername && !/^[a-z0-9._]+$/.test(finalUsername)) {
            alert("Tên định danh chỉ được chứa chữ thường, số, dấu chấm (.) và gạch dưới (_)");
            setIsSaving(false);
            return;
        }

        // 2. Check trùng (Nếu user thay đổi username)
        if (finalUsername && finalUsername !== profileData.username) {
            const q = query(collection(db, 'users'), where('username', '==', finalUsername));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                alert(`Tên định danh "${finalUsername}" đã có người sử dụng. Vui lòng chọn tên khác.`);
                setIsSaving(false);
                return;
            }
        }

        // 3. Lưu vào Database
        await updateDoc(doc(db, 'users', profileData.id), {
            name: editForm.name,
            bio: editForm.bio,
            avatar: editForm.avatar,
            username: finalUsername || null
        });

        // 4. Nếu đổi username thành công -> Chuyển hướng URL sang link đẹp
        if (finalUsername && finalUsername !== userId) {
            navigate(`/profile/${finalUsername}`, { replace: true });
        }
        
        setShowEditModal(false);
    } catch (error) {
        alert("Có lỗi xảy ra khi lưu!");
    } finally {
        setIsSaving(false);
    }
  };

  const handleAuthAction = () => {
    if (user.isGuest) onOpenAuth();
    else { onLogout(); navigate('/'); }
  };

  const handleMessage = () => {
      if (user.isGuest) return onOpenAuth();
      if (profileData) navigate(`/messages/${profileData.id}`);
  };

  // --- GUEST VIEW ---
  if (user.isGuest && isViewingSelf) {
      return (
          <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center animate-fade-in pt-safe-top pb-24">
              <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <LogIn size={40} className="text-blue-500" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Chào bạn mới! 👋</h1>
              <p className="text-gray-500 mb-8 text-sm">Đăng nhập để tham gia cộng đồng ngay.</p>
              <button onClick={onOpenAuth} className="px-8 py-3 bg-primary text-white font-bold rounded-full shadow-lg hover:bg-[#25A99C]">Đăng nhập / Đăng ký</button>
          </div>
      );
  }

  if (loadingProfile) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  if (!profileData) return <div className="p-10 text-center">Người dùng không tồn tại</div>;

  // Stats
  const userQuestions = questions.filter(q => q.author.id === profileData.id);
  const userAnswersCount = questions.reduce((acc, q) => acc + q.answers.filter(a => a.author.id === profileData.id).length, 0);
  const reputationPoints = profileData.points || (userQuestions.length * 10) + (userAnswersCount * 20);

  return (
    <div className="pb-24 bg-white min-h-screen animate-fade-in">
      
      {/* 1. COVER PHOTO */}
      <div className="h-48 md:h-64 bg-gradient-to-r from-blue-400 to-cyan-300 relative">
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
         {!isViewingSelf && (
             <button onClick={() => navigate(-1)} className="absolute top-safe-top left-4 p-2 bg-black/20 text-white rounded-full backdrop-blur-md md:hidden z-10"><ArrowLeft size={20} /></button>
         )}
         <button onClick={() => setShowShareModal(true)} className="absolute top-safe-top right-4 p-2 bg-black/20 text-white rounded-full backdrop-blur-md z-10 hover:bg-black/30 transition-colors"><Share2 size={20} /></button>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-16 sm:-mt-20 mb-6 flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6">
            
            {/* 2. AVATAR */}
            <div className="relative group">
                <div className="p-1.5 bg-white rounded-full">
                    <img src={profileData.avatar} className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-white shadow-md bg-gray-100" />
                </div>
                {profileData.isExpert && <div className="absolute bottom-2 right-2 bg-blue-500 text-white p-1.5 rounded-full border-4 border-white shadow-sm"><ShieldCheck size={20} /></div>}
            </div>

            {/* 3. USER INFO */}
            <div className="flex-1 text-center sm:text-left mb-2 w-full">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center justify-center sm:justify-start gap-2">
                            {profileData.name}
                            {profileData.isAdmin && <Badge text="Admin" color="red" />}
                        </h1>
                        {/* HIỂN THỊ USERNAME NẾU CÓ */}
                        <div className="flex flex-col sm:flex-row gap-2 mt-1 items-center sm:items-start justify-center sm:justify-start">
                            {profileData.username && (
                                <span className="text-gray-500 text-sm font-medium">@{profileData.username}</span>
                            )}
                            {profileData.specialty && (
                                <span className="text-blue-600 font-medium text-sm flex items-center gap-1"><Briefcase size={14} /> {profileData.specialty}</span>
                            )}
                        </div>
                        
                        <div className="flex items-center justify-center sm:justify-start gap-6 mt-3 text-sm text-gray-600">
                            <div className="flex gap-1"><strong className="text-gray-900">{profileData.followers?.length || 0}</strong> người theo dõi</div>
                            <div className="flex gap-1"><strong className="text-gray-900">{profileData.following?.length || 0}</strong> đang theo dõi</div>
                        </div>
                    </div>

                    <div className="flex gap-3 justify-center sm:justify-start w-full sm:w-auto">
                        {isViewingSelf ? (
                            <>
                                <button onClick={openEditModal} className="flex-1 sm:flex-none px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors text-sm flex items-center justify-center gap-2">
                                    <Settings size={16} /> Sửa hồ sơ
                                </button>
                                <button onClick={handleAuthAction} className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors text-sm">
                                    Đăng xuất
                                </button>
                            </>
                        ) : (
                            <>
                                <button 
                                    onClick={handleFollowToggle} 
                                    className={`flex-1 sm:flex-none px-6 py-2 rounded-xl font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 ${isFollowing ? 'bg-white border border-gray-300 text-gray-700' : 'bg-primary text-white hover:bg-teal-600 shadow-teal-200'}`}
                                >
                                    {isFollowing ? <UserCheck size={18} /> : <UserPlus size={18} />}
                                    {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
                                </button>
                                <button onClick={handleMessage} className="flex-1 sm:flex-none px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors text-sm flex items-center justify-center gap-2">
                                    <MessageCircle size={18} /> Nhắn tin
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* 4. BIO */}
        {profileData.bio && (
            <div className="mb-8">
                <p className="text-gray-600 text-sm leading-relaxed max-w-2xl bg-gray-50 p-4 rounded-xl border border-gray-100">"{profileData.bio}"</p>
            </div>
        )}

        {/* 5. TABS */}
        <div className="border-b border-gray-200 mb-6 flex gap-8">
            <button onClick={() => setActiveTab('overview')} className={`pb-3 text-sm font-bold transition-all relative ${activeTab === 'overview' ? 'text-primary' : 'text-gray-500 hover:text-gray-800'}`}>
                Tổng quan {activeTab === 'overview' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full"></div>}
            </button>
            <button onClick={() => setActiveTab('questions')} className={`pb-3 text-sm font-bold transition-all relative ${activeTab === 'questions' ? 'text-primary' : 'text-gray-500 hover:text-gray-800'}`}>
                Bài viết <span className="ml-1 bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-md text-[10px]">{userQuestions.length}</span>
                {activeTab === 'questions' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full"></div>}
            </button>
        </div>

        {/* 6. TAB CONTENT */}
        <div className="min-h-[300px]">
            {activeTab === 'overview' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
                    <StatCard icon={<Star className="text-yellow-500" />} label="Điểm uy tín" value={reputationPoints} />
                    <StatCard icon={<Heart className="text-red-500" />} label="Được yêu thích" value={questions.reduce((acc, q) => acc + (q.author.id === profileData.id ? q.likes : 0), 0)} />
                    <StatCard icon={<HelpCircle className="text-blue-500" />} label="Câu hỏi" value={userQuestions.length} />
                    <StatCard icon={<MessageCircle className="text-green-500" />} label="Câu trả lời" value={userAnswersCount} />
                </div>
            )}

            {activeTab === 'questions' && (
                <div className="space-y-4 animate-fade-in">
                    {userQuestions.length > 0 ? (
                        userQuestions.map(q => (
                            <Link to={`/question/${toSlug(q.title, q.id)}`} key={q.id} className="block bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] font-bold text-primary bg-teal-50 px-2 py-1 rounded-lg uppercase tracking-wide">{q.category}</span>
                                    <span className="text-[10px] text-gray-400">{new Date(q.createdAt).toLocaleDateString('vi-VN')}</span>
                                </div>
                                <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">{q.title}</h3>
                                <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                                    <span className="flex items-center gap-1"><Heart size={14} className="text-red-400"/> {q.likes} yêu thích</span>
                                    <span className="flex items-center gap-1"><MessageCircle size={14} className="text-blue-400"/> {q.answers.length} thảo luận</span>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="py-12 text-center border-2 border-dashed border-gray-200 rounded-2xl"><p className="text-gray-400 font-medium">Chưa có bài viết nào.</p></div>
                    )}
                </div>
            )}
        </div>
      </div>

      {/* --- EDIT MODAL (ĐÃ CÓ TRƯỜNG USERNAME) --- */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-pop-in">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-lg text-gray-800">Chỉnh sửa hồ sơ</h3>
                    <button onClick={() => setShowEditModal(false)} className="hover:bg-gray-200 p-1 rounded-full"><X size={20} /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tên hiển thị</label>
                        <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                    
                    {/* TRƯỜNG NHẬP USERNAME */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tên định danh (Username)</label>
                        <div className="flex items-center relative">
                            <span className="absolute left-4 text-gray-400 font-bold">@</span>
                            <input 
                                type="text" 
                                value={editForm.username} 
                                onChange={e => setEditForm({...editForm, username: e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, '')})} 
                                placeholder="nguyenvanan.99"
                                className="w-full pl-8 pr-4 py-2.5 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 font-medium text-gray-700" 
                            />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">Dùng để tạo đường dẫn hồ sơ đẹp hơn. Chỉ dùng chữ thường, số, dấu chấm, gạch dưới.</p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Avatar URL</label>
                        <div className="flex gap-3">
                            <img src={editForm.avatar || 'https://via.placeholder.com/50'} className="w-10 h-10 rounded-full object-cover bg-gray-100 border"/>
                            <input type="text" value={editForm.avatar} onChange={e => setEditForm({...editForm, avatar: e.target.value})} className="flex-1 px-4 py-2.5 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Giới thiệu</label>
                        <textarea rows={3} value={editForm.bio} onChange={e => setEditForm({...editForm, bio: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border rounded-xl resize-none outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                </div>
                <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
                    <button onClick={() => setShowEditModal(false)} className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors">Hủy</button>
                    <button onClick={handleSaveProfile} disabled={isSaving} className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl flex items-center gap-2">
                        {isSaving && <Loader2 className="animate-spin" size={16}/>} Lưu thay đổi
                    </button>
                </div>
            </div>
        </div>
      )}

      <ShareModal 
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        url={window.location.href}
        title={`Trang cá nhân của ${profileData.name}`}
      />
    </div>
  );
};

const Badge: React.FC<{ text: string; color: 'blue' | 'red' }> = ({ text, color }) => (
  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md align-middle ml-2 ${color === 'blue' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>{text}</span>
);

const StatCard: React.FC<{ icon: React.ReactNode; value: number; label: string }> = ({ icon, value, label }) => (
  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col items-center justify-center text-center">
    <div className="mb-2 p-2 bg-white rounded-full shadow-sm">{icon}</div>
    <span className="text-xl font-black text-gray-900">{value}</span>
    <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</span>
  </div>
);
