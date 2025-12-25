import React, { useState, useRef } from 'react';
// ❌ 아이콘 import 전부 제거 (충돌 원천 차단)
// ✅ 기능 import만 유지
import { fetchGemini, saveAsPng, saveAsPdf } from '../api';
import { Toast, EditableContent, Footer } from './SharedUI';

const DEFAULT_AREAS = [
  { id: 'work', label: '업(業)', score: 5, note: '' },
  { id: 'growth', label: '자기성장', score: 5, note: '' },
  { id: 'contribution', label: '사회공헌', score: 5, note: '' },
  { id: 'family', label: '가족', score: 5, note: '' },
  { id: 'relation', label: '인간관계', score: 5, note: '' },
  { id: 'material', label: '물적소유', score: 5, note: '' },
  { id: 'finance', label: '재무', score: 5, note: '' },
  { id: 'leisure', label: '여가', score: 5, note: '' },
];

export default function LifeDesignApp({ onClose }) {
  const [areas, setAreas] = useState(DEFAULT_AREAS);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const reportRef = useRef(null);

  const showToast = (msg) => setToastMsg(msg);

  const handleScoreChange = (index, val) => {
    const newAreas = [...areas];
    newAreas[index].score = parseInt(val, 10);
    setAreas(newAreas);
  };

  const handleNoteChange = (index, val) => {
    const newAreas = [...areas];
    newAreas[index].note = val;
    setAreas(newAreas);
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const sorted = [...areas].sort((a, b) => b.score - a.score);
      const inputSummary = sorted.map((a, i) => `${i+1}위. ${a.label}(${a.score}점): ${a.note}`).join('\n');

      const prompt = `
      당신은 생애설계 코치입니다. 다음 8대 영역 점수를 분석해 코칭해주세요.
      
      [데이터]
      ${inputSummary}

      [형식 (JSON)]
      {
        "overall_review": "총평 한줄",
        "high_satisfaction": { "title": "만족 영역", "summary": "내용", "coaching": "조언" },
        "low_satisfaction": { "title": "보완 영역", "summary": "내용", "coaching": "조언" }
      }`;

      const parsed = await fetchGemini(prompt);
      setResult(parsed);
    } catch (e) { showToast(e.message); } finally { setLoading(false); }
  };

  const handleEdit = (section, key, value) => {
    setResult(prev => {
      const newData = { ...prev };
      if (key) newData[section][key] = value;
      else newData[section] = value;
      return newData;
    });
  };

  // 렌더링 시작
  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col p-4 overflow-auto">
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
      
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h1 className="text-xl font-bold text-black">📋 인생 8대 영역 진단 (텍스트 버전)</h1>
        <button onClick={onClose} className="bg-gray-200 px-4 py-2 rounded font-bold">❌ 닫기</button>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* 입력창 */}
        <div className="w-full md:w-1/3 space-y-4">
          <div className="bg-blue-50 p-4 rounded text-sm text-blue-800">
            점수와 메모를 입력하고 [진단하기] 버튼을 누르세요.
          </div>
          {areas.map((area, i) => (
            <div key={i} className="border p-3 rounded">
              <div className="flex justify-between font-bold mb-2">
                <span>{area.label}</span>
                <span className="text-blue-600">{area.score}점</span>
              </div>
              <input 
                type="range" min="1" max="10" value={area.score} 
                onChange={(e)=>handleScoreChange(i, e.target.value)}
                className="w-full mb-2"
              />
              <input 
                type="text" 
                placeholder="간단 메모"
                value={area.note}
                onChange={(e)=>handleNoteChange(i, e.target.value)}
                className="w-full border p-2 text-sm rounded"
              />
            </div>
          ))}
          <button 
            onClick={handleGenerate} 
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded font-bold text-lg"
          >
            {loading ? "분석중..." : "진단하기"}
          </button>
        </div>

        {/* 결과창 */}
        <div className="w-full md:w-2/3 bg-gray-50 p-8 rounded min-h-[500px]" ref={reportRef}>
          {result ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold border-b pb-2">진단 결과 리포트</h2>
              
              <div className="bg-white p-4 rounded border">
                <h3 className="font-bold text-lg mb-2">💡 총평</h3>
                <EditableContent value={result.overall_review} onSave={(v)=>handleEdit('overall_review', null, v)} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded border border-green-200">
                  <h3 className="font-bold text-green-800 mb-2">✅ 만족 영역</h3>
                  <EditableContent className="text-sm mb-2" value={result.high_satisfaction.summary} onSave={(v)=>handleEdit('high_satisfaction', 'summary', v)} />
                  <div className="bg-white p-2 rounded text-sm font-bold text-green-700">
                    <EditableContent value={result.high_satisfaction.coaching} onSave={(v)=>handleEdit('high_satisfaction', 'coaching', v)} />
                  </div>
                </div>

                <div className="bg-red-50 p-4 rounded border border-red-200">
                  <h3 className="font-bold text-red-800 mb-2">⚠️ 보완 영역</h3>
                  <EditableContent className="text-sm mb-2" value={result.low_satisfaction.summary} onSave={(v)=>handleEdit('low_satisfaction', 'summary', v)} />
                  <div className="bg-white p-2 rounded text-sm font-bold text-red-700">
                    <EditableContent value={result.low_satisfaction.coaching} onSave={(v)=>handleEdit('low_satisfaction', 'coaching', v)} />
                  </div>
                </div>
              </div>
              
              <div className="mt-8 pt-4 border-t flex justify-end gap-2">
                <button onClick={()=>saveAsPng(reportRef, 'result', showToast)} className="bg-blue-600 text-white px-4 py-2 rounded">이미지 저장</button>
                <button onClick={()=>saveAsPdf(reportRef, 'result', showToast)} className="bg-red-600 text-white px-4 py-2 rounded">PDF 저장</button>
              </div>
              <Footer />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              결과가 여기에 표시됩니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}