import React, { useState, useRef } from 'react';
import { 
  MapPin, ChevronLeft, Loader2, 
  Target, Flag, TrendingUp, Award, Download, FileText,
  User, Briefcase, Clock, Calendar, Building2
} from 'lucide-react';
import { fetchGemini, saveAsPng, saveAsPdf } from '../api';
import { Toast, EditableContent, Footer } from './SharedUI';

export default function CareerRoadmapApp({ onClose }) {
  // 상태 관리
  const [targetCompany, setTargetCompany] = useState(''); // [수정] 기업명 분리
  const [targetJob, setTargetJob] = useState('');         // [수정] 직무명 분리
  
  const [careerType, setCareerType] = useState('new'); // 'new' | 'experienced'
  const [experienceYears, setExperienceYears] = useState(''); 
  const [goalPeriod, setGoalPeriod] = useState('10'); // '3', '5', '10'

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const reportRef = useRef(null);

  const showToast = (msg) => setToastMsg(msg);

  const handleGenerate = async () => {
    // [수정] 필수값 체크 분리
    if (!targetCompany.trim()) return showToast("목표 기업명을 입력해주세요.");
    if (!targetJob.trim()) return showToast("목표 직무명을 입력해주세요.");
    
    if (careerType === 'experienced') {
        if (!experienceYears || isNaN(experienceYears) || Number(experienceYears) <= 0) {
            return showToast("유효한 경력 연수를 숫자로 입력해주세요.");
        }
    }
    
    setLoading(true);
    try {
      // 1. 기준 시점 텍스트 생성
      const today = new Date();
      const currentYear = today.getFullYear();
      let baseYearStr = `${currentYear}년 (신입 입사 기준)`;
      let experienceContext = "갓 입사한 신입 사원";

      if (careerType === 'experienced') {
          const expY = parseInt(experienceYears, 10);
          baseYearStr = `${currentYear}년 현재, 관련 경력 ${expY}년차 보유`;
          experienceContext = `이미 관련 분야 실무 경력 ${expY}년을 보유한 경력직`;
      }

      // 2. 목표 기간 로직
      const goalY = parseInt(goalPeriod, 10); 
      let roadmapSteps = "1년 후, 3년 후";
      if (goalY >= 5) roadmapSteps += ", 5년 후";
      if (goalY >= 10) roadmapSteps += ", 10년 후";

      const prompt = `
      당신은 대기업 인사팀장 출신의 커리어 컨설턴트입니다.
      지원자가 목표로 하는 기업(${targetCompany})과 직무(${targetJob})에 맞춰, **[${goalY}년 커리어 로드맵]**과 포부 스크립트를 작성해주세요.

      [지원자 정보]
      1. 목표 기업: ${targetCompany}
      2. 목표 직무: ${targetJob}
      3. 현재 상태: ${experienceContext}
      4. 로드맵 기준 시점: ${baseYearStr}
      5. 목표 달성 기간: 입사 후 ${goalY}년

      [작성 요청사항]
      1. **로드맵 설계:** - **${targetCompany}**의 산업 특성과 **${targetJob}** 직무의 커리어 패스를 고려하여 작성하세요.
         - **${goalY}년이라는 기간에 맞춰** 단계별(${roadmapSteps}) 핵심 목표와 구체적 실행 계획(Action Plan)을 짜주세요.
      
      2. **입사 후 포부 스크립트 (형식 엄수):**
         - **반드시 다음 문장 패턴으로 시작하세요:**
           "저는 입사 ${goalY}년 후, ${targetCompany}에서 [최종 경력 목표]를 이루고자 합니다. 이를 위해 첫째..."
         - 기업명(${targetCompany})을 언급하며 로열티를 보여주세요.
         - 설정한 기간(${goalY}년) 내에 달성 가능한 계획을 두괄식으로 말해주세요. (구어체, 400~500자)

      [JSON 출력 형식]
      {
        "main_goal": "${goalY}년 후 ${targetCompany}에서 달성할 최종 비전 (한 줄)",
        "roadmap": {
          "year1": { "goal": "1년 후 핵심 목표", "plan": "구체적 실행 계획" },
          "year3": { "goal": "3년 후 핵심 목표", "plan": "구체적 실행 계획" }
          ${goalY >= 5 ? ', "year5": { "goal": "5년 후 핵심 목표", "plan": "구체적 실행 계획" }' : ''}
          ${goalY >= 10 ? ', "year10": { "goal": "10년 후 핵심 목표", "plan": "구체적 실행 계획" }' : ''}
        },
        "aspiration_script": "형식에 맞춰 작성된 입사 후 포부 스크립트"
      }`;

      const parsed = await fetchGemini(prompt);
      setResult(parsed);
    } catch (e) {
      showToast(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (section, key, value) => {
    setResult(prev => {
      const newData = { ...prev };
      if (section === 'roadmap') {
        newData.roadmap[key].plan = value;
      } else {
        newData[section] = value;
      }
      return newData;
    });
  };

  const handleDownload = () => saveAsPng(reportRef, `커리어로드맵_${targetCompany}_${targetJob}`, showToast);
  const handlePdfDownload = () => saveAsPdf(reportRef, `커리어로드맵_${targetCompany}_${targetJob}`, showToast);

  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col font-sans text-slate-800">
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
      
      {/* 헤더 */}
      <header className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <MapPin className="text-purple-400"/>
          <h1 className="font-bold text-lg">AI 커리어 로드맵 설계</h1>
        </div>
        <button onClick={onClose} className="flex items-center text-sm hover:text-purple-200 transition-colors">
          <ChevronLeft className="w-5 h-5 mr-1"/> 돌아가기
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* 사이드바: 입력창 */}
        <aside className="w-80 bg-white border-r p-6 shrink-0 overflow-y-auto">
          <div className="space-y-6">
            <h3 className="font-bold text-sm text-purple-800 flex items-center border-b pb-2">
              <Target size={16} className="mr-2"/> 목표 설정 (필수)
            </h3>
            
            {/* [수정] 기업명 입력 */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">목표 기업명 <span className="text-red-500">*</span></label>
              <div className="relative">
                <input 
                  value={targetCompany}
                  onChange={(e) => setTargetCompany(e.target.value)}
                  className="w-full p-2.5 pl-9 border rounded-lg text-sm font-bold focus:ring-2 focus:ring-purple-500 outline-none" 
                  placeholder="예: 삼성전자, 카카오" 
                />
                <Building2 className="absolute left-3 top-2.5 text-slate-400 w-4 h-4"/>
              </div>
            </div>

            {/* [수정] 직무명 입력 */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">목표 직무 <span className="text-red-500">*</span></label>
              <div className="relative">
                <input 
                  value={targetJob}
                  onChange={(e) => setTargetJob(e.target.value)}
                  className="w-full p-2.5 pl-9 border rounded-lg text-sm font-bold focus:ring-2 focus:ring-purple-500 outline-none" 
                  placeholder="예: 마케팅, SW개발" 
                />
                <Briefcase className="absolute left-3 top-2.5 text-slate-400 w-4 h-4"/>
              </div>
            </div>

            {/* 신입/경력 선택 */}
            <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-500 mb-2">지원 유형</label>
                <div className="flex border rounded-lg overflow-hidden mb-3">
                    <button
                        onClick={() => setCareerType('new')}
                        className={`flex-1 py-2 text-sm font-bold flex items-center justify-center gap-1 ${careerType === 'new' ? 'bg-purple-100 text-purple-700' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                    >
                        <User size={16}/> 신입
                    </button>
                    <button
                        onClick={() => setCareerType('experienced')}
                        className={`flex-1 py-2 text-sm font-bold flex items-center justify-center gap-1 ${careerType === 'experienced' ? 'bg-purple-100 text-purple-700' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                    >
                        <Briefcase size={16}/> 경력
                    </button>
                </div>

                {/* 경력직일 때만 보이는 연수 입력창 */}
                {careerType === 'experienced' && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                        <label className="block text-xs font-bold text-slate-500 mb-1">관련 경력 연수 <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <input 
                                type="number"
                                min="1"
                                value={experienceYears}
                                onChange={(e) => setExperienceYears(e.target.value)}
                                className="w-full p-2.5 pl-9 border rounded-lg text-sm font-bold focus:ring-2 focus:ring-purple-500 outline-none" 
                                placeholder="예: 3" 
                            />
                            <Clock className="absolute left-3 top-2.5 text-slate-400 w-4 h-4"/>
                            <span className="absolute right-3 top-2.5 text-sm text-slate-500 font-bold">년</span>
                        </div>
                    </div>
                )}
            </div>

            {/* 목표 달성 기간 선택 */}
            <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-500 mb-2">목표 달성 기간</label>
                <div className="grid grid-cols-3 gap-2">
                    {['3', '5', '10'].map((year) => (
                        <button
                            key={year}
                            onClick={() => setGoalPeriod(year)}
                            className={`py-2 rounded-lg text-sm font-bold border transition-all ${
                                goalPeriod === year 
                                ? 'bg-purple-600 text-white border-purple-600 shadow-md transform scale-105' 
                                : 'bg-white text-slate-500 border-slate-200 hover:border-purple-300 hover:text-purple-500'
                            }`}
                        >
                            {year}년
                        </button>
                    ))}
                </div>
            </div>

            <button 
              onClick={handleGenerate} 
              disabled={loading} 
              className="w-full bg-purple-600 text-white py-3.5 rounded-xl font-bold mt-4 shadow-lg hover:bg-purple-700 transition-all disabled:bg-slate-400"
            >
              {loading ? <Loader2 className="animate-spin mx-auto"/> : "로드맵 생성하기"}
            </button>
          </div>
        </aside>

        {/* 결과 화면 */}
        <main className="flex-1 p-8 overflow-y-auto flex justify-center bg-slate-50">
          {result ? (
            <div ref={reportRef} className="w-[210mm] min-h-[297mm] h-fit bg-white shadow-2xl p-12 flex flex-col animate-in fade-in zoom-in-95 duration-500 relative">
              
              {/* 타이틀: 기업명/직무명 분리 표시 */}
              <div className="border-b-4 border-purple-600 pb-6 mb-8 text-center">
                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-bold tracking-wider mb-3 inline-block">MY CAREER VISION</span>
                
                <h2 className="text-xl font-bold text-slate-500 mb-1 flex items-center justify-center">
                    <Building2 className="w-5 h-5 mr-2" /> {targetCompany}
                </h2>
                <h1 className="text-3xl font-extrabold text-slate-900 mb-2 leading-tight flex items-center justify-center">
                    {targetJob}
                </h1>

                <EditableContent className="text-lg text-purple-700 font-bold mt-2 block" value={result.main_goal} onSave={(v)=>handleEdit('main_goal', null, v)} />
                
                <div className="mt-4 flex justify-center gap-3 text-xs text-slate-500 font-medium">
                    <span className="flex items-center bg-slate-100 px-2 py-1 rounded"><User size={12} className="mr-1"/> {careerType === 'new' ? '신입 지원' : `경력 ${experienceYears}년차`}</span>
                    <span className="flex items-center bg-purple-50 text-purple-700 px-2 py-1 rounded border border-purple-100"><Calendar size={12} className="mr-1"/> {goalPeriod}년 로드맵</span>
                </div>
              </div>

              {/* 로드맵 타임라인 (동적 렌더링) */}
              <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent mb-12">
                
                {/* 1년 후 */}
                {result.roadmap.year1 && (
                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-purple-500 text-slate-500 group-[.is-active]:text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                            <Flag size={18}/>
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between space-x-2 mb-1">
                                <div className="font-bold text-slate-900">1년 후 (적응기)</div>
                                <time className="font-medium text-xs text-purple-600">{new Date().getFullYear() + 1}년</time>
                            </div>
                            <div className="text-slate-700 font-bold text-sm mb-2">{result.roadmap.year1.goal}</div>
                            <EditableContent className="text-slate-600 text-xs leading-relaxed" value={result.roadmap.year1.plan} onSave={(v)=>handleEdit('roadmap', 'year1', v)} />
                        </div>
                    </div>
                )}

                {/* 3년 후 */}
                {result.roadmap.year3 && (
                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-purple-500 text-slate-500 group-[.is-active]:text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                            <TrendingUp size={18}/>
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between space-x-2 mb-1">
                                <div className="font-bold text-slate-900">3년 후 ({parseInt(goalPeriod) === 3 ? '완성기' : '도약기'})</div>
                                <time className="font-medium text-xs text-purple-600">{new Date().getFullYear() + 3}년</time>
                            </div>
                            <div className="text-slate-700 font-bold text-sm mb-2">{result.roadmap.year3.goal}</div>
                            <EditableContent className="text-slate-600 text-xs leading-relaxed" value={result.roadmap.year3.plan} onSave={(v)=>handleEdit('roadmap', 'year3', v)} />
                        </div>
                    </div>
                )}

                {/* 5년 후 */}
                {result.roadmap.year5 && (
                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-purple-500 text-slate-500 group-[.is-active]:text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                            <Award size={18}/>
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between space-x-2 mb-1">
                                <div className="font-bold text-slate-900">5년 후 ({parseInt(goalPeriod) === 5 ? '완성기' : '확장기'})</div>
                                <time className="font-medium text-xs text-purple-600">{new Date().getFullYear() + 5}년</time>
                            </div>
                            <div className="text-slate-700 font-bold text-sm mb-2">{result.roadmap.year5.goal}</div>
                            <EditableContent className="text-slate-600 text-xs leading-relaxed" value={result.roadmap.year5.plan} onSave={(v)=>handleEdit('roadmap', 'year5', v)} />
                        </div>
                    </div>
                )}

                {/* 10년 후 */}
                {result.roadmap.year10 && (
                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-purple-600 text-slate-500 group-[.is-active]:text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                            <Target size={18}/>
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-purple-200 shadow-md bg-purple-50">
                            <div className="flex items-center justify-between space-x-2 mb-1">
                                <div className="font-bold text-purple-900">10년 후 (완성기)</div>
                                <time className="font-medium text-xs text-purple-600">{new Date().getFullYear() + 10}년</time>
                            </div>
                            <div className="text-purple-800 font-bold text-sm mb-2">{result.roadmap.year10.goal}</div>
                            <EditableContent className="text-slate-700 text-xs leading-relaxed font-medium" value={result.roadmap.year10.plan} onSave={(v)=>handleEdit('roadmap', 'year10', v)} />
                        </div>
                    </div>
                )}
              </div>

              {/* 입사 후 포부 스크립트 */}
              <section className="mt-auto bg-slate-800 text-white p-6 rounded-2xl relative overflow-hidden shadow-lg">
                   <h3 className="text-xl font-bold text-purple-300 mb-4 flex items-center">
                       <FileText className="mr-2"/> 입사 후 포부 스크립트
                   </h3>
                   <div className="text-slate-300 text-xs mb-4 border-b border-slate-700 pb-3">
                       💡 <strong>{targetCompany}</strong> 지원을 위한 {goalPeriod}년 목표 달성 로드맵입니다.
                   </div>
                   <div className="leading-relaxed text-base text-white font-medium text-justify">
                     <EditableContent value={result.aspiration_script} onSave={(v)=>handleEdit('aspiration_script', null, v)} />
                   </div>
              </section>

              <Footer />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <MapPin size={64} className="mb-4 opacity-20"/>
              <p className="text-center mt-4">
                좌측에서 <strong>목표 기업</strong>과 <strong>직무</strong>를 입력하고,<br/>
                나만의 커리어 로드맵을 설계해보세요.
              </p>
            </div>
          )}
        </main>

        {result && (
          <div className="absolute bottom-8 right-8 flex gap-3 z-50">
            <button onClick={handleDownload} className="bg-white text-slate-900 border border-slate-200 px-6 py-3 rounded-full font-bold shadow-xl hover:-translate-y-1 flex items-center transition-transform"><Download className="mr-2" size={20}/> 이미지 저장</button>
            <button onClick={handlePdfDownload} className="bg-purple-900 text-white px-6 py-3 rounded-full font-bold shadow-xl hover:-translate-y-1 flex items-center transition-transform"><FileText className="mr-2" size={20}/> PDF 저장</button>
          </div>
        )}
      </div>
    </div>
  );
}