import React, { useState, useRef } from 'react';
import { 
  Building2, ChevronLeft, Search, Loader2, 
  Target, TrendingUp, Users, Lightbulb, Download, FileText,
  Globe, Shield, Sword, Briefcase, MessageSquare, History, Flag, CheckCircle
} from 'lucide-react';
import { fetchGemini, saveAsPng, saveAsPdf } from '../api';

import { Toast, EditableContent, Footer } from './SharedUI';

export default function CompanyAnalysisApp({ onClose }) {
  // 1. 입력값 관리 (기업명, URL, 직무, 요청사항)
  const [inputs, setInputs] = useState({
    company: '',
    url: '',
    job: '',
    request: ''
  });
  
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const reportRef = useRef(null);

  const showToast = (msg) => setToastMsg(msg);

  // 2. AI 분석 요청
  const handleAnalysis = async () => {
    if (!inputs.company.trim()) return showToast("분석할 기업명을 입력해주세요.");
    
    setLoading(true);
    try {
      const prompt = `
      당신은 20년 경력의 기업 분석 전문가이자 커리어 컨설턴트입니다.
      아래 정보를 바탕으로 지원자를 위한 [프리미엄 기업 분석 리포트]를 작성해주세요.
      
      [분석 대상 정보]
      1. 기업명: ${inputs.company}
      2. 홈페이지/참고 URL: ${inputs.url || '알아서 검색'}
      3. 지원 희망 직무: ${inputs.job || '전사 관점(직무 무관)'}
      4. 사용자 특별 요청사항: ${inputs.request || '최신 채용 트렌드 및 합격 전략 위주로 분석'}

      [작성 가이드]
      - 쿠팡, 삼성전자 등 대기업 분석 리포트 수준으로 상세하게 작성할 것.
      - '지원 희망 직무'와 '요청사항'을 분석 전반에 깊이 있게 반영할 것.
      - 뜬구름 잡는 소리 대신, 자소서와 면접에 바로 쓸 수 있는 구체적인 Fact와 Insight를 제공할 것.

      [반드시 다음 JSON 형식을 엄수할 것]
      {
        "section1": {
          "summary": "기업 개요 (산업 분야, 규모, 주요 위상 등 3문장 요약)",
          "history": "주요 연혁 (설립, 상장, 최근 3년 내 주요 이슈 등 핵심만)",
          "vision": "비전 및 미션 (기업이 추구하는 미래 가치)",
          "core_values": "핵심 가치 (일하는 방식, 조직 문화 키워드)",
          "talent": "인재상 (채용 페이지 기반 선호하는 인재 유형)"
        },
        "section2": {
          "business_policy": "주요 사업 정책 및 현황 (주력 상품, 서비스, 최근 사업 방향)",
          "swot": {
            "strength": ["강점1", "강점2"],
            "weakness": ["약점1", "약점2"],
            "opportunity": ["기회1", "기회2"],
            "threat": ["위협1", "위협2"]
          }
        },
        "section3": {
          "market_trend": "국내외 시장 및 산업 동향 (업계 분위기, 성장성)",
          "competitor": "경쟁사 대비 차별점 및 위치 (주요 경쟁사와 비교 분석)"
        },
        "section4": {
          "strategies": [
            "전략1: 지원 직무와 연관된 구체적인 어필 포인트",
            "전략2: 기업의 최근 이슈(신사업 등)를 활용한 접근법",
            "전략3: 인재상/조직문화에 맞춘 태도 강조 전략",
            "전략4: 요청사항(${inputs.request})에 대한 맞춤형 조언"
          ]
        }
      }`;

      const parsed = await fetchGemini(prompt);
      setResult(parsed);
    } catch (e) {
      showToast(e.message);
    } finally {
      setLoading(false);
    }
  };

  // 내용 수정 핸들러
  const handleEdit = (section, subKey, value, index = null, deepKey = null) => {
    setResult(prev => {
      const newData = { ...prev };
      if (deepKey) { // swot 같은 중첩 객체 배열 수정
        newData[section][subKey][deepKey][index] = value;
      } else if (index !== null) { // 배열 수정 (strategies)
        newData[section][subKey][index] = value;
      } else { // 일반 텍스트 수정
        newData[section][subKey] = value;
      }
      return newData;
    });
  };

  const handleDownload = () => saveAsPng(reportRef, `${inputs.company}_기업분석`, showToast);
  const handlePdfDownload = () => saveAsPdf(reportRef, `${inputs.company}_기업분석`, showToast);

  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col font-sans text-slate-800">
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
      
      {/* 상단 헤더 */}
      <header className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <Building2 className="text-blue-400"/>
          <h1 className="font-bold text-lg">기업 분석 리포트 (Premium)</h1>
        </div>
        <button onClick={onClose} className="flex items-center text-sm hover:text-blue-200 transition-colors">
          <ChevronLeft className="w-5 h-5 mr-1"/> 돌아가기
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* 사이드바: 입력창 4개 복구 */}
        <aside className="w-80 bg-white border-r p-6 shrink-0 overflow-y-auto">
          <div className="space-y-6">
            <h3 className="font-bold text-sm text-blue-800 flex items-center border-b pb-2"><Search size={16} className="mr-2"/> 분석 조건 설정</h3>
            
            {/* 1. 기업명 */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">기업명 <span className="text-red-500">*</span></label>
              <input 
                value={inputs.company}
                onChange={(e) => setInputs({...inputs, company: e.target.value})}
                className="w-full p-2.5 border rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" 
                placeholder="예: 삼성전자, 쿠팡" 
              />
            </div>

            {/* 2. 홈페이지 URL */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">홈페이지/채용 URL (선택)</label>
              <input 
                value={inputs.url}
                onChange={(e) => setInputs({...inputs, url: e.target.value})}
                className="w-full p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                placeholder="URL을 입력하면 더 정확해집니다" 
              />
            </div>

            {/* 3. 직무명 */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">지원 희망 직무 (선택)</label>
              <div className="relative">
                <input 
                  value={inputs.job}
                  onChange={(e) => setInputs({...inputs, job: e.target.value})}
                  className="w-full p-2.5 pl-9 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="예: 마케팅, SW개발" 
                />
                <Briefcase className="absolute left-3 top-2.5 text-slate-400 w-4 h-4"/>
              </div>
            </div>

            {/* 4. 요청사항 */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">특별 요청사항 (선택)</label>
              <textarea 
                value={inputs.request}
                onChange={(e) => setInputs({...inputs, request: e.target.value})}
                className="w-full p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none" 
                placeholder="예: 최근 신사업 이슈 위주로 분석해주세요. 경쟁사 비교를 깊이 있게 해주세요." 
              />
            </div>

            <button 
              onClick={handleAnalysis} 
              disabled={loading} 
              className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold mt-2 shadow-lg hover:bg-blue-700 transition-all disabled:bg-slate-400"
            >
              {loading ? <Loader2 className="animate-spin mx-auto"/> : "상세 분석 시작"}
            </button>
          </div>
        </aside>

        {/* 메인 결과 화면 */}
        <main className="flex-1 p-8 overflow-y-auto flex justify-center bg-slate-50">
          {result ? (
            <div ref={reportRef} className="w-[210mm] min-h-[297mm] h-fit bg-white shadow-2xl p-12 flex flex-col animate-in fade-in zoom-in-95 duration-500">
              {/* 타이틀 영역 */}
              <div className="border-b-4 border-blue-900 pb-6 mb-8">
                <div className="flex justify-between items-end">
                  <div>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold tracking-wider mb-3 inline-block">CORPORATE ANALYSIS</span>
                    <h1 className="text-4xl font-extrabold text-slate-900 mb-2">{inputs.company}</h1>
                    <p className="text-slate-500 font-medium">{inputs.job ? `${inputs.job} 직무 중심 분석` : '종합 기업 분석'}</p>
                  </div>
                  <div className="text-right text-xs text-slate-400">
                    <p>Powered by Career Vitamin</p>
                    <p>{new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-10">
                {/* 1. 기업 개요 및 현황 (Overview) */}
                <section>
                  <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center border-b pb-2"><Building2 className="mr-2 text-blue-600"/> 1. 기업 개요 및 현황</h3>
                  <div className="bg-slate-50 p-5 rounded-xl mb-4 border border-slate-200">
                    <h4 className="font-bold text-sm text-slate-700 mb-2">기업 개요</h4>
                    <EditableContent className="text-sm text-slate-600 leading-relaxed" value={result.section1?.summary} onSave={(v)=>handleEdit('section1', 'summary', v)} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white border p-4 rounded-lg">
                       <h4 className="font-bold text-xs text-blue-800 mb-2 flex items-center"><History size={14} className="mr-1"/> 주요 연혁</h4>
                       <EditableContent className="text-xs text-slate-600 leading-relaxed" value={result.section1?.history} onSave={(v)=>handleEdit('section1', 'history', v)} />
                    </div>
                    <div className="bg-white border p-4 rounded-lg">
                       <h4 className="font-bold text-xs text-blue-800 mb-2 flex items-center"><Flag size={14} className="mr-1"/> 비전 & 미션</h4>
                       <EditableContent className="text-xs text-slate-600 leading-relaxed" value={result.section1?.vision} onSave={(v)=>handleEdit('section1', 'vision', v)} />
                    </div>
                    <div className="bg-white border p-4 rounded-lg">
                       <h4 className="font-bold text-xs text-blue-800 mb-2 flex items-center"><CheckCircle size={14} className="mr-1"/> 핵심 가치</h4>
                       <EditableContent className="text-xs text-slate-600 leading-relaxed" value={result.section1?.core_values} onSave={(v)=>handleEdit('section1', 'core_values', v)} />
                    </div>
                    <div className="bg-white border p-4 rounded-lg">
                       <h4 className="font-bold text-xs text-blue-800 mb-2 flex items-center"><Users size={14} className="mr-1"/> 인재상</h4>
                       <EditableContent className="text-xs text-slate-600 leading-relaxed" value={result.section1?.talent} onSave={(v)=>handleEdit('section1', 'talent', v)} />
                    </div>
                  </div>
                </section>

                {/* 2. 주요 사업 & SWOT */}
                <section>
                  <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center border-b pb-2"><Target className="mr-2 text-blue-600"/> 2. 주요 사업 & SWOT</h3>
                  <div className="mb-6">
                    <h4 className="font-bold text-sm text-slate-700 mb-2">주요 사업 정책</h4>
                    <EditableContent className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-lg" value={result.section2?.business_policy} onSave={(v)=>handleEdit('section2', 'business_policy', v)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Strength */}
                    <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                      <h4 className="font-bold text-blue-800 mb-2 text-sm flex items-center uppercase">Strength (강점)</h4>
                      <ul className="list-disc pl-4 text-xs text-slate-700 space-y-1">
                        {result.section2?.swot?.strength?.map((item, i) => (
                          <li key={i}><EditableContent value={item} onSave={(v)=>handleEdit('section2', 'swot', v, i, 'strength')}/></li>
                        ))}
                      </ul>
                    </div>
                    {/* Weakness */}
                    <div className="bg-red-50/50 p-4 rounded-lg border border-red-100">
                      <h4 className="font-bold text-red-800 mb-2 text-sm flex items-center uppercase">Weakness (약점)</h4>
                      <ul className="list-disc pl-4 text-xs text-slate-700 space-y-1">
                        {result.section2?.swot?.weakness?.map((item, i) => (
                          <li key={i}><EditableContent value={item} onSave={(v)=>handleEdit('section2', 'swot', v, i, 'weakness')}/></li>
                        ))}
                      </ul>
                    </div>
                    {/* Opportunity */}
                    <div className="bg-emerald-50/50 p-4 rounded-lg border border-emerald-100">
                      <h4 className="font-bold text-emerald-800 mb-2 text-sm flex items-center uppercase">Opportunity (기회)</h4>
                      <ul className="list-disc pl-4 text-xs text-slate-700 space-y-1">
                        {result.section2?.swot?.opportunity?.map((item, i) => (
                          <li key={i}><EditableContent value={item} onSave={(v)=>handleEdit('section2', 'swot', v, i, 'opportunity')}/></li>
                        ))}
                      </ul>
                    </div>
                    {/* Threat */}
                    <div className="bg-orange-50/50 p-4 rounded-lg border border-orange-100">
                      <h4 className="font-bold text-orange-800 mb-2 text-sm flex items-center uppercase">Threat (위협)</h4>
                      <ul className="list-disc pl-4 text-xs text-slate-700 space-y-1">
                        {result.section2?.swot?.threat?.map((item, i) => (
                          <li key={i}><EditableContent value={item} onSave={(v)=>handleEdit('section2', 'swot', v, i, 'threat')}/></li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </section>

                {/* 3. 시장 및 경쟁 분석 */}
                <section>
                   <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center border-b pb-2"><Globe className="mr-2 text-blue-600"/> 3. 시장 및 경쟁 분석</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                       <h4 className="font-bold text-slate-700 mb-2 flex items-center"><TrendingUp size={16} className="mr-1"/> 국내외 산업 동향</h4>
                       <EditableContent className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-lg h-full" value={result.section3?.market_trend} onSave={(v)=>handleEdit('section3', 'market_trend', v)} />
                     </div>
                     <div>
                       <h4 className="font-bold text-slate-700 mb-2 flex items-center"><Sword size={16} className="mr-1"/> 경쟁사 대비 강점/위치</h4>
                       <EditableContent className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-lg h-full" value={result.section3?.competitor} onSave={(v)=>handleEdit('section3', 'competitor', v)} />
                     </div>
                   </div>
                </section>

                {/* 4. 지원자 취업 전략 */}
                <section className="bg-slate-900 text-white p-6 rounded-xl mt-4">
                   <h3 className="font-bold text-yellow-400 mb-4 flex items-center text-lg"><Lightbulb className="mr-2"/> 4. 지원자 합격 전략</h3>
                   <div className="space-y-3">
                      {result.section4?.strategies?.map((item, i) => (
                        <div key={i} className="flex items-start">
                          <span className="bg-blue-600 text-xs font-bold px-2 py-0.5 rounded mr-2 mt-0.5 shrink-0">POINT {i+1}</span>
                          <EditableContent className="text-sm text-slate-300 leading-relaxed" value={item} onSave={(v)=>handleEdit('section4', 'strategies', v, i)} />
                        </div>
                      ))}
                   </div>
                </section>
              </div>

              {/* 푸터 */}
              </Footer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Building2 size={64} className="mb-4 opacity-20"/>
              <p className="mt-4 text-center">좌측 메뉴에서 기업 정보를 입력하고<br/><strong>[상세 분석 시작]</strong>을 눌러주세요.</p>
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