chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "SHOW_RESULT") {
    const data = request.data;
    console.log("Collected data:", data);
  }
});
