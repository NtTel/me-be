import React, { useEffect, useState, useRef } from 'react';
// @ts-ignore
import { useParams, useNavigate, Link } from 'react-router-dom';
import { BlogPost, BlogComment, User } from '../types';
import { fetchPostBySlug, fetchRelatedPosts, fetchBlogComments, addBlogComment } from '../services/blog';
import { loginAnonymously } from '../services/auth';
import { 
  Loader2, ArrowLeft, Calendar, Share2, MessageCircle, Send, 
  ExternalLink, ShieldCheck, Check, Link as LinkIcon, ThumbsUp
} from 'lucide-react';
import { AuthModal } from '../components/AuthModal';
import { ShareModal } from '../components/ShareModal';

// --- CONSTANTS ---
const PAGE_SIZE = 5;

interface BlogCommentWithUI extends BlogComment {}

// Hàm lấy Youtube ID
const getYoutubeId = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// --- HOOK: SCROLL PROGRESS ---
const useScrollProgress = () => {
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
  const [isCopied, setIsCopied] = useState(false);

  const readingProgress = useScrollProgress();

  useEffect(() => {
    if (slug) {
        window.scrollTo(0, 0); 
        loadData(slug);
    }
  }, [slug]);

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

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="animate-spin text-primary" size={32} />
        <span className="text-sm text-gray-400 font-medium">Đang tải bài viết...</span>
      </div>
    </div>
  );
  
  if (!post) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
            <ExternalLink size={24}/>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Bài viết không tồn tại</h3>
        <p className="text-gray-500 mb-6">Có vẻ như bài viết này đã bị xóa hoặc đường dẫn không đúng.</p>
        <button onClick={() => navigate('/blog')} className="px-6 py-2 bg-black text-white rounded-full font-bold hover:bg-gray-800 transition-colors">
            Quay lại Blog
        </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-white animate-fade-in relative selection:bg-primary/20 selection:text-primary">
      
      {/* 1. PROGRESS BAR */}
      <div className="fixed top-0 left-0 h-1 bg-primary z-50 transition-all duration-100 ease-out shadow-[0_0_10px_rgba(37,169,156,0.5)]" style={{ width: `${readingProgress}%` }} />

      {/* 2. HEADER */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 transition-all supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
            <button 
                onClick={() => navigate('/blog')} 
                className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                title="Quay lại"
            >
                <ArrowLeft size={20} />
            </button>
            
            <div className="flex items-center gap-1">
                <button 
                    onClick={copyLink} 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                    title="Sao chép liên kết"
                >
                    {isCopied ? <Check size={18} className="text-green-500"/> : <LinkIcon size={18} />}
                </button>
                <button 
                    onClick={() => setShowShare(true)} 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                    title="Chia sẻ"
                >
                    <Share2 size={18} />
                </button>
            </div>
        </div>
      </div>

      {/* 3. MAIN ARTICLE */}
      <article className="max-w-[700px] mx-auto px-5 pt-8 md:pt-12 pb-16">
        
        {/* HERO */}
        <header className="mb-10 text-center md:text-left animate-slide-up">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-6">
                <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide border border-primary/10">
                    {post.iconEmoji} {post.categoryId || 'Blog'}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-gray-500 font-medium bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                    <Calendar size={12} /> {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                </span>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 mb-8 leading-[1.2] tracking-tight">
                {post.title}
            </h1>

            {/* Author */}
            <div className="flex items-center justify-center md:justify-start gap-4 p-4 rounded-2xl bg-gray-50/80 border border-gray-100/50 backdrop-blur-sm">
                <img src={post.authorAvatar || "https://cdn-icons-png.flaticon.com/512/3177/3177440.png"} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" alt="Author" />
                <div className="text-left">
                    <p className="font-bold text-gray-900 text-sm flex items-center gap-1">
                        {post.authorName} {post.authorIsExpert && <ShieldCheck size={16} className="text-blue-500 fill-blue-50" />}
                    </p>
                    <p className="text-xs text-gray-500 font-medium">Tác giả chuyên mục • {post.views || 0} lượt đọc</p>
                </div>
            </div>
        </header>

        {/* COVER IMAGE */}
        {post.coverImageUrl && (
            <figure className="w-full aspect-video md:aspect-[2/1] rounded-2xl overflow-hidden mb-12 shadow-sm bg-gray-100 animate-slide-up" style={{animationDelay: '0.1s'}}>
                <img src={post.coverImageUrl} className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000" alt={post.title} />
            </figure>
        )}

        {/* CONTENT BODY */}
        <div className="prose prose-lg md:prose-xl prose-slate max-w-none 
            prose-headings:font-bold prose-headings:text-gray-900 prose-headings:tracking-tight
            prose-p:text-gray-700 prose-p:leading-[1.8] md:prose-p:leading-[1.9]
            prose-a:text-primary prose-a:font-semibold prose-a:no-underline hover:prose-a:underline hover:prose-a:text-primary/80
            prose-img:rounded-2xl prose-img:shadow-sm prose-img:my-10
            prose-strong:font-bold prose-strong:text-gray-900
            prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-gray-50 prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:rounded-r-lg prose-blockquote:not-italic
            prose-li:text-gray-700
            mb-16 animate-slide-up" style={{animationDelay: '0.2s'}}>
            
            {/* Excerpt - Lead Paragraph */}
            <p className="lead text-xl md:text-2xl text-gray-600 font-normal mb-10 border-b border-gray-100 pb-10">
                {post.excerpt}
            </p>

            {/* Youtube Embed */}
            {post.youtubeUrl && (
                <div className="my-10 rounded-2xl overflow-hidden aspect-video bg-black shadow-lg">
                    <iframe 
                        src={`https://www.youtube.com/embed/${getYoutubeId(post.youtubeUrl)}`} 
                        className="w-full h-full border-none"
                        allowFullScreen
                    />
                </div>
            )}

            <div dangerouslySetInnerHTML={{ __html: post.content }} />
        </div>

        {/* SOURCE & TAGS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-6 border-t border-b border-gray-100 mb-16">
             {post.sourceUrl ? (
                <a href={post.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary transition-colors">
                    <ExternalLink size={16} /> Nguồn tham khảo
                </a>
             ) : <span></span>}
             
             <button onClick={() => setShowShare(true)} className="inline-flex items-center gap-2 text-sm font-bold text-gray-900 hover:text-primary transition-colors">
                <Share2 size={16} /> Chia sẻ bài viết
             </button>
        </div>

        {/* 4. RELATED POSTS */}
        {relatedPosts.length > 0 && (
            <section className="mb-20">
                <div className="flex items-center gap-3 mb-8">
                    <span className="w-1 h-6 bg-primary rounded-full"></span>
                    <h3 className="font-bold text-xl text-gray-900">Bài viết cùng chủ đề</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {relatedPosts.map(p => (
                        <Link to={`/blog/${p.slug}`} key={p.id} className="group cursor-pointer bg-gray-50 rounded-2xl p-4 transition-all hover:bg-white hover:shadow-lg border border-transparent hover:border-gray-100">
                            <div className="aspect-[3/2] rounded-xl bg-gray-200 overflow-hidden mb-4 relative">
                                {p.coverImageUrl ? (
                                    <img src={p.coverImageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-4xl bg-white">{p.iconEmoji}</div>
                                )}
                            </div>
                            <h4 className="font-bold text-gray-900 leading-snug group-hover:text-primary transition-colors mb-2">{p.title}</h4>
                            <p className="text-xs text-gray-500 line-clamp-2">{p.excerpt}</p>
                        </Link>
                    ))}
                </div>
            </section>
        )}
      </article>

      {/* 5. COMMENTS SECTION (Modern Style) */}
      <div className="bg-gray-50 border-t border-gray-100 py-16" id="comments">
        <div className="max-w-[700px] mx-auto px-5">
            <div className="flex items-center justify-between mb-8">
                <h3 className="font-bold text-2xl text-gray-900 flex items-center gap-3">
                    Bình luận <span className="text-lg font-medium text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-200">{post.commentCount || comments.length}</span>
                </h3>
            </div>

            {/* Input Box */}
            <div className="bg-white p-2 rounded-3xl border border-gray-200 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all mb-12">
                <textarea 
                    value={commentContent}
                    onChange={e => setCommentContent(e.target.value)}
                    className="w-full bg-transparent border-none rounded-2xl px-4 py-3 focus:ring-0 resize-none text-base min-h-[80px] placeholder-gray-400"
                    placeholder="Chia sẻ suy nghĩ hoặc câu hỏi của bạn..."
                />
                <div className="flex justify-between items-center px-2 pb-2 mt-2">
                    <span className="text-xs text-gray-400 font-medium pl-2">
                        {currentUser.isGuest ? 'Đang ẩn danh' : currentUser.name}
                    </span>
                    <button 
                        onClick={handleSendComment}
                        disabled={!commentContent.trim() || submittingComment}
                        className="bg-gray-900 text-white px-5 py-2 rounded-xl text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black transition-colors flex items-center gap-2"
                    >
                        {submittingComment ? <Loader2 className="animate-spin" size={16} /> : <>Gửi <Send size={14}/></>}
                    </button>
                </div>
            </div>

            {/* Comment List */}
            <div className="space-y-8">
                {comments.map(c => (
                    <div key={c.id} className="group animate-fade-in">
                        <div className="flex gap-4">
                            <div className="shrink-0">
                                <img src={c.authorAvatar} className="w-10 h-10 rounded-full bg-gray-200 object-cover border border-white shadow-sm" alt="avatar" />
                            </div>
                            <div className="flex-1">
                                <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-sm text-gray-900">{c.authorName}</span>
                                            {c.isExpert && <ShieldCheck size={14} className="text-blue-500" />}
                                        </div>
                                        <span className="text-[10px] text-gray-400">{new Date(c.createdAt).toLocaleDateString('vi-VN')}</span>
                                    </div>
                                    <div className="text-gray-700 leading-relaxed text-[15px] whitespace-pre-wrap">
                                        {c.content}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 mt-2 ml-2">
                                    <button className="text-xs font-bold text-gray-400 hover:text-gray-600 flex items-center gap-1">
                                        <ThumbsUp size={12} /> Thích
                                    </button>
                                    <button className="text-xs font-bold text-gray-400 hover:text-gray-600">
                                        Phản hồi
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {hasMore && (
                    <button
                        onClick={handleLoadMore}
                        disabled={isFetchingMore}
                        className="w-full py-3 mt-6 text-sm font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                        {isFetchingMore ? <Loader2 className="animate-spin" size={16} /> : <ChevronDown size={16}/>}
                        Xem thêm bình luận cũ hơn
                    </button>
                )}
                
                {comments.length === 0 && (
                    <div className="text-center py-10">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                            <MessageCircle size={24} />
                        </div>
                        <p className="text-gray-500 text-sm">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                    </div>
                )}
            </div>
        </div>
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
