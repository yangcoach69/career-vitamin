import React, { useState, useRef } from 'react';
import { 
  PenTool, ChevronLeft, Loader2, 
  LayoutList, CheckCircle, Sparkles, Download, FileText, Star, Tag,
  ArrowRight
} from 'lucide-react';
import { fetchGemini, saveAsPng, saveAsPdf } from '../api';
import { Toast, EditableContent, Footer } from './SharedUI';

export default function ExperienceStructApp({ onClose }) {
  // 입력 상태 관리
  const [keyword, setKeyword] = useState('');
  const [star, setStar] = useState({
    s: '', // Situation
    t: '', // Task
    a: '', // Action
    r: ''  // Result
  });
  
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const reportRef = useRef(null);

  const showToast = (msg) => setToastMsg(msg);

  const handleGenerate = async () => {
    // 필수값 체크
    if (!keyword.trim()) return showToast("경험 키워드를 입력해주세요.");
    if (!star.s.trim() || !star.t.trim() || !star.a.trim() || !star.r.trim()) {
      return showToast("STAR 내용을 모두 간단히라도 입력해주세요.");
    }
    
    setLoading(true);
    try {
      const prompt = `
      당신은 취업 면접 전문 코치입니다.
      사용자가 입력한 '키워드'와 'STAR 메모(간단한 내용)'를 바탕으로, 면접관에게 어필할 수 있는 정교한 답변을 만들어주세요.

      [사용자 입력]
      - 키워드: ${keyword}
      - S(상황): ${star.s}
      - T(문제/과제): ${star.t}
      - A(행동): ${star.a}
      - R(결과): ${star.r}

      [작성 요청사항]
      1. **STAR 정교화(Refine):** 사용자가 대충 적은 내용을, 면접관이 듣기 좋은 구체적이고 전문적인 문장으로 각각 다듬어주세요. (특히 Action과 Result를 강조)
      2. **최종 답변(Summary):** 위 내용을 종합하여, "이 경험에 대해 말해보세요"라는 질문을 받았을 때 바로 대답할 수 있는 400~500자 분량의 완성된 스크립트를 작성해주세요.

      [JSON 포맷 준수]
      {
        "title": "이 경험의 매력적인 소제목 (한 줄 카피)",
        "refined_star": {
          "s": "정교하게 다듬어진 Situation 문장",
          "t": "정교하게 다듬어진 Task 문장",
          "a": "정교하게 다듬어진 Action 문장 (구체적 행동 위주)",
          "r": "정교하게 다듬어진 Result 문장 (수치/성과/깨달음 강조)"
        },
        "summary_answer": "STAR가 자연스럽게 연결된 최종 면접 답변 스크립트 (구어체, 두괄식)"
      }`;

      const parsed = await fetchGemini(prompt);
      setResult(parsed);
    } catch (e) {
      showToast(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (section, key, value) => {
    setResult(prev => {
      const newData = { ...prev };
      if (section === 'refined_star') {
        newData.refined_star[key] = value;
      } else {
        newData[section] = value;
      }
      return newData;
    });
  };

  const handleDownload = () => saveAsPng(reportRef, `STAR_${keyword}`, showToast);
  const handlePdfDownload = () => saveAsPdf(reportRef, `STAR_${keyword}`, showToast);

  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col font-sans text-slate-800">
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
      
      {/* 헤더 */}
      <header className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <Star className="text-yellow-400" fill="currentColor"/>
          <h1 className="font-bold text-lg">경험 구조화 (STAR Refiner)</h1>
        </div>
        <button onClick={onClose} className="flex items-center text-sm hover:text-yellow-200 transition-colors">
          <ChevronLeft className="w-5 h-5 mr-1"/> 돌아가기
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* 사이드바: 입력창 */}
        <aside className="w-96 bg-white border-r p-6 shrink-0 overflow-y-auto">
          <div className="space-y-5">
            <h3 className="font-bold text-sm text-slate-800 flex items-center border-b pb-2">
              <PenTool size={16} className="mr-2"/> 내 경험 메모하기
            </h3>
            
            {/* 키워드 */}
            <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
              <label className="block text-xs font-bold text-slate-600 mb-1">핵심 역량 키워드 <span className="text-red-500">*</span></label>
              <div className="relative">
                <input 
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="w-full p-2.5 pl-9 border rounded-lg text-sm font-bold focus:ring-2 focus:ring-yellow-500 outline-none bg-white" 
                  placeholder="예: 갈등관리, 문제해결" 
                />
                <Tag className="absolute left-3 top-2.5 text-yellow-500 w-4 h-4"/>
              </div>
            </div>

            {/* STAR 입력 (Placeholder로 가이드) */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Situation (상황)</label>
                <textarea 
                  value={star.s}
                  onChange={(e) => setStar({...star, s: e.target.value})}
                  className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 outline-none h-16 resize-none" 
                  placeholder="언제, 어디서, 어떤 상황이었나요?" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Task (문제/목표)</label>
                <textarea 
                  value={star.t}
                  onChange={(e) => setStar({...star, t: e.target.value})}
                  className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 outline-none h-16 resize-none" 
                  placeholder="어떤 어려움이나 목표가 있었나요?" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Action (행동)</label>
                <textarea 
                  value={star.a}
                  onChange={(e) => setStar({...star, a: e.target.value})}
                  className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 outline-none h-20 resize-none" 
                  placeholder="내가 구체적으로 무엇을 했나요?" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Result (결과)</label>
                <textarea 
                  value={star.r}
                  onChange={(e) => setStar({...star, r: e.target.value})}
                  className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 outline-none h-16 resize-none" 
                  placeholder="성과나 배운 점은 무엇인가요?" 
                />
              </div>
            </div>

            <button 
              onClick={handleGenerate} 
              disabled={loading} 
              className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold mt-2 shadow-lg hover:bg-slate-700 transition-all disabled:bg-slate-400"
            >
              {loading ? <Loader2 className="animate-spin mx-auto"/> : "AI로 정교하게 다듬기"}
            </button>
          </div>
        </aside>

        {/* 결과 화면 */}
        <main className="flex-1 p-8 overflow-y-auto flex justify-center bg-slate-50">
          {result ? (
            <div ref={reportRef} className="w-[210mm] min-h-[297mm] h-fit bg-white shadow-2xl p-12 flex flex-col animate-in fade-in zoom-in-95 duration-500">
              
              {/* 타이틀 */}
              <div className="border-b-4 border-slate-900 pb-6 mb-8">
                <span className="bg-yellow-400 text-slate-900 px-3 py-1 rounded-full text-xs font-bold tracking-wider mb-3 inline-block">EXPERIENCE REFINED</span>
                <EditableContent className="text-3xl font-extrabold text-slate-900 mb-2" value={result.title} onSave={(v)=>handleEdit('title', null, v)} />
                <div className="flex gap-2 mt-3">
                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg font-bold flex items-center text-sm">
                        <Tag size={14} className="mr-2"/> #{keyword}
                    </span>
                </div>
              </div>

              {/* 1. STAR 정교화 섹션 */}
              <section className="mb-10">
                 <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center"><LayoutList className="mr-2 text-slate-500"/> STAR 상세 분석 및 정교화</h3>
                 <div className="grid grid-cols-1 gap-4">
                    {/* S */}
                    <div className="flex gap-4">
                        <div className="w-16 shrink-0 font-black text-slate-300 text-xl text-right pt-1">S</div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex-1">
                            <h4 className="text-xs font-bold text-slate-500 mb-1">Situation (상황)</h4>
                            <EditableContent className="text-slate-700" value={result.refined_star.s} onSave={(v)=>handleEdit('refined_star', 's', v)} />
                        </div>
                    </div>
                    {/* T */}
                    <div className="flex gap-4">
                        <div className="w-16 shrink-0 font-black text-slate-300 text-xl text-right pt-1">T</div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex-1">
                            <h4 className="text-xs font-bold text-slate-500 mb-1">Task (과제)</h4>
                            <EditableContent className="text-slate-700" value={result.refined_star.t} onSave={(v)=>handleEdit('refined_star', 't', v)} />
                        </div>
                    </div>
                    {/* A */}
                    <div className="flex gap-4">
                        <div className="w-16 shrink-0 font-black text-yellow-500 text-xl text-right pt-1">A</div>
                        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 flex-1 shadow-sm">
                            <h4 className="text-xs font-bold text-yellow-700 mb-1">Action (행동) - 핵심 포인트</h4>
                            <EditableContent className="text-slate-800 font-medium" value={result.refined_star.a} onSave={(v)=>handleEdit('refined_star', 'a', v)} />
                        </div>
                    </div>
                    {/* R */}
                    <div className="flex gap-4">
                        <div className="w-16 shrink-0 font-black text-blue-500 text-xl text-right pt-1">R</div>
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 flex-1 shadow-sm">
                            <h4 className="text-xs font-bold text-blue-700 mb-1">Result (결과) - 성과 강조</h4>
                            <EditableContent className="text-slate-800 font-medium" value={result.refined_star.r} onSave={(v)=>handleEdit('refined_star', 'r', v)} />
                        </div>
                    </div>
                 </div>
              </section>

              {/* 2. 최종 답변 (요약) */}
              <section className="bg-slate-900 text-white p-8 rounded-2xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-8 opacity-10">
                       <Sparkles size={100} />
                   </div>
                   <h3 className="text-xl font-bold text-yellow-400 mb-4 flex items-center">
                       <ArrowRight className="mr-2"/> 경험 질문 답변 가이드
                   </h3>
                   <div className="text-slate-300 text-sm mb-4 border-b border-slate-700 pb-4">
                       "이 경험에 대해 구체적으로 말씀해 주시겠습니까?" 라는 질문에 대한 모범 답변입니다.
                   </div>
                   <div className="leading-relaxed text-lg text-white font-medium">
                     <EditableContent value={result.summary_answer} onSave={(v)=>handleEdit('summary_answer', null, v)} />
                   </div>
              </section>

              {/* 푸터 */}
              <Footer />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Star size={64} className="mb-4 opacity-20"/>
              <p className="text-center mt-4">좌측에서 간단한 경험 메모를 작성하면<br/><strong>AI가 면접용으로 완벽하게 다듬어 드립니다.</strong></p>
            </div>
          )}
        </main>

        {result && (
          <div className="absolute bottom-8 right-8 flex gap-3 z-50">
            <button onClick={handleDownload} className="bg-white text-slate-900 border border-slate-200 px-6 py-3 rounded-full font-bold shadow-xl hover:-translate-y-1 flex items-center transition-transform"><Download className="mr-2" size={20}/> 이미지 저장</button>
            <button onClick={handlePdfDownload} className="bg-slate-900 text-white px-6 py-3 rounded-full font-bold shadow-xl hover:-translate-y-1 flex items-center transition-transform"><FileText className="mr-2" size={20}/> PDF 저장</button>
          </div>
        )}
      </div>
    </div>
  );
}