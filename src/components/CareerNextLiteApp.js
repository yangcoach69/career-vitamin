import React, { useState, useRef } from 'react';
import { fetchGemini, saveAsPng, saveAsPdf } from '../api'; 
import { 
  ChevronRight, BarChart3, TrendingUp, Shuffle, 
  Info, Download, FileText, User, Loader2,
  ArrowLeft, ArrowRight, CheckCircle2, Target, MessageSquareQuote
} from 'lucide-react';
import { Toast, EditableContent, Footer } from './SharedUI'; 

// -------------------------------------------------------------------------
// [지식 베이스] 커리어넥스트(Career Next)® 오리지널 콘텐츠
// -------------------------------------------------------------------------
const CN_KNOWLEDGE = {
  model_info: {
    title: "커리어넥스트 (Career Next)®",
    copyright: "커리어넥스트(Career Next)®는 저작권 등록(C-2025-036548) 및 상표권 등록(40-2433034-0000)이 완료된 도구입니다.",
  },
  trips: {
    1: { easy: "현 직장 고수하기", formal: "제자리 뛰기", formal_en: "Advanced Staying", desc: "현 위치에서 깊이 있는 성장", track: "Continuum" },
    2: { easy: "경력으로 이직하기", formal: "경력 사다리", formal_en: "Ladder Transition", desc: "더 나은 조건으로의 수평 이동", track: "Continuum" },
    3: { easy: "경력으로 홀로서기", formal: "독립 전문가", formal_en: "Solo Expert", desc: "프리랜서 및 1인 지식 기업", track: "Continuum" },
    4: { easy: "할만한 일 당장하기", formal: "심플 스타트", formal_en: "Simple Start", desc: "진입장벽 낮은 일로 빠른 전환", track: "Shift" },
    5: { easy: "설레는 일 시작하기", formal: "열정 축", formal_en: "Passion Pivot", desc: "흥미/꿈 기반의 과감한 도전", track: "Shift" },
    6: { easy: "새 경력 준비하기", formal: "경력 리부트", formal_en: "Career Reboot", desc: "완전히 새로운 분야로의 리셋", track: "Shift" }
  },
  tracks: {
    Continuum: { name: "경력 유지/확장", name_en: "Career Continuum", color: "text-blue-600", bg: "bg-blue-500", border: "border-blue-200", light: "bg-blue-50" },
    Shift: { name: "경력 전환", name_en: "Career Shift", color: "text-green-600", bg: "bg-green-500", border: "border-green-200", light: "bg-green-50" }
  }
};

