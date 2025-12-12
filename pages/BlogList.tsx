import React, { useEffect, useState } from 'react';
// @ts-ignore
import { Link, useNavigate } from 'react-router-dom';
import { BlogPost, BlogCategory, User } from '../types';
import { fetchBlogCategories, fetchPublishedPosts } from '../services/blog';
import { subscribeToAuthChanges } from '../services/auth';
import { Loader2, BookOpen, Clock, ChevronRight, PenTool, Search, X, ArrowDown, Sparkles, AlertCircle } from 'lucide-react';

const PAGE_SIZE = 9; 

// --- COMPONENT: SKELETON LOADER (Hiệu ứng tải trang đẹp) ---
const BlogSkeleton = () => (
  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div key={i} className="bg-white rounded-[1.5rem] overflow-hidden border border-gray-100 shadow-sm h-96 flex flex-col">
        <div className="aspect-video bg-gray-200 animate-pulse" />
        <div className="p-5 flex-1 flex flex-col gap-3">
            <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
            <div className="h-6 bg-gray-200 rounded w-full animate-pulse" />
            <div className="h-6 bg-gray-200 rounded w-2/3 animate-pulse" />
            <div className="mt-auto flex gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
                <div className="w-20 h-4 bg-gray-200 rounded mt-2 animate-pulse" />
            </div>
        </div>
      </div>
    ))}
  </div>
);

