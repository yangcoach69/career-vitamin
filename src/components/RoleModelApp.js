import React, { useState, useRef } from 'react';
import { 
  Search, ChevronLeft, Loader2, 
  Quote, BookOpen, Mic, Sparkles, Download, FileText,
  User, CheckCircle
} from 'lucide-react';
import { fetchGemini, saveAsPng, saveAsPdf } from '../api(1218)';
import { Toast, EditableContent } from './SharedUI';

export default function RoleModelApp({ onClose }) {
  // 스크린샷에 있는 입력 항목 그대로 적용
  const [name, setName] = useState('');          // 인물 검색
  const [quote, setQuote] = useState('');        // 감명 깊은 어록 (선택)
  const [media, setMedia] = useState('');        // 관련 책 / 영상 (선택)
  
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const reportRef = useRef(null);

  const showToast = (msg) => setToastMsg(msg);

  const handleGenerate = async () => {
    // 필수값 체크 (이름만 필수)
    if (!name.trim()) {
      return showToast("분석할 인물의 이름을 입력해주세요.");
    }
    
    setLoading(true);
    try {
      // 선택 옵션 처리
      const quoteText = quote.trim() ? `"${quote}"` : "없음 (AI가 해당 인물의 유명한 명언 중 직무 태도와 관련된 것을 선정할 것)";
      const mediaText = media.trim() ? media : "없음";

      const prompt = `
      당신은 면접 이미지 메이킹 및 스피치 전문 코치입니다.
      지원자가 존경하는 롤모델(${name})에 대한 정보를 입력했습니다.
      이를 바탕으로 면접장에서 "존경하는 인물이 있습니까?"라는 질문에 완벽하게 대답할 수 있는 **[실전 면접 스크립트]**를 작성해주세요.

      [입력 정보]
      1. 롤모델 이름: ${name}
      2. 감명 깊은 어록: ${quoteText}
      3. 관련 매체(책/영상): ${mediaText}

      [작성 가이드 - 위인전 금지!]
      - **절대 인물의 생애나 업적을 나열하지 마세요.**
      - 면접관은 지원자의 '가치관'과 '태도'를 보고 싶어 합니다.
      - **스크립트 구조:**
        1. (결론) 저의 롤모델은 OOO입니다.
        2. (이유-가치관) ${quote.trim() ? '특히 ' + quoteText + '라는 말처럼,' : ''} 그분의 [핵심 가치/태도]를 본받고 싶기 때문입니다.
        3. (적용) 저 또한 [지원 직무]를 수행하며 이러한 태도로 임하겠습니다. (직무명은 '[지원 직무]'라고 표기하여 사용자가 채워 넣게 할 것)
      
      [JSON 출력 형식]
      {
        "concept_title": "이 답변의 핵심 컨셉 (예: 혁신을 두려워하지 않는 태도)",
        "core_keyword": "핵심 키워드 (예: 도전, 끈기, 소통)",
        "script": "면접관 앞에서 바로 읽을 수 있는 400자 내외의 구어체 답변 스크립트 (두괄식)",
        "why_point": "면접관이 이 답변을 들었을 때 평가하게 될 지원자의 긍정적 이미지 (해설)"
      }`;

      const parsed = await fetchGemini(prompt);
      setResult(parsed);
    } catch (e) {
      showToast(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (key, value) => {
    setResult(prev => ({ ...prev, [key]: value }));
  };

  const handleDownload = () => saveAsPng(reportRef, `롤모델_${name}`, showToast);
  const handlePdfDownload = () => saveAsPdf(reportRef, `롤모델_${name}`, showToast);

  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col font-sans text-slate-800">
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
      
      {/* 헤더 (스크린샷의 짙은 네이비 톤 반영) */}
      <header className="bg-[#1e293b] text-white p-4 flex justify-between items-center shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="text-orange-500">
             <User size={24} fill="currentColor" />
          </div>
          <h1 className="font-bold text-lg tracking-wide">롤모델 분석</h1>
        </div>
        <button onClick={onClose} className="flex items-center text-sm text-slate-300 hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5 mr-1"/> 돌아가기
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* 사이드바: 입력창 (스크린샷 UI 100% 반영) */}
        <aside className="w-96 bg-white border-r p-8 shrink-0 overflow-y-auto flex flex-col">
          
          {/* 인물 검색 */}
          <div className="mb-8">
             <h3 className="text-orange-700 font-bold text-sm mb-4 flex items-center">
                <Search size={18} className="mr-2"/> 인물 검색
             </h3>
             <input 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-4 border border-slate-200 rounded-xl text-lg font-bold text-slate-800 placeholder:text-slate-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all shadow-sm" 
                placeholder="예: 스티브 잡스" 
             />
          </div>

          {/* 선택 옵션 */}
          <div className="mb-8">
             <h3 className="text-slate-400 font-bold text-xs mb-4 uppercase tracking-wider">
                선택 옵션 (Optional)
             </h3>
             
             {/* 감명 깊은 어록 */}
             <div className="mb-5">
                <label className="block text-sm font-bold text-slate-600 mb-2">감명 깊은 어록</label>
                <textarea 
                    value={quote}
                    onChange={(e) => setQuote(e.target.value)}
                    className="w-full p-4 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-300 focus:ring-2 focus:ring-orange-500 outline-none resize-none h-28 shadow-sm transition-all"
                    placeholder="인상 깊었던 명언이 있다면 적어주세요."
                />
             </div>

             {/* 관련 책 / 영상 */}
             <div>
                <label className="block text-sm font-bold text-slate-600 mb-2">관련 책 / 영상</label>
                <input 
                    value={media}
                    onChange={(e) => setMedia(e.target.value)}
                    className="w-full p-4 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-300 focus:ring-2 focus:ring-orange-500 outline-none shadow-sm transition-all"
                    placeholder="책 제목이나 영상 등"
                />
             </div>
          </div>

          {/* 분석 시작 버튼 (오렌지색) */}
          <button 
            onClick={handleGenerate} 
            disabled={loading} 
            className="w-full bg-[#ea580c] hover:bg-[#c2410c] text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:bg-slate-300 disabled:shadow-none disabled:translate-y-0 mt-auto"
          >
            {loading ? <Loader2 className="animate-spin mx-auto w-6 h-6"/> : "분석 시작"}
          </button>
        </aside>

        {/* 결과 화면 */}
        <main className="flex-1 p-10 overflow-y-auto flex justify-center bg-slate-50">
          {result ? (
            <div ref={reportRef} className="w-[210mm] min-h-[297mm] h-fit bg-white shadow-2xl p-12 flex flex-col animate-in fade-in zoom-in-95 duration-500 relative">
              
              {/* 타이틀 섹션 */}
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center bg-orange-100 text-orange-700 px-4 py-1.5 rounded-full text-xs font-extrabold tracking-widest mb-4">
                    INTERVIEW SCRIPT
                </div>
                <h1 className="text-4xl font-extrabold text-slate-900 mb-2">
                    {name}
                </h1>
                <EditableContent className="text-xl text-slate-500 font-medium" value={result.concept_title} onSave={(v)=>handleEdit('concept_title', v)} />
              </div>

              {/* 핵심 키워드 카드 */}
              <div className="bg-slate-900 text-white rounded-2xl p-8 shadow-xl mb-10 flex items-center justify-between">
                 <div>
                    <div className="text-orange-400 text-xs font-bold uppercase tracking-wider mb-1">Core Value</div>
                    <div className="text-3xl font-bold flex items-center gap-2">
                        <Sparkles className="text-orange-500" fill="currentColor"/>
                        <EditableContent value={result.core_keyword} onSave={(v)=>handleEdit('core_keyword', v)} />
                    </div>
                 </div>
                 <Quote className="text-slate-700 opacity-50" size={64} />
              </div>

              {/* 메인 스크립트 */}
              <section className="mb-10">
                 <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                    <Mic className="mr-2 text-orange-600"/> 답변 스크립트
                 </h3>
                 <div className="bg-orange-50/50 border border-orange-100 p-8 rounded-2xl relative">
                    <Quote className="absolute top-6 left-6 text-orange-200 w-8 h-8 rotate-180"/>
                    <div className="text-lg leading-loose text-slate-800 font-medium pl-6 relative z-10 text-justify">
                        <EditableContent value={result.script} onSave={(v)=>handleEdit('script', v)} />
                    </div>
                 </div>
                 <p className="text-xs text-slate-400 mt-2 text-right">* [지원 직무] 부분은 본인의 실제 직무명으로 바꿔서 말하세요.</p>
              </section>

              {/* 해설 (면접관의 시선) */}
              <section className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                  <h3 className="font-bold text-slate-700 mb-2 flex items-center text-sm">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-500"/> 면접관이 느끼는 포인트
                  </h3>
                  <div className="text-slate-600 text-sm leading-relaxed">
                      <EditableContent value={result.why_point} onSave={(v)=>handleEdit('why_point', v)} />
                  </div>
              </section>

              {/* 하단 푸터 */}
              <div className="mt-auto pt-8 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
                 <div className="flex items-center font-bold text-slate-300">
                    CAREER VITAMIN
                 </div>
                 <span>Role Model Analysis & Speech</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-300">
              <User size={80} className="mb-6 opacity-20"/>
              <p className="text-center text-lg font-medium text-slate-400">
                존경하는 인물의 이름을 입력하면<br/>
                <strong className="text-orange-500">합격 면접 스크립트</strong>가 생성됩니다.
              </p>
            </div>
          )}
        </main>

        {result && (
          <div className="absolute bottom-8 right-8 flex gap-3 z-50">
            <button onClick={handleDownload} className="bg-slate-900 text-white px-6 py-3 rounded-full font-bold shadow-2xl hover:-translate-y-1 flex items-center transition-transform"><Download className="mr-2" size={20}/> 이미지 저장</button>
            <button onClick={handlePdfDownload} className="bg-orange-600 text-white px-6 py-3 rounded-full font-bold shadow-2xl hover:-translate-y-1 flex items-center transition-transform"><FileText className="mr-2" size={20}/> PDF 저장</button>
          </div>
        )}
      </div>
    </div>
  );
}