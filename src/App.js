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
import { 
  LayoutDashboard, Map, Building2, LogOut, Plus, Trash2, 
  Settings, Loader2, RefreshCw, Check, 
  User, Hash, Star, X, ChevronLeft, Compass, 
  MessageSquare, Sparkles, Award, Search, BookOpen, Quote, Download, TrendingUp, Calendar, Target, 
  Edit3, MonitorPlay, Zap, LayoutList, Split, Mic, BarChart3, Link as LinkIcon, 
  Globe, Trophy, Stethoscope, Key, AlertCircle, ExternalLink
} from 'lucide-react';

import html2canvas from "html2canvas";

// =============================================================================
// [설정 구역]
// =============================================================================

const DEFAULT_API_KEY = ""; 

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

// [수정] 텍스트 렌더링 헬퍼 (Editable TextArea 값 처리를 위해 단순화)
const renderText = (content) => {
  if (!content) return '';
  if (Array.isArray(content)) return content.join('\n'); // 줄바꿈으로 연결
  if (typeof content === 'object') return JSON.stringify(content, null, 2);
  return content;
};

// [수정] PNG 저장 함수 (전체 스크롤 영역 캡처 보장)
const saveAsPng = async (elementRef, fileName) => {
  if (!elementRef.current) return;
  
  try {
    // 캡처 전 스타일 강제 조정 (잘림 방지)
    const originalStyle = elementRef.current.style.cssText;
    elementRef.current.style.height = 'auto';
    elementRef.current.style.overflow = 'visible';

    const canvas = await html2canvas(elementRef.current, {
      scale: 2, // 고해상도
      useCORS: true, 
      logging: false,
      backgroundColor: '#ffffff',
      scrollY: -window.scrollY, // 스크롤 위치 보정
      windowWidth: document.documentElement.offsetWidth,
      windowHeight: document.documentElement.offsetHeight
    });
    
    // 스타일 복구
    elementRef.current.style.cssText = originalStyle;
    
    const link = document.createElement('a');
    link.download = `${fileName}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (error) {
    console.error("이미지 저장 실패:", error);
    alert("이미지 저장 중 오류가 발생했습니다.");
  }
};

const fetchGemini = async (prompt) => {
  const apiKey = localStorage.getItem("custom_gemini_key");
  if (!apiKey) {
    throw new Error("API 키가 없습니다. [시스템 관리]에서 키를 등록해주세요.");
  }
  
  const models = ["gemini-2.5-flash-lite", "gemini-2.5-pro", "gemini-1.5-flash"];
  let lastError = null;

  for (const model of models) {
    try {
      console.log(`AI 호출 시도: ${model}`);
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
        throw new Error(errData.error?.message || `HTTP Error ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      return safeJsonParse(text);
      
    } catch (e) {
      console.warn(`${model} 실패:`, e);
      lastError = e;
      if (e.message.includes("API key")) throw e; 
    }
  }
  throw lastError || new Error("모든 AI 모델이 응답하지 않습니다.");
};

const CATEGORIES = [{ id: 'ai_tools', title: 'AI 코칭 어시스턴트', icon: Sparkles }];
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

// --- Sub Components (Apps with Editable Features) ---

