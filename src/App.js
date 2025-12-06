import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged
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
// [수정] Stethoscope 포함, 모든 아이콘 완벽 Import
import { 
  LayoutDashboard, Map, Building2, LogOut, Plus, Trash2, 
  Settings, Loader2, RefreshCw, Check, 
  User, Hash, Star, X, ChevronLeft, Compass, 
  MessageSquare, Sparkles, Award, Search, BookOpen, Quote, Download, TrendingUp, Calendar, Target, 
  Edit3, MonitorPlay, Zap, LayoutList, Split, Mic, BarChart3, Link as LinkIcon, 
  Globe, Trophy, Stethoscope, Key, AlertCircle, ExternalLink
} from 'lucide-react';

// =============================================================================
// [설정 구역]
// =============================================================================

const DEFAULT_API_KEY = "AIzaSyBX0kT7I3yanNNxI-xj7KMoxVmIkPAP5ug"; 

const firebaseConfig = {
  apiKey: "AIzaSyCNc2Ht2PJAdcxfXraBwu6Afj02dUEV0gM",
  authDomain: "career-vitamin.firebaseapp.com",
  projectId: "career-vitamin",
  storageBucket: "career-vitamin.firebasestorage.app",
  messagingSenderId: "1056766630872",
  appId: "1:1056766630872:web:5d2149f6a0f0fd5cd130ad"
};

const OWNER_UID = "TN8orW7kwuTzAnFWNM8jCiixt3r2"; 
const APP_ID = 'career-vitamin'; 

// =============================================================================

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Helpers ---

