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
      const firstBracket = cleaned.indexOf('[');
      const lastBracket = cleaned.lastIndexOf(']');

      if (firstBrace !== -1 && lastBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
         cleaned = cleaned.substring(firstBrace, lastBrace + 1);
      } else if (firstBracket !== -1 && lastBracket !== -1) {
         cleaned = cleaned.substring(firstBracket, lastBracket + 1);
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

    const originalElement = elementRef.current;
    const width = originalElement.offsetWidth;

    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = `${window.scrollY}px`;
    container.style.left = '0';
    container.style.width = `${width}px`;
    container.style.zIndex = '-9999';
    container.style.backgroundColor = '#ffffff'; 
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.overflow = 'visible';

    document.body.appendChild(container);

    const clone = originalElement.cloneNode(true);
    
    clone.style.cssText = `
      height: auto !important;
      max-height: none !important;
      min-height: auto !important;
      overflow: visible !important;
      width: 100% !important;
      margin: 0 !important;
      transform: none !important;
      box-shadow: none !important;
      border-radius: 0 !important;
      background-color: transparent !important;
    `;
    
    container.appendChild(clone);

    await new Promise(resolve => setTimeout(resolve, 500));

    const fullHeight = container.scrollHeight;
    container.style.height = `${fullHeight}px`;

    const canvas = await window.html2canvas(container, {
      scale: 2, 
      useCORS: true,
      logging: false,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: width,
      height: fullHeight,
      windowWidth: width,
      windowHeight: fullHeight + 100,
      x: 0,
      y: window.scrollY,
      scrollX: 0,
      scrollY: 0
    });
    
    document.body.removeChild(container);
    
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

// [PDF 저장 함수 - 통으로 저장]
const saveAsPdf = async (elementRef, fileName, showToast) => {
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

    if (!window.jspdf) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    if(showToast) showToast("PDF 변환 중입니다. 잠시만 기다려주세요...");

    const element = elementRef.current;
    
    const canvas = await window.html2canvas(element, {
      scale: 2, 
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const { jsPDF } = window.jspdf;
    
    const pdfWidth = 210;
    const imgProps = { width: canvas.width, height: canvas.height };
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    const pdf = new jsPDF('p', 'mm', [pdfWidth, pdfHeight]);
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    
    pdf.save(`${fileName}.pdf`);
    if(showToast) showToast("PDF가 성공적으로 저장되었습니다.");

  } catch (error) {
    console.error("PDF 저장 실패:", error);
    if(showToast) showToast("PDF 저장 중 오류가 발생했습니다. (브라우저 제한일 수 있습니다)");
  }
};

// AI 키 관리 로직 (Retry 기능 및 파일 업로드 지원)
const fetchGemini = async (prompt, attachments = []) => {
  let apiKey = localStorage.getItem("custom_gemini_key");

  if (!apiKey) {
    throw new Error("🚨 API 키가 없습니다. [대시보드] 상단에서 본인의 Google API 키를 먼저 등록해주세요.");
  }
  
  const models = ["gemini-1.5-flash", "gemini-2.0-flash-exp", "gemini-2.5-flash-preview-09-2025"];
  let lastError = null;

  const jsonInstruction = `
  IMPORTANT: You must return the result strictly as a valid JSON string. 
  Do not wrap the JSON in markdown code blocks (like \`\`\`json ... \`\`\`).
  Do not include any explanations or extra text outside the JSON object.
  If searching, use the latest information found.
  `;

  const finalPrompt = prompt + jsonInstruction;

  // Build parts array with text and attachments
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

  for (const model of models) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`AI 호출 시도: ${model} (${attempt}회차)`);
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: parts }],
            // tools: [{ google_search: {} }], // Search not typically needed for file analysis, enabling generally
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          const status = response.status;
          
          if (status === 429 || status === 503) {
             console.warn(`Model ${model} busy (Status ${status}). Retrying...`);
             await new Promise(resolve => setTimeout(resolve, 2000));
             continue;
          }
          if (status === 404) break;

          throw new Error(errData.error?.message || `HTTP Error ${status}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        const parsed = safeJsonParse(text);
        if (!parsed) {
          console.warn("JSON 파싱 실패, 재시도합니다.", text);
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        return parsed;
      } catch (e) {
        console.warn(`${model} 오류 (${attempt}회차):`, e);
        lastError = e;
        if (e.message.includes("API key")) throw e; 
      }
    }
  }
  throw lastError || new Error("모든 AI 모델 연결에 실패했습니다. (개인 키를 확인하거나 잠시 후 다시 시도하세요)");
};

const EditableContent = ({ value, onSave, className }) => {
  return (
    <div
      contentEditable
      suppressContentEditableWarning
      className={`whitespace-pre-wrap outline-none focus:bg-yellow-50/50 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-200 rounded transition-all cursor-text ${className}`}
      onBlur={(e) => onSave(e.currentTarget.innerText)}
    >
      {renderText(value)}
    </div>
  );
};

// --- Constants ---
const SERVICES = {
  // [전용 앱]
  company_analysis: { name: "[AI] 기업분석 리포트", desc: "기업 핵심가치/이슈/SWOT 분석", link: null, internal: true, icon: BarChart3, color: "indigo" },
  career_roadmap: { name: "[AI] 커리어 로드맵", desc: "5년/10년 후 경력 목표 설계", link: null, internal: true, icon: TrendingUp, color: "blue" },
  job_fit: { name: "[AI] 직무 적합도 진단", desc: "채용공고(JD)와 내 서류 매칭 분석", link: null, internal: true, icon: Percent, color: "rose" }, // NEW
  pt_interview: { name: "[AI] PT 면접 가이드", desc: "주제 추출 및 발표 대본 생성", link: null, internal: true, icon: MonitorPlay, color: "rose" },
  sit_interview: { name: "[AI] 상황면접 가이드", desc: "상황별 구조화된 답변 생성", link: null, internal: true, icon: Split, color: "teal" },
  self_intro: { name: "[AI] 1분 자기소개", desc: "직무/인성 컨셉 맞춤 스크립트", link: null, internal: true, icon: Mic, color: "purple" },
  exp_structuring: { name: "[AI] 경험 구조화 (STAR)", desc: "경험 정리 및 핵심 역량 도출", link: null, internal: true, icon: LayoutList, color: "indigo" },
  role_model: { name: "[AI] 롤모델 분석", desc: "인물 정보 및 면접 활용 팁", link: null, internal: true, icon: Award, color: "orange" },
  gpt_guide: { name: "[AI] 직업 탐색 가이드", desc: "관심 있는 직업/직무 분석 및 가이드", link: null, internal: true, icon: Compass, color: "emerald" },
  holland_test: { name: "[AI] 홀랜드 검사 리포트", desc: "RIASEC 검사 결과 분석 및 직업 추천", link: null, internal: true, icon: ClipboardList, color: "pink" },
  
  // [외부 도구]
  card_bot: { name: "[노트북LM] 커리어스타일 챗봇", desc: "유료 프로그램 전용 챗봇", link: "https://notebooklm.google.com/notebook/595da4c0-fcc1-4064-82c8-9901e6dd8772", internal: false, icon: MessageSquare, color: "violet" },
  rubric_clinic: { name: "[Gem] 자소서 코칭 클리닉", desc: "유료 워크숍 전용", link: "https://gemini.google.com/gem/1jXo4wyUvzepwmP_diVl-FQzg05EkexIg?usp=sharing", internal: false, icon: Stethoscope, color: "cyan" },
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

// ... (Existing Sub Apps: HollandTestApp, CompanyAnalysisApp, etc. should be here) ...

// [NEW] 직무 적합도 진단 앱 (Job Fit Report)
function JobFitScannerApp({ onClose }) {
  const [inputs, setInputs] = useState({ company: '', url: '', job: '' });
  const [jdFile, setJdFile] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const reportRef = useRef(null);

  const showToast = (msg) => setToastMsg(msg);

  const handleFileChange = (e, setFile) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Remove data:image/...;base64, prefix
        const base64Data = reader.result.split(',')[1];
        setFile({
          mimeType: file.type,
          data: base64Data,
          name: file.name
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAIAnalysis = async () => {
    if (!inputs.company || !inputs.job) return showToast("기업명과 직무를 입력해주세요.");
    if (!jdFile) return showToast("채용공고(JD) 파일을 업로드해주세요.");
    if (!resumeFile) return showToast("지원자 서류를 업로드해주세요.");
    
    setLoading(true);
    try {
      const prompt = `당신은 채용 담당자이자 커리어 코치입니다.
      
      [분석 대상]
      1. 기업명: ${inputs.company}
      2. 홈페이지: ${inputs.url || 'N/A'}
      3. 지원 직무: ${inputs.job}
      4. 첨부된 채용공고(JD)와 지원자의 이력서/자소서를 비교 분석해주세요.

      [요청 사항]
      채용공고의 요건(자격요건, 우대사항 등)과 지원자의 역량(경력, 스킬, 경험)을 면밀히 대조하여 직무 적합도를 진단하고 합격 전략을 제시해주세요.

      반드시 다음 JSON 형식을 따를 것:
      {
        "score": 85,
        "score_comment": "점수에 대한 한 줄 평 (예: 서류 통과 가능성이 높습니다 / 보완이 시급합니다)",
        "fit_analysis": {
          "strong": "지원자가 완벽하게 충족하는 강점 요소 (구체적으로)",
          "missing": "공고에는 있으나 지원자 서류에서 부족하거나 누락된 부분"
        },
        "gap_strategy": "부족한 점을 보완하고 합격률을 높이기 위해 서류에 추가해야 할 구체적인 키워드나 문장 전략 (3가지 이상)",
        "interview_prep": [
          "예상 꼬리 질문 1 (약점 검증용)",
          "예상 꼬리 질문 2 (강점 확인용)",
          "예상 꼬리 질문 3 (직무 적합성 확인용)"
        ],
        "overall_comment": "냉정한 합격 가능성 예측 및 조언 총평"
      }`;

      // Attach files
      const attachments = [jdFile, resumeFile];
      const parsed = await fetchGemini(prompt, attachments);
      setResult(parsed);
    } catch (e) { showToast(e.message); } finally { setLoading(false); }
  };

  const handleEdit = (section, key, value, index) => {
    setResult(prev => {
        const newData = { ...prev };
        if (section === 'fit_analysis' || section === 'interview_prep') { // Handle specific nested/array structures
            if(Array.isArray(newData[section])) {
                 newData[section][index] = value;
            } else {
                 newData[section][key] = value;
            }
        } else {
            newData[section] = value; // Simple top-level keys
        }
        return newData;
    });
  };

  const handleDownload = () => saveAsPng(reportRef, `적합도진단_${inputs.company}`, showToast);
  const handlePdfDownload = () => saveAsPdf(reportRef, `적합도진단_${inputs.company}`, showToast);

  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col font-sans text-slate-800">
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
      <header className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md shrink-0">
        <div className="flex items-center gap-3"><FileText className="text-rose-400"/><h1 className="font-bold text-lg">직무 적합도 진단 리포트</h1></div>
        <button onClick={onClose} className="flex items-center text-sm hover:text-rose-200 transition-colors"><ChevronLeft className="w-5 h-5 mr-1"/> 돌아가기</button>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 bg-white border-r p-6 shrink-0 overflow-y-auto">
          <div className="space-y-6">
            <h3 className="font-bold text-sm text-rose-700 flex items-center uppercase tracking-wider"><Settings size={16} className="mr-2"/> 진단 설정</h3>
            
            <div className="space-y-3">
               <input value={inputs.company} onChange={e=>setInputs({...inputs, company:e.target.value})} className="w-full p-3 border rounded-lg text-sm" placeholder="목표 기업명" />
               <input value={inputs.url} onChange={e=>setInputs({...inputs, url:e.target.value})} className="w-full p-3 border rounded-lg text-sm" placeholder="홈페이지 URL (선택)" />
               <input value={inputs.job} onChange={e=>setInputs({...inputs, job:e.target.value})} className="w-full p-3 border rounded-lg text-sm font-bold" placeholder="지원 직무명" />
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-4">
               <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">채용공고 (JD) 업로드</label>
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          {jdFile ? (
                              <><FileCheck className="w-8 h-8 text-green-500 mb-1"/><p className="text-xs text-slate-500 truncate w-4/5 text-center">{jdFile.name}</p></>
                          ) : (
                              <><UploadCloud className="w-8 h-8 text-slate-400 mb-1"/><p className="text-xs text-slate-500">이미지 또는 PDF</p></>
                          )}
                      </div>
                      <input type="file" className="hidden" accept="image/*,application/pdf" onChange={(e)=>handleFileChange(e, setJdFile)} />
                  </label>
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">내 서류 (이력서/자소서)</label>
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          {resumeFile ? (
                              <><FileCheck className="w-8 h-8 text-green-500 mb-1"/><p className="text-xs text-slate-500 truncate w-4/5 text-center">{resumeFile.name}</p></>
                          ) : (
                              <><UploadCloud className="w-8 h-8 text-slate-400 mb-1"/><p className="text-xs text-slate-500">이미지 또는 PDF</p></>
                          )}
                      </div>
                      <input type="file" className="hidden" accept="image/*,application/pdf" onChange={(e)=>handleFileChange(e, setResumeFile)} />
                  </label>
               </div>
            </div>

            <button onClick={handleAIAnalysis} disabled={loading} className="w-full bg-rose-600 text-white py-3.5 rounded-xl font-bold mt-2 shadow-lg disabled:bg-slate-400">{loading ? <Loader2 className="animate-spin mx-auto"/> : "적합도 진단 시작"}</button>
          </div>
        </aside>
        <main className="flex-1 p-8 overflow-y-auto flex justify-center bg-slate-50">
          {result ? (
            <div ref={reportRef} className="w-[210mm] min-h-[297mm] h-fit bg-white shadow-2xl p-12 flex flex-col animate-in fade-in zoom-in-95 duration-500">
              <div className="border-b-4 border-rose-500 pb-6 mb-8 flex justify-between items-end">
                <div>
                    <span className="bg-rose-100 text-rose-800 px-3 py-1 rounded-full text-xs font-bold tracking-wider mb-3 inline-block">JOB FIT REPORT</span>
                    <h1 className="text-4xl font-extrabold text-slate-900">{inputs.company}</h1>
                    <p className="text-lg text-slate-500 mt-2">{inputs.job} 직무 적합도 분석</p>
                </div>
                <div className="text-right">
                    <div className="text-5xl font-black text-rose-600">{result.score}<span className="text-2xl text-slate-400">/100</span></div>
                    <EditableContent className="text-sm text-slate-500 font-medium" value={result.score_comment} onSave={(v)=>handleEdit('score_comment', null, v)} />
                </div>
              </div>

              <div className="space-y-8">
                {/* 1. 매칭 분석 */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                        <h3 className="font-bold text-blue-800 mb-3 flex items-center"><ThumbsUp size={18} className="mr-2"/> Strong Point (강점)</h3>
                        <EditableContent className="text-sm text-slate-700 leading-relaxed" value={result.fit_analysis?.strong} onSave={(v)=>handleEdit('fit_analysis', 'strong', v)} />
                    </div>
                    <div className="bg-red-50 p-6 rounded-xl border border-red-100">
                        <h3 className="font-bold text-red-800 mb-3 flex items-center"><AlertCircle size={18} className="mr-2"/> Missing Point (누락/부족)</h3>
                        <EditableContent className="text-sm text-slate-700 leading-relaxed" value={result.fit_analysis?.missing} onSave={(v)=>handleEdit('fit_analysis', 'missing', v)} />
                    </div>
                </section>

                {/* 2. 갭 채우기 전략 */}
                <section>
                    <h3 className="text-xl font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200 flex items-center"><Target size={20} className="mr-2 text-rose-600"/> Gap Filling Strategy</h3>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <EditableContent className="text-slate-700 leading-loose" value={result.gap_strategy} onSave={(v)=>handleEdit('gap_strategy', null, v)} />
                    </div>
                </section>

                {/* 3. 예상 꼬리 질문 */}
                <section>
                    <h3 className="text-xl font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200 flex items-center"><MessageSquare size={20} className="mr-2 text-rose-600"/> Interview Prep (예상 질문)</h3>
                    <div className="space-y-3">
                        {result.interview_prep?.map((q, i) => (
                            <div key={i} className="flex gap-3 bg-slate-50 p-4 rounded-lg">
                                <span className="font-bold text-rose-500">Q{i+1}.</span>
                                <EditableContent className="flex-1 text-slate-700 font-medium" value={q} onSave={(v)=>handleEdit('interview_prep', null, v, i)} />
                            </div>
                        ))}
                    </div>
                </section>

                {/* 4. 총평 */}
                <section className="bg-slate-800 p-6 rounded-xl text-white mt-4">
                    <h3 className="font-bold text-rose-400 mb-2 flex items-center"><BrainCircuit size={18} className="mr-2"/> Overall Comment</h3>
                    <EditableContent className="text-slate-200 leading-relaxed text-sm" value={result.overall_comment} onSave={(v)=>handleEdit('overall_comment', null, v)} />
                </section>
              </div>

              <div className="mt-12 pt-6 border-t border-slate-200 flex justify-between items-center text-xs text-slate-400 mt-auto">
                <div className="flex items-center"><Percent className="w-4 h-4 mr-1 text-rose-500" /><span>Career Vitamin</span></div>
                <span>AI-Powered Job Fit Scanner</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Percent size={64} className="mb-4 opacity-20"/>
              <p>JD와 이력서를 업로드하여 진단을 시작하세요.</p>
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

// ... (HollandTestApp and other apps should be below) ...

function HollandTestApp({ onClose }) {
  const [scores, setScores] = useState({ R: '', I: '', A: '', S: '', E: '', C: '' });
  const [jobs, setJobs] = useState({ job1: '', job2: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const reportRef = useRef(null);

  const showToast = (msg) => setToastMsg(msg);

  const getTypeFullName = (code) => {
    const map = { R: '현실형 (Realistic)', I: '탐구형 (Investigative)', A: '예술형 (Artistic)', S: '사회형 (Social)', E: '진취형 (Enterprising)', C: '관습형 (Conventional)' };
    return map[code] || code;
  };

  const handleAIAnalysis = async () => {
    if (Object.values(scores).some(v => v === '')) return showToast("모든 유형의 표준점수를 입력해주세요.");
    
    setLoading(true);
    try {
      const sortedScores = Object.entries(scores)
        .map(([code, score]) => ({ code, score: Number(score) }))
        .sort((a, b) => b.score - a.score);

      const top3 = sortedScores.slice(0, 3).map(s => s.code).join('');
      const scoreText = sortedScores.map(s => `${s.code}=${s.score}`).join(', ');

      const prompt = `당신은 진로 상담 전문가입니다. 내담자의 홀랜드(RIASEC) 검사 결과와 관심 직업을 바탕으로 상세 분석 리포트를 작성해주세요.

      [검사 결과]
      - 표준점수: ${scoreText}
      - 1순위 유형: ${getTypeFullName(sortedScores[0].code)} (${sortedScores[0].code})
      - 2순위 유형: ${getTypeFullName(sortedScores[1].code)} (${sortedScores[1].code})
      - 3순위 유형: ${getTypeFullName(sortedScores[2].code)} (${sortedScores[2].code})
      
      [점수 해석 기준 (표준점수)]
      - 40점 이하: 낮음 (-)
      - 41~59점: 중간 (=)
      - 60점 이상: 높음 (+)

      [관심 직업]
      - 1지망: ${jobs.job1 || '없음'}
      - 2지망: ${jobs.job2 || '없음'}
      
      다음 JSON 형식을 반드시 따를 것:
      {
        "overview": "홀랜드 흥미 검사의 개요 및 의의 (2-3문장)",
        "rank_table": [
          {"rank": 1, "type": "${getTypeFullName(sortedScores[0].code)}", "score": ${sortedScores[0].score}, "desc": "해당 유형의 특징 및 의미"},
          {"rank": 2, "type": "${getTypeFullName(sortedScores[1].code)}", "score": ${sortedScores[1].score}, "desc": "해당 유형의 특징 및 의미"},
          {"rank": 3, "type": "${getTypeFullName(sortedScores[2].code)}", "score": ${sortedScores[2].score}, "desc": "해당 유형의 특징 및 의미"},
          {"rank": 4, "type": "${getTypeFullName(sortedScores[3].code)}", "score": ${sortedScores[3].score}, "desc": "해당 유형의 특징 및 의미"},
          {"rank": 5, "type": "${getTypeFullName(sortedScores[4].code)}", "score": ${sortedScores[4].score}, "desc": "해당 유형의 특징 및 의미"},
          {"rank": 6, "type": "${getTypeFullName(sortedScores[5].code)}", "score": ${sortedScores[5].score}, "desc": "해당 유형의 특징 및 의미"}
        ],
        "analysis": {
          "strength": "나의 강점 (1,2순위 유형 기반으로 상세히)",
          "weakness": "나의 약점 (하위 유형 및 점수 불균형 등 고려)",
          "complement": "보완할 점 및 조언"
        },
        "job_match": {
          "job1_match": "관심직업1(${jobs.job1 || '미입력'})과 내 유형(${top3})의 매칭도 분석 및 설명",
          "job2_match": "관심직업2(${jobs.job2 || '미입력'})와 내 유형(${top3})의 매칭도 분석 및 설명"
        }
      }`;

      const parsed = await fetchGemini(prompt);
      setResult(parsed);
    } catch (e) { showToast(e.message); } finally { setLoading(false); }
  };

  const handleEdit = (section, key, value, index = null) => {
    setResult(prev => {
      const newData = { ...prev };
      if (Array.isArray(newData[section])) {
        newData[section][index][key] = value;
      } else if (newData[section] && typeof newData[section] === 'object') {
        newData[section][key] = value;
      } else {
        newData[section] = value;
      }
      return newData;
    });
  };

  const handleDownload = () => saveAsPng(reportRef, `홀랜드리포트`, showToast);
  const handlePdfDownload = () => saveAsPdf(reportRef, `홀랜드리포트`, showToast);

  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col font-sans text-slate-800">
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
      <header className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md shrink-0">
        <div className="flex items-center gap-3"><ClipboardList className="text-pink-400"/><h1 className="font-bold text-lg">홀랜드 검사 리포트</h1></div>
        <button onClick={onClose} className="flex items-center text-sm hover:text-pink-200 transition-colors"><ChevronLeft className="w-5 h-5 mr-1"/> 돌아가기</button>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 bg-white border-r p-6 shrink-0 overflow-y-auto">
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-sm text-pink-700 flex items-center uppercase tracking-wider mb-2"><Settings size={16} className="mr-2"/> 점수 입력 (표준점수)</h3>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-600 mb-4">
                 <div className="flex justify-between mb-1"><span>📉 낮음 (-)</span> <span className="font-bold">40 이하</span></div>
                 <div className="flex justify-between mb-1"><span>➖ 중간 (=)</span> <span className="font-bold">41 ~ 59</span></div>
                 <div className="flex justify-between"><span>📈 높음 (+)</span> <span className="font-bold">60 이상</span></div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {['R', 'I', 'A', 'S', 'E', 'C'].map(code => (
                <div key={code}>
                  <label className="block text-xs font-bold text-slate-500 mb-1">{
                    code === 'R' ? '현실형 (R)' : 
                    code === 'I' ? '탐구형 (I)' : 
                    code === 'A' ? '예술형 (A)' : 
                    code === 'S' ? '사회형 (S)' : 
                    code === 'E' ? '진취형 (E)' : '관습형 (C)'
                  }</label>
                  <input 
                    type="number" 
                    value={scores[code]} 
                    onChange={e=>setScores({...scores, [code]: e.target.value})} 
                    className="w-full p-2 border rounded-lg text-center font-bold text-slate-700 focus:border-pink-500 outline-none" 
                    placeholder="0"
                  />
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100">
               <h4 className="font-bold text-xs text-slate-500 mb-2">관심 직업</h4>
               <input value={jobs.job1} onChange={e=>setJobs({...jobs, job1: e.target.value})} className="w-full p-2 border rounded-lg text-sm mb-2" placeholder="1순위 희망 직업" />
               <input value={jobs.job2} onChange={e=>setJobs({...jobs, job2: e.target.value})} className="w-full p-2 border rounded-lg text-sm" placeholder="2순위 희망 직업" />
            </div>

            <button onClick={handleAIAnalysis} disabled={loading} className="w-full bg-pink-600 text-white py-3.5 rounded-xl font-bold mt-2 shadow-lg disabled:bg-slate-400">{loading ? <Loader2 className="animate-spin mx-auto"/> : "리포트 생성"}</button>
          </div>
        </aside>
        <main className="flex-1 p-8 overflow-y-auto flex justify-center bg-slate-50">
          {result ? (
            <div ref={reportRef} className="w-[210mm] min-h-[297mm] h-fit bg-white shadow-2xl p-12 flex flex-col animate-in fade-in zoom-in-95 duration-500">
              <div className="border-b-4 border-pink-500 pb-6 mb-8">
                <span className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-xs font-bold tracking-wider mb-3 inline-block">HOLLAND REPORT</span>
                <h1 className="text-4xl font-extrabold text-slate-900">홀랜드 흥미 검사 분석</h1>
                <EditableContent className="text-lg text-slate-500 mt-2" value={result.overview} onSave={(v)=>handleEdit('overview', null, v)} />
              </div>

              <div className="space-y-8">
                {/* 1. 순위표 */}
                <section>
                   <h3 className="text-xl font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200 flex items-center"><BarChart3 size={20} className="mr-2 text-pink-600"/> 유형별 점수 및 순위</h3>
                   <div className="overflow-hidden rounded-xl border border-slate-200">
                     <table className="w-full text-sm text-left">
                       <thead className="bg-slate-100 text-slate-600 font-bold">
                         <tr>
                           <th className="px-4 py-3 w-16 text-center">순위</th>
                           <th className="px-4 py-3 w-32">유형</th>
                           <th className="px-4 py-3 w-20 text-center">점수</th>
                           <th className="px-4 py-3">의미 및 특징</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                         {result.rank_table?.map((row, i) => (
                           <tr key={i} className={i < 2 ? "bg-pink-50/50" : "bg-white"}>
                             <td className="px-4 py-3 text-center font-bold text-slate-500">{row.rank}</td>
                             <td className={`px-4 py-3 font-bold ${i < 2 ? 'text-pink-700' : 'text-slate-700'}`}>{row.type}</td>
                             <td className="px-4 py-3 text-center font-bold">{row.score}</td>
                             <td className="px-4 py-3 text-slate-600"><EditableContent value={row.desc} onSave={(v)=>handleEdit('rank_table', 'desc', v, i)} /></td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                </section>

                {/* 2. 강점/약점 */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div className="bg-blue-50 p-5 rounded-xl">
                      <h4 className="font-bold text-blue-800 mb-3 flex items-center"><Smile className="mr-2" size={18}/> 나의 강점</h4>
                      <EditableContent className="text-sm text-slate-700 leading-relaxed" value={result.analysis?.strength} onSave={(v)=>handleEdit('analysis', 'strength', v)} />
                   </div>
                   <div className="bg-orange-50 p-5 rounded-xl">
                      <h4 className="font-bold text-orange-800 mb-3 flex items-center"><Meh className="mr-2" size={18}/> 나의 약점</h4>
                      <EditableContent className="text-sm text-slate-700 leading-relaxed" value={result.analysis?.weakness} onSave={(v)=>handleEdit('analysis', 'weakness', v)} />
                   </div>
                   <div className="bg-emerald-50 p-5 rounded-xl">
                      <h4 className="font-bold text-emerald-800 mb-3 flex items-center"><Target className="mr-2" size={18}/> 보완할 점</h4>
                      <EditableContent className="text-sm text-slate-700 leading-relaxed" value={result.analysis?.complement} onSave={(v)=>handleEdit('analysis', 'complement', v)} />
                   </div>
                </section>

                {/* 3. 직무 매칭 */}
                <section>
                   <h3 className="text-xl font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200 flex items-center"><Briefcase size={20} className="mr-2 text-pink-600"/> 관심 직무 매칭 분석</h3>
                   <div className="space-y-4">
                      <div className="bg-white p-5 rounded-xl border border-pink-100 shadow-sm">
                         <h4 className="font-bold text-slate-800 mb-2 text-lg">1. {jobs.job1 || '관심직업1'}</h4>
                         <EditableContent className="text-slate-600 leading-relaxed" value={result.job_match?.job1_match} onSave={(v)=>handleEdit('job_match', 'job1_match', v)} />
                      </div>
                      {jobs.job2 && (
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                           <h4 className="font-bold text-slate-800 mb-2 text-lg">2. {jobs.job2}</h4>
                           <EditableContent className="text-slate-600 leading-relaxed" value={result.job_match?.job2_match} onSave={(v)=>handleEdit('job_match', 'job2_match', v)} />
                        </div>
                      )}
                   </div>
                </section>
              </div>

              <div className="mt-12 pt-6 border-t border-slate-200 flex justify-between items-center text-xs text-slate-400 mt-auto">
                <div className="flex items-center"><ClipboardList className="w-4 h-4 mr-1 text-pink-500" /><span>Career Vitamin</span></div>
                <span>AI-Powered Holland Assessment Report</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <ClipboardList size={64} className="mb-4 opacity-20"/>
              <p>좌측 메뉴에서 점수를 입력하고 리포트를 생성하세요.</p>
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

// ... (Other apps: CompanyAnalysisApp, CareerRoadmapApp, PtInterviewApp, SituationInterviewApp, SelfIntroApp, ExperienceStructuringApp, RoleModelGuideApp, JobExplorerApp should be included here as in previous versions) ...
// (All previous components are preserved in the full file generation below)

function CompanyAnalysisApp({ onClose }) {
  const [inputs, setInputs] = useState({ company: '', url: '', job: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const reportRef = useRef(null);

  const showToast = (msg) => setToastMsg(msg);
  
  const handleAIAnalysis = async () => {
    if (!inputs.company || !inputs.job) return showToast("기업명과 직무를 입력해주세요.");
    setLoading(true);
    try {
      const prompt = `당신은 전문 커리어 컨설턴트입니다. 기업: ${inputs.company}, 지원직무: ${inputs.job}.
      해당 기업에 대한 심층 분석 리포트를 작성해줘. 분량 제한 없이 최대한 상세하고 구체적으로 작성해야 함.
      
      다음 JSON 구조를 반드시 따를 것:
      {
        "overview": {
          "summary": "기업 개요 (설립일, 대표자, 본사 위치 등 기본 정보 상세 서술)",
          "history": "주요 연혁 (창립부터 현재까지 주요 마일스톤 나열)",
          "vision": "비전 및 미션 (상세히)",
          "coreValues": "핵심 가치 (상세히)",
          "talent": "인재상 (상세히)"
        },
        "business": {
          "mainBiz": "주요 사업 영역 및 제품/서비스 상세 설명",
          "swot": { 
            "s": "강점 (Strength) - 구체적인 수치나 근거 포함", 
            "w": "약점 (Weakness)", 
            "o": "기회 (Opportunity)", 
            "t": "위협 (Threat)" 
          }
        },
        "industry": {
          "trend": "국내외 해당 산업의 최신 동향, 시장 규모, 미래 전망 등 상세 분석"
        },
        "competitor": {
          "diff": "경쟁사 대비 ${inputs.company}만의 긍정적 차별점 및 경쟁 우위 요소 (기술력, 브랜드, 문화 등)"
        },
        "strategy": {
          "guide": "이 기업과 직무(${inputs.job})에 지원하는 지원자를 위한 구체적인 취업 전략 및 어필 포인트"
        }
      }`;
      
      const parsed = await fetchGemini(prompt);
      if (parsed) setResult(parsed);
    } catch (e) { showToast(e.message); } finally { setLoading(false); }
  };
  
  const handleEdit = (section, key, value) => {
    setResult(prev => {
      const newData = { ...prev };
      if (section && prev[section]) {
        newData[section][key] = value;
      } else {
        newData[key] = value; 
      }
      return newData;
    });
  };

  const handleDownload = () => saveAsPng(reportRef, `기업분석_${inputs.company}`, showToast);
  const handlePdfDownload = () => saveAsPdf(reportRef, `기업분석_${inputs.company}`, showToast);
  
  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col font-sans text-slate-800">
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
      <header className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md shrink-0">
        <div className="flex items-center gap-3"><BarChart3 className="text-indigo-400" /><h1 className="font-bold text-lg">기업분석 리포트</h1></div>
        <button onClick={onClose} className="flex items-center text-sm hover:text-indigo-200 transition-colors"><ChevronLeft className="w-5 h-5 mr-1"/> 돌아가기</button>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 bg-white border-r p-6 overflow-y-auto shrink-0">
          <div className="space-y-5">
            <h3 className="font-bold text-sm text-indigo-700 flex items-center uppercase tracking-wider"><Settings size={16} className="mr-2"/> 분석 설정</h3>
            <input value={inputs.company} onChange={e=>setInputs({...inputs, company:e.target.value})} className="w-full p-3 border rounded-lg" placeholder="기업명" />
            <input value={inputs.url} onChange={e=>setInputs({...inputs, url:e.target.value})} className="w-full p-3 border rounded-lg" placeholder="홈페이지 URL (참고용)" />
            <input value={inputs.job} onChange={e=>setInputs({...inputs, job:e.target.value})} className="w-full p-3 border rounded-lg" placeholder="지원 직무" />
            <button onClick={handleAIAnalysis} disabled={loading} className="w-full bg-indigo-600 text-white py-3.5 rounded-xl hover:bg-indigo-700 font-bold mt-4 shadow-lg disabled:bg-slate-400">{loading ? <Loader2 className="animate-spin mx-auto"/> : "AI 분석 실행"}</button>
          </div>
        </aside>
        <main className="flex-1 p-8 overflow-y-auto bg-slate-50 flex justify-center">
          {result ? (
            <div ref={reportRef} className="w-[210mm] min-h-[297mm] h-fit bg-white shadow-2xl p-12 flex flex-col animate-in fade-in zoom-in-95 duration-500">
              <div className="border-b-4 border-indigo-600 pb-6 mb-8">
                 <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold tracking-wider mb-3 inline-block">COMPANY REPORT</span>
                 <h1 className="text-4xl font-extrabold text-slate-900 mt-2">{inputs.company}</h1>
                 <p className="text-lg text-slate-500 mt-2">Premium Corporate Analysis</p>
              </div>
              
              <div className="space-y-10">
                <section>
                  <h3 className="text-xl font-bold text-indigo-900 mb-4 flex items-center border-b-2 border-indigo-100 pb-2"><Building2 size={24} className="mr-2"/> 1. 기업 개요 및 현황</h3>
                  <div className="space-y-4">
                     <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                       <h4 className="font-bold text-sm text-slate-500 mb-2">기업 개요</h4>
                       <EditableContent className="text-sm text-slate-700 leading-relaxed" value={result.overview?.summary} onSave={(v)=>handleEdit('overview', 'summary', v)} />
                     </div>
                     <div className="bg-white p-5 rounded-xl border border-slate-200">
                       <h4 className="font-bold text-sm text-slate-500 mb-2">주요 연혁</h4>
                       <EditableContent className="text-sm text-slate-700 leading-relaxed" value={result.overview?.history} onSave={(v)=>handleEdit('overview', 'history', v)} />
                     </div>
                     <div className="grid grid-cols-3 gap-4">
                        <div className="bg-indigo-50 p-4 rounded-xl">
                            <h4 className="font-bold text-indigo-700 text-xs mb-2">VISION</h4>
                            <EditableContent className="text-xs text-slate-700" value={result.overview?.vision} onSave={(v)=>handleEdit('overview', 'vision', v)} />
                        </div>
                        <div className="bg-indigo-50 p-4 rounded-xl">
                            <h4 className="font-bold text-indigo-700 text-xs mb-2">CORE VALUES</h4>
                            <EditableContent className="text-xs text-slate-700" value={result.overview?.coreValues} onSave={(v)=>handleEdit('overview', 'coreValues', v)} />
                        </div>
                        <div className="bg-indigo-50 p-4 rounded-xl">
                            <h4 className="font-bold text-indigo-700 text-xs mb-2 flex items-center"><Users size={12} className="mr-1"/> 인재상</h4>
                            <EditableContent className="text-xs text-slate-700" value={result.overview?.talent} onSave={(v)=>handleEdit('overview', 'talent', v)} />
                        </div>
                     </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-xl font-bold text-indigo-900 mb-4 flex items-center border-b-2 border-indigo-100 pb-2"><BarChart3 size={24} className="mr-2"/> 2. 주요 사업 & SWOT</h3>
                  <div className="mb-6">
                    <h4 className="font-bold text-sm text-slate-600 mb-2">주요 사업 영역</h4>
                    <EditableContent className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200" value={result.business?.mainBiz} onSave={(v)=>handleEdit('business', 'mainBiz', v)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {['s', 'w', 'o', 't'].map((key) => (
                      <div key={key} className={`p-4 rounded-xl border ${key==='s'?'bg-blue-50 border-blue-100':key==='w'?'bg-orange-50 border-orange-100':key==='o'?'bg-emerald-50 border-emerald-100':'bg-red-50 border-red-100'}`}>
                        <span className={`font-bold text-base block mb-2 uppercase ${key==='s'?'text-blue-700':key==='w'?'text-orange-700':key==='o'?'text-emerald-700':'text-red-700'}`}>{key === 's' ? 'Strength' : key === 'w' ? 'Weakness' : key === 'o' ? 'Opportunity' : 'Threat'}</span>
                        <EditableContent className="text-slate-700 leading-relaxed" value={result.business?.swot?.[key]} onSave={(v)=>{
                          const newSwot = { ...result.business.swot, [key]: v };
                          handleEdit('business', 'swot', newSwot);
                        }} />
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                   <h3 className="text-xl font-bold text-indigo-900 mb-4 flex items-center border-b-2 border-indigo-100 pb-2"><Globe size={24} className="mr-2"/> 3. 시장 및 경쟁 분석</h3>
                   <div className="space-y-4">
                      <div>
                         <h4 className="font-bold text-sm text-slate-600 mb-2">국내외 산업 동향</h4>
                         <EditableContent className="text-sm text-slate-700 leading-relaxed p-4 border rounded-xl bg-white" value={result.industry?.trend} onSave={(v)=>handleEdit('industry', 'trend', v)} />
                      </div>
                      <div>
                         <h4 className="font-bold text-sm text-slate-600 mb-2 flex items-center"><ThumbsUp size={14} className="mr-1 text-indigo-500"/> 경쟁사 대비 긍정적 차별점</h4>
                         <EditableContent className="text-sm text-slate-700 leading-relaxed p-4 border border-indigo-200 bg-indigo-50/50 rounded-xl" value={result.competitor?.diff} onSave={(v)=>handleEdit('competitor', 'diff', v)} />
                      </div>
                   </div>
                </section>

                <section>
                   <h3 className="text-xl font-bold text-indigo-900 mb-4 flex items-center border-b-2 border-indigo-100 pb-2"><Target size={24} className="mr-2"/> 4. 지원자 취업 전략</h3>
                   <div className="bg-slate-800 p-6 rounded-xl shadow-lg text-white">
                      <EditableContent className="font-medium leading-loose text-sm" value={result.strategy?.guide} onSave={(v)=>handleEdit('strategy', 'guide', v)} />
                   </div>
                </section>
              </div>

              <div className="mt-12 pt-6 border-t border-slate-200 flex justify-between items-center text-xs text-slate-400 mt-auto">
                <div className="flex items-center"><BarChart3 className="w-4 h-4 mr-1 text-indigo-500" /><span>Career Vitamin</span></div>
                <span>AI-Generated Analysis Report</span>
              </div>
            </div>
          ) : <div className="flex flex-col items-center justify-center h-full text-slate-400"><BarChart3 size={64} className="mb-4 opacity-20"/><p>정보를 입력하고 분석을 시작하세요.</p></div>}
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

function CareerRoadmapApp({ onClose }) {
  const [inputs, setInputs] = useState({ company: '', job: '', years: '5' });
  const [roadmapData, setRoadmapData] = useState(null); 
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const reportRef = useRef(null);

  const showToast = (msg) => setToastMsg(msg);

  const handleAIPlan = async () => {
    if (!inputs.company || !inputs.job) return showToast("기업명과 직무를 입력해주세요.");
    setLoading(true);
    try {
      const prompt = `커리어 로드맵 설계. 기업:${inputs.company}, 직무:${inputs.job}, 목표기간:${inputs.years}년. JSON: { "goal": "최종목표", "roadmap": [{"stage": "단계명", "action": "실천내용"}], "script": "입사후포부" }`;
      const parsed = await fetchGemini(prompt);
      setRoadmapData(parsed);
    } catch (e) { showToast(e.message); } finally { setLoading(false); }
  };
  
  const handleEdit = (key, value) => setRoadmapData(prev => ({ ...prev, [key]: value }));
  const handleRoadmapEdit = (index, key, value) => {
    setRoadmapData(prev => {
      const newMap = [...prev.roadmap];
      newMap[index] = { ...newMap[index], [key]: value };
      return { ...prev, roadmap: newMap };
    });
  };

  const handleDownload = () => saveAsPng(reportRef, `커리어로드맵_${inputs.company}`, showToast);
  const handlePdfDownload = () => saveAsPdf(reportRef, `커리어로드맵_${inputs.company}`, showToast);
  
  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col font-sans text-slate-800">
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
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
            <div ref={reportRef} className="w-[210mm] min-h-[297mm] h-fit bg-white shadow-2xl p-12 flex flex-col animate-in fade-in zoom-in-95 duration-500">
              <div className="border-b-4 border-blue-600 pb-6 mb-10">
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold tracking-wider mb-3 inline-block">CAREER ROADMAP</span>
                <h1 className="text-4xl font-extrabold text-slate-900">{inputs.company}</h1>
                <EditableContent className="text-blue-600 font-bold text-xl mt-3" value={roadmapData.goal} onSave={(v)=>handleEdit('goal', v)} />
              </div>
              <div className="space-y-8 relative before:absolute before:left-[27px] before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200">
                {roadmapData.roadmap?.map((r,i)=>(
                  <div key={i} className="flex gap-6 relative">
                    <div className="w-14 h-14 rounded-full bg-white border-4 border-blue-100 flex items-center justify-center font-bold text-blue-600 shadow-sm z-10 shrink-0 text-xl">{i+1}</div>
                    <div className="flex-1 p-6 border border-slate-200 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow">
                      <EditableContent className="font-bold text-blue-800 mb-2 text-lg" value={r.stage} onSave={(v)=>handleRoadmapEdit(i, 'stage', v)} />
                      <EditableContent className="text-slate-600 leading-relaxed" value={r.action} onSave={(v)=>handleRoadmapEdit(i, 'action', v)} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-12 bg-slate-900 p-8 rounded-2xl text-white shadow-xl">
                <h3 className="font-bold text-blue-300 mb-4 flex items-center text-lg"><MessageSquare className="mr-2"/> 입사 후 포부</h3>
                <EditableContent className="text-slate-300 leading-loose text-lg font-light" value={roadmapData.script} onSave={(v)=>handleEdit('script', v)} />
              </div>
              <div className="mt-12 pt-6 border-t border-slate-200 flex justify-between items-center text-xs text-slate-400 mt-auto">
                <div className="flex items-center"><TrendingUp className="w-4 h-4 mr-1 text-blue-500" /><span>Career Vitamin</span></div>
                <span>AI-Generated Career Roadmap</span>
              </div>
            </div>
          ) : <div className="flex flex-col items-center justify-center h-full text-slate-400"><TrendingUp size={64} className="mb-4 opacity-20"/><p>커리어 목표를 입력하세요.</p></div>}
        </main>
        {roadmapData && (
          <div className="absolute bottom-8 right-8 flex gap-3 z-50">
            <button onClick={handleDownload} className="bg-slate-900 text-white px-6 py-3 rounded-full font-bold shadow-2xl hover:-translate-y-1 flex items-center transition-transform"><Download className="mr-2" size={20}/> 이미지 저장</button>
            <button onClick={handlePdfDownload} className="bg-red-600 text-white px-6 py-3 rounded-full font-bold shadow-2xl hover:-translate-y-1 flex items-center transition-transform"><FileText className="mr-2" size={20}/> PDF 저장</button>
          </div>
        )}
      </div>
    </div>
  );
}

function PtInterviewApp({ onClose }) {
  const [mode, setMode] = useState('recommend'); 
  const [inputs, setInputs] = useState({ company: '', job: '', request: '' });
  
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [manualTopic, setManualTopic] = useState('');

  const [script, setScript] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const reportRef = useRef(null);

  const showToast = (msg) => setToastMsg(msg);
  
  const handleGenerateTopics = async () => {
    if (!inputs.company) return showToast("기업명을 입력해주세요.");
    setLoading(true);
    try {
      const prompt = `지원 기업: ${inputs.company}, 지원 직무: ${inputs.job}, 추가 요구사항: ${inputs.request}. 
      해당 기업의 최신 뉴스, 사업 보고서, 직무 기술서 등을 바탕으로 실제 면접에서 나올법한 고품질 PT 면접 주제 15개를 추천해줘.
      각 주제는 단순한 키워드가 아니라 구체적인 문제 상황(Scenario)과 해결 과제가 포함된 문장이어야 함.
      Format strictly: JSON Array of strings (e.g., ["주제1: ~~~", "주제2: ~~~"])`;
      
      const parsed = await fetchGemini(prompt);
      if(parsed && Array.isArray(parsed)) { 
        setTopics(parsed); 
      } else {
        throw new Error("주제 생성 형식이 올바르지 않습니다.");
      }
    } catch (e) { showToast(e.message); } finally { setLoading(false); }
  };
  
  const handleGenerateScript = async () => {
    const targetTopic = mode === 'recommend' ? selectedTopic : manualTopic;

    if (!targetTopic) return showToast(mode === 'recommend' ? "주제를 선택해주세요." : "주제를 입력해주세요.");
    if (!inputs.company) return showToast("기업 정보가 필요합니다.");

    setLoading(true);
    try {
      const prompt = `PT주제: "${targetTopic}", 기업:${inputs.company}, 직무:${inputs.job}. 
      이 주제에 대한 전문적인 PT 발표 대본을 작성해줘.
      
      반드시 다음 JSON 형식을 지킬 것:
      {
        "intro": "청중의 주의를 환기하고 주제를 소개하는 서론 (2-3문장)",
        "body": "핵심 주장, 논거 1, 논거 2, 구체적 실행 방안 등을 포함한 매우 상세하고 긴 본론 (각 논거마다 구체적인 예시나 수치를 포함하여 풍부하게 작성할 것, 줄바꿈 포함)",
        "conclusion": "핵심 요약 및 입사 후 포부를 담은 강력한 결론 (2-3문장)"
      }
      
      Body 부분은 절대 비워두지 말고, 실무자 입장에서 설득력 있게 작성할 것.`;
      
      const parsed = await fetchGemini(prompt);
      if(parsed && parsed.body) { 
        setScript(parsed); 
      } else {
        throw new Error("스크립트 생성 중 오류가 발생했습니다. (Body 누락)");
      }
    } catch(e){ showToast(e.message); } finally { setLoading(false); }
  };
  
  const handleEditScript = (key, value) => setScript(prev => ({ ...prev, [key]: value }));
  const handleDownload = () => saveAsPng(reportRef, `PT면접_${inputs.company}`, showToast);
  const handlePdfDownload = () => saveAsPdf(reportRef, `PT면접_${inputs.company}`, showToast);

  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col font-sans text-slate-800">
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
      <header className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md shrink-0">
        <div className="flex items-center gap-3"><MonitorPlay className="text-rose-400"/><h1 className="font-bold text-lg">PT 면접 가이드</h1></div>
        <button onClick={onClose} className="flex items-center text-sm hover:text-rose-200 transition-colors"><ChevronLeft className="w-5 h-5 mr-1"/> 돌아가기</button>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-96 bg-white border-r flex flex-col shrink-0">
           <div className="flex border-b">
             <button onClick={() => setMode('recommend')} className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 ${mode === 'recommend' ? 'text-rose-600 border-b-2 border-rose-600 bg-rose-50' : 'text-slate-500 hover:bg-slate-50'}`}><Lightbulb size={16}/> AI 주제 추천</button>
             <button onClick={() => setMode('manual')} className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 ${mode === 'manual' ? 'text-rose-600 border-b-2 border-rose-600 bg-rose-50' : 'text-slate-500 hover:bg-slate-50'}`}><PenTool size={16}/> 직접 입력</button>
           </div>

           <div className="p-6 pb-2 space-y-3 bg-white">
             <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-2">기본 정보 (필수)</h3>
             <input value={inputs.company} onChange={e=>setInputs({...inputs, company:e.target.value})} className="w-full p-3 border rounded-lg text-sm bg-slate-50 focus:bg-white transition-colors" placeholder="지원 기업명"/>
             <input value={inputs.job} onChange={e=>setInputs({...inputs, job:e.target.value})} className="w-full p-3 border rounded-lg text-sm bg-slate-50 focus:bg-white transition-colors" placeholder="지원 직무"/>
           </div>

           <div className="flex-1 overflow-y-auto p-4 pt-0">
             {mode === 'recommend' ? (
               <div className="space-y-4 pt-2">
                 <div className="bg-rose-50 p-4 rounded-xl border border-rose-100">
                   <textarea value={inputs.request} onChange={e=>setInputs({...inputs, request:e.target.value})} className="w-full p-2 border rounded-lg text-sm h-16 resize-none mb-2 bg-white" placeholder="추가 요구사항 (예: 신사업 위주로)"/>
                   <button onClick={handleGenerateTopics} disabled={loading} className="w-full bg-rose-600 text-white py-2.5 rounded-lg font-bold shadow-sm hover:bg-rose-700 text-xs">{loading && topics.length === 0 ? <Loader2 className="animate-spin mx-auto w-4 h-4"/> : "주제 15개 추출하기"}</button>
                 </div>
                 <div className="space-y-2">
                   {topics.length > 0 ? topics.map((t, i) => (
                     <button key={i} onClick={() => setSelectedTopic(t)} className={`w-full text-left p-3 rounded-xl text-sm transition-all border ${selectedTopic === t ? 'bg-rose-50 border-rose-500 text-rose-900 shadow-sm ring-1 ring-rose-200' : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'}`}><span className="font-bold text-rose-500 mr-2 text-xs">Q{i+1}.</span><span className="line-clamp-2">{t}</span></button>
                   )) : <div className="text-center text-slate-400 py-8 text-xs">설정 입력 후 주제를 추출하세요.</div>}
                 </div>
               </div>
             ) : (
               <div className="pt-4 space-y-4">
                 <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                   <h3 className="font-bold text-sm text-slate-700 mb-2 flex items-center"><PenTool size={14} className="mr-2"/> 주제 직접 입력</h3>
                   <textarea value={manualTopic} onChange={e=>setManualTopic(e.target.value)} className="w-full p-3 border rounded-lg h-40 resize-none text-sm focus:ring-2 focus:ring-rose-200 outline-none" placeholder="기출 주제나 준비 중인 주제를 상세히 입력하세요.&#13;&#10;(예: 우리 회사의 2030 타겟 마케팅 전략 수립)"/>
                 </div>
               </div>
             )}
           </div>

           <div className="p-4 border-t bg-white">
             <button onClick={handleGenerateScript} disabled={loading || (mode === 'recommend' && !selectedTopic) || (mode === 'manual' && !manualTopic)} className="w-full bg-slate-800 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-slate-900 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-95">{loading ? <Loader2 className="animate-spin w-5 h-5"/> : <>스크립트 생성 <ArrowRight size={18}/></>}</button>
           </div>
        </aside>

        <main className="flex-1 p-8 overflow-y-auto flex justify-center bg-slate-50">
           {script ? <div ref={reportRef} className="w-[210mm] min-h-[297mm] h-fit bg-white shadow-2xl p-12 flex flex-col animate-in fade-in slide-in-from-bottom-4">
             <div className="border-b-4 border-rose-500 pb-6 mb-8">
               <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-xs font-bold tracking-wider mb-3 inline-block">PT INTERVIEW SCRIPT</span>
               <h1 className="text-2xl font-extrabold mt-3 text-slate-900 leading-tight">{mode === 'recommend' ? selectedTopic : manualTopic}</h1>
             </div>
             <div className="space-y-8">
                <section>
                  <h3 className="text-xl font-bold text-slate-800 mb-3 border-l-4 border-rose-400 pl-3">Introduction</h3>
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                    <EditableContent className="text-base text-slate-700 leading-loose" value={script.intro} onSave={(v)=>handleEditScript('intro', v)} />
                  </div>
                </section>
                <section>
                  <h3 className="text-xl font-bold text-slate-800 mb-3 border-l-4 border-rose-500 pl-3">Body</h3>
                  <div className="pl-2">
                    <EditableContent className="text-base text-slate-700 pl-6 py-2 leading-loose border-l-2 border-slate-200 ml-2 min-h-[200px]" value={script.body} onSave={(v)=>handleEditScript('body', v)} />
                  </div>
                </section>
                <section>
                  <h3 className="text-xl font-bold text-slate-800 mb-3 border-l-4 border-rose-600 pl-3">Conclusion</h3>
                  <div className="bg-rose-600 p-6 rounded-xl shadow-lg">
                    <EditableContent className="text-base text-white leading-loose font-medium" value={script.conclusion} onSave={(v)=>handleEditScript('conclusion', v)} />
                  </div>
                </section>
             </div>
             <div className="mt-12 pt-6 border-t border-slate-200 flex justify-between items-center text-xs text-slate-400 mt-auto">
                <div className="flex items-center"><MonitorPlay className="w-4 h-4 mr-1 text-rose-500" /><span>Career Vitamin</span></div>
                <span>AI-Generated PT Script (Confidential)</span>
              </div>
           </div> : (
             <div className="flex flex-col items-center justify-center h-full text-slate-400">
               {loading ? (
                 <>
                   <Loader2 size={64} className="mb-4 animate-spin text-rose-500"/>
                   <p className="animate-pulse">AI가 최적의 답변을 작성 중입니다...</p>
                 </>
               ) : (
                 <>
                   <MonitorPlay size={64} className="mb-4 opacity-20"/>
                   <p>{mode === 'recommend' ? "좌측에서 주제를 추출하고 선택해주세요." : "좌측에서 주제를 입력하고 생성 버튼을 눌러주세요."}</p>
                 </>
               )}
             </div>
           )}
        </main>
        {script && (
          <div className="absolute bottom-8 right-8 flex gap-3 z-50">
            <button onClick={handleDownload} className="bg-slate-900 text-white px-6 py-3 rounded-full font-bold shadow-2xl hover:-translate-y-1 flex items-center transition-transform"><Download className="mr-2" size={20}/> 이미지 저장</button>
            <button onClick={handlePdfDownload} className="bg-red-600 text-white px-6 py-3 rounded-full font-bold shadow-2xl hover:-translate-y-1 flex items-center transition-transform"><FileText className="mr-2" size={20}/> PDF 저장</button>
          </div>
        )}
      </div>
    </div>
  );
}

