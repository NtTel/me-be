 import React, { useEffect, useState } from 'react';
// @ts-ignore
import { Link, useNavigate } from 'react-router-dom';
import { BlogPost, BlogCategory, User } from '../types';
import { fetchBlogCategories, fetchPublishedPosts } from '../services/blog';
import { subscribeToAuthChanges } from '../services/auth';
// ĐÃ THÊM: Search và X (nút xóa) vào import
import { Loader2, BookOpen, Clock, ChevronRight, PenTool, Hash, ArrowDown, Search, X } from 'lucide-react';

// Số lượng bài hiển thị mỗi lần (9 bài cho đẹp grid 3 cột)
const PAGE_SIZE = 9; 

export const BlogList: React.FC = () => {
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [activeCat, setActiveCat] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  
  // State quản lý số lượng bài đang hiện
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  
  // MỚI: State quản lý từ khóa tìm kiếm
  const [searchTerm, setSearchTerm] = useState('');
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = subscribeToAuthChanges(user => {
      setCurrentUser(user);
    });

    const init = async () => {
      setLoading(true);
      const [catsData, postsData] = await Promise.all([
        fetchBlogCategories(),
        // Lấy 100 bài để có dữ liệu cho nút Xem thêm và Tìm kiếm hoạt động tốt
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
    // Khi đổi danh mục thì nên reset tìm kiếm cho đỡ rối
    setSearchTerm(''); 
    
    const data = await fetchPublishedPosts(catId, 100);
    setPosts(data);
    setLoading(false);
  };

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + PAGE_SIZE);
  };

  const isExpertOrAdmin = currentUser && (currentUser.isExpert || currentUser.isAdmin);

  // --- LOGIC LỌC & PHÂN TRANG MỚI ---
  // 1. Lọc theo từ khóa trước
  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (post.excerpt && post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // 2. Sau đó mới cắt trang
  const visiblePosts = filteredPosts.slice(0, visibleCount);

  return (
    <div className="min-h-screen bg-[#F7F7F5] pb-24 animate-fade-in pt-safe-top">
      {/* Header */}
      <div className="px-4 py-6 bg-white border-b border-gray-100 shadow-sm sticky top-[68px] md:top-20 z-30">
         <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-textDark mb-2 flex items-center gap-2">
                        <BookOpen className="text-primary" /> Góc Chuyên Gia
                    </h1>
                    <p className="text-textGray text-sm">Kiến thức y khoa & nuôi dạy con chuẩn xác.</p>
                </div>
                
                {/* EXPERT ACTION BUTTON */}
                {isExpertOrAdmin && (
                    <button 
                        onClick={() => navigate('/admin/blog')}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-200 active:scale-95 transition-transform"
                    >
                        <PenTool size={16} />
                        <span className="hidden md:inline">Viết Blog</span>
                        <span className="md:hidden">Viết</span>
                    </button>
                )}
            </div>

            {/* --- THANH TÌM KIẾM (MỚI THÊM) --- */}
            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                  placeholder="Tìm kiếm bài viết..." 
                  className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
                {searchTerm && (
                    <button 
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>
            
            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                <button 
                    onClick={() => handleFilter('all')}
                    className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${activeCat === 'all' ? 'bg-textDark text-white shadow-md' : 'bg-gray-100 text-textGray hover:bg-gray-200'}`}
                >
                    Tất cả
                </button>
                {categories.map(cat => (
                    <button 
                        key={cat.id}
                        onClick={() => handleFilter(cat.id)}
                        className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${activeCat === cat.id ? 'bg-primary text-white shadow-md' : 'bg-white border border-gray-200 text-textGray hover:bg-gray-50'}`}
                    >
                        <span>{cat.iconEmoji}</span> {cat.name}
                    </button>
                ))}
            </div>
         </div>
      </div>

      {/* Blog Grid */}
      <div className="max-w-5xl mx-auto px-4 py-6">
         {loading ? (
             <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>
         ) : filteredPosts.length === 0 ? (
             <div className="text-center py-20 text-gray-400 italic">
                 {searchTerm ? 'Không tìm thấy bài viết nào phù hợp.' : 'Chưa có bài viết nào trong mục này.'}
             </div>
         ) : (
             <>
                 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {visiblePosts.map(post => (
                         <Link to={`/blog/${post.slug}`} key={post.id} className="group bg-white rounded-[1.5rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
                             <div className="aspect-video bg-gray-100 relative overflow-hidden">
                                 {post.coverImageUrl ? (
                                     <img src={post.coverImageUrl} className="w-full h-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                                 ) : (
                                     <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-blue-50 to-purple-50">
                                         {post.iconEmoji || '📝'}
                                     </div>
                                 )}
                                 <div className="absolute top-3 left-3">
                                     <span className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider text-textDark shadow-sm">
                                         {categories.find(c => c.id === post.categoryId)?.name || 'Kiến thức'}
                                     </span>
                                 </div>
                             </div>
                             <div className="p-5">
                                 <h2 className="font-bold text-lg text-textDark mb-2 leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                                     {post.title}
                                 </h2>
                                 <p className="text-sm text-textGray line-clamp-3 mb-4 font-normal">
                                     {post.excerpt}
                                 </p>
                                 <div className="flex items-center justify-between border-t border-gray-50 pt-4 mt-auto">
                                     <div className="flex items-center gap-2">
                                         <img src={post.authorAvatar || "https://cdn-icons-png.flaticon.com/512/3177/3177440.png"} className="w-6 h-6 rounded-full object-cover" />
                                         <span className="text-xs font-bold text-textDark truncate max-w-[100px]">{post.authorName}</span>
                                     </div>
                                     <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                         <Clock size={12} /> {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                                     </div>
                                 </div>
                             </div>
                         </Link>
                     ))}
                 </div>

                 {/* NÚT XEM THÊM (LOAD MORE) */}
                 {visibleCount < filteredPosts.length && (
                    <div className="flex justify-center mt-8">
                        <button
                            onClick={handleLoadMore}
                            className="px-6 py-3 rounded-full bg-white border border-gray-200 text-sm font-bold text-textDark shadow-sm hover:bg-gray-50 active:scale-95 transition-all flex items-center gap-2"
                        >
                            Xem thêm bài viết <ArrowDown size={16} />
                        </button>
                    </div>
                 )}
             </>
         )}
      </div>
    </div>
  );
}; 
