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

// =============================================================================
// [설정 구역]
// =============================================================================

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

const Toast = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 z-[100] animate-in slide-in-from-bottom-5 fade-in">
      <Info size={20} className="text-indigo-400" />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};

const safeJsonParse = (str) => {
  if (!str) return null;
  try { return JSON.parse(str); } catch (e) {
    try {
      let cleaned = str.replace(/```json/g, '').replace(/```/g, '').trim();
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
         cleaned = cleaned.substring(firstBrace, lastBrace + 1);
      }
      return JSON.parse(cleaned);
    } catch (e2) { 
      console.error("JSON Parse Error:", e2);
      return null; 
    }
  }
};

const renderText = (content) => {
  if (!content) return '';
  if (Array.isArray(content)) return content.join('\n');
  if (typeof content === 'object') return JSON.stringify(content, null, 2);
  return content;
};

// [이미지 저장 함수]
const saveAsPng = async (elementRef, fileName, showToast) => {
  if (!elementRef.current) return;
  try {
    if (!window.html2canvas) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
    const canvas = await window.html2canvas(elementRef.current, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' });
    const link = document.createElement('a');
    link.download = `${fileName}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    if(showToast) showToast("이미지가 성공적으로 저장되었습니다.");
  } catch (error) {
    console.error("이미지 저장 실패:", error);
    if(showToast) showToast("저장 중 오류가 발생했습니다.");
  }
};

// [PDF 저장 함수]
const saveAsPdf = async (elementRef, fileName, showToast) => {
  if (!elementRef.current) return;
  try {
    if (!window.html2canvas) await new Promise((r) => { const s = document.createElement('script'); s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"; s.onload = r; document.head.appendChild(s); });
    if (!window.jspdf) await new Promise((r) => { const s = document.createElement('script'); s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"; s.onload = r; document.head.appendChild(s); });

    if(showToast) showToast("PDF 변환 중입니다. 잠시만 기다려주세요...");
    
    const canvas = await window.html2canvas(elementRef.current, { 
      scale: 2, 
      useCORS: true, 
      logging: false, 
      backgroundColor: '#ffffff' 
    });

    const imgData = canvas.toDataURL('image/png');
    const { jsPDF } = window.jspdf;
    
    // PDF 너비를 A4 너비(210mm)로 고정
    const pdfWidth = 210;
    const imgProps = { width: canvas.width, height: canvas.height };
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    const pdf = new jsPDF('p', 'mm', [pdfWidth, pdfHeight]);
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    
    pdf.save(`${fileName}.pdf`);
    if(showToast) showToast("PDF가 성공적으로 저장되었습니다.");
  } catch (error) {
    console.error("PDF 저장 실패:", error);
    if(showToast) showToast("PDF 저장 중 오류가 발생했습니다.");
  }
};

// AI 키 관리 로직
const fetchGemini = async (prompt, attachments = []) => {
  let apiKey = localStorage.getItem("custom_gemini_key");
  if (!apiKey) throw new Error("🚨 API 키가 없습니다. [대시보드] 상단에서 본인의 Google API 키를 먼저 등록해주세요.");
  
  const models = ["gemini-1.5-flash", "gemini-2.0-flash-exp", "gemini-2.5-flash-preview-09-2025"];
  const jsonInstruction = `IMPORTANT: Return strict JSON string. No markdown blocks.`;
  const finalPrompt = prompt + jsonInstruction;
  
  const parts = [{ text: finalPrompt }];
  if (attachments && attachments.length > 0) {
    attachments.forEach(file => {
      parts.push({
        inlineData: {
          mimeType: file.mimeType,
          data: file.data 
        }
      });
    });
  }

  const payload = { 
    contents: [{ parts: parts }],
    generationConfig: { responseMimeType: "application/json" } // JSON 응답 강제 설정
  };
  
  if (!attachments || attachments.length === 0) {
    payload.tools = [{ google_search: {} }];
  }

  for (const model of models) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        if (response.status === 429 || response.status === 503) { 
            await new Promise(r => setTimeout(r, 2000)); 
            continue; 
        }
        if (response.status === 404) break;
        const errText = await response.text();
        throw new Error(`HTTP Error ${response.status}: ${errText}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsed = safeJsonParse(text);
      if (parsed) return parsed;
    } catch (e) { 
        console.warn(`${model} error:`, e); 
        if (e.message.includes("API key")) throw e; 
    }
  }
  throw new Error("모든 AI 모델 연결 실패");
};

const EditableContent = ({ value, onSave, className }) => (
  <div contentEditable suppressContentEditableWarning className={`whitespace-pre-wrap outline-none focus:bg-yellow-50/50 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-200 rounded transition-all cursor-text ${className}`} onBlur={(e) => onSave(e.currentTarget.innerText)}>{renderText(value)}</div>
);

// --- Constants (11 Internal Apps + 1 External Tool) ---
const SERVICES = {
  // [전용 앱: 11개]
  company_analysis: { name: "[AI] 기업분석 리포트", desc: "기업 핵심가치/이슈/SWOT 분석", link: null, internal: true, icon: BarChart3, color: "indigo" },
  career_roadmap: { name: "[AI] 커리어 로드맵", desc: "5년/10년 후 경력 목표 설계", link: null, internal: true, icon: TrendingUp, color: "blue" },
  job_fit: { name: "[AI] 직무 적합도 진단", desc: "채용공고(JD)와 내 서류 매칭 분석", link: null, internal: true, icon: Percent, color: "rose" },
  rubric_clinic: { name: "[AI] 자소서 코칭 클리닉", desc: "루브릭 기준 자소서 진단 및 첨삭", link: null, internal: true, icon: Stethoscope, color: "cyan" },
  pt_interview: { name: "[AI] PT 면접 가이드", desc: "주제 추출 및 발표 대본 생성", link: null, internal: true, icon: MonitorPlay, color: "rose" },
  sit_interview: { name: "[AI] 상황면접 가이드", desc: "상황별 구조화된 답변 생성", link: null, internal: true, icon: Split, color: "teal" },
  self_intro: { name: "[AI] 1분 자기소개", desc: "직무/인성 컨셉 맞춤 스크립트", link: null, internal: true, icon: Mic, color: "purple" },
  exp_structuring: { name: "[AI] 경험 구조화 (STAR)", desc: "경험 정리 및 핵심 역량 도출", link: null, internal: true, icon: LayoutList, color: "indigo" },
  role_model: { name: "[AI] 롤모델 분석", desc: "인물 정보 및 면접 활용 팁", link: null, internal: true, icon: Award, color: "orange" },
  gpt_guide: { name: "[AI] 직업 탐색 가이드", desc: "관심 있는 직업/직무 분석 및 가이드", link: null, internal: true, icon: Compass, color: "emerald" },
  holland_test: { name: "[AI] 홀랜드 검사 리포트", desc: "RIASEC 검사 결과 분석 및 직업 추천", link: null, internal: true, icon: ClipboardList, color: "pink" },
  
  // [외부 도구: 1개]
  card_bot: { name: "[노트북LM] 커리어스타일 챗봇", desc: "유료 프로그램 전용 챗봇", link: "https://notebooklm.google.com/notebook/595da4c0-fcc1-4064-82c8-9901e6dd8772", internal: false, icon: MessageSquare, color: "violet" },
};
const COLOR_VARIANTS = { emerald: "bg-emerald-100 text-emerald-600", violet: "bg-violet-100 text-violet-600", cyan: "bg-cyan-100 text-cyan-600", indigo: "bg-indigo-100 text-indigo-600", blue: "bg-blue-100 text-blue-600", rose: "bg-rose-100 text-rose-600", teal: "bg-teal-100 text-teal-600", purple: "bg-purple-100 text-purple-600", orange: "bg-orange-100 text-orange-600", pink: "bg-pink-100 text-pink-600" };

