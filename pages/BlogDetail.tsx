import React, { useEffect, useState, useMemo } from 'react';
// @ts-ignore
import { useParams, useNavigate, Link } from 'react-router-dom';
import { BlogPost, BlogComment, User } from '../types'; 
import { fetchPostBySlug, fetchRelatedPosts, fetchBlogComments, addBlogComment } from '../services/blog'; 
import { loginAnonymously } from '../services/auth';
import { 
  Loader2, ArrowLeft, Calendar, Share2, MessageCircle, Send, 
  ExternalLink, ShieldCheck, Heart, List, ChevronUp 
} from 'lucide-react';
import { AuthModal } from '../components/AuthModal';
import { ShareModal } from '../components/ShareModal';

// --- CONSTANTS ---
const PAGE_SIZE = 5;

// --- TYPES ---
interface BlogCommentWithUI extends BlogComment {}

// --- HOOK: READING PROGRESS ---
const useReadingProgress = () => {
  const [completion, setCompletion] = useState(0);
  useEffect(() => {
    const updateScrollCompletion = () => {
      const currentProgress = window.scrollY;
      const scrollHeight = document.body.scrollHeight - window.innerHeight;
      if (scrollHeight) {
        setCompletion(Number((currentProgress / scrollHeight).toFixed(2)) * 100);
      }
    };
    window.addEventListener('scroll', updateScrollCompletion);
    return () => window.removeEventListener('scroll', updateScrollCompletion);
  }, []);
  return completion;
};

// --- HELPER: EXTRACT HEADINGS FOR TOC ---
// Tách thẻ h2, h3 từ HTML string để tạo mục lục
const extractHeadings = (htmlContent: string) => {
  const div = document.createElement('div');
  div.innerHTML = htmlContent;
  const elements = div.querySelectorAll('h2, h3');
  const headings: { id: string; text: string; level: number }[] = [];
  
  elements.forEach((el, index) => {
    const id = `heading-${index}`;
    // Lưu ý: Trong thực tế, bạn cần inject ID này vào HTML nội dung render ra
    // Ở đây mình giả lập logic để tạo list
    headings.push({
      id,
      text: el.textContent || '',
      level: Number(el.tagName.substring(1))
    });
  });
  return headings;
};

