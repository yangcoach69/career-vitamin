import React, { useEffect } from 'react';
import { Info } from 'lucide-react';
import { renderText } from '../api'; 

// [알림창 컴포넌트] (기존 코드 유지)
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

// [수정 가능한 텍스트 컴포넌트] (기존 코드 유지)
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

// 👇 [초기화] Footer 컴포넌트
// 복잡한 기관 로직(useAuth, ORG_MESSAGES)을 모두 제거하고, 
// 가장 깔끔한 기본 상태(Standard)로 되돌렸습니다.
export const Footer = () => {
  return (
    <div className="mt-auto pt-4 border-t border-slate-200 flex flex-col md:flex-row justify-between items-end text-xs">
      
      {/* [좌측 하단] 기본 문구로 고정 */}
      <div className="mb-2 md:mb-0">
        <span className="text-slate-400 font-medium">
             © 2025 Career Vitamin. All Rights Reserved.
        </span>
      </div>

      {/* [우측 하단] 로고 및 Enterprise 뱃지 */}
      <div className="flex items-center gap-1">
        <span className="opacity-70">Powered by</span>
        <strong className="text-indigo-600 opacity-90">Google Gemini API</strong>
        <span className="ml-2 bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100 text-[10px] font-bold tracking-tight">
          CADA
        </span>
      </div>
    </div>
  );
};