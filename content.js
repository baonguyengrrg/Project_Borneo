// 1. Khởi tạo UI Dashboard (Bản hỗ trợ Kéo giãn Resize)
const dashboard = document.createElement('div');
dashboard.id = 'nuance-dashboard';
dashboard.innerHTML = `
  <div id="nuance-header" style="padding: 12px; background-color: #3c4043; border-radius: 12px 12px 0 0; cursor: grab; font-weight: bold; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;">
    <span>🌐 Nuance Decoder</span>
    <div style="display: flex; gap: 10px; align-items: center;">
        <span id="nuance-toggle-btn" style="cursor: pointer; font-size: 12px; background: #ea4335; padding: 3px 8px; border-radius: 4px;">Tạm Dừng</span>
        <span style="font-size: 10px; color: #8ab4f8; font-weight: bold;">LIVE</span>
    </div>
  </div>
  <div id="nuance-status" style="padding: 10px 15px; border-bottom: 1px solid #5f6368; font-size: 13px; color: #9aa0a6; background-color: rgba(32, 33, 36, 0.95); flex-shrink: 0;">
    <i>Đang chờ phụ đề...</i>
  </div>
  <div id="nuance-content" style="padding: 15px; font-size: 14px; line-height: 1.5; flex-grow: 1; overflow-y: auto; background-color: rgba(32, 33, 36, 0.95);">
  </div>
`;

// Thêm resize: both; overflow: hidden; và các giới hạn kích thước
dashboard.style.cssText = `
  position: fixed; top: 20px; right: 20px; 
  width: 340px; height: 450px; /* Kích thước mặc định lúc mới mở */
  min-width: 250px; min-height: 200px; /* Chống người dùng kéo nhỏ quá mức làm nát UI */
  color: #fff; box-shadow: 0 8px 24px rgba(0,0,0,0.3); z-index: 999999; 
  font-family: 'Segoe UI', Tahoma, sans-serif; border: 1px solid #5f6368; 
  display: flex; flex-direction: column; border-radius: 12px;
  resize: both; overflow: hidden; /* ĐÂY LÀ CHÌA KHÓA ĐỂ BẬT TÍNH NĂNG RESIZE */
`;
document.body.appendChild(dashboard);

// ==========================================
// LOGIC NÚT TẮT / BẬT SIÊU NHANH
// ==========================================
let isPaused = false; 
const toggleBtn = document.getElementById('nuance-toggle-btn');
const contentArea = document.getElementById('nuance-content');
const statusArea = document.getElementById('nuance-status');

toggleBtn.addEventListener('click', () => {
    isPaused = !isPaused; // Đảo trạng thái
    
    if (isPaused) {
        toggleBtn.innerText = "Bật Lại";
        toggleBtn.style.background = "#1e8e3e"; // Đổi màu xanh
        contentArea.style.display = "none"; // Giấu kết quả đi cho gọn màn hình
        statusArea.innerHTML = "<i>Đã tạm dừng phân tích... (Tiết kiệm Quota)</i>";
    } else {
        toggleBtn.innerText = "Tạm Dừng";
        toggleBtn.style.background = "#ea4335"; // Đổi màu đỏ
        contentArea.style.display = "block"; // Hiện lại kết quả
        statusArea.innerHTML = "<i>Đang chờ phụ đề...</i>";
    }
});

// 2. Logic Kéo thả
const header = document.getElementById('nuance-header');
let isDragging = false, currentX, currentY, initialX, initialY, xOffset = 0, yOffset = 0;

header.addEventListener('mousedown', (e) => {
  initialX = e.clientX - xOffset; initialY = e.clientY - yOffset;
  if (e.target === header) isDragging = true;
});
document.addEventListener('mousemove', (e) => {
  if (isDragging) {
    e.preventDefault();
    currentX = e.clientX - initialX; currentY = e.clientY - initialY;
    xOffset = currentX; yOffset = currentY;
    dashboard.style.transform = `translate(${currentX}px, ${currentY}px)`;
  }
});
document.addEventListener('mouseup', () => isDragging = false);

// 3. Logic Đọc Caption BÓC TÁCH NGƯỜI NÓI (Đã vá lỗi Infinite Loop)

let lastSentToAI = "";
let currentTextOnUI = ""; // Biến mới để kiểm soát giao diện
let typingTimer;
const DONE_TYPING_INTERVAL = 3000;