// --- HELPER: YOUTUBE ID ---
const getYoutubeId = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export const BlogDetail: React.FC<{ currentUser: User; onOpenAuth: () => void }> = ({ currentUser, onOpenAuth }) => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  
  // Data State
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [comments, setComments] = useState<BlogCommentWithUI[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination State
  const [hasMore, setHasMore] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  // Interaction State
  const [commentContent, setCommentContent] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showMobileTOC, setShowMobileTOC] = useState(false);

  const readingProgress = useReadingProgress();

  useEffect(() => {
    if (slug) {
        window.scrollTo(0, 0); // Reset scroll khi đổi bài
        loadData(slug);
    }
  }, [slug]);

  // --- LOGIC TẢI DỮ LIỆU ---
  const loadData = async (slug: string) => {
    setLoading(true);
    try {
      const postData = await fetchPostBySlug(slug);
      if (postData) {
        const related = await fetchRelatedPosts(postData.id, postData.categoryId);
        const initialComments = await fetchBlogComments(postData.id); 

        setPost(postData);
        setRelatedPosts(related);
        setComments(initialComments as BlogCommentWithUI[]);
        setHasMore(initialComments.length === PAGE_SIZE); 
      }
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
    }
    setLoading(false);
  };
    
  const handleLoadMore = async () => {
    if (!post || isFetchingMore || !hasMore) return;
    setIsFetchingMore(true);
    const lastComment = comments[comments.length - 1];
    
    try {
        if (!lastComment || !lastComment.id) {
            setHasMore(false);
            return;
        }
        
      const nextComments = await fetchBlogComments(post.id, lastComment.id); 

      setComments(prev => [...prev, ...(nextComments as BlogCommentWithUI[])]);
      setHasMore(nextComments.length === PAGE_SIZE); 
    } catch (error) {
      setHasMore(false);
    } finally {
      setIsFetchingMore(false);
    }
  };

  const handleSendComment = async () => {
    if (!commentContent.trim() || !post) return;
    
    let user = currentUser;
    if (user.isGuest) {
      try {
        user = await loginAnonymously();
      } catch (e) {
        onOpenAuth();
        return;
      }
    }

    setSubmittingComment(true);
    await addBlogComment(user, post.id, commentContent);
    
    const initialComments = await fetchBlogComments(post.id);
    setComments(initialComments as BlogCommentWithUI[]);
    setHasMore(initialComments.length === PAGE_SIZE);
    
    setCommentContent('');
    setSubmittingComment(false);
  };

  // --- MEMOIZE TOC ---
  // Tạo mục lục ảo (Trong thực tế cần xử lý content HTML để gắn ID tương ứng)
  const toc = useMemo(() => post ? extractHeadings(post.content) : [], [post]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  
  if (!post) return <div className="min-h-screen flex flex-col items-center justify-center bg-white">
    <p className="text-gray-500 mb-4">Bài viết không tồn tại hoặc đã bị xóa.</p>
    <button onClick={() => navigate('/blog')} className="text-primary font-bold hover:underline">Quay lại Blog</button>
  </div>;

  return (
    <div className="min-h-screen bg-white pb-24 animate-fade-in relative selection:bg-primary/20 selection:text-primary">
      
      {/* 1. READING PROGRESS BAR */}
      <div 
        className="fixed top-0 left-0 h-1 bg-primary z-50 transition-all duration-100 ease-out"
        style={{ width: `${readingProgress}%` }}
      />

      {/* 2. STICKY NAV HEADER */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100 transition-all">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
            <button onClick={() => navigate('/blog')} className="p-2 -ml-2 hover:bg-gray-50 rounded-full text-gray-600 transition-colors">
                <ArrowLeft size={20} />
            </button>
            
            <span className="font-bold text-sm text-gray-800 line-clamp-1 max-w-[60%] opacity-0 md:opacity-100 transition-opacity">
                {readingProgress > 10 ? post.title : 'Chi tiết bài viết'}
            </span>

            <div className="flex items-center gap-1">
                <button onClick={() => setShowShare(true)} className="p-2 hover:bg-gray-50 rounded-full text-gray-600 transition-colors">
                    <Share2 size={20} />
                </button>
                {/* Mobile TOC Toggle */}
                {toc.length > 0 && (
                    <button onClick={() => setShowMobileTOC(!showMobileTOC)} className="md:hidden p-2 hover:bg-gray-50 rounded-full text-gray-600">
                        <List size={20} />
                    </button>
                )}
            </div>
        </div>
        
        {/* Mobile TOC Drawer */}
        {showMobileTOC && toc.length > 0 && (
            <div className="md:hidden bg-gray-50 border-b border-gray-100 px-4 py-3 animate-slide-down">
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Mục lục</p>
                <ul className="space-y-2">
                    {toc.map((h, i) => (
                        <li key={i} className={`text-sm text-gray-700 ${h.level === 3 ? 'pl-4' : ''}`}>
                            • {h.text}
                        </li>
                    ))}
                </ul>
            </div>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 pt-6 md:pt-10 flex flex-col md:flex-row gap-10">
        
        {/* 3. MAIN CONTENT COLUMN */}
        <article className="flex-1 w-full min-w-0">
            {/* Header Section */}
            <header className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wide">
                        {post.iconEmoji} Blog
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar size={12} /> {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                </div>

                <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6 leading-[1.2] tracking-tight">{post.title}</h1>

                {/* Author Card - Cleaner */}
                <div className="flex items-center gap-3">
                    <img src={post.authorAvatar || "https://cdn-icons-png.flaticon.com/512/3177/3177440.png"} className="w-10 h-10 rounded-full object-cover border border-gray-100" />
                    <div className="flex flex-col">
                        <span className="font-bold text-gray-900 text-sm flex items-center gap-1">
                            {post.authorName}
                            {post.authorIsExpert && <ShieldCheck size={14} className="text-blue-500" />}
                        </span>
                        <span className="text-xs text-gray-500">Tác giả chuyên mục</span>
                    </div>
                </div>
            </header>

            {/* Featured Image */}
            {post.coverImageUrl && (
                <div className="w-full aspect-video md:aspect-[21/9] rounded-2xl overflow-hidden mb-10 shadow-sm">
                    <img src={post.coverImageUrl} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" alt={post.title} />
                </div>
            )}

            {/* Content Body - Optimized Typography */}
            <div className="prose prose-lg prose-slate md:prose-xl max-w-none 
                prose-headings:font-bold prose-headings:text-gray-900 prose-headings:tracking-tight
                prose-p:text-gray-600 prose-p:leading-relaxed
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                prose-img:rounded-2xl prose-img:shadow-sm
                prose-strong:text-gray-800
                mb-12">
                
                {/* Excerpt Highlight */}
                <p className="lead font-medium text-gray-800 not-italic border-l-4 border-primary pl-5 py-1 bg-gray-50 rounded-r-lg">
                    {post.excerpt}
                </p>

                {post.youtubeUrl && (
                    <div className="my-8 rounded-2xl overflow-hidden shadow-lg aspect-video">
                        <iframe 
                            src={`https://www.youtube.com/embed/${getYoutubeId(post.youtubeUrl)}`} 
                            className="w-full h-full border-none"
                            allowFullScreen
                        />
                    </div>
                )}

                <div dangerouslySetInnerHTML={{ __html: post.content }} />
            </div>

            {/* Source Ref */}
            {post.sourceUrl && (
                <div className="mb-12 pt-6 border-t border-gray-100 flex items-center gap-2">
                    <ExternalLink size={16} className="text-gray-400"/>
                    <span className="text-sm text-gray-500">Nguồn tham khảo:</span>
                    <a href={post.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-primary hover:underline">
                        {post.sourceLabel || 'Xem chi tiết'}
                    </a>
                </div>
            )}
            
            <hr className="border-gray-100 mb-12" />

            {/* COMMENT SECTION - REDESIGNED */}
            <div className="mb-16">
                <h3 className="font-bold text-2xl text-gray-900 mb-6 flex items-center gap-2">
                    Bình luận <span className="text-lg font-normal text-gray-400">({post?.commentCount || comments.length})</span>
                </h3>

                {/* Comment Input */}
                <div className="flex gap-4 mb-8">
                    <img src={currentUser.avatar} className="w-10 h-10 rounded-full border border-gray-100 shrink-0 hidden md:block" />
                    <div className="flex-1 relative">
                        <textarea 
                            value={commentContent}
                            onChange={e => setCommentContent(e.target.value)}
                            className="w-full bg-gray-50 border-0 rounded-2xl px-4 py-3 pr-12 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all resize-none text-gray-800 placeholder-gray-400 min-h-[60px]"
                            placeholder="Chia sẻ suy nghĩ của bạn..."
                            rows={2}
                        />
                        <button 
                            onClick={handleSendComment}
                            disabled={!commentContent.trim() || submittingComment}
                            className="absolute right-2 bottom-2 p-2 bg-white rounded-xl text-primary hover:bg-primary hover:text-white transition-colors disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-primary shadow-sm"
                        >
                            {submittingComment ? <Loader2 className="animate-spin" size={18}/> : <Send size={18} />}
                        </button>
                    </div>
                </div>

                {/* Comment List - Clean Style */}
                <div className="space-y-6">
                    {comments.map(c => (
                        <div key={c.id} className="flex gap-3 md:gap-4 animate-fade-in group">
                            <div className="shrink-0 mt-1">
                                <img src={c.authorAvatar} className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-100 object-cover" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-bold text-sm text-gray-900">{c.authorName}</span>
                                    {c.isExpert && <ShieldCheck size={14} className="text-blue-500" />}
                                    <span className="text-xs text-gray-400">• {new Date(c.createdAt).toLocaleDateString('vi-VN')}</span>
                                </div>
                                <div className="text-gray-700 leading-relaxed text-sm md:text-base bg-white">
                                    {c.content}
                                </div>
                            </div>
                        </div>
                    ))}

                    {hasMore && (
                        <div className="pt-2 pl-12 md:pl-14">
                            <button
                                onClick={handleLoadMore}
                                disabled={isFetchingMore}
                                className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-2"
                            >
                                {isFetchingMore ? <Loader2 className="animate-spin" size={14} /> : <ChevronUp className="rotate-180" size={16}/>}
                                Xem thêm bình luận cũ hơn
                            </button>
                        </div>
                    )}
                    
                    {comments.length === 0 && (
                        <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                            <MessageCircle className="mx-auto text-gray-300 mb-2" size={32} />
                            <p className="text-gray-500 text-sm">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                        </div>
                    )}
                </div>
            </div>
        </article>

        {/* 4. SIDEBAR (DESKTOP ONLY) */}
        <aside className="hidden md:block w-80 shrink-0 sticky top-24 h-fit">
            {/* Table of Contents */}
            {toc.length > 0 && (
                <div className="mb-8">
                    <h4 className="font-bold text-gray-900 mb-4 uppercase text-xs tracking-wider">Mục lục</h4>
                    <ul className="space-y-2 border-l-2 border-gray-100 pl-4">
                        {toc.map((h, i) => (
                            <li key={i}>
                                <a href="#" className={`block text-sm transition-colors hover:text-primary line-clamp-1 ${h.level === 3 ? 'pl-2 text-gray-500' : 'text-gray-600 font-medium'}`}>
                                    {h.text}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
                <div>
                    <h4 className="font-bold text-gray-900 mb-4 uppercase text-xs tracking-wider">Bài viết liên quan</h4>
                    <div className="space-y-4">
                        {relatedPosts.map(p => (
                            <Link to={`/blog/${p.slug}`} key={p.id} className="flex gap-3 group">
                                <div className="w-20 h-20 rounded-xl bg-gray-100 shrink-0 overflow-hidden">
                                    {p.coverImageUrl ? 
                                        <img src={p.coverImageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform" /> : 
                                        <div className="w-full h-full flex items-center justify-center text-xl">{p.iconEmoji}</div>
                                    }
                                </div>
                                <div className="flex-1 min-w-0 py-1">
                                    <h5 className="font-bold text-gray-800 text-sm line-clamp-2 leading-tight group-hover:text-primary transition-colors mb-1">{p.title}</h5>
                                    <span className="text-[10px] text-gray-400">{new Date(p.createdAt).toLocaleDateString('vi-VN')}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </aside>

      </div>

      <ShareModal 
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        url={window.location.href}
        title={post?.title}
      />
    </div>
  );
};