// --- Sub Apps (Full Implementations) ---

function CoverLetterClinicApp({ onClose }) {
  const [inputs, setInputs] = useState({ company: '', url: '', job: '' });
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const reportRef = useRef(null);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) {
      const reader = new FileReader();
      reader.onloadend = () => setFile({ mimeType: f.type, data: reader.result.split(',')[1], name: f.name });
      reader.readAsDataURL(f);
    }
  };

  const handleAIAnalysis = async () => {
    if (!inputs.company || !inputs.job) return setToastMsg("기업명과 직무를 입력해주세요.");
    if (!file) return setToastMsg("자소서(PDF)를 업로드해주세요.");

    setLoading(true);
    try {
      const rubric = `
        [루브릭 평가 기준]
        1. 성장과정: 가치관형성/인성/직무연결 (우수: 서사적 기술 및 직무 가치 연결, 미흡: 단순 나열)
        2. 성격의 장단점: 자기이해/직무적합성/조직적합성 (우수: 분석적 표현 및 직무 연결, 미흡: 형용사 나열)
        3. 지원동기: 기업이해/산업이해/진정성 (우수: 경쟁사 대비 차별점 및 구체적 동기, 미흡: 범용적 내용)
        4. 직무역량/입사후포부: 직무이해/실현가능성 (우수: 구체적 기여 방안, 미흡: 추상적 열정)
      `;

      const prompt = `당신은 자소서 첨삭 전문 컨설턴트입니다.
      지원기업: ${inputs.company} (${inputs.url || 'N/A'}), 직무: ${inputs.job}.
      첨부된 자소서를 위 [루브릭 평가 기준]에 따라 냉정하게 평가하고 첨삭해주세요.
      ${rubric}

      [출력 형식 JSON]
      {
        "rubric_table": [
          {"category": "항목명(예:성장과정)", "score": "우수/보통/미흡", "comment": "핵심 평가 코멘트"}
        ],
        "detailed_feedback": [
          {
            "section_name": "항목명",
            "strength": "강점 포인트 (칭찬할 점, 잘 쓴 표현)",
            "improvement": "보완 포인트 (수정 방향, 대체 표현 제안)"
          }
        ],
        "interview_questions": ["꼬리질문1", "꼬리질문2", "꼬리질문3"]
      }`;

      const parsed = await fetchGemini(prompt, [file]);
      setResult(parsed);
    } catch (e) { setToastMsg(e.message); } finally { setLoading(false); }
  };

  const handleEdit = (section, key, value, index) => {
    setResult(prev => {
        const newData = { ...prev };
        if (section === 'rubric_table' || section === 'detailed_feedback' || section === 'interview_questions') {
             if(Array.isArray(newData[section])) {
                 if (section === 'interview_questions') newData[section][index] = value;
                 else newData[section][index][key] = value;
             }
        }
        return newData;
    });
  };

  const handleDownload = () => saveAsPng(reportRef, `자소서코칭_${inputs.company}`, setToastMsg);
  const handlePdfDownload = () => saveAsPdf(reportRef, `자소서코칭_${inputs.company}`, setToastMsg);

  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col font-sans text-slate-800">
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
      <header className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md shrink-0"><div className="flex items-center gap-3"><Stethoscope className="text-cyan-400"/><h1 className="font-bold text-lg">자소서 코칭 클리닉</h1></div><button onClick={onClose}><ChevronLeft/></button></header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 bg-white border-r p-6 shrink-0 overflow-y-auto">
          <div className="space-y-4">
             <input value={inputs.company} onChange={e=>setInputs({...inputs, company:e.target.value})} className="w-full p-3 border rounded-lg text-sm" placeholder="지원 기업명" />
             <input value={inputs.url} onChange={e=>setInputs({...inputs, url:e.target.value})} className="w-full p-3 border rounded-lg text-sm" placeholder="홈페이지 URL (선택)" />
             <input value={inputs.job} onChange={e=>setInputs({...inputs, job:e.target.value})} className="w-full p-3 border rounded-lg text-sm" placeholder="지원 직무" />
             <div className="pt-2 border-t space-y-2">
                <label className="block text-xs font-bold text-slate-500">자기소개서 (PDF Only)</label>
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {file ? <><FileCheck className="w-8 h-8 text-green-500 mb-1"/><p className="text-xs text-slate-500 truncate w-4/5 text-center">{file.name}</p></> : <><UploadCloud className="w-8 h-8 text-slate-400 mb-1"/><p className="text-xs text-slate-500">PDF 업로드</p></>}
                    </div>
                    <input type="file" className="hidden" accept="application/pdf" onChange={handleFileChange} />
                </label>
             </div>
             <button onClick={handleAIAnalysis} disabled={loading} className="w-full bg-cyan-600 text-white py-3 rounded-xl font-bold mt-2 shadow-lg disabled:bg-slate-400">{loading ? <Loader2 className="animate-spin mx-auto"/> : "코칭 시작"}</button>
          </div>
        </aside>
        <main className="flex-1 p-8 overflow-y-auto flex justify-center bg-slate-50">
          {result ? (
            <div ref={reportRef} className="w-[210mm] min-h-[297mm] bg-white shadow-2xl p-12 flex flex-col animate-in fade-in">
              <div className="border-b-4 border-cyan-500 pb-6 mb-8">
                <span className="bg-cyan-100 text-cyan-800 px-3 py-1 rounded-full text-xs font-bold">COVER LETTER CLINIC</span>
                <h1 className="text-3xl font-extrabold text-slate-900 mt-2">{inputs.company} 자소서 진단</h1>
              </div>
              <div className="space-y-8">
                <section>
                    <h3 className="text-xl font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200">📊 루브릭 평가 리포트</h3>
                    <div className="overflow-hidden rounded-xl border border-slate-200">
                        <table className="w-full text-sm text-left"><thead className="bg-slate-50 font-bold text-slate-600"><tr><th className="p-3">항목</th><th className="p-3 w-20 text-center">평가</th><th className="p-3">핵심 코멘트</th></tr></thead>
                        <tbody className="divide-y">{result.rubric_table?.map((r,i)=><tr key={i}><td className="p-3 font-bold">{r.category}</td><td className={`p-3 text-center font-bold ${r.score==='우수'?'text-blue-600':r.score==='미흡'?'text-red-500':'text-slate-600'}`}>{r.score}</td><td className="p-3"><EditableContent value={r.comment} onSave={(v)=>handleEdit('rubric_table', 'comment', v, i)}/></td></tr>)}</tbody></table>
                    </div>
                </section>
                <section>
                    <h3 className="text-xl font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200">📝 항목별 정밀 첨삭</h3>
                    <div className="space-y-6">
                        {result.detailed_feedback?.map((f, i) => (
                            <div key={i} className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                                <h4 className="font-bold text-lg mb-3 text-slate-800">{f.section_name}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500 shadow-sm"><span className="text-blue-600 font-bold text-xs block mb-1">GOOD (강점)</span><EditableContent className="text-sm text-slate-700" value={f.strength} onSave={(v)=>handleEdit('detailed_feedback', 'strength', v, i)}/></div>
                                    <div className="bg-white p-4 rounded-lg border-l-4 border-red-500 shadow-sm"><span className="text-red-500 font-bold text-xs block mb-1">BAD (보완)</span><EditableContent className="text-sm text-slate-700" value={f.improvement} onSave={(v)=>handleEdit('detailed_feedback', 'improvement', v, i)}/></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
                <section className="bg-cyan-50 p-6 rounded-xl border border-cyan-100">
                    <h3 className="font-bold text-cyan-900 mb-3">💬 면접 대비 꼬리질문</h3>
                    <ul className="list-disc list-inside space-y-2 text-sm text-cyan-800 font-medium">
                        {result.interview_questions?.map((q, i) => <li key={i}><EditableContent className="inline" value={q} onSave={(v)=>handleEdit('interview_questions', null, v, i)}/></li>)}
                    </ul>
                </section>
              </div>
            </div>
          ) : <div className="flex flex-col items-center justify-center h-full text-slate-400"><Stethoscope size={64} className="mb-4 opacity-20"/><p>PDF 자소서를 업로드하여 진단을 시작하세요.</p></div>}
        </main>
        {result && <div className="absolute bottom-8 right-8 flex gap-3 z-50"><button onClick={handleDownload} className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold flex items-center"><Download size={16} className="mr-2"/>IMG</button><button onClick={handlePdfDownload} className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold flex items-center"><FileText size={16} className="mr-2"/>PDF</button></div>}
      </div>
    </div>
  );
}

function JobFitScannerApp({ onClose }) {
  const [inputs, setInputs] = useState({ company: '', url: '', job: '' });
  const [jdFile, setJdFile] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const reportRef = useRef(null);

  const handleFileChange = (e, setFile) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFile({ mimeType: file.type, data: reader.result.split(',')[1], name: file.name });
      reader.readAsDataURL(file);
    }
  };

  const handleAIAnalysis = async () => {
    if (!inputs.company || !inputs.job) return setToastMsg("기업명과 직무를 입력해주세요.");
    if (!jdFile || !resumeFile) return setToastMsg("파일을 모두 업로드해주세요.");
    
    setLoading(true);
    try {
      const prompt = `기업: ${inputs.company}, 직무: ${inputs.job}. 채용공고와 이력서를 비교 분석해줘. JSON: { "score": 85, "fit_analysis": { "strong": "강점", "missing": "보완점" }, "gap_strategy": "전략", "interview_prep": ["질문1", "질문2", "질문3"], "overall_comment": "총평" }`;
      const parsed = await fetchGemini(prompt, [jdFile, resumeFile]);
      setResult(parsed);
    } catch (e) { setToastMsg(e.message); } finally { setLoading(false); }
  };

  const handleEdit = (section, key, value, index) => {
    setResult(prev => {
        const newData = { ...prev };
        if (section === 'fit_analysis' || section === 'interview_prep') { 
            Array.isArray(newData[section]) ? newData[section][index] = value : newData[section][key] = value;
        } else newData[section] = value;
        return newData;
    });
  };

  const handleDownload = () => saveAsPng(reportRef, `적합도진단_${inputs.company}`, setToastMsg);
  const handlePdfDownload = () => saveAsPdf(reportRef, `적합도진단_${inputs.company}`, setToastMsg);

  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col font-sans text-slate-800">
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
      <header className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md shrink-0"><div className="flex items-center gap-3"><FileText className="text-rose-400"/><h1 className="font-bold text-lg">직무 적합도 진단</h1></div><button onClick={onClose}><ChevronLeft/></button></header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 bg-white border-r p-6 shrink-0 overflow-y-auto">
          <div className="space-y-4">
             <input value={inputs.company} onChange={e=>setInputs({...inputs, company:e.target.value})} className="w-full p-3 border rounded-lg text-sm" placeholder="기업명" />
             <input value={inputs.job} onChange={e=>setInputs({...inputs, job:e.target.value})} className="w-full p-3 border rounded-lg text-sm" placeholder="지원 직무" />
             <div className="pt-2 border-t space-y-2">
                <label className="block text-xs font-bold text-slate-500">채용공고 (JD)</label>
                <input type="file" className="text-xs" onChange={(e)=>handleFileChange(e, setJdFile)} />
                <label className="block text-xs font-bold text-slate-500 mt-2">이력서/자소서</label>
                <input type="file" className="text-xs" onChange={(e)=>handleFileChange(e, setResumeFile)} />
             </div>
             <button onClick={handleAIAnalysis} disabled={loading} className="w-full bg-rose-600 text-white py-3 rounded-xl font-bold mt-2 shadow-lg disabled:bg-slate-400">{loading ? <Loader2 className="animate-spin mx-auto"/> : "진단 시작"}</button>
          </div>
        </aside>
        <main className="flex-1 p-8 overflow-y-auto flex justify-center bg-slate-50">
          {result ? (
            <div ref={reportRef} className="w-[210mm] min-h-[297mm] bg-white shadow-2xl p-12 flex flex-col animate-in fade-in">
              <div className="border-b-4 border-rose-500 pb-6 mb-8 flex justify-between items-end">
                <div><span className="bg-rose-100 text-rose-800 px-3 py-1 rounded-full text-xs font-bold">JOB FIT REPORT</span><h1 className="text-4xl font-extrabold text-slate-900 mt-2">{inputs.company}</h1></div>
                <div className="text-5xl font-black text-rose-600">{result.score}<span className="text-2xl text-slate-400">/100</span></div>
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <div className="bg-blue-50 p-6 rounded-xl"><h3 className="font-bold text-blue-800 mb-2">Strong Point</h3><EditableContent className="text-sm" value={result.fit_analysis?.strong} onSave={(v)=>handleEdit('fit_analysis', 'strong', v)}/></div>
                    <div className="bg-red-50 p-6 rounded-xl"><h3 className="font-bold text-red-800 mb-2">Missing Point</h3><EditableContent className="text-sm" value={result.fit_analysis?.missing} onSave={(v)=>handleEdit('fit_analysis', 'missing', v)}/></div>
                </div>
                <div className="bg-white p-6 border rounded-xl"><h3 className="font-bold text-slate-800 mb-2">Gap Strategy</h3><EditableContent value={result.gap_strategy} onSave={(v)=>handleEdit('gap_strategy', null, v)}/></div>
                <div className="bg-slate-50 p-6 rounded-xl"><h3 className="font-bold text-slate-800 mb-2">Interview Prep</h3>{result.interview_prep?.map((q, i)=><div key={i} className="mb-2"><span className="font-bold text-rose-500 mr-2">Q{i+1}</span><EditableContent className="inline" value={q} onSave={(v)=>handleEdit('interview_prep', null, v, i)}/></div>)}</div>
                <div className="bg-slate-800 p-6 rounded-xl text-white"><h3 className="font-bold mb-2">Overall Comment</h3><EditableContent value={result.overall_comment} onSave={(v)=>handleEdit('overall_comment', null, v)}/></div>
              </div>
            </div>
          ) : <div className="flex flex-col items-center justify-center h-full text-slate-400"><Percent size={64} className="mb-4 opacity-20"/><p>JD와 이력서를 업로드하여 진단을 시작하세요.</p></div>}
        </main>
        {result && <div className="absolute bottom-8 right-8 flex gap-3 z-50"><button onClick={handleDownload} className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold flex items-center"><Download size={16} className="mr-2"/>IMG</button><button onClick={handlePdfDownload} className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold flex items-center"><FileText size={16} className="mr-2"/>PDF</button></div>}
      </div>
    </div>
  );
}

