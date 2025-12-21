import React, { useState, useEffect, useRef } from 'react';

// [수정 포인트 1] 설정 파일(firebase.js)에서는 초기화된 'auth'와 'db' 객체만 가져옵니다.
import { auth, db } from './firebase';

// [수정 포인트 2] 인증 함수들은 'firebase/auth' 라이브러리에서 직접 가져옵니다. (에러 해결 핵심!)
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";

// [수정 포인트 3] DB 함수들도 'firebase/firestore' 라이브러리에서 직접 가져옵니다.
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

// [수정 포인트 4] 우리가 분리해서 만든 파일들 불러오기
import { fetchGemini, saveAsPng, saveAsPdf, renderText } from './api';
import { Toast, EditableContent, Footer } from './components/SharedUI';
import JobFitScannerApp from './components/JobFitScanner';
import HollandTestApp from './components/HollandTest';
import CompanyAnalysisApp from './components/CompanyAnalysis';
import InterviewPrepApp from './components/InterviewPrep';
import ExperienceStructApp from './components/ExperienceStructApp';
import PTInterviewPrepApp from './components/PTInterviewPrep';
import CareerRoadmapApp from './components/CareerRoadmapApp';
import RoleModelApp from './components/RoleModelApp';
import SelfIntroApp from './components/SelfIntroApp';
import Clinic from './components/Clinic';

// 아이콘 불러오기 (기존 코드 그대로 유지)
import { 
  LayoutDashboard, Building2, LogOut, Trash2, 
  Settings, Loader2, Check, 
  User, X, ChevronLeft, Compass, 
  MessageSquare, Sparkles, Award, Search, BookOpen, Download, TrendingUp, Target, 
  MonitorPlay, LayoutList, Split, Mic, BarChart3, 
  Globe, ThumbsUp, AlertCircle, ExternalLink,
  Info, PenTool, Lightbulb, Users, Lock, ClipboardList,
  FileSpreadsheet, FileText, Briefcase, GraduationCap, BrainCircuit, Key, Smile, Meh, Frown, Stethoscope, ArrowRight,
  UploadCloud, FileCheck, Percent
} from 'lucide-react';

// [설정 구역] -> 이 아래부터는 기존 코드가 이어지면 됩니다.
const OWNER_UID = "TN8orW7kwuTzAnFWNM8jCiixt3r2"; 
const APP_ID = 'career-vitamin';

// =============================================================================
// 여기 바로 아래에 const SERVICES = { ... 가 시작되면 됩니다.

// --- Constants ---
const SERVICES = {
  // [전용 앱]
  holland_test: { name: "[AI] 홀랜드(Holland) 검사 리포트", desc: "RIASEC 결과 분석 및 관심직무 매칭", link: null, internal: true, icon: ClipboardList, color: "pink" },
  gpt_guide: { name: "[AI] 직업탐색 가이드", desc: "관심 있는 직업/직무 완벽 분석", link: null, internal: true, icon: Compass, color: "emerald" },
  company_analysis: { name: "[AI] 기업분석 리포트", desc: "기업 핵심가치/이슈/SWOT 분석 및 전략", link: null, internal: true, icon: BarChart3, color: "indigo" },
  job_fit: { name: "[AI] 직무 적합도 진단", desc: "채용공고(JD)와 내 입사서류 매칭 분석", link: null, internal: true, icon: Percent, color: "rose" }, // NEW
  self_intro: { name: "[AI] 1분 자기소개", desc: "직무/인성 컨셉 맞춤 가이드 스크립트", link: null, internal: true, icon: Mic, color: "purple" },
  career_roadmap: { name: "[AI] 커리어 로드맵", desc: "경력목표, 실행계획 및 입사 후 포부", link: null, internal: true, icon: TrendingUp, color: "blue" }, 
  role_model: { name: "[AI] 롤모델 분석", desc: "존경하는 인물 면접 활용 팁", link: null, internal: true, icon: Award, color: "orange" },
  exp_structuring: { name: "[AI] 경험 구조화 (STAR)", desc: "경험 구조화 및 면접 스크립트", link: null, internal: true, icon: LayoutList, color: "indigo" },
  sit_interview: { name: "[AI] 상황면접 가이드", desc: "상황별 구조화된 면접 스크립트", link: null, internal: true, icon: Split, color: "teal" },
  pt_interview: { name: "[AI] PT 면접 가이드", desc: "주제 추출 및 발표 스크립트", link: null, internal: true, icon: MonitorPlay, color: "rose" },
  clinic: { 
  name: "[AI] 자기소개서 클리닉", 
  desc: "자기소개서 강평 및 수정", 
  link: "/clinic",  // 👈 [수정] null을 주소로 변경
  internal: true, 
  icon: PenTool,          // 👈 [수정] MonitorPlay -> PenTool (펜)
  color: "rose" 
}, 
  
  // [외부 도구]
  card_bot: { name: "[노트북LM] 커리어스타일 챗봇", desc: "해당 프로그램 전용 챗봇", link: "https://notebooklm.google.com/notebook/595da4c0-fcc1-4064-82c8-9901e6dd8772", internal: false, icon: MessageSquare, color: "violet" },
  rubric_clinic: { name: "[Gem] 자기소개서 코칭 클리닉", desc: "해당 워크숍 전용", link: "https://gemini.google.com/gem/1jXo4wyUvzepwmP_diVl-FQzg05EkexIg?usp=sharing", internal: false, icon: Stethoscope, color: "cyan" },
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
  pink: "bg-pink-100 text-pink-600",
};