// 1. 기업분석 앱 (수정 가능)
function CompanyAnalysisApp({ onClose }) {
  const [inputs, setInputs] = useState({ company: '', url: '', job: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const reportRef = useRef(null);
  
  const handleAIAnalysis = async () => {
    if (!inputs.company || !inputs.job) return alert("기업명과 직무를 입력해주세요.");
    setLoading(true);
    try {
      const prompt = `당신은 전문 커리어 코치입니다. 기업명: ${inputs.company}, 직무: ${inputs.job}. 심층 기업 분석 리포트 작성. JSON 포맷: { "overview": { "vision": "...", "values": "..." }, "business": { "history": "...", "biz_area": "...", "issues": ["...", "..."] }, "market": { "trends": "...", "swot": { "s": "...", "w": "...", "o": "...", "t": "..." } }, "competitor": "...", "strategy": "..." }`;
      const parsed = await fetchGemini(prompt);
      if (parsed) setResult(parsed);
    } catch (e) { alert(e.message); } finally { setLoading(false); }
  };
  
  // 수정 핸들러
  const handleEdit = (section, key, value) => {
    setResult(prev => {
      const newData = { ...prev };
      if (section) newData[section][key] = value;
      else newData[key] = value; // Root level key
      return newData;
    });
  };

  // Issues 배열 수정 핸들러
  const handleIssueEdit = (index, value) => {
    setResult(prev => {
      const newIssues = [...prev.business.issues];
      newIssues[index] = value;
      return { ...prev, business: { ...prev.business, issues: newIssues } };
    });
  };

  const handleDownload = () => saveAsPng(reportRef, `기업분석_${inputs.company}`);
  
  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col font-sans text-slate-800">
      <header className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md shrink-0">
        <div className="flex items-center gap-3"><BarChart3 className="text-indigo-400" /><h1 className="font-bold text-lg">기업분석 리포트</h1></div>
        <button onClick={onClose} className="flex items-center text-sm hover:text-indigo-200 transition-colors"><ChevronLeft className="w-5 h-5 mr-1"/> 돌아가기</button>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 bg-white border-r p-6 overflow-y-auto shrink-0">
          <div className="space-y-5">
            <h3 className="font-bold text-sm text-indigo-700 flex items-center uppercase tracking-wider"><Settings size={16} className="mr-2"/> 분석 설정</h3>
            <input value={inputs.company} onChange={e=>setInputs({...inputs, company:e.target.value})} className="w-full p-3 border rounded-lg" placeholder="기업명" />
            <input value={inputs.url} onChange={e=>setInputs({...inputs, url:e.target.value})} className="w-full p-3 border rounded-lg" placeholder="홈페이지 URL" />
            <input value={inputs.job} onChange={e=>setInputs({...inputs, job:e.target.value})} className="w-full p-3 border rounded-lg" placeholder="지원 직무" />
            <button onClick={handleAIAnalysis} disabled={loading} className="w-full bg-indigo-600 text-white py-3.5 rounded-xl hover:bg-indigo-700 font-bold mt-4 shadow-lg disabled:bg-slate-400">{loading ? <Loader2 className="animate-spin mx-auto"/> : "AI 분석 실행"}</button>
          </div>
        </aside>
        <main className="flex-1 p-8 overflow-y-auto bg-slate-50 flex justify-center">
          {result ? (
            <div ref={reportRef} className="w-[210mm] min-h-[297mm] bg-white shadow-2xl p-12 flex flex-col animate-in fade-in zoom-in-95 duration-500">
              <div className="border-b-4 border-indigo-600 pb-6 mb-8">
                 <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold tracking-wider mb-3 inline-block">COMPANY REPORT</span>
                 <h1 className="text-4xl font-extrabold text-slate-900 mt-2">{inputs.company}</h1>
                 <p className="text-lg text-slate-500 mt-2">기업분석 리포트 ({new Date().toLocaleDateString()})</p>
              </div>
              <div className="space-y-10 flex-1">
                <section>
                  <h3 className="text-xl font-bold text-indigo-900 mb-4 flex items-center"><Star size={24} className="mr-2"/> 1. 기업 개요</h3>
                  <div className="grid grid-cols-2 gap-6">
                     <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                       <h4 className="font-bold text-xs text-slate-400 mb-2 tracking-wider">VISION</h4>
                       <textarea className="w-full bg-transparent border-none resize-none focus:ring-0 text-sm text-slate-700" rows={3} value={renderText(result.overview?.vision)} onChange={(e)=>handleEdit('overview', 'vision', e.target.value)} />
                     </div>
                     <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                       <h4 className="font-bold text-xs text-slate-400 mb-2 tracking-wider">VALUES</h4>
                       <textarea className="w-full bg-transparent border-none resize-none focus:ring-0 text-sm text-slate-700" rows={3} value={renderText(result.overview?.values)} onChange={(e)=>handleEdit('overview', 'values', e.target.value)} />
                     </div>
                  </div>
                </section>
                <section>
                  <h3 className="text-xl font-bold text-indigo-900 mb-4 flex items-center"><Building2 size={24} className="mr-2"/> 2. 사업 현황</h3>
                  <textarea className="w-full text-slate-700 mb-4 bg-white border p-5 rounded-2xl text-sm resize-none focus:ring-indigo-500" rows={4} value={renderText(result.business?.history)} onChange={(e)=>handleEdit('business', 'history', e.target.value)} />
                  <div className="space-y-3">
                    {result.business?.issues?.map((iss, idx) => (
                      <div key={idx} className="text-sm bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex items-start">
                        <span className="bg-white text-indigo-600 px-2 py-0.5 rounded text-xs font-bold mr-3 border border-indigo-200 shrink-0 mt-0.5">ISSUE {idx+1}</span>
                        <textarea className="w-full bg-transparent border-none resize-none focus:ring-0 text-slate-700" rows={2} value={renderText(iss)} onChange={(e)=>handleIssueEdit(idx, e.target.value)} />
                      </div>
                    ))}
                  </div>
                </section>
                <section>
                  <h3 className="text-xl font-bold text-indigo-900 mb-4 flex items-center"><Globe size={24} className="mr-2"/> 3. SWOT</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {['s', 'w', 'o', 't'].map((key) => (
                      <div key={key} className={`p-5 rounded-2xl border ${key==='s'?'bg-blue-50 border-blue-100':key==='w'?'bg-orange-50 border-orange-100':key==='o'?'bg-emerald-50 border-emerald-100':'bg-red-50 border-red-100'}`}>
                        <span className={`font-bold text-lg block mb-2 uppercase ${key==='s'?'text-blue-700':key==='w'?'text-orange-700':key==='o'?'text-emerald-700':'text-red-700'}`}>{key === 's' ? 'Strength' : key === 'w' ? 'Weakness' : key === 'o' ? 'Opportunity' : 'Threat'}</span>
                        <textarea className="w-full bg-transparent border-none resize-none focus:ring-0 text-slate-700" rows={4} value={renderText(result.market?.swot?.[key])} onChange={(e)=>{
                          const newSwot = { ...result.market.swot, [key]: e.target.value };
                          handleEdit('market', 'swot', newSwot);
                        }} />
                      </div>
                    ))}
                  </div>
                </section>
                <section>
                   <h3 className="text-xl font-bold text-indigo-900 mb-4 flex items-center"><Target size={24} className="mr-2"/> 4. 전략</h3>
                   <div className="bg-indigo-600 p-8 rounded-2xl shadow-xl shadow-indigo-200">
                     <textarea className="w-full bg-transparent border-none resize-none focus:ring-0 text-white font-medium leading-loose text-lg placeholder-white/50" rows={4} value={renderText(result.strategy)} onChange={(e)=>handleEdit(null, 'strategy', e.target.value)} />
                   </div>
                </section>
              </div>
              <div className="mt-12 pt-6 border-t border-slate-200 flex justify-between items-center text-xs text-slate-400 mt-auto">
                <div className="flex items-center"><BarChart3 className="w-4 h-4 mr-1 text-indigo-500" /><span>Career Vitamin</span></div>
                <span>AI-Powered Analysis Report</span>
              </div>
            </div>
          ) : <div className="flex flex-col items-center justify-center h-full text-slate-400"><BarChart3 size={64} className="mb-4 opacity-20"/><p>정보를 입력하고 분석을 시작하세요.</p></div>}
        </main>
        {result && <button onClick={handleDownload} className="absolute bottom-8 right-8 bg-slate-900 text-white px-6 py-3 rounded-full font-bold shadow-2xl hover:-translate-y-1 flex items-center z-50"><Download className="mr-2" size={20}/> 이미지 저장</button>}
      </div>
    </div>
  );
}

// 2. 커리어 로드맵 앱 (수정 가능)
function CareerRoadmapApp({ onClose }) {
  const [inputs, setInputs] = useState({ company: '', job: '', years: '5' });
  const [roadmapData, setRoadmapData] = useState(null); 
  const [loading, setLoading] = useState(false);
  const reportRef = useRef(null);
  const handleAIPlan = async () => {
    if (!inputs.company || !inputs.job) return alert("입력 필요");
    setLoading(true);
    try {
      const prompt = `커리어 로드맵 설계. 기업:${inputs.company}, 직무:${inputs.job}, 목표기간:${inputs.years}년. JSON: { "goal": "최종목표", "roadmap": [{"stage": "단계명", "action": "실천내용"}], "script": "입사후포부" }`;
      const parsed = await fetchGemini(prompt);
      setRoadmapData(parsed);
    } catch (e) { alert(e.message); } finally { setLoading(false); }
  };
  
  const handleEdit = (key, value) => setRoadmapData(prev => ({ ...prev, [key]: value }));
  const handleRoadmapEdit = (index, key, value) => {
    setRoadmapData(prev => {
      const newMap = [...prev.roadmap];
      newMap[index] = { ...newMap[index], [key]: value };
      return { ...prev, roadmap: newMap };
    });
  };

  const handleDownload = () => saveAsPng(reportRef, `커리어로드맵_${inputs.company}`);
  
  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col font-sans text-slate-800">
      <header className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md shrink-0">
        <div className="flex items-center gap-3"><TrendingUp className="text-blue-400"/><h1 className="font-bold text-lg">커리어 로드맵</h1></div>
        <button onClick={onClose} className="flex items-center text-sm hover:text-blue-200 transition-colors"><ChevronLeft className="w-5 h-5 mr-1"/> 돌아가기</button>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 bg-white border-r p-6 shrink-0">
          <div className="space-y-5">
            <h3 className="font-bold text-sm text-blue-700 flex items-center uppercase tracking-wider"><Settings size={16} className="mr-2"/> 설정</h3>
            <input value={inputs.company} onChange={e=>setInputs({...inputs, company:e.target.value})} className="w-full p-3 border rounded-lg" placeholder="목표 기업명"/>
            <input value={inputs.job} onChange={e=>setInputs({...inputs, job:e.target.value})} className="w-full p-3 border rounded-lg" placeholder="희망 직무"/>
            <div className="flex gap-2">
              {['3', '5', '10'].map(y => (
                <button key={y} onClick={()=>setInputs({...inputs, years:y})} className={`flex-1 py-3 border rounded-lg ${inputs.years===y ? 'bg-blue-600 text-white font-bold' : 'bg-white'}`}>{y}년</button>
              ))}
            </div>
            <button onClick={handleAIPlan} disabled={loading} className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold mt-4 shadow-lg disabled:bg-slate-400">{loading ? <Loader2 className="animate-spin mx-auto"/> : "로드맵 생성"}</button>
          </div>
        </aside>
        <main className="flex-1 p-8 overflow-y-auto flex justify-center bg-slate-50">
          {roadmapData ? (
            <div ref={reportRef} className="w-[210mm] min-h-[297mm] bg-white shadow-2xl p-12 flex flex-col animate-in fade-in zoom-in-95 duration-500">
              <div className="border-b-4 border-blue-600 pb-6 mb-10">
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold tracking-wider mb-3 inline-block">CAREER ROADMAP</span>
                <h1 className="text-4xl font-extrabold text-slate-900">{inputs.company}</h1>
                <textarea className="w-full text-blue-600 font-bold text-xl mt-3 bg-transparent border-none resize-none focus:ring-0" value={roadmapData.goal} onChange={(e)=>handleEdit('goal', e.target.value)} />
              </div>
              <div className="space-y-8 flex-1 relative before:absolute before:left-[27px] before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200">
                {roadmapData.roadmap?.map((r,i)=>(
                  <div key={i} className="flex gap-6 relative">
                    <div className="w-14 h-14 rounded-full bg-white border-4 border-blue-100 flex items-center justify-center font-bold text-blue-600 shadow-sm z-10 shrink-0 text-xl">{i+1}</div>
                    <div className="flex-1 p-6 border border-slate-200 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow">
                      <input className="font-bold text-blue-800 mb-2 text-lg w-full border-none focus:ring-0" value={r.stage} onChange={(e)=>handleRoadmapEdit(i, 'stage', e.target.value)} />
                      <textarea className="text-slate-600 leading-relaxed w-full border-none resize-none focus:ring-0 bg-transparent" rows={3} value={r.action} onChange={(e)=>handleRoadmapEdit(i, 'action', e.target.value)} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-12 bg-slate-900 p-8 rounded-2xl text-white shadow-xl">
                <h3 className="font-bold text-blue-300 mb-4 flex items-center text-lg"><MessageSquare className="mr-2"/> 입사 후 포부</h3>
                <textarea className="w-full bg-transparent border-none resize-none focus:ring-0 text-slate-300 leading-loose text-lg font-light" rows={5} value={roadmapData.script} onChange={(e)=>handleEdit('script', e.target.value)} />
              </div>
              <div className="mt-12 pt-6 border-t border-slate-200 flex justify-between items-center text-xs text-slate-400 mt-auto">
                <div className="flex items-center"><TrendingUp className="w-4 h-4 mr-1 text-blue-500" /><span>Career Vitamin</span></div>
                <span>AI-Generated Career Roadmap</span>
              </div>
            </div>
          ) : <div className="flex flex-col items-center justify-center h-full text-slate-400"><TrendingUp size={64} className="mb-4 opacity-20"/><p>커리어 목표를 입력하세요.</p></div>}
        </main>
        {roadmapData && <button onClick={handleDownload} className="absolute bottom-8 right-8 bg-slate-900 text-white px-6 py-3 rounded-full font-bold shadow-2xl hover:-translate-y-1 flex items-center z-50"><Download className="mr-2" size={20}/> 이미지 저장</button>}
      </div>
    </div>
  );
}

// 3. PT 면접 앱 (수정 가능)
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
      const prompt = `기업:${inputs.company}, 직무:${inputs.job}, 요구사항:${inputs.request}. PT 면접 주제 5개 추천. JSON Array only: ["주제1", "주제2"...]`;
      const parsed = await fetchGemini(prompt);
      if(parsed) { setTopics(parsed); setStep('list'); }
    } catch (e) { alert(e.message); } finally { setLoading(false); }
  };
  
  const handleGenerateScript = async (topic) => {
    setLoading(true);
    setSelectedTopic(topic);
    try {
      const prompt = `PT주제: "${topic}", 기업:${inputs.company}. 발표 대본(서론/본론/결론). JSON: {"intro": "...", "body": "...", "conclusion": "..."}`;
      const parsed = await fetchGemini(prompt);
      if(parsed) { setScript(parsed); setStep('detail'); }
    } catch(e){ alert(e.message); } finally { setLoading(false); }
  };
  
  const handleEditScript = (key, value) => setScript(prev => ({ ...prev, [key]: value }));
  const handleDownload = () => saveAsPng(reportRef, `PT면접_${inputs.company}`);

  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col font-sans text-slate-800">
      <header className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md shrink-0">
        <div className="flex items-center gap-3"><MonitorPlay className="text-rose-400"/><h1 className="font-bold text-lg">PT 면접 가이드</h1></div>
        <button onClick={onClose} className="flex items-center text-sm hover:text-rose-200 transition-colors"><ChevronLeft className="w-5 h-5 mr-1"/> 돌아가기</button>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 bg-white border-r p-6 overflow-y-auto shrink-0">
           {step === 'input' && <div className="space-y-5">
             <h3 className="font-bold text-sm text-rose-700 flex items-center uppercase tracking-wider"><Settings size={16} className="mr-2"/> 기본 설정</h3>
             <input value={inputs.company} onChange={e=>setInputs({...inputs, company:e.target.value})} className="w-full p-3 border rounded-lg" placeholder="지원 기업명"/>
             <input value={inputs.job} onChange={e=>setInputs({...inputs, job:e.target.value})} className="w-full p-3 border rounded-lg" placeholder="지원 직무"/>
             <textarea value={inputs.request} onChange={e=>setInputs({...inputs, request:e.target.value})} className="w-full p-3 border rounded-lg h-24 resize-none" placeholder="추가 요구사항"/>
             <button onClick={handleGenerateTopics} disabled={loading} className="w-full bg-rose-600 text-white py-3.5 rounded-xl font-bold mt-4 shadow-lg disabled:bg-slate-400">{loading?<Loader2 className="animate-spin mx-auto"/>:"주제 추출 시작"}</button>
           </div>}
           {step === 'list' && <div className="space-y-3">
             <h3 className="font-bold text-sm text-slate-500 mb-2 flex items-center"><Check size={16} className="mr-2"/> 주제 선택</h3>
             {topics.map((t,i)=><button key={i} onClick={()=>handleGenerateScript(t)} disabled={loading} className="w-full text-left p-4 border rounded-xl hover:bg-rose-50 text-sm transition-all font-medium text-slate-700 shadow-sm active:scale-95"><span className="text-rose-500 font-bold mr-2 block text-xs mb-1">TOPIC {i+1}</span>{t}</button>)}
             <button onClick={()=>setStep('input')} className="w-full bg-slate-100 py-3 rounded-xl text-sm mt-4 font-bold text-slate-500">뒤로가기</button>
           </div>}
           {step === 'detail' && <button onClick={()=>setStep('input')} className="w-full bg-slate-200 py-3 rounded-xl font-bold text-slate-600">새로 만들기</button>}
        </aside>
        <main className="flex-1 p-8 overflow-y-auto flex justify-center bg-slate-50">
           {script ? <div ref={reportRef} className="w-[210mm] min-h-[297mm] bg-white shadow-2xl p-12 flex flex-col animate-in fade-in slide-in-from-bottom-4">
             <div className="border-b-4 border-rose-500 pb-6 mb-8">
               <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-xs font-bold tracking-wider mb-3 inline-block">PT INTERVIEW</span>
               <h1 className="text-3xl font-extrabold mt-3 text-slate-900">{selectedTopic}</h1>
             </div>
             <div className="space-y-8 flex-1">
                <section><h3 className="text-xl font-bold text-slate-800 mb-3 border-l-4 border-rose-400 pl-3">Introduction</h3>
                  <textarea className="w-full text-base text-slate-700 bg-slate-50 p-6 rounded-xl border leading-loose resize-none focus:ring-rose-500" rows={4} value={script.intro} onChange={(e)=>handleEditScript('intro', e.target.value)} />
                </section>
                <section><h3 className="text-xl font-bold text-slate-800 mb-3 border-l-4 border-rose-500 pl-3">Body</h3>
                  <textarea className="w-full text-base text-slate-700 pl-6 py-2 leading-loose border-l-2 border-slate-200 ml-2 resize-none focus:ring-0" rows={10} value={script.body} onChange={(e)=>handleEditScript('body', e.target.value)} />
                </section>
                <section><h3 className="text-xl font-bold text-slate-800 mb-3 border-l-4 border-rose-600 pl-3">Conclusion</h3>
                  <textarea className="w-full text-base text-white bg-rose-600 p-6 rounded-xl shadow-lg leading-loose font-medium resize-none focus:ring-0 placeholder-white/70" rows={4} value={script.conclusion} onChange={(e)=>handleEditScript('conclusion', e.target.value)} />
                </section>
             </div>
             <div className="mt-12 pt-6 border-t border-slate-200 flex justify-between items-center text-xs text-slate-400 mt-auto">
                <div className="flex items-center"><MonitorPlay className="w-4 h-4 mr-1 text-rose-500" /><span>Career Vitamin</span></div>
                <span>AI-Generated PT Script</span>
              </div>
           </div> : <div className="flex flex-col items-center justify-center h-full text-slate-400"><MonitorPlay size={64} className="mb-4 opacity-20"/><p>주제를 선택하면 발표 대본이 생성됩니다.</p></div>}
        </main>
        {script && <button onClick={handleDownload} className="absolute bottom-8 right-8 bg-slate-900 text-white px-6 py-3 rounded-full font-bold shadow-2xl hover:-translate-y-1 flex items-center z-50"><Download className="mr-2" size={20}/> 이미지 저장</button>}
      </div>
    </div>
  );
}

