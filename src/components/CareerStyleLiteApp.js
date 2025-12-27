import React, { useState, useRef } from 'react';
import { fetchGemini, saveAsPng, saveAsPdf } from '../api'; 
import { 
  ChevronRight, Shirt, BarChart3, 
  Info, Download, FileText, User, Loader2,
  ArrowLeft, ArrowRight, CheckCircle2, Briefcase, HelpCircle
} from 'lucide-react';
import { Toast, EditableContent, Footer } from './SharedUI'; 

// -------------------------------------------------------------------------
// [지식 베이스] 커리어스타일(Career Style) 정의 (FAQ.pdf 기반)
// -------------------------------------------------------------------------
const CS_KNOWLEDGE = {
  intro: "커리어스타일은 개인의 직업가치를 넘어 스타일로 재정의하여, 나에게 가장 잘 어울리는 직업과 환경을 찾아주는(Fit) 도구입니다.",
  styles: {
    life: {
      left: { code: 'M', name: '보상 (Money)', desc: '경제적 보상과 성취 우선' },
      right: { code: 'T', name: '시간 (Time)', desc: '워라밸과 개인 시간 우선' }
    },
    work: {
      left: { code: 'G', name: '팀업무 (Group)', desc: '협력과 소통 중심' },
      right: { code: 'A', name: '독립업무 (Alone)', desc: '독립성과 집중 중심' }
    },
    risk: {
      left: { code: 'S', name: '안정 (Steady)', desc: '예측 가능함과 안정 선호' },
      right: { code: 'R', name: '도전 (Risky)', desc: '새로운 기회와 변화 선호' }
    },
    office: {
      // 2:6:2 비율 로직 적용 (-5~+5 스케일 기준)
      back: { code: 'B', name: '백 오피스 (Back Office)', desc: '지원/관리/기획 (내근)', range: [-5, -4] },
      half: { code: 'H', name: '하프 오피스 (Half Office)', desc: '기획+실행 (대면/비대면 혼합)', range: [-3, 3] }, // 0 포함 넓은 범위
      front: { code: 'F', name: '프론트 오피스 (Front Office)', desc: '영업/현장/서비스 (외근)', range: [4, 5] }
    }
  },
  matching_guide: `
    [매칭 가이드 (FAQ.pdf 참조)]
    1. 잘 맞는 경우 (Fit): 옷 스타일이 장소(TPO)에 잘 어울리듯, 개인의 스타일이 직무 특성과 부합하여 시너지가 나는 상태.
    2. 잘 안 맞는 경우 (Mismatch): 스타일과 직무가 충돌하는 상태. 
       - 원인 진단: 직업 이해 부족 or 부적합한 스타일 고수.
       - 해결책: 무조건 포기하기보다, 직업에 대한 이해를 높이거나 내 스타일을 일부 양보/조정하는 유연성 필요.
  `
};

