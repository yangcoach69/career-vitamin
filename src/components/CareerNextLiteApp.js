import React, { useState, useRef } from 'react';
import { fetchGemini, saveAsPng, saveAsPdf } from '../api'; 
import { 
  ChevronRight, BarChart3, TrendingUp, Shuffle, 
  Info, Download, FileText, User, Loader2,
  ArrowLeft, ArrowRight, Target, MessageSquareQuote, 
  BookOpen // 개요 아이콘
} from 'lucide-react';
import { Toast, EditableContent, Footer } from './SharedUI'; 

// -------------------------------------------------------------------------
// [지식 베이스] 커리어넥스트(Career Next)® 오리지널 콘텐츠
// -------------------------------------------------------------------------
const CN_KNOWLEDGE = {
  model_info: {
    title: "커리어넥스트 (Career Next)®",
    desc: "중장년의 생애 경력을 재설계하는 체계적인 진단 모델입니다. '경력 유지/확장'과 '경력 전환'이라는 두 가지 핵심 트랙과 여섯 가지 세부 여정을 통해 나에게 딱 맞는 커리어 방향을 제시합니다.",
    copyright: "커리어넥스트(Career Next)®는 저작권 등록(C-2025-036548) 및 상표권 등록(40-2433034-0000)이 완료된 도구입니다.",
  },
  trips: {
    1: { easy: "현 직장 고수하기", formal: "제자리 뛰기", formal_en: "Advanced Staying", desc: "현 위치에서 깊이 있는 성장", track: "Continuum", guide: "(퇴사자는 '0' 선택)" },
    2: { easy: "경력으로 이직하기", formal: "경력 사다리", formal_en: "Ladder Transition", desc: "더 나은 조건으로의 수평 이동", track: "Continuum" },
    3: { easy: "경력으로 독립하기", formal: "독립 전문가", formal_en: "Solo Expert", desc: "프리랜서 및 1인 지식 기업", track: "Continuum" }, // [수정] 용어 변경
    4: { easy: "할만한 일 당장하기", formal: "심플 스타트", formal_en: "Simple Start", desc: "진입장벽 낮은 일로 빠른 전환", track: "Shift" },
    5: { easy: "설레는 일 시작하기", formal: "열정 축", formal_en: "Passion Pivot", desc: "흥미/꿈 기반의 과감한 도전", track: "Shift" },
    6: { easy: "새 경력 준비하기", formal: "경력 리부트", formal_en: "Career Reboot", desc: "완전히 새로운 분야로의 리셋", track: "Shift" }
  },
  tracks: {
    Continuum: { name: "경력 유지/확장", name_en: "Career Continuum" },
    Shift: { name: "경력 전환", name_en: "Career Shift" }
  }
};