function SituationInterviewApp({ onClose }) {
  const [inputs, setInputs] = useState({ question: '', criteria: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const reportRef = useRef(null);
  
  const showToast = (msg) => setToastMsg(msg);

  const handleAIAnalysis = async () => {
    if (!inputs.question) return showToast("질문을 입력해주세요.");
    setLoading(true);
    try {
      const prompt = `상황면접 질문: ${inputs.question}, 판단기준: ${inputs.criteria}. 답변 2가지 버전(A/B)과 조언. JSON: { "situation_a": {"title": "...", "content": "..."}, "situation_b": {"title": "...", "content": "..."}, "advice": "..." }`;
      const parsed = await fetchGemini(prompt);
      setResult(parsed);
    } catch (e) { showToast(e.message); } finally { setLoading(false); }
  };
  
  const handleEdit = (key, subKey, value) => {
    setResult(prev => {
        if (subKey) return { ...prev, [key]: { ...prev[key], [subKey]: value } };
        return { ...prev, [key]: value };
    });
  };

  const handleDownload = () => saveAsPng(reportRef, `상황면접`, showToast);
  const handlePdfDownload = () => saveAsPdf(reportRef, `상황면접`, showToast);
  
  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col font-sans text-slate-800">
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
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
        <main className="flex-1 p-8 overflow-y-auto flex justify-center bg-slate-50">{result ? <div ref={reportRef} className="w-[210mm] min-h-[297mm] h-fit bg-white shadow-lg p-10 flex flex-col animate-in fade-in zoom-in-95 duration-500"><h2 className="text-3xl font-extrabold mb-6 text-slate-900 border-b-2 border-teal-500 pb-4">상황면접 가이드</h2><div className="space-y-6"> <div className="bg-slate-50 p-6 rounded-xl border mb-8"><h3 className="font-bold text-slate-500 text-xs mb-2 tracking-widest">QUESTION</h3><p className="font-bold text-xl text-slate-800">"{inputs.question}"</p></div><div className="grid grid-cols-1 gap-8"><div className="border-l-4 border-teal-500 pl-6 py-2"><EditableContent className="font-bold text-teal-800 text-xl mb-3" value={result.situation_a?.title} onSave={(v)=>handleEdit('situation_a', 'title', v)} /><EditableContent className="text-slate-600 leading-relaxed text-lg" value={result.situation_a?.content} onSave={(v)=>handleEdit('situation_a', 'content', v)} /></div><div className="border-l-4 border-slate-400 pl-6 py-2"><EditableContent className="font-bold text-slate-700 text-xl mb-3" value={result.situation_b?.title} onSave={(v)=>handleEdit('situation_b', 'title', v)} /><EditableContent className="text-slate-600 leading-relaxed text-lg" value={result.situation_b?.content} onSave={(v)=>handleEdit('situation_b', 'content', v)} /></div></div><div className="mt-8 bg-teal-50 p-6 rounded-xl border border-teal-100 text-teal-900 text-base font-medium">💡 Advice: <EditableContent className="mt-2" value={result.advice} onSave={(v)=>handleEdit('advice', null, v)} /></div></div><div className="mt-12 pt-6 border-t border-slate-200 flex justify-between items-center text-xs text-slate-400 mt-auto"><div className="flex items-center"><Split className="w-4 h-4 mr-1 text-teal-500" /><span>Career Vitamin</span></div><span>AI-Powered Situation Guide</span></div></div> : <div className="flex flex-col items-center justify-center h-full text-slate-400"><Split size={64} className="mb-4 opacity-20"/><p>질문을 입력하면 답변이 생성됩니다.</p></div>}</main>
        {result && <button onClick={handleDownload} className="absolute bottom-8 right-8 bg-slate-900 text-white px-6 py-3 rounded-full font-bold shadow-2xl hover:-translate-y-1 flex items-center z-50"><Download className="mr-2" size={20}/> 이미지 저장</button>}
      </div>
    </div>
  );
}

function SelfIntroApp({ onClose }) {
  const [inputs, setInputs] = useState({ company: '', job: '', concept: 'competency', keyword: '', exp: '' });
  const [script, setScript] = useState(null); 
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const reportRef = useRef(null);

  const showToast = (msg) => setToastMsg(msg);

  const handleAIAnalysis = async () => {
    if (!inputs.company) return showToast("기업명을 입력해주세요.");
    setLoading(true);
    try {
      const prompt = `1분 자기소개. 기업:${inputs.company}, 직무:${inputs.job}, 컨셉:${inputs.concept}, 키워드:${inputs.keyword}, 경험:${inputs.exp}. JSON: { "slogan": "...", "opening": "...", "body": "...", "closing": "..." }`;
      const parsed = await fetchGemini(prompt);
      setScript(parsed);
    } catch (e) { showToast(e.message); } finally { setLoading(false); }
  };
  
  const handleEdit = (key, value) => setScript(prev => ({ ...prev, [key]: value }));
  const handleDownload = () => saveAsPng(reportRef, `자기소개_${inputs.company}`, showToast);
  const handlePdfDownload = () => saveAsPdf(reportRef, `자기소개_${inputs.company}`, showToast);
  
  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col font-sans text-slate-800">
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
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
        <main className="flex-1 p-8 overflow-y-auto flex justify-center bg-slate-50">{script ? <div ref={reportRef} className="w-[210mm] min-h-[297mm] h-fit bg-white shadow-lg p-10 flex flex-col animate-in fade-in zoom-in-95 duration-500"><div className="border-b-4 border-purple-600 pb-6 text-center"><span className="text-purple-600 font-bold text-sm tracking-widest block mb-2">1-MINUTE SPEECH</span><EditableContent className="text-3xl font-extrabold text-slate-900 text-center" value={script.slogan} onSave={(v)=>handleEdit('slogan', v)} /></div><div className="space-y-8 mt-8"> <div className="flex gap-6"><div className="w-20 text-right font-bold text-slate-400 text-sm pt-4 uppercase">Opening</div><div className="flex-1 bg-purple-50 p-6 rounded-2xl text-xl font-bold text-slate-800 shadow-sm"><EditableContent value={script.opening} onSave={(v)=>handleEdit('opening', v)} /></div></div><div className="flex gap-6"><div className="w-20 text-right font-bold text-slate-400 text-sm pt-1 uppercase">Body</div><div className="flex-1 text-slate-700 leading-loose pl-6 border-l-2 border-purple-200 text-lg"><EditableContent value={script.body} onSave={(v)=>handleEdit('body', v)} /></div></div><div className="flex gap-6"><div className="w-20 text-right font-bold text-slate-400 text-sm pt-4 uppercase">Closing</div><div className="flex-1 bg-slate-50 p-6 rounded-2xl font-medium text-slate-800 text-lg"><EditableContent value={script.closing} onSave={(v)=>handleEdit('closing', v)} /></div></div></div><div className="mt-12 pt-6 border-t border-slate-200 flex justify-between items-center text-xs text-slate-400 mt-auto"><div className="flex items-center"><Mic className="w-4 h-4 mr-1 text-purple-500" /><span>Career Vitamin</span></div><span>AI-Generated Speech Script</span></div></div> : <div className="flex flex-col items-center justify-center h-full text-slate-400"><Mic size={64} className="mb-4 opacity-20"/><p>정보를 입력하면 스크립트가 생성됩니다.</p></div>}</main>
        {script && <button onClick={handleDownload} className="absolute bottom-8 right-8 bg-slate-900 text-white px-6 py-3 rounded-full font-bold shadow-2xl hover:-translate-y-1 flex items-center z-50"><Download className="mr-2" size={20}/> 이미지 저장</button>}
      </div>
    </div>
  );
}

