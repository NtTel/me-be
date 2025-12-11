import React, { useState, useEffect } from 'react';
import { User, Question, toSlug } from '../types';
import { Settings, ShieldCheck, MessageCircle, HelpCircle, Heart, Star, Briefcase, Share2, Users, UserPlus, UserCheck, ArrowLeft, Loader2, LogIn, X, Save } from 'lucide-react';
// @ts-ignore
import { Link, useNavigate, useParams } from 'react-router-dom';
import { followUser, unfollowUser, sendNotification } from '../services/db';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
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
  const [viewedUser, setViewedUser] = useState<User | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', bio: '', avatar: '' });
  const [isSaving, setIsSaving] = useState(false);

  // Trạng thái theo dõi Real-time
  const [isFollowing, setIsFollowing] = useState(false);

  const isViewingSelf = !userId || (user && userId === user.id);
  const profileUser = isViewingSelf ? user : (viewedUser || null);

  // 1. Fetch Profile người khác
  useEffect(() => {
    const fetchUser = async () => {
        if (userId && userId !== user.id) {
            setLoadingProfile(true);
            try {
                const docRef = doc(db, 'users', userId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    // @ts-ignore
                    setViewedUser({ id: docSnap.id, ...docSnap.data() });
                } else {
                    setViewedUser(null);
                }
            } catch (error) {
                console.error("Error fetching user profile:", error);
            } finally {
                setLoadingProfile(false);
            }
        }
    };
    fetchUser();
  }, [userId, user.id]);

  // 2. LẮNG NGHE TRẠNG THÁI THEO DÕI (QUAN TRỌNG)
  useEffect(() => {
    // Nếu đang xem người khác và đã đăng nhập
    if (user && !user.isGuest && profileUser && user.id !== profileUser.id) {
        // Lắng nghe thay đổi từ chính profile của mình (user.id)
        // Để xem danh sách 'following' có chứa ID người kia không
        const unsub = onSnapshot(doc(db, 'users', user.id), (docSnap) => {
            if (docSnap.exists()) {
                const userData = docSnap.data();
                const myFollowing = userData.following || [];
                setIsFollowing(myFollowing.includes(profileUser.id));
            }
        });
        return () => unsub();
    } else {
        setIsFollowing(false);
    }
  }, [user.id, profileUser?.id]);

  // --- ACTIONS ---
  const handleFollowToggle = async () => {
    if (user.isGuest) {
        onOpenAuth();
        return;
    }
    // Gọi hàm DB, giao diện sẽ tự cập nhật nhờ onSnapshot ở trên
    try {
        if (isFollowing) {
            await unfollowUser(user.id, profileUser.id);
        } else {
            await followUser(user.id, profileUser);
            await sendNotification(profileUser.id, user, 'FOLLOW', 'đã bắt đầu theo dõi bạn.', `/profile/${user.id}`);
        }
    } catch (e) {
        console.error("Follow error:", e);
        alert("Không thể theo dõi. Vui lòng kiểm tra kết nối hoặc quyền truy cập.");
    }
  };

  const openEditModal = () => {
    if (!profileUser) return;
    setEditForm({
      name: profileUser.name,
      bio: profileUser.bio || '',
      avatar: profileUser.avatar || ''
    });
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    if (!profileUser) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', profileUser.id), {
        name: editForm.name,
        bio: editForm.bio,
        avatar: editForm.avatar
      });
      window.location.reload(); 
    } catch (error) {
      alert("Có lỗi xảy ra khi lưu!");
      setIsSaving(false);
    }
  };

  const handleAuthAction = () => {
    if (user.isGuest) onOpenAuth();
    else {
        onLogout();
        navigate('/');
    }
  };

  const handleMessage = () => {
      if (user.isGuest) return onOpenAuth();
      navigate(`/messages/${profileUser.id}`);
  };

  if (user.isGuest && isViewingSelf) {
      return (
          <div className="min-h-screen bg-[#F7F7F5] flex flex-col items-center justify-center p-6 text-center animate-fade-in pt-safe-top pb-24">
              <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100 max-w-sm w-full">
                  <div className="w-24 h-24 bg-gradient-to-tr from-primary to-blue-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-200">
                      <LogIn size={40} className="text-white" />
                  </div>
                  <h1 className="text-2xl font-bold text-textDark mb-2">Chào bạn mới! 👋</h1>
                  <p className="text-textGray mb-8 text-sm">Đăng nhập để tham gia cộng đồng nhé.</p>
                  <button onClick={onOpenAuth} className="w-full bg-primary text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-[#25A99C]">Đăng nhập / Đăng ký</button>
              </div>
          </div>
      );
  }

  if (loadingProfile) return <div className="min-h-screen flex items-center justify-center bg-[#F7F7F5]"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  if (!profileUser) return <div className="p-10 text-center">Người dùng không tồn tại</div>;

  // Stats calculation
  const userQuestions = questions.filter(q => q.author.id === profileUser.id);
  const userAnswersCount = questions.reduce((acc, q) => acc + q.answers.filter(a => a.author.id === profileUser.id).length, 0);
  const reputationPoints = profileUser.points || (userQuestions.length * 10) + (userAnswersCount * 20);

  return (
    <div className="pb-24 md:pb-10 animate-fade-in bg-[#F7F7F5] min-h-screen">
      <div className="relative">
        {/* Banner */}
        <div className="h-40 md:h-56 bg-gradient-to-r from-[#2EC4B6] to-[#3B82F6] relative overflow-hidden">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
           
           <div className="absolute top-safe-top left-4 md:hidden">
              {!isViewingSelf && (
                  <button onClick={() => navigate(-1)} className="p-2 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/30 transition-colors">
                      <ArrowLeft size={20} />
                  </button>
              )}
           </div>
           
           <div className="absolute top-safe-top right-4 flex gap-2">
             <button onClick={() => setShowShareModal(true)} className="p-2 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/30 transition-colors active:scale-95">
                <Share2 size={20} />
             </button>
             {isViewingSelf && (
                <button onClick={openEditModal} className="p-2 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/30 transition-colors active:scale-95">
                    <Settings size={20} />
                </button>
             )}
           </div>
        </div>

        {/* Profile Info */}
        <div className="px-4 -mt-16 mb-4 relative z-10">
          <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 p-6 flex flex-col items-center md:flex-row md:items-end gap-4 border border-white/50">
            <div className="relative -mt-16 md:-mt-12 group">
              <div className="p-1.5 bg-white rounded-full shadow-sm">
                <img src={profileUser.avatar} className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-2 border-gray-50 bg-gray-100"/>
              </div>
              {profileUser.isExpert && <div className="absolute bottom-1 right-1 bg-blue-500 text-white p-1.5 rounded-full border-4 border-white shadow-sm"><ShieldCheck size={16} /></div>}
            </div>
            
            <div className="text-center md:text-left flex-1 space-y-2">
               <div>
                    <h1 className="text-2xl font-bold text-textDark flex items-center justify-center md:justify-start gap-2">
                        {profileUser.name}
                        {profileUser.isExpert && <Badge text="Chuyên gia" color="blue" />}
                        {profileUser.isAdmin && <Badge text="Admin" color="red" />}
                    </h1>
                    {profileUser.specialty && <div className="flex items-center justify-center md:justify-start gap-1.5 mt-1 text-xs text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-lg inline-flex"><Briefcase size={12} /> {profileUser.specialty}</div>}
               </div>
               
               <div className="flex items-center justify-center md:justify-start gap-4 text-sm">
                  <div className="flex items-center gap-1 font-medium text-textDark"><strong className="text-lg">{profileUser.followers?.length || 0}</strong> <span className="text-gray-400">Người theo dõi</span></div>
                  <div className="flex items-center gap-1 font-medium text-textDark"><strong className="text-lg">{profileUser.following?.length || 0}</strong> <span className="text-gray-400">Đang theo dõi</span></div>
               </div>
            </div>

            <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                {isViewingSelf ? (
                    <button onClick={handleAuthAction} className={`flex-1 md:flex-none px-6 py-2.5 font-bold rounded-xl transition-all active:scale-95 text-sm ${user.isGuest ? 'bg-primary text-white shadow-lg' : 'bg-gray-100 text-textDark'}`}>{user.isGuest ? 'Đăng nhập ngay' : 'Đăng xuất'}</button>
                ) : (
                    <>
                        <button 
                            onClick={handleFollowToggle} 
                            className={`flex-1 md:flex-none px-5 py-2.5 font-bold rounded-xl transition-all active:scale-95 text-sm flex items-center justify-center gap-2 shadow-lg ${isFollowing ? 'bg-white border border-gray-200 text-textDark' : 'bg-blue-600 text-white shadow-blue-200'}`}
                        >
                            {isFollowing ? <UserCheck size={18} /> : <UserPlus size={18} />}
                            {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
                        </button>
                        <button onClick={handleMessage} className="flex-1 md:flex-none px-5 py-2.5 bg-gray-100 text-textDark font-bold rounded-xl hover:bg-gray-200 transition-all active:scale-95 text-sm flex items-center justify-center gap-2"><MessageCircle size={18} />Nhắn tin</button>
                    </>
                )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 max-w-5xl mx-auto space-y-6">
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 snap-x">
          <StatCard icon={<Star className="text-yellow-500" size={20} />} value={reputationPoints} label="Điểm uy tín" bg="bg-yellow-50" />
          <StatCard icon={<HelpCircle className="text-blue-500" size={20} />} value={userQuestions.length} label="Câu hỏi" bg="bg-blue-50" />
          <StatCard icon={<MessageCircle className="text-green-500" size={20} />} value={userAnswersCount} label="Trả lời" bg="bg-green-50" />
          <StatCard icon={<Users className="text-purple-500" size={20} />} value={profileUser.followers?.length || 0} label="Followers" bg="bg-purple-50" />
        </div>

        <div className="sticky top-[60px] md:top-0 z-20 bg-[#F7F7F5]/95 backdrop-blur-sm -mx-4 px-4 pt-2 pb-2">
           <div className="bg-white p-1 rounded-2xl shadow-sm border border-gray-100 flex">
             <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} label="Tổng quan" />
             <TabButton active={activeTab === 'questions'} onClick={() => setActiveTab('questions')} label="Bài viết" />
           </div>
        </div>

        <div className="min-h-[300px]">
           {activeTab === 'overview' && (
             <div className="space-y-6 animate-fade-in">
                <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
                  <h3 className="font-bold text-textDark mb-4 flex items-center gap-2 text-lg"><Heart size={20} className="text-red-500" fill="currentColor" /> Chủ đề quan tâm</h3>
                  <div className="flex flex-wrap gap-2">
                    {['Dinh dưỡng', 'Giáo dục sớm', '0-1 tuổi', 'Ăn dặm'].map(tag => (
                      <span key={tag} className="px-4 py-2 bg-gray-50 text-textDark font-medium rounded-xl text-sm border border-transparent hover:border-gray-200 transition-all">{tag}</span>
                    ))}
                  </div>
                </div>
             </div>
           )}

           {activeTab === 'questions' && (
             <div className="space-y-4 animate-fade-in">
               {userQuestions.map(q => (
                 <Link to={`/question/${toSlug(q.title, q.id)}`} key={q.id} className="block bg-white p-5 rounded-[1.5rem] shadow-sm border border-gray-100 active:scale-[0.99] transition-transform">
                   <h3 className="font-bold text-textDark text-[16px] mb-2">{q.title}</h3>
                   <div className="flex items-center gap-4 text-xs font-bold text-gray-400">
                      <span className="flex items-center gap-1"><Heart size={14} /> {q.likes}</span>
                      <span className="flex items-center gap-1"><MessageCircle size={14} /> {q.answers.length}</span>
                   </div>
                 </Link>
               ))}
             </div>
           )}
        </div>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-pop-in">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-bold text-lg text-gray-800">Chỉnh sửa hồ sơ</h3>
                    <button onClick={() => setShowEditModal(false)}><X size={20} /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700">Tên hiển thị</label>
                        <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border rounded-xl" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700">Avatar URL</label>
                        <input type="text" value={editForm.avatar} onChange={e => setEditForm({...editForm, avatar: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border rounded-xl" />
                    </div>
                </div>
                <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
                    <button onClick={() => setShowEditModal(false)} className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-200 rounded-xl">Hủy</button>
                    <button onClick={handleSaveProfile} className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl">Lưu</button>
                </div>
            </div>
        </div>
      )}

      <ShareModal 
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        url={window.location.href}
        title={`Trang cá nhân của ${profileUser.name}`}
      />
    </div>
  );
};

const Badge: React.FC<{ text: string; color: 'blue' | 'red' }> = ({ text, color }) => (
  <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-md align-middle ${color === 'blue' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>{text}</span>
);

const StatCard: React.FC<{ icon: React.ReactNode; value: number; label: string; bg: string }> = ({ icon, value, label, bg }) => (
  <div className={`min-w-[100px] md:min-w-0 flex-1 p-4 rounded-2xl bg-white border border-gray-100 flex flex-col items-center justify-center text-center shadow-sm snap-start`}>
    <div className={`mb-2 p-2 rounded-full ${bg}`}>{icon}</div>
    <span className="text-lg font-bold text-textDark">{value}</span>
    <span className="text-xs text-textGray font-medium">{label}</span>
  </div>
);

const TabButton: React.FC<{ active: boolean; onClick: () => void; label: string }> = ({ active, onClick, label }) => (
  <button onClick={onClick} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${active ? 'bg-white shadow-sm text-textDark ring-1 ring-black/5' : 'text-textGray hover:text-textDark'}`}>{label}</button>
);
