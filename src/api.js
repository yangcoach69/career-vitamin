// src/api.js

// [JSON 파싱 헬퍼]
export const safeJsonParse = (str) => {
  if (!str) return null;
  try { return JSON.parse(str); } catch (e) {
    try {
      let cleaned = str.replace(/```json/g, '').replace(/```/g, '').trim();
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      const firstBracket = cleaned.indexOf('[');
      const lastBracket = cleaned.lastIndexOf(']');
      
      if (firstBrace !== -1 && lastBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
         cleaned = cleaned.substring(firstBrace, lastBrace + 1);
      } else if (firstBracket !== -1 && lastBracket !== -1) {
         cleaned = cleaned.substring(firstBracket, lastBracket + 1);
      }
      return JSON.parse(cleaned);
    } catch (e2) {
      console.error("JSON Parse Error:", e2);
      return null;
    }
  }
};

// [텍스트 렌더링 헬퍼]
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
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    const originalElement = elementRef.current;
    const width = originalElement.offsetWidth;
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = `${window.scrollY}px`;
    container.style.left = '0';
    container.style.width = `${width}px`;
    container.style.zIndex = '-9999';
    container.style.backgroundColor = '#ffffff';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.overflow = 'visible';

    document.body.appendChild(container);

    const clone = originalElement.cloneNode(true);
    clone.style.cssText = `
      height: auto !important;
      max-height: none !important;
      min-height: auto !important;
      overflow: visible !important;
      width: 100% !important;
      margin: 0 !important;
      transform: none !important;
      box-shadow: none !important;
      border-radius: 0 !important;
      background-color: transparent !important;
    `;
    
    container.appendChild(clone);
    await new Promise(resolve => setTimeout(resolve, 500));

    const fullHeight = container.scrollHeight;
    container.style.height = `${fullHeight}px`;
    const canvas = await window.html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: width,
      height: fullHeight,
      windowWidth: width,
      windowHeight: fullHeight + 100,
      x: 0,
      y: window.scrollY,
      scrollX: 0,
      scrollY: 0
    });
    
    document.body.removeChild(container);
    
    const link = document.createElement('a');
    link.download = `${fileName}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    if(showToast) showToast("이미지가 성공적으로 저장되었습니다.");
  } catch (error) {
    console.error("이미지 저장 실패:", error);
    if(showToast) showToast("저장 중 오류가 발생했습니다.");
  }
};

// [PDF 저장 함수]
export const saveAsPdf = async (elementRef, fileName, showToast) => {
  if (!elementRef.current) return;
  try {
    if (!window.html2canvas) {
        await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    if (!window.jspdf) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    if(showToast) showToast("PDF 변환 중입니다. 잠시만 기다려주세요...");

    const element = elementRef.current;
    const canvas = await window.html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });
    const imgData = canvas.toDataURL('image/png');
    const { jsPDF } = window.jspdf;
    
    const pdfWidth = 210;
    const imgProps = { width: canvas.width, height: canvas.height };
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    const pdf = new jsPDF('p', 'mm', [pdfWidth, pdfHeight]);
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    
    pdf.save(`${fileName}.pdf`);
    if(showToast) showToast("PDF가 성공적으로 저장되었습니다.");
  } catch (error) {
    console.error("PDF 저장 실패:", error);
    if(showToast) showToast("PDF 저장 중 오류가 발생했습니다. (브라우저 제한일 수 있습니다)");
  }
};

// [Gemini 호출 함수]
export const fetchGemini = async (prompt, attachments = []) => {
  // ✅ [수정완료] 로컬 스토리지에 키가 없으면 Vercel 환경변수를 사용합니다.
  let apiKey = localStorage.getItem("custom_gemini_key") || process.env.REACT_APP_GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error("🚨 API 키가 없습니다. [대시보드]에서 키를 등록하거나, 관리자에게 문의하세요.");
  }
  
  const models = ["gemini-1.5-flash", "gemini-2.0-flash-exp", "gemini-2.5-flash-preview-09-2025"];


  let lastError = null;
  const jsonInstruction = `
  IMPORTANT: You must return the result strictly as a valid JSON string.
  Do not wrap the JSON in markdown code blocks (like \`\`\`json ... \`\`\`).
  Do not include any explanations or extra text outside the JSON object.
  If searching, use the latest information found.
  `;
  const finalPrompt = prompt + jsonInstruction;

  const parts = [{ text: finalPrompt }];
  if (attachments && attachments.length > 0) {
    attachments.forEach(file => {
      parts.push({
        inlineData: {
          mimeType: file.mimeType,
          data: file.data
        }
      });
    });
  }

  for (const model of models) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`AI 호출 시도: ${model} (${attempt}회차)`);
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: parts }],
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          const status = response.status;
          
          if (status === 429 || status === 503) {
             console.warn(`Model ${model} busy (Status ${status}). Retrying...`);
             await new Promise(resolve => setTimeout(resolve, 2000));
             continue;
          }
          if (status === 404) break;
          throw new Error(errData.error?.message || `HTTP Error ${status}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        const parsed = safeJsonParse(text);
        if (!parsed) {
          console.warn("JSON 파싱 실패, 재시도합니다.", text);
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        return parsed;
      } catch (e) {
        console.warn(`${model} 오류 (${attempt}회차):`, e);
        lastError = e;
        if (e.message.includes("API key")) throw e;
      }
    }
  }
  throw lastError || new Error("모든 AI 모델 연결에 실패했습니다.");
};