const loadHtml2Canvas = () => {
  return new Promise((resolve, reject) => {
    if (window.html2canvas) { resolve(window.html2canvas); return; }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    script.onload = () => resolve(window.html2canvas);
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

const safeJsonParse = (str) => {
  try { return JSON.parse(str); } catch (e) {
    try {
      let cleaned = str.replace(/```json/g, '').replace(/```/g, '').trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
      return JSON.parse(cleaned);
    } catch (e2) { return null; }
  }
};

const renderText = (content) => {
  if (!content) return '';
  if (Array.isArray(content)) return content.join(' ');
  if (typeof content === 'object') return JSON.stringify(content);
  return content;
};

// AI Fetcher
const fetchGemini = async (prompt) => {
  const apiKey = localStorage.getItem("custom_gemini_key") || DEFAULT_API_KEY;
  const models = ["gemini-1.5-flash", "gemini-1.0-pro", "gemini-pro"];
  let lastError = null;

  for (const model of models) {
    try {
      console.log(`Attempting with model: ${model}`);
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        if (response.status === 400 && (errData.error?.message?.includes("API key") || errData.error?.message?.includes("key"))) {
           throw new Error("API 키가 유효하지 않습니다. [시스템 관리]에서 새 키를 등록해주세요.");
        }
        throw new Error(errData.error?.message || `HTTP Error ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsed = safeJsonParse(text);
      
      if (parsed) return parsed;
      
    } catch (e) {
      console.warn(`Model ${model} failed:`, e);
      lastError = e;
      if (e.message.includes("API 키")) throw e; 
    }
  }
  throw lastError || new Error("모든 AI 모델 응답 실패");
};

// --- Constants ---
const SERVICES = {
  gpt_guide: { name: "[GPT] 직업 탐색 가이드", desc: "관심 있는 직업/직무 입력 시 가이드 생성", link: "https://chatgpt.com/g/g-Uch9gJR4b-job-explorer-guide-report", internal: false, icon: Compass, color: "emerald" },
  card_bot: { name: "[노트북LM] 커리어스타일 챗봇", desc: "유료 프로그램 전용 챗봇", link: "https://notebooklm.google.com/notebook/595da4c0-fcc1-4064-82c8-9901e6dd8772", internal: false, icon: MessageSquare, color: "violet" },
  rubric_clinic: { name: "[Gem] 자소서 코칭 클리닉", desc: "유료 워크숍 전용", link: "https://gemini.google.com/gem/1jXo4wyUvzepwmP_diVl-FQzg05EkexIg?usp=sharing", internal: false, icon: Stethoscope, color: "cyan" },
  company_analysis: { name: "[AI] 기업분석 리포트", desc: "기업 핵심가치/이슈/SWOT 분석", link: null, internal: true, icon: BarChart3, color: "indigo" },
  career_roadmap: { name: "[AI] 커리어 로드맵", desc: "5년/10년 후 경력 목표 설계", link: null, internal: true, icon: TrendingUp, color: "blue" },
  pt_interview: { name: "[AI] PT 면접 가이드", desc: "주제 추출 및 발표 대본 생성", link: null, internal: true, icon: MonitorPlay, color: "rose" },
  sit_interview: { name: "[AI] 상황면접 가이드", desc: "상황별 구조화된 답변 생성", link: null, internal: true, icon: Split, color: "teal" },
  self_intro: { name: "[AI] 1분 자기소개", desc: "직무/인성 컨셉 맞춤 스크립트", link: null, internal: true, icon: Mic, color: "purple" },
  exp_structuring: { name: "[AI] 경험 구조화 (STAR)", desc: "경험 정리 및 핵심 역량 도출", link: null, internal: true, icon: LayoutList, color: "indigo" },
  role_model: { name: "[AI] 롤모델 분석", desc: "인물 정보 및 면접 활용 팁", link: null, internal: true, icon: Award, color: "orange" }
};

const COLOR_VARIANTS = {
  emerald: "bg-emerald-100 text-emerald-600",
  violet: "bg-violet-100 text-violet-600",
  cyan: "bg-cyan-100 text-cyan-600",
  indigo: "bg-indigo-100 text-indigo-600",
  blue: "bg-blue-100 text-blue-600",
  rose: "bg-rose-100 text-rose-600",
  teal: "bg-teal-100 text-teal-600",
  purple: "bg-purple-100 text-purple-600",
  orange: "bg-orange-100 text-orange-600",
};

// --- Sub Components (Apps) ---

function CompanyAnalysisApp({ onClose }) {
  const [inputs, setInputs] = useState({ company: '', url: '', job: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const reportRef = useRef(null);
  
  const handleAIAnalysis = async () => {
    if (!inputs.company || !inputs.job) return alert("기업명과 직무를 입력해주세요.");
    setLoading(true);
    try {
      const prompt = `기업 '${inputs.company}'(직무: ${inputs.job}) 심층 분석. JSON 포맷 필수: { "overview": { "vision": "...", "values": "..." }, "business": { "history": "...", "biz_area": "...", "issues": ["...", "...", "..."] }, "market": { "trends": "...", "swot": { "s": "...", "w": "...", "o": "...", "t": "..." } }, "competitor": "...", "strategy": "..." }`;
      const parsed = await fetchGemini(prompt);
      setResult(parsed);
    } catch (e) { alert(e.message); } finally { setLoading(false); }
  };
  const handleDownload = async () => { if (!reportRef.current) return; try { const h = await loadHtml2Canvas(); const c = await h(reportRef.current, { scale: 2, useCORS: true }); const l = document.createElement('a'); l.download = `기업분석_${inputs.company}.png`; l.href = c.toDataURL('image/png'); l.click(); } catch (e) { alert("저장 실패"); } };
  
  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col font-sans text-slate-800">
      <header className="bg-slate-900 text-white p-4 flex justify-between items-center"><div className="flex items-center gap-3"><BarChart3 className="text-indigo-400" /><h1 className="font-bold">기업분석 리포트</h1></div><button onClick={onClose}><X/></button></header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 bg-white border-r p-6 overflow-y-auto">
          <div className="space-y-4">
            <input value={inputs.company} onChange={e=>setInputs({...inputs, company:e.target.value})} className="w-full p-2 border rounded" placeholder="기업명" />
            <input value={inputs.job} onChange={e=>setInputs({...inputs, job:e.target.value})} className="w-full p-2 border rounded" placeholder="직무" />
            <button onClick={handleAIAnalysis} disabled={loading} className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">{loading ? <Loader2 className="animate-spin mx-auto"/> : "분석 시작"}</button>
          </div>
        </aside>
        <main className="flex-1 p-8 overflow-y-auto bg-slate-50 flex justify-center">
          {result ? (
            <div ref={reportRef} className="w-[210mm] min-h-[297mm] bg-white shadow-lg p-10 space-y-8">
              <h1 className="text-3xl font-bold text-indigo-900 border-b pb-4">{inputs.company} 분석 리포트</h1>
              <section><h3 className="font-bold text-lg mb-2">1. 기업 개요</h3><p className="text-sm">{renderText(result.overview?.vision)}</p></section>
              <section><h3 className="font-bold text-lg mb-2">2. 사업 현황</h3><p className="text-sm">{renderText(result.business?.biz_area)}</p></section>
              <section><h3 className="font-bold text-lg mb-2">3. SWOT 분석</h3><div className="grid grid-cols-2 gap-2 text-xs"><div className="bg-blue-50 p-2">S: {renderText(result.market?.swot?.s)}</div><div className="bg-orange-50 p-2">W: {renderText(result.market?.swot?.w)}</div></div></section>
              <section><h3 className="font-bold text-lg mb-2">4. 전략 제언</h3><p className="text-sm bg-indigo-50 p-4 rounded">{renderText(result.strategy)}</p></section>
            </div>
          ) : <div className="flex items-center justify-center h-full text-slate-400">정보를 입력하고 분석을 시작하세요.</div>}
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
      const prompt = `커리어 로드맵. 기업:${inputs.company}, 직무:${inputs.job}, ${inputs.years}년후. JSON: { "goal": "...", "roadmap": [{"stage": "...", "action": "..."}], "script": "..." }`;
      const parsed = await fetchGemini(prompt);
      setRoadmapData(parsed);
    } catch (e) { alert(e.message); } finally { setLoading(false); }
  };
  const handleDownload = async () => { if (!reportRef.current) return; try { const h = await loadHtml2Canvas(); const c = await h(reportRef.current, { scale: 2, useCORS: true }); const l = document.createElement('a'); l.download = `로드맵.png`; l.href = c.toDataURL('image/png'); l.click(); } catch (e) { alert("실패"); } };
  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col font-sans text-slate-800">
      <header className="bg-slate-900 text-white p-4 flex justify-between items-center"><div className="flex items-center gap-3"><TrendingUp className="text-blue-400"/><h1 className="font-bold">커리어 로드맵</h1></div><button onClick={onClose}><X/></button></header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 bg-white border-r p-6"><div className="space-y-4"><input value={inputs.company} onChange={e=>setInputs({...inputs, company:e.target.value})} className="w-full p-2 border rounded" placeholder="기업명"/><input value={inputs.job} onChange={e=>setInputs({...inputs, job:e.target.value})} className="w-full p-2 border rounded" placeholder="직무"/><button onClick={handleAIPlan} disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded">{loading ? <Loader2 className="animate-spin mx-auto"/> : "로드맵 생성"}</button></div></aside>
        <main className="flex-1 p-8 overflow-y-auto flex justify-center">{roadmapData ? <div ref={reportRef} className="w-[210mm] bg-white shadow-lg p-10"><h1 className="text-2xl font-bold mb-4">{roadmapData.goal}</h1>{roadmapData.roadmap?.map((r,i)=><div key={i} className="mb-4 p-4 border rounded"><h3 className="font-bold text-blue-600">{r.stage}</h3><p>{r.action}</p></div>)}</div> : <div className="flex items-center justify-center h-full text-slate-400">정보를 입력하세요.</div>}</main>
      </div>
    </div>
  );
}

function PtInterviewApp({ onClose }) {
  const [step, setStep] = useState('input'); 
  const [inputs, setInputs] = useState({ company: '', job: '', request: '' });
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [script, setScript] = useState(null);
  const [loading, setLoading] = useState(false);
  const reportRef = useRef(null);
  const handleGenerateTopics = async () => {
    if (!inputs.company) return alert("입력 필요");
    setLoading(true);
    try {
      const prompt = `기업:${inputs.company}, 직무:${inputs.job}, 상황:${inputs.request}. PT 면접 주제 5개 추천. JSON Array only: ["주제1", "주제2"...]`;
      const parsed = await fetchGemini(prompt);
      if(parsed) { setTopics(parsed); setStep('list'); }
    } catch (e) { alert(e.message); } finally { setLoading(false); }
  };
  const handleGenerateScript = async (topic) => {
    setLoading(true);
    try {
      const prompt = `PT주제: "${topic}", 기업:${inputs.company}. 발표 대본. JSON: {"intro": "...", "body": "...", "conclusion": "..."}`;
      const parsed = await fetchGemini(prompt);
      if(parsed) { setScript(parsed); setStep('detail'); }
    } catch(e){ alert(e.message); } finally { setLoading(false); }
  };
  const handleDownload = async () => { if (!reportRef.current) return; try { const h = await loadHtml2Canvas(); const c = await h(reportRef.current, { scale: 2, useCORS: true }); const l = document.createElement('a'); l.download = `PT면접.png`; l.href = c.toDataURL('image/png'); l.click(); } catch (e) { alert("실패"); } };

  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col font-sans text-slate-800">
      <header className="bg-slate-900 text-white p-4 flex justify-between items-center"><div className="flex items-center gap-3"><MonitorPlay className="text-rose-400"/><h1 className="font-bold">PT 면접 가이드</h1></div><button onClick={onClose}><X/></button></header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 bg-white border-r p-6">
           {step === 'input' && <div className="space-y-4"><input value={inputs.company} onChange={e=>setInputs({...inputs, company:e.target.value})} className="w-full p-2 border rounded" placeholder="기업명"/><button onClick={handleGenerateTopics} disabled={loading} className="w-full bg-rose-600 text-white py-2 rounded">{loading?<Loader2 className="animate-spin mx-auto"/>:"주제 추출"}</button></div>}
           {step === 'list' && <div className="space-y-2">{topics.map((t,i)=><button key={i} onClick={()=>handleGenerateScript(t)} disabled={loading} className="w-full text-left p-2 border rounded hover:bg-slate-50 text-sm">{i+1}. {t}</button>)}</div>}
           {step === 'detail' && <button onClick={()=>setStep('input')} className="w-full bg-slate-200 py-2 rounded">처음으로</button>}
        </aside>
        <main className="flex-1 p-8 overflow-y-auto flex justify-center">
           {script ? <div ref={reportRef} className="w-[210mm] bg-white shadow-lg p-10 space-y-6"><h2 className="text-xl font-bold">Intro</h2><p>{script.intro}</p><h2 className="text-xl font-bold">Body</h2><p>{script.body}</p><h2 className="text-xl font-bold">Conclusion</h2><p>{script.conclusion}</p></div> : <div className="flex items-center justify-center h-full text-slate-400">대기 중...</div>}
        </main>
      </div>
    </div>
  );
}

function SituationInterviewApp({ onClose }) {
  const [inputs, setInputs] = useState({ question: '', criteria: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const reportRef = useRef(null);
  const handleAIAnalysis = async () => {
    if (!inputs.question) return alert("질문 입력 필요");
    setLoading(true);
    try {
      const prompt = `상황면접 질문: ${inputs.question}, 기준: ${inputs.criteria}. 답변 2가지 버전. JSON: { "situation_a": {"title": "...", "content": "..."}, "situation_b": {"title": "...", "content": "..."}, "advice": "..." }`;
      const parsed = await fetchGemini(prompt);
      setResult(parsed);
    } catch (e) { alert(e.message); } finally { setLoading(false); }
  };
  const handleDownload = async () => { if (!reportRef.current) return; try { const h = await loadHtml2Canvas(); const c = await h(reportRef.current, { scale: 2, useCORS: true }); const l = document.createElement('a'); l.download = `상황면접.png`; l.href = c.toDataURL('image/png'); l.click(); } catch (e) { alert("실패"); } };
  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col font-sans text-slate-800">
      <header className="bg-slate-900 text-white p-4 flex justify-between items-center"><div className="flex items-center gap-3"><Split className="text-teal-400"/><h1 className="font-bold">상황면접 가이드</h1></div><button onClick={onClose}><X/></button></header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 bg-white border-r p-6"><div className="space-y-4"><textarea value={inputs.question} onChange={e=>setInputs({...inputs, question:e.target.value})} className="w-full p-2 border rounded h-24" placeholder="질문"/><button onClick={handleAIAnalysis} disabled={loading} className="w-full bg-teal-600 text-white py-2 rounded">{loading?<Loader2 className="animate-spin mx-auto"/>:"생성"}</button></div></aside>
        <main className="flex-1 p-8 overflow-y-auto flex justify-center">{result ? <div ref={reportRef} className="w-[210mm] bg-white shadow-lg p-10 space-y-6"><div className="border-l-4 border-teal-500 pl-4"><h3 className="font-bold">{result.situation_a?.title}</h3><p>{result.situation_a?.content}</p></div><div className="border-l-4 border-slate-400 pl-4"><h3 className="font-bold">{result.situation_b?.title}</h3><p>{result.situation_b?.content}</p></div><div className="bg-slate-100 p-4 rounded">Tip: {result.advice}</div></div> : <div className="flex items-center justify-center h-full text-slate-400">질문을 입력하세요.</div>}</main>
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
    if (!inputs.company) return alert("입력 필요");
    setLoading(true);
    try {
      const prompt = `1분 자기소개. 기업:${inputs.company}, 직무:${inputs.job}, 컨셉:${inputs.concept}, 키워드:${inputs.keyword}, 경험:${inputs.exp}. JSON: { "slogan": "...", "opening": "...", "body": "...", "closing": "..." }`;
      const parsed = await fetchGemini(prompt);
      setScript(parsed);
    } catch (e) { alert(e.message); } finally { setLoading(false); }
  };
  const handleDownload = async () => { if (!reportRef.current) return; try { const h = await loadHtml2Canvas(); const c = await h(reportRef.current, { scale: 2, useCORS: true }); const l = document.createElement('a'); l.download = `자기소개.png`; l.href = c.toDataURL('image/png'); l.click(); } catch (e) { alert("실패"); } };
  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col font-sans text-slate-800">
      <header className="bg-slate-900 text-white p-4 flex justify-between items-center"><div className="flex items-center gap-3"><Mic className="text-purple-400"/><h1 className="font-bold">1분 자기소개</h1></div><button onClick={onClose}><X/></button></header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 bg-white border-r p-6"><div className="space-y-4"><input value={inputs.company} onChange={e=>setInputs({...inputs, company:e.target.value})} className="w-full p-2 border rounded" placeholder="기업명"/><button onClick={handleAIAnalysis} disabled={loading} className="w-full bg-purple-600 text-white py-2 rounded">{loading?<Loader2 className="animate-spin mx-auto"/>:"생성"}</button></div></aside>
        <main className="flex-1 p-8 overflow-y-auto flex justify-center">{script ? <div ref={reportRef} className="w-[210mm] bg-white shadow-lg p-10 space-y-6"><h1 className="text-2xl font-bold text-center">"{script.slogan}"</h1><div className="bg-purple-50 p-4 rounded"><h3 className="font-bold">Opening</h3><p>{script.opening}</p></div><div className="pl-4 border-l-2 border-purple-200"><h3 className="font-bold">Body</h3><p>{script.body}</p></div><div className="bg-slate-50 p-4 rounded"><h3 className="font-bold">Closing</h3><p>{script.closing}</p></div></div> : <div className="flex items-center justify-center h-full text-slate-400">정보를 입력하세요.</div>}</main>
      </div>
    </div>
  );
}

function ExperienceStructuringApp({ onClose }) {
  const [inputs, setInputs] = useState({ company: '', job: '', keyword: '', desc: '' });
  const [starData, setStarData] = useState({ s: '', t: '', a: '', r: '' });
  const [loading, setLoading] = useState(false);
  const reportRef = useRef(null);
  const handleAIAnalysis = async () => {
    if (!inputs.desc) return alert("내용 입력 필요");
    setLoading(true);
    try {
      const prompt = `경험 STAR 구조화. 내용:${inputs.desc}. JSON: { "s": "...", "t": "...", "a": "...", "r": "..." }`;
      const parsed = await fetchGemini(prompt);
      setStarData(parsed);
    } catch (e) { alert(e.message); } finally { setLoading(false); }
  };
  const handleDownload = async () => { if (!reportRef.current) return; try { const h = await loadHtml2Canvas(); const c = await h(reportRef.current, { scale: 2, useCORS: true }); const l = document.createElement('a'); l.download = `STAR.png`; l.href = c.toDataURL('image/png'); l.click(); } catch (e) { alert("실패"); } };
  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col font-sans text-slate-800">
      <header className="bg-slate-900 text-white p-4 flex justify-between items-center"><div className="flex items-center gap-3"><LayoutList className="text-indigo-400"/><h1 className="font-bold">STAR 워크시트</h1></div><button onClick={onClose}><X/></button></header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 bg-white border-r p-6"><div className="space-y-4"><textarea value={inputs.desc} onChange={e=>setInputs({...inputs, desc:e.target.value})} className="w-full p-2 border rounded h-32" placeholder="경험 내용"/><button onClick={handleAIAnalysis} disabled={loading} className="w-full bg-indigo-600 text-white py-2 rounded">{loading?<Loader2 className="animate-spin mx-auto"/>:"구조화"}</button></div></aside>
        <main className="flex-1 p-8 overflow-y-auto flex justify-center">{starData.s ? <div ref={reportRef} className="w-[210mm] bg-white shadow-lg p-10 space-y-4"><div className="p-4 bg-slate-50 border-l-4 border-slate-400"><b>S:</b> {starData.s}</div><div className="p-4 bg-slate-50 border-l-4 border-slate-500"><b>T:</b> {starData.t}</div><div className="p-4 bg-indigo-50 border-l-4 border-indigo-500"><b>A:</b> {starData.a}</div><div className="p-4 bg-blue-50 border-l-4 border-blue-500"><b>R:</b> {starData.r}</div></div> : <div className="flex items-center justify-center h-full text-slate-400">경험을 입력하세요.</div>}</main>
      </div>
    </div>
  );
}

function RoleModelGuideApp({ onClose }) {
  const [data, setData] = useState({ name: '', role: '', intro: '', quotes: '', media: '', reason: '' });
  const [loading, setLoading] = useState(false);
  const reportRef = useRef(null);
  const handleAIAnalysis = async () => {
    if (!data.name) return alert("이름 입력 필요");
    setLoading(true);
    try {
      const prompt = `롤모델 '${data.name}' 분석. JSON: { "role": "...", "intro": "...", "quotes": "...", "media": "...", "reason": "..." }`;
      const parsed = await fetchGemini(prompt);
      setData(prev => ({ ...prev, ...parsed }));
    } catch (e) { alert(e.message); } finally { setLoading(false); }
  };
  const handleDownload = async () => { if (!reportRef.current) return; try { const h = await loadHtml2Canvas(); const c = await h(reportRef.current, { scale: 2, useCORS: true }); const l = document.createElement('a'); l.download = `롤모델.png`; l.href = c.toDataURL('image/png'); l.click(); } catch (e) { alert("실패"); } };
  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col font-sans text-slate-800">
      <header className="bg-slate-900 text-white p-4 flex justify-between items-center"><div className="flex items-center gap-3"><Award className="text-orange-400"/><h1 className="font-bold">롤모델 분석</h1></div><button onClick={onClose}><X/></button></header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 bg-white border-r p-6"><div className="space-y-4"><input value={data.name} onChange={e=>setData({...data, name:e.target.value})} className="w-full p-2 border rounded" placeholder="인물 이름"/><button onClick={handleAIAnalysis} disabled={loading} className="w-full bg-orange-600 text-white py-2 rounded">{loading?<Loader2 className="animate-spin mx-auto"/>:"분석"}</button></div></aside>
        <main className="flex-1 p-8 overflow-y-auto flex justify-center"><div ref={reportRef} className="w-[210mm] bg-white shadow-lg p-10 space-y-6"><h1 className="text-3xl font-bold">{data.name}</h1><p className="text-slate-500">{data.role}</p><div className="p-4 bg-slate-50 rounded italic">"{data.quotes}"</div><p>{data.intro}</p><div className="mt-4 border-t pt-4"><h3 className="font-bold">면접 활용 Tip</h3><p>{data.reason}</p></div></div></main>
      </div>
    </div>
  );
}

function SelfDiscoveryMapApp({ onClose }) {
  const [profile, setProfile] = useState({ name: '', targetJob: '', date: new Date().toISOString().split('T')[0] });
  const [keywords, setKeywords] = useState([]);
  const [currentKeyword, setCurrentKeyword] = useState('');
  const [keywordType, setKeywordType] = useState('strength');
  const reportRef = useRef(null);
  const addKeyword = (e) => { if (e.key === 'Enter' && currentKeyword.trim()) { setKeywords([...keywords, { id: Date.now(), text: currentKeyword.trim(), type: keywordType }]); setCurrentKeyword(''); } };
  const removeKeyword = (id) => setKeywords(keywords.filter(k => k.id !== id));
  const handleDownload = async () => { if (!reportRef.current) return; try { const h = await loadHtml2Canvas(); const c = await h(reportRef.current, { scale: 2, useCORS: true }); const l = document.createElement('a'); l.download = `지도.png`; l.href = c.toDataURL('image/png'); l.click(); } catch (e) { alert("실패"); } };
  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col font-sans text-slate-800">
      <header className="bg-slate-900 text-white p-4 flex justify-between items-center"><div className="flex items-center gap-3"><Map className="text-blue-400"/><h1 className="font-bold">나를 찾는 지도</h1></div><button onClick={onClose}><X/></button></header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 bg-white border-r p-6 space-y-6"><section><h3 className="font-bold text-sm text-slate-500 mb-2">키워드 입력</h3><input value={currentKeyword} onChange={e=>setCurrentKeyword(e.target.value)} onKeyDown={addKeyword} className="w-full p-2 border rounded" placeholder="입력 후 Enter"/><div className="flex gap-2 mt-2"><button onClick={()=>setKeywordType('strength')} className={`flex-1 py-1 text-xs rounded ${keywordType==='strength'?'bg-blue-100 text-blue-600':'bg-slate-100'}`}>강점</button><button onClick={()=>setKeywordType('value')} className={`flex-1 py-1 text-xs rounded ${keywordType==='value'?'bg-emerald-100 text-emerald-600':'bg-slate-100'}`}>가치</button></div></section></aside>
        <main className="flex-1 p-8 overflow-y-auto flex justify-center"><div ref={reportRef} className="w-[210mm] bg-white shadow-lg p-10"><h1 className="text-3xl font-bold mb-8">Self-Discovery Map</h1><div className="flex flex-wrap gap-2">{keywords.map(k=><span key={k.id} className={`px-3 py-1 rounded-full border ${k.type==='strength'?'border-blue-200 text-blue-600':'border-emerald-200 text-emerald-600'}`}>{k.text}<button onClick={()=>removeKeyword(k.id)} className="ml-2">x</button></span>)}</div></div></main>
      </div>
    </div>
  );
}

// --- Main App Component ---

export default function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('guest'); 
  const [activeTab, setActiveTab] = useState('dashboard');
  const [experts, setExperts] = useState([]);
  const [newExpertEmail, setNewExpertEmail] = useState('');
  const [newExpertName, setNewExpertName] = useState(''); 
  const [currentApp, setCurrentApp] = useState('none');
  const [customKey, setCustomKey] = useState(localStorage.getItem("custom_gemini_key") || "");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        if (u.uid === OWNER_UID) setRole('owner');
        else {
          const q = query(collection(db, 'artifacts', APP_ID, 'public', 'data', 'authorized_experts'), where('email', '==', u.email));
          const s = await getDocs(q);
          if (!s.empty) {
            setRole('expert');
            s.docs.forEach(async (docSnapshot) => {
              if (docSnapshot.data().uid !== u.uid) {
                await updateDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'authorized_experts', docSnapshot.id), {
                  uid: u.uid,
                  lastLogin: new Date().toISOString()
                }).catch(console.error);
              }
            });
          } else setRole('guest');
        }
      } else { setUser(null); setRole('guest'); }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (role !== 'owner') return;
    const q = query(collection(db, 'artifacts', APP_ID, 'public', 'data', 'authorized_experts'));
    const unsub = onSnapshot(q, (s) => setExperts(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, [role]);

  const handleSaveKey = () => {
    if (!customKey.startsWith("AIza")) {
      alert("올바른 Google API Key 형식이 아닙니다 (AIza로 시작해야 함).");
      return;
    }
    localStorage.setItem("custom_gemini_key", customKey);
    alert("API 키가 저장되었습니다. 이제 AI 기능을 다시 시도해보세요!");
  };

  const handleAddExpert = async (e) => {
    e.preventDefault();
    if(!newExpertEmail || !newExpertName) return;
    await addDoc(collection(db, 'artifacts', APP_ID, 'public', 'data', 'authorized_experts'), {
      email: newExpertEmail, displayName: newExpertName, addedAt: new Date().toISOString()
    });
    setNewExpertEmail(''); setNewExpertName('');
  };

  const handleDeleteExpert = async (id) => {
    if(window.confirm("삭제하시겠습니까?")) await deleteDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'authorized_experts', id));
  };

  if (!user || role === 'guest') return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
        <h1 className="text-3xl font-bold mb-2 text-slate-900">Career Vitamin</h1>
        <p className="text-slate-500 mb-6">전문가 전용 AI 솔루션</p>
        {user && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm flex items-center gap-2"><AlertCircle size={16}/>접근 권한이 없습니다. 관리자에게 문의하세요.</div>}
        {!user ? <button onClick={()=>signInWithPopup(auth, new GoogleAuthProvider())} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors">Google 로그인</button> 
               : <button onClick={()=>signOut(auth)} className="w-full bg-slate-200 py-3 rounded-xl font-bold hover:bg-slate-300 transition-colors">로그아웃</button>}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-700 font-bold text-xl flex items-center gap-2"><LayoutDashboard className="text-indigo-400"/> Career Vitamin</div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={()=>setActiveTab('dashboard')} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab==='dashboard'?'bg-indigo-600 text-white':'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><LayoutDashboard size={18}/> 대시보드</button>
          {role === 'owner' && <button onClick={()=>setActiveTab('admin')} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab==='admin'?'bg-indigo-600 text-white':'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Settings size={18}/> 시스템 관리</button>}
        </nav>
        <div className="p-4 border-t border-slate-700">
          <div className="text-xs text-slate-500 mb-2 px-2">{user.displayName}님 ({role === 'owner' ? '관리자' : '전문가'})</div>
          <button onClick={()=>signOut(auth)} className="w-full border border-slate-600 text-slate-400 py-2 rounded hover:bg-slate-800 hover:text-white transition-colors flex items-center justify-center gap-2"><LogOut size={16}/> 로그아웃</button>
        </div>
      </aside>
      
      <main className="flex-1 p-8 overflow-y-auto">
        {activeTab === 'dashboard' ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {Object.entries(SERVICES).map(([key, svc]) => (
               <div key={key} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md border border-slate-200 transition-all group">
                 <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${COLOR_VARIANTS[svc.color]} group-hover:scale-110 transition-transform`}>
                   <svc.icon size={24} color={svc.color === 'black' ? '#000' : undefined} /> 
                 </div>
                 <h3 className="font-bold text-lg mb-2 group-hover:text-indigo-600 transition-colors">{svc.name}</h3>
                 <p className="text-sm text-slate-500 mb-4 h-10 line-clamp-2">{svc.desc}</p>
                 <button onClick={() => {
                   if(svc.internal) setCurrentApp(key);
                   else window.open(svc.link, '_blank');
                 }} className="w-full bg-slate-50 py-2.5 rounded-lg font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2">
                   {svc.internal ? '앱 실행하기' : '외부 도구 열기'} <ExternalLink size={14}/>
                 </button>
               </div>
             ))}
           </div>
        ) : (
          <div className="space-y-8 max-w-4xl mx-auto">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-indigo-100">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-indigo-900"><Key className="text-indigo-500"/> AI API 키 설정</h2>
              <div className="bg-indigo-50 p-4 rounded-lg mb-6 text-sm text-indigo-800 leading-relaxed">
                AI 기능이 작동하지 않나요? <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline font-bold hover:text-indigo-600">Google AI Studio</a>에서 
                무료 API 키를 발급받아 아래에 입력해주세요. 입력한 키는 브라우저에만 안전하게 저장됩니다.
              </div>
              <div className="flex gap-3">
                <input type="password" value={customKey} onChange={e=>setCustomKey(e.target.value)} className="flex-1 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" placeholder="AIza로 시작하는 키를 입력하세요" />
                <button onClick={handleSaveKey} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-md">저장하기</button>
              </div>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><User className="text-slate-500"/> 전문가 관리 ({experts.length}명)</h2>
              <form onSubmit={handleAddExpert} className="flex gap-3 mb-6 bg-slate-50 p-4 rounded-lg">
                <input value={newExpertName} onChange={e=>setNewExpertName(e.target.value)} className="border p-2.5 rounded-lg w-1/3 focus:outline-none focus:border-indigo-500" placeholder="이름 (예: 홍길동)" required/>
                <input value={newExpertEmail} onChange={e=>setNewExpertEmail(e.target.value)} className="border p-2.5 rounded-lg flex-1 focus:outline-none focus:border-indigo-500" placeholder="구글 이메일 (gmail.com)" required/>
                <button className="bg-slate-800 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-slate-900 transition-colors">추가</button>
              </form>
              <div className="divide-y divide-slate-100">
                {experts.map(ex => (
                  <div key={ex.id} className="py-4 flex justify-between items-center group hover:bg-slate-50 px-2 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">{ex.displayName?.[0]}</div>
                      <div>
                        <div className="font-bold text-slate-800">{ex.displayName}</div>
                        <div className="text-xs text-slate-500">{ex.email}</div>
                      </div>
                    </div>
                    <button onClick={()=>handleDeleteExpert(ex.id)} className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all"><Trash2 size={18}/></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
      {currentApp === 'company_analysis' && <CompanyAnalysisApp onClose={()=>setCurrentApp('none')} />}
      {currentApp === 'career_roadmap' && <CareerRoadmapApp onClose={()=>setCurrentApp('none')} />}
      {currentApp === 'pt_interview' && <PtInterviewApp onClose={()=>setCurrentApp('none')} />}
      {currentApp === 'sit_interview' && <SituationInterviewApp onClose={()=>setCurrentApp('none')} />}
      {currentApp === 'self_intro' && <SelfIntroApp onClose={()=>setCurrentApp('none')} />}
      {currentApp === 'exp_structuring' && <ExperienceStructuringApp onClose={()=>setCurrentApp('none')} />}
      {currentApp === 'role_model' && <RoleModelGuideApp onClose={()=>setCurrentApp('none')} />}
      {currentApp === 'map' && <SelfDiscoveryMapApp onClose={()=>setCurrentApp('none')} />}
    </div>
  );
}