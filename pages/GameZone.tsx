import React, { useState, useEffect } from 'react';
import { ArrowLeft, Volume2, Star, Trophy, Sparkles, Play, Loader2, BookOpen, Music, Palette, Calculator, Languages, BrainCircuit, Gamepad2, Smartphone, RotateCcw, ArrowDown } from 'lucide-react';
import { Game, GameQuestion, GameCategory, CategoryDef } from '../types';
import { fetchAllGames, fetchGameQuestions, fetchCategories } from '../services/game';
import { generateStory } from '../services/gemini';

// Số lượng game hiển thị mỗi lần tải thêm
const PAGE_SIZE = 12;

export const GameZone: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [categories, setCategories] = useState<CategoryDef[]>([]);
  const [activeCategory, setActiveCategory] = useState<GameCategory | null>(null);
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

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

  // Reset pagination khi đổi danh mục
  useEffect(() => {
      setVisibleCount(PAGE_SIZE);
  }, [activeCategory]);

  const handleLoadMore = () => {
      setVisibleCount(prev => prev + PAGE_SIZE);
  };

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

  // Lọc game theo danh mục
  const filteredGames = games.filter(g => activeCategory ? (g.category === activeCategory || (activeCategory === 'general' && !g.category)) : true);
  
  // Cắt danh sách để hiển thị
  const visibleGames = filteredGames.slice(0, visibleCount);

  // --- HUB VIEW ---
  return (
    // THAY ĐỔI: bg-[#E0F7FA] -> dark:bg-slate-950
    <div className="min-h-screen pb-24 bg-[#E0F7FA] dark:bg-slate-950 flex flex-col pt-safe-top overflow-x-hidden transition-colors duration-300">
      
      {/* Header */}
      <div className="pt-8 pb-6 px-4 text-center relative bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm mb-4 transition-colors">
        <h1 className="text-4xl md:text-5xl font-black text-blue-600 dark:text-blue-400 mb-2 drop-shadow-sm tracking-tight flex items-center justify-center gap-3">
          <span className="animate-bounce">🎡</span> Góc Bé Chơi
        </h1>
        <p className="text-blue-800/80 dark:text-blue-200/80 text-base font-bold">Học mà chơi, chơi mà học!</p>
        
        {activeCategory && (
            <button 
                onClick={() => setActiveCategory(null)} 
                className="absolute top-8 left-4 md:left-8 bg-white dark:bg-slate-800 p-3 rounded-full shadow-lg text-gray-500 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 active:scale-90 transition-all border border-blue-100 dark:border-slate-700"
            >
                <ArrowLeft size={24} />
            </button>
        )}
      </div>

      {loading ? (
         <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={40} /></div>
      ) : !activeCategory ? (
        // --- CATEGORY SELECTION (HUB) ---
        <div className="px-4 py-2 animate-fade-in w-full max-w-5xl mx-auto pb-32">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {/* AI Story Special Button */}
                <button 
                    onClick={() => setAiStoryMode(true)}
                    className="col-span-2 md:col-span-2 bg-gradient-to-r from-pink-400 to-purple-500 p-6 rounded-[2.5rem] text-white shadow-xl shadow-purple-200 dark:shadow-none active:scale-[0.98] transition-transform flex items-center justify-between group overflow-hidden relative min-h-[160px]"
                >
                    <div className="relative z-10 text-left">
                        <div className="bg-white/20 backdrop-blur-md inline-flex px-3 py-1 rounded-lg text-xs font-bold mb-2 border border-white/20">Mới nhất</div>
                        <h3 className="text-3xl font-black mb-1">AI Kể Chuyện</h3>
                        <p className="text-white/90 text-sm font-bold">Bé chọn nhân vật, AI kể chuyện!</p>
                    </div>
                    <div className="text-7xl group-hover:scale-110 transition-transform relative z-10 filter drop-shadow-lg">🧚‍♀️</div>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
                </button>

                {categories.map(cat => (
                    <button 
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`aspect-square rounded-[2.5rem] flex flex-col items-center justify-center gap-3 shadow-lg shadow-gray-200/50 dark:shadow-none active:scale-95 transition-all ${cat.color} text-white border-b-8 border-black/10 hover:-translate-y-1`}
                    >
                        <span className="text-5xl drop-shadow-md filter">{cat.icon}</span>
                        <span className="font-bold text-xl tracking-wide">{cat.label}</span>
                    </button>
                ))}
            </div>
        </div>
      ) : (
        // --- GAMES LIST IN CATEGORY ---
        <div className="px-4 pb-32 animate-slide-up w-full max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-6 px-2 justify-center md:justify-start">
                <span className="text-4xl">{categories.find(c => c.id === activeCategory)?.icon}</span>
                <h2 className="text-3xl font-black text-blue-800 dark:text-blue-300">{categories.find(c => c.id === activeCategory)?.label}</h2>
            </div>

            {visibleGames.length === 0 ? (
                <div className="text-center py-20 text-gray-400 font-medium bg-white/50 dark:bg-slate-800/50 rounded-[2rem]">
                    Sắp có trò chơi mới nha bé ơi!
                </div>
            ) : (
                <>
                    {/* GAME GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {visibleGames.map(game => (
                            <button 
                                key={game.id}
                                onClick={() => setActiveGame(game)}
                                className={`bg-white dark:bg-dark-card p-5 rounded-[2.5rem] shadow-sm dark:shadow-none border-2 border-blue-50 dark:border-slate-700 flex items-center gap-5 active:scale-[0.98] transition-all group hover:shadow-xl hover:border-blue-200 dark:hover:border-slate-500 text-left`}
                            >
                                <div className={`w-20 h-20 rounded-2xl ${game.color} flex items-center justify-center text-4xl shadow-inner shrink-0 group-hover:rotate-6 transition-transform`}>
                                    {game.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-black text-gray-800 dark:text-white text-xl leading-tight mb-2 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{game.title}</h3>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-300 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide">{game.gameType}</span>
                                        <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-[10px] font-bold px-2.5 py-1 rounded-lg">{game.minAge}-{game.maxAge} tuổi</span>
                                    </div>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-slate-700 flex items-center justify-center text-blue-500 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-sm">
                                    <Play size={24} fill="currentColor" className="ml-1" />
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* LOAD MORE BUTTON */}
                    {visibleCount < filteredGames.length && (
                        <div className="flex justify-center mt-10">
                            <button 
                                onClick={handleLoadMore}
                                className="px-8 py-3 rounded-full bg-white dark:bg-dark-card border-2 border-blue-200 dark:border-slate-600 text-sm font-bold text-blue-600 dark:text-blue-400 shadow-md hover:bg-blue-50 dark:hover:bg-slate-700 active:scale-95 transition-all flex items-center gap-2"
                            >
                                Xem thêm trò chơi <ArrowDown size={18} />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
      )}
    </div>
  );
};

// --- ROTATE DEVICE OVERLAY (Giữ nguyên) ---
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

// --- 1. HTML5 PLAYER (Giữ nguyên - Vì game chạy trong iframe) ---
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

// --- 2. STORY READER (Dark Mode Added) ---
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
        // bg-[#FFF8E1] -> dark:bg-slate-900
        <div className="fixed inset-0 z-[60] bg-[#FFF8E1] dark:bg-slate-900 flex flex-col overflow-hidden animate-fade-in h-[100dvh] transition-colors">
            <div className="px-4 py-3 flex items-center justify-between bg-white/50 dark:bg-slate-800/50 backdrop-blur-md shrink-0 pt-safe-top">
                <button onClick={onBack} className="p-2 bg-white dark:bg-slate-700 rounded-full shadow-sm text-gray-700 dark:text-gray-200 active:scale-90"><ArrowLeft size={24} /></button>
                <h2 className="font-black text-orange-800 dark:text-orange-400 text-lg">Truyện Kể</h2>
                <div className="w-10"></div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 md:p-10 max-w-2xl mx-auto w-full pb-24">
                <h1 className="text-3xl font-black text-orange-900 dark:text-orange-300 mb-6 text-center leading-tight">{game.title}</h1>
                <div className="prose prose-lg prose-orange mx-auto font-medium text-gray-800 dark:text-gray-200 leading-loose text-justify">
                    {game.storyContent ? game.storyContent.split('\n').map((para, i) => (
                        <p key={i} className="mb-4">{para}</p>
                    )) : <p className="text-center italic dark:text-gray-400">Đang cập nhật nội dung...</p>}
                </div>
            </div>

            <div className="p-6 flex justify-center bg-gradient-to-t from-[#FFF8E1] dark:from-slate-900 to-transparent shrink-0 absolute bottom-0 left-0 right-0">
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

// --- 3. AI STORY TELLER (Giữ nguyên vì đã có Dark Background sẵn) ---
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

// --- 4. QUIZ ENGINE (Dark Mode Added) ---
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

  if (loadingQ) return <div className="fixed inset-0 flex items-center justify-center bg-[#E0F7FA] dark:bg-slate-900 z-[60]"><Loader2 className="animate-spin text-blue-500" size={40} /></div>;

  if (questions.length === 0) return (
     <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#E0F7FA] dark:bg-slate-900 z-[60] text-center p-6">
        <h2 className="text-xl font-bold mb-4 dark:text-white">Trò chơi này đang được cập nhật</h2>
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
      <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-[#FFF9C4] dark:bg-yellow-900/30 text-center px-6 animate-fade-in fixed inset-0 z-[60]">
        <div className="relative mb-8">
           <div className="absolute inset-0 bg-yellow-400 blur-3xl opacity-50 rounded-full animate-pulse"></div>
           <Trophy size={120} className="text-yellow-500 relative z-10 drop-shadow-lg" />
        </div>
        <h2 className="text-4xl font-black text-orange-600 dark:text-orange-400 mb-4">Tuyệt vời!</h2>
        <p className="text-xl text-orange-800 dark:text-orange-300 mb-10 font-medium">Bé đã hoàn thành xuất sắc!</p>
        <button onClick={onBack} className="bg-orange-500 text-white text-xl font-bold px-12 py-4 rounded-full shadow-[0_10px_20px_rgba(249,115,22,0.4)] active:scale-95 transition-transform hover:bg-orange-600 border-b-4 border-orange-700">
          Chọn trò chơi khác
        </button>
      </div>
    );
  }

  return (
    // bg-[#E0F7FA] -> dark:bg-slate-900
    <div className="flex flex-col h-[100dvh] bg-[#E0F7FA] dark:bg-slate-900 fixed inset-0 z-[60] transition-colors">
      <div className="p-4 pt-safe-top flex justify-between items-center bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
        <button onClick={onBack} className="bg-white dark:bg-slate-700 p-2.5 rounded-full shadow-md text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-600 active:scale-90 transition-transform">
          <ArrowLeft size={24} />
        </button>
        <div className="flex gap-1 bg-white dark:bg-slate-700 px-3 py-1.5 rounded-full shadow-sm max-w-[200px] overflow-x-auto no-scrollbar">
          {[...Array(questions.length)].map((_, i) => (
             <Star key={i} size={16} className={i < score ? "text-yellow-400 fill-yellow-400 drop-shadow-sm transition-all shrink-0" : "text-gray-200 dark:text-slate-500 transition-all shrink-0"} />
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div 
          className="bg-white dark:bg-dark-card w-full max-w-sm rounded-[2.5rem] p-8 shadow-[0_10px_40px_rgba(0,0,0,0.1)] dark:shadow-none text-center mb-8 relative cursor-pointer active:scale-[0.98] transition-transform border-4 border-white dark:border-slate-700"
          onClick={() => playSound(currentQ.q)}
        >
          <button className="absolute top-4 right-4 text-blue-500 bg-blue-50 dark:bg-slate-700 dark:text-blue-400 p-2 rounded-full hover:bg-blue-100 dark:hover:bg-slate-600">
            <Volume2 size={24} />
          </button>
          <h2 className="text-3xl font-black text-textDark dark:text-white mt-2 leading-tight">{currentQ.q}</h2>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
          {currentQ.opts.map((opt: string, idx: number) => (
            <button
              id={`btn-${opt}`}
              key={idx}
              onClick={() => handleAnswer(opt)}
              className={`
                aspect-square rounded-[2rem] shadow-lg transition-transform active:scale-90 flex items-center justify-center text-5xl font-bold border-b-8
                ${currentQ.displayType === 'color' ? '' : 'bg-white dark:bg-dark-card border-gray-100 dark:border-slate-700 text-textDark dark:text-white'} 
                ${(idx === 2 && currentQ.opts.length === 3) ? 'col-span-2 aspect-auto py-6' : ''} 
              `}
              style={currentQ.displayType === 'color' ? { backgroundColor: opt, borderColor: 'rgba(0,0,0,0.1)' } : {}}
            >
              {currentQ.displayType !== 'color' && opt}
            </button>
          ))}
        </div>
      </div>

      {showCelebration && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in px-6">
           <div className="bg-white dark:bg-dark-card w-full max-w-xs p-8 rounded-[3rem] text-center shadow-2xl animate-pop-in border-8 border-yellow-200 dark:border-yellow-700">
             <div className="text-7xl mb-4 animate-bounce">🎉</div>
             <h3 className="text-2xl font-black text-primary">Đúng rồi!</h3>
             <p className="text-gray-500 dark:text-gray-300 mt-1 font-medium text-sm">Bé giỏi quá đi thôi!</p>
           </div>
        </div>
      )}
    </div>
  );
};
