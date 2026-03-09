// 1. Initialize UI Dashboard
const dashboard = document.createElement('div');
dashboard.id = 'nuance-dashboard';
dashboard.innerHTML = `
  <div id="nuance-header" style="padding: 12px; background-color: #3c4043; border-radius: 12px 12px 0 0; cursor: grab; font-weight: bold; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;">
    <span>🌐 Nuance Decoder</span>
    <div style="display: flex; gap: 10px; align-items: center;">
        <span id="nuance-toggle-btn" style="cursor: pointer; font-size: 12px; background: #ea4335; padding: 3px 8px; border-radius: 4px;">Pause</span>
        <span style="font-size: 10px; color: #8ab4f8; font-weight: bold;">LIVE</span>
    </div>
  </div>
  <div id="nuance-status" style="padding: 10px 15px; border-bottom: 1px solid #5f6368; font-size: 13px; color: #9aa0a6; background-color: rgba(32, 33, 36, 0.95); flex-shrink: 0;">
    <i>Waiting for subtitles...</i>
  </div>
  <div id="nuance-content" style="padding: 15px; font-size: 14px; line-height: 1.5; flex-grow: 1; overflow-y: auto; background-color: rgba(32, 33, 36, 0.95);">
  </div>
`;

dashboard.style.cssText = `
  position: fixed; top: 20px; right: 20px; 
  width: 340px; height: 450px; 
  min-width: 250px; min-height: 200px; 
  color: #fff; box-shadow: 0 8px 24px rgba(0,0,0,0.3); z-index: 999999; 
  font-family: 'Segoe UI', Tahoma, sans-serif; border: 1px solid #5f6368; 
  display: flex; flex-direction: column; border-radius: 12px;
  resize: both; overflow: hidden; 
`;
document.body.appendChild(dashboard);

// 2. Toggle Button & Drag Logic
let isPaused = false; 
let isCoolingDown = false; // API rate limit protection
const toggleBtn = document.getElementById('nuance-toggle-btn');
const contentArea = document.getElementById('nuance-content');
const statusArea = document.getElementById('nuance-status');

toggleBtn.addEventListener('click', () => {
    isPaused = !isPaused; 
    if (isPaused) {
        toggleBtn.innerText = "Resume";
        toggleBtn.style.background = "#1e8e3e"; 
        contentArea.style.display = "none"; 
        statusArea.innerHTML = "<i>Analysis paused...</i>";
    } else {
        toggleBtn.innerText = "Pause";
        toggleBtn.style.background = "#ea4335"; 
        contentArea.style.display = "block"; 
        statusArea.innerHTML = "<i>Waiting for subtitles...</i>";
    }
});

const header = document.getElementById('nuance-header');
let isDragging = false, currentX, currentY, initialX, initialY, xOffset = 0, yOffset = 0;
header.addEventListener('mousedown', (e) => { initialX = e.clientX - xOffset; initialY = e.clientY - yOffset; if (e.target === header) isDragging = true; });
document.addEventListener('mousemove', (e) => { if (isDragging) { e.preventDefault(); currentX = e.clientX - initialX; currentY = e.clientY - initialY; xOffset = currentX; yOffset = currentY; dashboard.style.transform = `translate(${currentX}px, ${currentY}px)`; } });
document.addEventListener('mouseup', () => isDragging = false);


// 3. Real-time Caption Reading Logic
let lastSentToAI = "";
let currentTextOnUI = ""; 
let typingTimer;
const DONE_TYPING_INTERVAL = 4000;

