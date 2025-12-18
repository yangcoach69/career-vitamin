import { GoogleGenerativeAI } from "@google/generative-ai";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * [1] Google Gemini AI 호출 함수
 * - 환경변수에서 API 키를 자동으로 찾습니다.
 * - JSON 형식의 응답을 파싱하여 반환합니다.
 */
export const fetchGemini = async (prompt) => {
  // 사용 가능한 키 이름을 모두 확인 (가장 앞에서 발견된 키 사용)
  const API_KEY = process.env.REACT_APP_GEMINI_API_KEY || 
                  process.env.REACT_APP_API_KEY || 
                  process.env.REACT_APP_GOOGLE_API_KEY;

  if (!API_KEY) {
    throw new Error("API 키를 찾을 수 없습니다. .env 파일을 확인해주세요.");
  }
  
  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 마크다운 코드 블록(```json ... ```) 제거 후 파싱
    const jsonStr = text.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonStr);

  } catch (e) {
    console.error("Gemini API Error:", e);
    // JSON 파싱 실패 시, 혹은 API 에러 시 사용자에게 알림
    throw new Error("AI 응답을 분석하는 도중 오류가 발생했습니다. 다시 시도해주세요.");
  }
};

/**
 * [2] 화면을 이미지(PNG)로 저장하는 함수
 * - ref: 캡처할 영역의 useRef
 * - fileName: 저장할 파일 이름
 * - showToast: 성공/실패 메시지를 띄울 함수 (선택 사항)
 */
export const saveAsPng = async (ref, fileName, showToast) => {
  if (!ref.current) return;
  
  try {
    const canvas = await html2canvas(ref.current, { scale: 2 }); // 해상도 2배
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `${fileName}.png`;
    link.click();
    
    if (showToast) showToast('이미지로 저장되었습니다.');
  } catch (e) {
    console.error("PNG Save Error:", e);
    if (showToast) showToast('이미지 저장에 실패했습니다.');
  }
};

/**
 * [3] 화면을 PDF로 저장하는 함수
 * - A4 크기에 맞춰 비율을 자동 조정합니다.
 */
export const saveAsPdf = async (ref, fileName, showToast) => {
  if (!ref.current) return;

  try {
    const canvas = await html2canvas(ref.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    
    // A4 크기 (mm)
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm
    
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    
    // 너비 기준으로 비율 맞춤
    const ratio = pdfWidth / imgWidth;
    const finalHeight = imgHeight * ratio;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, finalHeight);
    pdf.save(`${fileName}.pdf`);
    
    if (showToast) showToast('PDF로 저장되었습니다.');
  } catch (e) {
    console.error("PDF Save Error:", e);
    if (showToast) showToast('PDF 저장에 실패했습니다.');
  }
};