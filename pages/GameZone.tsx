
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Volume2, Star, Trophy, Sparkles, Play, Loader2 } from 'lucide-react';
import { Game, GameQuestion } from '../types';
import { fetchAllGames, fetchGameQuestions } from '../services/game';

export const GameZone: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await fetchAllGames(true); // only active
      setGames(data);
      setLoading(false);
    };
    load();
  }, []);

  if (activeGame) {
    return <GameEngine game={activeGame} onBack={() => setActiveGame(null)} />;
  }

  return (
    <div className="min-h-screen pb-24 px-4 bg-[#FFF9C4] flex flex-col pt-safe-top">
      <div className="py-6 text-center">
        <h1 className="text-3xl font-black text-orange-500 mb-1 flex items-center justify-center gap-2 drop-shadow-sm">
          <span className="animate-bounce-small">🎮</span> Góc Bé Chơi
        </h1>
        <p className="text-orange-800 text-sm font-medium opacity-80">
          {loading ? 'Đang tải trò chơi...' : `${games.length} trò chơi phát triển trí tuệ!`}
        </p>
      </div>

      {loading ? (
         <div className="flex justify-center py-20"><Loader2 className="animate-spin text-orange-500" size={40} /></div>
      ) : (
        <div className="grid grid-cols-2 gap-4 w-full max-w-lg mx-auto pb-10">
           {games.map(game => (
             <GameCard 
                key={game.id} 
                title={game.title} 
                icon={game.icon} 
                color={game.color} 
                onClick={() => setActiveGame(game)} 
             />
           ))}
        </div>
      )}
    </div>
  );
};

const GameCard: React.FC<{ title: string; icon: string; color: string; onClick: () => void }> = ({ title, icon, color, onClick }) => (
  <button 
    onClick={onClick}
    className={`relative overflow-hidden rounded-[1.5rem] p-4 text-white text-left transition-all active:scale-95 ${color} shadow-lg border-b-4 border-black/10 flex flex-col items-center justify-center gap-2 aspect-[4/3]`}
  >
    <div className="text-4xl drop-shadow-md">{icon}</div>
    <h3 className="text-lg font-black drop-shadow-sm text-center leading-tight">{title}</h3>
    <div className="absolute top-0 right-0 p-2 opacity-20"><Sparkles size={20} /></div>
  </button>
);

