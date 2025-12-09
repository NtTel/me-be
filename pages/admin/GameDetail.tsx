
import React, { useEffect, useState } from 'react';
// @ts-ignore
import { useParams, useNavigate } from 'react-router-dom';
import { Game, GameQuestion } from '../../types';
import { getGameById, fetchGameQuestions, createGameQuestion, deleteGameQuestion, updateGameQuestion } from '../../services/game';
import { generateGameContent } from '../../services/gemini';
import { ArrowLeft, Sparkles, Plus, Trash2, Eye, EyeOff, Save, Loader2, Bot } from 'lucide-react';

export const GameDetail: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  
  const [game, setGame] = useState<Game | null>(null);
  const [questions, setQuestions] = useState<GameQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  // Manual Form State
  const [newQ, setNewQ] = useState('');
  const [newOpts, setNewOpts] = useState(['', '', '']);
  const [newA, setNewA] = useState('');
  const [displayType, setDisplayType] = useState<'text' | 'emoji' | 'color'>('emoji');
  
  // AI State
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiCount, setAiCount] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedData, setGeneratedData] = useState<any[]>([]);

  useEffect(() => {
    if (gameId) loadData();
  }, [gameId]);

  const loadData = async () => {
    if (!gameId) return;
    setLoading(true);
    const g = await getGameById(gameId);
    setGame(g);
    const qs = await fetchGameQuestions(gameId);
    setQuestions(qs);
    setLoading(false);
  };

  const handleAddQuestion = async () => {
    if (!gameId || !newQ || !newA) return;
    
    await createGameQuestion(gameId, {
       q: newQ,
       opts: newOpts,
       a: newA,
       displayType,
       order: questions.length + 1,
       isActive: true,
       createdAt: new Date().toISOString()
    });

    // Reset
    setNewQ('');
    setNewOpts(['', '', '']);
    setNewA('');
    loadData();
  };

  const handleDeleteQ = async (qId: string) => {
    if (!gameId || !confirm("Xóa câu hỏi này?")) return;
    await deleteGameQuestion(gameId, qId);
    loadData();
  };

  const handleToggleQ = async (q: GameQuestion) => {
    if (!gameId) return;
    await updateGameQuestion(gameId, q.id, { isActive: !q.isActive });
    loadData();
  };

  const handleAiGenerate = async () => {
    if (!game) return;
    setIsGenerating(true);
    try {
       const data = await generateGameContent(
          aiTopic || game.title,
          `${game.minAge}-${game.maxAge} tuổi`,
          aiCount,
          displayType
       );
       setGeneratedData(data);
    } catch (e) {
       alert("Lỗi sinh dữ liệu: " + e);
    } finally {
       setIsGenerating(false);
    }
  };

  const saveGeneratedData = async () => {
     if (!gameId) return;
     let orderStart = questions.length + 1;
     
     // Save sequentially
     for (const item of generatedData) {
        await createGameQuestion(gameId, {
            ...item,
            order: orderStart++,
            isActive: true,
            createdAt: new Date().toISOString()
        });
     }
     setShowAiModal(false);
     setGeneratedData([]);
     loadData();
  };

  if (loading || !game) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto"/></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
       <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
             <button onClick={() => navigate('/admin/games')} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                <ArrowLeft size={20} />
             </button>
             <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                   <span className="text-3xl">{game.icon}</span> {game.title}
                </h1>
                <p className="text-gray-500 text-sm">Quản lý câu hỏi ({questions.length})</p>
             </div>
          </div>
          
          <button 
             onClick={() => { setShowAiModal(true); setAiTopic(game.title); }}
             className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-all"
          >
             <Sparkles size={18} /> AI Tạo câu hỏi
          </button>
       </div>

       {/* MANUAL ADD FORM */}
       <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Plus size={18}/> Thêm thủ công</h3>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
             <input value={newQ} onChange={e => setNewQ(e.target.value)} placeholder="Nội dung câu hỏi" className="border p-2 rounded-lg" />
             <select value={displayType} onChange={e => setDisplayType(e.target.value as any)} className="border p-2 rounded-lg">
                <option value="emoji">Hiển thị Emoji</option>
                <option value="text">Hiển thị Chữ</option>
                <option value="color">Hiển thị Màu</option>
             </select>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
             {newOpts.map((opt, i) => (
                <input key={i} value={opt} onChange={e => {
                    const no = [...newOpts]; no[i] = e.target.value; setNewOpts(no);
                }} placeholder={`Lựa chọn ${i+1}`} className="border p-2 rounded-lg" />
             ))}
          </div>
          <div className="flex gap-4">
             <input value={newA} onChange={e => setNewA(e.target.value)} placeholder="Đáp án đúng (Copy y hệt lựa chọn)" className="border p-2 rounded-lg flex-1" />
             <button onClick={handleAddQuestion} disabled={!newQ || !newA} className="bg-gray-900 text-white px-6 rounded-lg font-bold">Thêm</button>
          </div>
       </div>

       {/* QUESTION LIST */}
       <div className="space-y-3">
          {questions.map((q, idx) => (
             <div key={q.id} className={`bg-white p-4 rounded-xl border flex items-center justify-between ${!q.isActive ? 'opacity-60 bg-gray-50' : 'border-gray-200'}`}>
                <div className="flex items-center gap-4">
                   <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 text-xs">
                      {idx + 1}
                   </div>
                   <div>
                      <p className="font-bold text-gray-900">{q.q}</p>
                      <div className="flex gap-2 mt-1">
                         {q.opts.map(o => (
                            <span key={o} className={`text-xs px-2 py-1 rounded border ${o === q.a ? 'bg-green-100 border-green-200 text-green-700 font-bold' : 'bg-gray-50 border-gray-100'}`}>
                               {o}
                            </span>
                         ))}
                         <span className="text-[10px] text-gray-400 self-center uppercase border px-1 rounded">{q.displayType}</span>
                      </div>
                   </div>
                </div>
                <div className="flex gap-2">
                   <button onClick={() => handleToggleQ(q)} className="p-2 text-gray-400 hover:text-blue-600">
                      {q.isActive ? <Eye size={18} /> : <EyeOff size={18} />}
                   </button>
                   <button onClick={() => handleDeleteQ(q.id)} className="p-2 text-gray-400 hover:text-red-600">
                      <Trash2 size={18} />
                   </button>
                </div>
             </div>
          ))}
       </div>

       {/* AI MODAL */}
       {showAiModal && (
          <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
             <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-pop-in">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                   <h2 className="text-xl font-bold flex items-center gap-2 text-indigo-700">
                      <Bot size={24} /> AI Generator
                   </h2>
                   <button onClick={() => setShowAiModal(false)}><ArrowLeft size={20} className="rotate-180" /></button>
                </div>
                
                <div className="p-6 overflow-y-auto flex-1">
                   {generatedData.length === 0 ? (
                      <div className="space-y-4">
                         <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Chủ đề câu hỏi</label>
                            <input value={aiTopic} onChange={e => setAiTopic(e.target.value)} className="w-full border rounded-lg p-3" />
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                               <label className="block text-sm font-bold text-gray-700 mb-1">Số lượng</label>
                               <input type="number" value={aiCount} onChange={e => setAiCount(Number(e.target.value))} className="w-full border rounded-lg p-3" />
                            </div>
                            <div>
                               <label className="block text-sm font-bold text-gray-700 mb-1">Kiểu hiển thị</label>
                               <select value={displayType} onChange={e => setDisplayType(e.target.value as any)} className="w-full border rounded-lg p-3">
                                  <option value="emoji">Emoji</option>
                                  <option value="text">Chữ</option>
                                  <option value="color">Màu sắc</option>
                               </select>
                            </div>
                         </div>
                         <button 
                            onClick={handleAiGenerate} 
                            disabled={isGenerating}
                            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                         >
                            {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles />} 
                            {isGenerating ? 'Đang suy nghĩ...' : 'Tạo câu hỏi ngay'}
                         </button>
                      </div>
                   ) : (
                      <div className="space-y-4">
                         <p className="text-green-600 font-bold flex items-center gap-2"><Sparkles size={16}/> AI đã tạo {generatedData.length} câu hỏi:</p>
                         <div className="bg-gray-50 rounded-xl p-4 space-y-2 border border-gray-200 max-h-60 overflow-y-auto">
                            {generatedData.map((item, i) => (
                               <div key={i} className="text-sm border-b border-gray-200 pb-2 last:border-none">
                                  <span className="font-bold">{item.q}</span>
                                  <div className="text-gray-500 text-xs">A: {item.a} | Opts: {item.opts.join(', ')}</div>
                               </div>
                            ))}
                         </div>
                         <button 
                            onClick={saveGeneratedData}
                            className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 flex items-center justify-center gap-2"
                         >
                            <Save size={18} /> Lưu vào Database
                         </button>
                         <button onClick={() => setGeneratedData([])} className="w-full text-gray-500 text-sm hover:underline">Thử lại</button>
                      </div>
                   )}
                </div>
             </div>
          </div>
       )}
    </div>
  );
};
