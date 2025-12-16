import React, { useState, useRef } from 'react';
import { 
  Presentation, ChevronLeft, Loader2, 
  Lightbulb, CheckCircle, MonitorPlay, Download, FileText, 
  Building2, Briefcase, Megaphone, List, Keyboard, ArrowRight
} from 'lucide-react';
import { fetchGemini, saveAsPng, saveAsPdf } from '../api';
import { Toast, EditableContent } from './SharedUI';

export default function PTInterviewPrepApp({ onClose }) {
  // 탭 상태: 'recommend' (주제 추천) | 'direct' (직접 입력)
  const [activeTab, setActiveTab] = useState('recommend');
  
  // 입력값 관리
  const [inputs, setInputs] = useState({
    company: '',
    job: '',
    request: '', // 기타 요청사항 (옵션)
    topic: ''    // 최종 선택된 주제
  });

  // 데이터 상태
  const [topics, setTopics] = useState(null); // 추천된 15개 주제
  const [result, setResult] = useState(null); // 최종 스크립트 결과
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const reportRef = useRef(null);

  const showToast = (msg) => setToastMsg(msg);

  // 1. [탭1] AI 주제 추천 받기 (15개)
  const handleGetTopics = async () => {
    if (!inputs.company.trim()) return showToast("지원 기업명을 입력해주세요.");
    if (!inputs.job.trim()) return showToast("지원 직무명을 입력해주세요.");

    setLoading(true);
    setTopics(null); // 초기화
    setResult(null);

    try {
      const prompt = `
      당신은 기업 채용 및 PT 면접 출제 위원입니다.
      지원자의 [기업, 직무, 요청사항]을 분석하여, 실제 PT 면접에 나올법한 **예상 출제 주제 15가지**를 뽑아주세요.

      [지원 정보]
      1. 기업명: ${inputs.company}
      2. 지원 직무: ${inputs.job}
      3. 추가 요청사항: ${inputs.request || '최신 트렌드 및 직무 이슈 반영'}

      [출력 요구사항]
      - 주제는 직무 전문성, 시사 이슈, 문제 해결 능력을 볼 수 있는 것으로 구성할 것.
      - JSON 포맷으로 "topics" 배열에 문자열 15개를 담아줄 것.
      
      Example JSON:
      {
        "topics": [
          "주제 1...",
          "주제 2...",
          ...
        ]
      }`;

      const data = await fetchGemini(prompt);
      if (data && data.topics) {
        setTopics(data.topics);
      } else {
        throw new Error("주제 생성 실패");
      }
    } catch (e) {
      showToast("주제 추천 중 오류가 발생했습니다: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. [공통] PT 스크립트 생성하기 (주제 선택 or 직접 입력)
  const handleGenerateScript = async (selectedTopic = null) => {
    const finalTopic = selectedTopic || inputs.topic;

    if (!inputs.company.trim()) return showToast("지원 기업명을 입력해주세요.");
    if (!inputs.job.trim()) return showToast("지원 직무명을 입력해주세요.");
    if (!finalTopic.trim()) return showToast("PT 발표 주제가 없습니다.");

    // 직접 입력 탭일 때 inputs.topic 업데이트
    if (!selectedTopic) setInputs(prev => ({ ...prev, topic: finalTopic }));

    setLoading(true);
    try {
      const prompt = `
      당신은 대기업 PT 면접관 출신의 취업 컨설턴트입니다.
      지원자가 입력한 정보를 바탕으로 **고득점 PT 발표 스크립트**를 작성해주세요.

      [입력 정보]
      1. 기업명: ${inputs.company}
      2. 지원 직무: ${inputs.job}
      3. PT 주제: ${finalTopic}

      [작성 가이드]
      - 발표 시간: 약 3~5분 분량
      - 구성: 서론(현황/이슈) -> 본론(해결방안/아이디어 3가지) -> 결론(기대효과/포부)
      - 말투: "안녕하십니까, 지원자 OOO입니다." 와 같은 정중하고 자신감 있는 구어체.
      - 내용은 뜬구름 잡는 소리가 아닌, 구체적이고 논리적인 근거를 댈 것.

      [JSON 출력 형식]
      {
        "slide_title": "PT 발표 제목 (핵심을 관통하는 카피)",
        "opening": "도입부 스크립트 (인사, 현황 분석)",
        "body_points": [
          { "title": "핵심 방안 1", "script": "상세 설명 스크립트" },
          { "title": "핵심 방안 2", "script": "상세 설명 스크립트" },
          { "title": "핵심 방안 3", "script": "상세 설명 스크립트" }
        ],
        "closing": "마무리 스크립트 (요약, 기대효과, 포부)",
        "qna_prep": ["예상 질문 1", "예상 질문 2"]
      }`;

      const parsed = await fetchGemini(prompt);
      setResult(parsed);
      // 만약 주제 추천 탭에서 생성했다면, topic input에도 넣어줌 (표시용)
      if (selectedTopic) setInputs(prev => ({ ...prev, topic: selectedTopic }));
      
    } catch (e) {
      showToast(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (section, key, value, index = null) => {
    setResult(prev => {
      const newData = { ...prev };
      if (section === 'body_points' && index !== null) {
        newData[section][index][key] = value;
      } else if (section === 'qna_prep' && index !== null) {
        newData[section][index] = value;
      } else {
        newData[section] = value;
      }
      return newData;
    });
  };

  const handleDownload = () => saveAsPng(reportRef, `PT면접_${inputs.company}`, showToast);
  const handlePdfDownload = () => saveAsPdf(reportRef, `PT면접_${inputs.company}`, showToast);

  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col font-sans text-slate-800">
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
      
      {/* 헤더 */}
      <header className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <Presentation className="text-orange-400"/>
          <h1 className="font-bold text-lg">실전 PT 면접 가이드</h1>
        </div>
        <button onClick={onClose} className="flex items-center text-sm hover:text-orange-200 transition-colors">
          <ChevronLeft className="w-5 h-5 mr-1"/> 돌아가기
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        
        {/* 사이드바 (입력 및 탭) - 결과가 없을 때만 넓게 보여주고, 결과 있으면 좁게? -> UI 일관성을 위해 고정 */}
        <aside className="w-[400px] bg-white border-r flex flex-col shrink-0">
          
          {/* 탭 버튼 */}
          <div className="flex border-b">
            <button 
              onClick={() => { setActiveTab('recommend'); setResult(null); }}
              className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === 'recommend' ? 'bg-orange-50 text-orange-600 border-b-2 border-orange-500' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <List size={16}/> AI 주제 추천
            </button>
            <button 
              onClick={() => { setActiveTab('direct'); setResult(null); }}
              className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === 'direct' ? 'bg-orange-50 text-orange-600 border-b-2 border-orange-500' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <Keyboard size={16}/> 주제 직접 입력
            </button>
          </div>

          {/* 입력 폼 영역 */}
          <div className="p-6 overflow-y-auto flex-1 space-y-5">
            
            {/* 공통 입력 (기업/직무) */}
            <div className="space-y-4 pb-4 border-b border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">지원 기업명 <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input 
                    value={inputs.company}
                    onChange={(e) => setInputs({...inputs, company: e.target.value})}
                    className="w-full p-2.5 pl-9 border rounded-lg text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none" 
                    placeholder="예: 삼성전자" 
                  />
                  <Building2 className="absolute left-3 top-2.5 text-slate-400 w-4 h-4"/>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">지원 직무 <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input 
                    value={inputs.job}
                    onChange={(e) => setInputs({...inputs, job: e.target.value})}
                    className="w-full p-2.5 pl-9 border rounded-lg text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none" 
                    placeholder="예: 마케팅, SW개발" 
                  />
                  <Briefcase className="absolute left-3 top-2.5 text-slate-400 w-4 h-4"/>
                </div>
              </div>
            </div>

            {/* 탭 1: 주제 추천 */}
            {activeTab === 'recommend' && !result && (
              <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">기타 요청사항 (선택)</label>
                  <textarea 
                    value={inputs.request}
                    onChange={(e) => setInputs({...inputs, request: e.target.value})}
                    className="w-full p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none h-20 resize-none" 
                    placeholder="예: 최근 신년사 내용을 반영해주세요." 
                  />
                </div>
                
                {!topics ? (
                  <button 
                    onClick={handleGetTopics} 
                    disabled={loading} 
                    className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold shadow hover:bg-slate-700 transition-all disabled:bg-slate-400"
                  >
                    {loading ? <Loader2 className="animate-spin mx-auto"/> : "예상 주제 15개 뽑기"}
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-orange-600">추천 주제 목록 (클릭하여 생성)</span>
                      <button onClick={() => setTopics(null)} className="text-xs text-slate-400 underline">다시 뽑기</button>
                    </div>
                    <div className="h-[400px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                      {topics.map((t, i) => (
                        <button 
                          key={i} 
                          onClick={() => handleGenerateScript(t)}
                          disabled={loading}
                          className="w-full text-left p-3 text-xs bg-orange-50 border border-orange-100 rounded-lg hover:bg-orange-100 hover:border-orange-300 transition-all leading-relaxed"
                        >
                          <span className="font-bold text-orange-500 mr-1">{i+1}.</span> {t}
                        </button>
                      ))}
                    </div>
                    {loading && <div className="text-center py-2"><Loader2 className="animate-spin inline text-orange-500"/> 스크립트 작성 중...</div>}
                  </div>
                )}
              </div>
            )}

            {/* 탭 2: 직접 입력 */}
            {activeTab === 'direct' && !result && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                 <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">PT 주제 직접 입력 <span className="text-red-500">*</span></label>
                  <textarea 
                    value={inputs.topic}
                    onChange={(e) => setInputs({...inputs, topic: e.target.value})}
                    className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none h-40 resize-none font-bold text-slate-700" 
                    placeholder="기출 문제나 연습하고 싶은 주제를 입력하세요." 
                  />
                </div>
                <button 
                  onClick={() => handleGenerateScript()} 
                  disabled={loading} 
                  className="w-full bg-orange-600 text-white py-3.5 rounded-xl font-bold shadow-lg hover:bg-orange-700 transition-all disabled:bg-slate-400"
                >
                  {loading ? <Loader2 className="animate-spin mx-auto"/> : "PT 스크립트 생성"}
                </button>
              </div>
            )}
            
            {/* 결과가 나왔을 때, 다시 돌아가는 버튼 */}
            {result && (
              <div className="text-center mt-4">
                <button onClick={() => setResult(null)} className="text-sm text-slate-500 underline hover:text-orange-500">
                  다른 주제로 다시 하기
                </button>
              </div>
            )}

          </div>
        </aside>

        {/* 메인 결과 화면 */}
        <main className="flex-1 p-8 overflow-y-auto flex justify-center bg-slate-50">
          {result ? (
            <div ref={reportRef} className="w-[210mm] min-h-[297mm] h-fit bg-white shadow-2xl p-12 flex flex-col animate-in fade-in zoom-in-95 duration-500 relative">
              
              {/* 타이틀 */}
              <div className="border-b-4 border-orange-600 pb-6 mb-8">
                <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-bold tracking-wider mb-3 inline-block">PT PRESENTATION</span>
                <EditableContent className="text-3xl font-extrabold text-slate-900 mb-2" value={result.slide_title} onSave={(v)=>handleEdit('slide_title', null, v)} />
                <div className="flex flex-col gap-1 text-sm text-slate-500 mt-2 font-medium">
                    <div className="flex items-center"><Building2 size={14} className="mr-2"/> {inputs.company} / {inputs.job}</div>
                    <div className="flex items-start"><MonitorPlay size={14} className="mr-2 mt-1 shrink-0"/> <span className="text-orange-600 font-bold">Q. {inputs.topic}</span></div>
                </div>
              </div>

              {/* 스크립트 본문 */}
              <div className="space-y-8 mb-10">
                {/* 도입부 */}
                <section>
                   <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center"><Megaphone className="mr-2 text-orange-500"/> Opening (도입)</h3>
                   <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-slate-700 leading-relaxed text-justify">
                     <EditableContent value={result.opening} onSave={(v)=>handleEdit('opening', null, v)} />
                   </div>
                </section>

                {/* 본론 (3단 구성) */}
                <section>
                   <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center"><Lightbulb className="mr-2 text-orange-500"/> Body (본론: 핵심 해결방안)</h3>
                   <div className="space-y-4">
                      {result.body_points?.map((point, i) => (
                        <div key={i} className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
                            <h4 className="font-bold text-orange-700 mb-2 flex items-center">
                                <span className="bg-orange-100 text-orange-800 w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">{i+1}</span>
                                <EditableContent value={point.title} onSave={(v)=>handleEdit('body_points', 'title', v, i)} />
                            </h4>
                            <div className="text-slate-600 text-sm leading-relaxed pl-8">
                                <EditableContent value={point.script} onSave={(v)=>handleEdit('body_points', 'script', v, i)} />
                            </div>
                        </div>
                      ))}
                   </div>
                </section>

                {/* 결론 */}
                <section>
                   <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center"><CheckCircle className="mr-2 text-orange-500"/> Closing (마무리)</h3>
                   <div className="bg-orange-50 p-5 rounded-xl border border-orange-200 text-slate-800 leading-relaxed font-medium">
                     <EditableContent value={result.closing} onSave={(v)=>handleEdit('closing', null, v)} />
                   </div>
                </section>

                {/* 예상 질문 */}
                <section className="mt-8 pt-6 border-t border-slate-200">
                    <h4 className="font-bold text-slate-500 text-xs mb-3 uppercase tracking-wide">Q&A Prep</h4>
                    <ul className="space-y-2">
                        {result.qna_prep?.map((q, i) => (
                            <li key={i} className="text-sm text-slate-600 flex items-start">
                                <span className="text-orange-500 mr-2 font-bold">Q.</span>
                                <EditableContent value={q} onSave={(v)=>handleEdit('qna_prep', null, v, i)} />
                            </li>
                        ))}
                    </ul>
                </section>
              </div>

              {/* [요청하신 하단 메시지] */}
              <div className="mt-auto bg-slate-800 text-slate-300 p-5 rounded-xl text-xs leading-relaxed flex gap-3 shadow-inner">
                <Lightbulb className="shrink-0 text-yellow-400 w-5 h-5 mt-1"/>
                <div>
                  <p className="font-bold text-white mb-1">💡 PT 면접 실전 가이드</p>
                  <p>
                    최근 발표 PT면접은 현장에서 주제 및 참고 제시문과 함께 20분 내외의 준비시간이 주어집니다. 
                    주어진 제시문 내용만 가지고는 충분치 않습니다. 
                    구조화된 본 가이드 스크립트를 보면서 10분 내로 요약하는 연습을 한다면, 
                    관련 지식 습득과 실전 대비까지 1석 2조의 효과를 누릴 수 있습니다.
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between items-center text-xs text-slate-400">
                 <div className="flex items-center"><Presentation className="w-4 h-4 mr-1 text-orange-500" /><span>Career Vitamin AI</span></div>
                <span>Strategic PT Interview Script</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Presentation size={64} className="mb-4 opacity-20"/>
              <p className="text-center mt-4">
                {activeTab === 'recommend' ? 
                  "기업 정보를 입력하고\n[예상 주제 15개 뽑기]를 눌러보세요." : 
                  "준비된 주제를 직접 입력하고\n[PT 스크립트 생성]을 눌러보세요."}
              </p>
            </div>
          )}
        </main>

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