// ... (Other Sub Apps: CareerRoadmapApp, etc. should be included here) ...


// [NEW] 직업 탐색 가이드 앱
function JobExplorerApp({ onClose }) {
  const [inputs, setInputs] = useState({ job: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const reportRef = useRef(null);

  const showToast = (msg) => setToastMsg(msg);

  const handleAIAnalysis = async () => {
    if (!inputs.job) return showToast("직업 또는 직무명을 입력해주세요.");
    setLoading(true);
    try {
      const prompt = `당신은 커리어 컨설턴트입니다. '${inputs.job}' 직업에 대한 상세 가이드 리포트를 작성해주세요.
      
      다음 JSON 형식을 반드시 따를 것 (내용은 구체적이고 전문적으로):
      {
        "overview": "직업 개요 (정의 및 하는 일)",
        "tasks": ["주요 단위 업무1", "주요 단위 업무2", "주요 단위 업무3", "주요 단위 업무4", "주요 단위 업무5"],
        "customers": "주요 고객 (내부 및 외부)",
        "stress": "주요 갈등 및 스트레스 상황",
        "holland": [
          {"code": "유형코드1", "reason": "이유"}, 
          {"code": "유형코드2", "reason": "이유"},
          {"code": "유형코드3", "reason": "이유"}
        ],
        "big5": [
          {"trait": "개방성(Openness)", "level": "높음/중간/낮음", "reason": "이유"},
          {"trait": "성실성(Conscientiousness)", "level": "높음/중간/낮음", "reason": "이유"},
          {"trait": "외향성(Extraversion)", "level": "높음/중간/낮음", "reason": "이유"},
          {"trait": "우호성(Agreeableness)", "level": "높음/중간/낮음", "reason": "이유"},
          {"trait": "신경성(Neuroticism)", "level": "높음/중간/낮음", "reason": "이유"}
        ],
        "values": [
          {"value": "가치1", "reason": "이유"},
          {"value": "가치2", "reason": "이유"},
          {"value": "가치3", "reason": "이유"}
        ],
        "kpis": [
          {"kpi": "지표명1", "desc": "설명"},
          {"kpi": "지표명2", "desc": "설명"},
          {"kpi": "지표명3", "desc": "설명"},
          {"kpi": "지표명4", "desc": "설명"},
          {"kpi": "지표명5", "desc": "설명"}
        ],
        "competencies": {
          "knowledge": ["지식1", "지식2", "지식3", "지식4", "지식5"],
          "skill": ["기술1", "기술2", "기술3", "기술4", "기술5"],
          "attitude": ["태도1", "태도2", "태도3", "태도4", "태도5"]
        },
        "motivation_path": "일반적인 직업 선택 동기 및 진입 경로",
        "myths": "잘못 알려진 선입관과 진실",
        "outlook": { "score": "85", "reason": "직업 전망 긍정 지수 이유" },
        "related_jobs": ["관련직업1", "관련직업2", "관련직업3", "관련직업4", "관련직업5"]
      }`;

      const parsed = await fetchGemini(prompt);
      setResult(parsed);
    } catch (e) { showToast(e.message); } finally { setLoading(false); }
  };

  const handleEdit = (section, key, value, index = null, subKey = null) => {
    setResult(prev => {
      const newData = { ...prev };
      if (Array.isArray(newData[section])) {
        if (typeof newData[section][index] === 'object') {
           newData[section][index][key] = value;
        } else {
           newData[section][index] = value;
        }
      } else if (subKey && newData[section]) {
         if(Array.isArray(newData[section][key])) {
            newData[section][key][index] = value;
         }
      } else if (newData[section] && typeof newData[section] === 'object') {
        newData[section][key] = value;
      } else {
        newData[section] = value;
      }
      return newData;
    });
  };

  const handleDownload = () => saveAsPng(reportRef, `직업탐색_${inputs.job}`, showToast);
  const handlePdfDownload = () => saveAsPdf(reportRef, `직업탐색_${inputs.job}`, showToast);

  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col font-sans text-slate-800">
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
      <header className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md shrink-0">
        <div className="flex items-center gap-3"><Compass className="text-emerald-400"/><h1 className="font-bold text-lg">직업 탐색 가이드</h1></div>
        <button onClick={onClose} className="flex items-center text-sm hover:text-emerald-200 transition-colors"><ChevronLeft className="w-5 h-5 mr-1"/> 돌아가기</button>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 bg-white border-r p-6 shrink-0">
          <div className="space-y-5">
            <h3 className="font-bold text-sm text-emerald-700 flex items-center uppercase tracking-wider"><Search size={16} className="mr-2"/> 직업 검색</h3>
            <input value={inputs.job} onChange={e=>setInputs({...inputs, job:e.target.value})} className="w-full p-3 border rounded-lg font-bold text-lg" placeholder="예: 마케터, 개발자"/>
            <button onClick={handleAIAnalysis} disabled={loading} className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold mt-4 shadow-lg disabled:bg-slate-400">{loading?<Loader2 className="animate-spin mx-auto"/>:"분석 시작"}</button>
          </div>
        </aside>
        <main className="flex-1 p-8 overflow-y-auto flex justify-center bg-slate-50">
          {result ? (
            <div ref={reportRef} className="w-[210mm] min-h-[297mm] h-fit bg-white shadow-lg p-10 flex flex-col animate-in fade-in zoom-in-95 duration-500">
              <div className="border-b-4 border-emerald-500 pb-6 mb-8">
                <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold tracking-wider mb-3 inline-block">JOB EXPLORER GUIDE</span>
                <h1 className="text-4xl font-extrabold text-slate-900">{inputs.job}</h1>
                <EditableContent className="text-lg text-slate-500 mt-2" value={result.overview} onSave={(v)=>handleEdit('overview', null, v)} />
              </div>

              <div className="space-y-8">
                {/* 1. 업무 & 고객 & 스트레스 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                      <h3 className="font-bold text-slate-800 mb-3 flex items-center"><Briefcase size={18} className="mr-2 text-emerald-600"/> 주요 업무</h3>
                      <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
                        {result.tasks?.map((task, i) => (
                          <li key={i}><EditableContent value={task} onSave={(v)=>handleEdit('tasks', null, v, i)} className="inline-block"/></li>
                        ))}
                      </ul>
                   </div>
                   <div className="space-y-4">
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                         <h4 className="font-bold text-sm text-slate-600 mb-1">주요 고객</h4>
                         <EditableContent className="text-sm text-slate-800" value={result.customers} onSave={(v)=>handleEdit('customers', null, v)} />
                      </div>
                      <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                         <h4 className="font-bold text-sm text-red-700 mb-1">갈등 및 스트레스</h4>
                         <EditableContent className="text-sm text-slate-800" value={result.stress} onSave={(v)=>handleEdit('stress', null, v)} />
                      </div>
                   </div>
                </div>

                {/* 2. 적합 특성 (Holland, Big5, Values) */}
                <section>
                  <h3 className="text-xl font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200 flex items-center"><User size={20} className="mr-2 text-emerald-600"/> 적합한 인재 특성</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Holland */}
                    <div className="bg-emerald-50 p-4 rounded-xl">
                       <h4 className="font-bold text-emerald-800 text-sm mb-3 text-center">Holland 유형</h4>
                       <div className="space-y-2">
                         {result.holland?.map((h, i) => (
                           <div key={i} className="bg-white p-2 rounded border border-emerald-100 text-sm">
                             <div className="font-bold text-emerald-600"><EditableContent value={h.code} onSave={(v)=>handleEdit('holland', 'code', v, i)} /></div>
                             <div className="text-xs text-slate-600"><EditableContent value={h.reason} onSave={(v)=>handleEdit('holland', 'reason', v, i)} /></div>
                           </div>
                         ))}
                       </div>
                    </div>
                    {/* Big 5 */}
                    <div className="bg-blue-50 p-4 rounded-xl">
                       <h4 className="font-bold text-blue-800 text-sm mb-3 text-center">Big 5 성격</h4>
                       <div className="space-y-2 text-xs">
                         {result.big5?.map((b, i) => (
                           <div key={i} className="flex justify-between items-start border-b border-blue-100 last:border-0 pb-1">
                             <span className="font-bold text-slate-700 w-20">{b.trait}</span>
                             <span className="font-bold text-blue-600 w-10">{b.level}</span>
                             <span className="flex-1 text-slate-500 text-[10px]"><EditableContent value={b.reason} onSave={(v)=>handleEdit('big5', 'reason', v, i)} /></span>
                           </div>
                         ))}
                       </div>
                    </div>
                    {/* Values */}
                    <div className="bg-orange-50 p-4 rounded-xl">
                       <h4 className="font-bold text-orange-800 text-sm mb-3 text-center">직업 가치</h4>
                       <ul className="space-y-2">
                         {result.values?.map((val, i) => (
                           <li key={i} className="text-sm bg-white p-2 rounded border border-orange-100">
                             <span className="font-bold text-orange-600 block"><EditableContent value={val.value} onSave={(v)=>handleEdit('values', 'value', v, i)} /></span>
                             <span className="text-xs text-slate-600"><EditableContent value={val.reason} onSave={(v)=>handleEdit('values', 'reason', v, i)} /></span>
                           </li>
                         ))}
                       </ul>
                    </div>
                  </div>
                </section>

                {/* 3. KPI & Competencies */}
                <section>
                   <h3 className="text-xl font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200 flex items-center"><Target size={20} className="mr-2 text-emerald-600"/> 성과 및 역량</h3>
                   <div className="mb-6">
                      <h4 className="font-bold text-sm text-slate-600 mb-2">핵심 성과지표 (KPI)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                        {result.kpis?.map((k, i) => (
                          <div key={i} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm text-center">
                            <div className="font-bold text-slate-800 text-sm mb-1"><EditableContent value={k.kpi} onSave={(v)=>handleEdit('kpis', 'kpi', v, i)} /></div>
                            <div className="text-[10px] text-slate-500 leading-tight"><EditableContent value={k.desc} onSave={(v)=>handleEdit('kpis', 'desc', v, i)} /></div>
                          </div>
                        ))}
                      </div>
                   </div>
                   <div>
                      <h4 className="font-bold text-sm text-slate-600 mb-2">필요 역량 (K/S/A)</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-slate-50 p-3 rounded-lg">
                          <div className="text-center font-bold text-slate-500 text-xs mb-2 border-b pb-1">Knowledge (지식)</div>
                          <ul className="text-xs space-y-1 list-disc list-inside">{result.competencies?.knowledge?.map((item, i)=><li key={i}><EditableContent value={item} onSave={(v)=>handleEdit('competencies', 'knowledge', v, i, true)} className="inline"/></li>)}</ul>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg">
                          <div className="text-center font-bold text-slate-500 text-xs mb-2 border-b pb-1">Skill (기술)</div>
                          <ul className="text-xs space-y-1 list-disc list-inside">{result.competencies?.skill?.map((item, i)=><li key={i}><EditableContent value={item} onSave={(v)=>handleEdit('competencies', 'skill', v, i, true)} className="inline"/></li>)}</ul>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg">
                          <div className="text-center font-bold text-slate-500 text-xs mb-2 border-b pb-1">Attitude (태도)</div>
                          <ul className="text-xs space-y-1 list-disc list-inside">{result.competencies?.attitude?.map((item, i)=><li key={i}><EditableContent value={item} onSave={(v)=>handleEdit('competencies', 'attitude', v, i, true)} className="inline"/></li>)}</ul>
                        </div>
                      </div>
                   </div>
                </section>

                {/* 4. 기타 정보 */}
                <section className="bg-slate-100 p-5 rounded-xl text-sm space-y-4">
                   <div>
                     <h4 className="font-bold text-slate-700 mb-1 flex items-center"><GraduationCap size={16} className="mr-2"/> 동기 및 경로</h4>
                     <EditableContent className="text-slate-600 leading-relaxed" value={result.motivation_path} onSave={(v)=>handleEdit('motivation_path', null, v)} />
                   </div>
                   <div className="flex gap-6">
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-700 mb-1 flex items-center"><BrainCircuit size={16} className="mr-2"/> 오해와 진실</h4>
                        <EditableContent className="text-slate-600 leading-relaxed" value={result.myths} onSave={(v)=>handleEdit('myths', null, v)} />
                      </div>
                      <div className="w-1/3 bg-white p-4 rounded-lg text-center border border-slate-200">
                        <h4 className="font-bold text-slate-400 text-xs mb-2">직업 전망 지수</h4>
                        <div className="text-4xl font-extrabold text-emerald-600 mb-1">{result.outlook?.score}<span className="text-sm text-slate-400 font-normal">/100</span></div>
                        <EditableContent className="text-xs text-slate-500" value={result.outlook?.reason} onSave={(v)=>handleEdit('outlook', 'reason', v)} />
                      </div>
                   </div>
                   <div>
                      <h4 className="font-bold text-slate-700 mb-2">전직 가능 직업</h4>
                      <div className="flex flex-wrap gap-2">
                        {result.related_jobs?.map((job, i) => (
                          <span key={i} className="bg-white px-3 py-1 rounded-full border border-slate-300 text-xs text-slate-600">
                            <EditableContent value={job} onSave={(v)=>handleEdit('related_jobs', null, v, i)} className="inline"/>
                          </span>
                        ))}
                      </div>
                   </div>
                </section>
              </div>

              <Footer />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Compass size={64} className="mb-4 opacity-20"/>
              <p>분석할 직업명을 입력하세요.</p>
            </div>
          )}
        </main>
        {result && (
          <div className="absolute bottom-8 right-8 flex gap-3 z-50">
            <button onClick={handleDownload} className="bg-slate-900 text-white px-6 py-3 rounded-full font-bold shadow-2xl hover:-translate-y-1 flex items-center transition-transform"><Download className="mr-2" size={20}/> 이미지 저장</button>
            <button onClick={handlePdfDownload} className="bg-red-600 text-white px-6 py-3 rounded-full font-bold shadow-2xl hover:-translate-y-1 flex items-center transition-transform"><FileText className="mr-2" size={20}/> PDF 저장</button>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Main App Component ---

export default function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('guest'); 
  const [activeTab, setActiveTab] = useState('dashboard');
  const [expertName, setExpertName] = useState(''); 
  const [experts, setExperts] = useState([]);
  // 전문가 등록 필드 (이름, 이메일, 기관명)
  const [newExpertEmail, setNewExpertEmail] = useState('');
  const [newExpertName, setNewExpertName] = useState(''); 
  const [newExpertOrg, setNewExpertOrg] = useState(''); // NEW: 기관명 상태 추가

  const [currentApp, setCurrentApp] = useState('none');
  const [customKey, setCustomKey] = useState(localStorage.getItem("custom_gemini_key") || "");
  const [hasPersonalKey, setHasPersonalKey] = useState(!!localStorage.getItem("custom_gemini_key")); 
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg) => setToastMsg(msg);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        if (u.uid === OWNER_UID) {
            setRole('owner');
        } else {
          const q = query(collection(db, 'artifacts', APP_ID, 'public', 'data', 'authorized_experts'), where('email', '==', u.email));
          const s = await getDocs(q);
          if (!s.empty) {
            setRole('expert');
            const expertDoc = s.docs[0];
            const expertData = expertDoc.data();
            if (expertData.displayName) setExpertName(expertData.displayName);

            s.docs.forEach(async (docSnapshot) => {
              if (docSnapshot.data().uid !== u.uid) {
                await updateDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'authorized_experts', docSnapshot.id), {
                  uid: u.uid,
                  lastLogin: new Date().toISOString()
                }).catch(console.error);
              }
            });
          } else {
            setRole('guest');
            setExpertName('');
          }
        }
      } else { 
        setUser(null); 
        setRole('guest'); 
        setExpertName('');
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (role !== 'owner') return;
    const q = query(collection(db, 'artifacts', APP_ID, 'public', 'data', 'authorized_experts'));
    const unsub = onSnapshot(q, (s) => setExperts(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, [role]);

  // 개인 키 저장
  const handleSavePersonalKey = () => {
    if (!customKey.startsWith("AIza")) {
      showToast("올바른 Google API Key 형식이 아닙니다.");
      return;
    }
    localStorage.setItem("custom_gemini_key", customKey);
    setHasPersonalKey(true);
    showToast("개인 API 키가 저장되었습니다.");
  };

  const handleRemovePersonalKey = () => {
      localStorage.removeItem("custom_gemini_key");
      setCustomKey("");
      setHasPersonalKey(false);
      showToast("개인 API 키가 삭제되었습니다.");
  }

  // 전문가 추가 (기관명 포함)
  const handleAddExpert = async (e) => {
    e.preventDefault();
    if(!newExpertEmail || !newExpertName) return;
    await addDoc(collection(db, 'artifacts', APP_ID, 'public', 'data', 'authorized_experts'), {
      email: newExpertEmail, 
      displayName: newExpertName, 
      organization: newExpertOrg, // 기관명 저장
      addedAt: new Date().toISOString()
    });
    setNewExpertEmail(''); 
    setNewExpertName('');
    setNewExpertOrg(''); // 초기화
    showToast("전문가가 추가되었습니다.");
  };

  const handleDeleteExpert = async (id) => {
    if(window.confirm("삭제하시겠습니까?")) {
      await deleteDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'authorized_experts', id));
      showToast("삭제되었습니다.");
    }
  };

  // CSV 다운로드 (구글 시트 호환)
  const handleExportCSV = () => {
    if(experts.length === 0) return showToast("내보낼 데이터가 없습니다.");

    // BOM for Excel/Sheet UTF-8 compatibility
    const BOM = "\uFEFF"; 
    const headers = ['이름,이메일,소속기관,등록일,최근접속'];
    const rows = experts.map(ex => [
      `"${ex.displayName || ''}"`,
      `"${ex.email || ''}"`,
      `"${ex.organization || '-'}"`,
      `"${ex.addedAt ? ex.addedAt.split('T')[0] : '-'}"`,
      `"${ex.lastLogin ? ex.lastLogin.split('T')[0] : '-'}"`
    ].join(','));

    const csvContent = BOM + headers.concat(rows).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `전문가목록_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("파일이 다운로드되었습니다. 구글 드라이브에 업로드하여 여세요.");
  };

  if (!user || role === 'guest') return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
      <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
        <h1 className="text-3xl font-bold mb-2 text-slate-900">CADA</h1>
        <p className="text-slate-500 mb-6">커리어 AI 대시보드 올인원</p>
        {user && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm flex items-center gap-2 justify-center"><AlertCircle size={16}/>접근 권한이 없습니다. 관리자에게 문의하세요.</div>}
        {!user ? <button onClick={()=>signInWithPopup(auth, new GoogleAuthProvider())} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors">Google 로그인</button> 
               : <button onClick={()=>signOut(auth)} className="w-full bg-slate-200 py-3 rounded-xl font-bold hover:bg-slate-300 transition-colors">로그아웃</button>}
      </div>
    </div>
  );
  
  const internalApps = Object.entries(SERVICES).filter(([_, svc]) => svc.internal);
  const externalApps = Object.entries(SERVICES).filter(([_, svc]) => !svc.internal);

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-700 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-900/50">
            <LayoutDashboard className="text-white w-6 h-6"/>
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none text-white tracking-tight">Career Vitamin</h1>
            <p className="text-[11px] text-indigo-200 font-medium mt-1 tracking-wide opacity-80">커리어 AI 대시보드 올인원</p>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={()=>setActiveTab('dashboard')} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab==='dashboard'?'bg-indigo-600 text-white':'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><LayoutDashboard size={18}/> 대시보드</button>
          {role === 'owner' && <div className="px-4 py-2 text-xs text-slate-500 uppercase font-bold mt-4">Admin Only</div>}
          {role === 'owner' && <button onClick={()=>setActiveTab('admin')} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab==='admin'?'bg-indigo-600 text-white':'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Settings size={18}/> 시스템 관리</button>}
        </nav>
        <div className="p-4 border-t border-slate-700">
          <div className="text-xs text-slate-500 mb-2 px-2">
            {role === 'expert' && expertName ? expertName : user.displayName}님 
            ({role === 'owner' ? '관리자' : '전문가'})
          </div>
          <button onClick={()=>signOut(auth)} className="w-full border border-slate-600 text-slate-400 py-2 rounded hover:bg-slate-800 hover:text-white transition-colors flex items-center justify-center gap-2"><LogOut size={16}/> 로그아웃</button>
          <div className="mt-4 text-xs text-center text-slate-600 opacity-50">v9.5 (Stable 2.5)</div>
        </div>
      </aside>
      
      <main className="flex-1 p-8 overflow-y-auto">
        {activeTab === 'dashboard' ? (
           <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
             <div className={`bg-white p-6 rounded-xl shadow-sm border-2 transition-all ${!hasPersonalKey ? 'border-red-400 ring-4 ring-red-50' : 'border-indigo-100'}`}>
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className={`text-lg font-bold flex items-center gap-2 ${!hasPersonalKey ? 'text-red-600' : 'text-indigo-900'}`}>
                            <Key className={!hasPersonalKey ? 'text-red-500' : 'text-indigo-500'} size={20}/> 
                            AI 모델 설정 (API Key)
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            서비스 이용을 위해 본인의 Google AI 키가 반드시 필요합니다.
                        </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${hasPersonalKey ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700 animate-pulse'}`}>
                        {hasPersonalKey ? <Check size={12}/> : <Lock size={12}/>}
                        {hasPersonalKey ? "등록 완료" : "등록 필수"}
                    </div>
                </div>

                <div className="bg-slate-50 p-5 rounded-lg mb-6 text-sm text-slate-700 leading-relaxed border border-slate-200">
                    <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                        <Lightbulb size={16} className="text-yellow-500"/> 왜 내 키를 등록해야 하나요?
                    </h4>
                    <ul className="list-disc list-inside space-y-1 ml-1 text-slate-600 mb-3">
                        <li><strong>무료 & 무제한:</strong> Google Gemini API는 개인 계정에 대해 충분한 무료 사용량을 제공합니다.</li>
                        <li><strong>안정성:</strong> 나만의 키를 사용하므로 다른 사용자의 영향 없이 빠르고 안정적입니다.</li>
                        <li><strong>보안:</strong> 키는 서버에 저장되지 않고, 오직 <strong>현재 브라우저에만 저장</strong>되어 안전합니다.</li>
                    </ul>
                    <a 
                        href="https://aistudio.google.com/app/apikey" 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-md text-sm"
                    >
                        🔑 Google AI Studio에서 무료 키 발급받기 <ExternalLink size={14}/>
                    </a>
                </div>

                <div className="flex gap-2">
                  <input 
                    type="password" 
                    value={customKey} 
                    onChange={e=>setCustomKey(e.target.value)} 
                    className={`flex-1 p-3 border rounded-lg focus:ring-2 outline-none transition-all ${hasPersonalKey ? 'border-green-300 bg-green-50 text-green-800' : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500'}`}
                    placeholder={hasPersonalKey ? "API 키가 안전하게 등록되어 있습니다." : "AIza로 시작하는 키를 여기에 붙여넣으세요"} 
                    disabled={hasPersonalKey}
                  />
                  {!hasPersonalKey ? (
                    <button onClick={handleSavePersonalKey} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-md shrink-0">등록하기</button>
                  ) : (
                    <button onClick={handleRemovePersonalKey} className="bg-red-100 text-red-600 border border-red-200 px-6 py-3 rounded-lg font-bold hover:bg-red-200 transition-colors shrink-0">재설정</button>
                  )}
                </div>
             </div>

             <div className={`transition-all duration-500 ${!hasPersonalKey ? 'opacity-40 pointer-events-none grayscale' : ''}`}>
               <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                 <Sparkles className="text-indigo-600" size={20}/> 커리어 비타민 전용 AI 앱
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {internalApps.map(([key, svc]) => (
                   <div key={key} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md border border-slate-200 transition-all group cursor-pointer h-full relative" onClick={() => {
                       if(!hasPersonalKey) return;
                       setCurrentApp(key);
                     }}>
                     {!hasPersonalKey && <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/10"><Lock className="text-slate-500 w-8 h-8"/></div>}
                     <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${COLOR_VARIANTS[svc.color]} group-hover:scale-110 transition-transform`}>
                       <svc.icon size={24} color={svc.color === 'black' ? '#000' : undefined} /> 
                     </div>
                     <h3 className="font-bold text-lg mb-2 group-hover:text-indigo-600 transition-colors">{svc.name}</h3>
                     <p className="text-sm text-slate-500 mb-4 h-10 line-clamp-2">{svc.desc}</p>
                     <div className="text-xs font-bold text-indigo-500 flex items-center">
                       앱 실행하기 <ChevronLeft className="rotate-180 ml-1 w-4 h-4"/>
                     </div>
                   </div>
                 ))}
               </div>
             </div>

             {hasPersonalKey && <div className="border-t border-slate-200 my-2"></div>}

                          
             {!hasPersonalKey && <div className="text-center text-slate-500 text-sm mt-4 animate-bounce">👆 먼저 위에서 API 키를 등록해주세요.</div>}
           </div>
        ) : (
          /* 관리자 전용 탭 */
          <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2"><User className="text-slate-500"/> 전문가 관리 ({experts.length}명)</h2>
                <button onClick={handleExportCSV} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 transition-colors shadow-sm">
                  <FileSpreadsheet size={16}/> 엑셀/시트 다운로드 (CSV)
                </button>
              </div>
              
              <form onSubmit={handleAddExpert} className="flex flex-wrap md:flex-nowrap gap-3 mb-6 bg-slate-50 p-4 rounded-lg">
                <input value={newExpertName} onChange={e=>setNewExpertName(e.target.value)} className="border p-2.5 rounded-lg w-full md:w-1/4 focus:outline-none focus:border-indigo-500" placeholder="이름 (예: 홍길동)" required/>
                <input value={newExpertEmail} onChange={e=>setNewExpertEmail(e.target.value)} className="border p-2.5 rounded-lg w-full md:w-1/3 focus:outline-none focus:border-indigo-500" placeholder="구글 이메일 (gmail.com)" required/>
                <input value={newExpertOrg} onChange={e=>setNewExpertOrg(e.target.value)} className="border p-2.5 rounded-lg w-full md:w-1/3 focus:outline-none focus:border-indigo-500" placeholder="소속 기관 (예: XX대학교)" />
                <button className="bg-slate-800 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-slate-900 transition-colors w-full md:w-auto">추가</button>
              </form>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3">이름</th>
                      <th className="px-4 py-3">이메일</th>
                      <th className="px-4 py-3">소속 기관</th>
                      <th className="px-4 py-3">등록일</th>
                      <th className="px-4 py-3 text-right">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {experts.map(ex => (
                      <tr key={ex.id} className="hover:bg-slate-50 group transition-colors">
                        <td className="px-4 py-4 font-bold text-slate-800 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">{ex.displayName?.[0]}</div>
                          {ex.displayName}
                        </td>
                        <td className="px-4 py-4 text-slate-500">{ex.email}</td>
                        <td className="px-4 py-4">
                          {ex.organization ? (
                            <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-medium">{ex.organization}</span>
                          ) : <span className="text-slate-300">-</span>}
                        </td>
                        <td className="px-4 py-4 text-slate-400 text-xs">{ex.addedAt ? ex.addedAt.split('T')[0] : '-'}</td>
                        <td className="px-4 py-4 text-right">
                          <button onClick={()=>handleDeleteExpert(ex.id)} className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all"><Trash2 size={16}/></button>
                        </td>
                      </tr>
                    ))}
                    {experts.length === 0 && <tr><td colSpan="5" className="text-center py-8 text-slate-400">등록된 전문가가 없습니다.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
      {currentApp === 'company_analysis' && <CompanyAnalysisApp onClose={()=>setCurrentApp('none')} />}
      {currentApp === 'career_roadmap' && <CareerRoadmapApp onClose={()=>setCurrentApp('none')} />}
      {currentApp === 'job_fit' && <JobFitScannerApp onClose={()=>setCurrentApp('none')} />}
      {currentApp === 'pt_interview' && <PTInterviewPrepApp onClose={()=>setCurrentApp('none')} />}
      {currentApp === 'sit_interview' && <InterviewPrepApp onClose={()=>setCurrentApp('none')} />}
      {currentApp === 'self_intro' && <SelfIntroApp onClose={()=>setCurrentApp('none')} />}
      {currentApp === 'exp_structuring' && <ExperienceStructApp onClose={()=>setCurrentApp('none')} />}
      {currentApp === 'role_model' && <RoleModelApp onClose={()=>setCurrentApp('none')} />}
      {currentApp === 'gpt_guide' && <JobExplorerApp onClose={()=>setCurrentApp('none')} />}
      {currentApp === 'holland_test' && <HollandTestApp onClose={()=>setCurrentApp('none')} />}
      {currentApp === 'clinic' && <Clinic onClose={()=>setCurrentApp('none')} />}
    </div>
  );
} 