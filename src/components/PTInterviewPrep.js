import React, { useState, useRef } from 'react';
import { 
  Presentation, ChevronLeft, Loader2, 
  Lightbulb, CheckCircle, MonitorPlay, Download, FileText, 
  Building2, Briefcase, Megaphone, List, Keyboard
} from 'lucide-react';
import { fetchGemini, saveAsPng, saveAsPdf } from '../api';
import { Toast, EditableContent } from './SharedUI';

export default function PTInterviewPrepApp({ onClose }) {
  const [activeTab, setActiveTab] = useState('recommend');
  const [inputs, setInputs] = useState({ company: '', job: '', request: '', topic: '' });
  const [topics, setTopics] = useState(null); 
  const [selectedTopicIdx, setSelectedTopicIdx] = useState(null); 
  const [result, setResult] = useState(null); 
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const reportRef = useRef(null);

  const showToast = (msg) => setToastMsg(msg);

  // [안전장치] 데이터 정규화 (api.js 도움 없이 스스로 해결)
  const normalizeToArray = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (typeof data === 'string') return [data];
    if (typeof data === 'object') return Object.values(data);
    return [];
  };

  // 1. [탭1] AI 주제 추천 받기
  const handleGetTopics = async () => {
    if (!inputs.company.trim()) return showToast("지원 기업명을 입력해주세요.");
    if (!inputs.job.trim()) return showToast("지원 직무명을 입력해주세요.");

    setLoading(true);
    setTopics(null); 
    setSelectedTopicIdx(null);
    setResult(null);

    try {
      // 마크다운 제거를 위한 강력한 프롬프트 지침 추가
      const prompt = `
      당신은 기업 채용 면접 출제 위원입니다.
      
      [지시사항]
      지원자의 정보를 바탕으로 'PT 면접 예상 주제' 5가지를 추천해주세요.
      **중요: 응답에 \`\`\`json 이나 \`\`\` 같은 마크다운 기호를 절대 포함하지 마십시오.**
      **오직 순수한 JSON 텍스트만 반환하십시오.**

      [지원 정보]
      1. 기업명: ${inputs.company}
      2. 지원 직무: ${inputs.job}
      3. 추가 요청사항: ${inputs.request || '최신 트렌드 반영'}

      [출력 포맷 Example]
      {
        "topics": [
          "주제 1 내용...",
          "주제 2 내용...",
          "주제 3 내용...",
          "주제 4 내용...",
          "주제 5 내용..."
        ]
      }`;

      const data = await fetchGemini(prompt);
      
      let safeTopics = [];
      if (data && data.topics) safeTopics = normalizeToArray(data.topics);
      else if (Array.isArray(data)) safeTopics = data;

      if (safeTopics.length > 0) {
        setTopics(safeTopics);
      } else {
        throw new Error("주제 생성 실패 (데이터 형식 오류)");
      }
    } catch (e) {
      showToast("주제 추천 실패: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. [공통] 스크립트 생성
  const handleGenerateScript = async (selectedTopic = null) => {
    const finalTopic = selectedTopic || inputs.topic;

    if (!inputs.company.trim()) return showToast("지원 기업명을 입력해주세요.");
    if (!inputs.job.trim()) return showToast("지원 직무명을 입력해주세요.");
    if (!finalTopic || !finalTopic.trim()) return showToast("PT 발표 주제가 없습니다.");

    if (!selectedTopic) setInputs(prev => ({ ...prev, topic: finalTopic }));

    setLoading(true);
    try {
      const prompt = `
      당신은 PT 면접 컨설턴트입니다.
      
      [지시사항]
      입력된 주제로 '3분 PT 발표 스크립트'를 작성해주세요.
      **중요: 응답에 \`\`\`json 이나 \`\`\` 같은 마크다운 기호를 절대 포함하지 마십시오.**
      **오직 순수한 JSON 텍스트만 반환하십시오.**

      [입력 정보]
      1. 기업명: ${inputs.company}
      2. 지원 직무: ${inputs.job}
      3. PT 주제: ${finalTopic}

      [출력 포맷 Example]
      {
        "slide_title": "제목",
        "opening": "도입부 스크립트",
        "body_points": [
          { "title": "핵심1", "script": "내용1" },
          { "title": "핵심2", "script": "내용2" },
          { "title": "핵심3", "script": "내용3" }
        ],
        "closing": "마무리 스크립트",
        "qna_prep": ["질문1", "질문2"]
      }`;

      const parsed = await fetchGemini(prompt);
      
      if (parsed.body_points) parsed.body_points = normalizeToArray(parsed.body_points);
      if (parsed.qna_prep) parsed.qna_prep = normalizeToArray(parsed.qna_prep);

      setResult(parsed);
      
      if (selectedTopic) setInputs(prev => ({ ...prev, topic: selectedTopic }));
      
    } catch (e) {
      showToast("스크립트 생성 실패: " + e.message);
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
        
        <aside className="w-[400px] bg-white border-r flex flex-col shrink-0">
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

          <div className="p-6 overflow-y-auto flex-1 space-y-5">
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
                    {loading ? <Loader2 className="animate-spin mx-auto"/> : "예상 주제 5개 뽑기"}
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-orange-600">추천 주제 (선택해주세요)</span>
                      <button onClick={() => setTopics(null)} className="text-xs text-slate-400 underline hover:text-slate-600">다시 뽑기</button>
                    </div>
                    
                    <div className="space-y-2">
                      {topics.map((t, i) => (
                        <div 
                          key={i} 
                          onClick={() => !loading && setSelectedTopicIdx(i)}
                          className={`p-3 text-sm rounded-lg border cursor-pointer transition-all leading-relaxed
                            ${selectedTopicIdx === i 
                                ? 'bg-orange-50 border-orange-500 text-orange-900 ring-1 ring-orange-500 shadow-sm' 
                                : 'bg-white border-slate-200 text-slate-600 hover:border-orange-200 hover:bg-slate-50'
                            }`}
                        >
                          <div className="flex gap-2">
                             <span className={`font-bold shrink-0 ${selectedTopicIdx === i ? 'text-orange-600' : 'text-slate-400'}`}>{i+1}.</span>
                             <span>{t}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {selectedTopicIdx !== null && (
                        <button 
                            onClick={() => handleGenerateScript(topics[selectedTopicIdx])}
                            disabled={loading}
                            className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-orange-700 transition-all animate-in slide-in-from-bottom-2 disabled:bg-slate-400"
                        >
                            {loading ? <Loader2 className="animate-spin mx-auto"/> : "선택한 주제로 스크립트 작성"}
                        </button>
                    )}
                  </div>
                )}
              </div>
            )}

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
            
            {result && (
              <div className="text-center mt-4">
                <button onClick={() => { setResult(null); setSelectedTopicIdx(null); }} className="text-sm text-slate-500 underline hover:text-orange-500">
                  다른 주제로 다시 하기
                </button>
              </div>
            )}
          </div>
        </aside>

        <main className="flex-1 p-8 overflow-y-auto flex justify-center bg-slate-50">
          {result ? (
            <div ref={reportRef} className="w-[210mm] min-h-[297mm] h-fit bg-white shadow-2xl p-12 flex flex-col animate-in fade-in zoom-in-95 duration-500 relative">
              
              <div className="border-b-4 border-orange-600 pb-6 mb-8">
                <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-bold tracking-wider mb-3 inline-block">PT PRESENTATION</span>
                <EditableContent className="text-3xl font-extrabold text-slate-900 mb-2" value={result.slide_title} onSave={(v)=>handleEdit('slide_title', null, v)} />
                <div className="flex flex-col gap-1 text-sm text-slate-500 mt-2 font-medium">
                    <div className="flex items-center"><Building2 size={14} className="mr-2"/> {inputs.company} / {inputs.job}</div>
                    <div className="flex items-start"><MonitorPlay size={14} className="mr-2 mt-1 shrink-0"/> <span className="text-orange-600 font-bold">Q. {inputs.topic}</span></div>
                </div>
              </div>

              <div className="space-y-8 mb-10">
                <section>
                   <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center"><Megaphone className="mr-2 text-orange-500"/> Opening (도입)</h3>
                   <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-slate-700 leading-relaxed text-justify">
                     <EditableContent value={result.opening} onSave={(v)=>handleEdit('opening', null, v)} />
                   </div>
                </section>

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

                <section>
                   <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center"><CheckCircle className="mr-2 text-orange-500"/> Closing (마무리)</h3>
                   <div className="bg-orange-50 p-5 rounded-xl border border-orange-200 text-slate-800 leading-relaxed font-medium">
                     <EditableContent value={result.closing} onSave={(v)=>handleEdit('closing', null, v)} />
                   </div>
                </section>

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

              <div className="mt-auto bg-slate-800 text-slate-300 p-5 rounded-xl text-xs leading-relaxed flex gap-3 shadow-inner">
                <Lightbulb className="shrink-0 text-yellow-400 w-5 h-5 mt-1"/>
                <div>
                  <p className="font-bold text-white mb-1">💡 PT 면접 실전 가이드</p>
                  <p>
                    최근 발표 PT면접은 현장에서 주제 및 참고 제시문과 함께 20분 내외의 준비시간이 주어집니다. 
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
              <p className="text-center mt-4 whitespace-pre-line">
                {activeTab === 'recommend' ? 
                  "기업 정보를 입력하고\n[예상 주제 5개 뽑기]를 눌러보세요." : 
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