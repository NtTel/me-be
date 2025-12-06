
import React from 'react';
// @ts-ignore
import { Link, useLocation } from 'react-router-dom';
import { Home, PlusCircle, Gamepad2, Heart, Facebook, Instagram, Youtube, User, Search } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const isQuestionDetail = location.pathname.startsWith('/question/');
  const isGameZone = location.pathname === '/games';
  const isStaticPage = ['/about', '/terms', '/privacy', '/contact'].includes(location.pathname);

  const isActive = (path: string) => location.pathname === path ? 'text-primary' : 'text-gray-400';

  return (
    <div className="min-h-screen font-sans text-textDark bg-cream flex flex-col pt-safe-top overflow-x-hidden">
      {/* Desktop Header */}
      <header className="hidden md:block bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-primary flex items-center gap-2 select-none hover:scale-105 transition-transform">
            <span className="bg-gradient-to-tr from-primary to-secondary p-1.5 rounded-xl text-white shadow-sm">👶</span>
            Asking.vn
          </Link>
          
          <nav className="flex items-center gap-1 font-medium text-[15px]">
            <NavLink to="/" label="Trang chủ" active={location.pathname === '/'} />
            <NavLink to="/games" label="Góc Bé Chơi" active={location.pathname === '/games'} />
            <NavLink to="/profile" label="Tài khoản" active={location.pathname === '/profile'} />
            
            <Link to="/ask" className="ml-4 bg-primary text-white px-5 py-2 rounded-full hover:bg-primary/90 transition-all shadow-md active:scale-95 select-none font-bold text-sm flex items-center gap-2">
              <PlusCircle size={16} /> Đặt câu hỏi
            </Link>
          </nav>
        </div>
      </header>

      {/* Mobile Header (Minimal) - Show mostly everywhere except specific flows */}
      {!isQuestionDetail && !isGameZone && !isStaticPage && (
        <header className="md:hidden bg-white/80 backdrop-blur-xl sticky top-0 z-40 px-4 py-3 shadow-[0_2px_15px_rgba(0,0,0,0.03)] flex justify-between items-center select-none border-b border-gray-100/50">
          <Link to="/" className="text-lg font-bold text-primary flex items-center gap-2">
            <span className="bg-gradient-to-tr from-primary to-secondary p-1 rounded-lg text-white shadow-sm text-xs">👶</span>
            Asking.vn
          </Link>
          
          <div className="flex items-center gap-3">
             <Link to="/profile" className="w-8 h-8 rounded-full bg-secondary/30 p-0.5 border border-gray-200 overflow-hidden active:scale-95 transition-transform">
               <img src="https://cdn-icons-png.flaticon.com/512/3177/3177440.png" alt="Avatar" className="w-full h-full object-cover rounded-full" />
             </Link>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={`flex-1 w-full max-w-5xl mx-auto md:px-4 py-0 md:py-6 ${isQuestionDetail ? 'mb-0' : 'mb-24'} md:mb-0`}>
        {children}
      </main>

      {/* Footer - Desktop Only mostly */}
      {!isQuestionDetail && !isGameZone && (
        <footer className={`bg-white border-t border-gray-100 py-10 px-4 md:px-0 mt-auto hidden md:block mb-20 md:mb-0`}>
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              <div className="col-span-1 md:col-span-2">
                <Link to="/" className="text-xl font-bold text-primary flex items-center gap-2 mb-4 select-none">
                  Asking.vn
                </Link>
                <p className="text-sm text-textGray leading-relaxed max-w-xs mb-4">
                  Cộng đồng hỏi đáp uy tín dành cho mẹ và bé. Nơi chia sẻ kinh nghiệm, kiến thức nuôi dạy con khoa học và an toàn.
                </p>
                <div className="flex gap-4">
                  <SocialIcon color="text-blue-600 bg-blue-50" icon={<Facebook size={16} />} />
                  <SocialIcon color="text-pink-600 bg-pink-50" icon={<Instagram size={16} />} />
                  <SocialIcon color="text-red-600 bg-red-50" icon={<Youtube size={16} />} />
                </div>
              </div>
              
              <div>
                <h3 className="font-bold text-textDark mb-4">Về chúng tôi</h3>
                <ul className="space-y-2 text-sm text-textGray">
                  <li><Link to="/about" className="hover:text-primary transition-colors">Giới thiệu</Link></li>
                  <li><Link to="/contact" className="hover:text-primary transition-colors">Liên hệ</Link></li>
                  <li><Link to="/expert-register" className="hover:text-primary transition-colors">Đăng ký chuyên gia</Link></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-bold text-textDark mb-4">Chính sách</h3>
                <ul className="space-y-2 text-sm text-textGray">
                  <li><Link to="/terms" className="hover:text-primary transition-colors">Điều khoản sử dụng</Link></li>
                  <li><Link to="/privacy" className="hover:text-primary transition-colors">Chính sách bảo mật</Link></li>
                </ul>
              </div>
            </div>
            
            <div className="pt-6 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-textGray/60">
              <p>© 2024 Asking.vn - Bản quyền thuộc về Mẹ & Bé.</p>
              <p className="flex items-center gap-1">
                Made with <Heart size={12} className="text-red-400 fill-current" /> for Vietnam Families
              </p>
            </div>
          </div>
        </footer>
      )}

      {/* Mobile Bottom Navigation - Premium Glassmorphism */}
      {!isQuestionDetail && !isGameZone && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200/50 pb-safe-bottom pt-2 px-6 flex justify-between items-center z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] h-[calc(65px+env(safe-area-inset-bottom))] select-none">
          <Link to="/" className={`flex flex-col items-center gap-1 w-16 active:scale-90 transition-transform ${isActive('/')}`}>
            <Home size={24} strokeWidth={isActive('/') ? 2.5 : 2} />
            <span className="text-[10px] font-bold">Trang chủ</span>
          </Link>
          
          <Link to="/ask" className="group relative -top-6 active:scale-95 transition-transform">
            <div className="absolute inset-0 bg-primary/40 rounded-full blur-lg opacity-60"></div>
            <div className="relative bg-gradient-to-tr from-primary to-[#26A69A] text-white p-4 rounded-full shadow-xl shadow-primary/30 border-4 border-white/20">
              <PlusCircle size={30} />
            </div>
          </Link>
          
          <Link to="/games" className={`flex flex-col items-center gap-1 w-16 active:scale-90 transition-transform ${isActive('/games')}`}>
            <Gamepad2 size={24} strokeWidth={isActive('/games') ? 2.5 : 2} />
            <span className="text-[10px] font-bold">Bé Chơi</span>
          </Link>

          <Link to="/profile" className={`flex flex-col items-center gap-1 w-16 active:scale-90 transition-transform ${isActive('/profile')}`}>
            <User size={24} strokeWidth={isActive('/profile') ? 2.5 : 2} />
            <span className="text-[10px] font-bold">Tài khoản</span>
          </Link>
        </nav>
      )}
    </div>
  );
};

const NavLink: React.FC<{ to: string; label: string; active: boolean }> = ({ to, label, active }) => (
  <Link 
    to={to} 
    className={`px-4 py-2 rounded-full transition-all ${active ? 'bg-primary/10 text-primary font-bold' : 'text-textGray hover:text-primary hover:bg-gray-50'}`}
  >
    {label}
  </Link>
);

const SocialIcon: React.FC<{ color: string; icon: React.ReactNode }> = ({ color, icon }) => (
  <a href="#" className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${color}`}>
    {icon}
  </a>
);
