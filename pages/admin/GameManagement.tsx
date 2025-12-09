
import React, { useEffect, useState } from 'react';
import { Game, GAME_CATEGORIES, GameCategory, GameType, GameOrientation } from '../../types';
import { fetchAllGames, createGame, deleteGame, updateGame } from '../../services/game';
import { Plus, Trash2, ToggleRight, ToggleLeft, Loader2, ArrowRight, X, Sparkles, RefreshCw, Palette, Smile, Eye, Grid, Smartphone, Monitor } from 'lucide-react';
// @ts-ignore
import { useNavigate } from 'react-router-dom';

const EMOJI_OPTIONS = [
  '🎮', '🧩', '🎨', '📚', '🔢', '🅰️', '🧠', '👀',
  '🐶', '🐱', '🦁', '🐻', '🐼', '🐸', '🦄', '🦖',
  '🍎', '🍌', '🍇', '🍓', '🥕', '🍕', '🍦', '🍪',
  '🚗', '🚀', '✈️', '🚂', '⚽', '🏀', '🎵', '🌟',
  '🏠', '🏫', '🌈', '☀️', '🌙', '💧', '🔥', '⛄',
  '👑', '🎈', '🎁', '🧸', '🥁', '🎷', '🎸', '🎺',
  '📖', '🤖', '👾', '🌍', '🏰', '👸', '🤴', '🧚'
];

const COLOR_OPTIONS = [
  'bg-blue-400', 'bg-red-400', 'bg-green-400', 'bg-yellow-400', 
  'bg-purple-400', 'bg-pink-400', 'bg-orange-400', 'bg-teal-400',
  'bg-indigo-400', 'bg-rose-400', 'bg-cyan-400', 'bg-lime-400',
  'bg-slate-500', 'bg-amber-500', 'bg-fuchsia-500', 'bg-sky-500'
];

