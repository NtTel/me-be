
import React, { useEffect, useState } from 'react';
import { Game } from '../../types';
import { fetchAllGames, createGame, deleteGame, updateGame } from '../../services/game';
import { Plus, Edit2, Trash2, ToggleRight, ToggleLeft, Gamepad2, Loader2, ArrowRight } from 'lucide-react';
// @ts-ignore
import { Link, useNavigate } from 'react-router-dom';

export const GameManagement: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  // Form State
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('🎮');
  const [color, setColor] = useState('bg-blue-400');
  const [minAge, setMinAge] = useState(2);
  const [maxAge, setMaxAge] = useState(6);
  const [order, setOrder] = useState(1);

  const colors = [
    'bg-blue-400', 'bg-red-400', 'bg-green-400', 'bg-yellow-400', 
    'bg-purple-400', 'bg-pink-400', 'bg-orange-400', 'bg-teal-400'
  ];

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
      gameType: 'quiz',
      minAge,
      maxAge,
      order,
      isActive: true,
      createdAt: new Date().toISOString()
    });

    setShowModal(false);
    loadGames();
    // Reset form
    setTitle('');
    setIcon('🎮');
  };

  const handleToggleActive = async (game: Game) => {
    await updateGame(game.id, { isActive: !game.isActive });
    loadGames();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa game này? Tất cả câu hỏi trong game sẽ mất kết nối.")) return;
    await deleteGame(id);
    loadGames();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-gray-900">Quản lý Trò chơi</h1>
           <p className="text-gray-500">Tạo và quản lý các trò chơi cho bé</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-indigo-700"
        >
          <Plus size={20} /> Thêm Game mới
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-indigo-500" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {games.map(game => (
             <div key={game.id} className={`bg-white rounded-2xl shadow-sm border p-5 flex flex-col relative overflow-hidden transition-all ${!game.isActive ? 'opacity-60 grayscale' : 'border-gray-200'}`}>
                <div className={`absolute top-0 right-0 p-2 rounded-bl-2xl text-white font-bold text-xs ${game.color}`}>
                   {game.minAge}-{game.maxAge} tuổi
                </div>
                
                <div className="flex items-center gap-4 mb-4">
                   <div className={`w-14 h-14 rounded-2xl ${game.color} flex items-center justify-center text-2xl shadow-md`}>
                      {game.icon}
                   </div>
                   <div>
                      <h3 className="font-bold text-lg text-gray-900">{game.title}</h3>
                      <p className="text-xs text-gray-500 font-mono">Order: {game.order}</p>
                   </div>
                </div>

                <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-4">
                    <div className="flex gap-2">
                       <button onClick={() => handleDelete(game.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg">
                          <Trash2 size={18} />
                       </button>
                       <button onClick={() => handleToggleActive(game)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded-lg">
                          {game.isActive ? <ToggleRight size={24} className="text-green-500" /> : <ToggleLeft size={24} />}
                       </button>
                    </div>
                    
                    <button 
                      onClick={() => navigate(`/admin/games/${game.id}`)}
                      className="px-4 py-2 bg-gray-50 hover:bg-indigo-50 text-indigo-700 font-bold rounded-lg text-sm flex items-center gap-1"
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl w-full max-w-lg p-6 animate-pop-in">
              <h2 className="text-xl font-bold mb-4">Thêm trò chơi mới</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                 <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Tên trò chơi</label>
                    <input value={title} onChange={e => setTitle(e.target.value)} className="w-full border rounded-lg p-2" required />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Icon (Emoji)</label>
                        <input value={icon} onChange={e => setIcon(e.target.value)} className="w-full border rounded-lg p-2 text-center text-xl" required />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Màu sắc</label>
                        <select value={color} onChange={e => setColor(e.target.value)} className="w-full border rounded-lg p-2">
                            {colors.map(c => <option key={c} value={c}>{c.replace('bg-', '')}</option>)}
                        </select>
                    </div>
                 </div>

                 <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Tuổi Min</label>
                        <input type="number" value={minAge} onChange={e => setMinAge(Number(e.target.value))} className="w-full border rounded-lg p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Tuổi Max</label>
                        <input type="number" value={maxAge} onChange={e => setMaxAge(Number(e.target.value))} className="w-full border rounded-lg p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Thứ tự</label>
                        <input type="number" value={order} onChange={e => setOrder(Number(e.target.value))} className="w-full border rounded-lg p-2" />
                    </div>
                 </div>

                 <div className="flex justify-end gap-3 mt-6">
                    <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg">Hủy</button>
                    <button type="submit" className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700">Tạo mới</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};