const observer = new MutationObserver((mutations) => {
    if (isPaused) return;
    // 🛑 BỘ LỌC CẦU CHÌ: Bỏ qua nếu DOM thay đổi bên trong Dashboard của mình
    let isOnlyDashboard = true;
    mutations.forEach(m => {
        if (!dashboard.contains(m.target)) {
            isOnlyDashboard = false;
        }
    });
    if (isOnlyDashboard) return; // Ngắt mạch tại đây! Tránh đơ máy.

    // Tìm TÊN người nói
    const speakerNodes = document.querySelectorAll('.adE6rb');
    if (speakerNodes.length === 0) return;

    const lastSpeakerNode = speakerNodes[speakerNodes.length - 1];
    const speakerName = lastSpeakerNode.innerText.trim();

    // Tìm KHUNG CHAT chứa câu nói
    const parentBlock = lastSpeakerNode.parentElement;
    if(!parentBlock) return;

    const fullText = parentBlock.innerText.trim();
    let latestSpeech = fullText.substring(speakerName.length).replace(/\n/g, " ").replace(/\s+/g, ' ').trim();

    // Chỉ cập nhật nếu CÂU NÓI CÓ SỰ THAY ĐỔI
    if (latestSpeech.length > 0 && latestSpeech !== currentTextOnUI) {
        currentTextOnUI = latestSpeech; // Lưu lại để lần quét sau không bị lặp
        
        const statusEl = document.getElementById('nuance-status');
        if (statusEl) statusEl.innerHTML = `<i style="color: #8ab4f8;">${speakerName} đang nói: "${latestSpeech}"...</i>`;

        clearTimeout(typingTimer);
        typingTimer = setTimeout(() => {
            // Chốt câu gửi đi AI
            if (latestSpeech.length > 5 && latestSpeech !== lastSentToAI) {
                processTranscript(speakerName, latestSpeech);
                lastSentToAI = latestSpeech;
            }
        }, DONE_TYPING_INTERVAL);
    }
});

setTimeout(() => {
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
}, 5000);

// 4. Gửi Background gọi AI (Bản bọc thép chống kẹt)
function processTranscript(speaker, textToAnalyze) {
  const statusEl = document.getElementById('nuance-status');
  statusEl.innerHTML = `<i style="color: #f29900;">Đang gửi AI phân tích câu của ${speaker}...</i>`;

  chrome.runtime.sendMessage({ action: "ANALYZE_TEXT", text: textToAnalyze }, (response) => {
    statusEl.innerHTML = `<i>Đang chờ phụ đề tiếp theo...</i>`; 
    
    // Bắt lỗi đứt kết nối Extension
    if (chrome.runtime.lastError) {
        renderResult(speaker, textToAnalyze, {
            meaning: "❌ Mất kết nối Extension. Hãy F5 lại trang!",
            nuance: chrome.runtime.lastError.message
        });
        return;
    }

    // Bắt lỗi từ API
    if (response && response.data) {
        if (response.data.error) {
            renderResult(speaker, textToAnalyze, {
                meaning: "❌ " + response.data.error,
                nuance: "Lỗi gọi API"
            });
        } else {
            renderResult(speaker, textToAnalyze, response.data);
        }
    } else {
        renderResult(speaker, textToAnalyze, { meaning: "❌ Lỗi không xác định", nuance: "Không nhận được data" });
    }
  });
}

// 5. Render Kết quả lên UI
function renderResult(speaker, originalText, aiData) {
  const contentDiv = document.getElementById('nuance-content');
  let data = {};
  
  try {
      data = typeof aiData === 'string' ? JSON.parse(aiData) : aiData;
  } catch(e) {
      console.error("Lỗi parse JSON:", e); return;
  }

  const meaning = data.meaning || "Đang xử lý/Không rõ ý";
  const nuance = data.nuance || "Giao tiếp bình thường";
  const agree = data.agree_percent !== undefined ? data.agree_percent : 50;
  const hesitate = data.hesitate_percent !== undefined ? data.hesitate_percent : 50;

  const html = `
    <div class="nuance-item" style="border-bottom: 1px solid #5f6368; padding-bottom: 12px; margin-bottom: 12px;">
      <div style="color: #e8eaed; font-weight: bold; margin-bottom: 4px;">👤 ${speaker}</div>
      <div style="color: #9aa0a6; font-size: 13px; margin-bottom: 8px; font-style: italic;">"${originalText}"</div>
      <div style="margin-bottom: 4px;"><strong>Sắc thái:</strong> <span style="color: #fce8b2;">${nuance}</span></div>
      <div><strong>Dịch ý thật:</strong> <span style="color: #81c995;">${meaning}</span></div>
      <div style="margin-top: 10px;">
        <span class="nuance-badge" style="background-color: #1e8e3e; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-right: 5px;">Đồng ý: ${agree}%</span>
        <span class="nuance-badge" style="background-color: #f29900; padding: 4px 8px; border-radius: 4px; font-size: 12px; color: #202124;">Băn khoăn: ${hesitate}%</span>
      </div>
    </div>
  `;
  
  contentDiv.innerHTML = html + contentDiv.innerHTML;
}