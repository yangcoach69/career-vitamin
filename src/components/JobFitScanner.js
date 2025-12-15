// src/components/JobFitScanner.js
import React, { useState, useRef } from 'react';
import { 
  FileText, ChevronLeft, Settings, FileCheck, UploadCloud, 
  Loader2, ThumbsUp, AlertCircle, Target, MessageSquare, 
  BrainCircuit, Download, Percent 
} from 'lucide-react';
import { fetchGemini, saveAsPng, saveAsPdf } from '../api'; // 도구 가져오기
import { Toast, EditableContent } from './SharedUI'; // 부품 가져오기

export default function JobFitScannerApp({ onClose }) {
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
        if (section === 'fit_analysis' || section === 'interview_prep') {
            if(Array.isArray(newData[section])) {
                 newData[section][index] = value;
            } else {
                 newData[section][key] = value;
            }
        } else {
            newData[section] = value;
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