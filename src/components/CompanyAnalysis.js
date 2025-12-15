// src/components/CompanyAnalysis.js
import React, { useState, useRef } from 'react';
import { 
  Building2, ChevronLeft, Search, Loader2, 
  Target, TrendingUp, Users, Lightbulb, Download, FileText,
  Globe, Shield, Sword 
} from 'lucide-react';
import { fetchGemini, saveAsPng, saveAsPdf } from '../api';
import { Toast, EditableContent } from './SharedUI';

export default function CompanyAnalysisApp({ onClose }) {
  const [companyName, setCompanyName] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const reportRef = useRef(null);

  const showToast = (msg) => setToastMsg(msg);

  const handleAnalysis = async () => {
    if (!companyName.trim()) return showToast("분석할 기업명을 입력해주세요.");
    
    setLoading(true);
    try {
      const prompt = `
      당신은 기업 분석 전문가입니다. '${companyName}' 기업에 대해 취업 준비생을 위한 심층 분석 리포트를 작성해주세요.
      
      [분석 항목]
      1. 기업 개요 (한줄 요약 및 비전)
      2. SWOT 분석 (강점, 약점, 기회, 위협)
      3. 3C 분석 (자사, 경쟁사, 고객)
      4. 인재상 및 핵심 가치
      5. 최근 이슈 및 채용 트렌드
      
      반드시 다음 JSON 형식을 따를 것:
      {
        "overview": "기업 한줄 소개 및 핵심 가치 요약",
        "swot": {
          "strength": ["강점1", "강점2"],
          "weakness": ["약점1", "약점2"],
          "opportunity": ["기회1", "기회2"],
          "threat": ["위협1", "위협2"]
        },
        "analysis_3c": {
          "company": "자사 분석 (Company)",
          "competitor": "경쟁사 분석 (Competitor)",
          "customer": "고객/시장 분석 (Customer)"
        },
        "talent": "인재상 및 핵심 가치 서술",
        "trend": "최근 주요 뉴스 및 채용 트렌드",
        "strategy": "이 기업에 지원하기 위한 맞춤 전략 조언"
      }`;

      const parsed = await fetchGemini(prompt);
      setResult(parsed);
    } catch (e) {
      showToast(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (section, key, value, index = null) => {
    setResult(prev => {
      const newData = { ...prev };
      if (section === 'swot' && index !== null) {
        newData[section][key][index] = value;
      } else if (section === 'analysis_3c') {
        newData[section][key] = value;
      } else {
        newData[section] = value;
      }
      return newData;
    });
  };

  const handleDownload = () => saveAsPng(reportRef, `${companyName}_기업분석`, showToast);
  const handlePdfDownload = () => saveAsPdf(reportRef, `${companyName}_기업분석`, showToast);

  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col font-sans text-slate-800">
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
      
      {/* 헤더 */}
      <header className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <Building2 className="text-blue-400"/>
          <h1 className="font-bold text-lg">기업 분석 리포트</h1>
        </div>
        <button onClick={onClose} className="flex items-center text-sm hover:text-blue-200 transition-colors">
          <ChevronLeft className="w-5 h-5 mr-1"/> 돌아가기
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* 사이드바 (입력창) */}
        <aside className="w-80 bg-white border-r p-6 shrink-0 overflow-y-auto">
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2">분석할 기업명</label>
              <div className="relative">
                <input 
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAnalysis()}
                  className="w-full p-3 pl-10 border rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                  placeholder="예: 삼성전자, 카카오" 
                />
                <Search className="absolute left-3 top-3.5 text-slate-400 w-4 h-4"/>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-xl text-xs text-slate-600 leading-relaxed">
              <p className="mb-2 font-bold text-blue-800">💡 팁</p>
              AI가 해당 기업의 최신 뉴스, 재무 정보, 인재상을 종합적으로 분석하여 합격 전략을 제시합니다.
            </div>

            <button 
              onClick={handleAnalysis} 
              disabled={loading} 
              className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold mt-2 shadow-lg hover:bg-blue-700 transition-all disabled:bg-slate-400"
            >
              {loading ? <Loader2 className="animate-spin mx-auto"/> : "기업 분석 시작"}
            </button>
          </div>
        </aside>

        {/* 메인 결과 화면 */}
        <main className="flex-1 p-8 overflow-y-auto flex justify-center bg-slate-50">
          {result ? (
            <div ref={reportRef} className="w-[210mm] min-h-[297mm] h-fit bg-white shadow-2xl p-12 flex flex-col animate-in fade-in zoom-in-95 duration-500">
              {/* 타이틀 */}
              <div className="border-b-4 border-blue-600 pb-6 mb-8">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold tracking-wider mb-3 inline-block">COMPANY REPORT</span>
                <h1 className="text-4xl font-extrabold text-slate-900 mb-2">{companyName}</h1>
                <EditableContent className="text-lg text-slate-500" value={result.overview} onSave={(v)=>handleEdit('overview', null, v)} />
              </div>

              <div className="space-y-8">
                {/* 1. SWOT 분석 */}
                <section>
                  <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center"><Target className="mr-2 text-blue-600"/> SWOT 분석</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {/* 강점 */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <h4 className="font-bold text-blue-800 mb-2 text-sm flex items-center"><Sword size={14} className="mr-1"/> Strength (강점)</h4>
                      <ul className="list-disc pl-4 text-sm text-slate-700 space-y-1">
                        {result.swot?.strength?.map((item, i) => (
                          <li key={i}><EditableContent value={item} onSave={(v)=>handleEdit('swot', 'strength', v, i)}/></li>
                        ))}
                      </ul>
                    </div>
                    {/* 약점 */}
                    <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                      <h4 className="font-bold text-red-800 mb-2 text-sm flex items-center"><Shield size={14} className="mr-1"/> Weakness (약점)</h4>
                      <ul className="list-disc pl-4 text-sm text-slate-700 space-y-1">
                        {result.swot?.weakness?.map((item, i) => (
                          <li key={i}><EditableContent value={item} onSave={(v)=>handleEdit('swot', 'weakness', v, i)}/></li>
                        ))}
                      </ul>
                    </div>
                    {/* 기회 */}
                    <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                      <h4 className="font-bold text-emerald-800 mb-2 text-sm flex items-center"><TrendingUp size={14} className="mr-1"/> Opportunity (기회)</h4>
                      <ul className="list-disc pl-4 text-sm text-slate-700 space-y-1">
                        {result.swot?.opportunity?.map((item, i) => (
                          <li key={i}><EditableContent value={item} onSave={(v)=>handleEdit('swot', 'opportunity', v, i)}/></li>
                        ))}
                      </ul>
                    </div>
                    {/* 위협 */}
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                      <h4 className="font-bold text-orange-800 mb-2 text-sm flex items-center"><Shield size={14} className="mr-1"/> Threat (위협)</h4>
                      <ul className="list-disc pl-4 text-sm text-slate-700 space-y-1">
                        {result.swot?.threat?.map((item, i) => (
                          <li key={i}><EditableContent value={item} onSave={(v)=>handleEdit('swot', 'threat', v, i)}/></li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </section>

                {/* 2. 3C 분석 */}
                <section>
                   <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center"><Globe className="mr-2 text-blue-600"/> 3C 분석</h3>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                       <h4 className="font-bold text-slate-700 mb-2 text-center border-b pb-2">Company (자사)</h4>
                       <EditableContent className="text-sm text-slate-600 leading-relaxed" value={result.analysis_3c?.company} onSave={(v)=>handleEdit('analysis_3c', 'company', v)} />
                     </div>
                     <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                       <h4 className="font-bold text-slate-700 mb-2 text-center border-b pb-2">Competitor (경쟁사)</h4>
                       <EditableContent className="text-sm text-slate-600 leading-relaxed" value={result.analysis_3c?.competitor} onSave={(v)=>handleEdit('analysis_3c', 'competitor', v)} />
                     </div>
                     <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                       <h4 className="font-bold text-slate-700 mb-2 text-center border-b pb-2">Customer (고객)</h4>
                       <EditableContent className="text-sm text-slate-600 leading-relaxed" value={result.analysis_3c?.customer} onSave={(v)=>handleEdit('analysis_3c', 'customer', v)} />
                     </div>
                   </div>
                </section>

                {/* 3. 인재상 및 전략 */}
                <section className="bg-slate-800 text-white p-6 rounded-xl">
                   <h3 className="font-bold text-blue-300 mb-3 flex items-center"><Users className="mr-2"/> 인재상 및 핵심가치</h3>
                   <EditableContent className="text-sm text-slate-300 mb-6 leading-relaxed" value={result.talent} onSave={(v)=>handleEdit('talent', null, v)} />
                   
                   <h3 className="font-bold text-yellow-400 mb-3 flex items-center"><Lightbulb className="mr-2"/> 지원 전략 및 조언</h3>
                   <EditableContent className="text-sm text-slate-300 leading-relaxed" value={result.strategy} onSave={(v)=>handleEdit('strategy', null, v)} />
                </section>
              </div>

              <div className="mt-12 pt-6 border-t border-slate-200 flex justify-between items-center text-xs text-slate-400 mt-auto">
                <div className="flex items-center"><Building2 className="w-4 h-4 mr-1 text-blue-500" /><span>Career Vitamin</span></div>
                <span>AI-Powered Company Analysis Report</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Building2 size={64} className="mb-4 opacity-20"/>
              <p>분석하고 싶은 기업 이름을 입력하세요.</p>
            </div>
          )}
        </main>
        
        {/* 저장 버튼 */}
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