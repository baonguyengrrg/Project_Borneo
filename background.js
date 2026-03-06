const GEMINI_API_KEY = "AIzaSyBVSiS9wmua7u74Zw_AYw7g5ajvxJt9QQI"; 

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "ANALYZE_TEXT") {
    callGeminiAPI(request.text).then(result => {
      sendResponse({ data: result });
    });
    return true; // Bắt buộc phải có để giữ kết nối async
  }
});

async function callGeminiAPI(text) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  // Prompt được thiết kế sát với ý tưởng của bạn
  const systemPrompt = `
    Phân tích sắc thái giao tiếp của câu nói sau trong cuộc họp làm việc đa quốc gia. 
    Người nói có thể đang nói vòng vo, lịch sự hoặc ẩn ý.
    
    Chỉ trả về ĐÚNG định dạng JSON như sau, không chứa markdown, không giải thích gì thêm:
    {
      "meaning": "Dịch ý thật sự người đó muốn nói một cách thẳng thắn",
      "nuance": "Sắc thái ẩn giấu (ví dụ: đang miễn cưỡng, đang bực, đang ba phải...)",
      "agree_percent": "Chỉ ghi số từ 0 đến 100 thể hiện mức độ đồng ý",
      "hesitate_percent": "Chỉ ghi số từ 0 đến 100 thể hiện mức độ băn khoăn/chần chừ"
    }
    
    Câu nói cần phân tích: "${text}"
  `;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }] }],
        generationConfig: {
            temperature: 0.2, // Để AI trả lời ổn định định dạng JSON
        }
      })
    });

    const data = await response.json();
    if (!data.candidates) return { error: "API limit or error" };

    const aiText = data.candidates[0].content.parts[0].text;
    const cleanJson = aiText.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanJson); 

  } catch (error) {
    console.error("Lỗi gọi Gemini:", error);
    return null;
  }
}