const observer = new MutationObserver((mutations) => {
    if (isPaused) return;
    
    let isOnlyDashboard = true;
    mutations.forEach(m => { if (!dashboard.contains(m.target)) isOnlyDashboard = false; });
    if (isOnlyDashboard) return;

    const speakerNodes = document.querySelectorAll('.adE6rb');
    if (speakerNodes.length === 0) return;

    const lastSpeakerNode = speakerNodes[speakerNodes.length - 1];
    const speakerName = lastSpeakerNode.innerText.trim();
    const parentBlock = lastSpeakerNode.parentElement;
    if(!parentBlock) return;

    const fullText = parentBlock.innerText.trim();
    let latestSpeech = fullText.substring(speakerName.length).replace(/\n/g, " ").replace(/\s+/g, ' ').trim();

    if (latestSpeech.length > 0 && latestSpeech !== currentTextOnUI) {
        currentTextOnUI = latestSpeech; 
        
        const statusEl = document.getElementById('nuance-status');
        if (statusEl) {
            statusEl.style.whiteSpace = "normal"; 
            statusEl.style.lineHeight = "1.4";
            statusEl.innerHTML = `🎙️ <span style="color: #8ab4f8;"><b>${speakerName}</b> is speaking: <br><i style="color: #ffffff; font-size: 13px;">"${latestSpeech}"</i></span>`;
        }

        clearTimeout(typingTimer);
        typingTimer = setTimeout(() => {
            if (latestSpeech.length > 5 && latestSpeech !== lastSentToAI) {
                // BLOCK SENDING IF ON COOLDOWN
                if (isCoolingDown) {
                    if (statusEl) statusEl.innerHTML = `⏳ <span style="color: #ea4335;">15s cooldown to prevent API spam...</span>`;
                    return;
                }

                processTranscript(speakerName, latestSpeech);
                lastSentToAI = latestSpeech;
                
                // Enable 15s cooldown
                isCoolingDown = true;
                setTimeout(() => { isCoolingDown = false; }, 15000);
            }
        }, DONE_TYPING_INTERVAL);
    }
});

setTimeout(() => { observer.observe(document.body, { childList: true, subtree: true, characterData: true }); }, 5000);


// 4. Send to Background & Render Results
function processTranscript(speaker, text) {
    const statusEl = document.getElementById('nuance-status');
    if (statusEl) statusEl.innerHTML = `🧠 <span style="color: #fbbc04;">Analyzing meaning of <b>${speaker}</b>...</span>`;
    
    chrome.runtime.sendMessage({ action: "ANALYZE_TEXT", text: text }, (response) => {
        // Reset state after analysis is complete
        if (statusEl && !isCoolingDown) statusEl.innerHTML = `✅ <span style="color: #81c995;">Done! Waiting for the next sentence...</span>`;

        if (!response || !response.data) return;
        const contentDiv = document.getElementById('nuance-content');

        if (response.data.error) {
            contentDiv.innerHTML = `<div style="color: #ea4335; margin-bottom: 10px;">❌ Error: ${response.data.error}</div>` + contentDiv.innerHTML;
            return;
        }
        
        let data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        
        let highlightedText = text;
        if (data.keywords && data.keywords.length > 0) {
            data.keywords.forEach(kw => {
                if (kw.length > 1) {
                    try {
                        const reg = new RegExp(`\\b(${kw})\\b`, 'gi');
                        highlightedText = highlightedText.replace(reg, `<span style="color: #fbbc04; font-weight: bold; background: rgba(251,188,4,0.15); padding: 0 2px; border-radius: 2px;">$1</span>`);
                    } catch(e) {}
                }
            });
        }

        let percentageHtml = "";
        if (data.agree_percent !== null && data.agree_percent !== undefined) {
            percentageHtml = `
                <div style="margin-top: 8px; display: flex; gap: 5px;">
                    <span style="background: #1e8e3e; font-size: 11px; padding: 3px 6px; border-radius: 3px;">Agree: ${data.agree_percent}%</span>
                    <span style="background: #f29900; font-size: 11px; padding: 3px 6px; border-radius: 3px; color: #202124;">Hesitant: ${data.hesitate_percent}%</span>
                </div>
            `;
        }

        const html = `
            <div style="border-bottom: 1px solid #5f6368; padding-bottom: 10px; margin-bottom: 10px;">
                <div style="font-weight: bold; color: #e8eaed;">👤 ${speaker}</div>
                <div style="font-size: 13px; color: #9aa0a6; font-style: italic; margin-bottom: 5px;">"${highlightedText}"</div>
                
                <div style="margin-bottom: 3px;"><strong>Nuance:</strong> <span style="color: #fce8b2;">${data.nuance || "Normal"}</span></div>
                <div><strong>Meaning:</strong> <span style="color: #81c995;">${data.meaning || ""}</span></div>
                
                <div style="margin-top: 8px; padding: 8px; background: rgba(30,142,62,0.15); border-left: 3px solid #81c995; border-radius: 4px;">
                    <span style="font-size: 11px; font-weight: bold; color: #81c995;">💬 SUGGESTED REPLY:</span>
                    <div style="font-size: 13px; color: #fff; margin-top: 3px;">${data.suggested_reply || "Continue listening..."}</div>
                </div>
                
                ${percentageHtml}
            </div>
        `;
        contentDiv.innerHTML = html + contentDiv.innerHTML;
    });
}