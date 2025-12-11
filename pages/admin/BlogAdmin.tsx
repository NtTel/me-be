import React, { useEffect, useState } from 'react';
import { BlogPost, BlogCategory } from '../../types';
// Đảm bảo bạn đã import toSlug từ file types hoặc utils
import { toSlug } from '../../types'; 
import { 
  fetchBlogCategories, createBlogCategory, updateBlogCategory, deleteBlogCategory,
  createBlogPost, updateBlogPost, deleteBlogPost, fetchAllPostsAdmin
} from '../../services/blog';
import { generateBlogPost, generateBlogTitle } from '../../services/gemini';
import { subscribeToAuthChanges } from '../../services/auth';
import { Plus, Trash2, Edit2, X, Image as ImageIcon, Video, Link as LinkIcon, BookOpen, Layers, Sparkles, Loader2, RefreshCw } from 'lucide-react';

export const BlogAdmin: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'posts' | 'categories'>('posts');
  
  // Data State
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCatModal, setShowCatModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);

  // AI State
  const [aiLoading, setAiLoading] = useState({ title: false, content: false });

  // Form State - Category
  const [editingCat, setEditingCat] = useState<BlogCategory | null>(null);
  const [catForm, setCatForm] = useState({ name: '', iconEmoji: '📝', order: 1, isActive: true });

  // Form State - Post
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [postForm, setPostForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    coverImageUrl: '',
    iconEmoji: '📰',
    youtubeUrl: '',
    sourceUrl: '',
    sourceLabel: '',
    categoryId: '',
    status: 'draft' as 'draft' | 'published'
  });

  useEffect(() => {
    const unsub = subscribeToAuthChanges(user => {
      setCurrentUser(user);
      if (user) loadData(user);
    });
    return () => unsub();
  }, []);

  const loadData = async (user: any) => {
    setLoading(true);
    const [cats, allPosts] = await Promise.all([
      fetchBlogCategories(),
      fetchAllPostsAdmin(user.isAdmin ? undefined : user.id)
    ]);
    setCategories(cats);
    setPosts(allPosts);
    setLoading(false);
  };

  // --- CATEGORY HANDLERS ---
  const handleEditCat = (cat: BlogCategory) => {
    setEditingCat(cat);
    setCatForm({ name: cat.name, iconEmoji: cat.iconEmoji, order: cat.order, isActive: cat.isActive });
    setShowCatModal(true);
  };

  const handleSaveCat = async () => {
    if (!catForm.name) return;
    // Sử dụng toSlug chuẩn thay vì regex cũ
    const slug = toSlug(catForm.name);
    
    try {
        if (editingCat) {
            await updateBlogCategory(editingCat.id, { ...catForm, slug });
        } else {
            await createBlogCategory({ ...catForm, slug });
        }
        setShowCatModal(false);
        setEditingCat(null);
        setCatForm({ name: '', iconEmoji: '📝', order: categories.length + 1, isActive: true });
        loadData(currentUser);
    } catch (e) {
        alert("Lỗi khi lưu danh mục: " + e);
    }
  };

  const handleDeleteCat = async (id: string) => {
    if (!confirm("Xóa danh mục này?")) return;
    await deleteBlogCategory(id);
    loadData(currentUser);
  };

  // --- POST HANDLERS ---
  
  // Xử lý khi nhập tiêu đề -> Tự động tạo Slug
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTitle = e.target.value;
      setPostForm(prev => ({
          ...prev,
          title: newTitle,
          // Chỉ tự động tạo slug nếu đang tạo mới hoặc slug đang trống
          slug: (!editingPost || !prev.slug) ? toSlug(newTitle) : prev.slug
      }));
  };

  // Hàm tạo lại slug thủ công
  const handleRegenerateSlug = () => {
      if (postForm.title) {
          setPostForm(prev => ({ ...prev, slug: toSlug(prev.title) }));
      }
  };

  const handleEditPost = (post: BlogPost) => {
    setEditingPost(post);
    setPostForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      coverImageUrl: post.coverImageUrl || '',
      iconEmoji: post.iconEmoji || '📰',
      youtubeUrl: post.youtubeUrl || '',
      sourceUrl: post.sourceUrl || '',
      sourceLabel: post.sourceLabel || '',
      categoryId: post.categoryId || '',
      status: post.status
    });
    setShowPostModal(true);
  };

  const handleCreatePost = () => {
    setEditingPost(null);
    setPostForm({
      title: '', slug: '', excerpt: '', content: '', coverImageUrl: '',
      iconEmoji: '📰', youtubeUrl: '', sourceUrl: '', sourceLabel: '',
      categoryId: categories[0]?.id || '', status: 'draft'
    });
    setShowPostModal(true);
  };

  // --- AI HANDLERS ---
  const handleAiTitle = async () => {
      const topic = postForm.title || prompt("Nhập chủ đề bạn muốn viết:");
      if (!topic) return;

      setAiLoading(prev => ({ ...prev, title: true }));
      try {
          const newTitle = await generateBlogTitle(topic);
          if (newTitle) {
              setPostForm(prev => ({ 
                  ...prev, 
                  title: newTitle,
                  slug: toSlug(newTitle) // Tự động cập nhật slug theo tiêu đề AI
              }));
          }
      } catch (e) {
          alert("Lỗi AI: " + e);
      } finally {
          setAiLoading(prev => ({ ...prev, title: false }));
      }
  };

  const handleAiContent = async () => {
      if (!postForm.title) {
          alert("Vui lòng nhập tiêu đề bài viết trước để AI hiểu chủ đề.");
          return;
      }
      if (postForm.content && !confirm("Nội dung hiện tại sẽ bị ghi đè. Bạn có chắc muốn tiếp tục?")) {
          return;
      }

      setAiLoading(prev => ({ ...prev, content: true }));
      try {
          const content = await generateBlogPost(postForm.title);
          if (content) setPostForm(prev => ({ ...prev, content }));
      } catch (e) {
          alert("Lỗi AI: " + e);
      } finally {
          setAiLoading(prev => ({ ...prev, content: false }));
      }
  };

  const handleSavePost = async () => {
    if (!postForm.title || !currentUser) return;
    
    // Đảm bảo luôn có slug chuẩn
    let slug = postForm.slug;
    if (!slug) {
        slug = toSlug(postForm.title);
    }

    const postData: any = {
      ...postForm,
      slug, // Lưu slug chuẩn
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatar,
      authorIsExpert: currentUser.isExpert
    };

    if (editingPost) {
      await updateBlogPost(editingPost.id, postData);
    } else {
      await createBlogPost(postData);
    }
    setShowPostModal(false);
    loadData(currentUser);
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm("Xóa bài viết này?")) return;
    await deleteBlogPost(id);
    loadData(currentUser);
  };

  if (!currentUser || (!currentUser.isAdmin && !currentUser.isExpert)) {
      return <div className="p-10 text-center">Bạn không có quyền truy cập.</div>;
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex justify-between items-center">
         <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
               <BookOpen className="text-blue-600" /> Quản trị Blog
            </h1>
            <p className="text-gray-500 text-sm">Quản lý bài viết và danh mục kiến thức.</p>
         </div>
         <div className="flex gap-2">
            {currentUser.isAdmin && (
                <button 
                    onClick={() => setActiveTab('categories')} 
                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'categories' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
                >
                    <Layers size={18} /> Danh mục
                </button>
            )}
            <button 
                onClick={() => setActiveTab('posts')} 
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'posts' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
            >
                <BookOpen size={18} /> Bài viết
            </button>
         </div>
      </div>

      {/* --- CATEGORIES TAB --- */}
      {activeTab === 'categories' && currentUser.isAdmin && (
          <div className="space-y-4">
              <div className="flex justify-end">
                  <button onClick={() => { setEditingCat(null); setCatForm({ name: '', iconEmoji: '📝', order: categories.length + 1, isActive: true }); setShowCatModal(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg">
                      <Plus size={18} /> Thêm Danh mục
                  </button>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <table className="w-full text-left">
                      <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500">
                          <tr>
                              <th className="px-6 py-4">Tên danh mục</th>
                              <th className="px-6 py-4">Emoji</th>
                              <th className="px-6 py-4">Slug</th>
                              <th className="px-6 py-4">Thứ tự</th>
                              <th className="px-6 py-4 text-right">Hành động</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                          {categories.map(cat => (
                              <tr key={cat.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 font-bold">{cat.name}</td>
                                  <td className="px-6 py-4 text-xl">{cat.iconEmoji}</td>
                                  <td className="px-6 py-4 text-gray-500 font-mono text-xs">{cat.slug}</td>
                                  <td className="px-6 py-4">{cat.order}</td>
                                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                                      <button onClick={() => handleEditCat(cat)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                                      <button onClick={() => handleDeleteCat(cat.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {/* --- POSTS TAB --- */}
      {activeTab === 'posts' && (
          <div className="space-y-4">
              <div className="flex justify-end">
                  <button onClick={handleCreatePost} className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg">
                      <Plus size={18} /> Viết bài mới
                  </button>
              </div>
              <div className="grid gap-4">
                  {posts.map(post => (
                      <div key={post.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center hover:shadow-md transition-all">
                          <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-3xl shrink-0 overflow-hidden">
                              {post.coverImageUrl ? <img src={post.coverImageUrl} className="w-full h-full object-cover" /> : post.iconEmoji}
                          </div>
                          <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-bold text-gray-900 truncate">{post.title}</h3>
                                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${post.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{post.status}</span>
                              </div>
                              <p className="text-xs text-gray-500 mb-1 line-clamp-1">{post.excerpt}</p>
                              <div className="flex gap-3 text-[10px] text-gray-400">
                                  <span>{new Date(post.createdAt).toLocaleDateString('vi-VN')}</span>
                                  <span>• {post.authorName}</span>
                                  <span>• {categories.find(c => c.id === post.categoryId)?.name || 'Chưa phân loại'}</span>
                                  <span className="font-mono text-gray-300 ml-2">/{post.slug}</span>
                              </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                              <button onClick={() => handleEditPost(post)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit2 size={18} /></button>
                              <button onClick={() => handleDeletePost(post.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* CATEGORY MODAL */}
      {showCatModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-md p-6">
                  <h3 className="font-bold text-lg mb-4">{editingCat ? 'Sửa danh mục' : 'Thêm danh mục'}</h3>
                  <div className="space-y-3">
                      <input value={catForm.name} onChange={e => setCatForm({...catForm, name: e.target.value})} placeholder="Tên danh mục" className="w-full p-2 border rounded-lg" />
                      <input value={catForm.iconEmoji} onChange={e => setCatForm({...catForm, iconEmoji: e.target.value})} placeholder="Emoji Icon" className="w-full p-2 border rounded-lg" />
                      <input type="number" value={catForm.order} onChange={e => setCatForm({...catForm, order: Number(e.target.value)})} placeholder="Thứ tự" className="w-full p-2 border rounded-lg" />
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                      <button onClick={() => setShowCatModal(false)} className="px-4 py-2 text-gray-500 font-bold">Hủy</button>
                      <button onClick={handleSaveCat} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold">Lưu</button>
                  </div>
              </div>
          </div>
      )}

      {/* POST MODAL */}
      {showPostModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                      <h3 className="font-bold text-lg">{editingPost ? 'Sửa bài viết' : 'Viết bài mới'}</h3>
                      <button onClick={() => setShowPostModal(false)}><X size={24} /></button>
                  </div>
                  <div className="p-6 overflow-y-auto flex-1 space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                          <div className="relative">
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tiêu đề</label>
                              <input 
                                value={postForm.title} 
                                onChange={handleTitleChange} // Sử dụng hàm mới để auto update slug
                                placeholder="Tiêu đề bài viết" 
                                className="w-full p-3 border rounded-xl font-bold text-lg pr-20" 
                              />
                              <button 
                                onClick={handleAiTitle} 
                                disabled={aiLoading.title}
                                className="absolute right-2 top-8 p-1.5 bg-gradient-to-r from-purple-100 to-indigo-100 text-indigo-600 rounded-lg text-xs font-bold flex items-center gap-1 active:scale-95 transition-transform"
                                title="AI Gợi ý tiêu đề"
                              >
                                {aiLoading.title ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} AI
                              </button>
                          </div>
                          
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Danh mục</label>
                              <select value={postForm.categoryId} onChange={e => setPostForm({...postForm, categoryId: e.target.value})} className="w-full p-3 border rounded-xl">
                                  <option value="">-- Chọn danh mục --</option>
                                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                              </select>
                          </div>
                      </div>

                      {/* SLUG INPUT CẢI TIẾN */}
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Đường dẫn (Slug)</label>
                          <div className="flex gap-2">
                              <input 
                                  value={postForm.slug} 
                                  onChange={e => setPostForm({...postForm, slug: e.target.value})} 
                                  placeholder="duong-dan-bai-viet-chuan-seo" 
                                  className="w-full p-2 border rounded-xl text-sm font-mono text-gray-600 bg-gray-50" 
                              />
                              <button 
                                  onClick={handleRegenerateSlug}
                                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600"
                                  title="Tạo lại từ tiêu đề"
                              >
                                  <RefreshCw size={18} />
                              </button>
                          </div>
                      </div>

                      <textarea value={postForm.excerpt} onChange={e => setPostForm({...postForm, excerpt: e.target.value})} placeholder="Mô tả ngắn (Excerpt)" className="w-full p-3 border rounded-xl h-20" />
                      
                      <div className="relative">
                          <div className="flex justify-between items-center mb-1">
                              <label className="text-xs font-bold text-gray-500 uppercase">Nội dung</label>
                              <button 
                                onClick={handleAiContent} 
                                disabled={aiLoading.content}
                                className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-md hover:shadow-lg active:scale-95 transition-all"
                              >
                                {aiLoading.content ? <Loader2 size={14} className="animate-spin"/> : <Sparkles size={14} />} 
                                {aiLoading.content ? 'AI đang viết...' : 'Viết bài với AI'}
                              </button>
                          </div>
                          <textarea value={postForm.content} onChange={e => setPostForm({...postForm, content: e.target.value})} placeholder="Nội dung bài viết (Hỗ trợ HTML cơ bản)..." className="w-full p-4 border rounded-xl h-64 font-mono text-sm leading-relaxed" />
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                              <label className="text-xs font-bold text-gray-500 uppercase">Media</label>
                              <div className="flex gap-2 items-center border rounded-xl p-2">
                                  <ImageIcon size={18} className="text-gray-400" />
                                  <input value={postForm.coverImageUrl} onChange={e => setPostForm({...postForm, coverImageUrl: e.target.value})} placeholder="Link ảnh bìa" className="flex-1 outline-none text-sm" />
                              </div>
                              <div className="flex gap-2 items-center border rounded-xl p-2">
                                  <span className="text-lg">😀</span>
                                  <input value={postForm.iconEmoji} onChange={e => setPostForm({...postForm, iconEmoji: e.target.value})} placeholder="Emoji đại diện" className="flex-1 outline-none text-sm" />
                              </div>
                          </div>
                          <div className="space-y-2">
                              <label className="text-xs font-bold text-gray-500 uppercase">Liên kết nguồn</label>
                              <div className="flex gap-2 items-center border rounded-xl p-2">
                                  <Video size={18} className="text-gray-400" />
                                  <input value={postForm.youtubeUrl} onChange={e => setPostForm({...postForm, youtubeUrl: e.target.value})} placeholder="Youtube URL" className="flex-1 outline-none text-sm" />
                              </div>
                              <div className="flex gap-2 items-center border rounded-xl p-2">
                                  <LinkIcon size={18} className="text-gray-400" />
                                  <input value={postForm.sourceUrl} onChange={e => setPostForm({...postForm, sourceUrl: e.target.value})} placeholder="Link nguồn tham khảo" className="flex-1 outline-none text-sm" />
                              </div>
                          </div>
                      </div>

                      <div className="flex items-center gap-4 border-t pt-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" name="status" checked={postForm.status === 'draft'} onChange={() => setPostForm({...postForm, status: 'draft'})} />
                              <span className="text-sm font-medium">Bản nháp</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" name="status" checked={postForm.status === 'published'} onChange={() => setPostForm({...postForm, status: 'published'})} />
                              <span className="text-sm font-bold text-green-600">Công khai</span>
                          </label>
                      </div>
                  </div>
                  <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                      <button onClick={() => setShowPostModal(false)} className="px-6 py-2 text-gray-600 font-bold hover:bg-gray-200 rounded-xl">Hủy</button>
                      <button onClick={handleSavePost} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700">Lưu bài viết</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
