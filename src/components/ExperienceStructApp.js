import React, { useState, useRef } from 'react';
import { 
  PenTool, ChevronLeft, Loader2, 
  LayoutList, CheckCircle, Sparkles, Download, FileText, Star, Tag 
} from 'lucide-react';
import { fetchGemini, saveAsPng, saveAsPdf } from '../api';
import { Toast, EditableContent } from './SharedUI';

export default function ExperienceStructApp({ onClose }) {
  // 상태 관리: 키워드 추가, STAR 내용 필수
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
    // [유효성 검사] 키워드와 STAR 내용 모두 필수 입력
    if (!keyword.trim()) {
      return showToast("경험 키워드를 입력해주세요 (예: 갈등관리).");
    }
    if (!star.s.trim() || !star.t.trim() || !star.a.trim() || !star.r.trim()) {
      return showToast("S, T, A, R 모든 항목에 간단한 내용이라도 입력해야 합니다.");
    }
    
    setLoading(true);
    try {
      const prompt = `
      당신은 자기소개서 및 면접 컨설팅 전문가입니다.
      사용자가 입력한 '핵심 키워드'와 'STAR 경험'을 바탕으로, 해당 역량이 돋보이는 [경험 정리 카드]를 작성해주세요.

      [사용자 입력 정보]
      1. 강조하고 싶은 경험 키워드: ${keyword}
      2. Situation (상황): ${star.s}
      3. Task (과제/목표): ${star.t}
      4. Action (행동/노력): ${star.a}
      5. Result (결과/배운점): ${star.r}

      [요청 사항]
      1. 사용자가 입력한 키워드('${keyword}')가 잘 드러나도록 내용을 구성할 것.
      2. 경험의 제목(Title)은 호기심을 자극하는 매력적인 문장으로 뽑을 것.
      3. **자기소개서 문단**은 두괄식으로 작성하며, 500자 내외로 다듬어 줄 것.
      4. **면접 1분 스피치**는 실제 말하듯이 자연스러운 구어체로 작성할 것.
      5. 예상 꼬리질문 2가지를 날카롭게 뽑아줄 것.

      [JSON 출력 형식]
      {
        "title": "경험을 한 줄로 요약하는 매력적인 소제목",
        "essay_version": "자기소개서용 줄글 (두괄식 구성, ${keyword} 역량 강조)",
        "speech_version": "면접용 1분 답변 스크립트 (구어체)",
        "questions": ["예상 꼬리질문1", "예상 꼬리질문2"]
      }`;

      const parsed = await fetchGemini(prompt);
      setResult(parsed);
    } catch (e) {
      showToast(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (key, value, index = null) => {
    setResult(prev => {
      const newData = { ...prev };
      if (index !== null && Array.isArray(newData[key])) {
        newData[key][index] = value;
      } else {
        newData[key] = value;
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
          <h1 className="font-bold text-lg">경험 구조화 (STAR)</h1>
        </div>
        <button onClick={onClose} className="flex items-center text-sm hover:text-yellow-200 transition-colors">
          <ChevronLeft className="w-5 h-5 mr-1"/> 돌아가기
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* 사이드바: 입력란 */}
        <aside className="w-96 bg-white border-r p-6 shrink-0 overflow-y-auto">
          <div className="space-y-5">
            <h3 className="font-bold text-sm text-slate-800 flex items-center border-b pb-2">
              <LayoutList size={16} className="mr-2"/> 경험 분해하기
            </h3>
            
            {/* 1. 경험 키워드 (신규 추가) */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">경험 키워드 <span className="text-red-500">*</span></label>
              <div className="relative">
                <input 
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="w-full p-2.5 pl-9 border rounded-lg text-sm font-bold focus:ring-2 focus:ring-yellow-500 outline-none bg-yellow-50/50" 
                  placeholder="예: 갈등관리, 목표달성 등" 
                />
                <Tag className="absolute left-3 top-2.5 text-yellow-500 w-4 h-4"/>
              </div>
            </div>

            {/* S */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Situation (상황/배경) <span className="text-red-500">*</span></label>
              <textarea 
                value={star.s}
                onChange={(e) => setStar({...star, s: e.target.value})}
                className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 outline-none h-20 resize-none" 
                placeholder="어떤 조직/프로젝트였나요? 어떤 문제가 있었나요?" 
              />
            </div>
            {/* T */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Task (과제/목표) <span className="text-red-500">*</span></label>
              <textarea 
                value={star.t}
                onChange={(e) => setStar({...star, t: e.target.value})}
                className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 outline-none h-20 resize-none" 
                placeholder="당신에게 주어진 역할이나 목표는 무엇이었나요?" 
              />
            </div>
            {/* A */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Action (행동/노력) <span className="text-red-500">*</span></label>
              <textarea 
                value={star.a}
                onChange={(e) => setStar({...star, a: e.target.value})}
                className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 outline-none h-24 resize-none" 
                placeholder="구체적으로 어떤 행동을 했나요? 나의 기여도는?" 
              />
            </div>
            {/* R */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Result (결과/배운점) <span className="text-red-500">*</span></label>
              <textarea 
                value={star.r}
                onChange={(e) => setStar({...star, r: e.target.value})}
                className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 outline-none h-20 resize-none" 
                placeholder="정량적 성과(수치)나 깨달은 점은 무엇인가요?" 
              />
            </div>

            <button 
              onClick={handleGenerate} 
              disabled={loading} 
              className="w-full bg-yellow-500 text-white py-3.5 rounded-xl font-bold mt-2 shadow-lg hover:bg-yellow-600 transition-all disabled:bg-slate-400"
            >
              {loading ? <Loader2 className="animate-spin mx-auto"/> : "경험 정리 완료"}
            </button>
          </div>
        </aside>

        {/* 결과 화면 */}
        <main className="flex-1 p-8 overflow-y-auto flex justify-center bg-slate-50">
          {result ? (
            <div ref={reportRef} className="w-[210mm] min-h-[297mm] h-fit bg-white shadow-2xl p-12 flex flex-col animate-in fade-in zoom-in-95 duration-500">
              
              <div className="border-b-4 border-yellow-500 pb-6 mb-8">
                <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold tracking-wider mb-3 inline-block">EXPERIENCE CARD</span>
                <EditableContent className="text-3xl font-extrabold text-slate-900 mb-2" value={result.title} onSave={(v)=>handleEdit('title', v)} />
                <div className="flex gap-2 mt-3">
                    <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-lg font-bold flex items-center shadow-sm border border-yellow-200">
                        <Tag size={14} className="mr-1"/> #{keyword}
                    </span>
                </div>
              </div>

              <div className="space-y-8">
                {/* 1. 자소서 버전 */}
                <section>
                   <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center"><PenTool className="mr-2 text-yellow-600"/> 자기소개서 버전 (Written)</h3>
                   <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 leading-relaxed text-slate-700">
                     <EditableContent value={result.essay_version} onSave={(v)=>handleEdit('essay_version', v)} />
                   </div>
                </section>

                {/* 2. 면접 버전 */}
                <section>
                   <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center"><Sparkles className="mr-2 text-yellow-600"/> 면접 1분 답변 (Spoken)</h3>
                   <div className="bg-yellow-50/50 p-6 rounded-xl border border-yellow-200 leading-relaxed text-slate-800 font-medium">
                     <EditableContent value={result.speech_version} onSave={(v)=>handleEdit('speech_version', v)} />
                   </div>
                </section>

                {/* 3. 예상 질문 */}
                <section className="bg-slate-800 text-white p-6 rounded-xl mt-8">
                   <h3 className="font-bold text-yellow-400 mb-4 flex items-center"><CheckCircle className="mr-2"/> 예상 꼬리질문</h3>
                   <ul className="space-y-3">
                      {result.questions?.map((q, i) => (
                        <li key={i} className="flex items-start">
                          <span className="text-yellow-500 mr-2 font-bold">Q{i+1}.</span>
                          <EditableContent className="text-sm text-slate-300" value={q} onSave={(v)=>handleEdit('questions', v, i)} />
                        </li>
                      ))}
                   </ul>
                </section>
              </div>

              <div className="mt-12 pt-6 border-t border-slate-200 flex justify-between items-center text-xs text-slate-400 mt-auto">
                 <div className="flex items-center"><Star className="w-4 h-4 mr-1 text-yellow-500" /><span>Career Vitamin</span></div>
                <span>STAR Method Experience Organizer</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Star size={64} className="mb-4 opacity-20"/>
              <p className="text-center">왼쪽에서 키워드와 STAR 내용을 입력하고<br/><strong>[경험 정리 완료]</strong>를 눌러보세요.</p>
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