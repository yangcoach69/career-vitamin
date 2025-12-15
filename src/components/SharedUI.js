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