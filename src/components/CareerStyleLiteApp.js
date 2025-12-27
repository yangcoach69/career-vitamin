import React, { useState, useRef } from 'react';
import { fetchGemini, saveAsPng, saveAsPdf } from '../api'; 
import { 
  ChevronRight, Shirt, BarChart3, 
  Info, Download, FileText, User, Loader2,
  ArrowLeft, ArrowRight, CheckCircle2, Briefcase
} from 'lucide-react';
import { Toast, EditableContent, Footer } from './SharedUI'; 

// -------------------------------------------------------------------------
// [지식 베이스] 커리어스타일(Career Style) 정의 (FAQ.pdf 기반)
// -------------------------------------------------------------------------
const CS_KNOWLEDGE = {
  styles: {
    life: {
      left: { code: 'M', name: '보상 지향 (Money)', desc: '시간보다는 경제적 보상과 성취를 더 중요하게 생각함' },
      right: { code: 'T', name: '시간(워라밸) 지향 (Time)', desc: '높은 보상보다는 개인의 시간과 삶의 균형을 더 중요하게 생각함' }
    },
    work: {
      left: { code: 'G', name: '팀업무 지향 (Group)', desc: '혼자보다는 팀으로 협력하고 소통하며 일하는 것을 선호함' },
      right: { code: 'A', name: '독립업무 지향 (Alone)', desc: '팀보다는 혼자 독립적으로 집중해서 일하는 것을 선호함' }
    },
    risk: {
      left: { code: 'S', name: '안정 추구 (Steady)', desc: '변화나 모험보다는 예측 가능한 안정적인 환경을 선호함' },
      right: { code: 'R', name: '도전 추구 (Risky)', desc: '안정보다는 새로운 기회와 모험, 변화를 즐김' }
    },
    office: {
      back: { code: 'B', name: '백 오피스 (Back Office)', desc: '고객 비대면, 지원/관리/기획 중심의 내근 업무' },
      half: { code: 'H', name: '하프 오피스 (Half Office)', desc: '대면/비대면 혼합, 기획과 실행이 공존하는 업무 (마케팅, 연구 등)' },
      front: { code: 'F', name: '프론트 오피스 (Front Office)', desc: '고객 직접 대면, 현장/영업/서비스 중심의 외근 업무' }
    }
  }
};

