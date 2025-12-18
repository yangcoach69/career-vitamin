// src/api.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
// [중요] 여기에 'AIza'로 시작하는 키를 따옴표 안에 붙여넣으세요!
const REAL_API_KEY = "AIzaSy..."; 
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

if (REAL_API_KEY === "AAIzaSyBIa1ZOdGkqAh38quytvLeRJfgm6yFyLXoIzaSy..." || !REAL_API_KEY) {
  console.error("🚨 API 키가 입력되지 않았습니다! src/api.js 파일을 수정해주세요.");
}

const genAI = new GoogleGenerativeAI(REAL_API_KEY);

// [JSON 파싱 헬퍼]
export const safeJsonParse = (str) => {
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
    } catch (e2) { return null; }
  }
};

// [이미지 저장 함수]
export const saveAsPng = async (elementRef, fileName, showToast) => {
  if (!elementRef.current) return;
  try {
    if (!window.html2canvas) {
      await new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
        script.onload = resolve;
        document.head.appendChild(script);
      });
    }
    const canvas = await window.html2canvas(elementRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    const link = document.createElement('a');
    link.download = `${fileName}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    if(showToast) showToast("저장 완료");
  } catch (error) { console.error(error); }
};

// [PDF 저장 함수]
export const saveAsPdf = async (elementRef, fileName, showToast) => {
  if (!elementRef.current) return;
  try {
    if (!window.html2canvas) {
       await new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
            script.onload = resolve;
            document.head.appendChild(script);
       });
    }
    if (!window.jspdf) {
      await new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
        script.onload = resolve;
        document.head.appendChild(script);
      });
    }
    if(showToast) showToast("PDF 변환 중...");
    const canvas = await window.html2canvas(elementRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = 210;
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${fileName}.pdf`);
    if(showToast) showToast("PDF 저장 완료");
  } catch (error) { console.error(error); }
};

// [Gemini 호출 함수 - 최종]
export const fetchGemini = async (prompt, attachments = []) => {
  // 이제 무조건 위에 적은 REAL_API_KEY를 사용합니다.
  const apiKey = REAL_API_KEY;
  
  const models = ["gemini-1.5-flash", "gemini-2.0-flash-exp"];
  let lastError = null;
  
  const finalPrompt = prompt + `\nIMPORTANT: Return ONLY raw JSON. No markdown.`;
  const parts = [{ text: finalPrompt }];
  
  if (attachments && attachments.length > 0) {
    attachments.forEach(file => {
      if (file && file.data) {
        parts.push({
            inlineData: {
            mimeType: file.mimeType || "image/png",
            data: file.data 
            }
        });
      }
    });
  }

  for (const model of models) {
    try {
        console.log(`AI 호출: ${model}`);
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: parts }] })
        });

        if (!response.ok) throw new Error(`HTTP Error ${response.status}`);

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        const parsed = safeJsonParse(text);
        if (parsed) return parsed;
        
    } catch (e) {
        console.warn(`${model} 실패:`, e);
        lastError = e;
    }
  }
  throw lastError || new Error("AI 연결 실패 (키를 확인해주세요)");
};