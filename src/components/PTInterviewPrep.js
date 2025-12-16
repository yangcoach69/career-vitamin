// src/components/PTInterviewPrep.js
import React, { useState, useRef } from 'react';
import { 
  Presentation, ChevronLeft, Loader2, 
  Lightbulb, CheckCircle, MonitorPlay, Download, FileText, Building2, Briefcase, Megaphone
} from 'lucide-react';
import { fetchGemini, saveAsPng, saveAsPdf } from '../api';
import { Toast, EditableContent } from './SharedUI';

export default function PTInterviewPrep({ onClose }) {
  // 입력 상태 관리
  const [inputs, setInputs] = useState({
    company: '',
    job: '',
    topic: ''
  });
  
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const reportRef = useRef(null);

  const showToast = (msg) => setToastMsg(msg);

  const handleGenerate = async () => {
    // 필수값 체크
    if (!inputs.company.trim()) return showToast("지원하시는 기업명을 입력해주세요.");
    if (!inputs.job.trim()) return showToast("지원하시는 직무명을 입력해주세요.");
    if (!inputs.topic.trim()) return showToast("PT 발표 주제를 입력해주세요.");
    
    setLoading(true);
    try {
      const prompt = `
      당신은 대기업 PT 면접관 출신의 취업 컨설턴트입니다.
      지원자가 입력한 [기업, 직무, 주제]를 바탕으로, 현장에서 즉시 발표 가능한 수준의 **고득점 PT 발표 스크립트**를 작성해주세요.

      [입력 정보]
      1. 기업명: ${inputs.company}
      2. 지원 직무: ${inputs.job}
      3. PT 주제: ${inputs.topic}

      [작성 가이드]
      - 발표 시간: 약 3~5분 분량
      - 구성: 서론(현황/이슈) -> 본론(해결방안/아이디어 3가지) -> 결론(기대효과/포부)
      - 말투: "안녕하십니까, 지원자 OOO입니다. 지금부터 ~에 대해 발표하겠습니다." 와 같은 정중하고 자신감 있는 구어체(하십시오체).
      - 내용은 해당 기업과 직무의 최신 트렌드나 실제 사업 내용을 반영하여 전문성 있게 구성할 것.

      [JSON 출력 형식]
      {
        "slide_title": "PT 발표 제목 (핵심을 관통하는 카피)",
        "opening": "도입부 스크립트 (인사, 주제 선정 배경, 현황 분석)",
        "body_points": [
          { "title": "핵심 방안 1", "script": "첫 번째 방안에 대한 상세 설명 스크립트" },
          { "title": "핵심 방안 2", "script": "두 번째 방안에 대한 상세 설명 스크립트" },
          { "title": "핵심 방안 3", "script": "세 번째 방안에 대한 상세 설명 스크립트" }
        ],
        "closing": "마무리 스크립트 (요약, 기대효과, 입사 후 포부, 끝인사)",
        "qna_prep": ["예상 질문 1", "예상 질문 2"]
      }`;

      const parsed = await fetchGemini(prompt);
      setResult(parsed);
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
        {/* 사이드바: 입력창 */}
        <aside className="w-80 bg-white border-r p-6 shrink-0 overflow-y-auto">
          <div className="space-y-5">
            <h3 className="font-bold text-sm text-slate-800 flex items-center border-b pb-2">
              <MonitorPlay size={16} className="mr-2"/> 발표 준비 설정
            </h3>
            
            {/* 기업명 */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">지원 기업명 <span className="text-red-500">*</span></label>
              <div className="relative">
                <input 
                  value={inputs.company}
                  onChange={(e) => setInputs({...inputs, company: e.target.value})}
                  className="w-full p-2.5 pl-9 border rounded-lg text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none" 
                  placeholder="예: 현대자동차" 
                />
                <Building2 className="absolute left-3 top-2.5 text-slate-400 w-4 h-4"/>
              </div>
            </div>

            {/* 직무명 */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">지원 직무 <span className="text-red-500">*</span></label>
              <div className="relative">
                <input 
                  value={inputs.job}
                  onChange={(e) => setInputs({...inputs, job: e.target.value})}
                  className="w-full p-2.5 pl-9 border rounded-lg text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none" 
                  placeholder="예: 해외영업, R&D" 
                />
                <Briefcase className="absolute left-3 top-2.5 text-slate-400 w-4 h-4"/>
              </div>
            </div>

            {/* PT 주제 */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">PT 발표 주제 <span className="text-red-500">*</span></label>
              <textarea 
                value={inputs.topic}
                onChange={(e) => setInputs({...inputs, topic: e.target.value})}
                className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none h-32 resize-none" 
                placeholder="예: 2030 세대를 타겟으로 한 신규 마케팅 전략을 제안하시오." 
              />
            </div>

            <button 
              onClick={handleGenerate} 
              disabled={loading} 
              className="w-full bg-orange-600 text-white py-3.5 rounded-xl font-bold mt-2 shadow-lg hover:bg-orange-700 transition-all disabled:bg-slate-400"
            >
              {loading ? <Loader2 className="animate-spin mx-auto"/> : "PT 스크립트 생성"}
            </button>
          </div>
        </aside>

        {/* 결과 화면 */}
        <main className="flex-1 p-8 overflow-y-auto flex justify-center bg-slate-50">
          {result ? (
            <div ref={reportRef} className="w-[210mm] min-h-[297mm] h-fit bg-white shadow-2xl p-12 flex flex-col animate-in fade-in zoom-in-95 duration-500 relative">
              
              {/* 타이틀 */}
              <div className="border-b-4 border-orange-600 pb-6 mb-8">
                <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-bold tracking-wider mb-3 inline-block">PT PRESENTATION</span>
                <EditableContent className="text-3xl font-extrabold text-slate-900 mb-2" value={result.slide_title} onSave={(v)=>handleEdit('slide_title', null, v)} />
                <div className="flex gap-4 text-sm text-slate-500 mt-2 font-medium">
                    <span className="flex items-center"><Building2 size={14} className="mr-1"/> {inputs.company}</span>
                    <span className="flex items-center"><Briefcase size={14} className="mr-1"/> {inputs.job}</span>
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
              <p className="text-center">기업/직무와 주제를 입력하면<br/><strong>AI가 실전 PT 스크립트를 작성합니다.</strong></p>
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