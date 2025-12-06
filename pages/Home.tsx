
import React, { useState } from 'react';
// @ts-ignore
import { Link } from 'react-router-dom';
import { Search, MessageCircle, Heart, ChevronDown, ChevronUp, HelpCircle, Clock, Flame, MessageSquareOff, ShieldCheck, ChevronRight, Sparkles } from 'lucide-react';
import { Question } from '../types';

interface HomeProps {
  questions: Question[];
  categories: string[];
}

export const Home: React.FC<HomeProps> = ({ questions, categories }) => {
  const [activeCategory, setActiveCategory] = useState<string>('Tất cả');
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [viewFilter, setViewFilter] = useState<'newest' | 'active' | 'unanswered'>('newest');

  // Filter & Sort Logic
  let displayQuestions = activeCategory === 'Tất cả' 
    ? [...questions] 
    : questions.filter(q => q.category === activeCategory);

  switch (viewFilter) {
    case 'newest':
      displayQuestions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
    case 'active':
      displayQuestions.sort((a, b) => {
        const scoreA = a.answers.length * 2 + a.likes;
        const scoreB = b.answers.length * 2 + b.likes;
        return scoreB - scoreA;
      });
      break;
    case 'unanswered':
      displayQuestions = displayQuestions.filter(q => q.answers.length === 0);
      displayQuestions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
  }

  const CATEGORY_LIMIT = 5;
  const visibleCategories = showAllCategories ? categories : categories.slice(0, CATEGORY_LIMIT);

  return (
    <div className="space-y-6 animate-fade-in pb-safe">
      {/* Hero / Search Section - Full Bleed on Mobile */}
      <div className="bg-gradient-to-br from-primary to-[#26A69A] rounded-b-[2.5rem] md:rounded-3xl p-6 md:p-10 text-white shadow-xl shadow-primary/20 relative overflow-hidden -mx-4 md:mx-0 pt-safe-top md:pt-10">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-yellow-400 opacity-10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 md:gap-4 mb-6">
            <div className="flex-1 mt-2 md:mt-0">
              <h1 className="text-2xl md:text-3xl font-bold mb-2 leading-tight">Mẹ đang thắc mắc điều gì?</h1>
              <p className="opacity-90 text-sm md:text-base font-medium">Cùng hơn 10,000 mẹ bỉm sữa chia sẻ kinh nghiệm.</p>
            </div>
            
            {/* Expert Registration Button - Premium Glass Effect */}
            <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
              <Link 
                to="/expert-register"
                className="group flex items-center gap-3 bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 hover:border-white/40 px-4 py-2 rounded-2xl transition-all shadow-sm active:scale-95 w-full md:w-auto"
              >
                <div className="bg-white/90 p-1.5 rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                  <ShieldCheck size={18} className="text-blue-600" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white leading-none mb-0.5">Đăng ký Chuyên gia</span>
                  <span className="text-[10px] text-blue-50 opacity-90 leading-none">Xác thực uy tín</span>
                </div>
                <ChevronRight size={16} className="text-white/60 ml-auto" />
              </Link>
            </div>
          </div>
          
          <div className="relative group">
            <input 
              type="text" 
              placeholder="Tìm kiếm (vd: bé ăn dặm, sốt mọc răng)..." 
              className="w-full pl-12 pr-4 py-4 rounded-2xl text-textDark bg-white/95 backdrop-blur-xl shadow-lg shadow-teal-900/10 focus:outline-none focus:ring-4 focus:ring-white/30 placeholder-gray-400 transition-all text-sm md:text-base font-medium"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={22} />
          </div>
        </div>
      </div>

      {/* Categories - Premium Horizontal Scroll */}
      <div className="md:px-0">
        <div className="flex justify-between items-center mb-3 px-4 md:px-0">
          <h2 className="font-bold text-lg text-textDark flex items-center gap-2">
            <Sparkles size={18} className="text-accent" /> Chủ đề quan tâm
          </h2>
          
          <div className="hidden md:block">
            {categories.length > CATEGORY_LIMIT && (
              <button
                onClick={() => setShowAllCategories(!showAllCategories)}
                className="text-xs font-bold text-primary flex items-center gap-1 hover:bg-primary/5 px-2 py-1 rounded-lg transition-colors"
              >
                {showAllCategories ? 'Thu gọn' : 'Xem thêm'}
                {showAllCategories ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            )}
          </div>
        </div>
        
        {/* Mobile: Horizontal Scroll View with Snap & Safe Padding */}
        <div className="md:hidden overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 snap-x snap-mandatory flex items-center gap-3 after:content-[''] after:w-4 after:shrink-0">
          <button 
            onClick={() => setActiveCategory('Tất cả')}
            className={`snap-start scroll-ml-4 flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all shadow-sm active:scale-95 ${activeCategory === 'Tất cả' ? 'bg-textDark text-white shadow-lg shadow-gray-200' : 'bg-white text-textGray border border-gray-100'}`}
          >
            Tất cả
          </button>
          
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`snap-start flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all shadow-sm active:scale-95 ${activeCategory === cat ? 'bg-primary text-white shadow-lg shadow-primary/20 ring-2 ring-primary ring-offset-1' : 'bg-white text-textGray border border-gray-100'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Desktop: Wrapped View */}
        <div className="hidden md:flex flex-wrap gap-3">
          <button 
            onClick={() => setActiveCategory('Tất cả')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95 ${activeCategory === 'Tất cả' ? 'bg-textDark text-white shadow-lg' : 'bg-white text-textGray border border-gray-100 hover:bg-gray-50'}`}
          >
            Tất cả
          </button>
          
          {visibleCategories.map(cat => (
            <button 
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95 ${activeCategory === cat ? 'bg-primary text-white shadow-lg ring-2 ring-primary ring-offset-1' : 'bg-white text-textGray border border-gray-100 hover:bg-gray-50'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Tabs & Feed */}
      <div className="md:px-0">
        {/* Filter Tabs - Sticky Header Effect */}
        <div className="sticky top-0 z-20 bg-[#F7F7F5]/95 backdrop-blur-sm py-2 -mx-4 px-4 md:static md:bg-transparent md:mx-0 md:px-0 mb-2">
          <div className="overflow-x-auto no-scrollbar flex items-center gap-3 after:content-[''] after:w-4 after:shrink-0">
            <FilterTab 
              active={viewFilter === 'newest'} 
              onClick={() => setViewFilter('newest')} 
              icon={<Clock size={15} />} 
              label="Mới nhất" 
              activeColor="bg-blue-600 border-blue-600 text-white"
            />
            <FilterTab 
              active={viewFilter === 'active'} 
              onClick={() => setViewFilter('active')} 
              icon={<Flame size={15} />} 
              label="Sôi nổi" 
              activeColor="bg-orange-500 border-orange-500 text-white"
            />
            <FilterTab 
              active={viewFilter === 'unanswered'} 
              onClick={() => setViewFilter('unanswered')} 
              icon={<MessageSquareOff size={15} />} 
              label="Chưa trả lời" 
              activeColor="bg-primary border-primary text-white"
            />
          </div>
        </div>

        {/* Question List */}
        <div className="space-y-4 px-4 md:px-0 min-h-[50vh]">
          {displayQuestions.length === 0 && (
            <div className="text-center py-16 bg-white rounded-[2rem] border-2 border-dashed border-gray-100 mx-auto max-w-sm mt-8">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300 animate-bounce-small">
                <HelpCircle size={40} strokeWidth={1.5} />
              </div>
              <h3 className="font-bold text-textDark mb-1">Chưa có câu hỏi nào</h3>
              <p className="text-sm text-textGray">Hãy là người đầu tiên đặt câu hỏi cho chủ đề này!</p>
            </div>
          )}

          {displayQuestions.map(q => (
            <Link to={`/question/${q.id}`} key={q.id} className="block group">
              <div className="bg-white p-5 md:p-6 rounded-[1.5rem] shadow-sm border border-gray-100/60 hover:border-secondary hover:shadow-xl hover:shadow-primary/5 transition-all active:scale-[0.98] duration-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="bg-secondary/30 text-teal-700 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wide border border-secondary/20">{q.category}</span>
                    {q.images && q.images.length > 0 && (
                       <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                          📷 {q.images.length}
                       </span>
                    )}
                  </div>
                  <span className="text-[11px] text-gray-400 font-medium">{new Date(q.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
                
                <h3 className="text-[17px] md:text-lg font-bold text-textDark mb-2 leading-snug group-hover:text-primary transition-colors line-clamp-2">{q.title}</h3>
                <p className="text-textGray text-sm line-clamp-2 mb-4 font-normal leading-relaxed">{q.content}</p>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-50/80">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gray-100 overflow-hidden ring-2 ring-white shadow-sm group-hover:ring-secondary transition-all">
                      <img src={q.author.avatar} alt={q.author.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-xs font-bold text-textGray/90">{q.author.name}</span>
                    {q.author.isExpert && <ShieldCheck size={12} className="text-blue-500" />}
                  </div>
                  <div className="flex items-center gap-4 text-gray-400 text-xs font-bold">
                    <span className="flex items-center gap-1.5 transition-colors group-hover:text-red-500"><Heart size={16} /> {q.likes}</span>
                    <span className={`flex items-center gap-1.5 transition-colors ${q.answers.length === 0 ? 'text-accent' : 'group-hover:text-blue-500'}`}>
                      <MessageCircle size={16} /> 
                      {q.answers.length === 0 ? 'Giúp mẹ ấy' : `${q.answers.length} trả lời`}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

// Helper Component for Filter Tabs
const FilterTab: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string; activeColor: string }> = ({ active, onClick, icon, label, activeColor }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-1.5 whitespace-nowrap text-xs md:text-sm font-bold px-4 py-2.5 rounded-full transition-all border shadow-sm active:scale-95 ${
      active 
      ? activeColor + ' shadow-md'
      : 'bg-white text-gray-500 border-gray-200/80 hover:bg-gray-50'
    }`}
  >
    {icon}
    {label}
  </button>
);