// 4. 상황면접 앱 (수정 가능)
function SituationInterviewApp({ onClose }) {
  const [inputs, setInputs] = useState({ question: '', criteria: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const reportRef = useRef(null);
  const handleAIAnalysis = async () => {
    if (!inputs.question) return alert("질문 입력 필요");
    setLoading(true);
    try {
      const prompt = `상황면접 질문: ${inputs.question}, 판단기준: ${inputs.criteria}. 답변 2가지 버전(A/B)과 조언. JSON: { "situation_a": {"title": "...", "content": "..."}, "situation_b": {"title": "...", "content": "..."}, "advice": "..." }`;
      const parsed = await fetchGemini(prompt);
      setResult(parsed);
    } catch (e) { alert(e.message); } finally { setLoading(false); }
  };
  
  const handleEdit = (key, subKey, value) => {
    setResult(prev => {
        if (subKey) return { ...prev, [key]: { ...prev[key], [subKey]: value } };
        return { ...prev, [key]: value };
    });
  };

  const handleDownload = () => saveAsPng(reportRef, `상황면접`);
  
  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col font-sans text-slate-800">
      <header className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md shrink-0">
        <div className="flex items-center gap-3"><Split className="text-teal-400"/><h1 className="font-bold text-lg">상황면접 가이드</h1></div>
        <button onClick={onClose} className="flex items-center text-sm hover:text-teal-200 transition-colors"><ChevronLeft className="w-5 h-5 mr-1"/> 돌아가기</button>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 bg-white border-r p-6 overflow-y-auto shrink-0"><div className="space-y-5">
          <h3 className="font-bold text-sm text-teal-700 flex items-center uppercase tracking-wider"><Settings size={16} className="mr-2"/> 질문 설정</h3>
          <textarea value={inputs.question} onChange={e=>setInputs({...inputs, question:e.target.value})} className="w-full p-3 border rounded-xl h-32 resize-none" placeholder="면접 질문"/>
          <input value={inputs.criteria} onChange={e=>setInputs({...inputs, criteria:e.target.value})} className="w-full p-3 border rounded-xl" placeholder="분리 기준 (옵션)"/>
          <button onClick={handleAIAnalysis} disabled={loading} className="w-full bg-teal-600 text-white py-3.5 rounded-xl font-bold mt-4 shadow-lg disabled:bg-slate-400">{loading?<Loader2 className="animate-spin mx-auto"/>:"답변 생성"}</button>
        </div></aside>
        <main className="flex-1 p-8 overflow-y-auto flex justify-center bg-slate-50">{result ? <div ref={reportRef} className="w-[210mm] min-h-[297mm] bg-white shadow-lg p-10 flex flex-col animate-in fade-in zoom-in-95 duration-500"><h2 className="text-3xl font-extrabold mb-6 text-slate-900 border-b-2 border-teal-500 pb-4">상황면접 가이드</h2><div className="flex-1 space-y-6"><div className="bg-slate-50 p-6 rounded-xl border mb-8"><h3 className="font-bold text-slate-500 text-xs mb-2 tracking-widest">QUESTION</h3><p className="font-bold text-xl text-slate-800">"{inputs.question}"</p></div><div className="grid grid-cols-1 gap-8"><div className="border-l-4 border-teal-500 pl-6 py-2"><input className="font-bold text-teal-800 text-xl mb-3 w-full border-none focus:ring-0" value={result.situation_a?.title} onChange={(e)=>handleEdit('situation_a', 'title', e.target.value)} /><textarea className="w-full text-slate-600 leading-relaxed text-lg border-none resize-none focus:ring-0" rows={4} value={result.situation_a?.content} onChange={(e)=>handleEdit('situation_a', 'content', e.target.value)} /></div><div className="border-l-4 border-slate-400 pl-6 py-2"><input className="font-bold text-slate-700 text-xl mb-3 w-full border-none focus:ring-0" value={result.situation_b?.title} onChange={(e)=>handleEdit('situation_b', 'title', e.target.value)} /><textarea className="w-full text-slate-600 leading-relaxed text-lg border-none resize-none focus:ring-0" rows={4} value={result.situation_b?.content} onChange={(e)=>handleEdit('situation_b', 'content', e.target.value)} /></div></div><div className="mt-8 bg-teal-50 p-6 rounded-xl border border-teal-100 text-teal-900 text-base font-medium">💡 Advice: <textarea className="w-full bg-transparent border-none resize-none focus:ring-0 mt-2" rows={3} value={result.advice} onChange={(e)=>handleEdit('advice', null, e.target.value)} /></div></div><div className="mt-12 pt-6 border-t border-slate-200 flex justify-between items-center text-xs text-slate-400 mt-auto"><div className="flex items-center"><Split className="w-4 h-4 mr-1 text-teal-500" /><span>Career Vitamin</span></div><span>AI-Powered Situation Guide</span></div></div> : <div className="flex flex-col items-center justify-center h-full text-slate-400"><Split size={64} className="mb-4 opacity-20"/><p>질문을 입력하면 답변이 생성됩니다.</p></div>}</main>
        {result && <button onClick={handleDownload} className="absolute bottom-8 right-8 bg-slate-900 text-white px-6 py-3 rounded-full font-bold shadow-2xl hover:-translate-y-1 flex items-center z-50"><Download className="mr-2" size={20}/> 이미지 저장</button>}
      </div>
    </div>
  );
}

// 5. 1분 자기소개 앱 (수정 가능)
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
  
  const handleEdit = (key, value) => setScript(prev => ({ ...prev, [key]: value }));
  const handleDownload = () => saveAsPng(reportRef, `자기소개_${inputs.company}`);
  
  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col font-sans text-slate-800">
      <header className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md shrink-0">
        <div className="flex items-center gap-3"><Mic className="text-purple-400"/><h1 className="font-bold text-lg">1분 자기소개</h1></div>
        <button onClick={onClose} className="flex items-center text-sm hover:text-purple-200 transition-colors"><ChevronLeft className="w-5 h-5 mr-1"/> 돌아가기</button>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 bg-white border-r p-6 shrink-0 overflow-y-auto"><div className="space-y-5">
          <h3 className="font-bold text-sm text-purple-700 flex items-center uppercase tracking-wider"><Settings size={16} className="mr-2"/> 전략 설정</h3>
          <div className="grid grid-cols-2 gap-2">
            <input value={inputs.company} onChange={e=>setInputs({...inputs, company:e.target.value})} className="p-3 border rounded-lg text-sm focus:outline-none focus:border-purple-500" placeholder="기업명"/>
            <input value={inputs.job} onChange={e=>setInputs({...inputs, job:e.target.value})} className="p-3 border rounded-lg text-sm focus:outline-none focus:border-purple-500" placeholder="직무명"/>
          </div>
          <div className="flex gap-2">
            <button onClick={()=>setInputs({...inputs, concept:'competency'})} className={`flex-1 py-3 text-xs rounded-lg transition-all ${inputs.concept==='competency'?'bg-purple-600 text-white font-bold':'bg-slate-100 text-slate-600'}`}>직무역량 강조</button>
            <button onClick={()=>setInputs({...inputs, concept:'character'})} className={`flex-1 py-3 text-xs rounded-lg transition-all ${inputs.concept==='character'?'bg-purple-600 text-white font-bold':'bg-slate-100 text-slate-600'}`}>인성/태도 강조</button>
          </div>
          <input value={inputs.keyword} onChange={e=>setInputs({...inputs, keyword:e.target.value})} className="w-full p-3 border rounded-lg font-bold" placeholder="핵심 키워드"/>
          <textarea value={inputs.exp} onChange={e=>setInputs({...inputs, exp:e.target.value})} className="w-full p-3 border rounded-lg h-32 resize-none" placeholder="관련 경험 요약"/>
          <button onClick={handleAIAnalysis} disabled={loading} className="w-full bg-purple-600 text-white py-3.5 rounded-xl font-bold mt-4 shadow-lg disabled:bg-slate-400">{loading?<Loader2 className="animate-spin mx-auto"/>:"스크립트 생성"}</button>
        </div></aside>
        <main className="flex-1 p-8 overflow-y-auto flex justify-center bg-slate-50">{script ? <div ref={reportRef} className="w-[210mm] min-h-[297mm] bg-white shadow-lg p-10 flex flex-col animate-in fade-in zoom-in-95 duration-500"><div className="border-b-4 border-purple-600 pb-6 text-center"><span className="text-purple-600 font-bold text-sm tracking-widest block mb-2">1-MINUTE SPEECH</span><input className="text-3xl font-extrabold text-slate-900 text-center w-full border-none focus:ring-0" value={script.slogan} onChange={(e)=>handleEdit('slogan', e.target.value)} /></div><div className="space-y-8 flex-1 mt-8"><div className="flex gap-6"><div className="w-20 text-right font-bold text-slate-400 text-sm pt-4 uppercase">Opening</div><div className="flex-1 bg-purple-50 p-6 rounded-2xl text-xl font-bold text-slate-800 shadow-sm"><textarea className="w-full bg-transparent border-none resize-none focus:ring-0" rows={2} value={script.opening} onChange={(e)=>handleEdit('opening', e.target.value)} /></div></div><div className="flex gap-6"><div className="w-20 text-right font-bold text-slate-400 text-sm pt-1 uppercase">Body</div><div className="flex-1 text-slate-700 leading-loose pl-6 border-l-2 border-purple-200 text-lg"><textarea className="w-full border-none resize-none focus:ring-0" rows={8} value={script.body} onChange={(e)=>handleEdit('body', e.target.value)} /></div></div><div className="flex gap-6"><div className="w-20 text-right font-bold text-slate-400 text-sm pt-4 uppercase">Closing</div><div className="flex-1 bg-slate-50 p-6 rounded-2xl font-medium text-slate-800 text-lg"><textarea className="w-full bg-transparent border-none resize-none focus:ring-0" rows={2} value={script.closing} onChange={(e)=>handleEdit('closing', e.target.value)} /></div></div></div><div className="mt-12 pt-6 border-t border-slate-200 flex justify-between items-center text-xs text-slate-400 mt-auto"><div className="flex items-center"><Mic className="w-4 h-4 mr-1 text-purple-500" /><span>Career Vitamin</span></div><span>AI-Generated Speech Script</span></div></div> : <div className="flex flex-col items-center justify-center h-full text-slate-400"><Mic size={64} className="mb-4 opacity-20"/><p>정보를 입력하면 스크립트가 생성됩니다.</p></div>}</main>
        {script && <button onClick={handleDownload} className="absolute bottom-8 right-8 bg-slate-900 text-white px-6 py-3 rounded-full font-bold shadow-2xl hover:-translate-y-1 flex items-center z-50"><Download className="mr-2" size={20}/> 이미지 저장</button>}
      </div>
    </div>
  );
}

