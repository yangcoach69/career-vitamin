import React, { useState, useRef } from 'react';
import { fetchGemini, saveAsPng, saveAsPdf } from '../api'; 
import { 
  ChevronRight, BarChart3, TrendingUp, Shuffle, 
  Info, Download, FileText, User, Loader2
} from 'lucide-react';
import { Toast, EditableContent } from './SharedUI'; 

// -------------------------------------------------------------------------
// [지식 베이스] 커리어넥스트(Career Next)® 오리지널 콘텐츠
// -------------------------------------------------------------------------
const CN_KNOWLEDGE = {
  model_info: {
    title: "커리어넥스트 (Career Next)®",
    copyright: "커리어넥스트(Career Next)®는 저작권 등록(C-2025-036548) 및 상표권 등록(40-2433034-0000)이 완료된 도구입니다.",
    structure: "2개의 트랙(Track)과 6개의 여정(Trip)으로 구성됨."
  },
  // [중요] 매핑 테이블: 쉬운 용어(Easy) <-> 정식 용어(Formal)
  trips: {
    1: { 
      easy: "현 직장 고수하기", 
      formal: "제자리 뛰기", 
      formal_en: "Advanced Staying", 
      desc: "현 위치에서 깊이 있는 성장. 전직/이직 없이 조직 내 전문성 심화 및 역할 확대.",
      track: "A"
    },
    2: { 
      easy: "경력으로 이직하기", 
      formal: "경력 사다리", 
      formal_en: "Ladder Transition", 
      desc: "유사 직무/분야로 더 나은 조건을 찾아 이동. 경력의 연속성을 유지하며 사다리를 오름.",
      track: "A"
    },
    3: { 
      easy: "경력으로 홀로서기", 
      formal: "독립 전문가", 
      formal_en: "Solo Expert", 
      desc: "조직을 떠나 프리랜서나 1인 기업으로 홀로서기. 지식 사업화(강의/컨설팅) 중심.",
      track: "A"
    },
    4: { 
      easy: "할만한 일 당장하기", 
      formal: "심플 스타트", 
      formal_en: "Simple Start", 
      desc: "진입장벽이 낮은 일로의 빠른 전환. 워라밸을 중시하거나 스트레스가 적은 일을 선택.",
      track: "B"
    },
    5: { 
      easy: "설레는 일 시작하기", 
      formal: "열정 축", 
      formal_en: "Passion Pivot", 
      desc: "흥미와 열정을 기반으로 한 과감한 도전. 사이드 프로젝트로 시작하여 점진적 전환.",
      track: "B"
    },
    6: { 
      easy: "새 경력 준비하기", 
      formal: "경력 리부트", 
      formal_en: "Career Reboot", 
      desc: "완전히 새로운 분야로의 리셋. 교육, 자격증 등 장기적이고 체계적인 준비 필요.",
      track: "B"
    }
  },
  tracks: {
    A: { name: "경력 유지/확장", name_en: "Career Continuum", desc: "기존 전문성을 살려 안정적 성장을 추구하는 방향" },
    B: { name: "경력 전환", name_en: "Career Shift", desc: "새로운 직업과 환경을 찾아 변화를 시도하는 방향" }
  }
};