export const BlogList: React.FC = () => {
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [activeCat, setActiveCat] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = subscribeToAuthChanges(user => setCurrentUser(user));
    const init = async () => {
      setLoading(true);
      const [catsData, postsData] = await Promise.all([
        fetchBlogCategories(),
        fetchPublishedPosts('all', 100) 
      ]);
      setCategories(catsData);
      setPosts(postsData);
      setLoading(false);
    };
    init();
    return () => unsub();
  }, []);

  const handleFilter = async (catId: string) => {
    setActiveCat(catId);
    setLoading(true);
    setVisibleCount(PAGE_SIZE);
    setSearchTerm(''); 
    const data = await fetchPublishedPosts(catId, 100);
    setPosts(data);
    setLoading(false);
  };

  const isExpertOrAdmin = currentUser && (currentUser.isExpert || currentUser.isAdmin);

  // LOGIC LỌC
  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (post.excerpt && post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // LOGIC TÁCH BÀI HERO (BÀI NỔI BẬT)
  // Chỉ hiện bài Hero khi: Ở trang 1 + Không đang search + Có dữ liệu
  const showHero = !searchTerm && filteredPosts.length > 0;
  const heroPost = showHero ? filteredPosts[0] : null;
  
  // Danh sách bài còn lại (Nếu có Hero thì bỏ bài đầu tiên ra, không thì lấy hết)
  const remainingPosts = showHero ? filteredPosts.slice(1) : filteredPosts;
  const visibleGridPosts = remainingPosts.slice(0, visibleCount);

  return (
    <div className="min-h-screen bg-[#F7F7F5] pb-24 animate-fade-in pt-safe-top">
      
      {/* HEADER WITH GRADIENT ACCENT */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-[68px] md:top-20 z-30 transition-all">
         {/* Decoration Gradient Line */}
         <div className="h-1 w-full bg-gradient-to-r from-primary via-blue-400 to-purple-500"></div>
         
         <div className="max-w-5xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 flex items-center gap-2 tracking-tight">
                        <BookOpen className="text-primary fill-primary/10" strokeWidth={2.5} /> 
                        Góc Chuyên Gia
                    </h1>
                </div>
                
                {isExpertOrAdmin && (
                    <button 
                        onClick={() => navigate('/admin/blog')}
                        className="bg-gray-900 text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg active:scale-95 transition-transform hover:bg-gray-800"
                    >
                        <PenTool size={16} /> <span className="hidden md:inline">Viết bài</span>
                    </button>
                )}
            </div>

            {/* SEARCH & FILTER BAR */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                {/* Search Input */}
                <div className="relative w-full md:w-auto md:flex-1 max-w-md group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                    <input 
                      value={searchTerm} 
                      onChange={e => setSearchTerm(e.target.value)} 
                      placeholder="Tìm kiếm kiến thức..." 
                      className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all font-medium text-sm"
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1">
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* Categories Scroll */}
                <div className="flex-1 w-full overflow-x-auto no-scrollbar pb-1">
                    <div className="flex gap-2">
                        <button 
                            onClick={() => handleFilter('all')}
                            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${activeCat === 'all' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
                        >
                            Tất cả
                        </button>
                        {categories.map(cat => (
                            <button 
                                key={cat.id}
                                onClick={() => handleFilter(cat.id)}
                                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 ${activeCat === cat.id ? 'bg-white text-primary border-primary shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
                            >
                                <span>{cat.iconEmoji}</span> {cat.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
         </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
         {loading ? (
             <BlogSkeleton />
         ) : filteredPosts.length === 0 ? (
             /* EMPTY STATE */
             <div className="flex flex-col items-center justify-center py-24 text-center">
                 <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-300">
                     <AlertCircle size={40} />
                 </div>
                 <h3 className="text-lg font-bold text-gray-900">Không tìm thấy bài viết</h3>
                 <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">
                     {searchTerm ? `Chúng tôi không tìm thấy kết quả nào cho "${searchTerm}".` : 'Chưa có bài viết nào trong chủ đề này.'}
                 </p>
                 {searchTerm && (
                     <button onClick={() => setSearchTerm('')} className="mt-4 text-primary font-bold text-sm hover:underline">Xóa bộ lọc tìm kiếm</button>
                 )}
             </div>
         ) : (
             <>
                 {/* --- HERO POST (FEATURED) --- */}
                 {heroPost && (
                    <div className="mb-8 animate-slide-up">
                        <Link to={`/blog/${heroPost.slug}`} className="group block relative rounded-[2rem] overflow-hidden shadow-lg hover:shadow-2xl transition-all">
                             <div className="aspect-[2/1] md:aspect-[21/9] bg-gray-200 w-full relative">
                                 {heroPost.coverImageUrl ? (
                                    <img src={heroPost.coverImageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy"/>
                                 ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600 text-white text-6xl">
                                        {heroPost.iconEmoji}
                                    </div>
                                 )}
                                 {/* Gradient Overlay */}
                                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                                 
                                 {/* Content Overlay */}
                                 <div className="absolute bottom-0 left-0 p-6 md:p-10 w-full md:w-3/4">
                                     <span className="inline-flex items-center gap-1 bg-primary text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider mb-3 shadow-md">
                                        <Sparkles size={10} /> Mới nhất
                                     </span>
                                     <h2 className="text-2xl md:text-4xl font-black text-white leading-tight mb-3 drop-shadow-sm group-hover:text-blue-100 transition-colors">
                                         {heroPost.title}
                                     </h2>
                                     <p className="text-gray-200 text-sm md:text-base line-clamp-2 mb-4 font-medium hidden md:block opacity-90">
                                         {heroPost.excerpt}
                                     </p>
                                     <div className="flex items-center gap-3 text-white/80 text-xs font-bold">
                                         <img src={heroPost.authorAvatar} className="w-8 h-8 rounded-full border-2 border-white/30" />
                                         <span>{heroPost.authorName}</span>
                                         <span>•</span>
                                         <span>{new Date(heroPost.createdAt).toLocaleDateString('vi-VN')}</span>
                                     </div>
                                 </div>
                             </div>
                        </Link>
                    </div>
                 )}

                 {/* --- GRID POSTS --- */}
                 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                     {visibleGridPosts.map(post => (
                         <Link to={`/blog/${post.slug}`} key={post.id} className="group bg-white rounded-[1.5rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 flex flex-col h-full">
                             <div className="aspect-video bg-gray-100 relative overflow-hidden shrink-0">
                                 {post.coverImageUrl ? (
                                     <img src={post.coverImageUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                                 ) : (
                                     <div className="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-gray-50 to-gray-100">
                                         {post.iconEmoji || '📝'}
                                     </div>
                                 )}
                                 <div className="absolute top-3 left-3">
                                     <span className="bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider text-textDark shadow-sm border border-gray-100">
                                         {categories.find(c => c.id === post.categoryId)?.name || 'Blog'}
                                     </span>
                                 </div>
                             </div>
                             <div className="p-5 flex flex-col flex-1">
                                 <h2 className="font-bold text-lg text-gray-900 mb-2 leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                                     {post.title}
                                 </h2>
                                 <p className="text-sm text-gray-500 line-clamp-2 mb-4 font-normal flex-1">
                                     {post.excerpt}
                                 </p>
                                 <div className="flex items-center justify-between border-t border-gray-50 pt-4 mt-auto">
                                     <div className="flex items-center gap-2">
                                         <img src={post.authorAvatar || "https://cdn-icons-png.flaticon.com/512/3177/3177440.png"} className="w-6 h-6 rounded-full object-cover bg-gray-100" />
                                         <span className="text-xs font-bold text-gray-700 truncate max-w-[100px]">{post.authorName}</span>
                                     </div>
                                     <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium bg-gray-50 px-2 py-1 rounded-full">
                                         <Clock size={10} /> {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                                     </div>
                                 </div>
                             </div>
                         </Link>
                     ))}
                 </div>

                 {/* LOAD MORE BUTTON */}
                 {visibleGridPosts.length < remainingPosts.length && (
                    <div className="flex justify-center mt-12 pb-8">
                        <button
                            onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}
                            className="px-8 py-3 rounded-full bg-white border border-gray-200 text-sm font-bold text-gray-900 shadow-sm hover:bg-gray-50 active:scale-95 transition-all flex items-center gap-2 group"
                        >
                            Xem thêm bài viết <ArrowDown size={16} className="group-hover:translate-y-1 transition-transform" />
                        </button>
                    </div>
                 )}
             </>
         )}
      </div>
    </div>
  );
};
