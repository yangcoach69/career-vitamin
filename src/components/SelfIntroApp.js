import React, { useState, useRef } from 'react';
import { Mic, ChevronLeft, Settings, Loader2, Download, FileText, User, Briefcase, Sparkles, Building2 } from 'lucide-react';

// [핵심] 기존 앱들처럼 공용 파일에서 도구를 가져옵니다! (라이브러리 설치 불필요)
import { fetchGemini, saveAsPng, saveAsPdf } from '../api';
import { Toast, EditableContent } from './SharedUI';

export default function SelfIntroApp({ onClose }) {
  // 상태 관리
  const [inputs, setInputs] = useState({ company: '', job: '', concept: 'competency', keyword: '', exp: '' });
  const [script, setScript] = useState(null); 
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const reportRef = useRef(null);

  const showToast = (msg) => setToastMsg(msg);

  const handleAIAnalysis = async () => {
    // 필수값 체크
    if (!inputs.company) return showToast("기업명을 입력해주세요.");
    if (!inputs.job) return showToast("직무명을 입력해주세요.");

    setLoading(true);
    try {
      // 프롬프트 구성
      const conceptText = inputs.concept === 'competency' ? '직무 역량과 성과' : '인성과 성격적 장점';
      
      const prompt = `
      당신은 취업 컨설팅 전문가입니다. 아래 정보를 바탕으로 면접용 [1분 자기소개 스크립트]를 작성해주세요.

      [지원자 정보]
      1. 지원 기업: ${inputs.company}
      2. 지원 직무: ${inputs.job}
      3. 강조 포인트(${inputs.concept}): ${conceptText} 위주로 어필
      4. 핵심 키워드: ${inputs.keyword}
      5. 관련 경험: ${inputs.exp}

      [작성 요청사항]
      - 전체 분량: 말했을 때 50초~1분 내외 (약 400~500자)
      - 오프닝: 강력한 한 문장(슬로건)으로 시작할 것.
      - 본론: 경험(${inputs.exp})을 근거로 직무 적합성을 논리적으로 설명할 것.
      - 클로징: 입사 후 포부를 자신감 있게 표현할 것.
      - 톤앤매너: 정중하면서도 자신감 있는 구어체 ("안녕하십니까", "~하겠습니다")

      [JSON 출력 형식]
      {
        "slogan": "나를 표현하는 한 문장 (헤드라인)",
        "opening": "인사 및 오프닝 멘트",
        "body": "본론 (역량/경험 어필)",
        "closing": "마무리 및 입사 포부"
      }`;

      // api.js에 있는 함수 사용
      const parsed = await fetchGemini(prompt);
      setScript(parsed);
    } catch (e) { showToast(e.message); } finally { setLoading(false); }
  };
  
  const handleEdit = (key, value) => setScript(prev => ({ ...prev, [key]: value }));
  const handleDownload = () => saveAsPng(reportRef, `자기소개_${inputs.company}`, showToast);
  const handlePdfDownload = () => saveAsPdf(reportRef, `자기소개_${inputs.company}`, showToast);
  
  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col font-sans text-slate-800">
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
      
      {/* 헤더 */}
      <header className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md shrink-0">
        <div className="flex items-center gap-3"><Mic className="text-purple-400"/><h1 className="font-bold text-lg">1분 자기소개</h1></div>
        <button onClick={onClose} className="flex items-center text-sm hover:text-purple-200 transition-colors"><ChevronLeft className="w-5 h-5 mr-1"/> 돌아가기</button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* 사이드바: 입력창 */}
        <aside className="w-80 bg-white border-r p-6 shrink-0 overflow-y-auto">
          <div className="space-y-6">
            <h3 className="font-bold text-sm text-purple-700 flex items-center uppercase tracking-wider border-b pb-2">
              <Settings size={16} className="mr-2"/> 컨셉 설정
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                   <label className="block text-xs font-bold text-slate-500 mb-1">기업명</label>
                   <input value={inputs.company} onChange={e=>setInputs({...inputs, company:e.target.value})} className="w-full p-3 border rounded-lg text-sm focus:outline-none focus:border-purple-500" placeholder="예: 삼성전자"/>
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-500 mb-1">직무명</label>
                   <input value={inputs.job} onChange={e=>setInputs({...inputs, job:e.target.value})} className="w-full p-3 border rounded-lg text-sm focus:outline-none focus:border-purple-500" placeholder="예: 영업"/>
                </div>
              </div>

              {/* 강조 포인트 버튼 그룹 */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">강조 포인트</label>
                <div className="flex gap-2">
                  <button 
                    onClick={()=>setInputs({...inputs, concept:'competency'})} 
                    className={`flex-1 py-3 text-xs rounded-lg transition-all font-bold flex items-center justify-center gap-1
                      ${inputs.concept==='competency' ? 'bg-purple-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                  >
                    <Briefcase size={14}/> 직무역량 강조
                  </button>
                  <button 
                    onClick={()=>setInputs({...inputs, concept:'character'})} 
                    className={`flex-1 py-3 text-xs rounded-lg transition-all font-bold flex items-center justify-center gap-1
                      ${inputs.concept==='character' ? 'bg-purple-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                  >
                    <User size={14}/> 인성/성격 강조
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">핵심 키워드</label>
                <input value={inputs.keyword} onChange={e=>setInputs({...inputs, keyword:e.target.value})} className="w-full p-3 border rounded-lg font-bold text-sm" placeholder="예: 소통, 분석력, 끈기"/>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">관련 경험 요약</label>
                <textarea value={inputs.exp} onChange={e=>setInputs({...inputs, exp:e.target.value})} className="w-full p-3 border rounded-lg h-32 resize-none text-sm" placeholder="어떤 경험을 통해 해당 역량을 길렀는지 간단히 적어주세요."/>
              </div>
            </div>

            <button onClick={handleAIAnalysis} disabled={loading} className="w-full bg-purple-600 text-white py-3.5 rounded-xl font-bold mt-4 shadow-lg disabled:bg-slate-400 hover:bg-purple-700 transition-colors">
              {loading?<Loader2 className="animate-spin mx-auto"/>:"스크립트 생성"}
            </button>
          </div>
        </aside>

        {/* 메인 결과 화면 */}
        <main className="flex-1 p-8 overflow-y-auto flex justify-center bg-slate-50">
          {script ? (
            <div ref={reportRef} className="w-[210mm] min-h-[297mm] h-fit bg-white shadow-lg p-12 flex flex-col animate-in fade-in zoom-in-95 duration-500 relative">
              
              <div className="border-b-4 border-purple-600 pb-6 text-center mb-8">
                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-bold tracking-wider mb-3 inline-block">1-MINUTE SPEECH</span>
                
                <h2 className="text-xl font-bold text-slate-500 mb-1 flex items-center justify-center">
                    <Building2 className="w-5 h-5 mr-2" /> {inputs.company}
                </h2>
                
                <div className="mt-4">
                  <EditableContent className="text-3xl font-extrabold text-slate-900 text-center leading-tight" value={script.slogan} onSave={(v)=>handleEdit('slogan', v)} />
                </div>
              </div>

              <div className="space-y-8 flex-1"> 
                <div className="flex gap-6">
                  <div className="w-24 text-right font-bold text-slate-400 text-sm pt-4 uppercase tracking-widest">Opening</div>
                  <div className="flex-1 bg-purple-50 p-6 rounded-2xl text-xl font-bold text-slate-800 shadow-sm border border-purple-100">
                    <EditableContent value={script.opening} onSave={(v)=>handleEdit('opening', v)} />
                  </div>
                </div>
                
                <div className="flex gap-6">
                  <div className="w-24 text-right font-bold text-slate-400 text-sm pt-1 uppercase tracking-widest">Body</div>
                  <div className="flex-1 text-slate-700 leading-loose pl-6 border-l-4 border-purple-200 text-lg">
                    <EditableContent value={script.body} onSave={(v)=>handleEdit('body', v)} />
                  </div>
                </div>
                
                <div className="flex gap-6">
                  <div className="w-24 text-right font-bold text-slate-400 text-sm pt-4 uppercase tracking-widest">Closing</div>
                  <div className="flex-1 bg-slate-50 p-6 rounded-2xl font-medium text-slate-800 text-lg border border-slate-200">
                    <EditableContent value={script.closing} onSave={(v)=>handleEdit('closing', v)} />
                  </div>
                </div>
              </div>

              <div className="mt-12 pt-6 border-t border-slate-200 flex justify-between items-center text-xs text-slate-400">
                <div className="flex items-center"><Mic className="w-4 h-4 mr-1 text-purple-500" /><span>Career Vitamin AI</span></div>
                <span>AI-Generated Speech Script</span>
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Sparkles size={64} className="mb-4 opacity-20 text-purple-500"/>
              <p className="text-center">좌측 메뉴에서 <strong>컨셉</strong>을 설정하고<br/>나만의 자기소개 스크립트를 생성해보세요.</p>
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