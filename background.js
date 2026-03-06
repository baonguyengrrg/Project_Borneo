const GEMINI_API_KEY = "AIzaSyA7dPjovrqPMvvYIXhOvzTXR549jCRQnOs"; 

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "ANALYZE_TEXT") {
    callGeminiAPI(request.text).then(result => {
      sendResponse({ data: result });
    });
    return true; 
  }
});

async function callGeminiAPI(text) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  // PROMPT MỚI: Chỉ yêu cầu AI trả về 1 số duy nhất (agree_percent)
  const systemPrompt = `
    Phân tích ý nghĩa và sắc thái của câu nói sau trong môi trường công sở: "${text}"
    TRẢ VỀ ĐÚNG JSON (Không giải thích thêm):
    {
      "meaning": "Dịch ý thật sự một cách thẳng thắn",
      "nuance": "Sắc thái (ví dụ: trực tiếp, nhiệt tình, từ chối khéo...)",
      "agree_percent": <Chỉ nhập 1 số nguyên từ 0 đến 100 thể hiện mức độ đồng tình>
      "keywords": ["từ_khóa_1", "từ_khóa_2"] // Trích xuất 1 đến 3 từ tiếng Anh trong câu gốc thể hiện rõ nhất thái độ của người nói
      "suggested_reply": "Viết hẳn 1 câu tiếng Anh (kèm dịch tiếng Việt) để người dùng nói lại ngay lập tức nhằm xử lý tình huống này một cách chuyên nghiệp nhất."
    }
  `;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }] }],
        generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
      })
    });

    const data = await response.json();
    if (data.error) return { error: "API Lỗi: " + data.error.message };
    if (!data.candidates) return { error: "AI không trả về kết quả." };

    let aiText = data.candidates[0].content.parts[0].text;
    aiText = aiText.replace(/```json|```/g, "").trim(); 
    
    let result = JSON.parse(aiText);
    
    // 🛑 BỌC THÉP TOÁN HỌC TẠI ĐÂY:
    // Tự động tính phần trăm Băn khoăn (hesitate) dựa trên Đồng ý (agree)
    if (result.agree_percent !== undefined) {
        // Đảm bảo agree_percent nằm trong khoảng 0 - 100
        result.agree_percent = Math.max(0, Math.min(100, result.agree_percent));
        // Tính hesitation
        result.hesitate_percent = 100 - result.agree_percent;
    } else {
        // Nếu AI lú không trả về số, set mặc định 50-50
        result.agree_percent = 50;
        result.hesitate_percent = 50;
    }

    return result; 

  } catch (error) {
    return { error: "Lỗi mạng hoặc hệ thống: " + error.message };
  }
}