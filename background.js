importScripts('config.js');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "ANALYZE_TEXT") {
    callGeminiAPI(request.text).then(result => {
      sendResponse({ data: result });
    });
    return true;
  }
});

async function callGeminiAPI(text) {
  // Using Gemini 2.5 Flash model!
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  const systemPrompt = `
  Analyze the meaning and nuance of the following sentence in a professional environment: "${text}"
  RETURN ONLY JSON (No explanations):
{
    "meaning": "Directly translate the true intent.",
    "nuance": "Nuance (e.g., direct, enthusiastic, hesitant, polite refusal, greeting...)",
    "agree_percent": <Input an integer from 0 to 100 if the sentence shows agreement, disagreement, or hesitation. If it is a greeting, announcement, or normal question, return null>,
    "keywords": [], // REQUIRED: Extract 1 to 3 keywords in ENGLISH from the original ("${text}") that best represent the attitude/nuance. DO NOT translate to Vietnamese. If no specific keywords exist, leave as an empty array [].
    "suggested_reply": "Write 1 suggested reply in English (with Vietnamese translation) for the user to respond."
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
    if (data.error) return { error: "API Error: " + data.error.message };
    if (!data.candidates) return { error: "AI returned no results." };

    let aiText = data.candidates[0].content.parts[0].text;
    aiText = aiText.replace(/```json|```/g, "").trim(); 
    
    let result = JSON.parse(aiText);
    
    if (result.agree_percent !== null && result.agree_percent !== undefined) {
        result.agree_percent = Math.max(0, Math.min(100, result.agree_percent));
        result.hesitate_percent = 100 - result.agree_percent;
    } else {
        result.agree_percent = null;
        result.hesitate_percent = null;
    }
    return result; 

  } catch (error) {
    return { error: "Network or system error: " + error.message };
  }
}