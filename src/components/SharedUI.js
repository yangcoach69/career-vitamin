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

export const ReportFooter = () => {
  const { userProfile } = useAuth(); // 현재 로그인한 사용자 정보
  
  // 1. 사용자 정보에 기관명이 있는지 확인
  const orgName = userProfile?.organization || ""; 
  
  // 2. 메시지 사전에서 찾기 (없으면 null)
  const customMessage = ORG_MESSAGES[orgName];

  return (
    <div className="mt-auto pt-4 border-t border-slate-200 flex flex-col md:flex-row justify-between items-end text-xs">
      
      {/* [좌측 하단] 기관 맞춤 메시지 영역 */}
      <div className="mb-2 md:mb-0">
        {customMessage ? (
          // 기관 메시지가 있을 때 (강조 디자인)
          <div className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg font-bold border border-indigo-100 shadow-sm flex items-center gap-2">
            <span className="text-lg">🏫</span> {/* 아이콘 */}
            <span>{customMessage}</span>
          </div>
        ) : (
          // 기관 메시지가 없을 때 (기본 문구 혹은 빈칸)
          <span className="text-slate-400 font-medium">
             Career AI Dashboard All-in-One (CADA)
          </span>
        )}
      </div>

      {/* [우측 하단] 기존 CADA 로고 및 API 표시 */}
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