# NodSense (Hackathon Edition) 🌏🚀

**NodSense** is a Chrome Extension developed to break down cultural misunderstandings and language nuances in professional environments, specifically tailored for **Google Meet**.

This project focuses on decoding "hidden meanings" and providing the true intent behind statements, helping users communicate more effectively and confidently in cross-cultural settings.

## ✨ Key Features

* **Real-time Decoding:** Automatically reads live captions directly from Google Meet when someone is speaking.
* **AI-Powered Analysis:** Utilizes the **Gemini 2.5 Flash** model to analyze the true meaning, nuance, and the speaker's level of agreement or hesitation.
* **Smart Dashboard:**
    * Modern, draggable, and resizable interface overlaid right on the meeting screen.
    * Displays **Agree** and **Hesitant** percentages using intuitive color-coded badges.
    * **Keyword Highlighting:** Automatically highlights crucial English keywords that represent the speaker's attitude or tone.
* **Suggested Replies:** Provides contextually appropriate English response templates, allowing users to reply smoothly and professionally.
* **API Protection Mode:** Integrates a 15-second cooldown mechanism to prevent API spam and rate-limit issues.

## 🛠 Tech Stack

* **Frontend:** HTML, CSS, JavaScript (Vanilla JS)
* **Backend:** Google Gemini API (Model: `gemini-2.5-flash`)
* **Platform:** Chrome Extension Manifest V3

## 📂 Project Structure

* `manifest.json`: The core extension configuration, permissions, and background script routing.
* `background.js`: Handles communication with the Gemini API and manages data flow.
* `content.js`: The main logic for scanning subtitles from the Google Meet UI and rendering the dashboard.
* `styles.css`: Defines the visual styling for the Dashboard and nuance badges.
* `config.js`: Stores the API Key (Note: This file is intentionally excluded via `.gitignore` for security).

## 🚀 Installation Guide

1.  **Get the Source Code:** Clone this repository to your local machine.
2.  **Configure the API Key:**
    * Create a file named `config.js` in the root directory.
    * Add the following line to the file: `const GEMINI_API_KEY = "YOUR_API_KEY_HERE";`
3.  **Install in Chrome:**
    * Open Google Chrome and navigate to `chrome://extensions/`.
    * Enable **Developer mode** in the top right corner.
    * Click **Load unpacked** and select the directory containing this project.
4.  **Usage:**
    * Join a meeting on [Google Meet](https://meet.google.com/).
    * **Turn on Captions (CC)** in Google Meet so the extension can read the live text.
    * The "Nuance Decoder" dashboard will appear on the right side of your screen.

## ⚠️ Important Notes
* The `config.js` file contains sensitive API keys and must **never** be pushed to public repositories (it is already included in `.gitignore`).
* This extension requires access to `storage` and specific `host_permissions` for Google Meet and the Google Generative Language API to function properly.

---
*Built to bridge the digital and cultural gap through AI.*
## Link to Video
[Link to our video]([https://drive.google.com/file/d/1pXFVkIrz9jctd8IVT8n3UayBZLg8Mx71/view?fbclid=IwY2xjawQhEjpleHRuA2FlbQIxMABicmlkETFXTXR4ejNGQ1NXZm5yNFpLc3J0YwZhcHBfaWQQMjIyMDM5MTc4ODIwMDg5MgABHlnw5FGUX8pWVWYAt5mZa4Yb_fh0vPwP5PRl9X7xR22vHGmHRHYK3vg4VuDr_aem_RG5aFqskGwrA3dAuyjfSUA](https://drive.google.com/file/d/1POhjmwQJ6Wm4VzhVpYNf5DVvOIc83v2q/view?fbclid=IwY2xjawQhEpVleHRuA2FlbQIxMABicmlkETFUdk15WWI5VXF5MEwwSGI3c3J0YwZhcHBfaWQQMjIyMDM5MTc4ODIwMDg5MgABHu9yW-_yNRyS6oF1PjqiZLsYvwJBmb2kggbLI_xdVvDpNrSbM8DDyLZG8cPl_aem_aUVA9s80R-rHqy2N2I_CJA))
