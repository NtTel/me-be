import React, { useEffect, useState } from 'react';
// @ts-ignore
import { useParams, useNavigate } from 'react-router-dom';
import { Document, DocumentReview, User } from '../types';
import { fetchDocumentBySlug, incrementDownload, fetchDocumentReviews, addDocumentReview } from '../services/documents';
import { Loader2, ArrowLeft, Download, Star, FileText, Share2, Send, Link as LinkIcon, ExternalLink, MessageCircle } from 'lucide-react';
import { loginAnonymously } from '../services/auth';
import { ShareModal } from '../components/ShareModal';

export const DocumentDetail: React.FC<{ currentUser: User; onOpenAuth: () => void }> = ({ currentUser, onOpenAuth }) => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  
  const [doc, setDoc] = useState<Document | null>(null);
  const [reviews, setReviews] = useState<DocumentReview[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Review State
  const [userRating, setUserRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  
  // Share State
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    if (slug) loadData(slug);
  }, [slug]);

  const loadData = async (slug: string) => {
    setLoading(true);
    const docData = await fetchDocumentBySlug(slug);
    if (docData) {
        setDoc(docData);
        const reviewsData = await fetchDocumentReviews(docData.id);
        setReviews(reviewsData);
    }
    setLoading(false);
  };

  const handleDownload = async () => {
      if (!doc) return;
      
      const targetUrl = doc.isExternal ? doc.externalLink : doc.fileUrl;
      if (!targetUrl) {
          alert("Không tìm thấy đường dẫn tài liệu.");
          return;
      }

      window.open(targetUrl, '_blank');
      await incrementDownload(doc.id);
      setDoc(prev => prev ? ({ ...prev, downloads: prev.downloads + 1 }) : null);
  };

  const handleSubmitReview = async () => {
      if (!doc || !reviewContent.trim()) return;
      
      let user = currentUser;
      if (user.isGuest) {
          try { user = await loginAnonymously(); } 
          catch { onOpenAuth(); return; }
      }

      setSubmittingReview(true);
      await addDocumentReview(user, doc.id, userRating, reviewContent, doc.rating, doc.ratingCount);
      
      const newReviews = await fetchDocumentReviews(doc.id);
      setReviews(newReviews);
      setReviewContent('');
      setSubmittingReview(false);
  };

  const getFileIcon = (type: string, isExternal?: boolean) => {
      if (isExternal) return <LinkIcon size={48} className="text-blue-500" />;
      switch (type) {
          case 'pdf': return <span className="text-5xl">📕</span>;
          case 'docx': return <span className="text-5xl">📝</span>;
          case 'xlsx': return <span className="text-5xl">📊</span>;
          case 'pptx': return <span className="text-5xl">📽️</span>;
          case 'image': return <span className="text-5xl">🖼️</span>;
          case 'video': return <span className="text-5xl">🎬</span>;
          default: return <span className="text-5xl">📄</span>;
      }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F7F7F5]"><Loader2 className="animate-spin text-green-600" size={32} /></div>;
  
  if (!doc) return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
          <FileText size={64} className="text-gray-300 mb-4" />
          <h2 className="text-xl font-bold text-gray-700">Tài liệu không tồn tại</h2>
          <button onClick={() => navigate('/documents')} className="mt-4 text-green-600 font-bold hover:underline">Quay lại thư viện</button>
      </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F7F5] pb-24 animate-fade-in pt-safe-top">
       {/* Header */}
       <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md px-4 py-3 border-b border-gray-100 flex items-center justify-between shadow-sm">
          <button onClick={() => navigate('/documents')} className="p-2 -ml-2 hover:bg-gray-100 rounded-full text-textDark transition-colors">
              <ArrowLeft size={22} />
          </button>
          <span className="font-bold text-sm text-textDark uppercase tracking-wide">Chi tiết tài liệu</span>
          <button onClick={() => setShowShare(true)} className="p-2 -mr-2 hover:bg-gray-100 rounded-full text-textDark transition-colors">
              <Share2 size={20} />
          </button>
       </div>

       <div className="max-w-3xl mx-auto p-4 space-y-6">
           {/* Document Card */}
           <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-gray-100 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full blur-3xl -z-10 translate-x-10 -translate-y-10"></div>
               
               <div className="flex flex-col items-center text-center mb-8">
                   <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mb-6 shadow-inner ${doc.isExternal ? 'bg-blue-50' : 'bg-green-50'}`}>
                       {getFileIcon(doc.fileType, doc.isExternal)}
                   </div>
                   <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-3 leading-tight">{doc.title}</h1>
                   
                   <div className="flex flex-wrap justify-center gap-3 text-xs font-bold text-gray-500">
                       <span className="bg-gray-100 px-3 py-1 rounded-full uppercase tracking-wider">{doc.isExternal ? 'Liên kết' : doc.fileType}</span>
                       <span className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full"><Star size={12} fill="currentColor"/> {doc.rating.toFixed(1)} ({doc.ratingCount})</span>
                       <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full">{doc.downloads} lượt tải</span>
                   </div>
               </div>
               
               <div className="prose prose-sm text-gray-600 mb-8 bg-gray-50 p-4 rounded-xl border border-gray-100">
                   <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Mô tả tài liệu</h4>
                   <p className="leading-relaxed whitespace-pre-wrap">{doc.description || "Chưa có mô tả chi tiết."}</p>
               </div>
               
               <button 
                   onClick={handleDownload} 
                   className={`w-full text-white font-bold py-4 rounded-xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-lg ${doc.isExternal ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' : 'bg-green-600 hover:bg-green-700 shadow-green-200'}`}
               >
                   {doc.isExternal ? <ExternalLink size={24} /> : <Download size={24} />} 
                   {doc.isExternal ? 'Truy cập liên kết' : 'Tải xuống ngay'}
               </button>
               
               {doc.isExternal && (
                   <p className="text-xs text-center text-gray-400 mt-3 flex items-center justify-center gap-1">
                       <LinkIcon size={12} /> Bạn sẽ được chuyển đến trang đích
                   </p>
               )}
           </div>

           {/* Author Info */}
           <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
               <img src={doc.authorAvatar} className="w-12 h-12 rounded-full object-cover bg-gray-100" />
               <div className="flex-1 min-w-0">
                   <p className="text-xs text-gray-400 font-bold uppercase mb-0.5">Người chia sẻ</p>
                   <h4 className="font-bold text-textDark text-sm truncate">{doc.authorName} {doc.isExpert && '✓'}</h4>
               </div>
               <div className="text-xs text-gray-400 font-medium">
                   {new Date(doc.createdAt).toLocaleDateString('vi-VN')}
               </div>
           </div>

           {/* Reviews Section */}
           <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
               <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                   <MessageCircle className="text-green-600" /> Đánh giá từ cộng đồng
               </h3>
               
               {/* Add Review */}
               <div className="bg-gray-50 p-5 rounded-2xl mb-8 border border-gray-100">
                   <div className="text-center mb-4">
                       <p className="text-xs font-bold text-gray-400 uppercase mb-2">Bạn thấy tài liệu này thế nào?</p>
                       <div className="flex items-center justify-center gap-2">
                           {[1,2,3,4,5].map(star => (
                               <button 
                                   key={star} 
                                   onClick={() => setUserRating(star)} 
                                   className="focus:outline-none transition-transform hover:scale-125 active:scale-90"
                               >
                                   <Star size={32} className={`${star <= userRating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} drop-shadow-sm`} />
                               </button>
                           ))}
                       </div>
                   </div>
                   <div className="flex gap-2">
                       <input 
                           value={reviewContent} 
                           onChange={e => setReviewContent(e.target.value)} 
                           className="flex-1 p-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all" 
                           placeholder="Viết cảm nhận của bạn..." 
                       />
                       <button 
                           onClick={handleSubmitReview} 
                           disabled={submittingReview || !reviewContent.trim()} 
                           className="bg-green-600 text-white p-3 rounded-xl shadow-md hover:bg-green-700 disabled:opacity-50 disabled:shadow-none transition-all active:scale-90"
                       >
                           {submittingReview ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                       </button>
                   </div>
               </div>

               {/* Review List */}
               <div className="space-y-6">
                   {reviews.length === 0 ? (
                       <div className="text-center text-gray-400 py-4 text-sm italic">Chưa có đánh giá nào. Hãy là người đầu tiên!</div>
                   ) : reviews.map(rev => (
                       <div key={rev.id} className="border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                           <div className="flex items-start justify-between mb-2">
                               <div className="flex items-center gap-3">
                                   <img src={rev.userAvatar} className="w-8 h-8 rounded-full bg-gray-100 object-cover" />
                                   <div>
                                       <span className="font-bold text-sm text-textDark block leading-none mb-1">{rev.userName}</span>
                                       <div className="flex gap-0.5">
                                           {[...Array(5)].map((_, i) => (
                                               <Star key={i} size={10} className={i < rev.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"} />
                                           ))}
                                       </div>
                                   </div>
                               </div>
                               <span className="text-[10px] text-gray-400">{new Date(rev.createdAt).toLocaleDateString('vi-VN')}</span>
                           </div>
                           <p className="text-sm text-gray-600 ml-11 bg-gray-50 p-3 rounded-tr-xl rounded-b-xl rounded-tl-sm inline-block">
                               {rev.comment}
                           </p>
                       </div>
                   ))}
               </div>
           </div>
       </div>

       <ShareModal 
          isOpen={showShare}
          onClose={() => setShowShare(false)}
          url={window.location.href}
          title={doc.title}
       />
    </div>
  );
};
