import React, { useState, useRef } from 'react';
import { Presentation, ChevronLeft, Lightbulb, ListChecks, Mic, Download, FileText, Loader2, CheckCircle2 } from 'lucide-react';

// [표준 SOP 준수] 공용 도구 가져오기
import { fetchGemini, saveAsPng, saveAsPdf } from '../api';
import { Toast, EditableContent } from './SharedUI';

export default function PtInterviewApp({ onClose }) {
  // --- 상태 관리 ---
  const [inputs, setInputs] = useState({ job: '', category: 'trend' }); // 직무, 주제유형
  const [topicList, setTopicList] = useState([]); // AI가 추천한 주제 5개
  const [selectedTopic, setSelectedTopic] = useState(null); // 사용자가 선택한 주제
  const [script, setScript] = useState(null); // 최종 스크립트 결과
  
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: 주제뽑기, 2: 스크립트 결과
  const [toastMsg, setToastMsg] = useState(null);
  const reportRef = useRef(null);

  const showToast = (msg) => setToastMsg(msg);

  // 1단계: PT 면접 주제 5개 뽑기
  const handleRecommendTopics = async () => {
    if (!inputs.job) return showToast("지원 직무를 입력해주세요.");
    
    setLoading(true);
    setScript(null); // 기존 결과 초기화
    setTopicList([]); 
    setSelectedTopic(null);

    try {
      const prompt = `
        지원 직무: ${inputs.job}
        면접 유형: PT 면접 (발표)
        주제 카테고리: ${inputs.category === 'trend' ? '최신 업계 트렌드 및 이슈' : '직무 관련 문제 해결 및 전략'}
        
        위 정보를 바탕으로 면접장에서 출제될 법한 [핵심 PT 발표 주제] 5가지를 리스트로 추천해줘.
        JSON 형식: { "topics": ["주제1", "주제2", "주제3", "주제4", "주제5"] }
      `;
      
      const parsed = await fetchGemini(prompt);
      if (parsed && parsed.topics) {
        setTopicList(parsed.topics);
        setStep(1); // 주제 선택 단계 유지
      } else {
        throw new Error("주제 생성 실패");
      }
    } catch (e) {
      showToast("주제 추천 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 2단계: 선택한 주제로 스크립트 생성하기
  const handleGenerateScript = async () => {
    if (!selectedTopic) return showToast("리스트에서 주제를 먼저 선택해주세요.");

    setLoading(true);
    try {
      const prompt = `
        발표 주제: ${selectedTopic}
        지원 직무: ${inputs.job}
        
        위 주제에 대해 3~5분 분량의 논리적인 PT 면접 발표 대본을 작성해줘.
        구성: 서론(현황/문제제기) - 본론(해결방안/전략 3가지) - 결론(기대효과/포부).
        
        JSON 형식:
        {
          "title": "발표 제목 (매력적으로)",
          "intro": "서론 내용...",
          "body": "본론 내용 (논리적 구조)...",
          "conclusion": "결론 및 마무리..."
        }
      `;

      const parsed = await fetchGemini(prompt);
      setScript(parsed);
      setStep(2); // 결과 화면으로 이동
    } catch (e) {
      showToast(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => saveAsPng(reportRef, `PT면접_${inputs.job}`, showToast);
  const handlePdfDownload = () => saveAsPdf(reportRef, `PT면접_${inputs.job}`, showToast);

  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col font-sans text-slate-800">
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
      
      {/* 헤더 */}
      <header className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md shrink-0">
        <div className="flex items-center gap-3"><Presentation className="text-purple-400"/><h1 className="font-bold text-lg">PT 면접 가이드</h1></div>
        <button onClick={onClose} className="flex items-center text-sm hover:text-purple-200 transition-colors"><ChevronLeft className="w-5 h-5 mr-1"/> 돌아가기</button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* 사이드바: 설정 및 주제 선택 */}
        <aside className="w-96 bg-white border-r p-6 shrink-0 overflow-y-auto flex flex-col">
          <div className="space-y-6 flex-1">
            <h3 className="font-bold text-sm text-purple-700 flex items-center uppercase tracking-wider border-b pb-2">
              <Lightbulb size={16} className="mr-2"/> 주제 선정
            </h3>
            
            {/* 입력 영역 */}
            <div className="space-y-3">
               <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">지원 직무</label>
                  <input value={inputs.job} onChange={e=>setInputs({...inputs, job:e.target.value})} className="w-full p-3 border rounded-lg text-sm font-bold focus:outline-none focus:border-purple-500" placeholder="예: 마케팅 기획, 영업관리"/>
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">출제 유형</label>
                  <select value={inputs.category} onChange={e=>setInputs({...inputs, category:e.target.value})} className="w-full p-3 border rounded-lg text-sm focus:outline-none focus:border-purple-500 bg-white">
                    <option value="trend">업계 트렌드 및 이슈 분석</option>
                    <option value="problem">직무 문제 해결 및 전략 제시</option>
                  </select>
               </div>
               <button onClick={handleRecommendTopics} disabled={loading && step===1} className="w-full bg-slate-800 text-white py-3 rounded-lg font-bold text-sm hover:bg-slate-700 transition-colors">
                  {loading && !script ? <Loader2 className="animate-spin mx-auto w-4 h-4"/> : "1단계: 주제 5개 뽑기"}
               </button>
            </div>

            {/* 주제 리스트 영역 */}
            {topicList.length > 0 && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-500 mt-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-purple-600">추천 주제 (택 1)</label>
                  <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-1 rounded-full">클릭하여 선택</span>
                </div>
                <div className="space-y-2">
                  {topicList.map((topic, idx) => (
                    <div 
                      key={idx}
                      onClick={() => setSelectedTopic(topic)}
                      className={`p-3 rounded-lg text-sm cursor-pointer border transition-all flex items-start gap-2
                        ${selectedTopic === topic 
                          ? 'bg-purple-50 border-purple-500 text-purple-900 font-bold shadow-md transform scale-[1.02]' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-purple-200'
                        }`}
                    >
                      <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${selectedTopic === topic ? 'bg-purple-500 border-purple-500' : 'border-slate-300'}`}>
                        {selectedTopic === topic && <CheckCircle2 size={10} className="text-white"/>}
                      </div>
                      <span className="leading-snug">{topic}</span>
                    </div>
                  ))}
                </div>

                {/* 스크립트 생성 버튼 (주제가 선택되었을 때만 활성화) */}
                <button 
                  onClick={handleGenerateScript} 
                  disabled={loading || !selectedTopic}
                  className={`w-full py-4 rounded-xl font-bold mt-6 shadow-lg transition-all flex items-center justify-center gap-2
                    ${!selectedTopic 
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                      : 'bg-purple-600 text-white hover:bg-purple-700 hover:-translate-y-1'
                    }`}
                >
                  {loading && script ? <Loader2 className="animate-spin w-5 h-5"/> : <><FileText size={18}/> 2단계: 발표 스크립트 작성</>}
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* 메인 결과 화면 */}
        <main className="flex-1 p-8 overflow-y-auto flex justify-center bg-slate-50">
          {script ? (
            <div ref={reportRef} className="w-[210mm] min-h-[297mm] h-fit bg-white shadow-lg p-12 flex flex-col animate-in fade-in zoom-in-95 duration-500 relative">
              
              <div className="border-b-4 border-purple-600 pb-6 text-center mb-8">
                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-bold tracking-wider mb-3 inline-block">PT INTERVIEW SCRIPT</span>
                <h2 className="text-xl font-bold text-slate-500 mb-2">{inputs.job} 직무</h2>
                <EditableContent className="text-2xl font-extrabold text-slate-900 text-center leading-tight" value={script.title} onSave={(v)=>setScript({...script, title: v})} />
              </div>

              <div className="space-y-8 flex-1 text-slate-700 leading-relaxed">
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                   <h3 className="font-bold text-purple-700 mb-3 flex items-center"><Mic size={18} className="mr-2"/> 서론 (Intro)</h3>
                   <EditableContent value={script.intro} onSave={(v)=>setScript({...script, intro: v})} />
                </div>

                <div className="pl-4 border-l-4 border-purple-200 py-2">
                   <h3 className="font-bold text-purple-700 mb-3 flex items-center"><ListChecks size={18} className="mr-2"/> 본론 (Body)</h3>
                   <EditableContent value={script.body} onSave={(v)=>setScript({...script, body: v})} />
                </div>

                <div className="bg-purple-50 p-6 rounded-xl border border-purple-100">
                   <h3 className="font-bold text-purple-700 mb-3 flex items-center"><CheckCircle2 size={18} className="mr-2"/> 결론 (Conclusion)</h3>
                   <EditableContent value={script.conclusion} onSave={(v)=>setScript({...script, conclusion: v})} />
                </div>
              </div>

              <div className="mt-12 pt-6 border-t border-slate-200 flex justify-between items-center text-xs text-slate-400">
                <div className="flex items-center"><Presentation className="w-4 h-4 mr-1 text-purple-500" /><span>Career Vitamin AI</span></div>
                <span>Generated by Gemini Pro</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Presentation size={64} className="mb-4 opacity-20 text-purple-500"/>
              <p className="text-center leading-relaxed">
                먼저 직무를 입력하고 <strong>주제를 추천</strong>받으세요.<br/>
                마음에 드는 주제를 <strong>선택</strong>하면 스크립트가 완성됩니다.
              </p>
            </div>
          )}
        </main>

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