const GameEngine: React.FC<{ game: Game; onBack: () => void }> = ({ game, onBack }) => {
  const [questions, setQuestions] = useState<GameQuestion[]>([]);
  const [level, setLevel] = useState(0);
  const [score, setScore] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [loadingQ, setLoadingQ] = useState(true);

  useEffect(() => {
    const loadQ = async () => {
       const qs = await fetchGameQuestions(game.id, true);
       setQuestions(qs);
       setLoadingQ(false);
    };
    loadQ();
  }, [game.id]);

  const currentQ = questions[level];

  const playSound = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN'; 
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    if (hasStarted && currentQ) {
        const timer = setTimeout(() => playSound(currentQ.q), 500);
        return () => clearTimeout(timer);
    }
  }, [hasStarted, currentQ]);

  const handleStart = () => {
    playSound("Bắt đầu nào");
    setHasStarted(true);
  };

  const handleAnswer = (opt: string) => {
    if (opt === currentQ.a) {
      playSound("Đúng rồi! Bé giỏi quá!");
      setShowCelebration(true);
      setScore(s => s + 1);
      setTimeout(() => {
        setShowCelebration(false);
        if (level < questions.length - 1) setLevel(l => l + 1);
        else playSound("Chúc mừng bé đã chiến thắng!");
      }, 1500);
    } else {
      playSound("Chưa đúng rồi, thử lại nhé!");
      const btn = document.getElementById(`btn-${opt}`);
      if(btn) { btn.classList.add('animate-shake'); setTimeout(() => btn.classList.remove('animate-shake'), 500); }
    }
  };

  if (loadingQ) return <div className="fixed inset-0 flex items-center justify-center bg-[#E0F7FA] z-50"><Loader2 className="animate-spin text-blue-500" size={40} /></div>;

  if (questions.length === 0) return (
     <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#E0F7FA] z-50 text-center p-6">
        <h2 className="text-xl font-bold mb-4">Trò chơi này đang được cập nhật</h2>
        <button onClick={onBack} className="bg-gray-500 text-white px-6 py-3 rounded-full font-bold">Quay lại</button>
     </div>
  );

  if (!hasStarted) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-black/80 fixed inset-0 z-50 text-white p-6 text-center animate-fade-in">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <Play size={48} fill="white" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Sẵn sàng chơi "{game.title}" chưa?</h2>
            <p className="mb-8 opacity-80">Bé hãy bật âm lượng lên nhé!</p>
            <button 
                onClick={handleStart}
                className={`${game.color.replace('bg-', 'bg-')} text-white text-xl font-bold px-12 py-4 rounded-full shadow-xl brightness-110 hover:brightness-125 active:scale-95 transition-transform`}
            >
                Bắt đầu
            </button>
            <button onClick={onBack} className="mt-8 text-sm opacity-60 underline">Quay lại</button>
        </div>
      );
  }

  if (level >= questions.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#FFF9C4] text-center px-6 animate-fade-in fixed inset-0 z-50">
        <div className="relative mb-8">
           <div className="absolute inset-0 bg-yellow-400 blur-3xl opacity-50 rounded-full animate-pulse"></div>
           <Trophy size={120} className="text-yellow-500 relative z-10 drop-shadow-lg" />
        </div>
        <h2 className="text-4xl font-black text-orange-600 mb-4">Tuyệt vời!</h2>
        <p className="text-xl text-orange-800 mb-10 font-medium">Bé đã hoàn thành xuất sắc!</p>
        <button onClick={onBack} className="bg-orange-500 text-white text-xl font-bold px-12 py-4 rounded-full shadow-[0_10px_20px_rgba(249,115,22,0.4)] active:scale-95 transition-transform hover:bg-orange-600 border-b-4 border-orange-700">
          Chọn trò chơi khác
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#E0F7FA] fixed inset-0 z-50">
      {/* Game Header */}
      <div className="p-4 pt-safe-top flex justify-between items-center bg-white/50 backdrop-blur-sm">
        <button onClick={onBack} className="bg-white p-2.5 rounded-full shadow-md text-gray-700 hover:bg-gray-50 active:scale-90 transition-transform">
          <ArrowLeft size={24} />
        </button>
        <div className="flex gap-1 bg-white px-3 py-1.5 rounded-full shadow-sm max-w-[200px] overflow-x-auto no-scrollbar">
          {[...Array(questions.length)].map((_, i) => (
             <Star key={i} size={16} className={i < score ? "text-yellow-400 fill-yellow-400 drop-shadow-sm transition-all shrink-0" : "text-gray-200 transition-all shrink-0"} />
          ))}
        </div>
      </div>

      {/* Question Card */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div 
          className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-[0_10px_40px_rgba(0,0,0,0.1)] text-center mb-8 relative cursor-pointer active:scale-[0.98] transition-transform border-4 border-white"
          onClick={() => playSound(currentQ.q)}
        >
          <button className="absolute top-4 right-4 text-blue-500 bg-blue-50 p-2 rounded-full hover:bg-blue-100">
            <Volume2 size={24} />
          </button>
          <h2 className="text-3xl font-black text-textDark mt-2 leading-tight">{currentQ.q}</h2>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
          {currentQ.opts.map((opt: string, idx: number) => (
            <button
              id={`btn-${opt}`}
              key={idx}
              onClick={() => handleAnswer(opt)}
              className={`
                aspect-square rounded-[2rem] shadow-lg transition-transform active:scale-90 flex items-center justify-center text-5xl font-bold border-b-8
                ${currentQ.displayType === 'color' ? '' : 'bg-white border-gray-100 text-textDark'}
                ${(idx === 2 && currentQ.opts.length === 3) ? 'col-span-2 aspect-auto py-6' : ''} 
              `}
              style={currentQ.displayType === 'color' ? { backgroundColor: opt, borderColor: 'rgba(0,0,0,0.1)' } : {}}
            >
              {currentQ.displayType !== 'color' && opt}
            </button>
          ))}
        </div>
      </div>

      {/* Celebration Overlay */}
      {showCelebration && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in px-6">
           <div className="bg-white w-full max-w-xs p-8 rounded-[3rem] text-center shadow-2xl animate-pop-in border-8 border-yellow-200">
             <div className="text-7xl mb-4 animate-bounce">🎉</div>
             <h3 className="text-2xl font-black text-primary">Đúng rồi!</h3>
             <p className="text-gray-500 mt-1 font-medium text-sm">Bé giỏi quá đi thôi!</p>
           </div>
        </div>
      )}
    </div>
  );
};