// 6. STAR 경험 구조화 앱 (수정 가능)
function ExperienceStructuringApp({ onClose }) {
  const [inputs, setInputs] = useState({ company: '', job: '', keyword: '', desc: '' });
  const [starData, setStarData] = useState({ s: '', t: '', a: '', r: '' });
  const [loading, setLoading] = useState(false);
  const reportRef = useRef(null);
  const handleAIAnalysis = async () => {
    if (!inputs.desc) return alert("내용 입력 필요");
    setLoading(true);
    try {
      const prompt = `경험 STAR 구조화. 기업:${inputs.company}, 직무:${inputs.job}, 키워드:${inputs.keyword}, 내용:${inputs.desc}. JSON: { "s": "...", "t": "...", "a": "...", "r": "..." }`;
      const parsed = await fetchGemini(prompt);
      setStarData(parsed);
    } catch (e) { alert(e.message); } finally { setLoading(false); }
  };
  
  const handleEdit = (key, value) => setStarData(prev => ({ ...prev, [key]: value }));
  const handleDownload = () => saveAsPng(reportRef, `STAR_${inputs.keyword}`);
  
  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col font-sans text-slate-800">
      <header className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md shrink-0">
        <div className="flex items-center gap-3"><LayoutList className="text-indigo-400"/><h1 className="font-bold text-lg">STAR 워크시트</h1></div>
        <button onClick={onClose} className="flex items-center text-sm hover:text-indigo-200 transition-colors"><ChevronLeft className="w-5 h-5 mr-1"/> 돌아가기</button>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 bg-white border-r p-6 shrink-0 overflow-y-auto"><div className="space-y-5">
          <h3 className="font-bold text-sm text-indigo-700 flex items-center uppercase tracking-wider"><Sparkles size={16} className="mr-2"/> 경험 입력</h3>
          <div className="grid grid-cols-2 gap-2">
            <input value={inputs.company} onChange={e=>setInputs({...inputs, company:e.target.value})} className="p-3 border rounded-lg text-sm" placeholder="기업명"/>
            <input value={inputs.job} onChange={e=>setInputs({...inputs, job:e.target.value})} className="p-3 border rounded-lg text-sm" placeholder="직무명"/>
          </div>
          <input value={inputs.keyword} onChange={e=>setInputs({...inputs, keyword:e.target.value})} className="w-full p-3 border rounded-lg font-bold" placeholder="핵심 키워드"/>
          <textarea value={inputs.desc} onChange={e=>setInputs({...inputs, desc:e.target.value})} className="w-full p-3 border rounded-lg h-40 resize-none" placeholder="경험 내용"/>
          <button onClick={handleAIAnalysis} disabled={loading} className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold mt-4 shadow-lg disabled:bg-slate-400">{loading?<Loader2 className="animate-spin mx-auto"/>:"구조화 실행"}</button>
        </div></aside>
        <main className="flex-1 p-8 overflow-y-auto flex justify-center bg-slate-50">{starData.s ? <div ref={reportRef} className="w-[210mm] bg-white shadow-lg p-10 space-y-6 animate-in fade-in zoom-in-95 duration-500"><div className="border-b-4 border-indigo-600 pb-6 mb-6"><h1 className="text-4xl font-extrabold text-slate-900">STAR Analysis</h1><p className="text-slate-500 mt-2 text-lg">경험 구조화 워크시트</p></div><div className="space-y-6 flex-1"><div className="bg-slate-50 p-6 rounded-2xl border-l-8 border-slate-400"><h3 className="font-bold text-slate-500 mb-2 text-sm tracking-widest">SITUATION</h3><textarea className="w-full bg-transparent border-none resize-none focus:ring-0 text-slate-800 text-lg leading-relaxed" rows={3} value={starData.s} onChange={(e)=>handleEdit('s', e.target.value)} /></div><div className="bg-slate-50 p-6 rounded-2xl border-l-8 border-slate-500"><h3 className="font-bold text-slate-500 mb-2 text-sm tracking-widest">TASK</h3><textarea className="w-full bg-transparent border-none resize-none focus:ring-0 text-slate-800 text-lg leading-relaxed" rows={3} value={starData.t} onChange={(e)=>handleEdit('t', e.target.value)} /></div><div className="bg-white border-2 border-indigo-100 p-6 rounded-2xl shadow-sm"><h3 className="font-bold text-indigo-600 mb-2 text-sm tracking-widest">ACTION</h3><textarea className="w-full border-none resize-none focus:ring-0 text-slate-800 font-medium text-lg leading-relaxed" rows={5} value={starData.a} onChange={(e)=>handleEdit('a', e.target.value)} /></div><div className="bg-indigo-50 p-6 rounded-2xl border-l-8 border-indigo-600"><h3 className="font-bold text-indigo-800 mb-2 text-sm tracking-widest">RESULT</h3><textarea className="w-full bg-transparent border-none resize-none focus:ring-0 text-slate-800 font-bold text-lg leading-relaxed" rows={3} value={starData.r} onChange={(e)=>handleEdit('r', e.target.value)} /></div></div><div className="mt-12 pt-6 border-t border-slate-200 flex justify-between items-center text-xs text-slate-400 mt-auto"><div className="flex items-center"><LayoutList className="w-4 h-4 mr-1 text-indigo-500" /><span>Career Vitamin</span></div><span>AI-Powered STAR Analysis</span></div></div> : <div className="flex flex-col items-center justify-center h-full text-slate-400"><LayoutList size={64} className="mb-4 opacity-20"/><p>경험을 입력하면 STAR 기법으로 구조화합니다.</p></div>}</main>
        {starData.s && <button onClick={handleDownload} className="absolute bottom-8 right-8 bg-slate-900 text-white px-6 py-3 rounded-full font-bold shadow-2xl hover:-translate-y-1 flex items-center z-50"><Download className="mr-2" size={20}/> 이미지 저장</button>}
      </div>
    </div>
  );
}

