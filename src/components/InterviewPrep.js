// src/components/InterviewPrep.js
import React, { useState, useRef } from 'react';
import { 
  MessageSquare, ChevronLeft, Mic, Loader2, 
  Split, User, Download, FileText, Lightbulb, CheckCircle, AlertTriangle
} from 'lucide-react';
import { fetchGemini, saveAsPng, saveAsPdf } from '../api(1218)';
import { Toast, EditableContent } from './SharedUI';

export default function InterviewPrepApp({ onClose }) {
  // 입력 상태 관리
  const [question, setQuestion] = useState('');
  const [situation1, setSituation1] = useState('');
  const [situation2, setSituation2] = useState('');
  
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const reportRef = useRef(null);

  const showToast = (msg) => setToastMsg(msg);

  const handleGenerate = async () => {
    if (!question.trim()) return showToast("면접 질문을 입력해주세요.");
    
    setLoading(true);
    try {
      const prompt = `
      당신은 면접 답변 코칭 전문가입니다. 
      사용자가 입력한 '면접 질문'과 '두 가지 구체적인 상황'에 맞춰, 가장 현명하고 센스 있는 답변 스크립트를 작성해주세요.

      [입력 정보]
      - 면접 질문: ${question}
      - 상황 1 (Option A): ${situation1 || '일반적인 상황'}
      - 상황 2 (Option B): ${situation2 || '특수한/어려운 상황'}

      [작성 가이드]
      - 각 상황에 맞는 '실제 답변 대사(Script)'를 구어체로 자연스럽게 작성할 것.
      - 그 답변을 선택한 '의도(Rationale)'를 간략히 설명할 것.
      - 답변은 예의 바르면서도 지원자의 소신이나 유연함을 보여줄 수 있어야 함.

      [JSON 출력 형식 준수]
      {
        "overview": "이 질문의 핵심 의도 파악 및 공략 팁 (1~2문장)",
        "case1": {
          "title": "상황 1: ${situation1 || '일반적인 상황'}",
          "script": "면접관에게 실제로 말하듯이 작성된 답변 스크립트 (\"...입니다\" 체)",
          "rationale": "이 답변의 핵심 전략 및 어필 포인트"
        },
        "case2": {
          "title": "상황 2: ${situation2 || '특수한 상황'}",
          "script": "면접관에게 실제로 말하듯이 작성된 답변 스크립트 (\"...입니다\" 체)",
          "rationale": "이 답변의 핵심 전략 및 어필 포인트"
        },
        "advice": "이런 유형의 질문을 받았을 때의 태도 및 주의사항"
      }`;

      const parsed = await fetchGemini(prompt);
      setResult(parsed);
    } catch (e) {
      showToast(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (section, key, value, subKey = null) => {
    setResult(prev => {
      const newData = { ...prev };
      if (section === 'case1' || section === 'case2') {
        newData[section][key] = value;
      } else {
        newData[section] = value;
      }
      return newData;
    });
  };

  const handleDownload = () => saveAsPng(reportRef, `상황면접_가이드`, showToast);
  const handlePdfDownload = () => saveAsPdf(reportRef, `상황면접_가이드`, showToast);

  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col font-sans text-slate-800">
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
      
      {/* 헤더 */}
      <header className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <MessageSquare className="text-emerald-400"/>
          <h1 className="font-bold text-lg">상황면접 가이드 스크립트</h1>
        </div>
        <button onClick={onClose} className="flex items-center text-sm hover:text-emerald-200 transition-colors">
          <ChevronLeft className="w-5 h-5 mr-1"/> 돌아가기
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* 사이드바 입력 */}
        <aside className="w-80 bg-white border-r p-6 shrink-0 overflow-y-auto">
          <div className="space-y-6">
            <h3 className="font-bold text-sm text-emerald-800 flex items-center border-b pb-2">
              <Mic size={16} className="mr-2"/> 질문 & 상황 설정
            </h3>
            
            {/* 메인 질문 */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">기출/예상 질문 <span className="text-red-500">*</span></label>
              <textarea 
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full p-3 border rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none h-24 resize-none" 
                placeholder="예: 상사가 부당한 지시를 한다면 어떻게 대처하겠습니까?" 
              />
            </div>

            {/* 상황 옵션 */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
              <div className="flex items-center text-xs text-slate-400 font-bold mb-1">
                <Split size={14} className="mr-1"/> 상황별 옵션 (선택)
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">상황 1 (Option A)</label>
                <input 
                  value={situation1}
                  onChange={(e) => setSituation1(e.target.value)}
                  className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" 
                  placeholder="예: 개인적인 가벼운 심부름" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">상황 2 (Option B)</label>
                <input 
                  value={situation2}
                  onChange={(e) => setSituation2(e.target.value)}
                  className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" 
                  placeholder="예: 회계 부정 등 명백한 불법" 
                />
              </div>
            </div>

            <button 
              onClick={handleGenerate} 
              disabled={loading} 
              className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold mt-2 shadow-lg hover:bg-emerald-700 transition-all disabled:bg-slate-400"
            >
              {loading ? <Loader2 className="animate-spin mx-auto"/> : "답변 가이드 생성"}
            </button>
          </div>
        </aside>

        {/* 결과 화면 */}
        <main className="flex-1 p-8 overflow-y-auto flex justify-center bg-slate-50">
          {result ? (
            <div ref={reportRef} className="w-[210mm] min-h-[297mm] h-fit bg-white shadow-2xl p-12 flex flex-col animate-in fade-in zoom-in-95 duration-500">
              
              {/* 타이틀 및 질문 */}
              <div className="border-b-4 border-emerald-600 pb-6 mb-8">
                <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold tracking-wider mb-3 inline-block">INTERVIEW GUIDE</span>
                <h1 className="text-2xl font-extrabold text-slate-900 mb-4 leading-snug">Q. {question}</h1>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                   <h4 className="font-bold text-xs text-emerald-800 mb-2 flex items-center"><Lightbulb size={14} className="mr-1"/> 출제 의도 및 조언</h4>
                   <EditableContent className="text-sm text-slate-600 leading-relaxed" value={result.overview} onSave={(v)=>handleEdit('overview', null, v)} />
                </div>
              </div>

              {/* 상황별 답변 비교 */}
              <div className="space-y-8 flex-1">
                {/* Case 1 */}
                <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                   <div className="bg-emerald-50 px-5 py-3 border-b border-emerald-100 flex items-center justify-between">
                      <h3 className="font-bold text-emerald-900 flex items-center"><CheckCircle className="mr-2 w-5 h-5"/> {result.case1?.title || '상황 1'}</h3>
                      <span className="text-xs font-bold text-emerald-600 bg-white px-2 py-1 rounded">CASE A</span>
                   </div>
                   <div className="p-6 space-y-4">
                      <div>
                        <p className="text-xs font-bold text-slate-400 mb-1">🗣️ 답변 스크립트</p>
                        <div className="bg-slate-50 p-4 rounded-lg border-l-4 border-emerald-400">
                          <EditableContent className="text-base text-slate-800 leading-relaxed font-medium" value={result.case1?.script} onSave={(v)=>handleEdit('case1', 'script', v)} />
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 mb-1">💡 전략 포인트</p>
                        <EditableContent className="text-sm text-slate-600" value={result.case1?.rationale} onSave={(v)=>handleEdit('case1', 'rationale', v)} />
                      </div>
                   </div>
                </section>

                {/* Case 2 */}
                <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                   <div className="bg-amber-50 px-5 py-3 border-b border-amber-100 flex items-center justify-between">
                      <h3 className="font-bold text-amber-900 flex items-center"><AlertTriangle className="mr-2 w-5 h-5"/> {result.case2?.title || '상황 2'}</h3>
                      <span className="text-xs font-bold text-amber-600 bg-white px-2 py-1 rounded">CASE B</span>
                   </div>
                   <div className="p-6 space-y-4">
                      <div>
                        <p className="text-xs font-bold text-slate-400 mb-1">🗣️ 답변 스크립트</p>
                        <div className="bg-slate-50 p-4 rounded-lg border-l-4 border-amber-400">
                          <EditableContent className="text-base text-slate-800 leading-relaxed font-medium" value={result.case2?.script} onSave={(v)=>handleEdit('case2', 'script', v)} />
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 mb-1">💡 전략 포인트</p>
                        <EditableContent className="text-sm text-slate-600" value={result.case2?.rationale} onSave={(v)=>handleEdit('case2', 'rationale', v)} />
                      </div>
                   </div>
                </section>
              </div>

              {/* 하단 피드백 */}
              <div className="mt-8 bg-slate-800 text-white p-6 rounded-xl">
                 <h3 className="font-bold text-emerald-300 mb-2 flex items-center"><User className="mr-2"/> 면접관의 시선</h3>
                 <EditableContent className="text-sm text-slate-300 leading-relaxed" value={result.advice} onSave={(v)=>handleEdit('advice', null, v)} />
              </div>

              <div className="mt-8 pt-6 border-t border-slate-200 flex justify-between items-center text-xs text-slate-400">
                 <div className="flex items-center"><MessageSquare className="w-4 h-4 mr-1 text-emerald-500" /><span>Career Vitamin</span></div>
                <span>Situation Interview Guide Script</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <MessageSquare size={64} className="mb-4 opacity-20"/>
              <p className="text-center">면접 질문과 두 가지 상황을 입력하고<br/><strong>[답변 가이드 생성]</strong>을 눌러주세요.</p>
            </div>
          )}
        </main>

        {/* 저장 버튼 */}
        {result && (
          <div className="absolute bottom-8 right-8 flex gap-3 z-50">
            <button onClick={handleDownload} className="bg-slate-900 text-white px-6 py-3 rounded-full font-bold shadow-2xl hover:-translate-y-1 flex items-center transition-transform"><Download className="mr-2" size={20}/> 이미지 저장</button>
            <button onClick={handlePdfDownload} className="bg-red-600 text-white px-6 py-3 rounded-full font-bold shadow-2xl hover:-translate-y-1 flex items-center transition-transform"><FileText className="mr-2" size={20}/> PDF 저장</button>
          </div>
        )}
      </div>
    </div>
  );
}