export default function CareerStyleLiteApp({ onClose }) {
  // [State] 입력값 (1~10점 척도)
  // 1번~3번: 1~5(Left), 6~10(Right)
  // 4번(Office): 1~2(Back), 3~8(Half), 9~10(Front)
  const [scores, setScores] = useState({ 1:5, 2:5, 3:5, 4:5 });
  const [jobs, setJobs] = useState({ job1: '', job2: '' });

  // [State] 결과 및 UI
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const reportRef = useRef(null);

  const showToast = (msg) => setToastMsg(msg);

  const handleScoreChange = (id, val) => {
    setScores(prev => ({ ...prev, [id]: parseInt(val) }));
  };

  // [로직] 점수 -> 스타일 코드 변환
  const getStyleCode = () => {
    const s1 = scores[1] <= 5 ? 'M' : 'T';
    const s2 = scores[2] <= 5 ? 'G' : 'A';
    const s3 = scores[3] <= 5 ? 'S' : 'R';
    
    let s4 = 'H'; // 기본값 Half
    if (scores[4] <= 2) s4 = 'B';      // 1, 2점 -> Back
    else if (scores[4] >= 9) s4 = 'F'; // 9, 10점 -> Front
    
    return `${s1}${s2}${s3}-${s4}`;
  };

  const handleAnalyze = async () => {
    if (!jobs.job1 || !jobs.job2) return showToast("관심 직무 2가지를 모두 입력해주세요.");
    setLoading(true);
    
    const myCode = getStyleCode();
    
    // 프롬프트 생성
    const prompt = `
      당신은 퍼스널 커리어 스타일리스트입니다.
      사용자의 선택 값을 바탕으로 '커리어 스타일(Career Style)' 진단 리포트를 작성해주세요.

      [사용자 정보]
      - 결정된 스타일 코드: **${myCode}**
      - 세부 점수(1~10): 
        1. Life (Money vs Time): ${scores[1]} (M <-> T)
        2. Work (Group vs Alone): ${scores[2]} (G <-> A)
        3. Risk (Steady vs Risky): ${scores[3]} (S <-> R)
        4. Office (Back vs Front): ${scores[4]} (B <-> F, 중간은 H)
      - 관심 직무: ${jobs.job1}, ${jobs.job2}

      [지식 베이스 참조]
      ${JSON.stringify(CS_KNOWLEDGE)}

      [작성 가이드 - JSON 형식 준수]
      1. **style_summary (만연체 총평):**
         - 사용자의 4가지 스타일 조합(${myCode})을 해석하여, "당신은 ~한 성향을 가지고 있으며, ~한 환경에서 최고의 성과를 냅니다." 형태로 부드럽게 서술하세요.
      
      2. **job_fit_analysis (직무 매칭):**
         - 관심 직무 1(${jobs.job1})과 2(${jobs.job2})가 사용자의 스타일(${myCode})과 얼마나 잘 어울리는지(Fit/Mismatch) 분석하세요.
         - 만약 스타일과 맞지 않는다면, "이 직무는 ~한 면이 있어 당신의 ~성향과는 조율이 필요할 수 있습니다"라고 조언하세요.

      [출력 포맷]
      {
        "style_summary": "...",
        "job_fit_analysis": "..."
      }
    `;

    try {
      let aiResponse = await fetchGemini(prompt);
      if (typeof aiResponse === 'object') aiResponse = JSON.stringify(aiResponse);
      
      const firstOpen = aiResponse.indexOf('{');
      const lastClose = aiResponse.lastIndexOf('}');
      if (firstOpen !== -1 && lastClose !== -1) {
          const jsonString = aiResponse.substring(firstOpen, lastClose + 1);
          const parsed = JSON.parse(jsonString);
          setResult({
            code: myCode,
            ai: parsed
          });
      } else {
          throw new Error("JSON 파싱 실패");
      }
    } catch (e) {
      showToast("분석 중 오류가 발생했습니다: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-50 z-50 flex flex-col font-sans text-slate-800">
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
      
      {/* 헤더 */}
      <header className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-pink-500 rounded flex items-center justify-center text-white">
            <Shirt size={20} strokeWidth={2.5}/>
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none">Career Style Lite</h1>
            <p className="text-[10px] text-slate-300 opacity-80">나만의 커리어스타일 찾기</p>
          </div>
        </div>
        <button onClick={onClose} className="flex items-center text-sm hover:text-pink-300 transition-colors">
          <ChevronRight className="w-5 h-5"/> 닫기
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        
        {/* [좌측] 입력 패널 */}
        <aside className="w-[420px] bg-white border-r border-slate-200 flex flex-col overflow-y-auto shrink-0 shadow-lg z-10">
          <div className="p-6 space-y-8">
            
            <div className="bg-pink-50 p-4 rounded-xl border border-pink-100">
              <h3 className="font-bold text-pink-900 text-sm mb-1 flex items-center gap-2">
                <Info size={16}/> 스타일 피팅룸 (Fitting Room)
              </h3>
              <p className="text-xs text-pink-800 leading-relaxed">
                진로와 취업을 고민하는 지금, 두 가지 유형 중 <strong>어느 쪽을 얼마나 더 중요하게 생각하십니까?</strong>
              </p>
            </div>

            {/* 슬라이더 1~4 */}
            <div className="space-y-8">
              {/* 1. Life */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-600 mb-2">
                  <span>보상 (Money)</span>
                  <span>시간(워라밸) 지향</span>
                </div>
                <input 
                  type="range" min="1" max="10" value={scores[1]} 
                  onChange={(e) => handleScoreChange(1, e.target.value)}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
                />
              </div>

              {/* 2. Work */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-600 mb-2">
                  <span>팀업무 (Group)</span>
                  <span>독립업무 (Alone)</span>
                </div>
                <input 
                  type="range" min="1" max="10" value={scores[2]} 
                  onChange={(e) => handleScoreChange(2, e.target.value)}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
                />
              </div>

              {/* 3. Risk */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-600 mb-2">
                  <span>안정 (Steady)</span>
                  <span>도전 (Risky)</span>
                </div>
                <input 
                  type="range" min="1" max="10" value={scores[3]} 
                  onChange={(e) => handleScoreChange(3, e.target.value)}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
                />
              </div>

              {/* 4. Office */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-600 mb-2">
                  <span>백 오피스</span>
                  <span className="text-slate-400">하프 오피스</span>
                  <span>프론트 오피스</span>
                </div>
                <input 
                  type="range" min="1" max="10" value={scores[4]} 
                  onChange={(e) => handleScoreChange(4, e.target.value)}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span className="w-1/4 text-left">지원/내근</span>
                  <span className="w-2/4 text-center">기획/실행</span>
                  <span className="w-1/4 text-right">현장/영업</span>
                </div>
              </div>
            </div>

            {/* 관심 직무 입력 */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h4 className="font-bold text-sm text-slate-700 flex items-center gap-2">
                <Briefcase size={16}/> 관심 직무 입력
              </h4>
              <input 
                placeholder="관심 직무 1 (예: 마케터)" 
                value={jobs.job1}
                onChange={(e)=>setJobs({...jobs, job1: e.target.value})}
                className="w-full p-3 border rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-pink-200 transition-all"
              />
              <input 
                placeholder="관심 직무 2 (예: 공무원)" 
                value={jobs.job2}
                onChange={(e)=>setJobs({...jobs, job2: e.target.value})}
                className="w-full p-3 border rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-pink-200 transition-all"
              />
            </div>

            <button 
              onClick={handleAnalyze} 
              disabled={loading}
              className="w-full bg-pink-600 text-white py-4 rounded-xl font-bold shadow-xl hover:bg-pink-700 transition-all flex items-center justify-center gap-2 mt-4"
            >
              {loading ? <Loader2 className="animate-spin"/> : "커리어스타일 찾기"}
            </button>
          </div>
        </aside>

        {/* [우측] 결과 리포트 */}
        <main className="flex-1 overflow-y-auto bg-slate-100 p-8 flex justify-center">
          {result ? (
            <div ref={reportRef} className="w-full max-w-3xl bg-white shadow-xl rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 flex flex-col h-fit min-h-[800px]">
              
              {/* 리포트 헤더 */}
              <div className="bg-slate-900 text-white p-8 text-center relative overflow-hidden">
                <div className="relative z-10">
                  <h2 className="text-3xl font-extrabold mb-1 tracking-tight">MY CAREER STYLE</h2>
                  <p className="text-pink-400 text-sm font-bold opacity-90 tracking-widest uppercase">나만의 커리어스타일 코드</p>
                </div>
              </div>

              <div className="p-10 space-y-10">
                
                {/* 0. 개요 */}
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-center">
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    "커리어스타일은 개인의 직업가치를 넘어 스타일로 재정의하여,<br/>
                    나에게 가장 잘 어울리는 직업과 환경을 찾아주는(Fit) 도구입니다."
                  </p>
                </div>

                {/* 1. 스타일 코드 (초대형) */}
                <div className="text-center">
                  <div className="inline-block bg-pink-50 border-4 border-pink-100 px-10 py-6 rounded-2xl shadow-sm">
                    <span className="text-6xl font-black text-slate-800 tracking-widest drop-shadow-sm">
                      {result.code}
                    </span>
                  </div>
                  <p className="mt-4 text-xs text-slate-400">
                    Money/Time • Group/Alone • Steady/Risky - Back/Half/Front
                  </p>
                </div>

                {/* 2. 스타일 밸런스 차트 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b pb-2">
                    <BarChart3 className="text-pink-500"/> 스타일 밸런스 (Style Balance)
                  </h3>
                  
                  {/* Chart 1: Life */}
                  <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                    <span className="w-16 text-right">보상(M)</span>
                    <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden flex">
                      <div style={{width: `${(11-scores[1])*10}%`}} className="bg-slate-400 h-full"></div>
                      <div style={{width: `${(scores[1]-1)*10}%`}} className="bg-pink-400 h-full ml-auto"></div>
                    </div>
                    <span className="w-16">시간(T)</span>
                  </div>

                  {/* Chart 2: Work */}
                  <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                    <span className="w-16 text-right">팀(G)</span>
                    <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden flex">
                      <div style={{width: `${(11-scores[2])*10}%`}} className="bg-slate-400 h-full"></div>
                      <div style={{width: `${(scores[2]-1)*10}%`}} className="bg-pink-400 h-full ml-auto"></div>
                    </div>
                    <span className="w-16">독립(A)</span>
                  </div>

                  {/* Chart 3: Risk */}
                  <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                    <span className="w-16 text-right">안정(S)</span>
                    <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden flex">
                      <div style={{width: `${(11-scores[3])*10}%`}} className="bg-slate-400 h-full"></div>
                      <div style={{width: `${(scores[3]-1)*10}%`}} className="bg-pink-400 h-full ml-auto"></div>
                    </div>
                    <span className="w-16">도전(R)</span>
                  </div>

                  {/* Chart 4: Office (3단) */}
                  <div className="flex items-center gap-3 text-xs font-bold text-slate-600 mt-2">
                    <span className="w-16 text-right">백(B)</span>
                    <div className="flex-1 h-3 bg-slate-200 rounded-full relative">
                      <div 
                        className="absolute top-0 bottom-0 bg-pink-600 w-2 h-4 -mt-0.5 rounded shadow-sm transition-all duration-700"
                        style={{left: `${(scores[4]-1)*10}%`}}
                      ></div>
                    </div>
                    <span className="w-16">프론트(F)</span>
                  </div>
                </div>

                {/* 3. 전문가 총평 */}
                <section>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b pb-2">
                    <FileText className="text-pink-500"/> 전문가 총평
                  </h3>
                  <div className="bg-pink-50/50 p-6 rounded-xl border border-pink-100 text-sm text-slate-700 leading-relaxed text-justify">
                    <EditableContent value={result.ai.style_summary} />
                  </div>
                </section>

                {/* 4. 직무 핏 분석 */}
                <section>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b pb-2">
                    <CheckCircle2 className="text-pink-500"/> 관심 직무 Fit 분석
                  </h3>
                  <div className="bg-white p-6 rounded-xl border border-slate-200 text-sm text-slate-700 leading-relaxed text-justify shadow-sm">
                    <EditableContent value={result.ai.job_fit_analysis} />
                  </div>
                </section>

                <Footer />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-6 opacity-50">
                <Shirt size={40}/>
              </div>
              <p className="text-lg font-bold text-slate-300">왼쪽에서 스타일을 선택해주세요.</p>
              <p className="text-sm mt-2">나만의 커리어스타일 코드를 찾아드립니다.</p>
            </div>
          )}
        </main>
        
        {/* 저장 버튼 */}
        {result && (
          <div className="absolute bottom-8 right-8 flex gap-3 z-50">
            <button onClick={() => saveAsPng(reportRef, `CareerStyle_${result.code}`, showToast)} className="bg-slate-900 text-white px-5 py-3 rounded-full font-bold shadow-xl hover:-translate-y-1 transition-transform flex items-center text-sm"><Download className="mr-2" size={16}/> 이미지 저장</button>
            <button onClick={() => saveAsPdf(reportRef, `CareerStyle_${result.code}`, showToast)} className="bg-red-600 text-white px-5 py-3 rounded-full font-bold shadow-xl hover:-translate-y-1 transition-transform flex items-center text-sm"><FileText className="mr-2" size={16}/> PDF 저장</button>
          </div>
        )}
      </div>
    </div>
  );
}