export default function CareerStyleLiteApp({ onClose }) {
  // [State] 입력값 (-5 ~ +5 점수, 0은 중립)
  const [scores, setScores] = useState({ 1:0, 2:0, 3:0, 4:0 });
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

  // [로직] 점수 -> 텍스트 변환 (화면 표시용)
  const getScoreText = (id) => {
    const val = scores[id];
    const absVal = Math.abs(val);
    
    if (id === 4) { // Office Type
      if (val <= -4) return `백 오피스 +${Math.abs(val+3)}`; // 대략적 강도 표현
      if (val >= 4) return `프론트 오피스 +${val-3}`;
      return `하프 오피스 ${val === 0 ? '(균형)' : (val > 0 ? `+${val}` : val)}`;
    }

    // Life, Work, Risk
    let leftName, rightName;
    if (id === 1) { leftName = '보상'; rightName = '시간'; }
    if (id === 2) { leftName = '팀업무'; rightName = '독립업무'; }
    if (id === 3) { leftName = '안정'; rightName = '도전'; }

    if (val === 0) return "중립 (0)";
    return val < 0 ? `${leftName} +${absVal}` : `${rightName} +${absVal}`;
  };

  // [로직] 스타일 코드 및 데이터 생성
  const getAnalysisData = () => {
    // 1. Code Generation
    const s1 = scores[1] <= 0 ? 'M' : 'T'; // 0 이하는 M(왼쪽)으로 간주 (사용자 0 선택 시 기본 성향 M으로 가정 혹은 중립 처리 필요하나 코드상 하나 선택)
    const s2 = scores[2] <= 0 ? 'G' : 'A';
    const s3 = scores[3] <= 0 ? 'S' : 'R';
    
    let s4 = 'H';
    if (scores[4] <= -4) s4 = 'B';
    else if (scores[4] >= 4) s4 = 'F';
    
    const myCode = `${s1}${s2}${s3}-${s4}`;

    // 2. Interpret Data for AI
    return {
      code: myCode,
      details: `
        1. Life: ${scores[1] < 0 ? `보상(Money) 강도 ${Math.abs(scores[1])}` : `시간(Time) 강도 ${scores[1]}`} (점수: ${scores[1]})
        2. Work: ${scores[2] < 0 ? `팀업무(Group) 강도 ${Math.abs(scores[2])}` : `독립업무(Alone) 강도 ${scores[2]}`} (점수: ${scores[2]})
        3. Risk: ${scores[3] < 0 ? `안정(Steady) 강도 ${Math.abs(scores[3])}` : `도전(Risky) 강도 ${scores[3]}`} (점수: ${scores[3]})
        4. Office: ${s4} (${getScoreText(4)})
      `
    };
  };

  const handleAnalyze = async () => {
    if (!jobs.job1 || !jobs.job2) return showToast("관심 직무 2가지를 모두 입력해주세요.");
    setLoading(true);
    
    const { code, details } = getAnalysisData();
    
    // 프롬프트 생성
    const prompt = `
      당신은 퍼스널 커리어 스타일리스트입니다.
      사용자의 선택 값을 바탕으로 '커리어 스타일(Career Style)' 진단 리포트를 작성해주세요.

      [사용자 정보]
      - 스타일 코드: **${code}**
      - 상세 성향:
        ${details}
      - 관심 직무 1: ${jobs.job1}
      - 관심 직무 2: ${jobs.job2}

      [참고 자료]
      ${JSON.stringify(CS_KNOWLEDGE)}

      [작성 가이드 - JSON 형식 준수]
      1. **style_summary (전문가 총평):**
         - 사용자의 스타일 코드(${code})를 해석하여 만연체로 서술하세요.
         - 각 스타일(Life, Work, Risk, Office)이 어떻게 조화를 이루는지 설명하세요.
      
      2. **job1_analysis (관심직무 1 분석):**
         - 직무명: ${jobs.job1}
         - 사용자의 스타일(${code})과 잘 맞는지(Fit) 혹은 안 맞는지(Mismatch) 판단하세요.
         - Mismatch라면 '스타일 조정'이나 '직무 이해'가 필요하다는 팁을 주세요.
         
      3. **job2_analysis (관심직무 2 분석):**
         - 직무명: ${jobs.job2}
         - 위와 동일한 관점에서 분석하세요.

      [출력 포맷]
      {
        "style_summary": "...",
        "job1_analysis": { "title": "${jobs.job1} 매칭 분석", "content": "..." },
        "job2_analysis": { "title": "${jobs.job2} 매칭 분석", "content": "..." }
      }
    `;

    try {
      let aiResponse = await fetchGemini(prompt);
      
      // JSON 파싱 강화
      if (typeof aiResponse === 'object') aiResponse = JSON.stringify(aiResponse);
      const firstOpen = aiResponse.indexOf('{');
      const lastClose = aiResponse.lastIndexOf('}');
      
      if (firstOpen !== -1 && lastClose !== -1) {
          const jsonString = aiResponse.substring(firstOpen, lastClose + 1);
          const parsed = JSON.parse(jsonString);
          setResult({
            code: code,
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

  // 막대 그래프 렌더러 (0점 기준 좌우)
  const renderBar = (score, leftLabel, rightLabel, leftColor, rightColor) => {
    // score: -5 ~ 5
    // width calculation: 0 -> 50% width is center.
    // left bar width: 50% + (score < 0 ? abs(score)*10 : 0)% ?? No.
    // Let's simulate a center-zero bar.
    
    // Left side bar (filled from right to left starting from center)
    const leftWidth = score < 0 ? Math.abs(score) * 10 : 0; // max 50%
    // Right side bar (filled from left to right starting from center)
    const rightWidth = score > 0 ? score * 10 : 0; // max 50%

    return (
      <div className="flex items-center gap-3 text-xs font-bold text-slate-600 mb-4">
        <span className={`w-20 text-right ${score < 0 ? 'text-slate-900' : 'text-slate-400'}`}>{leftLabel}</span>
        
        <div className="flex-1 h-4 bg-slate-100 rounded-full relative overflow-hidden flex items-center">
          {/* Center Line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-300 z-10"></div>
          
          {/* Left Bar (Grow from center to left) */}
          <div className="w-1/2 h-full flex justify-end">
             <div style={{width: `${leftWidth}%`}} className={`h-full ${leftColor} rounded-l-md transition-all duration-700`}></div>
          </div>
          
          {/* Right Bar (Grow from center to right) */}
          <div className="w-1/2 h-full flex justify-start">
             <div style={{width: `${rightWidth}%`}} className={`h-full ${rightColor} rounded-r-md transition-all duration-700`}></div>
          </div>
        </div>
        
        <span className={`w-20 ${score > 0 ? 'text-slate-900' : 'text-slate-400'}`}>{rightLabel}</span>
      </div>
    );
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
                  <span className="text-pink-600 font-extrabold">{getScoreText(1)}</span>
                  <span>시간 (Time)</span>
                </div>
                <input 
                  type="range" min="-5" max="5" step="1" value={scores[1]} 
                  onChange={(e) => handleScoreChange(1, e.target.value)}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>◀ 중요함 (+5)</span>
                  <span>중립</span>
                  <span>중요함 (+5) ▶</span>
                </div>
              </div>

              {/* 2. Work */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-600 mb-2">
                  <span>팀업무 (Group)</span>
                  <span className="text-pink-600 font-extrabold">{getScoreText(2)}</span>
                  <span>독립업무 (Alone)</span>
                </div>
                <input 
                  type="range" min="-5" max="5" step="1" value={scores[2]} 
                  onChange={(e) => handleScoreChange(2, e.target.value)}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
                />
              </div>

              {/* 3. Risk */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-600 mb-2">
                  <span>안정 (Steady)</span>
                  <span className="text-pink-600 font-extrabold">{getScoreText(3)}</span>
                  <span>도전 (Risky)</span>
                </div>
                <input 
                  type="range" min="-5" max="5" step="1" value={scores[3]} 
                  onChange={(e) => handleScoreChange(3, e.target.value)}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
                />
              </div>

              {/* 4. Office */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-600 mb-2">
                  <span>백 오피스</span>
                  <span className="text-pink-600 font-extrabold">{getScoreText(4)}</span>
                  <span>프론트 오피스</span>
                </div>
                <input 
                  type="range" min="-5" max="5" step="1" value={scores[4]} 
                  onChange={(e) => handleScoreChange(4, e.target.value)}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1 px-1">
                  <span>지원/내근</span>
                  <span>기획/실행 (Half)</span>
                  <span>현장/영업</span>
                </div>
              </div>
            </div>

            {/* 관심 직무 입력 */}
            <div className="space-y-3 pt-6 border-t border-slate-100">
              <h4 className="font-bold text-sm text-slate-700 flex items-center gap-2">
                <Briefcase size={16}/> 관심 직무 입력
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="text-[10px] text-slate-400 block mb-1">관심 직무 1</label>
                    <input 
                        placeholder="예: 마케터" 
                        value={jobs.job1}
                        onChange={(e)=>setJobs({...jobs, job1: e.target.value})}
                        className="w-full p-2.5 border rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-pink-200 transition-all"
                    />
                </div>
                <div>
                    <label className="text-[10px] text-slate-400 block mb-1">관심 직무 2</label>
                    <input 
                        placeholder="예: 공무원" 
                        value={jobs.job2}
                        onChange={(e)=>setJobs({...jobs, job2: e.target.value})}
                        className="w-full p-2.5 border rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-pink-200 transition-all"
                    />
                </div>
              </div>
            </div>

            <button 
              onClick={handleAnalyze} 
              disabled={loading}
              className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 mt-4"
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
                    {CS_KNOWLEDGE.intro}
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

                {/* 2. 스타일 밸런스 차트 (중앙 0점 기준) */}
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b pb-2">
                    <BarChart3 className="text-pink-500"/> 스타일 밸런스 (Style Balance)
                  </h3>
                  
                  {renderBar(scores[1], "보상(M)", "시간(T)", "bg-pink-500", "bg-indigo-500")}
                  {renderBar(scores[2], "팀업무(G)", "독립업무(A)", "bg-orange-500", "bg-blue-500")}
                  {renderBar(scores[3], "안정(S)", "도전(R)", "bg-green-500", "bg-red-500")}
                  {renderBar(scores[4], "백(B)", "프론트(F)", "bg-slate-500", "bg-violet-500")}
                  <p className="text-[10px] text-slate-400 text-center mt-2">* 바의 길이가 길수록 해당 성향이 강함을 의미합니다.</p>
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

                {/* 4. 직무 핏 분석 (분리) */}
                <section>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b pb-2">
                    <CheckCircle2 className="text-pink-500"/> 관심 직무 Fit 분석
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Job 1 */}
                      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-pink-200 transition-colors">
                          <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs">1</span>
                              {result.ai.job1_analysis.title}
                          </h4>
                          <div className="text-sm text-slate-600 leading-relaxed text-justify">
                              <EditableContent value={result.ai.job1_analysis.content} />
                          </div>
                      </div>

                      {/* Job 2 */}
                      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-pink-200 transition-colors">
                          <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs">2</span>
                              {result.ai.job2_analysis.title}
                          </h4>
                          <div className="text-sm text-slate-600 leading-relaxed text-justify">
                              <EditableContent value={result.ai.job2_analysis.content} />
                          </div>
                      </div>
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