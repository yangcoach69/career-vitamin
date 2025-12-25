import React, { useState, useRef } from 'react';
// [안전 모드] 검증된 아이콘만 사용 (충돌 방지)
import { 
  BarChart3, ChevronLeft, Loader2, Download, 
  FileText, Target, Check, AlertCircle, User, ClipboardList, X
} from 'lucide-react';

import { fetchGemini, saveAsPng, saveAsPdf } from '../api';
import { Toast, EditableContent, Footer } from './SharedUI';

// ----------------------------------------------------------------------
// 1. 방사형 차트 (SVG 구현 - 안전성 확보)
const RadarChart = ({ data, size = 320 }) => {
  if (!data || data.length === 0) return null;

  const center = size / 2;
  const radius = (size / 2) - 40; 
  const total = data.length;
  const angleSlice = (Math.PI * 2) / total;

  const getCoordinates = (value, index) => {
    const safeValue = isNaN(value) ? 0 : Number(value);
    const angle = index * angleSlice - Math.PI / 2;
    const r = (safeValue / 10) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle)
    };
  };

  const levels = [2, 4, 6, 8, 10];
  const gridPaths = levels.map(level => {
    const points = data.map((_, i) => {
      const { x, y } = getCoordinates(level, i);
      return `${x},${y}`;
    }).join(' ');
    return { level, points };
  });

  const axisLines = data.map((_, i) => {
    const start = { x: center, y: center };
    const end = getCoordinates(10, i);
    return { start, end };
  });

  const dataPoints = data.map((d, i) => {
    const { x, y } = getCoordinates(d.score, i);
    return `${x},${y}`;
  }).join(' ');

  const labels = data.map((d, i) => {
    const angle = i * angleSlice - Math.PI / 2;
    const r = radius + 25; 
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { ...d, x, y };
  });

  return (
    <div className="flex justify-center items-center py-6">
      <svg width={size} height={size} style={{ overflow: 'visible', maxWidth: '100%' }}>
        {gridPaths.map((g, i) => (
          <polygon key={i} points={g.points} fill="none" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4"/>
        ))}
        {axisLines.map((l, i) => (
          <line key={i} x1={l.start.x} y1={l.start.y} x2={l.end.x} y2={l.end.y} stroke="#e2e8f0" strokeWidth="1"/>
        ))}
        <polygon points={dataPoints} fill="rgba(217, 119, 6, 0.2)" stroke="#d97706" strokeWidth="2"/>
        {data.map((d, i) => {
          const coords = getCoordinates(d.score, i);
          return <circle key={i} cx={coords.x} cy={coords.y} r="4" fill="#d97706" stroke="white" strokeWidth="2"/>;
        })}
        {labels.map((l, i) => (
          <g key={i}>
            <text x={l.x} y={l.y} dy="0.3em" textAnchor="middle" className="text-[11px] font-bold fill-slate-700" style={{fontSize:'11px'}}>
              {l.label.split('(')[0]}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

// ----------------------------------------------------------------------
// 2. 메인 앱 컴포넌트
export default function LifeDesignApp({ onClose }) {
  // 8대 영역 고정 데이터
  const [areas, setAreas] = useState([
    { id: 'work', label: '업(業)', eng: 'Work', score: 5, note: '' },
    { id: 'growth', label: '자기성장 (일 이외의)', eng: 'Self-Growth', score: 5, note: '' },
    { id: 'contribution', label: '사회공헌 (봉사 등)', eng: 'Contribution', score: 5, note: '' },
    { id: 'family', label: '가족', eng: 'Family', score: 5, note: '' },
    { id: 'relation', label: '사회적 관계', eng: 'Relationship', score: 5, note: '' },
    { id: 'material', label: '물적소유 (주거 등)', eng: 'Possession', score: 5, note: '' },
    { id: 'finance', label: '재무', eng: 'Finance', score: 5, note: '' },
    { id: 'leisure', label: '여가와 시간', eng: 'Leisure & Time', score: 5, note: '' },
  ]);

  const [ageGroup, setAgeGroup] = useState('50'); // 연령대
  
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const reportRef = useRef(null);

  const showToast = (msg) => setToastMsg(msg);

  // 핸들러
  const handleScoreChange = (index, val) => {
    const newAreas = [...areas];
    newAreas[index].score = parseInt(val, 10);
    setAreas(newAreas);
  };

  const handleNoteChange = (index, val) => {
    const newAreas = [...areas];
    newAreas[index].note = val;
    setAreas(newAreas);
  };

  // AI 분석 요청
  const handleGenerate = async () => {
    setLoading(true);
    try {
      const sortedAreas = [...areas].sort((a, b) => b.score - a.score);
      const inputSummary = sortedAreas.map((a, i) => 
        `${i+1}위. ${a.label}(${a.score}점): ${a.note || '특이사항 없음'}`
      ).join('\n');

      const prompt = `
      당신은 ${ageGroup}대 중장년층을 위한 생애설계(Life Design) 전문 컨설턴트입니다.
      사용자가 입력한 '8대 영역 밸런스'를 분석하여 리포트를 작성해주세요.

      [사용자 정보]
      - 연령대: ${ageGroup}대
      - 영역별 점수(높은 순):
      ${inputSummary}

      [요청사항]
      1. '만족 영역(High Satisfaction)'은 현재의 강점입니다. 현 상태에 대한 분석(Analysis)과 이를 더 잘 활용하기 위한 구체적인 유지 전략(Action Plan)을 분리해서 작성하세요.
      2. '보완 영역(Low Satisfaction)'은 개선이 필요합니다. 현 상태에 대한 위로와 분석(Analysis)을 먼저 쓰고, 당장 실천할 수 있는 작고 구체적인 액션플랜(Action Plan)을 분리해서 제안하세요.
      3. **중요:** 마지막 '전문가의 총평(Overall Review)'은 인생을 여행, 건축, 예술 작품, 계절 등에 비유하는 **은유적 수사법**을 사용하여 감동적으로 작성하고, ${ageGroup}대를 위한 응원의 메시지를 담아주세요.

      [JSON 출력 형식 준수]
      {
        "high_satisfaction": {
          "title": "삶의 든든한 버팀목 (강점 영역)",
          "analysis": "현재 강점에 대한 분석 및 칭찬 멘트",
          "action_plan": "강점을 유지하고 강화하기 위한 구체적인 전략 3가지 (개조식)"
        },
        "low_satisfaction": {
          "title": "새로운 기회의 씨앗 (보완 영역)",
          "analysis": "현재 부족한 부분에 대한 분석 및 따뜻한 조언",
          "action_plan": "부담 없이 시작할 수 있는 작은 실천 가이드 3가지 (개조식)"
        },
        "overall_review": "은유적 표현이 담긴 감동적인 총평 및 격려 메시지"
      }`;

      const parsed = await fetchGemini(prompt);
      setResult(parsed);
    } catch (e) { showToast(e.message); } finally { setLoading(false); }
  };

  const handleEdit = (key, value, subKey = null) => {
    setResult(prev => {
      const newData = { ...prev };
      if (subKey) newData[key][subKey] = value;
      else newData[key] = value;
      return newData;
    });
  };

  const handleDownload = () => saveAsPng(reportRef, `생애설계_진단결과`, showToast);
  const handlePdfDownload = () => saveAsPdf(reportRef, `생애설계_진단결과`, showToast);

  // [결과 화면용] 계산
  const sortedAreas = [...areas].sort((a, b) => b.score - a.score);
  const averageScore = (areas.reduce((acc, cur) => acc + cur.score, 0) / areas.length).toFixed(1);

  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col font-sans text-slate-800">
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
      
      {/* 헤더 */}
      <header className="bg-amber-900 text-white p-4 flex justify-between items-center shadow-md shrink-0">
        <div className="flex items-center gap-3">
          {/* 여기를 Sun 아이콘으로 변경 */}
          <Sun className="text-amber-400"/>
          <h1 className="font-bold text-lg">인생 8대 영역 설계</h1>
        </div>
        <button onClick={onClose} className="flex items-center text-sm hover:text-amber-200 transition-colors">
          <ChevronLeft className="w-5 h-5 mr-1"/> 돌아가기
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* 2. 좌측 사이드바: 입력창 */}
        <aside className="w-[400px] bg-white border-r p-6 shrink-0 overflow-y-auto">
          <div className="space-y-6">
            
            {/* 연령대 선택 */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <label className="block text-sm font-bold text-slate-700 mb-2">연령대 선택</label>
              <div className="flex gap-2">
                {['40', '50', '60'].map((age) => (
                  <button
                    key={age}
                    onClick={() => setAgeGroup(age)}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${ageGroup === age ? 'bg-amber-600 text-white shadow-md' : 'bg-white border border-slate-300 text-slate-500 hover:bg-slate-100'}`}
                  >
                    {age}대{age === '60' && '+'}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-slate-500 bg-amber-50 p-3 rounded border border-amber-100 leading-relaxed">
               각 영역의 만족도를 슬라이더로 조절하고,<br/>
               관련된 상태나 고민을 간단히 메모해주세요.
            </div>

            {/* 영역별 입력 루프 */}
            <div className="space-y-6">
                {areas.map((area, index) => (
                    <div key={area.id} className="relative p-2 rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="flex justify-between items-end mb-2">
                            <div className="flex flex-col">
                                <label className="font-bold text-slate-700 flex items-center gap-2 text-sm">
                                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold">{index+1}</span>
                                    {area.label} 
                                </label>
                                <span className="text-[10px] text-slate-400 pl-7 uppercase tracking-wider font-medium">{area.eng}</span>
                            </div>
                            <div className="text-right">
                                <span className={`font-bold text-base ${area.score >= 8 ? 'text-amber-600' : area.score <= 4 ? 'text-slate-400' : 'text-slate-700'}`}>
                                    {area.score}
                                </span>
                                <span className="text-xs text-slate-400 font-medium"> / 10</span>
                            </div>
                        </div>
                        
                        {/* 슬라이더 */}
                        <div className="flex items-center gap-3 mb-3 px-1">
                            <span className="text-xs font-bold text-slate-300">0</span>
                            <input 
                                type="range" min="0" max="10" value={area.score}
                                onChange={(e) => handleScoreChange(index, e.target.value)}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                            />
                            <span className="text-xs font-bold text-slate-300">10</span>
                        </div>

                        {/* 메모 입력 */}
                        <textarea
                            value={area.note}
                            onChange={(e) => handleNoteChange(index, e.target.value)}
                            placeholder="관련된 현재 상태나 고민 (선택)"
                            className="w-full p-2.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none bg-white transition-all shadow-sm"
                            rows={2}
                        />
                    </div>
                ))}
            </div>

            <button onClick={handleGenerate} disabled={loading} className="w-full bg-amber-700 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-amber-800 transition-all disabled:bg-slate-400 text-lg flex items-center justify-center gap-2">
              {loading ? <Loader2 className="animate-spin"/> : "진단 결과 보기"}
            </button>
          </div>
        </aside>

        {/* 3. 우측: 결과 리포트 */}
        <main className="flex-1 p-8 overflow-y-auto flex justify-center bg-slate-50">
            {result ? (
              <div ref={reportRef} className="w-[210mm] min-h-[297mm] h-fit bg-white shadow-2xl p-12 flex flex-col animate-in fade-in zoom-in-95 duration-500">
                
                {/* (1) 리포트 헤더 */}
                <div className="border-b-4 border-amber-600 pb-6 mb-8">
                    <div className="flex justify-between items-end mb-2">
                        <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold tracking-wider">LIFE BALANCE REPORT</span>
                        <div className="text-right text-slate-500 text-xs">
                           진단일: {new Date().toLocaleDateString()}
                        </div>
                    </div>
                    <h1 className="text-4xl font-extrabold text-slate-900">인생 8대 영역 진단 리포트</h1>
                    <p className="text-slate-500 mt-2 text-sm">
                        현재 {ageGroup}대 시점에서의 생애 균형 상태를 점검하고, 더 나은 인생 2막을 설계합니다.
                    </p>
                </div>

                {/* (2) 방사형 차트 + 순위 테이블 */}
                <div className="mb-10 bg-slate-50 rounded-2xl p-8 border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-700 mb-6 flex items-center gap-2">
                        <Target className="text-amber-500"/> 나의 생애 균형도
                    </h3>
                    
                    <div className="mb-8">
                      <RadarChart data={areas} size={360} />
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-xs">
                                <tr>
                                    <th className="px-4 py-3 text-center w-16">순위</th>
                                    <th className="px-4 py-3">영역</th>
                                    <th className="px-4 py-3 text-center w-24">점수</th>
                                    <th className="px-4 py-3 text-center w-24">상태</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {sortedAreas.map((area, i) => (
                                    <tr key={area.id} className={i < 3 ? "bg-amber-50/30" : ""}>
                                        <td className="px-4 py-2 text-center font-bold text-slate-500">{i + 1}</td>
                                        <td className="px-4 py-2">
                                            <div className="font-bold text-slate-700">{area.label}</div>
                                            <div className="text-[10px] text-slate-400 uppercase">{area.eng}</div>
                                        </td>
                                        <td className="px-4 py-2 text-center font-bold text-amber-600">{area.score}</td>
                                        <td className="px-4 py-2 text-center">
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                                area.score >= 8 ? 'bg-green-100 text-green-700' : 
                                                area.score <= 4 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                                            }`}>
                                                {area.score >= 8 ? '만족' : area.score <= 4 ? '부족' : '보통'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* (3) 만족/보완 영역 분석 (Action Plan 분리) */}
                <div className="space-y-6 mb-10">
                    
                    {/* 만족 영역 */}
                    <div className="bg-green-50 p-6 rounded-xl border border-green-100">
                        <h3 className="font-bold text-green-800 mb-3 flex items-center gap-2 text-lg">
                            <Check className="text-green-600" size={20}/> 
                            <EditableContent value={result.high_satisfaction.title} onSave={(v)=>handleEdit('high_satisfaction', 'title', v)} />
                        </h3>
                        {/* 분석 내용 */}
                        <div className="mb-4">
                            <h4 className="text-xs font-bold text-green-700 uppercase mb-1 tracking-wider">Analysis</h4>
                            <div className="bg-white p-4 rounded-lg border border-green-100 text-slate-700 text-sm leading-relaxed shadow-sm">
                                <EditableContent value={result.high_satisfaction.analysis} onSave={(v)=>handleEdit('high_satisfaction', 'analysis', v)} />
                            </div>
                        </div>
                        {/* 액션 플랜 (분리됨) */}
                        <div>
                            <h4 className="text-xs font-bold text-green-700 uppercase mb-1 tracking-wider flex items-center gap-1">Action Plan <FileText size={12}/></h4>
                            <div className="bg-green-100/50 p-4 rounded-lg border border-green-200 text-green-900 text-sm font-medium leading-relaxed">
                                <EditableContent value={result.high_satisfaction.action_plan} onSave={(v)=>handleEdit('high_satisfaction', 'action_plan', v)} />
                            </div>
                        </div>
                    </div>

                    {/* 보완 영역 */}
                    <div className="bg-red-50 p-6 rounded-xl border border-red-100">
                        <h3 className="font-bold text-red-800 mb-3 flex items-center gap-2 text-lg">
                            <AlertCircle className="text-red-600" size={20}/> 
                            <EditableContent value={result.low_satisfaction.title} onSave={(v)=>handleEdit('low_satisfaction', 'title', v)} />
                        </h3>
                        {/* 분석 내용 */}
                        <div className="mb-4">
                            <h4 className="text-xs font-bold text-red-700 uppercase mb-1 tracking-wider">Analysis</h4>
                            <div className="bg-white p-4 rounded-lg border border-red-100 text-slate-700 text-sm leading-relaxed shadow-sm">
                                <EditableContent value={result.low_satisfaction.analysis} onSave={(v)=>handleEdit('low_satisfaction', 'analysis', v)} />
                            </div>
                        </div>
                        {/* 액션 플랜 (분리됨) */}
                        <div>
                            <h4 className="text-xs font-bold text-red-700 uppercase mb-1 tracking-wider flex items-center gap-1">Action Plan <FileText size={12}/></h4>
                            <div className="bg-red-100/50 p-4 rounded-lg border border-red-200 text-red-900 text-sm font-medium leading-relaxed">
                                <EditableContent value={result.low_satisfaction.action_plan} onSave={(v)=>handleEdit('low_satisfaction', 'action_plan', v)} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* (4) 전문가의 총평 */}
                <div className="bg-slate-800 text-white p-8 rounded-xl shadow-lg mt-auto">
                    <h3 className="font-bold text-amber-400 mb-4 text-lg flex items-center gap-2">
                        <ClipboardList className="text-amber-400"/> 전문가의 총평
                    </h3>
                    <div className="leading-relaxed text-slate-200 text-justify text-base">
                        <EditableContent value={result.overall_review} onSave={(v)=>handleEdit('overall_review', null, v)} />
                    </div>
                </div>

                <div className="mt-8">
                    <Footer />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <BarChart3 size={64} className="mb-4 opacity-20"/>
                <p className="text-lg font-bold text-slate-400">좌측에서 점수를 입력하고 진단을 시작하세요.</p>
                <p className="text-sm mt-2">연령대에 맞는 맞춤형 생애설계 리포트가 생성됩니다.</p>
              </div>
            )}

            {/* 다운로드 버튼 */}
            {result && (
              <div className="absolute bottom-8 right-8 flex gap-3 z-50">
                <button onClick={handleDownload} className="bg-white text-slate-900 border border-slate-200 px-6 py-3 rounded-full font-bold shadow-xl hover:-translate-y-1 flex items-center transition-transform"><Download className="mr-2" size={20}/> 이미지 저장</button>
                <button onClick={handlePdfDownload} className="bg-amber-800 text-white px-6 py-3 rounded-full font-bold shadow-xl hover:-translate-y-1 flex items-center transition-transform"><FileText className="mr-2" size={20}/> PDF 저장</button>
              </div>
            )}
        </main>
      </div>
    </div>
  );
}