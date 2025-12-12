import React from 'react';
// @ts-ignore
import { Link } from 'react-router-dom';
import { ChevronRight, ShieldCheck, Sparkles } from 'lucide-react';

export const ExpertPromoBox: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div className={`relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-primary to-[#26A69A] p-6 text-white shadow-lg shadow-primary/20 dark:shadow-none animate-fade-in ${className}`}>
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      
      <div className="relative z-10 flex flex-col items-start">
        <div className="flex items-center gap-2 mb-2 bg-white/20 px-2 py-0.5 rounded-lg border border-white/10 backdrop-blur-sm">
            <ShieldCheck size={14} className="text-white" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Đối tác chuyên môn</span>
        </div>
        
        <h3 className="text-xl font-black mb-2 leading-tight">Góc Chuyên Gia</h3>
        <p className="text-sm text-blue-50 font-medium mb-4 leading-relaxed opacity-95">
           Bạn là Bác sĩ, Giáo viên hay Chuyên gia tâm lý? Hãy tham gia để lan tỏa giá trị.
        </p>
        
        <Link 
            to="/expert-register" 
            className="w-full inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white text-white hover:text-primary backdrop-blur-md px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 border border-white/30 hover:border-white shadow-sm"
        >
            <Sparkles size={16} /> Đăng ký ngay <ChevronRight size={16} />
        </Link>
      </div>
      
      <div className="absolute -bottom-2 -right-2 text-6xl opacity-20 rotate-12 grayscale brightness-200">👨‍⚕️</div>
    </div>
  );
};
