(() => {
  const STORAGE_KEY = 'xtoimage_pending_post_instagram';
  const DONE_KEY = 'xtoimage_last_applied_instagram_id';
  const MAX_PENDING_AGE_MS = 30 * 60 * 1000;
  const EXACT_CAPTION_SELECTOR = 'body > div.x1n2onr6.xzkaem6 > div.x9f619.x1n2onr6.x1ja2u2z > div > div.x1uvtmcs.x4k7w5x.x1h91t0o.x1beo9mf.xaigb6o.x12ejxvf.x3igimt.xarpa2k.xedcshv.x1lytzrv.x1t2pt76.x7ja8zs.x1n2onr6.x1qrby5j.x1jfb8zj > div > div > div > div > div > div > div > div.x15wfb8v.x3aagtl.x6ql1ns.x78zum5.xdl72j9.x1iyjqo2.xs83m0k.x13vbajr.x1ue5u6n > div.xwt6s21.x1t7ytsu.xpilrb4.x9f619.x78zum5.x1n2onr6.x1f4304s > div > div > div > div > div:nth-child(2) > div > div.x6s0dn4.x78zum5.x1n2onr6.xh8yej3 > div.xw2csxc.x1odjw0f.x1n2onr6.x1hnll1o.xpqswwc.xl565be.x5dp1im.xdj266r.x14z9mp.xat24cr.x1lziwak.x1w2wdq1.xen30ot.xf7dkkf.xv54qhq.xh8yej3.x5n08af.notranslate';
  const EXACT_CROP_TOGGLE_SELECTOR = 'body > div.x1n2onr6.xzkaem6 > div.x9f619.x1n2onr6.x1ja2u2z > div > div.x1uvtmcs.x4k7w5x.x1h91t0o.x1beo9mf.xaigb6o.x12ejxvf.x3igimt.xarpa2k.xedcshv.x1lytzrv.x1t2pt76.x7ja8zs.x1n2onr6.x1qrby5j.x1jfb8zj > div > div > div > div > div > div > div > div.xdl72j9.x1iyjqo2.xs83m0k.x15wfb8v.x3aagtl.xqbdwvv.x6ql1ns.x1cwzgcd > div.x6s0dn4.x78zum5.x5yr21d.xl56j7k.x1n2onr6.xh8yej3 > div > div > div > div > div.html-div.xexx8yu.xyri2b.x18d9i69.x1c1uobl.x9f619.xjbqb8w.x78zum5.x15mokao.x1ga7v0g.x16uus16.xbiv7yw.x1xmf6yo.x1xegmmw.x1e56ztr.x13fj5qh.x10l6tqk.x1ey2m1c.x1o0tod.x1plvlek.xryxfnj.x1c4vz4f.x2lah0s.xdt5ytf.xqjyukv.x1qjc9v5.x1oa3qoh.x1nhvcw1 > div > div:nth-child(2) > div > button';
  const EXACT_ORIGINAL_OPTION_SELECTOR = 'body > div.x1n2onr6.xzkaem6 > div.x9f619.x1n2onr6.x1ja2u2z > div > div.x1uvtmcs.x4k7w5x.x1h91t0o.x1beo9mf.xaigb6o.x12ejxvf.x3igimt.xarpa2k.xedcshv.x1lytzrv.x1t2pt76.x7ja8zs.x1n2onr6.x1qrby5j.x1jfb8zj > div > div > div > div > div > div > div > div.xdl72j9.x1iyjqo2.xs83m0k.x15wfb8v.x3aagtl.xqbdwvv.x6ql1ns.x1cwzgcd > div.x6s0dn4.x78zum5.x5yr21d.xl56j7k.x1n2onr6.xh8yej3 > div > div > div > div > div.html-div.xexx8yu.xyri2b.x18d9i69.x1c1uobl.x9f619.xjbqb8w.x78zum5.x15mokao.x1ga7v0g.x16uus16.xbiv7yw.x1xmf6yo.x1xegmmw.x1e56ztr.x13fj5qh.x10l6tqk.x1ey2m1c.x1o0tod.x1plvlek.xryxfnj.x1c4vz4f.x2lah0s.xdt5ytf.xqjyukv.x1qjc9v5.x1oa3qoh.x1nhvcw1 > div > div.html-div.xdj266r.x14z9mp.xat24cr.x1lziwak.x9f619.xf68679.xjbqb8w.x78zum5.x15mokao.x1ga7v0g.x16uus16.xbiv7yw.x1y1aw1k.xf159sx.xwib8y2.xmzvs34.x1n2onr6.x1plvlek.xryxfnj.x1c4vz4f.x2lah0s.xdt5ytf.xqjyukv.x1qjc9v5.x1oa3qoh.x1nhvcw1 > div > div:nth-child(1)';

  function showToast(message, isError = false) {
    const id = 'xtoimage-instagram-toast';
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
    setTimeout(() => el.remove(), 2800);
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

  function normalizeText(str) {
    return (str || '').replace(/\s+\n/g, '\n').trim();
  }

  function isZhLanguage() {
    const lang = (document.documentElement.getAttribute('lang') || navigator.language || '').toLowerCase();
    return lang.startsWith('zh');
  }

  function buildCaption(payload) {
    const parts = [];
    if (payload.tweetText) {
      parts.push(normalizeText(payload.tweetText));
    }
    if (payload.tweetUrl) {
      parts.push(`${isZhLanguage() ? '来源' : 'Source'}: ${payload.tweetUrl}`);
    }
    return parts.join('\n\n').trim().slice(0, 2200);
  }

  function loadPayload(cb) {
    chrome.storage.local.get([STORAGE_KEY, DONE_KEY], (data) => {
      cb(data[STORAGE_KEY], data[DONE_KEY]);
    });
  }

  function markDone(id) {
    chrome.storage.local.set({ [DONE_KEY]: id }, () => {
      chrome.storage.local.remove(STORAGE_KEY);
    });
  }

  function isElementVisible(node) {
    if (!node) return false;
    const style = window.getComputedStyle(node);
    if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) {
      return false;
    }
    const rect = node.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function clickButtonByText(textCandidates) {
    const textSet = new Set(textCandidates.map((text) => text.toLowerCase()));
    const candidates = Array.from(document.querySelectorAll('button, div[role="button"]'))
      .filter((node) => isElementVisible(node));

    for (const node of candidates) {
      const text = (node.textContent || '').trim().toLowerCase();
      if (!text) continue;
      if (textSet.has(text)) {
        node.click();
        return true;
      }
    }
    return false;
  }

  function clickNextStep() {
    return clickButtonByText(['Next', '下一步']);
  }

  function clickElementByTextContains(textCandidates) {
    const keys = textCandidates.map((text) => text.toLowerCase());
    const candidates = Array.from(document.querySelectorAll('button, div[role="button"], span, a, li, div[role="menuitemradio"], div[role="radio"]'))
      .filter((node) => isElementVisible(node));

    for (const node of candidates) {
      const text = (node.textContent || '').trim().toLowerCase();
      if (!text) continue;
      if (keys.some((k) => text.includes(k))) {
        const target = node.closest('button, a, div[role="button"], li, div[role="menuitemradio"], div[role="radio"]') || node;
        target.click();
        return true;
      }
    }
    return false;
  }

  function hasCaptionEditor() {
    const selectors = [
      'textarea[aria-label*="caption" i]',
      'textarea[placeholder*="caption" i]',
      '[contenteditable="true"][aria-label*="caption" i]',
      'textarea[aria-label*="说明"]',
      '[contenteditable="true"][aria-label*="说明"]',
      '[contenteditable="true"][role="textbox"]',
      'textarea'
    ];
    return selectors.some((selector) => {
      const node = document.querySelector(selector);
      return !!(node && isElementVisible(node));
    });
  }

  function clickBackInComposer() {
    const clickedBySelector = clickBySelector([
      'button[aria-label="Back"]',
      'button[aria-label*="Back" i]',
      '[aria-label*="返回"]',
      '[aria-label*="返回到编辑"]',
      '[aria-label*="返回到裁剪"]',
      'svg[aria-label="Back"]',
      'svg[aria-label*="Back" i]'
    ]);
    if (clickedBySelector) return true;

    return clickElementByTextContains(['返回', 'back']);
  }

  function trySetOriginalAspect() {
    if (clickByExactSelector(EXACT_ORIGINAL_OPTION_SELECTOR)) {
      return 'selected';
    }
    if (clickByExactSelector(EXACT_CROP_TOGGLE_SELECTOR)) {
      return 'opened';
    }

    const menuNodes = Array.from(document.querySelectorAll('div, section, ul'))
      .filter((node) => isElementVisible(node))
      .filter((node) => {
        const text = (node.textContent || '').replace(/\s+/g, '');
        return (text.includes('原始') || text.toLowerCase().includes('original')) &&
          text.includes('1:1') &&
          (text.includes('4:5') || text.includes('16:9'));
      });

    if (menuNodes.length > 0) {
      const menu = menuNodes[0];
      const optionNodes = Array.from(menu.querySelectorAll('li, div, span, button, [role="menuitemradio"], [role="radio"]'))
        .filter((node) => isElementVisible(node));
      for (const option of optionNodes) {
        const t = (option.textContent || '').trim().toLowerCase();
        if (t === '原始' || t === 'original' || t.includes('原始') || t.includes('original')) {
          const target = option.closest('button, li, div[role="button"], div[role="menuitemradio"], div[role="radio"]') || option;
          target.click();
          return 'selected';
        }
      }
    }

    const selectedOriginal = clickElementByTextContains([
      'original',
      '原始',
      '原图',
      '原圖'
    ]);
    if (selectedOriginal) {
      return 'selected';
    }

    const openedRatioMenu = clickBySelector([
      'button[aria-label*="Select crop" i]',
      'button[aria-label*="crop" i]',
      'button[aria-label*="aspect" i]',
      'button[aria-label*="ratio" i]',
      '[aria-label*="裁剪"]',
      '[aria-label*="剪裁"]',
      '[aria-label*="比例"]',
      'svg[aria-label*="Select crop" i]',
      'svg[aria-label*="crop" i]',
      'svg[aria-label*="ratio" i]',
      'svg[aria-label*="裁剪"]',
      'svg[aria-label*="比例"]'
    ]);
    if (openedRatioMenu) {
      return 'opened';
    }

    return 'none';
  }


  function clickBySelector(selectors) {
    for (const selector of selectors) {
      const node = document.querySelector(selector);
      if (node && isElementVisible(node)) {
        const target = node.closest('a, button, div[role="button"], li, div[role="menuitemradio"], div[role="radio"]') || node;
        target.click();
        return true;
      }
    }
    return false;
  }

  function clickByExactSelector(selector) {
    const node = document.querySelector(selector);
    if (!node) return false;
    const target = node.closest('a, button, div[role="button"], li, div[role="menuitemradio"], div[role="radio"]') || node;
    target.click();
    return true;
  }

  function ensurePostComposerOpen() {
    const hasUploadInput = !!findUploadInput();
    if (hasUploadInput) return true;

    const openedByHomeCreate = clickBySelector([
      'a[href="/create/select/"]',
      '[aria-label="New post"]',
      '[aria-label="Create"]',
      '[aria-label*="new post" i]',
      '[aria-label*="create" i]',
      '[aria-label*="创建"]',
      '[aria-label*="建立"]',
      '[aria-label*="貼文"]',
      '[aria-label*="帖子"]',
      'svg[aria-label="New post"]',
      'svg[aria-label*="create" i]',
      'svg[aria-label*="创建"]',
      'svg[aria-label*="建立"]',
      'svg[aria-label*="貼文"]'
    ]);
    if (openedByHomeCreate) return true;

    const clickedCreateEntry = clickButtonByText([
      'Create',
      'New post',
      '创建',
      '建立',
      '新建',
      '新增',
      '建立新貼文',
      '建立貼文',
      '新增貼文',
      '新貼文'
    ]);
    if (clickedCreateEntry) return true;

    const clickedPostType = clickButtonByText([
      'Post',
      '帖子',
      '贴文',
      '貼文',
      '发布贴文',
      '發佈貼文'
    ]);
    if (clickedPostType) return true;

    return false;
  }

  function findUploadInput() {
    const inputs = Array.from(document.querySelectorAll('input[type="file"]'));
    if (inputs.length === 0) return null;

    const scored = inputs
      .filter((input) => !input.disabled)
      .map((input) => {
        const accept = (input.getAttribute('accept') || '').toLowerCase();
        const isImage = accept.includes('image') || accept.includes('.png') || accept.includes('.jpg') || accept.includes('.jpeg') || accept === '';
        const score = (isImage ? 100 : 0) + (input.multiple ? 10 : 0);
        return { input, score };
      })
      .sort((a, b) => b.score - a.score);

    return scored[0] ? scored[0].input : null;
  }

  function tryUploadImages(imageDataUrls, filenamePrefix) {
    const input = findUploadInput();
    if (!input || !Array.isArray(imageDataUrls) || imageDataUrls.length === 0) {
      return false;
    }

    const maxCount = input.multiple ? 10 : 1;
    const dt = new DataTransfer();
    imageDataUrls.slice(0, maxCount).forEach((dataUrl, index) => {
      dt.items.add(dataUrlToFile(dataUrl, `${filenamePrefix}_${index + 1}.png`));
    });
    input.files = dt.files;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  function tryFillCaption(caption) {
    const exactNode = document.querySelector(EXACT_CAPTION_SELECTOR);
    if (exactNode && isElementVisible(exactNode)) {
      exactNode.focus();
      exactNode.textContent = caption;
      exactNode.dispatchEvent(new InputEvent('input', { bubbles: true, data: caption, inputType: 'insertText' }));
      exactNode.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }

    const textboxSelectors = [
      'textarea[aria-label*="caption" i]',
      'textarea[placeholder*="caption" i]',
      '[contenteditable="true"][aria-label*="caption" i]',
      'div.notranslate[contenteditable="true"]',
      'div.notranslate[role="textbox"]',
      'textarea[aria-label*="说明"]',
      '[contenteditable="true"][aria-label*="说明"]',
      '[contenteditable="true"][role="textbox"]',
      'textarea'
    ];

    for (const selector of textboxSelectors) {
      const input = document.querySelector(selector);
      if (!input || !isElementVisible(input)) continue;

      input.focus();
      if ('value' in input) {
        input.value = caption;
      } else {
        input.textContent = caption;
      }
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }
    return false;
  }

  function startAutofill() {
    loadPayload((payload, doneId) => {
      if (!payload || !payload.id) return;
      if (doneId && doneId === payload.id) return;

      const age = Date.now() - (payload.createdAt || 0);
      if (age > MAX_PENDING_AGE_MS) {
        chrome.storage.local.remove(STORAGE_KEY);
        return;
      }

      const caption = buildCaption(payload);
      const filenamePrefix = (payload.filename || `tweet-${Date.now()}.png`).replace(/\.[a-z0-9]+$/i, '');
      const imageDataUrls = Array.isArray(payload.imageDataUrls) && payload.imageDataUrls.length > 0
        ? payload.imageDataUrls
        : (payload.imageDataUrl ? [payload.imageDataUrl] : []);
      const needsOriginalAfterLongCrop = true;

      let attempts = 0;
      const maxAttempts = 120;
      let uploaded = false;
      let captionFilled = false;
      let nextClicks = 0;
      let createClicked = false;
      let aspectAdjusted = !needsOriginalAfterLongCrop;
      let backClicksForAspect = 0;
      let aspectAttempts = 0;

      const timer = setInterval(() => {
        attempts += 1;

        if (!uploaded && !createClicked) {
          const clickedNow = ensurePostComposerOpen();
          if (clickedNow) {
            createClicked = true;
          }
        }

        if (!uploaded) {
          uploaded = tryUploadImages(imageDataUrls, filenamePrefix);
        } else if (!aspectAdjusted && aspectAttempts < 14) {
          aspectAttempts += 1;
          if (hasCaptionEditor() && backClicksForAspect < 2) {
            if (clickBackInComposer()) {
              backClicksForAspect += 1;
            }
          } else {
            const aspectResult = trySetOriginalAspect();
            if (aspectResult === 'selected') {
              aspectAdjusted = true;
            }
          }
        } else if (!captionFilled && nextClicks < 4) {
          if (clickNextStep()) {
            nextClicks += 1;
          }
        }

        if (!captionFilled) {
          captionFilled = tryFillCaption(caption);
        }

        if (uploaded && captionFilled) {
          clearInterval(timer);
          markDone(payload.id);
          showToast(isZhLanguage() ? '已自动填充 Instagram 贴文，请确认后发布' : 'Instagram post prepared. Please review and publish.');
          return;
        }

        if (attempts >= maxAttempts) {
          clearInterval(timer);
          showToast(isZhLanguage() ? 'Instagram 自动填充未完成，请手动检查' : 'Instagram autofill timed out. Please check manually.', true);
        }
      }, 600);
    });
  }

  if (location.hostname === 'www.instagram.com' || location.hostname === 'instagram.com') {
    startAutofill();
  }
})();
