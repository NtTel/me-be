
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Volume2, Star, Trophy, Sparkles, Play, Loader2, BookOpen, Music, Palette, Calculator, Languages, BrainCircuit, Gamepad2, Smartphone, RotateCcw } from 'lucide-react';
import { Game, GameQuestion, GameCategory, CategoryDef } from '../types';
import { fetchAllGames, fetchGameQuestions, fetchCategories } from '../services/game';
import { generateStory } from '../services/gemini';

export const GameZone: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [categories, setCategories] = useState<CategoryDef[]>([]);
  const [activeCategory, setActiveCategory] = useState<GameCategory | null>(null);
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);

  // AI Story Mode State
  const [aiStoryMode, setAiStoryMode] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [gamesData, catsData] = await Promise.all([
          fetchAllGames(true),
          fetchCategories()
      ]);
      setGames(gamesData);
      setCategories(catsData);
      setLoading(false);
    };
    load();
  }, []);

  if (aiStoryMode) {
      return <AiStoryTeller onBack={() => setAiStoryMode(false)} />;
  }

  if (activeGame) {
    if (activeGame.gameType === 'html5') {
        return <Html5Player game={activeGame} onBack={() => setActiveGame(null)} />;
    }
    if (activeGame.gameType === 'story') {
        return <StoryReader game={activeGame} onBack={() => setActiveGame(null)} />;
    }
    // Default to Quiz
    return <QuizEngine game={activeGame} onBack={() => setActiveGame(null)} />;
  }

  // --- HUB VIEW ---
  return (
    <div className="min-h-screen pb-24 bg-[#E0F7FA] flex flex-col pt-safe-top overflow-x-hidden">
      
      {/* Header */}
      <div className="pt-6 pb-4 px-4 text-center relative">
        <h1 className="text-4xl font-black text-blue-600 mb-1 drop-shadow-sm tracking-tight flex items-center justify-center gap-2">
          <span className="animate-bounce">🎡</span> Góc Bé Chơi
        </h1>
        <p className="text-blue-800/70 text-sm font-bold">Học mà chơi, chơi mà học!</p>
        
        {activeCategory && (
            <button 
                onClick={() => setActiveCategory(null)} 
                className="absolute top-6 left-4 bg-white p-2 rounded-full shadow-md text-gray-500 hover:text-blue-600 active:scale-90 transition-all"
            >
                <ArrowLeft size={24} />
            </button>
        )}
      </div>

      {loading ? (
         <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={40} /></div>
      ) : !activeCategory ? (
        // CATEGORY SELECTION (HUB)
        <div className="px-4 py-4 animate-fade-in max-w-lg mx-auto w-full pb-32">
            <div className="grid grid-cols-2 gap-4">
                {/* AI Story Special Button */}
                <button 
                    onClick={() => setAiStoryMode(true)}
                    className="col-span-2 bg-gradient-to-r from-pink-400 to-purple-500 p-6 rounded-[2rem] text-white shadow-lg active:scale-95 transition-transform flex items-center justify-between group overflow-hidden relative"
                >
                    <div className="relative z-10 text-left">
                        <h3 className="text-2xl font-black mb-1">AI Kể Chuyện</h3>
                        <p className="text-white/90 text-xs font-bold">Bé chọn nhân vật, AI kể chuyện!</p>
                    </div>
                    <div className="text-5xl group-hover:scale-110 transition-transform relative z-10">🧚‍♀️</div>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
                </button>

                {categories.map(cat => (
                    <button 
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`aspect-square rounded-[2rem] flex flex-col items-center justify-center gap-2 shadow-md active:scale-95 transition-all ${cat.color} text-white border-b-4 border-black/10`}
                    >
                        <span className="text-4xl drop-shadow-md">{cat.icon}</span>
                        <span className="font-bold text-lg">{cat.label}</span>
                    </button>
                ))}
            </div>
        </div>
      ) : (
        // GAMES LIST IN CATEGORY
        <div className="px-4 pb-32 animate-slide-up w-full max-w-lg mx-auto">
            <div className="flex items-center gap-2 mb-4 px-2">
                <span className="text-2xl">{categories.find(c => c.id === activeCategory)?.icon}</span>
                <h2 className="text-xl font-bold text-blue-800">{categories.find(c => c.id === activeCategory)?.label}</h2>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {games.filter(g => g.category === activeCategory || (activeCategory === 'general' && !g.category)).map(game => (
                    <button 
                        key={game.id}
                        onClick={() => setActiveGame(game)}
                        className={`bg-white p-4 rounded-[2rem] shadow-sm border border-blue-100 flex items-center gap-4 active:scale-95 transition-all group hover:shadow-md`}
                    >
                        <div className={`w-16 h-16 rounded-2xl ${game.color} flex items-center justify-center text-3xl shadow-inner shrink-0 group-hover:rotate-3 transition-transform`}>
                            {game.icon}
                        </div>
                        <div className="text-left flex-1">
                            <h3 className="font-bold text-gray-800 text-lg leading-tight mb-1">{game.title}</h3>
                            <div className="flex gap-2">
                                <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-1 rounded-lg uppercase">{game.gameType}</span>
                                <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-1 rounded-lg">{game.minAge}-{game.maxAge} tuổi</span>
                            </div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                            <Play size={20} fill="currentColor" />
                        </div>
                    </button>
                ))}
                
                {games.filter(g => g.category === activeCategory).length === 0 && (
                    <div className="text-center py-10 text-gray-400 font-medium">
                        Sắp có trò chơi mới nha bé ơi!
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

// --- ROTATE DEVICE OVERLAY ---
const RotateDeviceOverlay: React.FC<{ orientation: 'portrait' | 'landscape' }> = ({ orientation }) => {
    const [matches, setMatches] = useState(true);

    useEffect(() => {
        const checkOrientation = () => {
            const isLandscape = window.innerWidth > window.innerHeight;
            if (orientation === 'landscape') {
                setMatches(isLandscape);
            } else if (orientation === 'portrait') {
                setMatches(!isLandscape);
            } else {
                setMatches(true);
            }
        };

        checkOrientation();
        window.addEventListener('resize', checkOrientation);
        return () => window.removeEventListener('resize', checkOrientation);
    }, [orientation]);

    if (matches) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center text-white p-6 text-center animate-fade-in">
            <div className="mb-6 animate-bounce">
                <RotateCcw size={64} />
            </div>
            <h2 className="text-2xl font-bold mb-2">Vui lòng xoay thiết bị</h2>
            <p className="text-gray-300">Bé hãy xoay màn hình {orientation === 'landscape' ? 'ngang' : 'dọc'} để chơi trò này nhé!</p>
        </div>
    );
};

// --- 1. HTML5 PLAYER ---
const Html5Player: React.FC<{ game: Game; onBack: () => void }> = ({ game, onBack }) => {
    if (!game.gameUrl) return <div className="p-10 text-center">Lỗi: Không tìm thấy Game URL. <button onClick={onBack} className="text-blue-500 underline">Quay lại</button></div>;

    return (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col h-[100dvh] w-full">
            {game.orientation && game.orientation !== 'auto' && (
                <RotateDeviceOverlay orientation={game.orientation} />
            )}
            
            <div className="h-10 bg-gray-900 flex items-center justify-between px-4 shrink-0 absolute top-0 left-0 right-0 z-10 opacity-50 hover:opacity-100 transition-opacity">
                <button onClick={onBack} className="text-white flex items-center gap-2 font-bold text-sm bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
                    <ArrowLeft size={16} /> Thoát
                </button>
            </div>
            
            <iframe 
                src={game.gameUrl} 
                className="flex-1 w-full h-full border-none bg-black"
                allowFullScreen
                allow="autoplay; fullscreen; accelerometer; gyroscope; screen-wake-lock;"
            />
        </div>
    );
};

// --- 2. STORY READER ---
const StoryReader: React.FC<{ game: Game; onBack: () => void }> = ({ game, onBack }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [speech, setSpeech] = useState<SpeechSynthesisUtterance | null>(null);

    useEffect(() => {
        return () => {
            window.speechSynthesis.cancel();
        };
    }, []);

    const toggleRead = () => {
        if (isPlaying) {
            window.speechSynthesis.cancel();
            setIsPlaying(false);
        } else {
            const u = new SpeechSynthesisUtterance(game.storyContent || "");
            u.lang = 'vi-VN';
            u.rate = 0.9;
            u.onend = () => setIsPlaying(false);
            window.speechSynthesis.speak(u);
            setSpeech(u);
            setIsPlaying(true);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] bg-[#FFF8E1] flex flex-col overflow-hidden animate-fade-in h-[100dvh]">
            <div className="px-4 py-3 flex items-center justify-between bg-white/50 backdrop-blur-md shrink-0 pt-safe-top">
                <button onClick={onBack} className="p-2 bg-white rounded-full shadow-sm text-gray-700 active:scale-90"><ArrowLeft size={24} /></button>
                <h2 className="font-black text-orange-800 text-lg">Truyện Kể</h2>
                <div className="w-10"></div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 md:p-10 max-w-2xl mx-auto w-full pb-24">
                <h1 className="text-3xl font-black text-orange-900 mb-6 text-center leading-tight">{game.title}</h1>
                <div className="prose prose-lg prose-orange mx-auto font-medium text-gray-800 leading-loose text-justify">
                    {game.storyContent ? game.storyContent.split('\n').map((para, i) => (
                        <p key={i} className="mb-4">{para}</p>
                    )) : <p className="text-center italic">Đang cập nhật nội dung...</p>}
                </div>
            </div>

            <div className="p-6 flex justify-center bg-gradient-to-t from-[#FFF8E1] to-transparent shrink-0 absolute bottom-0 left-0 right-0">
                <button 
                    onClick={toggleRead}
                    disabled={!game.storyContent}
                    className={`flex items-center gap-3 px-8 py-4 rounded-full font-bold text-lg shadow-xl active:scale-95 transition-all ${isPlaying ? 'bg-red-500 text-white' : 'bg-orange-500 text-white hover:bg-orange-600'}`}
                >
                    {isPlaying ? <Volume2 className="animate-pulse" /> : <Play />}
                    {isPlaying ? 'Dừng đọc' : 'Nghe đọc truyện'}
                </button>
            </div>
        </div>
    );
};

// --- 3. AI STORY TELLER (Interactive) ---
const AiStoryTeller: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [step, setStep] = useState(1);
    const [char, setChar] = useState('');
    const [lesson, setLesson] = useState('');
    const [story, setStory] = useState<{title: string, content: string} | null>(null);
    const [loading, setLoading] = useState(false);

    const CHARACTERS = ['🐰 Thỏ con', '🐻 Gấu Pooh', '🦕 Khủng long', 'princess Công chúa', 'robot Robot'];
    const LESSONS = ['Lòng dũng cảm', 'Sự trung thực', 'Tình bạn', 'Nghe lời mẹ'];

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const res = await generateStory(char, lesson);
            setStory(res);
            setStep(3);
        } catch (e) {
            alert("Hệ thống đang bận, bé thử lại sau nhé!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] bg-gradient-to-b from-indigo-900 to-purple-900 text-white flex flex-col animate-fade-in h-[100dvh]">
            {/* Header */}
            <div className="p-4 flex justify-between items-center shrink-0 pt-safe-top">
                <button onClick={onBack} className="p-2 bg-white/10 rounded-full hover:bg-white/20"><ArrowLeft /></button>
                <h2 className="font-bold text-lg flex items-center gap-2"><Sparkles className="text-yellow-400" /> AI Kể Chuyện</h2>
                <div className="w-10"></div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto w-full">
                {step === 1 && (
                    <div className="animate-slide-up w-full">
                        <h3 className="text-2xl font-bold mb-6">Bé thích nhân vật nào?</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {CHARACTERS.map(c => (
                                <button 
                                    key={c}
                                    onClick={() => { setChar(c); setStep(2); }}
                                    className="bg-white/10 hover:bg-white/20 border-2 border-white/20 p-6 rounded-2xl font-bold text-lg transition-all active:scale-95"
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {step === 2 && !loading && (
                    <div className="animate-slide-up w-full">
                        <h3 className="text-2xl font-bold mb-6">Câu chuyện về bài học gì?</h3>
                        <div className="grid grid-cols-1 gap-3">
                            {LESSONS.map(l => (
                                <button 
                                    key={l}
                                    onClick={() => { setLesson(l); handleGenerate(); }}
                                    className="bg-white/10 hover:bg-white/20 border-2 border-white/20 p-4 rounded-xl font-bold text-lg transition-all active:scale-95"
                                >
                                    {l}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {loading && (
                    <div className="text-center">
                        <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Sparkles size={40} className="animate-spin text-yellow-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">AI đang sáng tác...</h3>
                        <p className="opacity-70 text-sm">Bé đợi một xíu nhé!</p>
                    </div>
                )}

                {step === 3 && story && (
                    <StoryReader 
                        game={{ 
                            id: 'temp', 
                            title: story.title, 
                            storyContent: story.content, 
                            gameType: 'story', 
                            icon: '🤖', color: '', minAge:0, maxAge:0, isActive:true, order:0, category: 'story',
                            createdAt: new Date().toISOString()
                        }} 
                        onBack={onBack} 
                    />
                )}
            </div>
        </div>
    );
};

// --- 4. QUIZ ENGINE (Existing) ---
const QuizEngine: React.FC<{ game: Game; onBack: () => void }> = ({ game, onBack }) => {
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

  if (loadingQ) return <div className="fixed inset-0 flex items-center justify-center bg-[#E0F7FA] z-[60]"><Loader2 className="animate-spin text-blue-500" size={40} /></div>;

  if (questions.length === 0) return (
     <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#E0F7FA] z-[60] text-center p-6">
        <h2 className="text-xl font-bold mb-4">Trò chơi này đang được cập nhật</h2>
        <button onClick={onBack} className="bg-gray-500 text-white px-6 py-3 rounded-full font-bold">Quay lại</button>
     </div>
  );

  if (!hasStarted) {
      return (
        <div className="flex flex-col items-center justify-center h-[100dvh] bg-black/80 fixed inset-0 z-[60] text-white p-6 text-center animate-fade-in">
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
      <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-[#FFF9C4] text-center px-6 animate-fade-in fixed inset-0 z-[60]">
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
    <div className="flex flex-col h-[100dvh] bg-[#E0F7FA] fixed inset-0 z-[60]">
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
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in px-6">
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
