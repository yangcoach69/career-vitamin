import React, { useState, useRef, useEffect } from 'react';
import { 
  Stethoscope, ChevronLeft, Loader2, 
  FileText, Sparkles, Download, Copy,
  CheckCircle, AlertCircle, Building2
} from 'lucide-react';
import { fetchGemini, saveAsPng, saveAsPdf } from '../api';
import { Toast, EditableContent } from './SharedUI';

export default function Clinic({ onClose }) {
  // 1. 입력 상태값
  const [inputs, setInputs] = useState({
    company: '',       // 지원 기업
    job: '',           // 지원 직무
    question: '',      // 항목명
    content: '',       // 초안
    limit: '',         // 글자수 제한
    request: ''        // 요청사항
  });

  const [byteCount, setByteCount] = useState(0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const reportRef = useRef(null);

  const showToast = (msg) => setToastMsg(msg);

  // 글자수(Byte) 계산
  useEffect(() => {
    const text = inputs.content;
    let byte = 0;
    for (let i = 0; i < text.length; i++) {
      text.charCodeAt(i) > 127 ? byte += 2 : byte += 1;
    }
    setByteCount(byte);
  }, [inputs.content]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: value }));
  };

  // 2. AI 분석 요청
  const handleGenerate = async () => {
    // 필수값 체크
    if (!inputs.company || !inputs.job || !inputs.question || !inputs.content) {
      return showToast("필수 항목(*)을 모두 입력해주세요.");
    }
    
    setLoading(true);
    try {
      const prompt = `
      당신은 20년 경력의 대기업 인사담당자이자 자기소개서 전문 컨설턴트입니다.
      지원자가 작성한 자기소개서 초안을 분석하고, 합격 확률을 높일 수 있도록 수정(첨삭)해주세요.

      [입력 정보]
      1. 지원 기업: ${inputs.company}
      2. 지원 직무: ${inputs.job}
      3. 항목(질문): ${inputs.question}
      4. 글자수 제한: ${inputs.limit ? inputs.limit + '자 이내' : '자유'}
      5. 요청사항: ${inputs.request || '없음'}
      6. 초안 내용:
      ${inputs.content}

      [작업 지시]
      1. **점수 평가**: 100점 만점 기준으로 점수를 매기세요.
      2. **진단(강평)**: 잘된 점(Good)과 아쉬운 점(Bad)을 명확히 분석하세요.
      3. **수정안 작성**:
         - 초안의 소재를 살리되, 문장을 다듬고 논리적 구조(STAR 기법 등)를 적용하세요.
         - 지원 직무(${inputs.job})의 핵심 역량이 잘 드러나도록 수정하세요.
         - 두괄식으로 작성하세요.

      [JSON 출력 형식]
      {
        "score": 85,
        "summary_title": "한 줄 총평 (예: 직무 경험은 좋으나 구체적인 수치가 부족합니다)",
        "good_point": "잘된 점 분석 내용...",
        "bad_point": "보완할 점 분석 내용...",
        "revision": "수정된 자기소개서 전체 내용 (줄바꿈 포함)"
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

  const handleDownload = () => saveAsPng(reportRef, `자소서클리닉_${inputs.company}`, showToast);
  const handlePdfDownload = () => saveAsPdf(reportRef, `자소서클리닉_${inputs.company}`, showToast);

  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col font-sans text-slate-800">
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
      
      {/* 헤더 (RoleModelApp과 동일한 테마 유지) */}
      <header className="bg-[#1e293b] text-white p-4 flex justify-between items-center shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="text-indigo-400">
             <Stethoscope size={24} fill="currentColor" className="text-indigo-400" />
          </div>
          <h1 className="font-bold text-lg tracking-wide">자기소개서 클리닉</h1>
        </div>
        <button onClick={onClose} className="flex items-center text-sm text-slate-300 hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5 mr-1"/> 돌아가기
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* 사이드바: 입력창 */}
        <aside className="w-96 bg-white border-r p-8 shrink-0 overflow-y-auto flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
          
          {/* 입력 폼 */}
          <div className="mb-8 space-y-6">
             <h3 className="text-indigo-700 font-bold text-sm flex items-center border-b pb-2">
                <FileText size={18} className="mr-2"/> 기본 정보 입력
             </h3>

             <div className="space-y-4">
               <div>
                 <label className="block text-xs font-bold text-slate-500 mb-1">지원 기업 <span className="text-red-500">*</span></label>
                 <input 
                   name="company" value={inputs.company} onChange={handleChange}
                   className="w-full p-3 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                   placeholder="예: 삼성전자" 
                 />
               </div>
               <div>
                 <label className="block text-xs font-bold text-slate-500 mb-1">지원 직무 <span className="text-red-500">*</span></label>
                 <input 
                   name="job" value={inputs.job} onChange={handleChange}
                   className="w-full p-3 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                   placeholder="예: 마케팅 기획" 
                 />
               </div>
               <div>
                 <label className="block text-xs font-bold text-slate-500 mb-1">항목명(질문) <span className="text-red-500">*</span></label>
                 <input 
                   name="question" value={inputs.question} onChange={handleChange}
                   className="w-full p-3 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                   placeholder="예: 지원동기 및 포부" 
                 />
               </div>
             </div>

             {/* 초안 입력 */}
             <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">초안 내용 <span className="text-red-500">*</span></label>
                <textarea 
                   name="content" value={inputs.content} onChange={handleChange}
                   className="w-full p-3 border border-slate-200 rounded-lg text-sm text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-48 leading-relaxed"
                   placeholder="작성하신 자기소개서를 여기에 붙여넣으세요."
                />
                <div className="text-right text-xs text-slate-400 mt-1 font-mono">
                  {inputs.content.length}자 / {byteCount} byte
                </div>
             </div>

             {/* 옵션 */}
             <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 mb-1">제한 글자수</label>
                    <input name="limit" value={inputs.limit} onChange={handleChange} type="number" className="w-full p-2 border rounded text-sm" placeholder="예: 700" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">요청사항</label>
                  <input name="request" value={inputs.request} onChange={handleChange} className="w-full p-2 border rounded text-sm" placeholder="예: 두괄식으로 바꿔줘" />
                </div>
             </div>
          </div>

          {/* 분석 버튼 (Indigo 테마) */}
          <button 
            onClick={handleGenerate} 
            disabled={loading} 
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:bg-slate-300 disabled:shadow-none disabled:translate-y-0 mt-auto flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin w-6 h-6"/> : <><Sparkles size={20}/> AI 진단 시작</>}
          </button>
        </aside>

        {/* 결과 화면 (리포트 형식) */}
        <main className="flex-1 p-10 overflow-y-auto flex justify-center bg-slate-50/50">
          {result ? (
            <div ref={reportRef} className="w-[210mm] min-h-[297mm] h-fit bg-white shadow-2xl p-12 flex flex-col animate-in fade-in zoom-in-95 duration-500 relative">
              
              {/* 리포트 헤더 */}
              <div className="flex justify-between items-end border-b-2 border-slate-900 pb-6 mb-8">
                 <div>
                    <div className="text-indigo-600 font-extrabold tracking-widest text-xs mb-1">AI SELF-INTRODUCTION CLINIC</div>
                    <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
                       <Building2 className="text-slate-400" size={28}/> 
                       {inputs.company}
                    </h1>
                    <p className="text-slate-500 font-medium mt-1 ml-1">{inputs.job} 직무 지원</p>
                 </div>
                 <div className="text-right">
                    <div className="text-5xl font-black text-indigo-600">{result.score}</div>
                    <div className="text-xs text-slate-400 font-bold uppercase">Total Score</div>
                 </div>
              </div>

              {/* 총평 (Editable) */}
              <div className="mb-8">
                 <h3 className="font-bold text-slate-800 mb-3 flex items-center text-sm uppercase tracking-wide">
                    <Stethoscope size={16} className="mr-2 text-indigo-500"/> AI 총평
                 </h3>
                 <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 text-indigo-900 font-medium text-lg leading-relaxed">
                    <EditableContent value={result.summary_title} onSave={(v)=>handleEdit('summary_title', v)} />
                 </div>
              </div>

              {/* 상세 분석 (Grid) */}
              <div className="grid grid-cols-2 gap-6 mb-10">
                 <div className="bg-green-50 p-5 rounded-xl border border-green-100">
                    <h4 className="font-bold text-green-700 mb-2 flex items-center text-sm"><CheckCircle size={16} className="mr-2"/> Good Points</h4>
                    <div className="text-slate-700 text-sm leading-relaxed">
                       <EditableContent value={result.good_point} onSave={(v)=>handleEdit('good_point', v)} />
                    </div>
                 </div>
                 <div className="bg-red-50 p-5 rounded-xl border border-red-100">
                    <h4 className="font-bold text-red-700 mb-2 flex items-center text-sm"><AlertCircle size={16} className="mr-2"/> Bad Points</h4>
                    <div className="text-slate-700 text-sm leading-relaxed">
                       <EditableContent value={result.bad_point} onSave={(v)=>handleEdit('bad_point', v)} />
                    </div>
                 </div>
              </div>

              {/* 수정안 (Main Content) */}
              <section className="flex-1 flex flex-col">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-800 flex items-center text-lg">
                       <FileText className="mr-2 text-indigo-600"/> AI 수정 제안 (Revision)
                    </h3>
                    <button 
                       onClick={() => {navigator.clipboard.writeText(result.revision); showToast("수정안이 복사되었습니다!");}}
                       className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-full flex items-center transition-colors"
                    >
                       <Copy size={12} className="mr-1"/> 텍스트 복사
                    </button>
                 </div>
                 
                 <div className="border-t border-b border-slate-200 py-6 mb-6 flex-1">
                    <div className="text-slate-800 leading-[2.0] text-justify whitespace-pre-wrap font-serif">
                       <EditableContent value={result.revision} onSave={(v)=>handleEdit('revision', v)} />
                    </div>
                 </div>
              </section>

              {/* 푸터 */}
              <Footer />

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-300">
              <Stethoscope size={80} className="mb-6 opacity-20"/>
              <p className="text-center text-lg font-medium text-slate-400">
                작성한 자기소개서를 입력하면<br/>
                <strong className="text-indigo-500">전문가의 첨삭 결과</strong>가 리포트로 생성됩니다.
              </p>
            </div>
          )}
        </main>

        {result && (
          <div className="absolute bottom-8 right-8 flex gap-3 z-50 animate-in slide-in-from-bottom-5">
            <button onClick={handleDownload} className="bg-slate-900 text-white px-6 py-3 rounded-full font-bold shadow-2xl hover:-translate-y-1 flex items-center transition-transform border border-slate-700"><Download className="mr-2" size={20}/> 이미지 저장</button>
            <button onClick={handlePdfDownload} className="bg-indigo-600 text-white px-6 py-3 rounded-full font-bold shadow-2xl hover:-translate-y-1 flex items-center transition-transform"><FileText className="mr-2" size={20}/> PDF 저장</button>
          </div>
        )}
      </div>
    </div>
  );
}