// 7. 롤모델 분석 앱 (수정 가능)
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
  const handleEdit = (key, value) => setData(prev => ({ ...prev, [key]: value }));
  const handleDownload = () => saveAsPng(reportRef, `롤모델_${data.name}`);
  
  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col font-sans text-slate-800">
      <header className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md shrink-0">
        <div className="flex items-center gap-3"><Award className="text-orange-400"/><h1 className="font-bold text-lg">롤모델 분석</h1></div>
        <button onClick={onClose} className="flex items-center text-sm hover:text-orange-200 transition-colors"><ChevronLeft className="w-5 h-5 mr-1"/> 돌아가기</button>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 bg-white border-r p-6 shrink-0"><div className="space-y-5">
          <h3 className="font-bold text-sm text-orange-700 flex items-center uppercase tracking-wider"><Search size={16} className="mr-2"/> 인물 검색</h3>
          <input value={data.name} onChange={e=>setData({...data, name:e.target.value})} className="w-full p-3 border border-slate-300 rounded-xl font-bold text-lg focus:ring-2 focus:ring-orange-500 outline-none" placeholder="예: 스티브 잡스" onKeyDown={(e) => e.key === 'Enter' && handleAIAnalysis()}/>
          <button onClick={handleAIAnalysis} disabled={loading} className="w-full bg-orange-600 text-white py-3.5 rounded-xl font-bold mt-4 shadow-lg disabled:bg-slate-400">{loading?<Loader2 className="animate-spin mx-auto"/>:"분석 시작"}</button>
        </div></aside>
        <main className="flex-1 p-8 overflow-y-auto flex justify-center bg-slate-50">{data.role ? <div ref={reportRef} className="w-[210mm] min-h-[297mm] bg-white shadow-lg p-10 flex flex-col animate-in fade-in zoom-in-95 duration-500"><div className="border-b-4 border-orange-500 pb-6"><span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-bold">ROLE MODEL</span><h1 className="text-4xl font-extrabold mt-3">{data.name}</h1><input className="text-slate-500 text-lg mt-1 w-full border-none focus:ring-0" value={data.role} onChange={(e)=>handleEdit('role', e.target.value)} /></div><div className="flex-1 space-y-8 mt-8"><div className="flex gap-8 items-start"><div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center shrink-0"><User className="w-8 h-8 text-orange-600"/></div><textarea className="text-slate-700 leading-loose text-lg flex-1 border-none resize-none focus:ring-0" rows={4} value={data.intro} onChange={(e)=>handleEdit('intro', e.target.value)} /></div><div className="bg-orange-50 p-8 rounded-2xl italic text-orange-900 font-serif text-xl border-l-8 border-orange-400 leading-relaxed"><textarea className="w-full bg-transparent border-none resize-none focus:ring-0 text-center" rows={2} value={data.quotes} onChange={(e)=>handleEdit('quotes', e.target.value)} /></div><div className="border-t border-slate-200 pt-8"><h3 className="font-bold text-xl mb-4 flex items-center text-slate-800"><MessageSquare className="mr-2 text-orange-500"/> 면접 활용 Tip</h3><textarea className="w-full text-slate-600 leading-relaxed text-lg border-none resize-none focus:ring-0" rows={4} value={data.reason} onChange={(e)=>handleEdit('reason', e.target.value)} /></div></div><div className="mt-12 pt-6 border-t border-slate-200 flex justify-between items-center text-xs text-slate-400 mt-auto"><div className="flex items-center"><Award className="w-4 h-4 mr-1 text-orange-500" /><span>Career Vitamin</span></div><span>AI-Powered Role Model Analysis</span></div></div> : <div className="flex flex-col items-center justify-center h-full text-slate-400"><Award size={64} className="mb-4 opacity-20"/><p>롤모델 이름을 입력하세요.</p></div>}</main>
        {data.role && <button onClick={handleDownload} className="absolute bottom-8 right-8 bg-slate-900 text-white px-6 py-3 rounded-full font-bold shadow-2xl hover:-translate-y-1 flex items-center z-50"><Download className="mr-2" size={20}/> 이미지 저장</button>}
      </div>
    </div>
  );
}

