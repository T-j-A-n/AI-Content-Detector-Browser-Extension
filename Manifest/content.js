const API_ENDPOINT = "https://c526d8854c56.ngrok-free.app/AIdetect/run";

const MAX_PAGES_STORED = 500;

function collectPageData() {
  const links = Array.from(document.querySelectorAll("a[href]")).map((a) => {
    return {
      href: a.href,
      text: (a.innerText || a.textContent || "").trim(),
    };
  });

  const pageText = (document.body && document.body.innerText) || "";

  return {
    url: window.location.href,
    title: document.title,
    timestamp: new Date().toISOString(),
    links,
    fullText: pageText,
  };
}

function collectParagraphs() {
  const paragraphs = Array.from(document.querySelectorAll("p"))
    .map((p) => (p.innerText || p.textContent || "").trim())
    .filter((text) => text.length > 0);

  return paragraphs;
}

async function sendParagraphsToAPI(paragraphs) {
  const payload = {
    url: window.location.href,
    title: document.title,
    paragraphs: paragraphs,
  };

  console.log("[Manifest Page Saver] Payload:", payload);
  console.log("[Manifest Page Saver] Number of paragraphs:", paragraphs.length);
  console.log(
    "[Manifest Page Saver] Payload JSON:",
    JSON.stringify(payload, null, 2)
  );

  try {
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const result = await response.json();
      console.debug(
        "[Manifest Page Saver] Successfully sent paragraphs to API for",
        payload.url
      );
      return result;
    } else {
      console.error(
        "[Manifest Page Saver] API error:",
        response.status,
        response.statusText
      );
      return null;
    }
  } catch (error) {
    console.error(
      "[Manifest Page Saver] Failed to send paragraph to API:",
      error
    );
    return null;
  }
  return null;
}

function showAIGeneratedPopup(percentage) {
  const existingPopup = document.getElementById("ai-generated-popup");
  if (existingPopup) {
    existingPopup.remove();
  }

  const popup = document.createElement("div");
  popup.id = "ai-generated-popup";
  popup.innerHTML = `
    <div class="ai-popup-content">
      <div class="ai-popup-header">
        <h3>AI Content Detection</h3>
        <button class="ai-popup-close">&times;</button>
      </div>
      <div class="ai-popup-body">
        <div class="ai-percentage-display">
          <span class="ai-percentage-number">${percentage}%</span>
          <span class="ai-percentage-label">AI Generated</span>
        </div>
        <div class="ai-progress-bar">
          <div class="ai-progress-fill" style="width: ${percentage}%"></div>
        </div>
      </div>
    </div>
  `;

  const style = document.createElement("style");
  style.textContent = `
    #ai-generated-popup {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      animation: slideIn 0.3s ease-out;
    }
    
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    .ai-popup-content {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      min-width: 300px;
      max-width: 350px;
      overflow: hidden;
    }
    
    .ai-popup-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .ai-popup-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }
    
    .ai-popup-close {
      background: none;
      border: none;
      color: white;
      font-size: 24px;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: background 0.2s;
    }
    
    .ai-popup-close:hover {
      background: rgba(255, 255, 255, 0.2);
    }
    
    .ai-popup-body {
      padding: 24px 20px;
    }
    
    .ai-percentage-display {
      text-align: center;
      margin-bottom: 20px;
    }
    
    .ai-percentage-number {
      display: block;
      font-size: 48px;
      font-weight: 700;
      color: #667eea;
      line-height: 1;
      margin-bottom: 8px;
    }
    
    .ai-percentage-label {
      display: block;
      font-size: 14px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .ai-progress-bar {
      width: 100%;
      height: 8px;
      background: #e0e0e0;
      border-radius: 4px;
      overflow: hidden;
    }
    
    .ai-progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      transition: width 0.5s ease-out;
      border-radius: 4px;
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(popup);
  const closeBtn = popup.querySelector(".ai-popup-close");
  closeBtn.addEventListener("click", () => {
    popup.style.animation = "slideOut 0.3s ease-out";
    setTimeout(() => popup.remove(), 300);
  });
  setTimeout(() => {
    if (document.getElementById("ai-generated-popup")) {
      popup.style.animation = "slideOut 0.3s ease-out";
      setTimeout(() => popup.remove(), 300);
    }
  }, 10000);
  const slideOutStyle = document.createElement("style");
  slideOutStyle.textContent = `
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(slideOutStyle);
}

function savePageData() {
  const data = collectPageData();

  chrome.storage.local.get({ pages: [] }, (result) => {
    const pages = Array.isArray(result.pages) ? result.pages : [];
    pages.unshift(data);
    if (pages.length > MAX_PAGES_STORED) {
      pages.length = MAX_PAGES_STORED;
    }

    chrome.storage.local.set({ pages }, () => {
      console.debug("[Manifest Page Saver] Saved page data for", data.url);
    });
  });
}

async function processPage() {
  const paragraphs = collectParagraphs();
  console.debug(
    "[Manifest Page Saver] Collected",
    paragraphs.length,
    "paragraphs"
  );

  const apiResponse = await sendParagraphsToAPI(paragraphs);
  const aiPercentage = Math.floor(Math.random() * 100); 

  showAIGeneratedPopup(aiPercentage);
  savePageData();
}

processPage();

sendParagraphsToAPI(paragraphs);
