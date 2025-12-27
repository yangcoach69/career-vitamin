import React, { useState, useRef } from 'react';
import { fetchGemini, saveAsPng, saveAsPdf } from '../api'; // api.js 경로 확인 필요
import { 
  X, Check, Loader2, ChevronRight, 
  BarChart3, TrendingUp, Shuffle, 
  Info, Download, FileText, User
} from 'lucide-react';
import { Toast, EditableContent } from './SharedUI'; // SharedUI 경로 확인 필요

// -------------------------------------------------------------------------
// [지식 베이스] 커리어넥스트(Career Next)® 오리지널 콘텐츠 (PDF 기반)
// -------------------------------------------------------------------------
const CN_KNOWLEDGE = {
  model_info: {
    title: "커리어넥스트 (Career Next)®",
    copyright: "커리어넥스트(Career Next)®는 저작권 등록(C-2025-036548) 및 상표권 등록(40-2433034-0000)이 완료된 도구입니다.",
    structure: "2개의 트랙(Track)과 6개의 여정(Trip)으로 구성됨."
  },
  tracks: {
    A: {
      name: "경력 유지/확장",
      name_en: "Career Continuum",
      desc: "기존 경험과 전문성을 바탕으로 커리어를 지속하는 방향 (승진, 재취업, 전문성 강화)",
      trips: [1, 2, 3]
    },
    B: {
      name: "경력 전환",
      name_en: "Career Shift",
      desc: "새로운 직업 전환을 통해 직업적 만족도와 성취를 재발견하는 방향 (직종 변경, 창업, 창직)",
      trips: [4, 5, 6]
    }
  },
  trips: {
    1: { name: "제자리 뛰기", name_en: "Advanced Staying", desc: "현 위치에서 깊이 있는 성장. 전직/이직 없이 조직 내 전문성 심화 및 역할 확대." },
    2: { name: "경력 사다리", name_en: "Ladder Transition", desc: "유사 직무/분야로 더 나은 조건을 찾아 이동. 경력의 연속성을 유지하며 사다리를 오름." },
    3: { name: "독립 전문가", name_en: "Solo Expert", desc: "조직을 떠나 프리랜서나 1인 기업으로 홀로서기. 지식 사업화(강의/컨설팅) 중심." },
    4: { name: "심플 스타트", name_en: "Simple Start", desc: "진입장벽이 낮은 일로의 빠른 전환. 워라밸을 중시하거나 스트레스가 적은 일을 선택." },
    5: { name: "열정 축", name_en: "Passion Pivot", desc: "흥미와 열정을 기반으로 한 과감한 도전. 사이드 프로젝트로 시작하여 점진적 전환." },
    6: { name: "경력 리부트", name_en: "Career Reboot", desc: "완전히 새로운 분야로의 리셋. 교육, 자격증 등 장기적이고 체계적인 준비 필요." }
  }
};

