const GEMINI_API_KEY = "AIzaSyCqbwof3LzjD4ZHXWcrmXVxjfqhrM8U4_s"; 

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
  
  // PROMPT MỚI: Dặn AI khi nào cần chấm điểm, khi nào trả về null
  const systemPrompt = `
    Phân tích ý nghĩa và sắc thái của câu nói sau trong môi trường công sở: "${text}"
    TRẢ VỀ ĐÚNG JSON (Không giải thích thêm):
    {
      "meaning": "Dịch ý thật sự một cách thẳng thắn",
      "nuance": "Sắc thái (ví dụ: trực tiếp, nhiệt tình, từ chối khéo, chào hỏi...)",
      "agree_percent": <Chỉ nhập 1 số nguyên từ 0 đến 100 NẾU câu nói thể hiện sự đồng tình, phản đối, hoặc do dự. NẾU LÀ CÂU CHÀO HỎI, THÔNG BÁO HOẶC CÂU HỎI BÌNH THƯỜNG, HÃY TRẢ VỀ null>,
      "keywords": [], // BẮT BUỘC: Lấy y nguyên 1 đến 3 từ TIẾNG ANH trong câu gốc ("${text}") thể hiện rõ nhất thái độ/sắc thái. TUYỆT ĐỐI KHÔNG DỊCH SANG TIẾNG VIỆT. Nếu không có từ nào đặc biệt thì để mảng rỗng [].
      "suggested_reply": "Viết hẳn 1 câu tiếng Anh (kèm dịch tiếng Việt) để người dùng đáp lại."
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
    
    // 🛑 LOGIC MỚI: Chỉ tính toán nếu AI thực sự trả về số
    if (result.agree_percent !== null && result.agree_percent !== undefined) {
        result.agree_percent = Math.max(0, Math.min(100, result.agree_percent));
        result.hesitate_percent = 100 - result.agree_percent;
    } else {
        // Xóa luôn thuộc tính này để giao diện biết đường ẩn đi
        result.agree_percent = null;
        result.hesitate_percent = null;
    }

    return result; 

  } catch (error) {
    return { error: "Lỗi mạng hoặc hệ thống: " + error.message };
  }
}