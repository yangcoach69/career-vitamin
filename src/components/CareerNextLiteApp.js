import React, { useState, useRef } from 'react';
import { fetchGemini, saveAsPng, saveAsPdf } from '../api'; 
import { 
  ChevronLeft, BarChart3, TrendingUp, Shuffle, 
  Info, Download, FileText, User, Loader2,
  ArrowLeft, ArrowRight, Target, MessageSquareQuote, 
  BookOpen, HelpCircle
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
    1: { 
      easy: "현 직장 고수하기", formal: "제자리 뛰기", formal_en: "Advanced Staying", track: "Continuum", guide: "(퇴사자는 '0' 선택)",
      desc: "현 위치에서 깊이 있는 성장",
      detail_concept: "자기계발과 도약을 통해 기존 경력과 현재 상황을 그대로 이어가는 여정입니다. 현재 위치에서의 깊이 있는 성장에 집중합니다.",
      detail_features: "전직은 물론 이직도 고려하지 않습니다. 현재 조직 내에서 전문성을 더욱 심화하고, 새로운 프로젝트나 역할을 통해 성장하는 것을 목표로 합니다. 안정성을 중시하면서도 정체되지 않고 지속적으로 발전하고자 하는 분들에게 적합한 경로입니다.",
      detail_tip: "[현 직무 내 전문성 심화] 고객이 현재 위치에서 도약할 수 있도록 필요한 구체적인 자기계발 항목(예: 고급 경력기술 습득, 리더십 훈련, 특정 자격증)을 탐색하는 데 집중합니다. 조직 내에서의 가치 증진 및 영향력 확대 방안을 설계합니다."
    },
    2: { 
      easy: "경력으로 이직하기", formal: "경력 사다리", formal_en: "Ladder Transition", track: "Continuum",
      desc: "더 나은 조건으로의 수평 이동",
      detail_concept: "안정적인 경력 개발과 지속적인 성장을 상징하는 여정입니다. 사다리를 한 단계씩 올라가듯 체계적이고 예측 가능한 경력 발전을 추구합니다.",
      detail_features: "다른 사다리로의 이동은 이직이나 새로운 조직으로의 경력 이동을 의미합니다. 하지만 같은 분야, 유사한 직무에서 더 나은 조건이나 기회를 찾아 움직이는 것이기에 경력의 연속성은 유지됩니다. 전문 분야를 바꾸지 않으면서 더 좋은 환경에서 커리어를 발전시키고자 하는 분들에게 이상적입니다.",
      detail_tip: "[이동 목표 및 경로 설정] 고객의 현재 경력 사다리에서 다음 사다리로 안전하게 이동할 수 있는 이직 전략을 수립하는 데 초점을 둡니다. 관련 산업/기업 분석, 이력서 및 포트폴리오 강화, 관계사/협력사 및 경쟁사 등 네트워킹 전략 등을 구체적으로 지도합니다."
    },
    3: { 
      easy: "경력으로 독립하기", formal: "독립 전문가", formal_en: "Solo Expert", track: "Continuum",
      desc: "프리랜서 및 1인 지식 기업",
      detail_concept: "경력을 기반으로 한 프리랜서나 1인 기업 형태로의 전환을 말합니다. 조직의 틀을 벗어나 독립적으로 전문성을 발휘합니다.",
      detail_features: "교육 훈련 프로그램을 통해 전문 분야의 강의와 컨설팅을 주로 수행하게 됩니다. 오랜 경력에서 쌓은 노하우를 체계화하여 다른 사람들에게 전수하거나, 기업의 문제 해결을 돕는 역할을 합니다. 자율성과 전문성을 동시에 추구하며, 자신의 브랜드를 구축하고자 하는 분들에게 적합합니다.",
      detail_tip: "[지식 사업화 전략] 고객이 기존 경력을 교육 훈련 콘텐츠나 컨설팅 서비스로 변환하는 방법을 설계합니다. 1인 기업 운영에 필요한 사업 계획(브랜딩, 마케팅, 재정 관리 등) 및 독립 전문가로서의 전문성 강화 방안(예: 전문 강사/코치 자격, 특정 분야 심화 학습 등) 플랜 수립을 지원합니다."
    },
    4: { 
      easy: "할만한 일 당장하기", formal: "심플 스타트", formal_en: "Simple Start", track: "Shift",
      desc: "진입장벽 낮은 일로 빠른 전환",
      detail_concept: "기존 경력과 무관하거나 연관성이 거의 없는 일로의 전환입니다. 복잡한 준비 과정 없이 비교적 쉽게 시작할 수 있는 새로운 경로를 의미합니다.",
      detail_features: "약간의 준비와 적응을 통해 할 수 있는 기초적인 직무로의 전환을 의미합니다. 진입 장벽이 낮고, 특별한 자격이나 오랜 교육이 필요하지 않은 분야가 주를 이룹니다. 경력의 무게를 잠시 내려놓고 새로운 출발을 원하는 분들, 워라밸을 중시하거나 스트레스가 적은 일을 찾는 분들에게 적합합니다.",
      detail_tip: "[빠른 진입 및 적응 지원] 경력전환에 필요한 최소한의 준비를 파악하고, 고객의 기존 역량 중 이직에 활용 가능한 소프트 스킬(Soft Skill)을 강조하여 빠른 진입을 돕습니다. 전환 후 새로운 환경에 적응하는 초기 단계의 심리적 지원에 중점을 둡니다."
    },
    5: { 
      easy: "설레는 일 시작하기", formal: "열정 축", formal_en: "Passion Pivot", track: "Shift",
      desc: "흥미/꿈 기반의 과감한 도전",
      detail_concept: "기존 경력과 관계없는 흥미와 열정을 기반으로 한 경력 전환입니다. '하고 싶었던 일', '꿈꿔왔던 분야'로의 용감한 도전을 의미합니다.",
      detail_features: "여섯 가지 여정 중 상대적으로 가장 변화무쌍한 경력 변화입니다. 예측하기 어렵고 모험적이지만, 그만큼 큰 만족감과 성취감을 가져다줄 수 있습니다. 직업적 성공보다 삶의 의미와 즐거움을 추구하고, 늦었다고 생각하지 않고 새로운 도전을 감행할 용기가 있는 분들에게 적합합니다.",
      detail_tip: "[열정의 현실성 검증 및 계획화] 고객의 흥미와 열정이 실제로 시장에서 직업적 만족도와 재정적 지속 가능성을 제공할 수 있는지 객관적으로 검증합니다. 변화무쌍한 특성을 관리하기 위해 리스크를 줄이는 단계적 전환 계획(예: 사이드 스몰 프로젝트 등)을 설계합니다."
    },
    6: { 
      easy: "새 경력 준비하기", formal: "경력 리부트", formal_en: "Career Reboot", track: "Shift",
      desc: "완전히 새로운 분야로의 리셋",
      detail_concept: "기존 경력과 흥미와도 무관한 제2의 경력을 고려하는 가장 근본적인 전환입니다. 완전히 새로운 나를 발견하고 만들어가는 여정입니다.",
      detail_features: "새로운 준비와 계획이 가장 많이 필요한 여정입니다. 교육, 자격증 취득, 네트워킹, 시장 조사 등 종합적이고 체계적인 준비가 요구됩니다. 과거의 경력을 완전히 리셋하고 전혀 다른 인생 2막을 열고자 하는 분들, 용기와 인내심을 가지고 장기적인 투자를 할 준비가 된 분들에게 적합합니다.",
      detail_tip: "[종합적이고 장기적인 재설계] 완전히 새로운 분야를 탐색해야 하므로, 가장 많은 준비와 계획이 필요함을 인지시키고 장기적인 학습 및 훈련 계획을 수립합니다. 포괄적인 직업 탐색, 새로운 기술 습득 로드맵, 그리고 재정적 안정성을 확보하기 위한 백업 플랜 등 다각도의 지원이 필요합니다."
    }
  },
  tracks: {
    Continuum: { name: "경력 유지/확장", name_en: "Career Continuum" },
    Shift: { name: "경력 전환", name_en: "Career Shift" }
  }
};