function HollandTestApp({ onClose }) {
  const [scores, setScores] = useState({ R: '', I: '', A: '', S: '', E: '', C: '' });
  const [jobs, setJobs] = useState({ job1: '', job2: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const reportRef = useRef(null);
  const handleAIAnalysis = async () => {
    if (Object.values(scores).some(v => v === '')) return setToastMsg("점수를 모두 입력해주세요.");
    setLoading(true);
    try {
      const sorted = Object.entries(scores).map(([c, s]) => ({ c, s: Number(s) })).sort((a, b) => b.s - a.s);
      const prompt = `홀랜드 검사. 점수:${JSON.stringify(scores)}. 1순위:${sorted[0].c}, 2순위:${sorted[1].c}. 관심직업:${jobs.job1}, ${jobs.job2}. 상세 분석 리포트 JSON 작성.`;
      const parsed = await fetchGemini(prompt);
      setResult(parsed);
    } catch (e) { setToastMsg(e.message); } finally { setLoading(false); }
  };
  const handleEdit = (sec, key, val, idx) => setResult(p => { const n = { ...p }; Array.isArray(n[sec]) ? n[sec][idx][key] = val : n[sec] = val; return n; });

  const handleDownload = () => saveAsPng(reportRef, `홀랜드리포트`, setToastMsg);
  const handlePdfDownload = () => saveAsPdf(reportRef, `홀랜드리포트`, setToastMsg);

  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col font-sans text-slate-800">
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
      <header className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md shrink-0"><div className="flex items-center gap-3"><ClipboardList className="text-pink-400"/><h1 className="font-bold text-lg">홀랜드 리포트</h1></div><button onClick={onClose}><ChevronLeft/></button></header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 bg-white border-r p-6 shrink-0">
            <h3 className="font-bold text-sm text-pink-700 mb-2">점수 입력 (표준점수)</h3>
            <div className="bg-slate-50 p-2 text-xs text-slate-600 mb-4 rounded border">40이하:낮음 / 41~59:중간 / 60이상:높음</div>
            <div className="grid grid-cols-2 gap-2 mb-4">{['R','I','A','S','E','C'].map(c => <div key={c}><label className="text-xs font-bold block">{c}형</label><input type="number" className="w-full border p-1 rounded" value={scores[c]} onChange={e=>setScores({...scores, [c]:e.target.value})}/></div>)}</div>
            <h4 className="font-bold text-xs text-slate-500 mb-1">관심 직업</h4>
            <input className="w-full border p-2 rounded mb-1 text-sm" placeholder="1순위" value={jobs.job1} onChange={e=>setJobs({...jobs, job1:e.target.value})}/>
            <input className="w-full border p-2 rounded mb-4 text-sm" placeholder="2순위" value={jobs.job2} onChange={e=>setJobs({...jobs, job2:e.target.value})}/>
            <button onClick={handleAIAnalysis} disabled={loading} className="w-full bg-pink-600 text-white py-3 rounded-lg font-bold">{loading?<Loader2 className="animate-spin mx-auto"/>:"리포트 생성"}</button>
        </aside>
        <main className="flex-1 p-8 overflow-y-auto flex justify-center bg-slate-50">
            {result ? (
                <div ref={reportRef} className="w-[210mm] min-h-[297mm] bg-white shadow-2xl p-12 flex flex-col animate-in fade-in">
                    <div className="border-b-4 border-pink-500 pb-6 mb-8"><span className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-xs font-bold">HOLLAND REPORT</span><h1 className="text-4xl font-extrabold mt-2">홀랜드 검사 분석</h1><EditableContent className="text-lg text-slate-500 mt-2" value={result.overview} onSave={(v)=>handleEdit('overview', null, v)}/></div>
                    <div className="space-y-6">
                        <div className="border rounded-xl overflow-hidden"><table className="w-full text-sm text-left"><thead className="bg-slate-100"><tr><th className="p-3">순위</th><th className="p-3">유형</th><th className="p-3">점수</th><th className="p-3">특징</th></tr></thead><tbody>{result.rank_table?.map((r,i)=><tr key={i} className="border-t"><td className="p-3 font-bold">{r.rank}</td><td className="p-3">{r.type}</td><td className="p-3 font-bold">{r.score}</td><td className="p-3"><EditableContent value={r.desc} onSave={(v)=>handleEdit('rank_table', 'desc', v, i)}/></td></tr>)}</tbody></table></div>
                        <div className="grid grid-cols-3 gap-4"><div className="bg-blue-50 p-4 rounded-xl"><h4 className="font-bold text-blue-800 mb-2">강점</h4><EditableContent className="text-sm" value={result.analysis?.strength} onSave={(v)=>handleEdit('analysis', 'strength', v)}/></div><div className="bg-orange-50 p-4 rounded-xl"><h4 className="font-bold text-orange-800 mb-2">약점</h4><EditableContent className="text-sm" value={result.analysis?.weakness} onSave={(v)=>handleEdit('analysis', 'weakness', v)}/></div><div className="bg-emerald-50 p-4 rounded-xl"><h4 className="font-bold text-emerald-800 mb-2">조언</h4><EditableContent className="text-sm" value={result.analysis?.complement} onSave={(v)=>handleEdit('analysis', 'complement', v)}/></div></div>
                        <div className="bg-white p-6 border rounded-xl"><h3 className="font-bold mb-3">직무 매칭 분석</h3><div className="space-y-3"><div><h4 className="font-bold text-slate-700">1. {jobs.job1}</h4><EditableContent className="text-sm text-slate-600" value={result.job_match?.job1_match} onSave={(v)=>handleEdit('job_match', 'job1_match', v)}/></div>{jobs.job2 && <div><h4 className="font-bold text-slate-700">2. {jobs.job2}</h4><EditableContent className="text-sm text-slate-600" value={result.job_match?.job2_match} onSave={(v)=>handleEdit('job_match', 'job2_match', v)}/></div>}</div></div>
                    </div>
                </div>
            ) : <div className="flex flex-col items-center justify-center h-full text-slate-400"><ClipboardList size={64} className="mb-4 opacity-20"/><p>점수를 입력하고 리포트를 생성하세요.</p></div>}
        </main>
        {result && <div className="absolute bottom-8 right-8 flex gap-3 z-50"><button onClick={handleDownload} className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold flex items-center"><Download size={16} className="mr-2"/>IMG</button><button onClick={handlePdfDownload} className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold flex items-center"><FileText size={16} className="mr-2"/>PDF</button></div>}
      </div>
    </div>
  );
}

function CompanyAnalysisApp({ onClose }) {
  const [inputs, setInputs] = useState({ company: '', url: '', job: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const reportRef = useRef(null);

  const handleAIAnalysis = async () => {
    if (!inputs.company || !inputs.job) return setToastMsg("기업명과 직무를 입력해주세요.");
    setLoading(true);
    try {
      const prompt = `기업: ${inputs.company}, 직무: ${inputs.job}. 상세 분석 리포트 JSON.`;
      const parsed = await fetchGemini(prompt);
      setResult(parsed);
    } catch (e) { setToastMsg(e.message); } finally { setLoading(false); }
  };
  const handleEdit = (section, key, value) => setResult(prev => { const n = {...prev}; n[section][key] = value; return n; });
  const handleDownload = () => saveAsPng(reportRef, `기업분석_${inputs.company}`, setToastMsg);
  const handlePdfDownload = () => saveAsPdf(reportRef, `기업분석_${inputs.company}`, setToastMsg);

  return (
     <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col font-sans text-slate-800">
        <header className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md shrink-0"><div className="flex items-center gap-3"><BarChart3 className="text-indigo-400" /><h1 className="font-bold text-lg">기업분석 리포트</h1></div><button onClick={onClose}><ChevronLeft/></button></header>
        <div className="flex flex-1 overflow-hidden">
            <aside className="w-80 bg-white border-r p-6"><div className="space-y-4"><input className="w-full border p-2 rounded" placeholder="기업명" value={inputs.company} onChange={e=>setInputs({...inputs, company:e.target.value})}/><input className="w-full border p-2 rounded" placeholder="직무" value={inputs.job} onChange={e=>setInputs({...inputs, job:e.target.value})}/><button onClick={handleAIAnalysis} disabled={loading} className="w-full bg-indigo-600 text-white py-3 rounded">{loading?<Loader2 className="animate-spin mx-auto"/>:"분석 시작"}</button></div></aside>
            <main className="flex-1 p-8 overflow-y-auto flex justify-center bg-slate-50">
                {result ? (
                    <div ref={reportRef} className="w-[210mm] min-h-[297mm] bg-white shadow-2xl p-12 animate-in fade-in">
                        <div className="border-b-4 border-indigo-600 pb-6 mb-8"><h1 className="text-4xl font-bold">{inputs.company}</h1><p className="text-lg text-slate-500">기업분석 리포트</p></div>
                        <div className="space-y-6">
                            <section><h3 className="font-bold text-xl text-indigo-900 mb-2">개요</h3><EditableContent value={result.overview?.summary} onSave={(v)=>handleEdit('overview','summary',v)}/></section>
                            <section><h3 className="font-bold text-xl text-indigo-900 mb-2">SWOT</h3><div className="grid grid-cols-2 gap-4">{['s','w','o','t'].map(k=><div key={k} className="border p-3 rounded"><span className="font-bold uppercase">{k}</span><EditableContent value={result.business?.swot?.[k]} onSave={(v)=>{const n={...result.business.swot, [k]:v}; handleEdit('business','swot',n)}}/></div>)}</div></section>
                        </div>
                    </div>
                ) : <div className="flex items-center justify-center h-full text-slate-400">정보를 입력하세요</div>}
            </main>
            {result && <div className="absolute bottom-8 right-8 flex gap-3"><button onClick={handleDownload} className="bg-slate-900 text-white px-4 py-2 rounded">IMG</button><button onClick={handlePdfDownload} className="bg-red-600 text-white px-4 py-2 rounded">PDF</button></div>}
        </div>
        {toastMsg && <Toast message={toastMsg} onClose={()=>setToastMsg(null)}/>}
     </div>
  );
}

function CareerRoadmapApp({ onClose }) {
  const [inputs, setInputs] = useState({ company: '', job: '', years: '5' });
  const [roadmapData, setRoadmapData] = useState(null); 
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const reportRef = useRef(null);

  const handleAIPlan = async () => {
    if (!inputs.company) return setToastMsg("기업명을 입력하세요.");
    setLoading(true);
    try {
        const prompt = `커리어 로드맵. 기업:${inputs.company}, 직무:${inputs.job}, 기간:${inputs.years}년. JSON 포맷.`;
        const parsed = await fetchGemini(prompt);
        setRoadmapData(parsed);
    } catch(e) { setToastMsg(e.message); } finally { setLoading(false); }
  };
  const handleEdit = (k, v) => setRoadmapData(p => ({...p, [k]:v}));
  const handleMapEdit = (i, k, v) => setRoadmapData(p => { const m = [...p.roadmap]; m[i][k] = v; return {...p, roadmap: m}; });
  
  const handleDownload = () => saveAsPng(reportRef, `로드맵`, setToastMsg);
  const handlePdfDownload = () => saveAsPdf(reportRef, `로드맵`, setToastMsg);

  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col font-sans text-slate-800">
        <header className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md shrink-0"><div className="flex items-center gap-3"><TrendingUp className="text-blue-400"/><h1 className="font-bold text-lg">커리어 로드맵</h1></div><button onClick={onClose}><ChevronLeft/></button></header>
        <div className="flex flex-1 overflow-hidden">
            <aside className="w-80 bg-white border-r p-6"><input className="w-full border p-2 rounded mb-2" placeholder="기업명" value={inputs.company} onChange={e=>setInputs({...inputs, company:e.target.value})}/><input className="w-full border p-2 rounded mb-4" placeholder="직무" value={inputs.job} onChange={e=>setInputs({...inputs, job:e.target.value})}/><button onClick={handleAIPlan} disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded">{loading?<Loader2 className="animate-spin mx-auto"/>:"로드맵 생성"}</button></aside>
            <main className="flex-1 p-8 overflow-y-auto flex justify-center bg-slate-50">
                {roadmapData ? (
                    <div ref={reportRef} className="w-[210mm] min-h-[297mm] bg-white shadow-2xl p-12 animate-in fade-in">
                        <div className="border-b-4 border-blue-600 pb-6 mb-8"><h1 className="text-4xl font-bold">{inputs.company}</h1><EditableContent className="text-xl text-blue-600" value={roadmapData.goal} onSave={v=>handleEdit('goal',v)}/></div>
                        <div className="space-y-6">{roadmapData.roadmap?.map((r,i)=><div key={i} className="flex gap-4"><div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">{i+1}</div><div className="flex-1 border p-4 rounded-xl"><EditableContent className="font-bold" value={r.stage} onSave={v=>handleMapEdit(i,'stage',v)}/><EditableContent className="text-sm mt-2" value={r.action} onSave={v=>handleMapEdit(i,'action',v)}/></div></div>)}</div>
                    </div>
                ) : <div className="flex items-center justify-center h-full text-slate-400">목표를 입력하세요</div>}
            </main>
            {roadmapData && <div className="absolute bottom-8 right-8 flex gap-3"><button onClick={handleDownload} className="bg-slate-900 text-white px-4 py-2 rounded">IMG</button><button onClick={handlePdfDownload} className="bg-red-600 text-white px-4 py-2 rounded">PDF</button></div>}
        </div>
        {toastMsg && <Toast message={toastMsg} onClose={()=>setToastMsg(null)}/>}
    </div>
  );
}

function JobExplorerApp({ onClose }) {
  const [inputs, setInputs] = useState({ job: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const reportRef = useRef(null);

  const handleAIAnalysis = async () => {
    if (!inputs.job) return setToastMsg("직업명을 입력하세요.");
    setLoading(true);
    try {
      const prompt = `직업 '${inputs.job}' 상세 분석 가이드. 개요, 업무, 역량, 전망 등 JSON.`;
      const parsed = await fetchGemini(prompt);
      setResult(parsed);
    } catch(e) { setToastMsg(e.message); } finally { setLoading(false); }
  };
  const handleEdit = (k, v) => setResult(p => ({...p, [k]:v}));
  
  const handleDownload = () => saveAsPng(reportRef, `직업탐색`, setToastMsg);
  const handlePdfDownload = () => saveAsPdf(reportRef, `직업탐색`, setToastMsg);

  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col font-sans text-slate-800">
        <header className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md shrink-0"><div className="flex items-center gap-3"><Compass className="text-emerald-400"/><h1 className="font-bold text-lg">직업 탐색</h1></div><button onClick={onClose}><ChevronLeft/></button></header>
        <div className="flex flex-1 overflow-hidden">
            <aside className="w-80 bg-white border-r p-6"><input className="w-full border p-2 rounded mb-4" placeholder="직업명 (예: 마케터)" value={inputs.job} onChange={e=>setInputs({...inputs, job:e.target.value})}/><button onClick={handleAIAnalysis} disabled={loading} className="w-full bg-emerald-600 text-white py-3 rounded">{loading?<Loader2 className="animate-spin mx-auto"/>:"탐색 시작"}</button></aside>
            <main className="flex-1 p-8 overflow-y-auto flex justify-center bg-slate-50">
                {result ? (
                    <div ref={reportRef} className="w-[210mm] min-h-[297mm] bg-white shadow-2xl p-12 animate-in fade-in">
                        <div className="border-b-4 border-emerald-500 pb-6 mb-8"><h1 className="text-4xl font-bold">{inputs.job}</h1><EditableContent className="text-lg text-slate-500" value={result.overview} onSave={v=>handleEdit('overview',v)}/></div>
                        <div className="space-y-6">
                            <div className="bg-slate-50 p-6 rounded-xl"><h3 className="font-bold mb-2">주요 업무</h3><ul className="list-disc list-inside text-sm">{result.tasks?.map((t,i)=><li key={i}>{t}</li>)}</ul></div>
                        </div>
                    </div>
                ) : <div className="flex items-center justify-center h-full text-slate-400">직업명을 입력하세요</div>}
            </main>
            {result && <div className="absolute bottom-8 right-8 flex gap-3"><button onClick={handleDownload} className="bg-slate-900 text-white px-4 py-2 rounded">IMG</button><button onClick={handlePdfDownload} className="bg-red-600 text-white px-4 py-2 rounded">PDF</button></div>}
        </div>
        {toastMsg && <Toast message={toastMsg} onClose={()=>setToastMsg(null)}/>}
    </div>
  );
}

function PtInterviewApp({ onClose }) {
    const [inputs, setInputs] = useState({ company: '', job: '' });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [toastMsg, setToastMsg] = useState(null);
    const reportRef = useRef(null);

    const handleGenerate = async () => {
        if (!inputs.company) return setToastMsg("기업명을 입력해주세요.");
        setLoading(true);
        try {
            const prompt = `PT면접 주제 및 스크립트 생성. 기업:${inputs.company}, 직무:${inputs.job}. JSON 포맷.`;
            const parsed = await fetchGemini(prompt);
            setResult(parsed);
        } catch (e) { setToastMsg(e.message); } finally { setLoading(false); }
    };
    
    const handleDownload = () => saveAsPng(reportRef, `PT면접`, setToastMsg);
    const handlePdfDownload = () => saveAsPdf(reportRef, `PT면접`, setToastMsg);

    return (
        <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col font-sans text-slate-800">
            <header className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md shrink-0"><div className="flex items-center gap-3"><MonitorPlay className="text-rose-400"/><h1 className="font-bold text-lg">PT 면접 가이드</h1></div><button onClick={onClose}><ChevronLeft/></button></header>
            <div className="flex flex-1 overflow-hidden">
                <aside className="w-80 bg-white border-r p-6"><input className="w-full border p-2 rounded mb-2" placeholder="기업명" onChange={e=>setInputs({...inputs, company:e.target.value})}/><button onClick={handleGenerate} disabled={loading} className="w-full bg-rose-600 text-white py-3 rounded">{loading?<Loader2 className="animate-spin mx-auto"/>:"생성"}</button></aside>
                <main className="flex-1 p-8 overflow-y-auto flex justify-center bg-slate-50">
                    {result ? <div ref={reportRef} className="w-[210mm] min-h-[297mm] bg-white shadow-2xl p-12 animate-in fade-in"><h1 className="text-3xl font-bold">{inputs.company} PT 면접</h1><div className="mt-6 space-y-4"><p>{result.topic}</p><p>{result.script}</p></div></div> : <div className="flex items-center justify-center h-full text-slate-400">정보를 입력하세요</div>}
                </main>
                {result && <div className="absolute bottom-8 right-8 flex gap-3"><button onClick={handleDownload} className="bg-slate-900 text-white px-4 py-2 rounded">IMG</button><button onClick={handlePdfDownload} className="bg-red-600 text-white px-4 py-2 rounded">PDF</button></div>}
            </div>
            {toastMsg && <Toast message={toastMsg} onClose={()=>setToastMsg(null)}/>}
        </div>
    );
}

function SituationInterviewApp({ onClose }) {
    const [inputs, setInputs] = useState({ question: '' });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [toastMsg, setToastMsg] = useState(null);
    const reportRef = useRef(null);
    
    const handleGenerate = async () => {
        if (!inputs.question) return setToastMsg("질문을 입력해주세요.");
        setLoading(true);
        try {
            const prompt = `상황면접 질문: ${inputs.question}. 답변 가이드 JSON.`;
            const parsed = await fetchGemini(prompt);
            setResult(parsed);
        } catch(e) { setToastMsg(e.message); } finally { setLoading(false); }
    };
    
    const handleDownload = () => saveAsPng(reportRef, `상황면접`, setToastMsg);
    const handlePdfDownload = () => saveAsPdf(reportRef, `상황면접`, setToastMsg);

    return (
        <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col font-sans text-slate-800">
            <header className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md shrink-0"><div className="flex items-center gap-3"><Split className="text-teal-400"/><h1 className="font-bold text-lg">상황면접 가이드</h1></div><button onClick={onClose}><ChevronLeft/></button></header>
            <div className="flex flex-1 overflow-hidden">
                <aside className="w-80 bg-white border-r p-6"><textarea className="w-full border p-2 rounded h-32 mb-2" placeholder="면접 질문 입력" onChange={e=>setInputs({...inputs, question:e.target.value})}/><button onClick={handleGenerate} disabled={loading} className="w-full bg-teal-600 text-white py-3 rounded">{loading?<Loader2 className="animate-spin mx-auto"/>:"답변 생성"}</button></aside>
                <main className="flex-1 p-8 overflow-y-auto flex justify-center bg-slate-50">
                    {result ? <div ref={reportRef} className="w-[210mm] min-h-[297mm] bg-white shadow-2xl p-12 animate-in fade-in"><h1 className="text-2xl font-bold mb-4">Q. {inputs.question}</h1><div className="space-y-4"><div className="bg-slate-50 p-4 rounded"><b>답변 A</b><p>{result.answer_a}</p></div><div className="bg-slate-50 p-4 rounded"><b>답변 B</b><p>{result.answer_b}</p></div></div></div> : <div className="flex items-center justify-center h-full text-slate-400">질문을 입력하세요</div>}
                </main>
                {result && <div className="absolute bottom-8 right-8 flex gap-3"><button onClick={handleDownload} className="bg-slate-900 text-white px-4 py-2 rounded">IMG</button><button onClick={handlePdfDownload} className="bg-red-600 text-white px-4 py-2 rounded">PDF</button></div>}
            </div>
            {toastMsg && <Toast message={toastMsg} onClose={()=>setToastMsg(null)}/>}
        </div>
    );
}

function SelfIntroApp({ onClose }) {
    const [inputs, setInputs] = useState({ company: '', job: '' });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [toastMsg, setToastMsg] = useState(null);
    const reportRef = useRef(null);

    const handleGenerate = async () => {
        if (!inputs.company) return setToastMsg("기업명을 입력해주세요.");
        setLoading(true);
        try {
            const prompt = `1분 자기소개 스크립트. 기업:${inputs.company}, 직무:${inputs.job}. JSON 포맷.`;
            const parsed = await fetchGemini(prompt);
            setResult(parsed);
        } catch(e) { setToastMsg(e.message); } finally { setLoading(false); }
    };
    
    const handleDownload = () => saveAsPng(reportRef, `자기소개`, setToastMsg);
    const handlePdfDownload = () => saveAsPdf(reportRef, `자기소개`, setToastMsg);

    return (
        <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col font-sans text-slate-800">
            <header className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md shrink-0"><div className="flex items-center gap-3"><Mic className="text-purple-400"/><h1 className="font-bold text-lg">1분 자기소개</h1></div><button onClick={onClose}><ChevronLeft/></button></header>
            <div className="flex flex-1 overflow-hidden">
                <aside className="w-80 bg-white border-r p-6"><input className="w-full border p-2 rounded mb-2" placeholder="기업명" onChange={e=>setInputs({...inputs, company:e.target.value})}/><input className="w-full border p-2 rounded mb-2" placeholder="직무" onChange={e=>setInputs({...inputs, job:e.target.value})}/><button onClick={handleGenerate} disabled={loading} className="w-full bg-purple-600 text-white py-3 rounded">{loading?<Loader2 className="animate-spin mx-auto"/>:"스크립트 생성"}</button></aside>
                <main className="flex-1 p-8 overflow-y-auto flex justify-center bg-slate-50">
                    {result ? <div ref={reportRef} className="w-[210mm] min-h-[297mm] bg-white shadow-2xl p-12 animate-in fade-in"><h1 className="text-3xl font-bold text-center mb-6">1분 자기소개</h1><div className="text-lg leading-loose space-y-4"><p><b>Opening:</b> {result.opening}</p><p><b>Body:</b> {result.body}</p><p><b>Closing:</b> {result.closing}</p></div></div> : <div className="flex items-center justify-center h-full text-slate-400">정보를 입력하세요</div>}
                </main>
                {result && <div className="absolute bottom-8 right-8 flex gap-3"><button onClick={handleDownload} className="bg-slate-900 text-white px-4 py-2 rounded">IMG</button><button onClick={handlePdfDownload} className="bg-red-600 text-white px-4 py-2 rounded">PDF</button></div>}
            </div>
            {toastMsg && <Toast message={toastMsg} onClose={()=>setToastMsg(null)}/>}
        </div>
    );
}

function ExperienceStructuringApp({ onClose }) {
    const [inputs, setInputs] = useState({ desc: '' });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [toastMsg, setToastMsg] = useState(null);
    const reportRef = useRef(null);

    const handleGenerate = async () => {
        if (!inputs.desc) return setToastMsg("경험 내용을 입력해주세요.");
        setLoading(true);
        try {
            const prompt = `경험 STAR 구조화. 내용:${inputs.desc}. JSON 포맷.`;
            const parsed = await fetchGemini(prompt);
            setResult(parsed);
        } catch(e) { setToastMsg(e.message); } finally { setLoading(false); }
    };
    
    const handleDownload = () => saveAsPng(reportRef, `STAR`, setToastMsg);
    const handlePdfDownload = () => saveAsPdf(reportRef, `STAR`, setToastMsg);

    return (
        <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col font-sans text-slate-800">
            <header className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md shrink-0"><div className="flex items-center gap-3"><LayoutList className="text-indigo-400"/><h1 className="font-bold text-lg">STAR 경험 구조화</h1></div><button onClick={onClose}><ChevronLeft/></button></header>
            <div className="flex flex-1 overflow-hidden">
                <aside className="w-80 bg-white border-r p-6"><textarea className="w-full border p-2 rounded h-40 mb-2" placeholder="경험 내용 서술" onChange={e=>setInputs({...inputs, desc:e.target.value})}/><button onClick={handleGenerate} disabled={loading} className="w-full bg-indigo-600 text-white py-3 rounded">{loading?<Loader2 className="animate-spin mx-auto"/>:"구조화"}</button></aside>
                <main className="flex-1 p-8 overflow-y-auto flex justify-center bg-slate-50">
                    {result ? <div ref={reportRef} className="w-[210mm] min-h-[297mm] bg-white shadow-2xl p-12 animate-in fade-in"><h1 className="text-3xl font-bold mb-6">STAR Analysis</h1><div className="space-y-4"><div className="bg-slate-50 p-4 border-l-4 border-slate-400"><b>S (Situation)</b><p>{result.s}</p></div><div className="bg-slate-50 p-4 border-l-4 border-slate-400"><b>T (Task)</b><p>{result.t}</p></div><div className="bg-slate-50 p-4 border-l-4 border-indigo-500"><b>A (Action)</b><p>{result.a}</p></div><div className="bg-slate-50 p-4 border-l-4 border-indigo-700"><b>R (Result)</b><p>{result.r}</p></div></div></div> : <div className="flex items-center justify-center h-full text-slate-400">경험을 입력하세요</div>}
                </main>
                {result && <div className="absolute bottom-8 right-8 flex gap-3"><button onClick={handleDownload} className="bg-slate-900 text-white px-4 py-2 rounded">IMG</button><button onClick={handlePdfDownload} className="bg-red-600 text-white px-4 py-2 rounded">PDF</button></div>}
            </div>
            {toastMsg && <Toast message={toastMsg} onClose={()=>setToastMsg(null)}/>}
        </div>
    );
}

function RoleModelGuideApp({ onClose }) {
    const [inputs, setInputs] = useState({ name: '' });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [toastMsg, setToastMsg] = useState(null);
    const reportRef = useRef(null);

    const handleGenerate = async () => {
        if (!inputs.name) return setToastMsg("이름을 입력해주세요.");
        setLoading(true);
        try {
            const prompt = `롤모델 '${inputs.name}' 분석. 업적, 어록, 배울점. JSON 포맷.`;
            const parsed = await fetchGemini(prompt);
            setResult({ ...parsed, name: inputs.name });
        } catch(e) { setToastMsg(e.message); } finally { setLoading(false); }
    };
    
    const handleDownload = () => saveAsPng(reportRef, `롤모델`, setToastMsg);
    const handlePdfDownload = () => saveAsPdf(reportRef, `롤모델`, setToastMsg);

    return (
        <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col font-sans text-slate-800">
            <header className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md shrink-0"><div className="flex items-center gap-3"><Award className="text-orange-400"/><h1 className="font-bold text-lg">롤모델 분석</h1></div><button onClick={onClose}><ChevronLeft/></button></header>
            <div className="flex flex-1 overflow-hidden">
                <aside className="w-80 bg-white border-r p-6"><input className="w-full border p-2 rounded mb-4" placeholder="인물 이름" onChange={e=>setInputs({...inputs, name:e.target.value})}/><button onClick={handleGenerate} disabled={loading} className="w-full bg-orange-600 text-white py-3 rounded">{loading?<Loader2 className="animate-spin mx-auto"/>:"분석 시작"}</button></aside>
                <main className="flex-1 p-8 overflow-y-auto flex justify-center bg-slate-50">
                    {result ? <div ref={reportRef} className="w-[210mm] min-h-[297mm] bg-white shadow-2xl p-12 animate-in fade-in"><div className="border-b-4 border-orange-500 pb-4 mb-6"><h1 className="text-4xl font-bold">{result.name}</h1><p className="text-lg text-slate-500">{result.role}</p></div><div className="space-y-6"><div className="flex gap-4"><div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center"><User className="text-orange-600"/></div><p className="flex-1 text-lg leading-relaxed">{result.intro}</p></div><div className="bg-orange-50 p-6 rounded-xl italic font-serif text-xl text-center">"{result.quotes}"</div></div></div> : <div className="flex items-center justify-center h-full text-slate-400">이름을 입력하세요</div>}
                </main>
                {result && <div className="absolute bottom-8 right-8 flex gap-3"><button onClick={handleDownload} className="bg-slate-900 text-white px-4 py-2 rounded">IMG</button><button onClick={handlePdfDownload} className="bg-red-600 text-white px-4 py-2 rounded">PDF</button></div>}
            </div>
            {toastMsg && <Toast message={toastMsg} onClose={()=>setToastMsg(null)}/>}
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
  const [newExpertEmail, setNewExpertEmail] = useState('');
  const [newExpertName, setNewExpertName] = useState(''); 
  const [newExpertOrg, setNewExpertOrg] = useState(''); 

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

  const handleAddExpert = async (e) => {
    e.preventDefault();
    if(!newExpertEmail || !newExpertName) return;
    await addDoc(collection(db, 'artifacts', APP_ID, 'public', 'data', 'authorized_experts'), {
      email: newExpertEmail, displayName: newExpertName, organization: newExpertOrg, addedAt: new Date().toISOString()
    });
    setNewExpertEmail(''); setNewExpertName(''); setNewExpertOrg('');
    showToast("전문가가 추가되었습니다.");
  };

  const handleDeleteExpert = async (id) => {
    if(window.confirm("삭제하시겠습니까?")) {
      await deleteDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'authorized_experts', id));
      showToast("삭제되었습니다.");
    }
  };

  const handleExportCSV = () => {
    if(experts.length === 0) return showToast("내보낼 데이터가 없습니다.");
    const BOM = "\uFEFF"; 
    const headers = ['이름,이메일,소속기관,등록일,최근접속'];
    const rows = experts.map(ex => [`"${ex.displayName}"`, `"${ex.email}"`, `"${ex.organization||'-'}"`, `"${ex.addedAt?.split('T')[0]}"`, `"${ex.lastLogin?.split('T')[0]}"`].join(','));
    const blob = new Blob([BOM + headers.concat(rows).join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `전문가목록.csv`;
    link.click();
  };

  if (!user || role === 'guest') return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
      <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
        <h1 className="text-3xl font-bold mb-2 text-slate-900">Career Vitamin</h1>
        <p className="text-slate-500 mb-6">전문가 전용 AI 솔루션</p>
        {!user ? <button onClick={()=>signInWithPopup(auth, new GoogleAuthProvider())} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold">Google 로그인</button> 
               : <button onClick={()=>signOut(auth)} className="w-full bg-slate-200 py-3 rounded-xl font-bold">로그아웃</button>}
      </div>
    </div>
  );
  
  const internalApps = Object.entries(SERVICES).filter(([_, svc]) => svc.internal);
  const externalApps = Object.entries(SERVICES).filter(([_, svc]) => !svc.internal);

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-700 flex items-center gap-3"><LayoutDashboard className="text-white w-6 h-6"/><div><h1 className="font-bold text-lg">Career Vitamin</h1><p className="text-[11px] text-indigo-200">커리어 AI 대시보드</p></div></div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={()=>setActiveTab('dashboard')} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 ${activeTab==='dashboard'?'bg-indigo-600 text-white':'text-slate-400 hover:bg-slate-800'}`}><LayoutDashboard size={18}/> 대시보드</button>
          {role === 'owner' && <button onClick={()=>setActiveTab('admin')} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 ${activeTab==='admin'?'bg-indigo-600 text-white':'text-slate-400 hover:bg-slate-800'}`}><Settings size={18}/> 시스템 관리</button>}
        </nav>
        <div className="p-4 border-t border-slate-700"><div className="text-xs text-slate-500 mb-2 px-2">{role==='expert'?expertName:user.displayName}님 ({role})</div><button onClick={()=>signOut(auth)} className="w-full border border-slate-600 text-slate-400 py-2 rounded hover:bg-slate-800 flex items-center justify-center gap-2"><LogOut size={16}/> 로그아웃</button></div>
      </aside>
      
      <main className="flex-1 p-8 overflow-y-auto">
        {activeTab === 'dashboard' ? (
           <div className="space-y-8 animate-in fade-in">
             <div className={`bg-white p-6 rounded-xl shadow-sm border-2 ${!hasPersonalKey ? 'border-red-400' : 'border-indigo-100'}`}>
                <div className="flex justify-between items-start mb-4">
                    <h2 className="text-lg font-bold flex items-center gap-2 text-indigo-900"><Key size={20}/> AI 모델 설정</h2>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${hasPersonalKey ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{hasPersonalKey ? "등록 완료" : "등록 필수"}</div>
                </div>
                <div className="flex gap-2">
                  <input type="password" value={customKey} onChange={e=>setCustomKey(e.target.value)} className="flex-1 p-3 border rounded-lg" placeholder="Google API Key 입력" disabled={hasPersonalKey}/>
                  {!hasPersonalKey ? <button onClick={handleSavePersonalKey} className="bg-indigo-600 text-white px-6 rounded-lg font-bold">등록</button> : <button onClick={handleRemovePersonalKey} className="bg-red-100 text-red-600 border px-6 rounded-lg font-bold">재설정</button>}
                </div>
             </div>
             <div>
               <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2"><Sparkles className="text-indigo-600" size={20}/> 전용 AI 앱</h3>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {internalApps.map(([key, svc]) => (
                   <div key={key} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md border cursor-pointer" onClick={() => { if(!hasPersonalKey) return; setCurrentApp(key); }}>
                     <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${COLOR_VARIANTS[svc.color]}`}><svc.icon size={24}/></div>
                     <h3 className="font-bold text-lg mb-2">{svc.name}</h3>
                     <p className="text-sm text-slate-500 mb-4 h-10 line-clamp-2">{svc.desc}</p>
                     <div className="text-xs font-bold text-indigo-500 flex items-center">실행하기 <ChevronLeft className="rotate-180 ml-1 w-4 h-4"/></div>
                   </div>
                 ))}
               </div>
             </div>
             {hasPersonalKey && <div className="border-t my-2"></div>}
             <div>
               <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2"><ExternalLink className="text-slate-500" size={20}/> 외부 도구</h3>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {externalApps.map(([key, svc]) => (
                   <div key={key} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md border cursor-pointer" onClick={() => { if(!hasPersonalKey) return; window.open(svc.link, '_blank'); }}>
                     <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${COLOR_VARIANTS[svc.color]}`}><svc.icon size={24}/></div>
                     <h3 className="font-bold text-lg mb-2">{svc.name}</h3>
                     <p className="text-sm text-slate-500 mb-4 h-10 line-clamp-2">{svc.desc}</p>
                     <div className="text-xs font-bold text-slate-400 flex items-center">외부 링크 <ExternalLink className="ml-1 w-3 h-3"/></div>
                   </div>
                 ))}
               </div>
             </div>
           </div>
        ) : (
          <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold">전문가 관리</h2><button onClick={handleExportCSV} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"><FileSpreadsheet size={16}/> 목록 다운로드</button></div>
              <form onSubmit={handleAddExpert} className="flex gap-3 mb-6 bg-slate-50 p-4 rounded-lg">
                <input value={newExpertName} onChange={e=>setNewExpertName(e.target.value)} className="border p-2 rounded flex-1" placeholder="이름" required/>
                <input value={newExpertEmail} onChange={e=>setNewExpertEmail(e.target.value)} className="border p-2 rounded flex-1" placeholder="이메일" required/>
                <input value={newExpertOrg} onChange={e=>setNewExpertOrg(e.target.value)} className="border p-2 rounded flex-1" placeholder="소속" />
                <button className="bg-slate-800 text-white px-6 rounded font-bold">추가</button>
              </form>
              <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-slate-50"><tr><th className="p-3">이름</th><th className="p-3">이메일</th><th className="p-3">소속</th><th className="p-3">등록일</th><th className="p-3 text-right">관리</th></tr></thead><tbody className="divide-y">{experts.map(ex=><tr key={ex.id}><td className="p-3 font-bold">{ex.displayName}</td><td className="p-3">{ex.email}</td><td className="p-3">{ex.organization||'-'}</td><td className="p-3 text-xs">{ex.addedAt?.split('T')[0]}</td><td className="p-3 text-right"><button onClick={()=>handleDeleteExpert(ex.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button></td></tr>)}</tbody></table></div>
            </div>
          </div>
        )}
      </main>
      {currentApp === 'company_analysis' && <CompanyAnalysisApp onClose={()=>setCurrentApp('none')} />}
      {currentApp === 'career_roadmap' && <CareerRoadmapApp onClose={()=>setCurrentApp('none')} />}
      {currentApp === 'job_fit' && <JobFitScannerApp onClose={()=>setCurrentApp('none')} />}
      {currentApp === 'pt_interview' && <PtInterviewApp onClose={()=>setCurrentApp('none')} />}
      {currentApp === 'sit_interview' && <SituationInterviewApp onClose={()=>setCurrentApp('none')} />}
      {currentApp === 'self_intro' && <SelfIntroApp onClose={()=>setCurrentApp('none')} />}
      {currentApp === 'exp_structuring' && <ExperienceStructuringApp onClose={()=>setCurrentApp('none')} />}
      {currentApp === 'role_model' && <RoleModelGuideApp onClose={()=>setCurrentApp('none')} />}
      {currentApp === 'gpt_guide' && <JobExplorerApp onClose={()=>setCurrentApp('none')} />}
      {currentApp === 'holland_test' && <HollandTestApp onClose={()=>setCurrentApp('none')} />}
      {currentApp === 'rubric_clinic' && <CoverLetterClinicApp onClose={()=>setCurrentApp('none')} />}
    </div>
  );
}