console.log("Email Writer Extension - Content Script Loaded");

function createAIButton() {
  const button = document.createElement("div");
  button.className = "T-I J-J5-Ji aoO v7 T-I-atl L3 ai-reply-button";
  button.style.marginRight = "8px";
  button.textContent = "AI Reply";
  button.setAttribute("role", "button");
  button.setAttribute("data-tooltip", "Generate AI Reply");
  return button;
}

function getEmailContent() {
  const selectors = [".h7", ".a3s.aiL", '[role="presentation"]', ".gmail_quote"];

  for (const selector of selectors) {
    const content = document.querySelector(selector);
    const text = content?.innerText?.trim();

    if (text) {
      return text;
    }
  }

  return "";
}

function findComposeToolbar() {
  const selectors = [".btC", ".aDh", '[role="toolbar"]', ".gU.Up"];

  for (const selector of selectors) {
    const toolbar = document.querySelector(selector);

    if (toolbar) {
      return toolbar;
    }
  }

  return null;
}

function findComposeBox() {
  return document.querySelector('[role="textbox"][g_editable="true"]');
}

function setButtonLoading(button, isLoading) {
  button.textContent = isLoading ? "Generating..." : "AI Reply";
  button.setAttribute("aria-disabled", String(isLoading));
  button.style.pointerEvents = isLoading ? "none" : "";
}

async function handleAIReplyClick(button) {
  try {
    setButtonLoading(button, true);

    const emailContent = getEmailContent();
    const response = await fetch("http://localhost:8080/api/email/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        emailContent,
        tone: "professional",
      }),
    });

    if (!response.ok) {
      throw new Error("API request failed");
    }

    const generatedReply = await response.text();
    const composeBox = findComposeBox();

    if (!composeBox) {
      console.error("Compose box was not found");
      return;
    }

    composeBox.focus();
    document.execCommand("insertText", false, generatedReply);
  } catch (error) {
    console.error(error);
    alert("Failed to generate reply");
  } finally {
    setButtonLoading(button, false);
  }
}

function injectButton() {
  const existingButton = document.querySelector(".ai-reply-button");

  if (existingButton) {
    existingButton.remove();
  }

  const toolbar = findComposeToolbar();

  if (!toolbar) {
    console.log("Toolbar not found");
    return;
  }

  console.log("Toolbar found, creating AI button");

  const button = createAIButton();
  button.addEventListener("click", () => handleAIReplyClick(button));
  toolbar.insertBefore(button, toolbar.firstChild);
}

const composeElementSelector = '.aDh, .btC, [role="dialog"]';

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    const addedNodes = Array.from(mutation.addedNodes);
    const hasComposeElements = addedNodes.some(
      (node) =>
        node.nodeType === Node.ELEMENT_NODE &&
        (node.matches(composeElementSelector) ||
          node.querySelector(composeElementSelector)),
    );

    if (hasComposeElements) {
      console.log("Compose window detected");
      setTimeout(injectButton, 500);
    }
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

setTimeout(injectButton, 500);