// 8. 나를 찾는 지도 앱
function SelfDiscoveryMapApp({ onClose }) {
  const [profile, setProfile] = useState({ name: '', targetJob: '', date: new Date().toISOString().split('T')[0] });
  const [keywords, setKeywords] = useState([]);
  const [currentKeyword, setCurrentKeyword] = useState('');
  const [keywordType, setKeywordType] = useState('strength');
  const reportRef = useRef(null);
  const addKeyword = (e) => { if (e.key === 'Enter' && currentKeyword.trim()) { setKeywords([...keywords, { id: Date.now(), text: currentKeyword.trim(), type: keywordType }]); setCurrentKeyword(''); } };
  const removeKeyword = (id) => setKeywords(keywords.filter(k => k.id !== id));
  const handleDownload = () => saveAsPng(reportRef, `지도_${profile.name}`);
  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col font-sans text-slate-800">
      <header className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md shrink-0">
        <div className="flex items-center gap-3"><Map className="text-blue-400"/><h1 className="font-bold text-lg">나를 찾는 지도</h1></div>
        <button onClick={onClose} className="flex items-center text-sm hover:text-blue-200 transition-colors"><ChevronLeft className="w-5 h-5 mr-1"/> 돌아가기</button>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 bg-white border-r p-6 space-y-8 shrink-0 overflow-y-auto">
          <section>
            <h3 className="font-bold text-sm text-slate-500 mb-3 uppercase tracking-wider">기본 정보</h3>
            <input name="name" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className="w-full p-3 border rounded-lg mb-3 text-sm" placeholder="이름" />
            <input name="targetJob" value={profile.targetJob} onChange={e => setProfile({...profile, targetJob: e.target.value})} className="w-full p-3 border rounded-lg text-sm" placeholder="목표 직무" />
          </section>
          <section>
            <h3 className="font-bold text-sm text-slate-500 mb-3 uppercase tracking-wider">키워드 입력</h3>
            <input value={currentKeyword} onChange={e=>setCurrentKeyword(e.target.value)} onKeyDown={addKeyword} className="w-full p-3 border rounded-lg mb-3" placeholder="입력 후 Enter"/>
            <div className="flex gap-2">
              <button onClick={()=>setKeywordType('strength')} className={`flex-1 py-2 text-xs rounded-lg font-bold transition-colors ${keywordType==='strength'?'bg-blue-600 text-white':'bg-slate-100 text-slate-500'}`}>강점</button>
              <button onClick={()=>setKeywordType('value')} className={`flex-1 py-2 text-xs rounded-lg font-bold transition-colors ${keywordType==='value'?'bg-emerald-600 text-white':'bg-slate-100 text-slate-500'}`}>가치</button>
            </div>
          </section>
        </aside>
        <main className="flex-1 p-8 overflow-y-auto flex justify-center bg-slate-50">
          <div ref={reportRef} className="w-[210mm] bg-white shadow-lg p-10 h-min min-h-[297mm] relative flex flex-col">
             <div className="border-b-2 border-slate-800 pb-4 mb-10 flex justify-between items-end"><div><h1 className="text-4xl font-extrabold text-slate-900">Self-Discovery Map</h1><p className="text-slate-500 mt-1">Career Vitamin Analysis</p></div><div className="text-right"><div className="text-2xl font-bold text-blue-600">{profile.name}</div><div className="text-sm text-slate-500">{profile.targetJob}</div><div className="text-xs text-slate-400 mt-1">{profile.date}</div></div></div>
             <div className="mb-12 flex-1">
               <h3 className="font-bold text-lg border-l-4 border-blue-600 pl-3 mb-6 text-slate-800">Core Keywords</h3>
               <div className="flex flex-wrap gap-3 min-h-[100px] content-start">{keywords.length > 0 ? keywords.map(k=><span key={k.id} className={`px-4 py-2 rounded-xl font-bold text-sm border cursor-pointer hover:opacity-70 flex items-center shadow-sm ${k.type==='strength'?'bg-blue-50 border-blue-200 text-blue-700':'bg-emerald-50 border-emerald-200 text-emerald-700'}`} onClick={()=>removeKeyword(k.id)}>{k.text}<X size={14} className="ml-2 opacity-50"/></span>) : <span className="text-slate-400 italic">키워드를 입력해주세요.</span>}</div>
             </div>
             <div className="mt-auto pt-6 border-t border-slate-200 flex justify-between items-center text-xs text-slate-400"><span>Powered by Career Vitamin</span><span>Confidential Report</span></div>
          </div>
        </main>
        <button onClick={handleDownload} className="absolute bottom-8 right-8 bg-slate-900 text-white px-6 py-3 rounded-full font-bold shadow-2xl hover:-translate-y-1 flex items-center z-50"><Download className="mr-2" size={20}/> 이미지 저장</button>
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
        {user && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm flex items-center gap-2 justify-center"><AlertCircle size={16}/>접근 권한이 없습니다. 관리자에게 문의하세요.</div>}
        {!user ? <button onClick={()=>signInWithPopup(auth, new GoogleAuthProvider())} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors">Google 로그인</button> 
               : <button onClick={()=>signOut(auth)} className="w-full bg-slate-200 py-3 rounded-xl font-bold hover:bg-slate-300 transition-colors">로그아웃</button>}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-700 font-bold text-xl flex items-center gap-2"><LayoutDashboard className="text-indigo-400"/> Career Vitamin</div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={()=>setActiveTab('dashboard')} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab==='dashboard'?'bg-indigo-600 text-white':'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><LayoutDashboard size={18}/> 대시보드</button>
          {role === 'owner' && <button onClick={()=>setActiveTab('admin')} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab==='admin'?'bg-indigo-600 text-white':'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Settings size={18}/> 시스템 관리</button>}
        </nav>
        <div className="p-4 border-t border-slate-700">
          <div className="text-xs text-slate-500 mb-2 px-2">{user.displayName}님 ({role === 'owner' ? '관리자' : '전문가'})</div>
          <button onClick={()=>signOut(auth)} className="w-full border border-slate-600 text-slate-400 py-2 rounded hover:bg-slate-800 hover:text-white transition-colors flex items-center justify-center gap-2"><LogOut size={16}/> 로그아웃</button>
          <div className="mt-4 text-xs text-center text-slate-600 opacity-50">v7.0 (Full Fix)</div>
        </div>
      </aside>
      
      <main className="flex-1 p-8 overflow-y-auto">
        {activeTab === 'dashboard' ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {Object.entries(SERVICES).map(([key, svc]) => (
               <div key={key} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md border border-slate-200 transition-all group cursor-pointer" onClick={() => {
                   if(svc.internal) setCurrentApp(key);
                   else window.open(svc.link, '_blank');
                 }}>
                 <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${COLOR_VARIANTS[svc.color]} group-hover:scale-110 transition-transform`}>
                   <svc.icon size={24} color={svc.color === 'black' ? '#000' : undefined} /> 
                 </div>
                 <h3 className="font-bold text-lg mb-2 group-hover:text-indigo-600 transition-colors">{svc.name}</h3>
                 <p className="text-sm text-slate-500 mb-4 h-10 line-clamp-2">{svc.desc}</p>
                 <div className="text-xs font-bold text-indigo-500 flex items-center">
                   {svc.internal ? '앱 실행하기' : '외부 도구 열기'} {svc.internal ? <ChevronLeft className="rotate-180 ml-1 w-4 h-4"/> : <ExternalLink className="ml-1 w-3 h-3"/>}
                 </div>
               </div>
             ))}
           </div>
        ) : (
          <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-indigo-100">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-indigo-900"><Key className="text-indigo-500"/> AI API 키 설정</h2>
              <div className="bg-indigo-50 p-4 rounded-lg mb-6 text-sm text-indigo-800 leading-relaxed">
                AI 기능이 작동하지 않나요? <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline font-bold hover:text-indigo-600">Google AI Studio</a>에서 
                무료 API 키를 발급받아 아래에 입력해주세요. (입력한 키는 브라우저에만 저장됩니다)
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