export default function CareerNextLiteApp({ onClose }) {
  const [ageGroup, setAgeGroup] = useState('50대'); 
  // [기본값] 5점 (정가운데)
  const [scores, setScores] = useState({ 1:5, 2:5, 3:5, 4:5, 5:5, 6:5 }); 
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

    const maxScore = sortedTrips[0].score;
    const minScore = sortedTrips[sortedTrips.length - 1].score;
    
    // [중요] 점수 차이가 2점 이내면 '취향이 불분명(Flat)'한 상태로 간주
    const isFlat = (maxScore - minScore) <= 2; 

    const topTrip = sortedTrips[0];
    
    // 3. 프롬프트 생성
    const prompt = `
      당신은 4060 신중년 커리어 설계를 돕는 전문 코치입니다.
      사용자의 진단 데이터를 바탕으로 리포트를 작성하되, **반드시 아래 JSON 형식만 출력**하세요. 마크다운(\`\`\`json)을 쓰지 마세요.

      [사용자 데이터]
      - 연령: ${ageGroup}
      - [Track A] 경력 유지/확장 점수: ${continuumScore}점
      - [Track B] 경력 전환 점수: ${shiftScore}점
      - 여정별 점수: ${JSON.stringify(sortedTrips.map(t => `${t.formal}(${t.score}점)`))}
      
      [상태 판단]
      - ${isFlat ? "상태: 점수 편차가 크지 않음 (탐색 필요)" : `상태: 1순위 여정(${topTrip.formal}) 선호 뚜렷함`}

      ${isFlat ? `
      [지시사항: 점수가 비슷할 때 (Flat Case)]
      1. summary_title: "아직 고민 중인 당신을 위한 커리어 나침반" 같은 탐색 권유형 제목
      2. overall_insight: 
         - 왜 점수가 비슷한지 분석 (예: 번아웃, 정보 부족, 혹은 다양한 가능성 열어둠)
         - 섣불리 결정하기보다 '나'를 돌아보는 시간이 필요함을 조언
      3. top_strategy: 
         - 특정 여정 전략 대신, 자신의 욕구를 발견할 수 있는 '핵심 질문 3가지'를 제안
      ` : `
      [지시사항: 선호가 뚜렷할 때 (Clear Case)]
      1. summary_title: 1순위 여정(${topTrip.formal})을 반영한 매력적인 제목
      2. overall_insight: 
         - 가장 높은 점수를 받은 여정과 낮은 여정들을 비교하며 성향 분석
         - '유지/확장' vs '전환' 트랙 중 어느 쪽을 지향하는지 진단
      3. top_strategy:
         - 1순위 여정(${topTrip.formal})의 [핵심 개념: ${topTrip.detail_concept}]을 참고
         - [Tip: ${topTrip.detail_tip}]을 바탕으로 50대에게 맞는 구체적 실행 가이드 작성
      `}

      4. cheer_message:
         - 분석 내용은 빼고, 오직 따뜻한 격려만 작성
         - 은유적 표현(계절, 산, 항해 등) 사용

      [JSON 출력 형식 - 이 키 이름들을 정확히 지키세요]
      {
        "summary_title": "제목...",
        "overall_insight": "내용...",
        "top_strategy": "내용...",
        "cheer_message": "내용..."
      }
    `;

    try {
      const aiResponse = await fetchGemini(prompt);
      
      // [수정 핵심] 마크다운 코드 블록 제거 및 파싱 강화
      let cleanedResponse = aiResponse.replace(/```json/g, "").replace(/```/g, "").trim();
      let parsedData;
      
      try {
        const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
        parsedData = JSON.parse(jsonMatch ? jsonMatch[0] : cleanedResponse);
      } catch (e) {
        console.error("JSON Parsing Error", e);
        // 파싱 실패 시 원문을 insight에 넣고 나머지는 기본값 처리 (화면 깨짐 방지)
        parsedData = {
            summary_title: "커리어 진단 결과",
            overall_insight: aiResponse, // 원문이라도 보여줌
            top_strategy: "결과 데이터를 상세 분리하지 못했습니다. 위 내용을 참고해주세요.",
            cheer_message: "당신의 새로운 도전을 응원합니다."
        };
      }

      setResult({
        ai: parsedData,
        continuum: continuumScore,
        shift: shiftScore,
        ranking: sortedTrips,
        isFlat: isFlat 
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
      
      {/* 헤더 [수정: 돌아가기 스타일] */}
      <header className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-500 rounded flex items-center justify-center font-bold text-lg text-slate-900">N</div>
          <div>
            <h1 className="font-bold text-lg leading-none">Career Next® Lite</h1>
            <p className="text-[10px] text-slate-300 opacity-80">4060 커리어 방향성 진단</p>
          </div>
        </div>
        <button onClick={onClose} className="flex items-center text-sm hover:text-amber-300 transition-colors">
          <ChevronLeft className="w-5 h-5 mr-1"/> 돌아가기
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
                다음 6가지 방향 중, 현재 <strong>본인의 생각이나 흥미가 가는 정도</strong>를 선택해주세요. (기본값: 5점)
              </div>

              <div className="space-y-8 pr-2">
                {[1, 2, 3, 4, 5, 6].map(id => (
                  <div key={id} className="group">
                    <div className="flex flex-wrap justify-between items-end mb-2">
                      <span className="font-bold text-slate-700 text-sm group-hover:text-amber-600 transition-colors flex items-center gap-1">
                        {CN_KNOWLEDGE.trips[id].easy}
                        {CN_KNOWLEDGE.trips[id].guide && (
                            <span className="text-[10px] text-red-500 font-normal bg-red-50 px-1 rounded">{CN_KNOWLEDGE.trips[id].guide}</span>
                        )}
                      </span>
                      <span className="text-sm font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                        {scores[id]} <span className="text-slate-400 font-normal text-xs">/ 10</span>
                      </span>
                    </div>
                    
                    <input 
                      type="range" min="0" max="10" step="1"
                      value={scores[id]}
                      onChange={(e) => handleScoreChange(id, e.target.value)}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                    
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1.5 font-medium">
                      <span className="flex items-center gap-0.5"><ArrowLeft size={10}/> 가능성 낮음 (0)</span>
                      <span className="flex items-center gap-0.5">가능성 높음 (10) <ArrowRight size={10}/></span>
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
        <main className="flex-1 p-8 overflow-y-auto flex justify-center bg-slate-100">
          {result ? (
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

              {/* 0. 커리어넥스트 개요 */}
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 mb-10">
                <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <BookOpen className="text-indigo-600" size={20}/> 커리어넥스트(Career Next)® 란?
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed text-justify">
                    {CN_KNOWLEDGE.model_info.desc}
                </p>
              </div>

              {/* 1. Track Graph */}
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
                    {/* 점수가 비슷할 때 안내 메시지 */}
                    {result.isFlat && (
                        <div className="mt-4 p-3 bg-slate-100 rounded-lg text-xs text-slate-500 text-center flex items-center justify-center gap-2">
                            <Info size={14} className="text-slate-400"/>
                            두 트랙 간의 점수 차이가 크지 않습니다. 현재 방향성을 탐색하는 단계일 수 있습니다.
                        </div>
                    )}
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
                          <tr key={trip.id} className={idx === 0 && !result.isFlat ? "bg-amber-50" : ""}>
                            <td className="px-5 py-3 text-center">
                              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${idx === 0 ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                {idx + 1}
                              </span>
                            </td>
                            <td className="px-5 py-3">
                                <div className="flex flex-col">
                                    <span className={`font-bold ${idx === 0 && !result.isFlat ? 'text-amber-900' : 'text-slate-700'}`}>
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

              {/* 3. AI Analysis (Structured) - [수정] 카드 분리 확실히 적용 */}
              <div className="space-y-6 mb-10">
                <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2 border-b pb-2">
                    <FileText className="text-amber-600" size={20}/> 전문가 심층 분석
                </h3>

                {/* 카드 1: 종합 진단 (overall_insight 만 표시) */}
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6">
                    <h4 className="font-bold text-indigo-900 mb-3 flex items-center gap-2 text-base">
                        <Info size={18}/> 종합 진단: <span className="text-indigo-700"><EditableContent value={result.ai.summary_title} className="inline"/></span>
                    </h4>
                    <div className="text-sm text-slate-700 leading-relaxed text-justify bg-white p-4 rounded-lg border border-indigo-100 shadow-sm whitespace-pre-wrap">
                        <EditableContent value={result.ai.overall_insight} onSave={(v)=>console.log(v)}/>
                    </div>
                </div>

                {/* 카드 2: 핵심 전략 (top_strategy 만 표시) */}
                <div className={`${result.isFlat ? 'bg-slate-100 border-slate-200' : 'bg-amber-50 border-amber-100'} border rounded-xl p-6`}>
                    <h4 className={`font-bold ${result.isFlat ? 'text-slate-700' : 'text-amber-900'} mb-3 flex items-center gap-2 text-base`}>
                        {result.isFlat ? <HelpCircle size={18}/> : <Target size={18}/>} 
                        {result.isFlat ? "커리어 방향성 탐색 가이드 (나를 찾는 질문)" : `1순위 여정 실행 전략 (${result.ranking[0].formal})`}
                    </h4>
                    <div className={`text-sm text-slate-700 leading-relaxed text-justify bg-white p-4 rounded-lg border ${result.isFlat ? 'border-slate-200' : 'border-amber-100'} shadow-sm whitespace-pre-wrap`}>
                        <EditableContent value={result.ai.top_strategy} onSave={(v)=>console.log(v)}/>
                    </div>
                </div>
              </div>

              {/* 4. 응원 메시지 (cheer_message 만 표시) */}
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