export const GameManagement: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  // Form State
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('🎮');
  const [color, setColor] = useState('bg-blue-400');
  const [category, setCategory] = useState<GameCategory>('general');
  const [gameType, setGameType] = useState<GameType>('quiz');
  const [orientation, setOrientation] = useState<GameOrientation>('auto');
  const [minAge, setMinAge] = useState(2);
  const [maxAge, setMaxAge] = useState(6);
  const [order, setOrder] = useState(1);

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    setLoading(true);
    const data = await fetchAllGames();
    setGames(data);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    await createGame({
      title,
      icon,
      color,
      category,
      gameType,
      orientation,
      minAge,
      maxAge,
      order,
      isActive: true,
      createdAt: new Date().toISOString()
    });

    setShowModal(false);
    loadGames();
    resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setIcon('🎮');
    setColor('bg-blue-400');
    setCategory('general');
    setGameType('quiz');
    setOrientation('auto');
    setOrder(games.length + 1);
  };

  const handleToggleActive = async (game: Game) => {
    await updateGame(game.id, { isActive: !game.isActive });
    loadGames();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa game này?")) return;
    await deleteGame(id);
    loadGames();
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <div>
           <h1 className="text-2xl font-bold text-gray-900">Quản lý Trò chơi</h1>
           <p className="text-gray-500 text-sm mt-1">Trung tâm Edu-tainment: Quiz, HTML5, Truyện kể...</p>
        </div>
        <div className="flex gap-3">
            <button 
                onClick={loadGames} 
                className="p-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
                title="Làm mới"
            >
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
            <button 
            onClick={() => { resetForm(); setShowModal(true); }}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200 active:scale-95 transition-all"
            >
            <Plus size={20} /> Thêm Game mới
            </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-indigo-500" size={32} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {games.map(game => (
             <div key={game.id} className={`bg-white rounded-[1.5rem] shadow-sm border p-5 flex flex-col relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 ${!game.isActive ? 'opacity-70 grayscale border-gray-200 bg-gray-50' : 'border-gray-200'}`}>
                {/* Badges */}
                <div className="absolute top-0 right-0 flex">
                    <div className="bg-gray-100 px-3 py-1 text-[10px] font-bold text-gray-500 uppercase border-b border-l rounded-bl-xl border-white">
                        {game.gameType}
                    </div>
                    <div className={`px-3 py-1 text-white font-bold text-xs ${game.color} shadow-sm rounded-bl-xl`}>
                       {game.minAge}-{game.maxAge} tuổi
                    </div>
                </div>
                
                <div className="flex items-center gap-4 mb-5 mt-2">
                   <div className={`w-16 h-16 rounded-2xl ${game.color} flex items-center justify-center text-4xl shadow-lg transform -rotate-3 text-white`}>
                      {game.icon}
                   </div>
                   <div>
                      <h3 className="font-bold text-lg text-gray-900 leading-tight mb-1">{game.title}</h3>
                      <div className="flex flex-wrap gap-2 text-xs">
                          <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-bold">{GAME_CATEGORIES.find(c => c.id === game.category)?.label || game.category}</span>
                          <span className="text-gray-400 font-mono">#{game.order}</span>
                      </div>
                   </div>
                </div>

                <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-4 gap-2">
                    <div className="flex gap-1">
                       <button onClick={() => handleDelete(game.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors" title="Xóa">
                          <Trash2 size={18} />
                       </button>
                       <button onClick={() => handleToggleActive(game)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition-colors" title={game.isActive ? "Tắt" : "Bật"}>
                          {game.isActive ? <ToggleRight size={24} className="text-green-500" /> : <ToggleLeft size={24} />}
                       </button>
                    </div>
                    
                    <button 
                      onClick={() => navigate(`/admin/games/${game.id}`)}
                      className="flex-1 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-sm flex items-center justify-center gap-1 transition-colors"
                    >
                       Chi tiết <ArrowRight size={16} />
                    </button>
                </div>
             </div>
           ))}
        </div>
      )}

      {/* CREATE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-[2rem] w-full max-w-5xl animate-pop-in shadow-2xl relative flex flex-col md:flex-row overflow-hidden max-h-[95vh]">
              
              {/* Close Button */}
              <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 z-20 text-gray-400 hover:text-gray-600 bg-white rounded-full p-2 shadow-sm border border-gray-100">
                  <X size={24} />
              </button>
              
              {/* LEFT: Form Section */}
              <div className="flex-1 p-6 md:p-8 overflow-y-auto">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Thêm nội dung mới</h2>
                    <p className="text-sm text-gray-500">Tạo trò chơi, truyện kể hoặc bài học cho bé.</p>
                  </div>
                  
                  <form onSubmit={handleCreate} className="space-y-6">
                     {/* Name Input */}
                     <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Tên hiển thị</label>
                        <input 
                            value={title} 
                            onChange={e => setTitle(e.target.value)} 
                            className="w-full border border-gray-200 rounded-xl p-3.5 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-medium text-lg" 
                            placeholder="Ví dụ: Học đếm số, Truyện Thỏ và Rùa..."
                            required 
                            autoFocus
                        />
                     </div>

                     {/* Type & Category Grid */}
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Loại hình</label>
                            <select 
                                value={gameType} 
                                onChange={e => setGameType(e.target.value as GameType)} 
                                className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:border-indigo-500 bg-white font-medium"
                            >
                                <option value="quiz">Trắc nghiệm (Quiz)</option>
                                <option value="html5">Game HTML5 (Embed)</option>
                                <option value="story">Truyện đọc/kể (Story)</option>
                                <option value="ai-story">AI Kể chuyện (Interactive)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Chủ đề</label>
                            <select 
                                value={category} 
                                onChange={e => setCategory(e.target.value as GameCategory)} 
                                className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:border-indigo-500 bg-white font-medium"
                            >
                                {GAME_CATEGORIES.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                                ))}
                            </select>
                        </div>
                     </div>

                     {/* Orientation Picker */}
                     <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Chiều màn hình (Cho HTML5)</label>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setOrientation('auto')}
                                className={`flex-1 p-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${orientation === 'auto' ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-bold' : 'border-gray-200 text-gray-500'}`}
                            >
                                <Smartphone size={18} /> Tự động
                            </button>
                            <button
                                type="button"
                                onClick={() => setOrientation('portrait')}
                                className={`flex-1 p-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${orientation === 'portrait' ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-bold' : 'border-gray-200 text-gray-500'}`}
                            >
                                <Smartphone size={18} /> Dọc
                            </button>
                            <button
                                type="button"
                                onClick={() => setOrientation('landscape')}
                                className={`flex-1 p-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${orientation === 'landscape' ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-bold' : 'border-gray-200 text-gray-500'}`}
                            >
                                <Monitor size={18} /> Ngang
                            </button>
                        </div>
                     </div>
                     
                     {/* Icon Picker */}
                     <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                            <Smile size={18} /> Chọn Biểu tượng
                        </label>
                        <div className="grid grid-cols-8 gap-2 border border-gray-200 rounded-2xl p-4 max-h-32 overflow-y-auto bg-gray-50 scrollbar-thin scrollbar-thumb-gray-300">
                            {EMOJI_OPTIONS.map(emoji => (
                               <button
                                 key={emoji}
                                 type="button"
                                 onClick={() => setIcon(emoji)}
                                 className={`text-2xl p-2 rounded-xl transition-all active:scale-90 flex items-center justify-center aspect-square ${
                                    icon === emoji
                                    ? 'bg-white shadow-md ring-2 ring-indigo-500 scale-110 z-10'
                                    : 'hover:bg-white hover:shadow-sm'
                                 }`}
                               >
                                 {emoji}
                               </button>
                            ))}
                        </div>
                     </div>

                     {/* Color Picker */}
                     <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                            <Palette size={18} /> Chọn màu chủ đạo
                        </label>
                        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar p-1">
                            {COLOR_OPTIONS.map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setColor(c)}
                                    className={`w-10 h-10 rounded-full flex-shrink-0 transition-all ${c} border-2 border-white shadow-sm ${color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-110 opacity-70 hover:opacity-100'}`}
                                ></button>
                            ))}
                        </div>
                     </div>

                     <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Tuổi Min</label>
                            <input type="number" value={minAge} onChange={e => setMinAge(Number(e.target.value))} className="w-full border border-gray-200 rounded-xl p-3 text-center font-bold outline-none focus:border-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Tuổi Max</label>
                            <input type="number" value={maxAge} onChange={e => setMaxAge(Number(e.target.value))} className="w-full border border-gray-200 rounded-xl p-3 text-center font-bold outline-none focus:border-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Thứ tự</label>
                            <input type="number" value={order} onChange={e => setOrder(Number(e.target.value))} className="w-full border border-gray-200 rounded-xl p-3 text-center font-bold outline-none focus:border-indigo-500" />
                        </div>
                     </div>

                     <div className="pt-4 border-t border-gray-100">
                        <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-xl shadow-indigo-200 active:scale-95 transition-all text-lg">
                            Hoàn tất & Tạo
                        </button>
                     </div>
                  </form>
              </div>

              {/* RIGHT: Live Preview Section */}
              <div className="md:w-[350px] bg-gray-50 border-l border-gray-200 p-8 flex flex-col items-center justify-center relative">
                  <div className="absolute top-6 left-0 right-0 text-center">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center justify-center gap-2">
                          <Eye size={14} /> Xem trước
                      </h3>
                  </div>
                  
                  {/* The Mobile Card Preview */}
                  <div className="transform scale-110 transition-all duration-300">
                      <div className={`relative overflow-hidden rounded-[1.5rem] p-6 text-white text-left transition-all ${color} shadow-2xl border-b-4 border-black/10 flex flex-col items-center justify-center gap-4 aspect-[4/3] w-[240px]`}>
                        <div className="text-7xl drop-shadow-md animate-bounce-small filter brightness-110">{icon}</div>
                        <h3 className="text-2xl font-black drop-shadow-sm text-center leading-tight">{title || "Tên trò chơi"}</h3>
                        <div className="absolute top-0 right-0 p-3 opacity-30"><Sparkles size={32} /></div>
                        
                        <div className="absolute top-0 right-0 bg-black/20 backdrop-blur-sm px-3 py-1 rounded-bl-xl text-xs font-bold">
                            {minAge}-{maxAge} tuổi
                        </div>
                        <div className="absolute bottom-0 left-0 bg-black/10 backdrop-blur-sm px-3 py-1 rounded-tr-xl text-[10px] font-bold uppercase">
                            {gameType}
                        </div>
                      </div>
                  </div>

                  <p className="mt-8 text-xs text-gray-400 text-center max-w-[200px] leading-relaxed">
                      Loại hình: <strong>{gameType}</strong><br/>
                      Chủ đề: <strong>{GAME_CATEGORIES.find(c => c.id === category)?.label}</strong><br/>
                      Màn hình: <strong>{orientation === 'landscape' ? 'Ngang' : orientation === 'portrait' ? 'Dọc' : 'Tự động'}</strong>
                  </p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
