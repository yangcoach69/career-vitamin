import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  signInWithCustomToken
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  where,
  getDocs,
  updateDoc 
} from "firebase/firestore";
import { 
  LayoutDashboard, 
  Users, 
  Map, 
  Building2, 
  PenTool, 
  LogOut, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  Settings,
  Loader2,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Ban,
  Home,
  User,
  Hash,
  Star,
  Printer,
  X,
  ChevronLeft,
  Compass,
  Play,
  Lock,
  MessageSquare,
  Sparkles, 
  Briefcase,
  ClipboardCheck,
  Stethoscope,
  Award,
  Search,
  BookOpen,
  Quote,
  Download,
  TrendingUp, 
  Calendar,
  Target,
  Edit3,
  MonitorPlay,
  Zap,
  LayoutList,
  Split, 
  Mic,
  BarChart3,
  Link as LinkIcon,
  Globe,
  Trophy
} from 'lucide-react';

// --- Configuration ---
const OWNER_UID = "16844976501121414234"; 
const apiKey = "AIzaSyBX0kT7I3yanNNxI-xj7KMoxVmIkPAP5ug"; // API Key

// Helper: HTML2Canvas Loader
const loadHtml2Canvas = () => {
  return new Promise((resolve, reject) => {
    if (window.html2canvas) {
      resolve(window.html2canvas);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    script.onload = () => resolve(window.html2canvas);
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

// Helper: Safe JSON Parser
const safeJsonParse = (str) => {
  try {
    // 1. Try direct parse
    return JSON.parse(str);
  } catch (e) {
    try {
      // 2. Clean markdown and try again
      let cleaned = str.replace(/```json/g, '').replace(/```/g, '').trim();
      // 3. Extract JSON object if embedded in text
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(cleaned);
    } catch (e2) {
      console.warn("JSON Parse failed:", e2);
      return null;
    }
  }
};

// Firebase Init
let app, auth, db;
try {
  const firebaseConfig = JSON.parse(__firebase_config);
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.error("Firebase Init Error:", error);
}
const appId = typeof __app_id !== 'undefined' ? __app_id : 'career-vitamin';

// --- Constants ---
const CATEGORIES = [
  { id: 'ai_tools', title: 'AI 코칭 어시스턴트', icon: Sparkles }
];

const SERVICES = {
  // [그룹 1] AI 도구
  gpt_guide: { 
    name: "[GPT] 직업 탐색 가이드", 
    desc: "관심 있는 직업이나 직무를 입력하고 Enter를 치면 가이드가 생성됩니다.", 
    link: "https://chatgpt.com/g/g-Uch9gJR4b-job-explorer-guide-report", 
    internal: false, 
    icon: Compass, 
    color: "emerald", 
    isNew: true, 
    category: 'ai_tools' 
  },
  card_bot: { 
    name: "[노트북LM] 커리어스타일 카드 AI 챗봇", 
    desc: "온라인카드 유료 프로그램 참여자들에게만 공유되고 있는 전용 챗봇입니다.", 
    link: "https://notebooklm.google.com/notebook/595da4c0-fcc1-4064-82c8-9901e6dd8772", 
    internal: false, 
    icon: MessageSquare, 
    color: "violet", 
    isNew: true, 
    category: 'ai_tools' 
  },
  rubric_clinic: { 
    name: "[Gem] 루브릭 기반, AI 자소서 코칭 클리닉", 
    desc: "유료 워크숍 옵션 결제자에 한해 액세스 권한이 있습니다.", 
    link: "https://gemini.google.com/gem/1jXo4wyUvzepwmP_diVl-FQzg05EkexIg?usp=sharing", 
    internal: false, 
    icon: Stethoscope, 
    color: "cyan", 
    isNew: true, 
    category: 'ai_tools' 
  },
  company_analysis: { 
    name: "[AI] 기업분석 리포트", 
    desc: "기업의 핵심가치, 최신 이슈, SWOT 분석을 통해 면접 전략을 수립합니다.", 
    link: null, 
    internal: true, 
    icon: BarChart3, 
    color: "indigo", 
    isNew: true, 
    category: 'ai_tools' 
  },
  career_roadmap: { 
    name: "[AI] 커리어 로드맵 설계", 
    desc: "지원 기업/직무에 맞춰 5년/10년 후의 경력 목표와 단계별 실행 계획을 설계합니다.", 
    link: null, 
    internal: true, 
    icon: TrendingUp, 
    color: "blue", 
    isNew: true, 
    category: 'ai_tools' 
  },
  pt_interview: { 
    name: "[AI] 프리젠테이션(PT) 면접 가이드", 
    desc: "기업/직무별 PT 주제 15개를 추출하고, 선택한 주제의 발표 대본을 생성합니다.", 
    link: null, 
    internal: true, 
    icon: MonitorPlay, 
    color: "rose", 
    isNew: true, 
    category: 'ai_tools' 
  },
  sit_interview: { 
    name: "[AI] 상황면접 스크립트 가이드", 
    desc: "기출/예상 질문과 분리 기준을 입력하면 두 가지 상황으로 구조화된 답변을 생성합니다.", 
    link: null, 
    internal: true, 
    icon: Split, 
    color: "teal", 
    isNew: true, 
    category: 'ai_tools' 
  },
  self_intro: { 
    name: "[AI] 1분 자기소개 스크립트", 
    desc: "컨셉(직무/인성)에 맞춰 임팩트 있는 오프닝-바디-클로징 대본을 작성합니다.", 
    link: null, 
    internal: true, 
    icon: Mic, 
    color: "purple", 
    isNew: true, 
    category: 'ai_tools' 
  },
  exp_structuring: { 
    name: "[AI] 경험 구조화 워크시트 (STAR)", 
    desc: "경험을 STAR 기법으로 구조화하여 핵심 행동과 성과를 명확하게 정리합니다.", 
    link: null, 
    internal: true, 
    icon: LayoutList, 
    color: "indigo", 
    isNew: true, 
    category: 'ai_tools' 
  },
  role_model: { 
    name: "[AI] 롤모델 분석 리포트", 
    desc: "인물 이름만 입력하면 소개, 어록, 관련 정보와 면접 답변까지 AI가 정리해줍니다.", 
    link: null, 
    internal: true, 
    icon: Award, 
    color: "orange", 
    isNew: true, 
    category: 'ai_tools' 
  }
};

// =============================================================================
// [Sub App] Company Analysis Report (기업분석 리포트)
// =============================================================================
function CompanyAnalysisApp({ onClose }) {
  const [inputs, setInputs] = useState({ company: '', url: '', job: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const reportRef = useRef(null);

  const handleAIAnalysis = async () => {
    if (!inputs.company || !inputs.job) return alert("기업명과 직무를 입력해주세요.");
    setLoading(true);

    try {
      const prompt = `
        당신은 전문 기업 분석가이자 커리어 코치입니다.
        분석 대상 기업: ${inputs.company}
        참고 URL: ${inputs.url || '없음'}
        지원 직무: ${inputs.job}

        위 기업에 대해 취업 준비생이 면접 및 자소서에 활용할 수 있는 '심층 기업 분석 리포트'를 작성해주세요.
        
        [분석 요구사항]
        1. 기업 개요: 비전, 핵심가치, 인재상을 요약하세요.
        2. 사업 현황: 주요 연혁(설립~현재 핵심), 주요 사업 내용, 최근 주요 이슈/보도자료 3가지를 정리하세요.
        3. 시장 분석: 국내외 해당 산업 동향과 기업의 SWOT 분석(강점,약점,기회,위협)을 작성하세요.
        4. 경쟁력: 주요 경쟁사 대비 이 기업만의 '긍정적 차별점(USP)'을 도출하세요.
        5. 취업 전략: 위 분석을 토대로 해당 직무 지원자가 어필해야 할 구체적인 전략을 제시하세요.

        반드시 다음 JSON 형식으로만 답변하세요. (마크다운 펜스 없이)

        {
          "overview": {
            "vision": "비전 및 미션 요약",
            "values": "핵심가치 및 인재상 키워드"
          },
          "business": {
            "history": "주요 연혁 요약",
            "biz_area": "주요 사업 영역 설명",
            "issues": ["최신 이슈 1", "최신 이슈 2", "최신 이슈 3"]
          },
          "market": {
            "trends": "국내외 산업 동향 요약",
            "swot": {
              "s": "Strengths (강점)",
              "w": "Weaknesses (약점)",
              "o": "Opportunities (기회)",
              "t": "Threats (위협)"
            }
          },
          "competitor": "경쟁사 대비 긍정적 차이점 (USP)",
          "strategy": "직무 맞춤형 취업/면접 전략"
        }
      `;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } })
      });
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsed = safeJsonParse(text);
      if (parsed) setResult(parsed);
      else alert("AI 분석 결과를 가져오지 못했습니다. 다시 시도해주세요.");
    } catch (e) { 
        console.error(e);
        alert("오류가 발생했습니다."); 
    } finally { setLoading(false); }
  };
  const handleDownload = async () => { if (!reportRef.current) return; try { const h = await loadHtml2Canvas(); const c = await h(reportRef.current, { scale: 2, useCORS: true }); const l = document.createElement('a'); l.download = `기업분석_${inputs.company}.png`; l.href = c.toDataURL('image/png'); l.click(); } catch (e) { alert("실패"); } };

  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col font-sans text-slate-800">
      <header className="bg-slate-900 text-white p-4 shadow-md flex justify-between items-center flex-shrink-0"><div className="flex items-center space-x-3"><div className="bg-indigo-500 p-2 rounded-lg"><BarChart3 className="w-6 h-6 text-white" /></div><div><h1 className="text-xl font-bold">기업분석 리포트 (AI)</h1><p className="text-xs text-slate-400">Career Vitamin App</p></div></div><div className="flex items-center space-x-3"><button onClick={onClose} className="px-4 py-2 text-sm text-slate-300 hover:text-white flex items-center"><ChevronLeft className="w-4 h-4 mr-1" /> 나가기</button>{result && <button onClick={handleDownload} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold flex items-center shadow"><Download className="w-4 h-4 mr-2" />저장</button>}</div></header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-[400px] bg-white border-r border-slate-200 flex flex-col overflow-y-auto shadow-xl z-10"><div className="p-6 space-y-6"><section className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100"><h3 className="flex items-center text-sm font-bold text-indigo-800 uppercase mb-4"><Settings className="w-4 h-4 mr-2" /> 1. 분석 대상</h3><div className="space-y-3">
            <div><label className="text-xs font-bold text-slate-700 mb-1 block">지원 기업</label><input value={inputs.company} onChange={e => setInputs({...inputs, company: e.target.value})} className="w-full p-3 border rounded-lg font-bold mb-2" placeholder="기업명 (예: 카카오)" /><div className="relative"><LinkIcon className="w-4 h-4 absolute left-2 top-2.5 text-slate-400" /><input value={inputs.url} onChange={e => setInputs({...inputs, url: e.target.value})} className="w-full p-2 pl-8 border rounded text-sm bg-white" placeholder="홈페이지 URL (선택)" /></div></div>
            <div><label className="text-xs font-bold text-slate-700 mb-1 block">지원 직무</label><input value={inputs.job} onChange={e => setInputs({...inputs, job: e.target.value})} className="w-full p-3 border rounded-lg" placeholder="직무 (예: 서비스 기획)" /></div>
            <button onClick={handleAIAnalysis} disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold flex justify-center shadow-md mt-2">{loading ? <Loader2 className="animate-spin" /> : "AI 분석 실행"}</button></div></section>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 leading-relaxed">* 5가지 심층 분석(개요, 사업, 시장, 경쟁, 전략)이 포함된 상세 리포트가 생성됩니다.</div></div></aside>
        <main className="flex-1 bg-slate-200 p-8 overflow-y-auto flex justify-center items-start"><div ref={reportRef} className="w-[210mm] min-h-[297mm] bg-white shadow-2xl p-[15mm] flex flex-col relative"><div className="border-b-4 border-indigo-600 pb-6 mb-8 flex justify-between items-start"><div><span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold tracking-wider mb-3 inline-block">COMPANY REPORT</span><h1 className="text-4xl font-extrabold mt-2 text-slate-900">{inputs.company || '기업명'}</h1><p className="text-lg text-slate-500 mt-1">기업분석 리포트</p></div><div className="text-right text-sm text-slate-600">{new Date().toLocaleDateString()}</div></div>{result ? <div className="space-y-10">
            <div className="space-y-3"><h3 className="text-lg font-bold text-indigo-800 flex items-center"><Star className="w-5 h-5 mr-2" /> 1. 기업 개요 (Overview)</h3><div className="grid grid-cols-2 gap-4"><div className="bg-slate-50 p-4 rounded-xl border border-slate-100"><span className="text-xs font-bold text-slate-400 block mb-1">VISION & MISSION</span><p className="text-sm text-slate-700">{result.overview.vision}</p></div><div className="bg-slate-50 p-4 rounded-xl border border-slate-100"><span className="text-xs font-bold text-slate-400 block mb-1">CORE VALUES & PEOPLE</span><p className="text-sm text-slate-700">{result.overview.values}</p></div></div></div>
            <div className="space-y-3"><h3 className="text-lg font-bold text-indigo-800 flex items-center"><Building2 className="w-5 h-5 mr-2" /> 2. 사업 현황 및 이슈</h3><div className="text-sm text-slate-700 leading-relaxed mb-3 p-4 bg-white border rounded-xl"><span className="font-bold text-indigo-600 block mb-1">[주요 연혁]</span>{result.business.history}<br/><br/><span className="font-bold text-indigo-600 block mb-1">[주요 사업]</span>{result.business.biz_area}</div><ul className="space-y-2">{result.business.issues.map((n, i) => <li key={i} className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-sm text-slate-700 shadow-sm font-medium"><span className="bg-white text-indigo-600 px-2 py-0.5 rounded text-xs font-bold mr-2 border border-indigo-200">ISSUE {i+1}</span>{n}</li>)}</ul></div>
            <div className="space-y-3"><h3 className="text-lg font-bold text-indigo-800 flex items-center"><Globe className="w-5 h-5 mr-2" /> 3. 산업 동향 및 SWOT</h3><div className="bg-slate-50 p-4 rounded-xl border mb-4 text-sm text-slate-700">{result.market.trends}</div><div className="grid grid-cols-2 gap-4"><div className="p-4 bg-blue-50 border border-blue-100 rounded-xl"><div className="text-blue-800 font-bold text-xs mb-1">STRENGTHS (강점)</div><p className="text-sm text-slate-700">{result.market.swot.s}</p></div><div className="p-4 bg-orange-50 border border-orange-100 rounded-xl"><div className="text-orange-800 font-bold text-xs mb-1">WEAKNESSES (약점)</div><p className="text-sm text-slate-700">{result.market.swot.w}</p></div><div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl"><div className="text-emerald-800 font-bold text-xs mb-1">OPPORTUNITIES (기회)</div><p className="text-sm text-slate-700">{result.market.swot.o}</p></div><div className="p-4 bg-red-50 border border-red-100 rounded-xl"><div className="text-red-800 font-bold text-xs mb-1">THREATS (위협)</div><p className="text-sm text-slate-700">{result.market.swot.t}</p></div></div></div>
            <div className="space-y-3"><h3 className="text-lg font-bold text-indigo-800 flex items-center"><Trophy className="w-5 h-5 mr-2" /> 4. 경쟁우위 (USP)</h3><div className="bg-white p-5 rounded-xl border-2 border-indigo-100 shadow-sm"><p className="text-slate-700 font-medium leading-relaxed">{result.competitor}</p></div></div>
            <div className="space-y-3"><h3 className="text-lg font-bold text-indigo-800 flex items-center"><Target className="w-5 h-5 mr-2" /> 5. 취업 전략 (Strategy)</h3><div className="bg-indigo-600 p-6 rounded-xl text-white shadow-md"><p className="leading-relaxed whitespace-pre-line font-medium">{result.strategy}</p></div></div>
        </div> : <div className="flex-1 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl mt-10 h-64"><BarChart3 className="w-20 h-20 mb-6 opacity-20" /><p className="text-center">기업 정보 입력 후<br/>분석 리포트 생성</p></div>}<div className="mt-auto pt-10 border-t border-slate-200 flex justify-between items-center text-xs text-slate-400"><div className="flex items-center"><BarChart3 className="w-4 h-4 mr-1 text-indigo-500" /><span>Career Vitamin</span></div><span>AI-Powered Intelligence</span></div></div></main>
      </div>
    </div>
  );
}

// ... (Other Sub Apps)

function PtInterviewApp({ onClose }) {
  const [step, setStep] = useState('input'); 
  const [inputs, setInputs] = useState({ company: '', job: '', request: '' });
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [script, setScript] = useState(null);
  const [loading, setLoading] = useState(false);
  const reportRef = useRef(null);
  const handleGenerateTopics = async () => { if (!inputs.company || !inputs.job || !inputs.request) return alert("입력 필요"); setLoading(true); try { const prompt = `기업: ${inputs.company}, 직무: ${inputs.job}, 상황: ${inputs.request}. PT 면접 주제 15개 추천. JSON Array only: ["주제1", "주제2"]`; const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } }) }); const data = await res.json(); const text = data.candidates?.[0]?.content?.parts?.[0]?.text; const parsed = safeJsonParse(text); if (parsed) { setTopics(parsed); setStep('list'); } } catch (e) { alert("오류"); } finally { setLoading(false); } };
  const handleGenerateScript = async (topic) => { setLoading(true); setSelectedTopic(topic); try { const prompt = `PT주제: "${topic}", 기업: ${inputs.company}, 직무: ${inputs.job}. 발표 대본(서론,본론,결론). 마크다운 개조식 사용. JSON only: {"intro": "...", "body": "...", "conclusion": "..."}`; const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } }) }); const data = await res.json(); const text = data.candidates?.[0]?.content?.parts?.[0]?.text; const parsed = safeJsonParse(text); if (parsed) { setScript(parsed); setStep('detail'); } } catch (e) { alert("오류"); } finally { setLoading(false); } };
  const handleDownload = async () => { if (!reportRef.current) return; try { const h = await loadHtml2Canvas(); const c = await h(reportRef.current, { scale: 2, useCORS: true }); const l = document.createElement('a'); l.download = `PT면접_${inputs.company}.png`; l.href = c.toDataURL('image/png'); l.click(); } catch (e) { alert("실패"); } };

  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col font-sans text-slate-800">
      <header className="bg-slate-900 text-white p-4 shadow-md flex justify-between items-center flex-shrink-0"><div className="flex items-center space-x-3"><div className="bg-rose-500 p-2 rounded-lg"><MonitorPlay className="w-6 h-6 text-white" /></div><div><h1 className="text-xl font-bold">PT 면접 가이드 (AI)</h1><p className="text-xs text-slate-400">Career Vitamin App</p></div></div><div className="flex items-center space-x-3"><button onClick={onClose} className="px-4 py-2 text-sm text-slate-300 hover:text-white flex items-center"><ChevronLeft className="w-4 h-4 mr-1" /> 나가기</button>{step === 'detail' && <button onClick={handleDownload} className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg font-bold flex items-center shadow"><Download className="w-4 h-4 mr-2" />저장</button>}</div></header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-[400px] bg-white border-r border-slate-200 flex flex-col overflow-y-auto shadow-xl z-10"><div className="p-6 space-y-6"><section className={`transition-all ${step !== 'input' ? 'opacity-50' : ''}`}><h3 className="flex items-center text-sm font-bold text-rose-800 uppercase mb-4"><Settings className="w-4 h-4 mr-2" /> 1. 기본 설정</h3><div className="space-y-3"><input value={inputs.company} onChange={e => setInputs({...inputs, company: e.target.value})} className="w-full p-3 border rounded-lg" placeholder="지원 기업명" disabled={step !== 'input'} /><input value={inputs.job} onChange={e => setInputs({...inputs, job: e.target.value})} className="w-full p-3 border rounded-lg" placeholder="지원 직무" disabled={step !== 'input'} /><textarea value={inputs.request} onChange={e => setInputs({...inputs, request: e.target.value})} className="w-full p-3 border rounded-lg h-24 resize-none" placeholder="요청사항" disabled={step !== 'input'} />{step === 'input' && <button onClick={handleGenerateTopics} disabled={loading} className="w-full bg-rose-600 text-white py-3 rounded-xl font-bold flex justify-center">{loading ? <Loader2 className="animate-spin" /> : "주제 추출"}</button>}{step !== 'input' && <button onClick={() => {setStep('input'); setTopics([]); setScript(null);}} className="w-full bg-slate-100 text-slate-600 py-2 rounded-lg text-sm">다시 입력</button>}</div></section>{step !== 'input' && topics.length > 0 && <section className="animate-in fade-in slide-in-from-bottom-4"><h3 className="flex items-center text-sm font-bold text-slate-700 uppercase mb-4"><MonitorPlay className="w-4 h-4 mr-2" /> 2. 주제 선택</h3><div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">{topics.map((topic, idx) => <button key={idx} onClick={() => handleGenerateScript(topic)} disabled={loading} className={`w-full text-left p-3 rounded-lg text-sm border transition-all ${selectedTopic === topic ? 'bg-rose-50 border-rose-500 text-rose-700 font-bold' : 'bg-white hover:bg-slate-50'}`}><span className="inline-block w-6 font-bold text-rose-400">{idx + 1}.</span> {topic}</button>)}</div></section>}</div></aside>
        <main className="flex-1 bg-slate-200 p-8 overflow-y-auto flex justify-center items-start">{script ? <div ref={reportRef} className="w-[210mm] min-h-[297mm] bg-white shadow-2xl p-[15mm] flex flex-col relative animate-in fade-in zoom-in-95 duration-500"><div className="border-b-4 border-rose-500 pb-6 mb-10"><span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-xs font-bold tracking-wider mb-3 inline-block">PT INTERVIEW GUIDE</span><h1 className="text-2xl font-extrabold text-slate-900 leading-tight mb-2">{selectedTopic}</h1><div className="flex text-sm text-slate-500 font-medium gap-4 mt-4"><span>{inputs.company}</span><span>{inputs.job}</span><span className="ml-auto text-xs text-slate-400">{new Date().toLocaleDateString()}</span></div></div><div className="space-y-8"><div><h3 className="text-lg font-bold text-slate-800 mb-3">서론</h3><div className="text-slate-700 text-sm bg-slate-50 p-4 rounded-xl border border-slate-100 whitespace-pre-line">{script.intro}</div></div><div><h3 className="text-lg font-bold text-slate-800 mb-3">본론</h3><div className="text-slate-700 text-sm border-l-4 border-rose-200 pl-4 py-2 whitespace-pre-line">{script.body}</div></div><div><h3 className="text-lg font-bold text-slate-800 mb-3">결론</h3><div className="bg-rose-50 p-5 rounded-xl border border-rose-100 text-slate-800 text-sm whitespace-pre-line">{script.conclusion}</div></div></div><div className="mt-auto pt-8 border-t border-slate-200 flex justify-between items-center text-xs text-slate-400"><span>Career Vitamin : PT Interview</span><span>AI-Generated Script</span></div></div> : <div className="flex-1 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-300 rounded-2xl m-10"><MonitorPlay className="w-16 h-16 mb-4 opacity-20" /><p>주제를 선택하면<br/>대본이 생성됩니다.</p></div>}</main>
      </div>
    </div>
  );
}

function SelfDiscoveryMapApp({ onClose }) {
  const [profile, setProfile] = useState({ name: '', targetJob: '', date: new Date().toISOString().split('T')[0] });
  const [keywords, setKeywords] = useState([]);
  const [currentKeyword, setCurrentKeyword] = useState('');
  const [keywordType, setKeywordType] = useState('strength');
  const [experiences, setExperiences] = useState([]);
  const [newExp, setNewExp] = useState({ title: '', s: '', t: '', a: '', r: '' });
  const [isExpFormOpen, setIsExpFormOpen] = useState(false);
  const reportRef = useRef(null);
  const addKeyword = (e) => { if (e.key === 'Enter' && currentKeyword.trim()) { setKeywords([...keywords, { id: Date.now(), text: currentKeyword.trim(), type: keywordType }]); setCurrentKeyword(''); } };
  const removeKeyword = (id) => setKeywords(keywords.filter(k => k.id !== id));
  const addExperience = () => { if (!newExp.title.trim()) return alert("입력 필요"); setExperiences([...experiences, { ...newExp, id: Date.now() }]); setNewExp({ title: '', s: '', t: '', a: '', r: '' }); setIsExpFormOpen(false); };
  const removeExperience = (id) => setExperiences(experiences.filter(e => e.id !== id));
  const handleDownload = async () => { if (!reportRef.current) return; try { const h2c = await loadHtml2Canvas(); const c = await h2c(reportRef.current, { scale: 2, useCORS: true }); const l = document.createElement('a'); l.download = `지도_${profile.name}.png`; l.href = c.toDataURL('image/png'); l.click(); } catch (e) { alert("실패"); } };

  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col font-sans text-slate-800">
      <header className="bg-slate-900 text-white p-4 shadow-md flex justify-between items-center flex-shrink-0"><div className="flex items-center space-x-3"><div className="bg-blue-600 p-2 rounded-lg"><Map className="w-6 h-6 text-white" /></div><div><h1 className="text-xl font-bold">나를 찾는 지도</h1><p className="text-xs text-slate-400">Career Vitamin App</p></div></div><div className="flex items-center space-x-3"><button onClick={onClose} className="px-4 py-2 text-sm text-slate-300 hover:text-white"><ChevronLeft className="w-4 h-4 mr-1" /> 돌아가기</button><button onClick={handleDownload} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-bold flex items-center shadow-lg"><Download className="w-5 h-5 mr-2" />다운로드</button></div></header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-[380px] bg-white border-r border-slate-200 flex flex-col overflow-y-auto shadow-xl z-10"><div className="p-6 space-y-8"><section><h3 className="flex items-center text-sm font-bold text-slate-500 uppercase mb-4"><User className="w-4 h-4 mr-2" /> 기본 정보</h3><div className="space-y-4"><input name="name" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className="w-full p-2.5 border rounded-lg" placeholder="이름" /><input name="targetJob" value={profile.targetJob} onChange={e => setProfile({...profile, targetJob: e.target.value})} className="w-full p-2.5 border rounded-lg" placeholder="목표 직무" /></div></section><section><h3 className="flex items-center text-sm font-bold text-slate-500 uppercase mb-4"><Hash className="w-4 h-4 mr-2" /> 키워드</h3><div className="bg-slate-50 p-4 rounded-xl border"><div className="flex space-x-2 mb-3"><button onClick={() => setKeywordType('strength')} className={`flex-1 py-1 text-xs font-bold rounded ${keywordType === 'strength' ? 'bg-blue-100 text-blue-700' : 'text-slate-500'}`}>강점</button><button onClick={() => setKeywordType('value')} className={`flex-1 py-1 text-xs font-bold rounded ${keywordType === 'value' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500'}`}>가치</button></div><input value={currentKeyword} onChange={e => setCurrentKeyword(e.target.value)} onKeyDown={addKeyword} className="w-full p-2 border rounded" placeholder="입력 + Enter" /><div className="flex flex-wrap gap-2 mt-3">{keywords.map(k => (<span key={k.id} className={`flex items-center px-2 py-1 rounded text-xs border ${k.type === 'strength' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>{k.text} <button onClick={() => removeKeyword(k.id)} className="ml-1"><X className="w-3 h-3" /></button></span>))}</div></div></section><section><div className="flex justify-between items-center mb-4"><h3 className="flex items-center text-sm font-bold text-slate-500 uppercase"><Star className="w-4 h-4 mr-2" /> 경험 (STAR)</h3><button onClick={() => setIsExpFormOpen(true)} className="text-xs bg-slate-800 text-white px-2 py-1 rounded"><Plus className="w-3 h-3" /></button></div>{isExpFormOpen && <div className="bg-slate-50 p-3 rounded border mb-3 space-y-2"><input className="w-full p-2 text-sm font-bold border rounded" placeholder="제목" value={newExp.title} onChange={e => setNewExp({...newExp, title: e.target.value})} /><textarea className="w-full p-2 text-xs border rounded h-12" placeholder="S" value={newExp.s} onChange={e => setNewExp({...newExp, s: e.target.value})} /><textarea className="w-full p-2 text-xs border rounded h-12" placeholder="T" value={newExp.t} onChange={e => setNewExp({...newExp, t: e.target.value})} /><textarea className="w-full p-2 text-xs border rounded h-12" placeholder="A" value={newExp.a} onChange={e => setNewExp({...newExp, a: e.target.value})} /><textarea className="w-full p-2 text-xs border rounded h-12" placeholder="R" value={newExp.r} onChange={e => setNewExp({...newExp, r: e.target.value})} /><button onClick={addExperience} className="w-full bg-blue-600 text-white py-1.5 rounded text-xs font-bold">추가</button></div>}<div className="space-y-2">{experiences.map(exp => (<div key={exp.id} className="bg-white p-3 rounded border shadow-sm relative group"><button onClick={() => removeExperience(exp.id)} className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button><div className="font-bold text-sm mb-1">{exp.title}</div><div className="text-xs text-slate-500 line-clamp-2">{exp.a}</div></div>))}</div></section></div></aside>
        <main className="flex-1 bg-slate-200 p-8 overflow-y-auto flex justify-center items-start">
          <div ref={reportRef} className="w-[210mm] min-h-[297mm] bg-white shadow-2xl p-[15mm] flex flex-col relative">
            <div className="border-b-2 border-slate-800 pb-4 mb-8 flex justify-between items-end"><div><h1 className="text-3xl font-extrabold text-slate-900">Self-Discovery Map</h1><p className="text-sm text-slate-500 mt-1">Career Vitamin Analysis</p></div><div className="text-right"><div className="text-2xl font-bold text-blue-600">{profile.name}</div><div className="text-sm text-slate-600">{profile.targetJob}</div><div className="text-xs text-slate-400 mt-1">{profile.date}</div></div></div>
            <div className="mb-10"><h2 className="text-lg font-bold text-slate-800 mb-4 border-l-4 border-blue-600 pl-3">Core Keywords</h2><div className="bg-slate-50 rounded-xl p-6 border border-slate-100 flex flex-wrap gap-3 min-h-[100px]">{keywords.map(k => (<span key={k.id} className={`px-3 py-1.5 rounded-lg text-sm font-bold border ${k.type === 'strength' ? 'bg-white text-blue-700' : 'bg-white text-emerald-700'}`}>{k.text}</span>))}</div></div>
            <div><h2 className="text-lg font-bold text-slate-800 mb-4 border-l-4 border-slate-800 pl-3">Experience (STAR)</h2><div className="space-y-4">{experiences.map((exp, idx) => (<div key={exp.id} className="border rounded-xl p-4"><div className="flex items-center mb-2"><span className="bg-slate-800 text-white text-xs font-bold px-2 py-0.5 rounded mr-2">CASE {idx + 1}</span><h3 className="font-bold">{exp.title}</h3></div><div className="grid grid-cols-1 gap-2 text-sm pl-1"><p><span className="font-bold text-slate-400 w-8 inline-block">S</span> {exp.s}</p><p><span className="font-bold text-slate-400 w-8 inline-block">T</span> {exp.t}</p><p><span className="font-bold text-blue-500 w-8 inline-block">A</span> {exp.a}</p><p><span className="font-bold text-slate-400 w-8 inline-block">R</span> {exp.r}</p></div></div>))}</div></div>
            <div className="mt-auto pt-4 border-t border-slate-200 text-xs text-slate-400 flex justify-between"><span>Powered by Career Vitamin</span><span>Confidential Report</span></div>
          </div>
        </main>
      </div>
    </div>
  );
}

function RoleModelGuideApp({ onClose }) {
  const [data, setData] = useState({ name: '', role: '', intro: '', quotes: '', media: '', reason: '' });
  const [loading, setLoading] = useState(false);
  const reportRef = useRef(null);
  const handleChange = (e) => setData({ ...data, [e.target.name]: e.target.value });
  const handleAIAnalysis = async () => {
    if (!data.name) return alert("이름 입력 필요");
    setLoading(true);
    try {
      const prompt = `롤모델 '${data.name}' 분석. JSON: { "role": "...", "intro": "...", "quotes": "...", "media": "...", "reason": "..." }`;
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } }) });
      const result = await res.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsed = safeJsonParse(text);
      if (parsed) setData(prev => ({ ...prev, ...parsed }));
    } catch (e) { alert("오류"); } finally { setLoading(false); }
  };
  const handleDownload = async () => { if (!reportRef.current) return; try { const h2c = await loadHtml2Canvas(); const c = await h2c(reportRef.current, { scale: 2, useCORS: true }); const l = document.createElement('a'); l.download = `롤모델_${data.name}.png`; l.href = c.toDataURL('image/png'); l.click(); } catch (e) { alert("실패"); } };

  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col font-sans text-slate-800">
      <header className="bg-slate-900 text-white p-4 shadow-md flex justify-between items-center flex-shrink-0"><div className="flex items-center space-x-3"><div className="bg-orange-500 p-2 rounded-lg"><Award className="w-6 h-6 text-white" /></div><div><h1 className="text-xl font-bold">롤모델 분석 리포트 (AI)</h1><p className="text-xs text-slate-400">Career Vitamin App</p></div></div><div className="flex items-center space-x-3"><button onClick={onClose} className="px-4 py-2 text-sm text-slate-300 hover:text-white"><ChevronLeft className="w-4 h-4 mr-1" /> 돌아가기</button><button onClick={handleDownload} className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg font-bold flex items-center shadow-lg"><Download className="w-5 h-5 mr-2" />다운로드</button></div></header>
      <div className="flex flex-1 overflow-hidden">
         <aside className="w-[400px] bg-white border-r border-slate-200 flex flex-col overflow-y-auto shadow-xl z-10"><div className="p-6 space-y-8"><section className="bg-orange-50 p-5 rounded-2xl border border-orange-100"><h3 className="flex items-center text-sm font-bold text-orange-800 uppercase mb-3"><Sparkles className="w-4 h-4 mr-2" /> 1. AI 자동 분석</h3><div className="space-y-3"><input name="name" value={data.name} onChange={handleChange} onKeyDown={(e) => e.key === 'Enter' && handleAIAnalysis()} className="w-full p-3 border rounded-xl font-bold" placeholder="예: 스티브 잡스" /><button onClick={handleAIAnalysis} disabled={loading} className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl font-bold flex justify-center">{loading ? <Loader2 className="animate-spin" /> : "분석 시작"}</button></div></section><section className="space-y-4"><h3 className="flex items-center text-sm font-bold text-slate-500 uppercase"><Search className="w-4 h-4 mr-2" /> 2. 상세 내용</h3><input name="role" value={data.role} onChange={handleChange} className="w-full p-2 border rounded" placeholder="직업" /><textarea name="intro" value={data.intro} onChange={handleChange} className="w-full p-2 border rounded h-24" placeholder="소개" /><textarea name="quotes" value={data.quotes} onChange={handleChange} className="w-full p-2 border rounded h-20" placeholder="명언" /><input name="media" value={data.media} onChange={handleChange} className="w-full p-2 border rounded" placeholder="콘텐츠" /></section><section><h3 className="flex items-center text-sm font-bold text-slate-500 uppercase"><MessageSquare className="w-4 h-4 mr-2" /> 3. 면접 답변</h3><textarea name="reason" value={data.reason} onChange={handleChange} className="w-full p-2 border rounded h-32" placeholder="답변 내용" /></section></div></aside>
         <main className="flex-1 bg-slate-200 p-8 overflow-y-auto flex justify-center items-start">
            <div ref={reportRef} className="w-[210mm] min-h-[297mm] bg-white shadow-2xl p-[15mm] flex flex-col relative">
               <div className="border-b-4 border-orange-500 pb-6 mb-8 flex justify-between items-start"><div><span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">ROLE MODEL ANALYSIS</span><h1 className="text-4xl font-extrabold mt-2">{data.name}</h1><p className="text-lg text-slate-500 mt-1">{data.role}</p></div><div className="text-right text-sm text-slate-600">{new Date().toLocaleDateString()}</div></div>
               <div className="space-y-10">
                  <div className="flex gap-6"><div className="w-12 pt-1 text-center"><User className="w-8 h-8 text-orange-400 mx-auto" /></div><div className="flex-1"><h2 className="text-xl font-bold mb-2">Who is {data.name}?</h2><p className="text-slate-600 whitespace-pre-line">{data.intro}</p></div></div>
                  <div className="flex gap-6"><div className="w-12 pt-1 text-center"><Quote className="w-8 h-8 text-orange-400 mx-auto" /></div><div className="flex-1"><h2 className="text-xl font-bold mb-2">Key Quotes</h2><div className="bg-slate-50 p-4 rounded-xl"><p className="text-slate-700 font-serif italic">"{data.quotes}"</p></div></div></div>
                  <div className="flex gap-6"><div className="w-12 pt-1 text-center"><BookOpen className="w-8 h-8 text-orange-400 mx-auto" /></div><div className="flex-1"><h2 className="text-xl font-bold mb-2">Related Contents</h2><p className="text-slate-600">{data.media}</p></div></div>
                  <div className="mt-8 bg-orange-50 border-2 border-orange-100 rounded-2xl p-6"><h2 className="text-lg font-bold text-orange-800 mb-3 flex items-center"><MessageSquare className="w-5 h-5 mr-2" /> 면접 답변 가이드</h2><p className="text-slate-800 whitespace-pre-line">{data.reason}</p></div>
               </div>
               <div className="mt-auto pt-6 border-t border-slate-200 flex justify-between items-center text-xs text-slate-400"><span>Career Vitamin : Role Model Analysis</span><span>Confidential Report</span></div>
            </div>
         </main>
      </div>
    </div>
  );
}

function CareerRoadmapApp({ onClose }) {
  const [inputs, setInputs] = useState({ company: '', job: '', years: '5' });
  const [roadmapData, setRoadmapData] = useState(null); 
  const [loading, setLoading] = useState(false);
  const reportRef = useRef(null);

  const handleAIPlan = async () => {
    if (!inputs.company || !inputs.job) return alert("입력 필요");
    setLoading(true);
    try {
      const prompt = `커리어 로드맵 설계. 기업:${inputs.company}, 직무:${inputs.job}, ${inputs.years}년후. JSON: { "goal": "...", "roadmap": [{"stage": "...", "action": "..."}], "script": "..." }`;
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } }) });
      const result = await res.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsed = safeJsonParse(text);
      if (parsed) setRoadmapData(parsed);
    } catch (e) { alert("오류"); } finally { setLoading(false); }
  };

  const handleDataChange = (field, value) => setRoadmapData(prev => ({ ...prev, [field]: value }));
  const handleRoadmapChange = (index, value) => { const newRoadmap = [...roadmapData.roadmap]; newRoadmap[index].action = value; setRoadmapData(prev => ({ ...prev, roadmap: newRoadmap })); };
  const handleDownload = async () => { if (!reportRef.current) return; try { const h2c = await loadHtml2Canvas(); const c = await h2c(reportRef.current, { scale: 2, useCORS: true }); const l = document.createElement('a'); l.download = `커리어로드맵.png`; l.href = c.toDataURL('image/png'); l.click(); } catch (e) { alert("실패"); } };

  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col font-sans text-slate-800">
      <header className="bg-slate-900 text-white p-4 shadow-md flex justify-between items-center flex-shrink-0"><div className="flex items-center space-x-3"><div className="bg-blue-600 p-2 rounded-lg"><TrendingUp className="w-6 h-6 text-white" /></div><div><h1 className="text-xl font-bold">커리어 로드맵 (AI)</h1><p className="text-xs text-slate-400">Career Vitamin App</p></div></div><div className="flex items-center space-x-3"><button onClick={onClose} className="px-4 py-2 text-sm text-slate-300 hover:text-white"><ChevronLeft className="w-4 h-4 mr-1" /> 돌아가기</button>{roadmapData && <button onClick={handleDownload} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-bold flex items-center shadow-lg"><Download className="w-5 h-5 mr-2" />다운로드</button>}</div></header>
      <div className="flex flex-1 overflow-hidden">
         <aside className="w-[400px] bg-white border-r border-slate-200 flex flex-col overflow-y-auto shadow-xl z-10"><div className="p-6 space-y-8"><section className="bg-blue-50 p-5 rounded-2xl border border-blue-100"><h3 className="flex items-center text-sm font-bold text-blue-800 uppercase mb-4"><Target className="w-4 h-4 mr-2" /> 1. 목표 설정</h3><div className="space-y-4"><input value={inputs.company} onChange={e => setInputs({...inputs, company: e.target.value})} className="w-full p-3 border rounded-lg" placeholder="기업명" /><input value={inputs.job} onChange={e => setInputs({...inputs, job: e.target.value})} className="w-full p-3 border rounded-lg" placeholder="직무" /><div className="flex gap-2">{['5', '10'].map(y => <button key={y} onClick={() => setInputs({...inputs, years: y})} className={`flex-1 py-2 rounded-lg border ${inputs.years === y ? 'bg-blue-600 text-white' : 'bg-white'}`}>{y}년 후</button>)}</div><button onClick={handleAIPlan} disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold flex justify-center">{loading ? <Loader2 className="animate-spin" /> : "AI 로드맵 생성"}</button></div></section>{roadmapData && <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4"><section><h3 className="flex items-center text-sm font-bold text-slate-500 uppercase mb-4"><Edit3 className="w-4 h-4 mr-2" /> 2. 내용 편집</h3><div className="space-y-4"><div><label className="text-xs font-bold text-slate-700 block">Career Goal</label><textarea value={roadmapData.goal} onChange={e => handleDataChange('goal', e.target.value)} className="w-full p-3 border rounded h-20" /></div><div><label className="text-xs font-bold text-slate-700 block">Action Plan</label><div className="space-y-3">{roadmapData.roadmap.map((step, idx) => <div key={idx} className="bg-slate-50 p-3 rounded border"><span className="text-xs font-bold text-blue-600 block mb-1">{step.stage}</span><textarea value={step.action} onChange={e => handleRoadmapChange(idx, e.target.value)} className="w-full p-2 border rounded h-16" /></div>)}</div></div></div></section><section><h3 className="flex items-center text-sm font-bold text-slate-500 uppercase mb-4"><MessageSquare className="w-4 h-4 mr-2" /> 3. 스크립트 편집</h3><div className="bg-white border-2 border-blue-100 p-3 rounded-xl"><textarea value={roadmapData.script} onChange={e => handleDataChange('script', e.target.value)} className="w-full p-2 border-none h-40" /></div></section></div>}</div></aside>
         <main className="flex-1 bg-slate-200 p-8 overflow-y-auto flex justify-center items-start"><div ref={reportRef} className="w-[210mm] min-h-[297mm] bg-white shadow-2xl p-[15mm] flex flex-col relative"><div className="border-b-4 border-blue-600 pb-6 mb-10 flex justify-between items-start"><div><span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">CAREER ROADMAP</span><h1 className="text-4xl font-extrabold mt-2">{inputs.company}</h1><p className="text-xl text-slate-500 mt-2">{inputs.job} 전문가 여정 ({inputs.years}년)</p></div><div className="text-right"><TrendingUp className="w-12 h-12 text-blue-200" /></div></div>{roadmapData ? <div className="space-y-12"><div><h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center"><Target className="w-5 h-5 mr-2 text-blue-600" /> Career Goal</h2><div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-r-xl"><p className="text-xl font-bold text-blue-900">"{roadmapData.goal}"</p></div></div><div><h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center"><Calendar className="w-5 h-5 mr-2 text-blue-600" /> Action Plan</h2><div className="space-y-6">{roadmapData.roadmap.map((step, idx) => (<div key={idx} className="flex gap-6 relative">{idx !== 2 && <div className="absolute left-[19px] top-10 bottom-[-24px] w-0.5 bg-slate-200"></div>}<div className="w-10 h-10 rounded-full bg-white border-4 border-blue-200 flex items-center justify-center z-10"><div className="w-4 h-4 rounded-full bg-blue-600"></div></div><div className="flex-1 bg-white border border-slate-200 p-5 rounded-xl shadow-sm"><span className="text-blue-600 font-bold text-sm block mb-1">{step.stage}</span><p className="text-slate-700 whitespace-pre-line">{step.action}</p></div></div>))}</div></div><div><h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center"><MessageSquare className="w-5 h-5 mr-2 text-blue-600" /> 입사 후 포부</h2><div className="bg-slate-50 p-6 rounded-2xl border border-slate-200"><p className="text-slate-700 leading-relaxed whitespace-pre-line">{roadmapData.script}</p></div></div></div> : <div className="flex-1 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl"><Sparkles className="w-12 h-12 mb-4 opacity-50" /><p className="text-center">정보 입력 후<br/>AI 로드맵 생성</p></div>}<div className="mt-auto pt-6 border-t border-slate-200 flex justify-between items-center text-xs text-slate-400"><div className="flex items-center"><TrendingUp className="w-4 h-4 mr-1 text-blue-500" /><span>Career Vitamin : Career Roadmap</span></div><span>AI-Generated Plan</span></div></div></main>
      </div>
    </div>
  );
}

function SelfIntroApp({ onClose }) {
  const [inputs, setInputs] = useState({ company: '', job: '', concept: 'competency', keyword: '', exp: '' });
  const [script, setScript] = useState(null); 
  const [loading, setLoading] = useState(false);
  const reportRef = useRef(null);

  const handleAIAnalysis = async () => {
    if (!inputs.company || !inputs.keyword || !inputs.exp) return alert("입력 필요");
    setLoading(true);
    try {
      const prompt = `1분 자기소개. 기업:${inputs.company}, 직무:${inputs.job}, 컨셉:${inputs.concept}, 키워드:${inputs.keyword}, 경험:${inputs.exp}. JSON: { "slogan": "...", "opening": "...", "body": "...", "closing": "..." }`;
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } }) });
      const result = await res.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsed = safeJsonParse(text);
      if (parsed) setScript(parsed);
    } catch (e) { alert("오류"); } finally { setLoading(false); }
  };

  const handleDataChange = (field, value) => setScript(prev => ({ ...prev, [field]: value }));
  const handleDownload = async () => { if (!reportRef.current) return; try { const h2c = await loadHtml2Canvas(); const c = await h2c(reportRef.current, { scale: 2, useCORS: true }); const l = document.createElement('a'); l.download = `자기소개.png`; l.href = c.toDataURL('image/png'); l.click(); } catch (e) { alert("실패"); } };

  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col font-sans text-slate-800">
      <header className="bg-slate-900 text-white p-4 shadow-md flex justify-between items-center flex-shrink-0"><div className="flex items-center space-x-3"><div className="bg-purple-500 p-2 rounded-lg"><Mic className="w-6 h-6 text-white" /></div><div><h1 className="text-xl font-bold">1분 자기소개 (AI)</h1><p className="text-xs text-slate-400">Career Vitamin App</p></div></div><div className="flex items-center space-x-3"><button onClick={onClose} className="px-4 py-2 text-sm text-slate-300 hover:text-white"><ChevronLeft className="w-4 h-4 mr-1" /> 돌아가기</button>{script && <button onClick={handleDownload} className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg font-bold shadow"><Download className="w-5 h-5 mr-2" />다운로드</button>}</div></header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-[400px] bg-white border-r border-slate-200 flex flex-col overflow-y-auto shadow-xl z-10"><div className="p-6 space-y-6"><section className="bg-purple-50 p-5 rounded-2xl border border-purple-100"><h3 className="flex items-center text-sm font-bold text-purple-800 uppercase mb-4"><Settings className="w-4 h-4 mr-2" /> 1. 전략 설정</h3><div className="space-y-3"><div className="grid grid-cols-2 gap-2"><input value={inputs.company} onChange={e => setInputs({...inputs, company: e.target.value})} className="p-2 border rounded text-sm" placeholder="기업명" /><input value={inputs.job} onChange={e => setInputs({...inputs, job: e.target.value})} className="p-2 border rounded text-sm" placeholder="직무명" /></div><div className="flex gap-2"><button onClick={() => setInputs({...inputs, concept: 'competency'})} className={`flex-1 py-2 text-xs font-bold rounded-lg border ${inputs.concept === 'competency' ? 'bg-purple-600 text-white' : 'bg-white'}`}>직무 역량</button><button onClick={() => setInputs({...inputs, concept: 'character'})} className={`flex-1 py-2 text-xs font-bold rounded-lg border ${inputs.concept === 'character' ? 'bg-purple-600 text-white' : 'bg-white'}`}>성격/인성</button></div><input value={inputs.keyword} onChange={e => setInputs({...inputs, keyword: e.target.value})} className="w-full p-2 border rounded text-sm font-bold" placeholder="키워드" /><textarea value={inputs.exp} onChange={e => setInputs({...inputs, exp: e.target.value})} className="w-full p-2 border rounded text-sm h-24 resize-none" placeholder="경험 내용" /><button onClick={handleAIAnalysis} disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-bold flex justify-center">{loading ? <Loader2 className="animate-spin" /> : "스크립트 생성"}</button></div></section>{script && <section className="animate-in fade-in slide-in-from-bottom-4 space-y-4"><div className="border-t border-slate-200 pt-4"><h3 className="flex items-center text-sm font-bold text-slate-700 uppercase mb-3"><Edit3 className="w-4 h-4 mr-2" /> 2. 대본 수정</h3><div className="space-y-3"><div><label className="text-xs font-bold text-purple-700">슬로건</label><input value={script.slogan} onChange={e => handleDataChange('slogan', e.target.value)} className="w-full p-2 text-sm border rounded font-bold" /></div><div><label className="text-xs font-bold text-slate-700">오프닝</label><textarea value={script.opening} onChange={e => handleDataChange('opening', e.target.value)} className="w-full p-2 border rounded h-20" /></div><div><label className="text-xs font-bold text-slate-700">바디</label><textarea value={script.body} onChange={e => handleDataChange('body', e.target.value)} className="w-full p-2 border rounded h-32" /></div><div><label className="text-xs font-bold text-slate-700">클로징</label><textarea value={script.closing} onChange={e => handleDataChange('closing', e.target.value)} className="w-full p-2 border rounded h-20" /></div></div></div></section>}</div></aside>
        <main className="flex-1 bg-slate-200 p-8 overflow-y-auto flex justify-center items-start"><div ref={reportRef} className="w-[210mm] min-h-[297mm] bg-white shadow-2xl p-[15mm] flex flex-col relative"><div className="border-b-4 border-purple-600 pb-6 mb-8"><span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold">1-MINUTE SPEECH</span><h1 className="text-2xl font-extrabold mt-2">"{script ? script.slogan : '나만의 슬로건'}"</h1><p className="text-sm text-slate-500 mt-2">{inputs.company} | {inputs.job}</p></div>{script ? <div className="space-y-8"><div className="flex gap-6"><div className="w-20 pt-1 text-center"><div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2 text-purple-600 font-bold">00"</div><span className="text-xs font-bold text-slate-400">Opening</span></div><div className="flex-1 bg-purple-50 p-6 rounded-2xl border border-purple-100"><p className="text-slate-800 font-bold text-lg text-center">"{script.opening}"</p></div></div><div className="flex gap-6"><div className="w-20 pt-1 text-center"><div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2 text-slate-600 font-bold">20"</div><span className="text-xs font-bold text-slate-400">Body</span></div><div className="flex-1 py-2"><p className="text-slate-700 leading-loose border-l-4 border-slate-200 pl-6">{script.body}</p></div></div><div className="flex gap-6"><div className="w-20 pt-1 text-center"><div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-2 text-white font-bold">50"</div><span className="text-xs font-bold text-slate-400">Closing</span></div><div className="flex-1 bg-slate-50 p-6 rounded-2xl border border-slate-200"><p className="text-slate-800 font-medium text-center">{script.closing}</p></div></div></div> : <div className="flex-1 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl"><Mic className="w-16 h-16 mb-4 opacity-20" /><p className="text-center">스크립트 생성 대기 중</p></div>}<div className="mt-auto pt-6 border-t border-slate-200 flex justify-between items-center text-xs text-slate-400"><div className="flex items-center"><Mic className="w-4 h-4 mr-1 text-purple-500" /><span>Career Vitamin : Self Introduction</span></div><span>AI-Powered Speech</span></div></div></main>
      </div>
    </div>
  );
}

function SituationInterviewApp({ onClose }) {
  const [question, setQuestion] = useState('');
  const [splitCriteria, setSplitCriteria] = useState(''); 
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const reportRef = useRef(null);
  const handleAIAnalysis = async () => { if (!question.trim()) return alert("질문 입력"); setLoading(true); try { const prompt = `상황면접: "${question}", 기준: "${splitCriteria}". JSON: { "sit1_title": "...", "sit1_content": "...", "sit2_title": "...", "sit2_content": "...", "conclusion": "..." }`; const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } }) }); const data = await res.json(); const text = data.candidates?.[0]?.content?.parts?.[0]?.text; const parsed = safeJsonParse(text); if (parsed) setResult(parsed); } catch (e) { alert("오류"); } finally { setLoading(false); } };
  const handleDataChange = (f, v) => setResult(prev => ({ ...prev, [f]: v }));
  const handleDownload = async () => { if (!reportRef.current) return; try { const h = await loadHtml2Canvas(); const c = await h(reportRef.current, { scale: 2, useCORS: true }); const l = document.createElement('a'); l.download = `상황면접.png`; l.href = c.toDataURL('image/png'); l.click(); } catch (e) { alert("실패"); } };

  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col font-sans text-slate-800">
      <header className="bg-slate-900 text-white p-4 shadow-md flex justify-between items-center flex-shrink-0"><div className="flex items-center space-x-3"><div className="bg-teal-500 p-2 rounded-lg"><Split className="w-6 h-6 text-white" /></div><div><h1 className="text-xl font-bold">상황면접 가이드 (AI)</h1><p className="text-xs text-slate-400">Career Vitamin App</p></div></div><div className="flex items-center space-x-3"><button onClick={onClose} className="px-4 py-2 text-sm text-slate-300 hover:text-white flex items-center"><ChevronLeft className="w-4 h-4 mr-1" /> 나가기</button>{result && <button onClick={handleDownload} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-bold flex items-center shadow"><Download className="w-4 h-4 mr-2" />저장</button>}</div></header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-[400px] bg-white border-r border-slate-200 flex flex-col overflow-y-auto shadow-xl z-10"><div className="p-6 space-y-6"><section className="bg-teal-50 p-5 rounded-2xl border border-teal-100"><h3 className="flex items-center text-sm font-bold text-teal-800 uppercase mb-4"><Settings className="w-4 h-4 mr-2" /> 1. 질문 입력</h3><div className="space-y-3"><div><label className="text-xs font-bold text-slate-700 mb-1 block">기출/예상 질문</label><textarea value={question} onChange={e => setQuestion(e.target.value)} className="w-full p-3 border rounded-lg h-24 resize-none" placeholder="예: 상사가 부당한 지시를 내린다면?" /></div><div><label className="text-xs font-bold text-slate-700 mb-1 block">상황 분리 기준</label><input value={splitCriteria} onChange={e => setSplitCriteria(e.target.value)} className="w-full p-3 border rounded-lg" placeholder="예: 경중, 시급성" /></div><button onClick={handleAIAnalysis} disabled={loading} className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl font-bold flex justify-center shadow-md mt-2">{loading ? <Loader2 className="animate-spin" /> : "답변 초안 생성"}</button></div></section>{result && <section className="animate-in fade-in space-y-6"><div className="border-t border-slate-200 pt-4"><h3 className="flex items-center text-sm font-bold text-slate-700 uppercase mb-3"><Edit3 className="w-4 h-4 mr-2" /> 2. 내용 수정</h3><div className="space-y-4"><div><input value={result.sit1_title} onChange={e => handleDataChange('sit1_title', e.target.value)} className="w-full p-2 text-sm font-bold border rounded mb-1 text-teal-700" /><textarea value={result.sit1_content} onChange={e => handleDataChange('sit1_content', e.target.value)} className="w-full p-2 text-xs border rounded h-24" /></div><div><input value={result.sit2_title} onChange={e => handleDataChange('sit2_title', e.target.value)} className="w-full p-2 text-sm font-bold border rounded mb-1 text-blue-700" /><textarea value={result.sit2_content} onChange={e => handleDataChange('sit2_content', e.target.value)} className="w-full p-2 text-xs border rounded h-24" /></div><div><label className="text-xs font-bold text-slate-700 mb-1 block">최종 답변</label><textarea value={result.conclusion} onChange={e => handleDataChange('conclusion', e.target.value)} className="w-full p-2 text-sm border rounded h-32" /></div></div></div></section>}</div></aside>
        <main className="flex-1 bg-slate-200 p-8 overflow-y-auto flex justify-center items-start"><div ref={reportRef} className="w-[210mm] min-h-[297mm] bg-white shadow-2xl p-[15mm] flex flex-col relative"><div className="border-b-4 border-teal-600 pb-6 mb-8"><span className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-xs font-bold tracking-wider mb-3 inline-block">SITUATION INTERVIEW</span><h1 className="text-2xl font-extrabold text-slate-900 leading-snug break-keep">"{question || '질문'}"</h1>{splitCriteria && <p className="text-sm text-slate-500 mt-2 font-medium">💡 분리 기준: {splitCriteria}</p>}</div>{result ? <div className="flex flex-col h-full"><div className="grid grid-cols-2 gap-8 mb-8"><div className="bg-teal-50/50 border border-teal-100 p-6 rounded-2xl"><div className="flex items-center mb-4 text-teal-700 font-bold text-lg"><div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center mr-2 text-sm">1</div>{result.sit1_title}</div><p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">{result.sit1_content}</p></div><div className="bg-blue-50/50 border border-blue-100 p-6 rounded-2xl"><div className="flex items-center mb-4 text-blue-700 font-bold text-lg"><div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2 text-sm">2</div>{result.sit2_title}</div><p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">{result.sit2_content}</p></div></div><div className="mt-4 bg-slate-50 border-2 border-slate-200 rounded-2xl p-8 flex-1"><h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center"><MessageSquare className="w-5 h-5 mr-2 text-teal-600" /> 최종 답변 스크립트</h3><div className="text-slate-700 leading-loose whitespace-pre-line text-base font-medium">{result.conclusion}</div></div></div> : <div className="flex-1 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl"><Split className="w-16 h-16 mb-4 opacity-20" /><p className="text-center">질문 입력 후<br/>가이드 생성</p></div>}<div className="mt-auto pt-6 border-t border-slate-200 flex justify-between items-center text-xs text-slate-400"><div className="flex items-center"><Split className="w-4 h-4 mr-1 text-teal-500" /><span>Career Vitamin</span></div><span>AI-Powered Analysis</span></div></div></main>
      </div>
    </div>
  );
}

function ExperienceStructuringAppWrapper({ onClose }) { return <ExperienceStructuringApp onClose={onClose} />; }
function PtInterviewAppWrapper({ onClose }) { return <PtInterviewApp onClose={onClose} />; }
function SelfDiscoveryMapAppWrapper({ onClose }) { return <SelfDiscoveryMapApp onClose={onClose} />; }
function RoleModelGuideAppWrapper({ onClose }) { return <RoleModelGuideApp onClose={onClose} />; }
function CareerRoadmapAppWrapper({ onClose }) { return <CareerRoadmapApp onClose={onClose} />; }
function SelfIntroAppWrapper({ onClose }) { return <SelfIntroApp onClose={onClose} />; }
function SituationInterviewAppWrapper({ onClose }) { return <SituationInterviewApp onClose={onClose} />; }
function CompanyAnalysisAppWrapper({ onClose }) { return <CompanyAnalysisApp onClose={onClose} />; }

export default function CareerArchitectDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('guest'); 
  const [activeTab, setActiveTab] = useState('dashboard');
  const [experts, setExperts] = useState([]);
  const [newExpertEmail, setNewExpertEmail] = useState('');
  const [newExpertName, setNewExpertName] = useState(''); 
  const [currentApp, setCurrentApp] = useState('none');

  useEffect(() => {
    const initAuth = async () => { if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) { try { if (!auth.currentUser) await signInWithCustomToken(auth, __initial_auth_token); } catch (e) { console.error(e); } } };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        setUser(currentUser);
        if (OWNER_UID && currentUser.uid === OWNER_UID) { setRole('owner'); } 
        else { 
            setRole('guest'); 
            try { 
                if (currentUser.email) { 
                    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'authorized_experts'), where('email', '==', currentUser.email)); 
                    const s = await getDocs(q); 
                    if (!s.empty) { 
                        setRole('expert'); 
                        s.docs.forEach(async (docSnapshot) => {
                             // 로그인 시 UID 및 접속시간 업데이트 (이름은 덮어쓰지 않음)
                             if (docSnapshot.data().uid !== currentUser.uid) {
                                 await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'authorized_experts', docSnapshot.id), {
                                     uid: currentUser.uid,
                                     lastLogin: new Date().toISOString()
                                 }).catch(e => console.error(e));
                             }
                        });
                    } 
                } 
            } catch (e) {} 
        }
      } else { setUser(null); setRole('guest'); }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (role !== 'owner') return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'authorized_experts'));
    const unsubscribe = onSnapshot(q, (s) => setExperts(s.docs.map(d => ({ id: d.id, ...d.data() }))), (e) => console.log(e)); // Error Handler
    return () => unsubscribe(); // Fixed Cleanup
  }, [role]);

  const handleLogin = async () => { try { await signInWithPopup(auth, new GoogleAuthProvider()); } catch (e) { 
    // 배포 전에는 개발자 버튼 삭제 및 자동 접속 차단
    alert("팝업이 차단되었습니다. 브라우저 팝업 차단을 해제하고 다시 시도해주세요.");
  } };
  const handleLogout = async () => { await signOut(auth); setUser(null); setCurrentApp('none'); };
  const handleCopyUid = () => { if (user?.uid) navigator.clipboard.writeText(user.uid); };
  
  const handleAddExpert = async (e) => { 
      e.preventDefault(); 
      if (!newExpertEmail.trim() || !newExpertName.trim()) return alert("이름과 이메일을 모두 입력해주세요."); 
      try { 
          await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'authorized_experts'), { 
              email: newExpertEmail.trim(), 
              displayName: newExpertName.trim(), 
              addedAt: new Date().toISOString() 
          }); 
          setNewExpertEmail(''); 
          setNewExpertName('');
      } catch (e) { alert("오류"); } 
  };
  
  const handleDeleteExpert = async (id) => { if (confirm("삭제?")) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'authorized_experts', id)); };
  
  // [FIX] 개발자 모드 접속 기능 삭제 (배포용)

  const launchService = (key) => {
    if (SERVICES[key].internal) setCurrentApp(key);
    else if (SERVICES[key].link) window.open(SERVICES[key].link, '_blank');
    else alert("준비 중");
  };

  if (currentApp === 'map') return <SelfDiscoveryMapAppWrapper onClose={() => setCurrentApp('none')} />;
  if (currentApp === 'role_model') return <RoleModelGuideAppWrapper onClose={() => setCurrentApp('none')} />;
  if (currentApp === 'career_roadmap') return <CareerRoadmapAppWrapper onClose={() => setCurrentApp('none')} />;
  if (currentApp === 'pt_interview') return <PtInterviewAppWrapper onClose={() => setCurrentApp('none')} />;
  if (currentApp === 'exp_structuring') return <ExperienceStructuringAppWrapper onClose={() => setCurrentApp('none')} />;
  if (currentApp === 'sit_interview') return <SituationInterviewAppWrapper onClose={() => setCurrentApp('none')} />; 
  if (currentApp === 'self_intro') return <SelfIntroAppWrapper onClose={() => setCurrentApp('none')} />;
  if (currentApp === 'company_analysis') return <CompanyAnalysisAppWrapper onClose={() => setCurrentApp('none')} />;

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;

  if (!user || role === 'guest') return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
       <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
          <div className="flex justify-center mb-4"><div className="bg-indigo-600 p-3 rounded-xl rotate-3 shadow-lg"><LayoutDashboard className="w-8 h-8 text-white"/></div></div>
          <h1 className="text-3xl font-extrabold mb-2 text-slate-900">Career Vitamin</h1>
          <p className="text-slate-500 mb-6">전문가들을 위한 AI 커리어 코칭 솔루션</p>
          {user ? <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-4 text-sm">권한이 없습니다.<br/>관리자에게 문의하세요.<br/>UID: {user.uid} <button onClick={handleCopyUid} className="underline font-bold ml-2">복사</button></div> : null}
          {!user ? (
            <div>
                <button onClick={handleLogin} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 px-4 rounded-xl font-bold shadow-lg transition-transform hover:-translate-y-1 flex justify-center items-center"><RefreshCw className="w-5 h-5 mr-2" />Google 계정으로 로그인</button>
            </div>
          ) : <button onClick={handleLogout} className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-3.5 px-4 rounded-xl flex items-center justify-center transition-colors"><LogOut className="w-5 h-5 mr-2" />다른 계정으로 로그인</button>}
        </div>
        <p className="mt-8 text-slate-400 text-sm">© 2025 Career Vitamin. All rights reserved.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full shadow-2xl z-10">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center space-x-3 text-indigo-400 mb-1"><LayoutDashboard className="w-6 h-6" /><span className="font-bold text-lg tracking-wide text-white">Career Vitamin</span></div>
          <p className="text-xs text-slate-400 mt-1 pl-9">대한민국 No.1 커리어코치, YANGCOACH</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800'}`}><LayoutDashboard className="w-5 h-5 mr-3" />서비스 실행</button>
          {role === 'owner' && <button onClick={() => setActiveTab('admin')} className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${activeTab === 'admin' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800'}`}><Settings className="w-5 h-5 mr-3" />시스템 관리</button>}
        </nav>
        <div className="p-4 border-t border-slate-700 bg-slate-800/50">
          <div className="text-xs text-slate-400 mb-2 px-1">{role === 'owner' ? '관리자(Owner)' : '전문가(Expert)'} 모드</div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center px-4 py-2 rounded border border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white text-sm transition-colors"><LogOut className="w-4 h-4 mr-2" />로그아웃</button>
        </div>
      </aside>
      <main className="flex-1 ml-64 p-8">
        <header className="mb-10">
             <h1 className="text-2xl font-bold text-slate-800">{activeTab === 'dashboard' ? 'Career AI Dashboard' : '전문가 관리'}</h1>
             <p className="text-slate-500 mt-1">{activeTab === 'dashboard' ? '고객 코칭을 위한 도구 및 앱을 실행합니다.' : '플랫폼에 접근 가능한 유료 전문가 계정을 관리합니다.'}</p>
        </header>
        {activeTab === 'dashboard' && (
           <div className="space-y-10">
              {CATEGORIES.map(cat => {
                 const items = Object.keys(SERVICES).filter(k => SERVICES[k].category === cat.id);
                 if (items.length === 0) return null;
                 const Icon = cat.icon;
                 return (
                    <div key={cat.id}>
                       <div className="flex items-center mb-4 text-slate-700"><Icon className="w-5 h-5 mr-2" /><h2 className="text-lg font-bold">{cat.title}</h2></div>
                       <div className="grid grid-cols-3 gap-6">
                          {items.map(key => <ServiceCard key={key} serviceKey={key} serviceData={SERVICES[key]} onLaunch={launchService} />)}
                       </div>
                    </div>
                 );
              })}
           </div>
        )}
        {activeTab === 'admin' && (
           <div className="max-w-4xl bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 bg-slate-50 border-b border-slate-200"><h3 className="font-bold">전문가 목록 ({experts.length}명)</h3></div>
              <div className="p-6"><form onSubmit={handleAddExpert} className="flex gap-2 items-end"><div className="flex-1"><label className="block text-xs font-bold text-indigo-900 mb-1 ml-1">실명 (Name)</label><input className="w-full border p-2 rounded" placeholder="홍길동" value={newExpertName} onChange={e => setNewExpertName(e.target.value)} required /></div><div className="flex-[2]"><label className="block text-xs font-bold text-indigo-900 mb-1 ml-1">이메일 (Google Account)</label><input className="w-full border p-2 rounded" placeholder="email@gmail.com" value={newExpertEmail} onChange={e => setNewExpertEmail(e.target.value)} required /></div><button className="bg-indigo-600 text-white px-6 py-2 rounded font-bold hover:bg-indigo-700 h-[42px]">추가</button></form></div>
              <div className="divide-y">
                  {experts.map(ex => (
                    <div key={ex.id} className="p-4 flex justify-between items-center hover:bg-slate-50">
                        <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mr-4 text-slate-500 font-bold text-lg">{ex.displayName ? ex.displayName[0] : '?'}</div>
                            <div>
                                <p className="font-bold text-slate-800">{ex.displayName || '이름 없음'}</p>
                                <p className="text-xs text-slate-500">{ex.email}</p>
                            </div>
                        </div>
                        <button onClick={() => handleDeleteExpert(ex.id)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  ))}
              </div>
           </div>
        )}
        <div className="mt-10 pt-6 border-t text-center text-xs text-slate-400">COPYRIGHT 2025. YANG HEE SUNG. ALL RIGHTS RESERVED.</div>
      </main>
    </div>
  );
}

function ServiceCard({ serviceKey, serviceData, onLaunch }) {
  const { name, desc, icon: Icon, color, isNew, link, internal } = serviceData;
  const isReady = internal || link;
  const colors = { blue: "text-blue-600 bg-blue-50", indigo: "text-indigo-600 bg-indigo-50", emerald: "text-emerald-600 bg-emerald-50", violet: "text-violet-600 bg-violet-50", orange: "text-orange-600 bg-orange-50", cyan: "text-cyan-600 bg-cyan-50", yellow: "text-yellow-700 bg-yellow-50", rose: "text-rose-600 bg-rose-50", teal: "text-teal-600 bg-teal-50", purple: "text-purple-600 bg-purple-50" };
  const theme = colors[color] || colors.blue;
  const colorClasses = {
    blue: "bg-blue-600 hover:bg-blue-700", indigo: "bg-indigo-600 hover:bg-indigo-700", emerald: "bg-emerald-600 hover:bg-emerald-700", violet: "bg-violet-600 hover:bg-violet-700", orange: "bg-orange-600 hover:bg-orange-700", cyan: "bg-cyan-600 hover:bg-cyan-700", yellow: "bg-yellow-400 hover:bg-yellow-500 text-slate-900", rose: "bg-rose-600 hover:bg-rose-700", teal: "bg-teal-600 hover:bg-teal-700", purple: "bg-purple-600 hover:bg-purple-700"
  };
  return (
     <div className={`group bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-xl transition-all relative ${!isReady && 'opacity-70'}`}>
        {isNew && isReady && <span className="absolute top-4 right-4 bg-emerald-100 text-emerald-600 text-xs font-bold px-2 py-1 rounded">NEW</span>}
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${theme.split(' ')[1]}`}><Icon className={`w-7 h-7 ${theme.split(' ')[0]}`} /></div>
        <h3 className="font-bold text-lg mb-2">{name}</h3>
        <p className="text-sm text-slate-500 mb-4 h-10 line-clamp-2" style={{ whiteSpace: 'normal' }}>{desc}</p>
        <button 
          onClick={() => isReady && onLaunch(serviceKey)} 
          className={`w-full py-3 rounded-xl font-bold text-white transition-all shadow-md ${isReady ? colorClasses[color] || colorClasses.blue : 'bg-slate-300 cursor-not-allowed'}`}
        >
          {!isReady ? "준비 중" : (internal ? "앱 실행하기" : "도구 열기")}
        </button>
     </div>
  );
}