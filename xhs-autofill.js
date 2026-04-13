(() => {
  const STORAGE_KEY = 'xtoimage_pending_post';
  const DONE_KEY = 'xtoimage_last_applied_id';
  const MAX_PENDING_AGE_MS = 30 * 60 * 1000;

  function log(...args) {
    console.log('[xtoimage][xhs]', ...args);
  }

  function showToast(message, isError = false) {
    const id = 'xtoimage-xhs-toast';
    const old = document.getElementById(id);
    if (old) old.remove();

    const el = document.createElement('div');
    el.id = id;
    el.textContent = message;
    el.style.position = 'fixed';
    el.style.top = '20px';
    el.style.right = '20px';
    el.style.zIndex = '2147483647';
    el.style.padding = '10px 14px';
    el.style.borderRadius = '10px';
    el.style.color = '#fff';
    el.style.fontSize = '13px';
    el.style.boxShadow = '0 8px 24px rgba(0,0,0,.2)';
    el.style.background = isError ? 'rgba(215,58,73,.95)' : 'rgba(23,191,99,.95)';
    document.body.appendChild(el);

    setTimeout(() => el.remove(), 2500);
  }

  function dataUrlToFile(dataUrl, filename) {
    const parts = dataUrl.split(',');
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png';
    const binary = atob(parts[1]);
    const length = binary.length;
    const bytes = new Uint8Array(length);
    for (let i = 0; i < length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new File([bytes], filename, { type: mime });
  }

  function setNativeValue(input, value) {
    const prototype = Object.getPrototypeOf(input);
    const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
    if (descriptor && descriptor.set) {
      descriptor.set.call(input, value);
    } else {
      input.value = value;
    }
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function tryFillTitle(text) {
    const titleSelectors = [
      'input[placeholder*="标题"]',
      'textarea[placeholder*="标题"]',
      'input[maxlength="20"]',
      'input[maxlength="30"]'
    ];

    for (const selector of titleSelectors) {
      const input = document.querySelector(selector);
      if (input && input.offsetParent !== null) {
        setNativeValue(input, text);
        return true;
      }
    }
    return false;
  }

  function tryFillContent(text) {
    const editableCandidates = Array.from(document.querySelectorAll('[contenteditable="true"]'))
      .filter((node) => node.offsetParent !== null)
      .sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width);

    for (const editor of editableCandidates) {
      if ((editor.innerText || '').length > 4000) {
        continue;
      }

      editor.focus();
      editor.textContent = text;
      editor.dispatchEvent(new InputEvent('input', { bubbles: true, data: text, inputType: 'insertText' }));
      editor.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }

    const textarea = document.querySelector('textarea[placeholder*="正文"], textarea[placeholder*="内容"]');
    if (textarea && textarea.offsetParent !== null) {
      setNativeValue(textarea, text);
      return true;
    }

    return false;
  }

  function ensureImagePostTab() {
    const tabCandidates = Array.from(document.querySelectorAll('div, button, span, li'))
      .filter((el) => {
        if (!el || !el.textContent) return false;
        const t = el.textContent.trim();
        if (!t) return false;
        return t === '图文' || t.includes('图文发布') || t.includes('上传图文');
      })
      .filter((el) => el.offsetParent !== null);

    if (tabCandidates.length === 0) {
      return false;
    }

    // Prefer clickable elements
    const clickTarget = tabCandidates.find((el) => el.tagName === 'BUTTON' || el.getAttribute('role') === 'tab') || tabCandidates[0];
    clickTarget.click();
    return true;
  }

  function findImageUploadInput() {
    const inputs = Array.from(document.querySelectorAll('input[type="file"]'));
    if (inputs.length === 0) return null;

    const scored = inputs
      .filter((input) => !input.disabled)
      .map((input) => {
        const accept = (input.getAttribute('accept') || '').toLowerCase();
        const isImage = accept.includes('image') || accept.includes('.png') || accept.includes('.jpg') || accept.includes('.jpeg') || accept === '';
        const rect = input.getBoundingClientRect();
        const area = Math.max(1, rect.width * rect.height);
        const score = (isImage ? 100 : 0) + (input.multiple ? 10 : 0) + Math.min(area / 1000, 20);
        return { input, score };
      })
      .sort((a, b) => b.score - a.score);

    return scored[0] ? scored[0].input : null;
  }

  function tryUploadImage(imageDataUrl, filename) {
    const input = findImageUploadInput();
    if (!input) {
      return false;
    }

    const file = dataUrlToFile(imageDataUrl, filename);
    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));

    // Some uploaders listen to drag-drop instead of change events.
    const dropTarget = input.closest('label, div, section, form') || input.parentElement;
    if (dropTarget) {
      try {
        const dropEvent = new DragEvent('drop', {
          bubbles: true,
          cancelable: true,
          dataTransfer: dt
        });
        dropTarget.dispatchEvent(dropEvent);
      } catch (error) {
        // ignore drag-drop fallback errors and rely on input change path
      }
    }

    return true;
  }

  function normalizeText(str) {
    return (str || '').replace(/\s+\n/g, '\n').trim();
  }

  function buildContent(payload) {
    const parts = [];
    if (payload.tweetText) {
      parts.push(normalizeText(payload.tweetText));
    }
    if (payload.tweetUrl) {
      parts.push(`\n来源: ${payload.tweetUrl}`);
    }
    return parts.join('\n\n').trim();
  }

  function buildTitle(payload) {
    const raw = normalizeText(payload.tweetText || payload.author || '推文分享');
    return raw.slice(0, 20) || '推文分享';
  }

  function markDone(id) {
    chrome.storage.local.set({ [DONE_KEY]: id }, () => {
      chrome.storage.local.remove(STORAGE_KEY);
    });
  }

  function loadPayload(cb) {
    chrome.storage.local.get([STORAGE_KEY, DONE_KEY], (data) => {
      cb(data[STORAGE_KEY], data[DONE_KEY]);
    });
  }

  function startAutofill() {
    loadPayload((payload, doneId) => {
      if (!payload || !payload.id) {
        return;
      }

      if (doneId && doneId === payload.id) {
        return;
      }

      const age = Date.now() - (payload.createdAt || 0);
      if (age > MAX_PENDING_AGE_MS) {
        chrome.storage.local.remove(STORAGE_KEY);
        return;
      }

      const title = buildTitle(payload);
      const content = buildContent(payload);
      const filename = payload.filename || `tweet-${Date.now()}.png`;

      let attempts = 0;
      const maxAttempts = 80;
      let uploaded = false;
      let titled = false;
      let contented = false;
      const timer = setInterval(() => {
        attempts += 1;

        ensureImagePostTab();
        if (!uploaded) uploaded = tryUploadImage(payload.imageDataUrl, filename);
        if (!titled) titled = tryFillTitle(title);
        if (!contented) contented = tryFillContent(content);

        if (uploaded && titled && contented) {
          clearInterval(timer);
          markDone(payload.id);
          showToast('已自动填充小红书图文');
          log('autofill completed');
          return;
        }

        if (attempts >= maxAttempts) {
          clearInterval(timer);
          showToast('自动填充未完成，请手动检查', true);
          log('autofill timed out', { uploaded, titled, contented });
        }
      }, 500);
    });
  }

  if (location.hostname === 'creator.xiaohongshu.com') {
    startAutofill();
  }
})();
