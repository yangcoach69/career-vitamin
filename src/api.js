// src/api.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
// [중요] 아까 넣으셨던 'AIza'로 시작하는 키를 다시 여기에 붙여넣으세요!
const REAL_API_KEY = "AIzaSy..."; 
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

if (REAL_API_KEY === "AIzaSyBIa1ZOdGkqAh38quytvLeRJfgm6yFyLXo" || !REAL_API_KEY) {
  console.error("🚨 API 키가 없습니다. src/api.js 파일 8번째 줄에 키를 넣어주세요.");
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

// ✅ [복구된 함수] 텍스트 렌더링 헬퍼 (이게 빠져서 에러가 났었습니다!)
export const renderText = (content) => {
  if (!content) return '';
  if (Array.isArray(content)) return content.join('\n');
  if (typeof content === 'object') return JSON.stringify(content, null, 2);
  return content;
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

// [Gemini 호출 함수]
export const fetchGemini = async (prompt, attachments = []) => {
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