export default function CareerNextLiteApp({ onClose }) {
  // [State]
  const [ageGroup, setAgeGroup] = useState('50대'); 
  const [scores, setScores] = useState({ 1:0, 2:0, 3:0, 4:0, 5:0, 6:0 });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const reportRef = useRef(null);

  const showToast = (msg) => setToastMsg(msg);

  const handleScoreChange = (id, val) => {
    setScores(prev => ({ ...prev, [id]: parseInt(val) }));
  };

  const handleAnalyze = async () => {
    setLoading(true);
    
    // 1. 점수 계산
    const continuumScore = scores[1] + scores[2] + scores[3];
    const shiftScore = scores[4] + scores[5] + scores[6];
    
    // 2. 랭킹 정렬 (6개 전체)
    const sortedTrips = Object.entries(scores)
      .sort(([, a], [, b]) => b - a)
      .map(([id, score]) => ({ 
        id, score, ...CN_KNOWLEDGE.trips[id] 
      }));
    
    // 3. 프롬프트 (JSON 출력 요청)
    const prompt = `
      당신은 4060 신중년 커리어 설계를 돕는 전문 코치입니다.
      사용자가 입력한 데이터를 바탕으로 다음 JSON 포맷에 맞춰 분석 내용을 작성해주세요.

      [사용자 정보]
      - 연령: ${ageGroup}
      - Career Continuum (유지/확장) 점수: ${continuumScore}
      - Career Shift (전환) 점수: ${shiftScore}
      - 1순위 여정: ${sortedTrips[0].formal} (${sortedTrips[0].formal_en})

      [요청사항]
      1. summary_title: 사용자의 현재 상태를 한 줄로 요약하는 매력적인 헤드라인
      2. overall_insight: 전체적인 성향과 트랙 방향성에 대한 진단 (2~3문장)
      3. top_strategy: 1순위 여정을 실행하기 위한 구체적인 조언 (2~3문장)
      4. cheer_message: ${ageGroup}의 인생을 응원하는 따뜻한 마무리 멘트

      [반드시 JSON 형식으로만 출력]
      {
        "summary_title": "...",
        "overall_insight": "...",
        "top_strategy": "...",
        "cheer_message": "..."
      }
    `;

    try {
      const aiResponse = await fetchGemini(prompt);
      // JSON 파싱 시도
      let parsedData;
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        parsedData = JSON.parse(jsonMatch ? jsonMatch[0] : aiResponse);
      } catch (e) {
        // 파싱 실패 시 텍스트라도 보여주기 위한 폴백
        parsedData = {
            summary_title: "커리어 방향성 진단 결과",
            overall_insight: aiResponse,
            top_strategy: "",
            cheer_message: ""
        };
      }

      setResult({
        ai: parsedData,
        continuum: continuumScore,
        shift: shiftScore,
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
          <div className="w-8 h-8 bg-amber-500 rounded flex items-center justify-center font-bold text-lg text-slate-900">N</div>
          <div>
            <h1 className="font-bold text-lg leading-none">Career Next® Lite</h1>
            <p className="text-[10px] text-slate-300 opacity-80">4060 커리어 방향성 진단</p>
          </div>
        </div>
        <button onClick={onClose} className="flex items-center text-sm hover:text-amber-300 transition-colors">
          <ChevronRight className="w-5 h-5"/> 닫기
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        
        {/* [좌측] 입력 패널 */}
        <aside className="w-[420px] bg-white border-r border-slate-200 flex flex-col overflow-y-auto shrink-0 shadow-lg z-10">
          <div className="p-6 space-y-8">
            
            {/* 1. 연령대 */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <User size={18} className="text-amber-600"/> 연령대 선택
              </h3>
              <div className="flex gap-2">
                {['40대', '50대', '60대 이상'].map(age => (
                  <button 
                    key={age}
                    onClick={() => setAgeGroup(age)}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                      ageGroup === age 
                      ? 'bg-amber-500 text-white shadow-md' 
                      : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {age}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. 진단 슬라이더 */}
            <div>
              <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                <TrendingUp size={18} className="text-amber-600"/> 가능성 진단
              </h3>
              <div className="bg-amber-50 p-3 rounded-lg text-xs text-amber-900 mb-6 leading-relaxed">
                다음 6가지 방향 중, 현재 <strong>본인의 생각이나 흥미가 가는 정도</strong>를 직관적으로 선택해주세요.
              </div>

              <div className="space-y-8 pr-2">
                {[1, 2, 3, 4, 5, 6].map(id => (
                  <div key={id} className="group">
                    <div className="flex justify-between items-end mb-2">
                      <span className="font-bold text-slate-700 text-sm group-hover:text-amber-600 transition-colors">
                        {CN_KNOWLEDGE.trips[id].easy}
                      </span>
                      <span className="text-sm font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                        {scores[id]} <span className="text-slate-400 font-normal text-xs">/ 7</span>
                      </span>
                    </div>
                    
                    <input 
                      type="range" min="0" max="7" step="1"
                      value={scores[id]}
                      onChange={(e) => handleScoreChange(id, e.target.value)}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                    
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1.5 font-medium">
                      <span className="flex items-center gap-0.5"><ArrowLeft size={10}/> 가능성 낮음</span>
                      <span className="flex items-center gap-0.5">가능성 높음 <ArrowRight size={10}/></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={handleAnalyze} 
              disabled={loading}
              className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 mt-4"
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
                <div className="relative z-10">
                  <h2 className="text-3xl font-extrabold mb-1 tracking-tight">CAREER NEXT® REPORT</h2>
                  <p className="text-amber-400 text-sm font-bold opacity-90 tracking-widest uppercase">Lite Version for 4060</p>
                </div>
              </div>

              <div className="p-10 space-y-10">
                
                {/* 1. Ranking Table (6개 전체) */}
                <section>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b-2 border-slate-100 pb-2">
                    <Target className="text-amber-600"/> 여정(Trip) 우선순위 분석
                  </h3>
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase">
                        <tr>
                          <th className="px-5 py-3 text-center w-16">순위</th>
                          <th className="px-5 py-3">여정 (Trip) 명칭</th>
                          <th className="px-5 py-3 text-center w-24">점수</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {result.ranking.map((trip, idx) => (
                          <tr key={trip.id} className={idx === 0 ? "bg-amber-50" : "hover:bg-slate-50 transition-colors"}>
                            <td className="px-5 py-3 text-center">
                              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${idx === 0 ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                {idx + 1}
                              </span>
                            </td>
                            <td className="px-5 py-3">
                                <div className="flex flex-col">
                                    <span className={`font-bold ${idx === 0 ? 'text-amber-900' : 'text-slate-700'}`}>
                                        {trip.formal} <span className="text-[10px] text-slate-400 font-normal ml-1">{trip.formal_en}</span>
                                    </span>
                                    <span className="text-xs text-slate-500 mt-0.5">{trip.desc}</span>
                                </div>
                            </td>
                            <td className="px-5 py-3 text-center font-bold text-slate-700">
                                {trip.score} <span className="text-slate-300 font-normal text-xs">/ 7</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* 2. Track Graph (Continuum vs Shift) */}
                <section>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b-2 border-slate-100 pb-2">
                    <Shuffle className="text-amber-600"/> 트랙(Track) 방향성 비교
                  </h3>
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <div className="text-center">
                            <div className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1">Career Continuum</div>
                            <div className="text-lg font-extrabold text-slate-800">경력 유지/확장</div>
                        </div>
                        <div className="text-slate-300 font-black text-xl italic">VS</div>
                        <div className="text-center">
                            <div className="text-xs font-bold text-green-500 uppercase tracking-wider mb-1">Career Shift</div>
                            <div className="text-lg font-extrabold text-slate-800">경력 전환</div>
                        </div>
                    </div>
                    
                    {/* Graph Bar */}
                    <div className="h-6 flex rounded-full overflow-hidden bg-slate-200">
                        <div 
                            className="bg-blue-500 flex items-center justify-center text-[10px] font-bold text-white transition-all duration-1000"
                            style={{ width: `${(result.continuum / (result.continuum + result.shift || 1)) * 100}%` }}
                        >
                            {result.continuum}점
                        </div>
                        <div 
                            className="bg-green-500 flex items-center justify-center text-[10px] font-bold text-white transition-all duration-1000"
                            style={{ width: `${(result.shift / (result.continuum + result.shift || 1)) * 100}%` }}
                        >
                            {result.shift}점
                        </div>
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-slate-500 px-1">
                        <span>현재 경력 활용 집중</span>
                        <span>새로운 기회 탐색 집중</span>
                    </div>
                  </div>
                </section>

                {/* 3. AI Analysis (Structured Cards) */}
                <section>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b-2 border-slate-100 pb-2">
                    <FileText className="text-amber-600"/> 전문가 심층 분석
                  </h3>
                  
                  <div className="space-y-4">
                    {/* 카드 1: 종합 진단 */}
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5">
                        <h4 className="font-bold text-indigo-900 mb-2 flex items-center gap-2 text-sm">
                            <Info size={16}/> 종합 진단: <EditableContent value={result.ai.summary_title} className="inline"/>
                        </h4>
                        <div className="text-sm text-slate-700 leading-relaxed">
                            <EditableContent value={result.ai.overall_insight} onSave={(v)=>console.log(v)}/>
                        </div>
                    </div>

                    {/* 카드 2: 핵심 전략 */}
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-5">
                        <h4 className="font-bold text-amber-900 mb-2 flex items-center gap-2 text-sm">
                            <Target size={16}/> 1순위 여정 실행 전략
                        </h4>
                        <div className="text-sm text-slate-700 leading-relaxed">
                            <EditableContent value={result.ai.top_strategy} onSave={(v)=>console.log(v)}/>
                        </div>
                    </div>

                    {/* 카드 3: 코치 한마디 */}
                    <div className="bg-slate-100 border border-slate-200 rounded-xl p-5">
                        <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2 text-sm">
                            <MessageSquareQuote size={16}/> {ageGroup}를 위한 응원
                        </h4>
                        <div className="text-sm text-slate-600 italic leading-relaxed">
                            "<EditableContent value={result.ai.cheer_message} onSave={(v)=>console.log(v)}/>"
                        </div>
                    </div>
                  </div>
                </section>
                
                {/* 저작권 표시 */}
                <div className="mt-auto">
                   <div className="flex justify-center mb-6">
                      <p className="text-[10px] text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                        {CN_KNOWLEDGE.model_info.copyright}
                      </p>
                   </div>
                   <Footer />
                </div>

              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 animate-in fade-in zoom-in-95">
              <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mb-6 opacity-50">
                <BarChart3 size={48}/>
              </div>
              <p className="text-xl font-bold text-slate-300">커리어 방향성을 진단해보세요</p>
              <p className="text-sm mt-3 text-slate-400 max-w-xs text-center leading-relaxed">
                좌측 패널에서 각 항목에 대한 본인의 생각(가능성)을 입력하면, AI가 분석 리포트를 생성합니다.
              </p>
            </div>
          )}

          {/* 다운로드 버튼 */}
          {result && (
            <div className="absolute bottom-8 right-8 flex gap-3 z-50">
              <button onClick={() => saveAsPng(reportRef, `CareerNext_Lite_${ageGroup}`, showToast)} className="bg-slate-900 text-white px-5 py-3 rounded-full font-bold shadow-xl hover:-translate-y-1 transition-transform flex items-center text-sm"><Download className="mr-2" size={16}/> 이미지 저장</button>
              <button onClick={() => saveAsPdf(reportRef, `CareerNext_Lite_${ageGroup}`, showToast)} className="bg-red-600 text-white px-5 py-3 rounded-full font-bold shadow-xl hover:-translate-y-1 transition-transform flex items-center text-sm"><FileText className="mr-2" size={16}/> PDF 저장</button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}