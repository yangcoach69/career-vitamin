// src/components/HollandTest.js
import React, { useState, useRef } from 'react';
import { 
  ClipboardList, ChevronLeft, Settings, Loader2, 
  BarChart3, Smile, Meh, Target, Briefcase, Download, FileText 
} from 'lucide-react';
import { fetchGemini, saveAsPng, saveAsPdf } from '../api';
import { Toast, EditableContent, Footer } from './SharedUI';

export default function HollandTestApp({ onClose }) {
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
        <div className="flex items-center gap-3"><ClipboardList className="text-pink-400"/><h1 className="font-bold text-lg">직업흥미 검사 리포트</h1></div>
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
                <h1 className="text-4xl font-extrabold text-slate-900">직업흥미 검사 분석</h1>
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

              <Footer />
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