function ExperienceStructuringApp({ onClose }) {
  const [inputs, setInputs] = useState({ company: '', job: '', keyword: '', desc: '' });
  const [starData, setStarData] = useState({ s: '', t: '', a: '', r: '' });
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const reportRef = useRef(null);
  
  const showToast = (msg) => setToastMsg(msg);

  const handleAIAnalysis = async () => {
    if (!inputs.desc) return showToast("내용을 입력해주세요.");
    setLoading(true);
    try {
      const prompt = `경험 STAR 구조화. 기업:${inputs.company}, 직무:${inputs.job}, 키워드:${inputs.keyword}, 내용:${inputs.desc}. JSON: { "s": "...", "t": "...", "a": "...", "r": "..." }`;
      const parsed = await fetchGemini(prompt);
      setStarData(parsed);
    } catch (e) { showToast(e.message); } finally { setLoading(false); }
  };
  
  const handleEdit = (key, value) => setStarData(prev => ({ ...prev, [key]: value }));
  const handleDownload = () => saveAsPng(reportRef, `STAR_${inputs.keyword}`, showToast);
  const handlePdfDownload = () => saveAsPdf(reportRef, `STAR_${inputs.keyword}`, showToast);
  
  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col font-sans text-slate-800">
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
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
          <textarea value={inputs.desc} onChange={e=>setInputs({...inputs, desc:e.target.value})} className="w-full p-3 border rounded-lg h-40 resize-none" placeholder="경험 내용을 자유롭게 서술하세요 (당시 상황, 내가 한 행동, 결과 등)"/>
          <button onClick={handleAIAnalysis} disabled={loading} className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold mt-4 shadow-lg disabled:bg-slate-400">{loading?<Loader2 className="animate-spin mx-auto"/>:"구조화 실행"}</button>
        </div></aside>
        <main className="flex-1 p-8 overflow-y-auto flex justify-center bg-slate-50">{starData.s ? <div ref={reportRef} className="w-[210mm] min-h-[297mm] h-fit bg-white shadow-lg p-10 space-y-6 animate-in fade-in zoom-in-95 duration-500"><div className="border-b-4 border-indigo-600 pb-6 mb-6"><h1 className="text-4xl font-extrabold text-slate-900">STAR Analysis</h1><p className="text-slate-500 mt-2 text-lg">경험 구조화 워크시트</p></div><div className="space-y-6"> <div className="bg-slate-50 p-6 rounded-2xl border-l-8 border-slate-400"><h3 className="font-bold text-slate-500 mb-2 text-sm tracking-widest">SITUATION</h3><EditableContent className="text-slate-800 text-lg leading-relaxed" value={starData.s} onSave={(v)=>handleEdit('s', v)} /></div><div className="bg-slate-50 p-6 rounded-2xl border-l-8 border-slate-500"><h3 className="font-bold text-slate-500 mb-2 text-sm tracking-widest">TASK</h3><EditableContent className="text-slate-800 text-lg leading-relaxed" value={starData.t} onSave={(v)=>handleEdit('t', v)} /></div><div className="bg-white border-2 border-indigo-100 p-6 rounded-2xl shadow-sm"><h3 className="font-bold text-indigo-600 mb-2 text-sm tracking-widest">ACTION</h3><EditableContent className="text-slate-800 font-medium text-lg leading-relaxed" value={starData.a} onSave={(v)=>handleEdit('a', v)} /></div><div className="bg-indigo-50 p-6 rounded-2xl border-l-8 border-indigo-600"><h3 className="font-bold text-indigo-800 mb-2 text-sm tracking-widest">RESULT</h3><EditableContent className="text-slate-800 font-bold text-lg leading-relaxed" value={starData.r} onSave={(v)=>handleEdit('r', v)} /></div></div><div className="mt-12 pt-6 border-t border-slate-200 flex justify-between items-center text-xs text-slate-400 mt-auto"><div className="flex items-center"><LayoutList className="w-4 h-4 mr-1 text-indigo-500" /><span>Career Vitamin</span></div><span>AI-Powered STAR Analysis</span></div></div> : <div className="flex flex-col items-center justify-center h-full text-slate-400"><LayoutList size={64} className="mb-4 opacity-20"/><p>경험을 입력하면 STAR 기법으로 구조화합니다.</p></div>}</main>
        {starData.s && <button onClick={handleDownload} className="absolute bottom-8 right-8 bg-slate-900 text-white px-6 py-3 rounded-full font-bold shadow-2xl hover:-translate-y-1 flex items-center z-50"><Download className="mr-2" size={20}/> 이미지 저장</button>}
      </div>
    </div>
  );
}