export default function CareerNextLiteApp({ onClose }) {
  // [State] 기본 점수 4점으로 초기화
  const [ageGroup, setAgeGroup] = useState('50대'); 
  const [scores, setScores] = useState({ 1:4, 2:4, 3:4, 4:4, 5:4, 6:4 }); 
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
    
    // 2. 랭킹 정렬
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
      2. overall_insight: 전체적인 성향과 트랙 방향성에 대한 진단 (명확하고 간결하게)
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
      let parsedData;
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        parsedData = JSON.parse(jsonMatch ? jsonMatch[0] : aiResponse);
      } catch (e) {
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

  const handleDownload = () => saveAsPng(reportRef, `CareerNext_Lite_${ageGroup}`, showToast);
  const handlePdfDownload = () => saveAsPdf(reportRef, `CareerNext_Lite_${ageGroup}`, showToast);

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
                다음 6가지 방향 중, 현재 <strong>본인의 생각이나 흥미가 가는 정도</strong>를 직관적으로 선택해주세요. (기본값: 보통)
              </div>

              <div className="space-y-8 pr-2">
                {[1, 2, 3, 4, 5, 6].map(id => (
                  <div key={id} className="group">
                    <div className="flex flex-wrap justify-between items-end mb-2">
                      <span className="font-bold text-slate-700 text-sm group-hover:text-amber-600 transition-colors flex items-center gap-1">
                        {CN_KNOWLEDGE.trips[id].easy}
                        {/* [수정] 퇴사자 안내 문구 추가 */}
                        {CN_KNOWLEDGE.trips[id].guide && (
                            <span className="text-[10px] text-red-500 font-normal bg-red-50 px-1 rounded">{CN_KNOWLEDGE.trips[id].guide}</span>
                        )}
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
                      <span className="flex items-center gap-0.5"><ArrowLeft size={10}/> 가능성 낮음 (0)</span>
                      <span className="flex items-center gap-0.5">가능성 높음 (7) <ArrowRight size={10}/></span>
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

        {/* [우측] 결과 리포트 (스크롤 가능하도록 구조 수정) */}
        <main className="flex-1 p-8 overflow-y-auto flex justify-center bg-slate-100">
          {result ? (
            // LifeCurveApp 처럼 A4 사이즈 고정 및 스크롤 최적화
            <div ref={reportRef} className="w-[210mm] min-h-[297mm] h-fit bg-white shadow-2xl p-12 flex flex-col animate-in fade-in zoom-in-95 duration-500">
              
              {/* 리포트 헤더 */}
              <div className="border-b-4 border-amber-500 pb-6 mb-8">
                <div className="flex justify-between items-end mb-2">
                    <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold tracking-wider">CAREER NEXT REPORT</span>
                    <div className="text-right text-slate-500 text-xs">
                        작성일: {new Date().toLocaleDateString()}
                    </div>
                </div>
                <h1 className="text-4xl font-extrabold text-slate-900">커리어 방향성 진단 리포트</h1>
                <p className="text-slate-500 mt-2 text-sm font-medium">
                    {ageGroup} 고객님의 새로운 도약을 위한 커리어넥스트(Career Next)® 분석 결과
                </p>
              </div>

              {/* 0. 커리어넥스트 개요 (추가됨) */}
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 mb-10">
                <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <BookOpen className="text-indigo-600" size={20}/> 커리어넥스트(Career Next)® 란?
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed text-justify">
                    {CN_KNOWLEDGE.model_info.desc}
                </p>
              </div>

              {/* 1. Track Graph (한글 강조, 영문 병기) */}
              <div className="mb-10">
                  <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Shuffle className="text-amber-600" size={20}/> 트랙(Track) 방향성 비교
                  </h3>
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-6 px-4">
                        <div className="text-center w-1/3">
                            <div className="text-xl font-extrabold text-blue-600 mb-1">경력 유지/확장</div>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Career Continuum</div>
                        </div>
                        <div className="text-slate-300 font-black text-2xl italic">VS</div>
                        <div className="text-center w-1/3">
                            <div className="text-xl font-extrabold text-green-600 mb-1">경력 전환</div>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Career Shift</div>
                        </div>
                    </div>
                    
                    {/* Graph Bar */}
                    <div className="h-8 flex rounded-full overflow-hidden bg-slate-100 shadow-inner">
                        <div 
                            className="bg-blue-500 flex items-center justify-center text-xs font-bold text-white transition-all duration-1000"
                            style={{ width: `${(result.continuum / (result.continuum + result.shift || 1)) * 100}%` }}
                        >
                            {result.continuum}점
                        </div>
                        <div 
                            className="bg-green-500 flex items-center justify-center text-xs font-bold text-white transition-all duration-1000"
                            style={{ width: `${(result.shift / (result.continuum + result.shift || 1)) * 100}%` }}
                        >
                            {result.shift}점
                        </div>
                    </div>
                  </div>
              </div>

              {/* 2. Ranking Table */}
              <div className="mb-10">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Target className="text-amber-600" size={20}/> 여정(Trip) 우선순위 분석
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
                          <tr key={trip.id} className={idx === 0 ? "bg-amber-50" : ""}>
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
                                {trip.score}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
              </div>

              {/* 3. AI Analysis (Structured) */}
              <div className="space-y-6 mb-10">
                <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2 border-b pb-2">
                    <FileText className="text-amber-600" size={20}/> 전문가 심층 분석
                </h3>

                {/* 카드 1: 종합 진단 */}
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6">
                    <h4 className="font-bold text-indigo-900 mb-3 flex items-center gap-2 text-base">
                        <Info size={18}/> 종합 진단: <span className="text-indigo-700"><EditableContent value={result.ai.summary_title} className="inline"/></span>
                    </h4>
                    <div className="text-sm text-slate-700 leading-relaxed text-justify bg-white p-4 rounded-lg border border-indigo-100 shadow-sm">
                        <EditableContent value={result.ai.overall_insight} onSave={(v)=>console.log(v)}/>
                    </div>
                </div>

                {/* 카드 2: 핵심 전략 */}
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-6">
                    <h4 className="font-bold text-amber-900 mb-3 flex items-center gap-2 text-base">
                        <Target size={18}/> 1순위 여정 실행 전략
                    </h4>
                    <div className="text-sm text-slate-700 leading-relaxed text-justify bg-white p-4 rounded-lg border border-amber-100 shadow-sm">
                        <EditableContent value={result.ai.top_strategy} onSave={(v)=>console.log(v)}/>
                    </div>
                </div>
              </div>

              {/* 4. 응원 메시지 (하단 배치) */}
              <div className="bg-slate-800 text-white p-8 rounded-xl shadow-lg mt-auto">
                <h3 className="font-bold text-amber-400 mb-4 text-lg flex items-center gap-2">
                    <MessageSquareQuote className="text-amber-400"/> {ageGroup}를 위한 응원
                </h3>
                <div className="leading-relaxed text-slate-200 text-justify text-lg font-medium italic">
                    "<EditableContent value={result.ai.cheer_message} onSave={(v)=>console.log(v)}/>"
                </div>
              </div>

              {/* 저작권 표시 */}
              <div className="mt-8 text-center">
                  <p className="text-[10px] text-slate-400 inline-block border-t border-slate-200 pt-4">
                    {CN_KNOWLEDGE.model_info.copyright}
                  </p>
                  <div className="mt-4">
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
              <button onClick={handleDownload} className="bg-white text-slate-900 border border-slate-200 px-6 py-3 rounded-full font-bold shadow-xl hover:-translate-y-1 flex items-center transition-transform"><Download className="mr-2" size={20}/> 이미지 저장</button>
              <button onClick={handlePdfDownload} className="bg-indigo-800 text-white px-6 py-3 rounded-full font-bold shadow-xl hover:-translate-y-1 flex items-center transition-transform"><FileText className="mr-2" size={20}/> PDF 저장</button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}