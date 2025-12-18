import React, { useState, useRef, useEffect } from 'react';
import { Mic, ChevronLeft, Settings, Loader2, Download, FileText } from 'lucide-react';

// [1] UI 컴포넌트: 파일 분리 없이 바로 사용할 수 있도록 내장
const Toast = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);
  return (
    <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-full shadow-2xl animate-bounce z-[60]">
      {message}
    </div>
  );
};

const EditableContent = ({ value, onSave, className }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  useEffect(() => { setLocalValue(value); }, [value]);

  if (isEditing) {
    return (
      <textarea
        autoFocus
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={() => { setIsEditing(false); onSave(localValue); }}
        className={`w-full bg-purple-50 p-2 rounded outline-purple-500 resize-none ${className}`}
        style={{ minHeight: '1.5em' }}
      />
    );
  }
  return (
    <div onClick={() => setIsEditing(true)} className={`cursor-pointer hover:bg-yellow-100 transition-colors rounded px-1 -mx-1 ${className}`} title="클릭하여 수정">
      {value || <span className="text-gray-300 text-sm">(내용 없음 - 클릭하여 입력)</span>}
    </div>
  );
};

// [2] 메인 앱: props로 기능들(fetchGemini 등)을 받아옵니다.
function SelfIntroApp({ onClose, fetchGemini, saveAsPng, saveAsPdf }) {
  // 요청하신 '컨셉 설정', '인성/성격 강조' 수정 사항 반영 완료
  const [inputs, setInputs] = useState({ company: '', job: '', concept: 'competency', keyword: '', exp: '' });
  const [script, setScript] = useState(null); 
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const reportRef = useRef(null);

  const showToast = (msg) => setToastMsg(msg);

  const handleAIAnalysis = async () => {
    if (!inputs.company) return showToast("기업명을 입력해주세요.");
    setLoading(true);
    try {
      // App.js에서 받은 fetchGemini를 그대로 사용
      const prompt = `1분 자기소개. 기업:${inputs.company}, 직무:${inputs.job}, 컨셉:${inputs.concept}, 키워드:${inputs.keyword}, 경험:${inputs.exp}. JSON: { "slogan": "...", "opening": "...", "body": "...", "closing": "..." }`;
      const parsed = await fetchGemini(prompt);
      setScript(parsed);
    } catch (e) { showToast(e.message); } finally { setLoading(false); }
  };
  
  const handleEdit = (key, value) => setScript(prev => ({ ...prev, [key]: value }));
  
  // App.js에서 받은 저장 함수 사용
  const handleDownload = () => saveAsPng(reportRef, `자기소개_${inputs.company}`, showToast);
  const handlePdfDownload = () => saveAsPdf(reportRef, `자기소개_${inputs.company}`, showToast);
  
  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col font-sans text-slate-800">
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
      <header className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md shrink-0">
        <div className="flex items-center gap-3"><Mic className="text-purple-400"/><h1 className="font-bold text-lg">1분 자기소개</h1></div>
        <button onClick={onClose} className="flex items-center text-sm hover:text-purple-200 transition-colors"><ChevronLeft className="w-5 h-5 mr-1"/> 돌아가기</button>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 bg-white border-r p-6 shrink-0 overflow-y-auto"><div className="space-y-5">
          <h3 className="font-bold text-sm text-purple-700 flex items-center uppercase tracking-wider"><Settings size={16} className="mr-2"/> 컨셉 설정</h3>
          <div className="grid grid-cols-2 gap-2">
            <input value={inputs.company} onChange={e=>setInputs({...inputs, company:e.target.value})} className="p-3 border rounded-lg text-sm focus:outline-none focus:border-purple-500" placeholder="기업명"/>
            <input value={inputs.job} onChange={e=>setInputs({...inputs, job:e.target.value})} className="p-3 border rounded-lg text-sm focus:outline-none focus:border-purple-500" placeholder="직무명"/>
          </div>
          <div className="flex gap-2">
            <button onClick={()=>setInputs({...inputs, concept:'competency'})} className={`flex-1 py-3 text-xs rounded-lg transition-all ${inputs.concept==='competency'?'bg-purple-600 text-white font-bold':'bg-slate-100 text-slate-600'}`}>직무역량 강조</button>
            <button onClick={()=>setInputs({...inputs, concept:'character'})} className={`flex-1 py-3 text-xs rounded-lg transition-all ${inputs.concept==='character'?'bg-purple-600 text-white font-bold':'bg-slate-100 text-slate-600'}`}>인성/성격 강조</button>
          </div>
          <input value={inputs.keyword} onChange={e=>setInputs({...inputs, keyword:e.target.value})} className="w-full p-3 border rounded-lg font-bold" placeholder="핵심 키워드"/>
          <textarea value={inputs.exp} onChange={e=>setInputs({...inputs, exp:e.target.value})} className="w-full p-3 border rounded-lg h-32 resize-none" placeholder="관련 경험 요약"/>
          <button onClick={handleAIAnalysis} disabled={loading} className="w-full bg-purple-600 text-white py-3.5 rounded-xl font-bold mt-4 shadow-lg disabled:bg-slate-400">{loading?<Loader2 className="animate-spin mx-auto"/>:"스크립트 생성"}</button>
        </div></aside>
        <main className="flex-1 p-8 overflow-y-auto flex justify-center bg-slate-50">{script ? <div ref={reportRef} className="w-[210mm] min-h-[297mm] h-fit bg-white shadow-lg p-10 flex flex-col animate-in fade-in zoom-in-95 duration-500"><div className="border-b-4 border-purple-600 pb-6 text-center"><span className="text-purple-600 font-bold text-sm tracking-widest block mb-2">1-MINUTE SPEECH</span><EditableContent className="text-3xl font-extrabold text-slate-900 text-center" value={script.slogan} onSave={(v)=>handleEdit('slogan', v)} /></div><div className="space-y-8 mt-8"> <div className="flex gap-6"><div className="w-20 text-right font-bold text-slate-400 text-sm pt-4 uppercase">Opening</div><div className="flex-1 bg-purple-50 p-6 rounded-2xl text-xl font-bold text-slate-800 shadow-sm"><EditableContent value={script.opening} onSave={(v)=>handleEdit('opening', v)} /></div></div><div className="flex gap-6"><div className="w-20 text-right font-bold text-slate-400 text-sm pt-1 uppercase">Body</div><div className="flex-1 text-slate-700 leading-loose pl-6 border-l-2 border-purple-200 text-lg"><EditableContent value={script.body} onSave={(v)=>handleEdit('body', v)} /></div></div><div className="flex gap-6"><div className="w-20 text-right font-bold text-slate-400 text-sm pt-4 uppercase">Closing</div><div className="flex-1 bg-slate-50 p-6 rounded-2xl font-medium text-slate-800 text-lg"><EditableContent value={script.closing} onSave={(v)=>handleEdit('closing', v)} /></div></div></div><div className="mt-12 pt-6 border-t border-slate-200 flex justify-between items-center text-xs text-slate-400 mt-auto"><div className="flex items-center"><Mic className="w-4 h-4 mr-1 text-purple-500" /><span>Career Vitamin</span></div><span>AI-Generated Speech Script</span></div></div> : <div className="flex flex-col items-center justify-center h-full text-slate-400"><Mic size={64} className="mb-4 opacity-20"/><p>정보를 입력하면 스크립트가 생성됩니다.</p></div>}</main>
        {script && (
          <div className="absolute bottom-8 right-8 flex gap-3 z-50">
            <button onClick={handleDownload} className="bg-slate-900 text-white px-6 py-3 rounded-full font-bold shadow-2xl hover:-translate-y-1 flex items-center transition-transform"><Download className="mr-2" size={20}/> 이미지 저장</button>
            <button onClick={handlePdfDownload} className="bg-red-600 text-white px-6 py-3 rounded-full font-bold shadow-2xl hover:-translate-y-1 flex items-center transition-transform"><FileText className="mr-2" size={20}/> PDF 저장</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default SelfIntroApp;