export default function CareerNextLiteApp({ onClose }) {
  // [State] 입력값
  const [ageGroup, setAgeGroup] = useState('50대'); // 기본값
  const [scores, setScores] = useState({ 1:0, 2:0, 3:0, 4:0, 5:0, 6:0 });

  // [State] 결과 및 UI
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const reportRef = useRef(null);

  const showToast = (msg) => setToastMsg(msg);

  // 슬라이더 변경 핸들러
  const handleScoreChange = (id, val) => {
    setScores(prev => ({ ...prev, [id]: parseInt(val) }));
  };

  // [핵심] AI 분석 요청
  const handleAnalyze = async () => {
    setLoading(true);
    
    // 1. 점수 계산 (Track 합산)
    const trackAScore = scores[1] + scores[2] + scores[3];
    const trackBScore = scores[4] + scores[5] + scores[6];
    
    // 2. 순위 계산 (Ranking)
    const sortedTrips = Object.entries(scores)
      .sort(([, a], [, b]) => b - a)
      .map(([id, score]) => ({ 
        id, 
        score, 
        ...CN_KNOWLEDGE.trips[id] 
      }));

    const topTrip = sortedTrips[0];
    
    // 3. 프롬프트 생성
    const prompt = `
      당신은 4060 신중년 커리어 설계를 돕는 전문 코치입니다.
      사용자가 입력한 '커리어넥스트(Career Next)®' 진단 값을 바탕으로 부드러운 코칭 리포트를 작성해주세요.

      [사용자 정보]
      - 연령대: ${ageGroup}
      - 각 여정(Trip)별 점수 (7점 만점):
        ${JSON.stringify(scores)}
      
      [분석 로직]
      1. Track A (경력 유지/확장) 총점: ${trackAScore} (Trip 1+2+3)
      2. Track B (경력 전환) 총점: ${trackBScore} (Trip 4+5+6)
      3. 가장 선호하는 여정(1순위): ${topTrip.name} (${topTrip.name_en}) - ${topTrip.score}점

      [참고: 커리어넥스트 지식 베이스]
      ${JSON.stringify(CN_KNOWLEDGE)}

      [작성 가이드]
      1. **총평 (Overall Insight):** - 먼저 사용자가 선택한 개별 Trip(여정)들의 점수 패턴을 읽어주세요. (어떤 구체적인 활동에 관심이 있는지)
         - 그 후, 이 점수들을 합산했을 때 **어떤 Track(큰 방향)**으로 기우는지 결론을 내려주세요.
         - 연령대(${ageGroup})를 고려하여, 해당 연령대에 이 선택이 갖는 의미나 주의할 점을 부드럽게 조언해주세요.
      2. **상세 제안:** - 1순위로 선택된 Trip에 대해 지식 베이스의 '설명'을 인용하여 구체적인 실행 팁을 주세요.
         - 만약 Track A와 B의 점수 차이가 3점 이내라면, "현재 방향에 대한 고민이 깊으시군요"라며 탐색을 권유해주세요.
      3. **톤앤매너:** - 단정적인 진단보다는 "가능성이 보입니다", "추천드립니다" 같은 **부드러운 권유형/코칭형** 말투를 사용하세요.
         - 전문 용어(Trip, Track 이름)는 반드시 제공된 데이터의 한글(영어) 표기를 정확히 쓰세요.
         - JSON 형식이 아닌, **잘 정리된 마크다운 텍스트**로 작성하세요.
    `;

    try {
      const aiResponse = await fetchGemini(prompt);
      // AI 응답이 텍스트(string)로 온다고 가정 (api.js 구현에 따라 다름. 객체라면 .result 등으로 접근)
      // 여기서는 텍스트로 바로 받는다고 가정하거나, fetchGemini가 객체를 반환하면 .text나 .result 사용
      // *만약 fetchGemini가 JSON 객체를 반환한다면 아래 코드를 맞춰주세요.*
      const text = typeof aiResponse === 'string' ? aiResponse : (aiResponse.result || JSON.stringify(aiResponse));
      
      setResult({
        text: text,
        trackA: trackAScore,
        trackB: trackBScore,
        ranking: sortedTrips
      });
    } catch (e) {
      showToast("분석 중 오류가 발생했습니다: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // --- UI 구성 ---
  return (
    <div className="fixed inset-0 bg-slate-50 z-50 flex flex-col font-sans text-slate-800">
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
      
      {/* 헤더 */}
      <header className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-500 rounded flex items-center justify-center font-bold text-lg">N</div>
          <div>
            <h1 className="font-bold text-lg leading-none">Career Next® Lite</h1>
            <p className="text-[10px] text-slate-300 opacity-80">4060 커리어 방향성 진단</p>
          </div>
        </div>
        <button onClick={onClose} className="flex items-center text-sm hover:text-indigo-300 transition-colors">
          <ChevronRight className="w-5 h-5"/> 닫기
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        
        {/* [좌측] 입력 패널 */}
        <aside className="w-[400px] bg-white border-r border-slate-200 flex flex-col overflow-y-auto shrink-0 shadow-lg z-10">
          <div className="p-6 space-y-8">
            
            {/* 1. 연령대 선택 */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <User size={18} className="text-indigo-600"/> 연령대 선택
              </h3>
              <div className="flex gap-2">
                {['40대', '50대', '60대 이상'].map(age => (
                  <button 
                    key={age}
                    onClick={() => setAgeGroup(age)}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                      ageGroup === age 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {age}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. 여정(Trip) 진단 */}
            <div>
              <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                <TrendingUp size={18} className="text-indigo-600"/> 가능성 진단
              </h3>
              <p className="text-xs text-slate-500 mb-6 bg-slate-50 p-3 rounded leading-relaxed">
                각 <b>Trip(여정)</b>에 대해 현재 어느 정도의 흥미나 가능성을 느끼시나요?<br/>
                (0점: 전혀 없음 ~ 7점: 매우 높음)
              </p>

              <div className="space-y-6">
                {/* Track A 그룹 */}
                <div className="border-l-4 border-blue-500 pl-4 py-1">
                  <div className="text-xs font-bold text-blue-600 mb-3 uppercase tracking-wider">Track A. 경력 유지/확장</div>
                  {[1, 2, 3].map(id => (
                    <div key={id} className="mb-5 last:mb-0">
                      <div className="flex justify-between text-sm font-bold text-slate-700 mb-1">
                        <span>{CN_KNOWLEDGE.trips[id].name}</span>
                        <span className="text-blue-600">{scores[id]}점</span>
                      </div>
                      <input 
                        type="range" min="0" max="7" step="1"
                        value={scores[id]}
                        onChange={(e) => handleScoreChange(id, e.target.value)}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">{CN_KNOWLEDGE.trips[id].name_en}</p>
                    </div>
                  ))}
                </div>

                {/* Track B 그룹 */}
                <div className="border-l-4 border-green-500 pl-4 py-1">
                  <div className="text-xs font-bold text-green-600 mb-3 uppercase tracking-wider">Track B. 경력 전환</div>
                  {[4, 5, 6].map(id => (
                    <div key={id} className="mb-5 last:mb-0">
                      <div className="flex justify-between text-sm font-bold text-slate-700 mb-1">
                        <span>{CN_KNOWLEDGE.trips[id].name}</span>
                        <span className="text-green-600">{scores[id]}점</span>
                      </div>
                      <input 
                        type="range" min="0" max="7" step="1"
                        value={scores[id]}
                        onChange={(e) => handleScoreChange(id, e.target.value)}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">{CN_KNOWLEDGE.trips[id].name_en}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 분석 버튼 */}
            <button 
              onClick={handleAnalyze} 
              disabled={loading}
              className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin"/> : <span className="flex items-center gap-2">커리어넥스트 진단하기 <ChevronRight size={16}/></span>}
            </button>

          </div>
        </aside>

        {/* [우측] 결과 리포트 */}
        <main className="flex-1 overflow-y-auto bg-slate-100 p-8 flex justify-center">
          {result ? (
            <div ref={reportRef} className="w-full max-w-3xl bg-white shadow-xl rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 flex flex-col">
              
              {/* 리포트 헤더 */}
              <div className="bg-slate-900 text-white p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-900 to-slate-900 opacity-50"></div>
                <div className="relative z-10">
                  <h2 className="text-2xl font-extrabold mb-1">CAREER NEXT® REPORT</h2>
                  <p className="text-indigo-200 text-sm font-medium">경력 유지/확장이냐, 경력 전환이냐</p>
                </div>
              </div>

              <div className="p-10 space-y-10">
                
                {/* 1. Trip 우선순위 (Bottom-up: 여정 먼저 보여줌) */}
                <section>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b pb-2">
                    <TrendingUp className="text-indigo-600"/> 나의 선호 Trip (여정) 분석
                  </h3>
                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                    <p className="text-sm text-slate-600 mb-4">
                      선택하신 점수를 바탕으로 <b>가장 가능성이 높은 3가지 여정</b>을 도출했습니다.
                    </p>
                    <div className="space-y-3">
                      {result.ranking.slice(0, 3).map((trip, idx) => (
                        <div key={trip.id} className="flex items-center bg-white p-3 rounded-lg shadow-sm border border-slate-100">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm mr-3 ${idx===0 ? 'bg-indigo-600' : 'bg-slate-400'}`}>
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-baseline gap-2">
                              <span className="font-bold text-slate-800">{trip.name}</span>
                              <span className="text-xs text-slate-400 font-medium">{trip.name_en}</span>
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{trip.desc}</div>
                          </div>
                          <div className="text-lg font-bold text-indigo-600 w-12 text-right">{trip.score}<span className="text-xs text-slate-300 font-normal">/7</span></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* 2. Track 방향성 결론 */}
                <section>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b pb-2">
                    <Shuffle className="text-indigo-600"/> 종합 트랙(Track) 방향성
                  </h3>
                  <div className="flex flex-col md:flex-row gap-6 items-center">
                    
                    {/* 차트 영역 */}
                    <div className="w-full md:w-1/2 flex items-end justify-center gap-6 h-40 bg-slate-50 rounded-xl p-6 border border-slate-200">
                      {/* Track A Bar */}
                      <div className="flex flex-col items-center w-1/3 group">
                        <div className="text-sm font-bold text-blue-700 mb-2">{result.trackA}점</div>
                        <div 
                          className="w-full bg-blue-500 rounded-t-lg transition-all duration-1000 relative group-hover:bg-blue-600"
                          style={{ height: `${(result.trackA / 21) * 100}%` }}
                        ></div>
                        <div className="mt-2 text-xs font-bold text-slate-600 text-center">Track A<br/>유지/확장</div>
                      </div>
                      
                      {/* VS */}
                      <div className="text-slate-300 font-bold italic text-lg pb-8">VS</div>

                      {/* Track B Bar */}
                      <div className="flex flex-col items-center w-1/3 group">
                        <div className="text-sm font-bold text-green-700 mb-2">{result.trackB}점</div>
                        <div 
                          className="w-full bg-green-500 rounded-t-lg transition-all duration-1000 relative group-hover:bg-green-600"
                          style={{ height: `${(result.trackB / 21) * 100}%` }}
                        ></div>
                        <div className="mt-2 text-xs font-bold text-slate-600 text-center">Track B<br/>경력 전환</div>
                      </div>
                    </div>

                    {/* 텍스트 설명 */}
                    <div className="w-full md:w-1/2 text-sm text-slate-600 leading-relaxed bg-indigo-50 p-5 rounded-xl border border-indigo-100">
                      <h4 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
                        <Info size={16}/> 진단 결과
                      </h4>
                      {result.trackA > result.trackB ? (
                        <p>
                          현재 고객님은 새로운 변화보다는 <b>기존 경력을 활용하여 깊이를 더하거나 확장(Track A)</b>하는 쪽에 더 큰 무게를 두고 계십니다.
                        </p>
                      ) : result.trackB > result.trackA ? (
                        <p>
                           현재 고객님은 기존 경력과는 다른 <b>새로운 도전이나 환경 변화(Track B)</b>를 통해 제2의 커리어를 시작하려는 의지가 강하십니다.
                        </p>
                      ) : (
                        <p>
                          두 방향성에 대한 관심도가 비슷합니다. 현재 <b>현실적 안정과 새로운 도약 사이에서 균형</b>을 고민하고 계신 것으로 보입니다.
                        </p>
                      )}
                    </div>
                  </div>
                </section>

                {/* 3. AI 전문가 총평 */}
                <section>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b pb-2">
                    <FileText className="text-indigo-600"/> 전문가 총평
                  </h3>
                  <div className="prose prose-sm prose-slate max-w-none bg-slate-50 p-6 rounded-xl border border-slate-200 leading-7 text-slate-700">
                    <EditableContent value={result.text} />
                  </div>
                </section>
                
                {/* 저작권 표시 (필수) */}
                <div className="text-center pt-8 border-t border-slate-200">
                  <p className="text-[11px] text-slate-400 font-medium">
                    {CN_KNOWLEDGE.model_info.copyright}
                  </p>
                </div>

              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-6 opacity-50">
                <BarChart3 size={40}/>
              </div>
              <p className="text-lg font-bold text-slate-300">왼쪽에서 진단을 시작해주세요.</p>
              <p className="text-sm mt-2">나이와 6가지 여정 점수를 입력하면 분석이 시작됩니다.</p>
            </div>
          )}
        </main>
        
        {/* 저장 버튼 (결과 있을 때만 표시) */}
        {result && (
          <div className="absolute bottom-8 right-8 flex gap-3 z-50">
            <button onClick={() => saveAsPng(reportRef, `CareerNext_Lite_${ageGroup}`, showToast)} className="bg-slate-900 text-white px-5 py-3 rounded-full font-bold shadow-xl hover:-translate-y-1 transition-transform flex items-center text-sm"><Download className="mr-2" size={16}/> 이미지 저장</button>
            <button onClick={() => saveAsPdf(reportRef, `CareerNext_Lite_${ageGroup}`, showToast)} className="bg-red-600 text-white px-5 py-3 rounded-full font-bold shadow-xl hover:-translate-y-1 transition-transform flex items-center text-sm"><FileText className="mr-2" size={16}/> PDF 저장</button>
          </div>
        )}
      </div>
    </div>
  );
}