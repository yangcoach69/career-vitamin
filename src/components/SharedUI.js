// src/components/SharedUI.js
import React, { useEffect } from 'react';
import { Info } from 'lucide-react';
import { renderText } from '../api'; // 아까 만든 api.js에서 가져옴

// [알림창 컴포넌트]
export const Toast = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 z-[100] animate-in slide-in-from-bottom-5 fade-in">
      <Info size={20} className="text-indigo-400" />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};

// [수정 가능한 텍스트 컴포넌트]
export const EditableContent = ({ value, onSave, className }) => {
  return (
    <div
      contentEditable
      suppressContentEditableWarning
      className={`whitespace-pre-wrap outline-none focus:bg-yellow-50/50 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-200 rounded transition-all cursor-text ${className}`}
      onBlur={(e) => onSave(e.currentTarget.innerText)}
    >
      {renderText(value)}
    </div>
  );
};

// ... (Toast, EditableContent 등 위쪽 코드는 그대로 유지) ...

// src/components/SharedUI.js 의 Footer 부분

export const Footer = () => {
  return (
    <div className="mt-auto pt-8 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400 font-mono">
      <div className="font-bold text-slate-500">
         Career AI Dashboard All-in-One (CADA)
      </div>
      <div className="flex items-center gap-1">
        <span className="opacity-70">Powered by</span>
        <strong className="text-indigo-600 opacity-90">Google Gemini API</strong>
        
        {/* 👇 [변경] Enterprise 뱃지 */}
        <span className="ml-2 bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100 text-[10px] font-bold tracking-tight">
          ENTERPRISE
        </span>
      </div>
    </div>
  );
};