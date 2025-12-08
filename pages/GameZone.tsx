
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Volume2, Star, Trophy, Sparkles } from 'lucide-react';
import { GameType } from '../types';

// Mock Data
const GAME_DATA = {
  [GameType.NUMBERS]: [
    { q: "Số 1 ở đâu?", a: "1", opts: ["1", "5", "3"], color: "bg-red-400" },
    { q: "Tìm số 5 nào?", a: "5", opts: ["2", "5", "8"], color: "bg-blue-400" },
    { q: "Số 10 màu gì?", a: "10", opts: ["10", "4", "6"], color: "bg-green-400" },
  ],
  [GameType.COLORS]: [
    { q: "Màu Đỏ đâu nhỉ?", a: "#EF4444", opts: ["#EF4444", "#3B82F6", "#10B981"], type: 'color' },
    { q: "Màu Xanh Dương?", a: "#3B82F6", opts: ["#F59E0B", "#3B82F6", "#8B5CF6"], type: 'color' },
    { q: "Màu Vàng tươi?", a: "#FCD34D", opts: ["#FCD34D", "#EF4444", "#000000"], type: 'color' },
  ],
  [GameType.ANIMALS]: [
    { q: "Con Mèo kêu?", a: "🐱", opts: ["🐱", "🐶", "🐮"], type: 'emoji' },
    { q: "Con Chó đâu?", a: "🐶", opts: ["🐷", "🐶", "🐸"], type: 'emoji' },
    { q: "Hổ dũng mãnh?", a: "🐯", opts: ["🐯", "🐰", "🐼"], type: 'emoji' },
  ]
};

export const GameZone: React.FC = () => {
  const [activeGame, setActiveGame] = useState<GameType | null>(null);

  if (activeGame) {
    return <GameEngine type={activeGame} onBack={() => setActiveGame(null)} />;
  }

  return (
    <div className="min-h-screen pb-24 px-4 bg-[#FFF9C4] flex flex-col pt-safe-top">
      <div className="py-8 text-center">
        <h1 className="text-4xl font-black text-orange-500 mb-2 flex items-center justify-center gap-2 drop-shadow-sm">
          <span className="animate-bounce-small">🎮</span> Góc Bé Chơi
        </h1>
        <p className="text-orange-800 font-medium opacity-80">Vừa học vừa chơi, bé thông minh hơn!</p>
      </div>

      <div className="grid grid-cols-1 gap-5 w-full max-w-md mx-auto">
        <GameCard 
          onClick={() => setActiveGame(GameType.NUMBERS)}
          title="Học Đếm Số"
          desc="Bé học số từ 1 đến 10"
          icon="123"
          color="bg-blue-400"
          shadow="shadow-blue-600/20"
          borderColor="border-blue-500"
        />
        <GameCard 
          onClick={() => setActiveGame(GameType.COLORS)}
          title="Màu Sắc"
          desc="Nhận biết màu cơ bản"
          icon="🎨"
          color="bg-pink-400"
          shadow="shadow-pink-600/20"
          borderColor="border-pink-500"
        />
        <GameCard 
          onClick={() => setActiveGame(GameType.ANIMALS)}
          title="Con Vật"
          desc="Tên gọi các loài vật"
          icon="🦁"
          color="bg-green-400"
          shadow="shadow-green-600/20"
          borderColor="border-green-500"
        />
      </div>
    </div>
  );
};

const GameCard: React.FC<{ onClick: () => void; title: string; desc: string; icon: string; color: string; shadow: string; borderColor: string }> = ({ onClick, title, desc, icon, color, shadow, borderColor }) => (
  <button 
    onClick={onClick}
    className={`relative overflow-hidden rounded-[2rem] p-6 text-white text-left transition-all active:scale-95 ${color} ${shadow} shadow-xl border-b-8 ${borderColor}`}
  >
    <div className="absolute right-[-20px] top-[-20px] w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
    <div className="relative z-10 flex items-center gap-5">
      <div className="w-20 h-20 bg-white/90 rounded-2xl flex items-center justify-center text-4xl shadow-inner border-4 border-white/50">
        {icon}
      </div>
      <div>
        <h3 className="text-2xl font-black mb-1">{title}</h3>
        <p className="text-white/90 font-medium text-sm">{desc}</p>
      </div>
    </div>
  </button>
);

