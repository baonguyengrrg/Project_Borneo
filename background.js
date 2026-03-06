const GEMINI_API_KEY = "#tự điền api key"; 

// 1. Tạo Context Menu khi cài extension
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "decode-nuance",
    title: "Decode Cultural Nuance",
    contexts: ["selection"] // Chỉ hiện khi bôi đen text
  });
});

// 2. Bắt sự kiện khi click chuột phải vào menu
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "decode-nuance") {
    const selectedText = info.selectionText;
    console.log("Đã bắt được text:", selectedText);

    // Gọi hàm fetch API
    const aiResult = await callGeminiAPI(selectedText);
    
    // Bắn data sang giao diện (Popup/Side Panel) để Nhân render CSS
    chrome.runtime.sendMessage({
        action: "SHOW_RESULT",
        data: aiResult
    });
  }
});

// 3. Hàm gọi Gemini API bằng fetch
async function callGeminiAPI(text) {
  // Dùng model flash cho tốc độ nhanh nhất cho hackathon
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  // Ép AI trả về JSON chuẩn để dễ bóc tách data lên UI
  const systemPrompt = `
    Phân tích sắc thái văn hóa của câu nói sau trong môi trường làm việc đa quốc gia. 
    Trả về ĐÚNG định dạng JSON như sau, không giải thích lằng nhằng:
    {
      "meaning": "Ý nghĩa đen",
      "nuance": "Sắc thái thật sự bị ẩn giấu",
      "advice": "Lời khuyên cách phản hồi"
    }
    Câu nói: "${text}"
  `;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }] }]
      })
    });

    const data = await response.json();
    const aiText = data.candidates[0].content.parts[0].text;
    
    // Trick xử lý chuỗi: Xóa markdown ```json...``` nếu Gemini lỡ sinh ra
    const cleanJson = aiText.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanJson); 

  } catch (error) {
    console.error("Lỗi gọi Gemini:", error);
    return { error: "Không kết nối được AI" };
  }
}
