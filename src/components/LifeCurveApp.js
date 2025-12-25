import React, { useState, useRef } from 'react';
// [아이콘 추가] ArrowUp, ArrowDown 추가
import { 
  TrendingUp, ChevronLeft, Loader2, Download, 
  FileText, Plus, X, Award, Smile, Frown, PenTool, History,
  ArrowUp, ArrowDown 
} from 'lucide-react';

import { fetchGemini, saveAsPng, saveAsPdf } from '../api';
import { Toast, EditableContent, Footer } from './SharedUI';

// ----------------------------------------------------------------------
// 1. 인생곡선 차트 (SVG 구현)
const LifeCurveChart = ({ events, width = 600, height = 300 }) => {
  if (!events || events.length === 0) return (
    <div className="flex flex-col items-center justify-center h-[300px] bg-slate-50 rounded-xl text-slate-400 border border-slate-200 border-dashed">
      <TrendingUp size={48} className="mb-2 opacity-50"/>
      <p>사건을 입력하면 인생 곡선이 그려집니다.</p>
    </div>
  );

  // 차트 설정
  const padding = 40;
  const graphWidth = width - padding * 2;
  const graphHeight = height - padding * 2;
  
  const zeroY = height / 2;
  const scaleY = graphHeight / 10; 

  const totalPoints = events.length;
  const stepX = totalPoints > 1 ? graphWidth / (totalPoints - 1) : graphWidth / 2;

  const getCoord = (index, score) => {
    return {
      x: padding + (index * stepX),
      y: zeroY - (score * scaleY) 
    };
  };

  let pathD = "";
  events.forEach((ev, i) => {
    const { x, y } = getCoord(i, ev.score);
    if (i === 0) pathD += `M ${x} ${y}`;
    else pathD += ` L ${x} ${y}`;
  });

  return (
    <div className="w-full overflow-x-auto">
      <svg width={width} height={height} style={{ minWidth: '100%' }}>
        <line x1={padding} y1={zeroY} x2={width-padding} y2={zeroY} stroke="#cbd5e1" strokeWidth="2" strokeDasharray="5 5"/>
        <text x={width-padding+10} y={zeroY} className="text-xs fill-slate-400" alignmentBaseline="middle">0</text>
        
        <text x={padding-10} y={padding} className="text-xs fill-amber-500 font-bold" textAnchor="end">+5</text>
        <text x={padding-10} y={height-padding} className="text-xs fill-slate-400 font-bold" textAnchor="end">-5</text>

        <path d={pathD} fill="none" stroke="#4f46e5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        
        {events.map((ev, i) => {
          const { x, y } = getCoord(i, ev.score);
          const color = ev.score > 0 ? '#d97706' : ev.score < 0 ? '#64748b' : '#94a3b8';
          return (
            <g key={i} className="group cursor-pointer">
              <circle cx={x} cy={y} r="6" fill="white" stroke={color} strokeWidth="3"/>
              <title>{`[${ev.age}] ${ev.text} (${ev.score}점)`}</title>
              <text 
                x={x} 
                y={ev.score >= 0 ? y - 15 : y + 25} 
                textAnchor="middle" 
                className="text-[10px] font-bold fill-slate-600"
              >
                {ev.text.length > 6 ? ev.text.slice(0,6)+'..' : ev.text}
              </text>
              <text 
                x={x} 
                y={ev.score >= 0 ? y - 28 : y + 38} 
                textAnchor="middle" 
                className="text-[9px] fill-slate-400"
              >
                {ev.age}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ----------------------------------------------------------------------
// 2. 메인 앱 컴포넌트
export default function LifeCurveApp({ onClose }) {
  const [timeline, setTimeline] = useState({
    '10대': [], '20대': [], '30대': [], '40대': [], '50대': [], '60대+': []
  });
  
  const [activeTab, setActiveTab] = useState('10대');
  const [inputText, setInputText] = useState('');
  const [inputScore, setInputScore] = useState(0);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const reportRef = useRef(null);

  const showToast = (msg) => setToastMsg(msg);

  // 사건 추가
  const addEvent = () => {
    if (!inputText.trim()) return showToast("사건 내용을 입력해주세요.");
    if (timeline[activeTab].length >= 3) return showToast(`${activeTab}에는 최대 3개까지만 입력 가능합니다.`);

    const newEvent = {
      id: Date.now(),
      age: activeTab,
      text: inputText,
      score: parseInt(inputScore, 10)
    };

    setTimeline(prev => ({
      ...prev,
      [activeTab]: [...prev[activeTab], newEvent]
    }));
    setInputText('');
    setInputScore(0);
  };

  // 사건 삭제
  const removeEvent = (age, id) => {
    setTimeline(prev => ({
      ...prev,
      [age]: prev[age].filter(ev => ev.id !== id)
    }));
  };

  // [New] 사건 순서 변경 (위/아래)
  const moveEvent = (direction, index) => {
    const currentEvents = [...timeline[activeTab]];
    if (direction === 'up' && index > 0) {
      [currentEvents[index], currentEvents[index - 1]] = [currentEvents[index - 1], currentEvents[index]];
    } else if (direction === 'down' && index < currentEvents.length - 1) {
      [currentEvents[index], currentEvents[index + 1]] = [currentEvents[index + 1], currentEvents[index]];
    }
    setTimeline(prev => ({
      ...prev,
      [activeTab]: currentEvents
    }));
  };

  // 전체 데이터 1차원 배열로 변환 (차트/분석용)
  const getAllEvents = () => {
    const order = ['10대', '20대', '30대', '40대', '50대', '60대+'];
    let all = [];
    order.forEach(age => {
      all = [...all, ...timeline[age]];
    });
    return all;
  };

  // AI 분석 요청
  const handleGenerate = async () => {
    const allEvents = getAllEvents();
    if (allEvents.length < 3) return showToast("최소 3개 이상의 사건을 입력해야 분석이 가능합니다.");

    setLoading(true);
    try {
      const inputSummary = allEvents.map(e => `[${e.age}] ${e.text} (점수: ${e.score})`).join('\n');
      
      const prompt = `
      당신은 인생의 희로애락을 깊이 있게 통찰하는 '라이프 코치'입니다.
      사용자가 입력한 '인생 곡선(Life Curve)' 데이터를 바탕으로 리포트를 작성해주세요.

      [사용자 인생 사건 데이터]
      ${inputSummary}

      [요청사항]
      1. **Success Memory (성공 경험 의미 부여):** 점수가 높은(양수) 사건들을 통해 발견할 수 있는 사용자의 강점과 가치를 분석해주세요.
      2. **Overcoming & Growth (실패/시련의 의미):** 점수가 낮은(음수) 사건들을 단순한 실패가 아닌, 성장을 위한 거름으로 해석하고 극복의 의미를 부여해주세요.
      3. **전문가의 총평:** 전체적인 인생의 흐름을 파도, 산맥, 계절, 날씨 등에 비유하는 **은유적 수사법**을 사용하여, 감동적이고 희망찬 응원 메시지로 마무리해주세요.

      [JSON 출력 형식]
      {
        "success_analysis": {
          "title": "빛나는 순간의 의미 (Success Memory)",
          "content": "성공 경험 분석 내용..."
        },
        "failure_analysis": {
          "title": "시련이 남긴 선물 (Overcoming & Growth)",
          "content": "실패/시련 분석 내용..."
        },
        "overall_review": "은유적 총평 및 응원 메시지"
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

  const handleDownload = () => saveAsPng(reportRef, `인생곡선_리포트`, showToast);
  const handlePdfDownload = () => saveAsPdf(reportRef, `인생곡선_리포트`, showToast);

  const allEventsSorted = getAllEvents().sort((a, b) => b.score - a.score);

  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col font-sans text-slate-800">
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
      
      {/* 헤더 */}
      <header className="bg-indigo-900 text-white p-4 flex justify-between items-center shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <TrendingUp className="text-indigo-400"/>
          <h1 className="font-bold text-lg">인생곡선 그리기 (Life Curve)</h1>
        </div>
        <button onClick={onClose} className="flex items-center text-sm hover:text-indigo-200 transition-colors">
          <ChevronLeft className="w-5 h-5 mr-1"/> 돌아가기
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* 좌측 사이드바: 입력창 */}
        <aside className="w-[400px] bg-white border-r p-6 shrink-0 overflow-y-auto">
          <div className="space-y-6">
            
            <div className="bg-indigo-50 p-4 rounded-xl text-sm text-indigo-900 leading-relaxed border border-indigo-100">
              <strong>💡 작성 가이드</strong><br/>
              각 연령대별로 기억에 남는 사건을 추가하세요.<br/>
              사건의 <strong>순서</strong>가 중요하다면 화살표 버튼으로 조정하세요.
            </div>

            {/* 연령대 탭 */}
            <div className="flex flex-wrap gap-2">
              {Object.keys(timeline).map(age => (
                <button
                  key={age}
                  onClick={() => setActiveTab(age)}
                  className={`px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                    activeTab === age 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {age}
                </button>
              ))}
            </div>

            {/* 현재 탭 입력 폼 */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <History size={16}/> {activeTab} 사건 기록 ({timeline[activeTab].length}/3)
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">사건 내용 (한 줄 메모)</label>
                  <input 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="예: 첫 취업 성공, 결혼, 사업 실패 등"
                    className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    onKeyPress={(e) => e.key === 'Enter' && addEvent()}
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                    <span>감정 점수: <span className={`${inputScore > 0 ? 'text-indigo-600' : inputScore < 0 ? 'text-red-500' : 'text-slate-600'} text-base`}>{inputScore > 0 ? `+${inputScore}` : inputScore}</span></span>
                  </div>
                  <input 
                    type="range" min="-5" max="5" step="1"
                    value={inputScore}
                    onChange={(e) => setInputScore(e.target.value)}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>-5 (좌절)</span>
                    <span>0</span>
                    <span>+5 (환희)</span>
                  </div>
                </div>

                <button 
                  onClick={addEvent}
                  disabled={timeline[activeTab].length >= 3}
                  className="w-full py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:bg-slate-300 transition-colors flex items-center justify-center gap-1"
                >
                  <Plus size={16}/> 사건 추가
                </button>
              </div>
            </div>

            {/* 현재 탭의 입력 목록 (순서 변경 기능 추가) */}
            <div className="space-y-2">
              {timeline[activeTab].map((ev, index) => (
                <div key={ev.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200 group">
                  <div className="flex-1">
                    <div className="font-bold text-sm text-slate-700">{ev.text}</div>
                    <div className={`text-xs font-bold ${ev.score > 0 ? 'text-indigo-500' : ev.score < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                      {ev.score > 0 ? `+${ev.score}점` : `${ev.score}점`}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {/* 순서 변경 버튼 */}
                    <div className="flex flex-col gap-0.5 mr-2">
                        {index > 0 && (
                            <button onClick={() => moveEvent('up', index)} className="text-slate-400 hover:text-indigo-600 p-0.5 rounded hover:bg-slate-200">
                                <ArrowUp size={12}/>
                            </button>
                        )}
                        {index < timeline[activeTab].length - 1 && (
                            <button onClick={() => moveEvent('down', index)} className="text-slate-400 hover:text-indigo-600 p-0.5 rounded hover:bg-slate-200">
                                <ArrowDown size={12}/>
                            </button>
                        )}
                    </div>

                    <button onClick={() => removeEvent(activeTab, ev.id)} className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-red-50">
                      <X size={16}/>
                    </button>
                  </div>
                </div>
              ))}
              {timeline[activeTab].length === 0 && (
                <div className="text-center text-xs text-slate-400 py-4">등록된 사건이 없습니다.</div>
              )}
            </div>

            <button onClick={handleGenerate} disabled={loading} className="w-full bg-indigo-700 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-indigo-800 transition-all disabled:bg-slate-400 text-lg flex items-center justify-center gap-2 mt-auto">
              {loading ? <Loader2 className="animate-spin"/> : "인생곡선 분석하기"}
            </button>
          </div>
        </aside>

        {/* 우측: 결과 리포트 */}
        <main className="flex-1 p-8 overflow-y-auto flex justify-center bg-slate-50">
            {result ? (
              <div ref={reportRef} className="w-[210mm] min-h-[297mm] h-fit bg-white shadow-2xl p-12 flex flex-col animate-in fade-in zoom-in-95 duration-500">
                
                {/* 헤더 */}
                <div className="border-b-4 border-indigo-600 pb-6 mb-8">
                    <div className="flex justify-between items-end mb-2">
                        <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-xs font-bold tracking-wider">LIFE CURVE REPORT</span>
                        <div className="text-right text-slate-500 text-xs">
                           작성일: {new Date().toLocaleDateString()}
                        </div>
                    </div>
                    <h1 className="text-4xl font-extrabold text-slate-900">나의 인생곡선 리포트</h1>
                    <p className="text-slate-500 mt-2 text-sm">
                        지나온 삶의 궤적을 돌아보고, 앞으로 나아갈 힘을 얻습니다.
                    </p>
                </div>

                {/* 1. 인생 곡선 차트 */}
                <div className="mb-10 bg-slate-50 rounded-2xl p-6 border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-700 mb-6 flex items-center gap-2">
                        <TrendingUp className="text-indigo-500"/> My Life Curve
                    </h3>
                    <LifeCurveChart events={getAllEvents()} width={650} height={350} />
                </div>

                {/* 2. 사건 랭킹 테이블 */}
                <div className="mb-10">
                    <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <Award className="text-amber-500"/> 인생의 주요 장면 (Ranking)
                    </h3>
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-xs">
                                <tr>
                                    <th className="px-4 py-3 text-center w-16">순위</th>
                                    <th className="px-4 py-3 w-20 text-center">시기</th>
                                    <th className="px-4 py-3">사건 내용</th>
                                    <th className="px-4 py-3 text-center w-20">점수</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {allEventsSorted.map((ev, i) => (
                                    <tr key={i} className={i < 3 ? "bg-amber-50/30" : ""}>
                                        <td className="px-4 py-2 text-center font-bold text-slate-500">{i + 1}</td>
                                        <td className="px-4 py-2 text-center text-xs font-bold text-slate-400 bg-slate-50 rounded mx-2">{ev.age}</td>
                                        <td className="px-4 py-2 font-bold text-slate-700">{ev.text}</td>
                                        <td className={`px-4 py-2 text-center font-bold ${ev.score > 0 ? 'text-indigo-600' : ev.score < 0 ? 'text-red-500' : 'text-slate-500'}`}>
                                            {ev.score > 0 ? `+${ev.score}` : ev.score}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 3. 성공/실패 분석 (상하 배치) */}
                <div className="space-y-6 mb-10">
                    {/* 성공 분석 */}
                    <div className="bg-amber-50 p-6 rounded-xl border border-amber-100">
                        <h3 className="font-bold text-amber-800 mb-3 flex items-center gap-2 text-lg">
                            <Smile className="text-amber-600" size={20}/> 
                            <EditableContent value={result.success_analysis.title} onSave={(v)=>handleEdit('success_analysis', 'title', v)} />
                        </h3>
                        <div className="bg-white p-5 rounded-lg border border-amber-100 text-slate-700 text-sm leading-relaxed shadow-sm">
                            <EditableContent value={result.success_analysis.content} onSave={(v)=>handleEdit('success_analysis', 'content', v)} />
                        </div>
                    </div>

                    {/* 실패 분석 */}
                    <div className="bg-slate-100 p-6 rounded-xl border border-slate-200">
                        <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2 text-lg">
                            <Frown className="text-slate-500" size={20}/> 
                            <EditableContent value={result.failure_analysis.title} onSave={(v)=>handleEdit('failure_analysis', 'title', v)} />
                        </h3>
                        <div className="bg-white p-5 rounded-lg border border-slate-200 text-slate-700 text-sm leading-relaxed shadow-sm">
                            <EditableContent value={result.failure_analysis.content} onSave={(v)=>handleEdit('failure_analysis', 'content', v)} />
                        </div>
                    </div>
                </div>

                {/* 4. 전문가 총평 */}
                <div className="bg-indigo-900 text-white p-8 rounded-xl shadow-lg mt-auto">
                    <h3 className="font-bold text-indigo-300 mb-4 text-lg flex items-center gap-2">
                        <PenTool className="text-indigo-300"/> 전문가의 총평
                    </h3>
                    <div className="leading-relaxed text-indigo-100 text-justify text-base">
                        <EditableContent value={result.overall_review} onSave={(v)=>handleEdit('overall_review', null, v)} />
                    </div>
                </div>

                <div className="mt-8">
                    <Footer />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <TrendingUp size={64} className="mb-4 opacity-20"/>
                <p className="text-lg font-bold text-slate-400">좌측에서 인생의 주요 사건을 입력해주세요.</p>
                <p className="text-sm mt-2">당신의 인생 흐름을 아름다운 곡선으로 그려드립니다.</p>
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