import React, { useState, useMemo, useEffect } from 'react';
// @ts-ignore
import { Link } from 'react-router-dom';
import { Search, MessageCircle, Heart, ChevronDown, ChevronUp, HelpCircle, Clock, Flame, MessageSquareOff, ShieldCheck, ChevronRight, Sparkles, X, Filter, User as UserIcon, CornerDownRight, BookOpen, FileText, Download, LayoutGrid } from 'lucide-react';
import { Question, User, toSlug, BlogPost, Document } from '../types';
import { AdBanner } from '../components/AdBanner';
import { subscribeToAdConfig } from '../services/ads';
import { fetchPublishedPosts } from '../services/blog';
import { fetchDocuments } from '../services/documents';

interface HomeProps {
  questions: Question[];
  categories: string[];
}

const PAGE_SIZE = 20;

// --- GIỮ NGUYÊN COMPONENT ẢNH ---
const FBImageGrid: React.FC<{ images: string[] }> = ({ images }) => {
  if (!images || images.length === 0) return null;
  const count = images.length;
  // ... (Giữ nguyên logic render ảnh cũ của bạn để tiết kiệm diện tích hiển thị ở đây)
  if (count === 1) return <div className="mt-3 rounded-xl overflow-hidden border border-gray-100 bg-gray-50"><img src={images[0]} className="w-full h-64 object-cover" loading="lazy" /></div>;
  if (count === 2) return <div className="mt-3 grid grid-cols-2 gap-1 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 h-64"><img src={images[0]} className="w-full h-full object-cover" loading="lazy" /><img src={images[1]} className="w-full h-full object-cover" loading="lazy" /></div>;
  if (count === 3) return <div className="mt-3 grid grid-cols-2 gap-1 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 h-64"><img src={images[0]} className="w-full h-full object-cover row-span-2" loading="lazy" /><div className="grid grid-rows-2 gap-1 h-full"><img src={images[1]} className="w-full h-full object-cover" loading="lazy" /><img src={images[2]} className="w-full h-full object-cover" loading="lazy" /></div></div>;
  return <div className="mt-3 grid grid-cols-2 gap-1 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 h-64"><img src={images[0]} className="w-full h-full object-cover" loading="lazy" /><div className="grid grid-rows-2 gap-1 h-full"><img src={images[1]} className="w-full h-full object-cover" loading="lazy" /><div className="relative w-full h-full"><img src={images[2]} className="w-full h-full object-cover" loading="lazy" />{count > 3 && (<div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-bold text-xl backdrop-blur-[2px]">+{count - 3}</div>)}</div></div></div>;
};

// --- COMPONENT TAB TÌM KIẾM (MỚI) ---
const SearchTabs = ({ activeTab, onChange, counts }: { activeTab: string, onChange: (t: string) => void, counts: any }) => {
  const tabs = [
    { id: 'all', label: 'Tất cả', icon: LayoutGrid },
    { id: 'questions', label: 'Câu hỏi', icon: HelpCircle, count: counts.questions },
    { id: 'blogs', label: 'Bài viết', icon: BookOpen, count: counts.blogs },
    { id: 'docs', label: 'Tài liệu', icon: FileText, count: counts.docs },
    { id: 'users', label: 'Mọi người', icon: UserIcon, count: counts.users },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 md:px-0 mb-4 border-b border-gray-100 pb-2">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
            activeTab === tab.id 
              ? 'bg-textDark text-white shadow-md' 
              : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'
          }`}
        >
          <tab.icon size={14} />
          {tab.label}
          {tab.count > 0 && <span className="ml-1 opacity-80 text-[10px] bg-white/20 px-1.5 rounded-full">{tab.count}</span>}
        </button>
      ))}
    </div>
  );
};

export const Home: React.FC<HomeProps> = ({ questions, categories }) => {
  // State cơ bản
  const [activeCategory, setActiveCategory] = useState<string>('Tất cả');
  const [viewFilter, setViewFilter] = useState<'newest' | 'active' | 'unanswered'>('newest');
  const [adFrequency, setAdFrequency] = useState(5);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  
  // State Search & Data
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTab, setSearchTab] = useState('all'); // State cho tab tìm kiếm
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);

  useEffect(() => {
      const unsub = subscribeToAdConfig(config => setAdFrequency(config.frequency));
      
      // Load data ban đầu (Nên load nhiều hơn nếu muốn search client-side tốt, hoặc search API)
      Promise.all([
          fetchPublishedPosts('all', 50), // Load nhiều hơn để search client-side
          fetchDocuments('all', 50)
      ]).then(([blogs, docs]) => {
          if (blogs) setBlogPosts(blogs);
          if (docs) setDocuments(docs);
      });

      return () => unsub();
  }, []);

  // Reset pagination khi filter thay đổi
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeCategory, viewFilter, searchQuery, searchTab]);

  // --- LOGIC TÌM KIẾM TẬP TRUNG (USEMEMO) ---
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return { questions: [], blogs: [], docs: [], users: [] };

    const query = searchQuery.toLowerCase().trim();

    // 1. Filter Questions & Answers
    const matchedQuestions = questions.filter(q => {
      const matchMain = q.title.toLowerCase().includes(query) || q.content.toLowerCase().includes(query);
      const matchAuthor = q.author.name.toLowerCase().includes(query);
      const matchAnswers = q.answers.some(a => 
        a.content.toLowerCase().includes(query) || a.author.name.toLowerCase().includes(query)
      );
      return matchMain || matchAuthor || matchAnswers;
    });

    // 2. Filter Blogs
    const matchedBlogs = blogPosts.filter(p => 
       p.title.toLowerCase().includes(query) || 
       p.excerpt?.toLowerCase().includes(query) ||
       p.authorName.toLowerCase().includes(query)
    );

    // 3. Filter Documents
    const matchedDocs = documents.filter(d => 
       d.title.toLowerCase().includes(query) ||
       d.authorName.toLowerCase().includes(query)
    );

    // 4. Filter Users (Logic cũ đưa vào đây)
    const usersMap = new Map<string, User>();
    questions.forEach(q => {
        if (q.author.name.toLowerCase().includes(query)) usersMap.set(q.author.id, q.author);
        q.answers.forEach(a => {
            if (a.author.name.toLowerCase().includes(query)) usersMap.set(a.author.id, a.author);
        });
    });
    const matchedUsers = Array.from(usersMap.values());

    return {
      questions: matchedQuestions,
      blogs: matchedBlogs,
      docs: matchedDocs,
      users: matchedUsers
    };
  }, [searchQuery, questions, blogPosts, documents]);

  // --- LOGIC HIỂN THỊ CHÍNH ---
  // Nếu KHÔNG tìm kiếm -> Dùng logic cũ (theo Category & Filter)
  // Nếu CÓ tìm kiếm -> Dùng searchResults
  let displayList = [...questions];
  
  if (!searchQuery) {
      if (activeCategory !== 'Tất cả') {
          displayList = displayList.filter(q => q.category === activeCategory);
      }
      switch (viewFilter) {
        case 'newest': displayList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
        case 'active': displayList.sort((a, b) => (b.answers.length * 2 + b.likes) - (a.answers.length * 2 + a.likes)); break;
        case 'unanswered': 
            displayList = displayList.filter(q => q.answers.length === 0); 
            displayList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            break;
      }
  } else {
      // Đang tìm kiếm: Lấy list câu hỏi từ kết quả tìm kiếm
      displayList = searchResults.questions; 
      // Sort theo độ liên quan hoặc ngày (tạm thời để ngày)
      displayList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const paginatedList = displayList.slice(0, visibleCount);

  // --- RENDER HELPERS ---
  const renderUserCard = (user: User) => (
    <Link to={`/profile/${user.username || user.id}`} key={user.id} className="flex-shrink-0 bg-white p-3 pr-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3 min-w-[160px] active:scale-95 transition-transform hover:border-blue-200">
        <div className="relative">
          <img src={user.avatar} className="w-10 h-10 rounded-full object-cover border border-gray-100" />
          {user.isExpert && <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-0.5 border border-white"><ShieldCheck size={10} /></div>}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-textDark truncate max-w-[100px]">{user.name}</span>
          <span className="text-[10px] text-primary font-medium">Xem trang</span>
        </div>
    </Link>
  );

  const renderBlogCard = (post: BlogPost) => (
     <Link to={`/blog/${post.slug}`} key={post.id} className="flex gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all active:scale-[0.99]">
        <div className="w-24 h-24 rounded-xl bg-gray-100 shrink-0 overflow-hidden">
            {post.coverImageUrl ? <img src={post.coverImageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-3xl">{post.iconEmoji || '📝'}</div>}
        </div>
        <div className="flex-1 min-w-0">
            <h4 className="font-bold text-textDark line-clamp-2 mb-1">{post.title}</h4>
            <p className="text-xs text-textGray line-clamp-2 mb-2">{post.excerpt}</p>
            <div className="flex items-center gap-2 text-[10px] text-gray-400">
                <span>{post.authorName}</span> • <span>{new Date(post.createdAt).toLocaleDateString('vi-VN')}</span>
            </div>
        </div>
     </Link>
  );

  const renderDocCard = (doc: Document) => (
    <Link to={`/documents/${doc.slug}`} key={doc.id} className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm active:scale-[0.98] transition-transform group hover:border-green-200">
        <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-2xl shrink-0">
            {doc.fileType === 'pdf' ? '📕' : doc.fileType === 'image' ? '🖼️' : '📄'}
        </div>
        <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm text-textDark line-clamp-1 group-hover:text-green-600">{doc.title}</h4>
            <p className="text-[10px] text-gray-400 line-clamp-1 flex items-center gap-2">
                <span>{doc.authorName}</span> • <span className="flex items-center gap-0.5"><Download size={10}/> {doc.downloads}</span>
            </p>
        </div>
    </Link>
  );

  return (
    <div className="space-y-4 animate-fade-in min-h-screen">
      
      {/* --- SEARCH BAR (STICKY) --- */}
      <div className="px-4 md:px-0 sticky top-[68px] md:top-20 z-30 py-2 md:pt-0 -mx-4 md:mx-0 bg-[#F7F7F5]/95 md:bg-transparent backdrop-blur-sm transition-all">
        <div className="relative group shadow-[0_4px_20px_rgba(0,0,0,0.05)] rounded-2xl mx-4 md:mx-0">
            <div className="absolute inset-0 bg-white/80 backdrop-blur-xl rounded-2xl"></div>
            <div className={`relative flex items-center bg-white/90 rounded-2xl border transition-all overflow-hidden ${searchQuery ? 'border-primary ring-2 ring-primary/10' : 'border-gray-100 focus-within:ring-2 focus-within:ring-primary/20'}`}>
                <div className="pl-4 text-primary"><Search size={20} /></div>
                <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm câu hỏi, chuyên gia, tài liệu..." 
                    className="w-full py-3.5 px-3 bg-transparent text-textDark placeholder-gray-400 focus:outline-none text-[15px] font-medium"
                />
                {searchQuery && (
                    <button onClick={() => { setSearchQuery(''); setSearchTab('all'); }} className="pr-4 text-gray-400 hover:text-textDark">
                        <X size={16} />
                    </button>
                )}
            </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* LOGIC RENDER GIAO DIỆN CHÍNH            */}
      {/* ========================================================= */}

      {/* --- TRƯỜNG HỢP 1: ĐANG TÌM KIẾM (SEARCH MODE) --- */}
      {searchQuery ? (
         <div className="animate-slide-up space-y-4">
             {/* 1. Tabs chuyển đổi */}
             <SearchTabs 
                activeTab={searchTab} 
                onChange={setSearchTab} 
                counts={{
                    questions: searchResults.questions.length,
                    blogs: searchResults.blogs.length,
                    docs: searchResults.docs.length,
                    users: searchResults.users.length
                }}
             />

             <div className="px-4 md:px-0 space-y-4 pb-20">
                {/* 2. Render nội dung theo Tab */}
                
                {/* TAB: MỌI NGƯỜI */}
                {(searchTab === 'all' || searchTab === 'users') && searchResults.users.length > 0 && (
                    <div className="mb-6">
                        {searchTab === 'all' && <h3 className="font-bold text-sm text-textGray uppercase mb-3 flex items-center gap-2"><UserIcon size={14}/> Mọi người phù hợp</h3>}
                        <div className={searchTab === 'all' ? "flex gap-3 overflow-x-auto no-scrollbar pb-2" : "grid grid-cols-1 md:grid-cols-2 gap-3"}>
                            {searchResults.users.map(renderUserCard)}
                        </div>
                    </div>
                )}

                {/* TAB: BÀI VIẾT BLOG */}
                {(searchTab === 'all' || searchTab === 'blogs') && searchResults.blogs.length > 0 && (
                    <div className="mb-6">
                        {searchTab === 'all' && <h3 className="font-bold text-sm text-textGray uppercase mb-3 flex items-center gap-2"><BookOpen size={14}/> Bài viết chuyên gia</h3>}
                        <div className="grid grid-cols-1 gap-3">
                             {searchResults.blogs.slice(0, searchTab === 'all' ? 3 : undefined).map(renderBlogCard)}
                        </div>
                        {searchTab === 'all' && searchResults.blogs.length > 3 && (
                             <button onClick={() => setSearchTab('blogs')} className="w-full py-2 text-xs font-bold text-blue-500 bg-blue-50 rounded-xl mt-2">Xem thêm {searchResults.blogs.length - 3} bài viết</button>
                        )}
                    </div>
                )}

                 {/* TAB: TÀI LIỆU */}
                 {(searchTab === 'all' || searchTab === 'docs') && searchResults.docs.length > 0 && (
                    <div className="mb-6">
                        {searchTab === 'all' && <h3 className="font-bold text-sm text-textGray uppercase mb-3 flex items-center gap-2"><FileText size={14}/> Tài liệu</h3>}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                             {searchResults.docs.slice(0, searchTab === 'all' ? 4 : undefined).map(renderDocCard)}
                        </div>
                    </div>
                )}

                {/* TAB: CÂU HỎI (Main Feed trong Search) */}
                {(searchTab === 'all' || searchTab === 'questions') && (
                    <div>
                         {searchTab === 'all' && searchResults.questions.length > 0 && <h3 className="font-bold text-sm text-textGray uppercase mb-3 flex items-center gap-2"><MessageCircle size={14}/> Thảo luận cộng đồng</h3>}
                         
                         {searchResults.questions.length === 0 && searchTab === 'questions' ? (
                             <div className="text-center py-10">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400"><Search size={24}/></div>
                                <p className="text-gray-500">Không tìm thấy câu hỏi nào.</p>
                             </div>
                         ) : (
                             <div className="space-y-4">
                                {paginatedList.map(q => {
                                    // Highlight comment match logic
                                    const query = searchQuery.toLowerCase().trim();
                                    const matchedAnswer = q.answers.find(a => a.content.toLowerCase().includes(query) || a.author.name.toLowerCase().includes(query));
                                    
                                    return (
                                        <Link to={`/question/${toSlug(q.title, q.id)}`} key={q.id} className="block group">
                                            <div className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-gray-100 hover:border-primary/30 transition-all relative">
                                                <h3 className="text-[16px] font-bold text-textDark mb-2 leading-snug">
                                                    {/* Có thể thêm Highlighting text ở đây nếu cần */}
                                                    {q.title}
                                                </h3>
                                                <p className="text-textGray text-sm line-clamp-2 mb-3">{q.content}</p>
                                                
                                                {/* Hiển thị đoạn match comment */}
                                                {matchedAnswer && (
                                                    <div className="bg-orange-50 rounded-xl p-3 mb-3 flex gap-2 border border-orange-100">
                                                        <CornerDownRight size={16} className="text-orange-400 shrink-0 mt-0.5" />
                                                        <div>
                                                            <p className="text-xs font-bold text-textDark mb-0.5">{matchedAnswer.author.name} <span className="font-normal text-gray-500">đã bình luận:</span></p>
                                                            <p className="text-xs text-textGray italic">"...{matchedAnswer.content}..."</p>
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                <div className="flex items-center gap-3 text-xs text-gray-400">
                                                    <img src={q.author.avatar} className="w-5 h-5 rounded-full" />
                                                    <span>{q.author.name}</span>
                                                    <span>• {new Date(q.createdAt).toLocaleDateString('vi-VN')}</span>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                             </div>
                         )}
                    </div>
                )}
                
                {/* Empty State Chung */}
                {Object.values(searchResults).every(arr => arr.length === 0) && (
                    <div className="text-center py-12">
                         <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-300">
                           <Search size={32} strokeWidth={1.5} />
                         </div>
                         <p className="text-sm text-textGray font-medium">Không tìm thấy kết quả nào cho "{searchQuery}"</p>
                    </div>
                )}
             </div>
         </div>
      ) : (
      /* --- TRƯỜNG HỢP 2: GIAO DIỆN TRANG CHỦ BÌNH THƯỜNG (FEED) --- */
      /* Giữ nguyên logic render cũ nhưng bọc trong Fragment này */
      <div className="space-y-4">
           {/* EXPERT PROMO */}
           <div className="bg-gradient-to-br from-primary to-[#26A69A] rounded-3xl p-6 text-white shadow-xl shadow-primary/20 relative overflow-hidden mx-4 md:mx-0">
                {/* ... (Giữ nguyên code Banner cũ) ... */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative z-10 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold mb-1">Góc Chuyên Gia</h2>
                        <p className="text-blue-50 text-xs font-medium opacity-90 mb-3">Chia sẻ kinh nghiệm: Góp phần tạo ra thay đổi tích cực cho cộng đồng.</p>
                        <Link to="/expert-register" className="inline-flex items-center gap-1 bg-white/20 hover:bg-white/30 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 border border-white/20">
                            Đăng ký ngay <ChevronRight size={14} />
                        </Link>
                    </div>
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl shadow-inner border border-white/10">👨‍⚕️</div>
                </div>
           </div>

           {/* BLOG CARDS (HORIZONTAL) */}
           {blogPosts.length > 0 && (
                <div className="space-y-3 pt-2 px-4 md:px-0">
                    <div className="flex justify-between items-center px-1">
                        <div className="flex items-center gap-2"><BookOpen size={18} className="text-blue-600" /><h3 className="font-bold text-textDark text-sm uppercase tracking-wide">Kiến thức Chuyên gia</h3></div>
                        <Link to="/blog" className="text-xs font-bold text-blue-500 hover:underline">Xem tất cả</Link>
                    </div>
                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 pr-4 snap-x -mx-4 px-4 md:mx-0 md:px-0">
                        {blogPosts.slice(0, 5).map(post => (
                            <Link to={`/blog/${post.slug}`} key={post.id} className="snap-start flex-shrink-0 w-64 bg-white rounded-2xl p-3 border border-gray-100 shadow-sm hover:shadow-md transition-all active:scale-95 flex flex-col">
                                <div className="aspect-[2/1] rounded-xl bg-gray-100 mb-3 overflow-hidden relative shrink-0">
                                    {post.coverImageUrl ? <img src={post.coverImageUrl} className="w-full h-full object-cover" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center text-3xl bg-gradient-to-br from-blue-50 to-purple-50">{post.iconEmoji || '📝'}</div>}
                                </div>
                                <h4 className="font-bold text-sm text-textDark line-clamp-2 mb-1 leading-snug flex-1">{post.title}</h4>
                                <div className="flex items-center gap-1 mt-auto pt-2"><span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 line-clamp-1 max-w-[100px]">{post.authorName}</span><span className="text-[10px] text-gray-300">•</span><span className="text-[10px] text-gray-400">{new Date(post.createdAt).toLocaleDateString('vi-VN')}</span></div>
                            </Link>
                        ))}
                    </div>
                </div>
           )}

           {/* DOCUMENTS CARDS (HORIZONTAL) */}
           {documents.length > 0 && (
                <div className="space-y-3 pt-2 px-4 md:px-0">
                     <div className="flex justify-between items-center px-1">
                        <div className="flex items-center gap-2"><FileText size={18} className="text-green-600" /><h3 className="font-bold text-textDark text-sm uppercase tracking-wide">Tài liệu chia sẻ</h3></div>
                        <Link to="/documents" className="text-xs font-bold text-green-500 hover:underline">Xem tất cả</Link>
                    </div>
                    <div className="space-y-3">
                        {documents.slice(0, 3).map(renderDocCard)}
                    </div>
                </div>
           )}

           {/* CATEGORY FILTER */}
           <div className="pl-4 md:px-0 mt-6">
                <div className="flex items-center gap-1 mb-2">
                    <Sparkles size={14} className="text-accent" fill="currentColor" />
                    <span className="text-xs font-bold text-textGray uppercase tracking-wider">Chủ đề</span>
                </div>
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 pr-4 snap-x">
                    <button onClick={() => setActiveCategory('Tất cả')} className={`snap-start flex-shrink-0 px-5 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all active:scale-95 ${activeCategory === 'Tất cả' ? 'bg-textDark text-white shadow-lg shadow-gray-200' : 'bg-white text-textGray border border-gray-100 shadow-sm'}`}>Tất cả</button>
                    {categories.map(cat => (
                        <button key={cat} onClick={() => setActiveCategory(cat)} className={`snap-start flex-shrink-0 px-5 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all active:scale-95 ${activeCategory === cat ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white text-textGray border border-gray-100 shadow-sm'}`}>{cat}</button>
                    ))}
                </div>
           </div>

           {/* MAIN QUESTION FEED */}
           <div className="px-4 md:px-0 flex items-center justify-between mt-2">
                <h3 className="font-bold text-lg text-textDark">Cộng đồng hỏi đáp</h3>
                <div className="flex bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
                    <button onClick={() => setViewFilter('newest')} className={`p-1.5 rounded-lg transition-all ${viewFilter === 'newest' ? 'bg-gray-100 text-textDark' : 'text-gray-400'}`}><Clock size={16} /></button>
                    <button onClick={() => setViewFilter('active')} className={`p-1.5 rounded-lg transition-all ${viewFilter === 'active' ? 'bg-orange-50 text-orange-500' : 'text-gray-400'}`}><Flame size={16} /></button>
                    <button onClick={() => setViewFilter('unanswered')} className={`p-1.5 rounded-lg transition-all ${viewFilter === 'unanswered' ? 'bg-blue-50 text-blue-500' : 'text-gray-400'}`}><MessageSquareOff size={16} /></button>
                </div>
           </div>

           <div className="px-4 md:px-0 space-y-4 pb-10">
              {/* RENDER FEED CÂU HỎI NHƯ CŨ */}
              {paginatedList.map((q, index) => (
                  <React.Fragment key={q.id}>
                    {(index > 0 && index % adFrequency === 0) && <AdBanner className="mx-4 md:mx-0" debugLabel={`Feed Ad #${index}`} />}
                    <Link to={`/question/${toSlug(q.title, q.id)}`} className="block group">
                        <div className="bg-white p-5 rounded-[1.5rem] shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-gray-100 active:scale-[0.98] transition-all relative overflow-hidden">
                            {q.answers.length === 0 && <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-orange-100 to-transparent rounded-bl-full -mr-8 -mt-8"></div>}
                            <div className="flex items-start justify-between mb-3 relative z-10">
                                <div className="flex items-center gap-2">
                                    <img src={q.author.avatar} className="w-8 h-8 rounded-full border border-gray-100 object-cover" />
                                    <div>
                                        <p className="text-xs font-bold text-textDark flex items-center gap-1">{q.author.name} {q.author.isExpert && <ShieldCheck size={10} className="text-blue-500" />}</p>
                                        <p className="text-[10px] text-gray-400">{new Date(q.createdAt).toLocaleDateString('vi-VN')}</p>
                                    </div>
                                </div>
                                <span className="bg-gray-50 text-textGray text-[10px] font-bold px-2 py-1 rounded-lg border border-gray-100">{q.category}</span>
                            </div>
                            <h3 className="text-[16px] font-bold text-textDark mb-2 leading-snug line-clamp-2">{q.title}</h3>
                            <p className="text-textGray text-sm line-clamp-2 mb-3 font-normal">{q.content}</p>
                            <FBImageGrid images={q.images || []} />
                            
                            <div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-3">
                                <div className="flex items-center gap-4 text-xs font-bold text-gray-400">
                                    <span className="flex items-center gap-1.5"><Heart size={14} className={q.likes > 0 ? "text-red-500 fill-red-500" : ""} /> {q.likes}</span>
                                    <span className="flex items-center gap-1.5"><MessageCircle size={14} className={q.answers.length > 0 ? "text-blue-500 fill-blue-500" : ""} /> {q.answers.length}</span>
                                </div>
                                {q.answers.length === 0 && <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded-full">Chưa có trả lời</span>}
                            </div>
                        </div>
                    </Link>
                  </React.Fragment>
              ))}
              
              {paginatedList.length < displayList.length && (
                 <div className="flex justify-center pt-2">
                    <button onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)} className="px-6 py-2.5 rounded-full bg-white border border-gray-200 text-sm font-bold text-textDark shadow-sm hover:bg-gray-50 active:scale-95 transition-all">Xem thêm câu hỏi</button>
                 </div>
              )}
           </div>
      </div>
      )}
    </div>
  );
};