// 롤모델 분석 앱 - 추가 입력 필드(어록, 책) 및 프롬프트 반영
function RoleModelGuideApp({ onClose }) {
  // 입력 상태 분리: userQuotes, userBooks 추가
  const [inputs, setInputs] = useState({ name: '', userQuotes: '', userBooks: '' });
  const [result, setResult] = useState(null); // 결과 데이터는 result에 저장
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const reportRef = useRef(null);
  
  const showToast = (msg) => setToastMsg(msg);

  const handleAIAnalysis = async () => {
    if (!inputs.name) return showToast("이름을 입력해주세요.");
    setLoading(true);
    try {
      // 프롬프트에 사용자 입력 정보 추가
      const prompt = `롤모델 '${inputs.name}' 분석. 
      [사용자 추가 정보]
      - 감명 깊게 본 어록: ${inputs.userQuotes || '없음'}
      - 관련 책/매체: ${inputs.userBooks || '없음'}

      위 인물의 최신 근황과 업적을 포함하여 분석해줘.
      특히 사용자가 입력한 어록이나 책이 있다면, 해당 내용이 왜 중요한지, 어떤 교훈을 주는지 '명언(quotes)'이나 '매체(media)' 섹션에 잘 녹여내줘.
      
      JSON: { 
        "role": "인물의 대표 직함 또는 수식어", 
        "intro": "인물 소개 및 주요 업적 (최신 근황 포함)", 
        "quotes": "주요 명언 (사용자 입력 어록이 있다면 포함하여 구성)", 
        "media": "추천 도서나 매체 (사용자 입력 책이 있다면 포함)", 
        "reason": "면접에서 이 인물을 롤모델로 언급할 때의 활용 포인트 및 본받을 점" 
      }`;
      const parsed = await fetchGemini(prompt);
      // 결과에 이름 포함하여 저장
      setResult({ ...parsed, name: inputs.name }); 
    } catch (e) { showToast(e.message); } finally { setLoading(false); }
  };

  const handleEdit = (key, value) => setResult(prev => ({ ...prev, [key]: value }));
  const handleDownload = () => saveAsPng(reportRef, `롤모델_${result?.name || inputs.name}`, showToast);
  const handlePdfDownload = () => saveAsPdf(reportRef, `롤모델_${result?.name || inputs.name}`, showToast);
  
  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col font-sans text-slate-800">
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
      <header className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md shrink-0">
        <div className="flex items-center gap-3"><Award className="text-orange-400"/><h1 className="font-bold text-lg">롤모델 분석</h1></div>
        <button onClick={onClose} className="flex items-center text-sm hover:text-orange-200 transition-colors"><ChevronLeft className="w-5 h-5 mr-1"/> 돌아가기</button>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 bg-white border-r p-6 shrink-0"><div className="space-y-5">
          <h3 className="font-bold text-sm text-orange-700 flex items-center uppercase tracking-wider"><Search size={16} className="mr-2"/> 인물 검색</h3>
          {/* 입력 필드 바인딩 변경 data -> inputs */}
          <input value={inputs.name} onChange={e=>setInputs({...inputs, name:e.target.value})} className="w-full p-3 border border-slate-300 rounded-xl font-bold text-lg focus:ring-2 focus:ring-orange-500 outline-none" placeholder="예: 스티브 잡스"/>
          
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase">선택 옵션 (Optional)</h4>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">감명 깊은 어록</label>
              <textarea 
                value={inputs.userQuotes} 
                onChange={e=>setInputs({...inputs, userQuotes:e.target.value})} 
                className="w-full p-3 border rounded-lg text-sm h-20 resize-none bg-slate-50 focus:bg-white" 
                placeholder="인상 깊었던 명언이 있다면 적어주세요."
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">관련 책 / 영상</label>
              <input 
                value={inputs.userBooks} 
                onChange={e=>setInputs({...inputs, userBooks:e.target.value})} 
                className="w-full p-3 border rounded-lg text-sm bg-slate-50 focus:bg-white" 
                placeholder="책 제목이나 영상 등"
              />
            </div>
          </div>

          <button onClick={handleAIAnalysis} disabled={loading} className="w-full bg-orange-600 text-white py-3.5 rounded-xl font-bold mt-4 shadow-lg disabled:bg-slate-400">{loading?<Loader2 className="animate-spin mx-auto"/>:"분석 시작"}</button>
        </div></aside>
        <main className="flex-1 p-8 overflow-y-auto flex justify-center bg-slate-50">
          {/* 결과 표시 로직 data -> result */}
          {result ? (
            <div ref={reportRef} className="w-[210mm] min-h-[297mm] h-fit bg-white shadow-lg p-10 flex flex-col animate-in fade-in zoom-in-95 duration-500">
              <div className="border-b-4 border-orange-500 pb-6">
                <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-bold">ROLE MODEL</span>
                <h1 className="text-4xl font-extrabold mt-3">{result.name}</h1>
                <EditableContent className="text-slate-500 text-lg mt-1" value={result.role} onSave={(v)=>handleEdit('role', v)} />
              </div>
              <div className="space-y-8 mt-8"> {/* flex-1 제거됨 */}
                <div className="flex gap-8 items-start">
                  <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center shrink-0"><User className="w-8 h-8 text-orange-600"/></div>
                  <EditableContent className="text-slate-700 leading-loose text-lg flex-1" value={result.intro} onSave={(v)=>handleEdit('intro', v)} />
                </div>
                <div className="bg-orange-50 p-8 rounded-2xl italic text-orange-900 font-serif text-xl border-l-8 border-orange-400 leading-relaxed">
                  <EditableContent className="text-center" value={result.quotes} onSave={(v)=>handleEdit('quotes', v)} />
                </div>
                {/* 추가 미디어 섹션이 있으면 표시 */}
                {result.media && (
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <h4 className="font-bold text-sm text-slate-500 mb-2 flex items-center"><BookOpen size={16} className="mr-2"/> 추천 자료</h4>
                    <EditableContent className="text-slate-700" value={result.media} onSave={(v)=>handleEdit('media', v)} />
                  </div>
                )}
                <div className="border-t border-slate-200 pt-8">
                  <h3 className="font-bold text-xl mb-4 flex items-center text-slate-800"><MessageSquare className="mr-2 text-orange-500"/> 면접 활용 Tip</h3>
                  <EditableContent className="text-slate-600 leading-relaxed text-lg" value={result.reason} onSave={(v)=>handleEdit('reason', v)} />
                </div>
              </div>
              <div className="mt-12 pt-6 border-t border-slate-200 flex justify-between items-center text-xs text-slate-400 mt-auto">
                <div className="flex items-center"><Award className="w-4 h-4 mr-1 text-orange-500" /><span>Career Vitamin</span></div>
                <span>AI-Powered Role Model Analysis</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Award size={64} className="mb-4 opacity-20"/>
              <p>롤모델 이름을 입력하세요.</p>
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

              <div className="mt-12 pt-6 border-t border-slate-200 flex justify-between items-center text-xs text-slate-400 mt-auto">
                <div className="flex items-center"><Compass className="w-4 h-4 mr-1 text-emerald-500" /><span>Career Vitamin</span></div>
                <span>AI-Powered Job Analysis</span>
              </div>
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

// ... (Existing Apps) ...

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
        <h1 className="text-3xl font-bold mb-2 text-slate-900">Career Vitamin</h1>
        <p className="text-slate-500 mb-6">전문가 전용 AI 솔루션</p>
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
            <p className="text-[11px] text-indigo-200 font-medium mt-1 tracking-wide opacity-80">커리어 AI 대시보드</p>
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

             <div className={`transition-all duration-500 ${!hasPersonalKey ? 'opacity-40 pointer-events-none grayscale' : ''}`}>
               <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                 <ExternalLink className="text-slate-500" size={20}/> 외부 맞춤형 AI 도구
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {externalApps.map(([key, svc]) => (
                   <div key={key} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md border border-slate-200 transition-all group cursor-pointer h-full relative" onClick={() => {
                       if(!hasPersonalKey) return;
                       window.open(svc.link, '_blank');
                     }}>
                     {!hasPersonalKey && <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/10"><Lock className="text-slate-500 w-8 h-8"/></div>}
                     <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${COLOR_VARIANTS[svc.color]} group-hover:scale-110 transition-transform`}>
                       <svc.icon size={24} color={svc.color === 'black' ? '#000' : undefined} /> 
                     </div>
                     <h3 className="font-bold text-lg mb-2 group-hover:text-indigo-600 transition-colors">{svc.name}</h3>
                     <p className="text-sm text-slate-500 mb-4 h-10 line-clamp-2">{svc.desc}</p>
                     <div className="text-xs font-bold text-slate-400 flex items-center group-hover:text-slate-600">
                       외부 도구 열기 <ExternalLink className="ml-1 w-3 h-3"/>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
             
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
      {currentApp === 'pt_interview' && <PtInterviewApp onClose={()=>setCurrentApp('none')} />}
      {currentApp === 'sit_interview' && <SituationInterviewApp onClose={()=>setCurrentApp('none')} />}
      {currentApp === 'self_intro' && <SelfIntroApp onClose={()=>setCurrentApp('none')} />}
      {currentApp === 'exp_structuring' && <ExperienceStructuringApp onClose={()=>setCurrentApp('none')} />}
      {currentApp === 'role_model' && <RoleModelGuideApp onClose={()=>setCurrentApp('none')} />}
      {currentApp === 'gpt_guide' && <JobExplorerApp onClose={()=>setCurrentApp('none')} />}
      {currentApp === 'holland_test' && <HollandTestApp onClose={()=>setCurrentApp('none')} />}
    </div>
  );
}