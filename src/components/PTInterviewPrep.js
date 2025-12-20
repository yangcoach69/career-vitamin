import React, { useState, useRef } from 'react';
import { Presentation, ChevronLeft, Lightbulb, ListChecks, Mic, Download, FileText, Loader2, CheckCircle2, Sparkles, PenTool } from 'lucide-react';

// [표준 SOP 준수] 공용 도구 가져오기
import { fetchGemini, saveAsPng, saveAsPdf } from '../api';
import { Toast, EditableContent, Footer } from './SharedUI';

export default function PtInterviewApp({ onClose }) {
  // --- 상태 관리 ---
  const [activeTab, setActiveTab] = useState('ai'); // 'ai' (AI 추출) | 'direct' (직접 입력)
  
  // 입력값
  const [inputs, setInputs] = useState({ 
    company: '', 
    job: '', 
    request: '' // 옵션 요청사항
  });
  const [directTopic, setDirectTopic] = useState(''); // 직접 입력 탭의 주제

  // 결과값
  const [topicList, setTopicList] = useState([]); // AI 추천 주제 5개
  const [selectedTopic, setSelectedTopic] = useState(null); // 선택된 주제
  const [script, setScript] = useState(null); // 최종 스크립트
  
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const reportRef = useRef(null);

  const showToast = (msg) => setToastMsg(msg);

  // [1단계] AI 주제 5개 추천받기 (AI 추출 탭)
  const handleRecommendTopics = async () => {
    if (!inputs.company) return showToast("지원 기업명을 입력해주세요.");
    if (!inputs.job) return showToast("지원 직무를 입력해주세요.");
    
    setLoading(true);
    setScript(null);
    setTopicList([]); 
    setSelectedTopic(null);

    try {
      const prompt = `
        [PT 면접 주제 추천 요청]
        1. 지원 기업: ${inputs.company}
        2. 지원 직무: ${inputs.job}
        3. 추가 요청사항: ${inputs.request || '없음'}
        
        위 정보를 바탕으로 해당 기업과 직무에서 실제 출제될 법한 **핵심 PT 면접 주제 5가지**를 추천해줘.
        - 기업의 최근 이슈나 직무 연관성을 높여서 구체적으로 작성할 것.
        - JSON 형식: { "topics": ["주제1", "주제2", "주제3", "주제4", "주제5"] }
      `;
      
      const parsed = await fetchGemini(prompt);
      if (parsed && parsed.topics) {
        setTopicList(parsed.topics);
      } else {
        throw new Error("주제 생성 실패");
      }
    } catch (e) {
      showToast(e.message);
    } finally {
      setLoading(false);
    }
  };

  // [2단계] 스크립트 생성하기 (공통)
  const handleGenerateScript = async () => {
    // 1. 필수값 체크
    if (!inputs.company || !inputs.job) return showToast("기업명과 직무를 먼저 입력해주세요.");

    // 2. 주제 결정 (탭에 따라 다름)
    let targetTopic = '';
    if (activeTab === 'ai') {
        if (!selectedTopic) return showToast("리스트에서 주제를 선택해주세요.");
        targetTopic = selectedTopic;
    } else {
        if (!directTopic) return showToast("발표할 주제를 입력해주세요.");
        targetTopic = directTopic;
    }

    setLoading(true);
    try {
      const prompt = `
        [PT 면접 발표 스크립트 작성]
        - 발표 주제: ${targetTopic}
        - 지원 기업: ${inputs.company}
        - 지원 직무: ${inputs.job}
        
        위 주제에 대해 3~5분 분량의 논리적인 PT 면접 발표 대본을 작성해줘.
        구성은 '서론(현황/문제제기) - 본론(해결방안/전략 3가지) - 결론(기대효과/포부)' 흐름으로 작성할 것.
        
        JSON 형식:
        {
          "title": "발표 제목 (매력적으로)",
          "intro": "서론 내용...",
          "body": "본론 내용 (전략 1, 2, 3 포함)...",
          "conclusion": "결론 및 마무리..."
        }
      `;

      const parsed = await fetchGemini(prompt);
      setScript(parsed);
    } catch (e) {
      showToast(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => saveAsPng(reportRef, `PT면접_${inputs.company}`, showToast);
  const handlePdfDownload = () => saveAsPdf(reportRef, `PT면접_${inputs.company}`, showToast);

  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col font-sans text-slate-800">
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
      
      {/* 헤더 */}
      <header className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md shrink-0">
        <div className="flex items-center gap-3"><Presentation className="text-purple-400"/><h1 className="font-bold text-lg">PT 면접 가이드</h1></div>
        <button onClick={onClose} className="flex items-center text-sm hover:text-purple-200 transition-colors"><ChevronLeft className="w-5 h-5 mr-1"/> 돌아가기</button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* 사이드바: 입력 및 설정 */}
        <aside className="w-[400px] bg-white border-r p-6 shrink-0 overflow-y-auto flex flex-col">
          <div className="space-y-6 flex-1">
            
            {/* 공통 필수 입력란 */}
            <div className="space-y-3 pb-4 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-800">기본 설정 (필수)</h3>
                <div className="grid grid-cols-2 gap-2">
                    <input value={inputs.company} onChange={e=>setInputs({...inputs, company:e.target.value})} className="p-3 border rounded-lg text-sm font-bold focus:outline-purple-500" placeholder="지원 기업명"/>
                    <input value={inputs.job} onChange={e=>setInputs({...inputs, job:e.target.value})} className="p-3 border rounded-lg text-sm font-bold focus:outline-purple-500" placeholder="지원 직무"/>
                </div>
                <input value={inputs.request} onChange={e=>setInputs({...inputs, request:e.target.value})} className="w-full p-3 border rounded-lg text-sm focus:outline-purple-500" placeholder="(선택) 예: 최근 기업 이슈 반영해줘"/>
            </div>

            {/* 탭 버튼 */}
            <div className="flex bg-slate-100 p-1 rounded-lg">
                <button 
                    onClick={() => setActiveTab('ai')}
                    className={`flex-1 py-2 text-sm font-bold rounded-md flex items-center justify-center gap-1 transition-all ${activeTab === 'ai' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500'}`}
                >
                    <Sparkles size={14}/> AI 주제 추출
                </button>
                <button 
                    onClick={() => setActiveTab('direct')}
                    className={`flex-1 py-2 text-sm font-bold rounded-md flex items-center justify-center gap-1 transition-all ${activeTab === 'direct' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500'}`}
                >
                    <PenTool size={14}/> 직접 입력
                </button>
            </div>

            {/* 탭 내용: AI 추출 */}
            {activeTab === 'ai' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-300">
                    <button onClick={handleRecommendTopics} disabled={loading && !topicList.length} className="w-full bg-slate-800 text-white py-3 rounded-lg font-bold text-sm hover:bg-slate-700 transition-colors">
                        {loading && !topicList.length ? <Loader2 className="animate-spin mx-auto w-4 h-4"/> : "주제 5개 뽑기"}
                    </button>

                    {topicList.length > 0 && (
                        <div className="space-y-2 mt-2">
                            <label className="text-xs font-bold text-purple-600">주제 선택 (Click)</label>
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
                            
                            <button 
                                onClick={handleGenerateScript} 
                                disabled={loading || !selectedTopic}
                                className="w-full bg-purple-600 text-white py-4 rounded-xl font-bold mt-4 shadow-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin w-5 h-5"/> : "발표 스크립트 생성"}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* 탭 내용: 직접 입력 */}
            {activeTab === 'direct' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">발표 주제 / 질문 입력</label>
                        <textarea 
                            value={directTopic} 
                            onChange={e=>setDirectTopic(e.target.value)} 
                            className="w-full p-3 border rounded-lg h-32 resize-none text-sm focus:outline-purple-500" 
                            placeholder="예: 우리 회사의 2030 비전 달성을 위한 마케팅 전략을 제시하시오."
                        />
                    </div>
                    <button 
                        onClick={handleGenerateScript} 
                        disabled={loading}
                        className="w-full bg-purple-600 text-white py-4 rounded-xl font-bold mt-4 shadow-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin w-5 h-5"/> : "바로 콘텐츠 생성"}
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
                <h2 className="text-xl font-bold text-slate-500 mb-2">{inputs.company} / {inputs.job}</h2>
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

                {/* 하단 조언 메시지 (요청사항 반영) */}
                <div className="mt-8 p-4 bg-slate-800 text-white text-xs leading-relaxed rounded-lg opacity-90">
                    <p className="font-bold text-yellow-400 mb-1">💡 Coach's Advice</p>
                    "기업마다 차이는 있으나, 대개 보도자료 등의 제시문을 주고 발표 주제를 정리할 시간이 주어집니다. (20분 내외). 
                    사전 지식이 충분하지 않다면, 주어진 시간에 제시문만 가지고 발표 내용을 구조화하는 것은 매우 어렵습니다. 
                    다양한 주제 Report 로 학습을 하고, 10분 내로 구조화(요약) 해보는 연습을 해보시기 바랍니다. 
                    지식 습득과 면접 연습이라는 1석 2조의 효과를 얻게 되실 겁니다"
                </div>
              </div>

              
              <Footer />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Presentation size={64} className="mb-4 opacity-20 text-purple-500"/>
              <p className="text-center leading-relaxed">
                좌측에서 <strong>AI 주제 추출</strong>을 하거나<br/>
                <strong>직접 주제를 입력</strong>하여 스크립트를 생성해보세요.
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