import React, { useState, useEffect } from 'react';

const Clinic = () => {
  // 1. 입력 상태값 관리
  const [inputs, setInputs] = useState({
    company: '',       // 지원 기업명 (필수)
    job: '',           // 지원 직무명 (필수)
    question: '',      // 자소서 항목명 (필수)
    content: '',       // 초안 입력 (필수)
    limit: '',         // 글자수 제한 (옵션)
    request: ''        // 요청사항 (옵션)
  });

  const [byteCount, setByteCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // 2. 글자수(Byte) 계산 로직 (한글 2byte, 영문 1byte)
  useEffect(() => {
    const text = inputs.content;
    let byte = 0;
    for (let i = 0; i < text.length; i++) {
      // 한글 및 특수문자는 2byte, 그 외(영어, 숫자)는 1byte 처리
      text.charCodeAt(i) > 127 ? byte += 2 : byte += 1;
    }
    setByteCount(byte);
  }, [inputs.content]);

  // 입력값 변경 핸들러
  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: value }));
  };

  // 3. 클리닉 요청 핸들러
  const handleAnalyze = () => {
    // 필수값 체크
    if (!inputs.company || !inputs.job || !inputs.question || !inputs.content) {
      return alert("필수 항목(*)을 모두 입력해주세요!");
    }

    setLoading(true);
    setResult(null);

    // 가짜(Mock) AI 응답
    setTimeout(() => {
      setResult({
        original: inputs.content,
        evaluation: `[강평]\n- ${inputs.company}의 ${inputs.job} 직무에 필요한 '분석력'을 잘 강조했습니다.\n- 다만, 경험의 구체적인 수치가 부족하여 설득력이 다소 떨어집니다.\n- 요청하신 '${inputs.request || '구조화'}' 부분을 보완했습니다.`,
        revision: `[수정안]\n저는 ${inputs.company}의 ${inputs.job}로서... (중략) ... 이러한 경험을 통해 20%의 효율 증대를 이뤄냈습니다.`
      });
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="flex h-full p-6 gap-6 bg-gray-50 text-gray-800">
      
      {/* ================= 좌측: 입력 메뉴 (고정 폭) ================= */}
      <div className="w-1/3 min-w-[350px] flex flex-col gap-5 bg-white p-6 rounded-xl shadow-sm border border-gray-200 overflow-y-auto">
        <h2 className="text-2xl font-bold text-indigo-700 flex items-center gap-2">
          🩺 자기소개서 클리닉
        </h2>
        
        {/* 필수 항목 영역 */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-500 border-b pb-1">필수 입력 항목</h3>
          
          <div>
            <label className="block text-sm font-bold mb-1">지원 기업명 <span className="text-red-500">*</span></label>
            <input 
              name="company" value={inputs.company} onChange={handleChange}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-300 outline-none" 
              placeholder="예: 삼성전자"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1">지원 직무명 <span className="text-red-500">*</span></label>
            <input 
              name="job" value={inputs.job} onChange={handleChange}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-300 outline-none" 
              placeholder="예: 마케팅 기획"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1">항목명(질문) <span className="text-red-500">*</span></label>
            <input 
              name="question" value={inputs.question} onChange={handleChange}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-300 outline-none" 
              placeholder="예: 지원동기 및 포부"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1">초안 입력 <span className="text-red-500">*</span></label>
            <textarea 
              name="content" value={inputs.content} onChange={handleChange}
              className="w-full h-40 p-2 border rounded focus:ring-2 focus:ring-indigo-300 outline-none resize-none" 
              placeholder="작성한 초안을 붙여넣으세요."
            />
            {/* 글자수 카운터 */}
            <div className="text-right text-xs text-gray-500 mt-1">
              공백포함 <span className="font-bold text-indigo-600">{inputs.content.length}자</span> 
              <span className="mx-1">/</span> 
              <span className="font-bold text-gray-600">{byteCount} byte</span>
            </div>
          </div>
        </div>

        {/* 옵션 항목 영역 */}
        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-bold text-gray-500 border-b pb-1">옵션 설정</h3>
          
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-bold mb-1">제한 글자수</label>
              <input 
                name="limit" value={inputs.limit} onChange={handleChange}
                type="number"
                className="w-full p-2 border rounded outline-none" 
                placeholder="예: 700"
              />
            </div>
            <div className="flex items-end pb-2 text-xs text-gray-400">
              * 바이트 환산 시 약 {inputs.limit ? inputs.limit * 2 : 0} byte
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-1">특별 요청사항</label>
            <input 
              name="request" value={inputs.request} onChange={handleChange}
              className="w-full p-2 border rounded outline-none" 
              placeholder="예: 경험을 구조화해주세요."
            />
          </div>
        </div>

        {/* 실행 버튼 */}
        <button 
          onClick={handleAnalyze} 
          disabled={loading}
          className={`w-full py-3 rounded-lg font-bold text-white shadow-md transition-all mt-auto ${
            loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.02]'
          }`}
        >
          {loading ? '분석 중... ⏳' : '클리닉 요청 ⚡'}
        </button>
      </div>


      {/* ================= 우측: 결과 콘텐츠 (가변 폭) ================= */}
      <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
        
        {/* 결과가 없을 때 보이는 안내 문구 */}
        {!result && !loading && (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 rounded-xl bg-white/50">
            <div className="text-6xl mb-4">🩺</div>
            <p className="text-lg">좌측에 내용을 입력하고 <strong>[클리닉 요청]</strong>을 눌러주세요.</p>
          </div>
        )}

        {/* 로딩 화면 */}
        {loading && (
          <div className="h-full flex flex-col items-center justify-center bg-white rounded-xl shadow-sm animate-pulse">
            <div className="text-4xl mb-2">🤖</div>
            <p className="text-indigo-600 font-bold">AI 코치가 자소서를 분석하고 있습니다...</p>
          </div>
        )}

        {/* 결과 화면 (3단 구성: 초안 -> 강평 -> 수정안) */}
        {result && (
          <>
            {/* 1. 사용자가 입력한 초안 확인용 */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-wider">Original Draft</h3>
              <h2 className="text-lg font-bold text-gray-800 mb-3">📄 입력하신 초안</h2>
              <p className="text-gray-600 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg text-sm">
                {result.original}
              </p>
            </div>

            {/* 2. 강평 클리닉 */}
            <div className="bg-blue-50 p-6 rounded-xl shadow-sm border border-blue-100">
              <h3 className="text-sm font-bold text-blue-500 mb-2 uppercase tracking-wider">Clinic & Feedback</h3>
              <h2 className="text-lg font-bold text-blue-900 mb-3">📊 강평 및 분석</h2>
              <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {result.evaluation}
              </div>
            </div>

            {/* 3. 수정안 */}
            <div className="bg-indigo-50 p-6 rounded-xl shadow-md border-l-4 border-indigo-500">
              <h3 className="text-sm font-bold text-indigo-500 mb-2 uppercase tracking-wider">Revised Version</h3>
              <h2 className="text-xl font-bold text-indigo-900 mb-3">✨ AI 수정 제안</h2>
              <div className="bg-white p-5 rounded-lg border border-indigo-100 text-gray-800 whitespace-pre-wrap leading-relaxed">
                {result.revision}
              </div>
              
              {/* 복사 버튼 등 유틸리티 (추후 기능) */}
              <div className="mt-4 text-right">
                <button 
                  className="text-xs font-bold text-indigo-500 hover:underline"
                  onClick={() => navigator.clipboard.writeText(result.revision)}
                >
                  📋 수정안 복사하기
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Clinic;