const GameEngine: React.FC<{ type: GameType; onBack: () => void }> = ({ type, onBack }) => {
  const [level, setLevel] = useState(0);
  const [score, setScore] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const questions: any[] = GAME_DATA[type as keyof typeof GAME_DATA] || [];
  const currentQ = questions[level];

  const playSound = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN'; 
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    if (currentQ) setTimeout(() => playSound(currentQ.q), 500);
  }, [currentQ]);

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

  if (level >= questions.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#FFF9C4] text-center px-6 animate-fade-in">
        <div className="relative mb-8">
           <div className="absolute inset-0 bg-yellow-400 blur-3xl opacity-50 rounded-full animate-pulse"></div>
           <Trophy size={120} className="text-yellow-500 relative z-10 drop-shadow-lg" />
        </div>
        <h2 className="text-4xl font-black text-orange-600 mb-4">Tuyệt vời!</h2>
        <p className="text-xl text-orange-800 mb-10 font-medium">Bé đã trả lời đúng hết các câu hỏi.</p>
        <button onClick={onBack} className="bg-orange-500 text-white text-xl font-bold px-12 py-4 rounded-full shadow-[0_10px_20px_rgba(249,115,22,0.4)] active:scale-95 transition-transform hover:bg-orange-600">
          Chơi lại nào
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#E0F7FA] pb-safe-bottom">
      {/* Game Header */}
      <div className="p-4 pt-safe-top flex justify-between items-center">
        <button onClick={onBack} className="bg-white p-3 rounded-full shadow-md text-gray-700 hover:bg-gray-50 active:scale-90 transition-transform">
          <ArrowLeft size={28} />
        </button>
        <div className="flex gap-1 bg-white/50 p-2 rounded-full backdrop-blur-sm">
          {[...Array(3)].map((_, i) => (
             <Star key={i} size={28} className={i < score ? "text-yellow-400 fill-yellow-400 drop-shadow-sm" : "text-gray-300"} />
          ))}
        </div>
      </div>

      {/* Question Card */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div 
          className="bg-white w-full max-w-sm rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.1)] text-center mb-10 relative cursor-pointer active:scale-[0.98] transition-transform border-4 border-white"
          onClick={() => playSound(currentQ.q)}
        >
          <button className="absolute top-5 right-5 text-blue-500 bg-blue-50 p-2.5 rounded-full hover:bg-blue-100">
            <Volume2 size={28} />
          </button>
          <h2 className="text-4xl font-black text-textDark mt-4 leading-tight">{currentQ.q}</h2>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-2 gap-5 w-full max-w-sm">
          {currentQ.opts.map((opt: string, idx: number) => (
            <button
              id={`btn-${opt}`}
              key={opt}
              onClick={() => handleAnswer(opt)}
              className={`
                aspect-square rounded-[2rem] shadow-lg transition-transform active:scale-90 flex items-center justify-center text-5xl font-bold border-b-8
                ${currentQ.type === 'color' ? '' : 'bg-white border-gray-200 text-textDark'}
                ${idx === 2 ? 'col-span-2 aspect-auto py-8' : ''} 
              `}
              style={currentQ.type === 'color' ? { backgroundColor: opt, borderColor: 'rgba(0,0,0,0.1)' } : {}}
            >
              {currentQ.type !== 'color' && opt}
            </button>
          ))}
        </div>
      </div>

      {/* Celebration Overlay */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in px-6">
           <div className="bg-white w-full max-w-sm p-10 rounded-[3rem] text-center shadow-2xl animate-pop-in border-8 border-yellow-200">
             <div className="text-8xl mb-6 animate-bounce">🎉</div>
             <h3 className="text-3xl font-black text-primary">Đúng rồi!</h3>
             <p className="text-gray-500 mt-2 font-medium">Bé giỏi quá đi thôi!</p>
           </div>
        </div>
      )}
    </div>
  );
};