export default function CareerNextLiteApp({ onClose }) {
  // [State] 입력값
  const [ageGroup, setAgeGroup] = useState('50대'); 
  const [scores, setScores] = useState({ 1:0, 2:0, 3:0, 4:0, 5:0, 6:0 });

  // [State] 결과 및 UI
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const reportRef = useRef(null);

  const showToast = (msg) => setToastMsg(msg);

  const handleScoreChange = (id, val) => {
    setScores(prev => ({ ...prev, [id]: parseInt(val) }));
  };

  // [핵심] AI 분석 요청
  const handleAnalyze = async () => {
    setLoading(true);
    
    // 1. 점수 계산 (Track 합산 - 내부 로직)
    const trackAScore = scores[1] + scores[2] + scores[3];
    const trackBScore = scores[4] + scores[5] + scores[6];
    
    // 2. 순위 계산 (쉬운 용어로 입력받았지만, 결과는 정식 용어로 변환 준비)
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
      
      [진단 결과 데이터]
      1. Track A (경력 유지/확장) 총점: ${trackAScore} (Trip 1,2,3 합계)
      2. Track B (경력 전환) 총점: ${trackBScore} (Trip 4,5,6 합계)
      3. 여정별 점수 (사용자 입력값 -> 정식 명칭 매핑):
         ${JSON.stringify(sortedTrips.map(t => `${t.easy} -> ${t.formal}: ${t.score}점`))}

      [작성 가이드]
      1. **총평 및 트랙 분석:** - 먼저 사용자가 선택한 '쉬운 용어(예: 현 직장 고수하기 등)'들의 점수 경향을 언급하세요.
         - 그리고 이 선택들이 모여 **어떤 Track(경력 유지 vs 전환)**으로 기우는지 결론을 내려주세요.
         - Track A와 B의 점수 차이를 비교하며 방향성의 뚜렷함을 진단해주세요.
      2. **최우선 여정 코칭:** - 가장 점수가 높은 1순위 여정(${topTrip.formal})에 대해 설명하고, 구체적인 실행 팁을 주세요.
         - 이때 반드시 **정식 명칭(${topTrip.formal} / ${topTrip.formal_en})**을 사용하여 전문성을 보여주세요.
      3. **톤앤매너:** - "당신은 ~입니다" 같은 단정적인 말투 대신, "가능성이 높아 보입니다", "~하는 것을 추천드립니다" 같은 **부드러운 권유형**을 사용하세요.
         - ${ageGroup}라는 점을 고려하여 현실적인 조언을 덧붙여주세요.
      4. **형식:** 잘 정리된 마크다운 텍스트로 작성하세요.
    `;

    try {
      const aiResponse = await fetchGemini(prompt);
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
        
        {/* [좌측] 입력 패널 - 쉬운 용어 사용 */}
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

            {/* 2. 가능성 진단 (쉬운 용어 리스트) */}
            <div>
              <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                <TrendingUp size={18} className="text-indigo-600"/> 가능성 진단
              </h3>
              <p className="text-xs text-slate-500 mb-6 bg-slate-50 p-3 rounded leading-relaxed">
                다음 6가지 방향 중, 현재 <b>본인의 생각이나 흥미</b>가 가는 정도를 선택해주세요.<br/>
                (0점: 전혀 없음 ~ 7점: 매우 높음)
              </p>

              <div className="space-y-6">
                {/* 1~6번 여정을 트랙 구분 없이 쭉 나열 (사용자에게는 평등한 옵션으로 보임) */}
                {[1, 2, 3, 4, 5, 6].map(id => (
                  <div key={id} className="mb-5 last:mb-0 group">
                    <div className="flex justify-between text-sm font-bold text-slate-700 mb-2">
                      {/* 여기서는 쉬운 용어(easy)만 보여줍니다 */}
                      <span className="flex items-center gap-2 group-hover:text-indigo-600 transition-colors">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-indigo-500"></span>
                        {CN_KNOWLEDGE.trips[id].easy}
                      </span>
                      <span className={`text-sm ${scores[id] > 0 ? 'text-indigo-600 font-extrabold' : 'text-slate-300'}`}>
                        {scores[id]}
                      </span>
                    </div>
                    <input 
                      type="range" min="0" max="7" step="1"
                      value={scores[id]}
                      onChange={(e) => handleScoreChange(id, e.target.value)}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 분석 버튼 */}
            <button 
              onClick={handleAnalyze} 
              disabled={loading}
              className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 mt-4"
            >
              {loading ? <Loader2 className="animate-spin"/> : <span className="flex items-center gap-2">커리어넥스트 진단하기 <ChevronRight size={16}/></span>}
            </button>

          </div>
        </aside>

        {/* [우측] 결과 리포트 - 전문 용어 매핑 및 트랙 계산 결과 노출 */}
        <main className="flex-1 overflow-y-auto bg-slate-100 p-8 flex justify-center">
          {result ? (
            <div ref={reportRef} className="w-full max-w-3xl bg-white shadow-xl rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 flex flex-col">
              
              {/* 리포트 헤더 */}
              <div className="bg-slate-900 text-white p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-900 to-slate-900 opacity-50"></div>
                <div className="relative z-10">
                  <h2 className="text-2xl font-extrabold mb-1">CAREER NEXT® REPORT</h2>
                  <p className="text-indigo-200 text-sm font-medium">진단 결과 및 전문 코칭 리포트</p>
                </div>
              </div>

              <div className="p-10 space-y-10">
                
                {/* 1. 종합 트랙(Track) 분석 결과 (여기서 처음으로 트랙 개념 등장) */}
                <section>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b pb-2">
                    <Shuffle className="text-indigo-600"/> 종합 방향성 진단 (Track)
                  </h3>
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <p className="text-sm text-slate-600 mb-6 text-center">
                      선택하신 항목들을 분석한 결과, 고객님의 커리어 방향성은 아래와 같이 나타납니다.
                    </p>
                    
                    <div className="flex items-end justify-center gap-8 h-48 px-8">
                      {/* Track A Result */}
                      <div className="flex flex-col items-center w-32 group">
                        <div className="text-lg font-extrabold text-blue-600 mb-2">{result.trackA}점</div>
                        <div 
                          className="w-full bg-blue-500 rounded-t-lg transition-all duration-1000 relative shadow-lg group-hover:bg-blue-600"
                          style={{ height: `${Math.max((result.trackA / 21) * 100, 10)}%` }} // 최소 높이 보장
                        ></div>
                        <div className="mt-3 text-center">
                          <div className="text-xs font-bold text-slate-400">TRACK A</div>
                          <div className="text-sm font-bold text-slate-800">경력 유지/확장</div>
                        </div>
                      </div>
                      
                      {/* VS */}
                      <div className="text-slate-300 font-black italic text-2xl pb-10">VS</div>

                      {/* Track B Result */}
                      <div className="flex flex-col items-center w-32 group">
                        <div className="text-lg font-extrabold text-green-600 mb-2">{result.trackB}점</div>
                        <div 
                          className="w-full bg-green-500 rounded-t-lg transition-all duration-1000 relative shadow-lg group-hover:bg-green-600"
                          style={{ height: `${Math.max((result.trackB / 21) * 100, 10)}%` }}
                        ></div>
                        <div className="mt-3 text-center">
                          <div className="text-xs font-bold text-slate-400">TRACK B</div>
                          <div className="text-sm font-bold text-slate-800">경력 전환</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 2. 상세 여정(Trip) 매핑 결과 (쉬운 용어 -> 정식 용어) */}
                <section>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b pb-2">
                    <TrendingUp className="text-indigo-600"/> 나의 선호 Trip (여정) 분석
                  </h3>
                  <div className="space-y-3">
                    {result.ranking.slice(0, 3).map((trip, idx) => (
                      <div key={trip.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shrink-0 ${idx===0 ? 'bg-indigo-600' : 'bg-slate-400'}`}>
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          {/* 매핑 포인트: 쉬운 용어(내가 고른 것) -> 정식 용어(전문 진단) */}
                          <div className="text-xs text-slate-400 mb-1">내가 고른 항목: "{trip.easy}"</div>
                          <div className="flex items-baseline gap-2">
                            <span className="font-bold text-lg text-slate-800">{trip.formal}</span>
                            <span className="text-xs text-indigo-600 font-bold tracking-wide">{trip.formal_en}</span>
                          </div>
                          <div className="text-xs text-slate-500 mt-1">{trip.desc}</div>
                        </div>
                        <div className="text-xl font-bold text-indigo-600 w-12 text-right">{trip.score}</div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 3. AI 전문가 총평 */}
                <section>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b pb-2">
                    <FileText className="text-indigo-600"/> 전문가 총평
                  </h3>
                  <div className="prose prose-sm prose-slate max-w-none bg-indigo-50/50 p-6 rounded-xl border border-indigo-100 leading-7 text-slate-700">
                    <EditableContent value={result.text} />
                  </div>
                </section>
                
                {/* 저작권 표시 */}
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
              <p className="text-sm mt-2">본인의 생각에 가까운 정도를 선택하면 분석이 시작됩니다.</p>
            </div>
          )}
        </main>
        
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