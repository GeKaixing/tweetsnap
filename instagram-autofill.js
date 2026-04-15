(() => {
  const STORAGE_KEY = 'tweetsnap_pending_post_instagram';
  const DONE_KEY = 'tweetsnap_last_applied_instagram_id';
  const INS_TO_X_STORAGE_KEY = 'tweetsnap_pending_ins_to_x';
  const MAX_PENDING_AGE_MS = 30 * 60 * 1000;
  const EXACT_CAPTION_SELECTOR = 'body > div.x1n2onr6.xzkaem6 > div.x9f619.x1n2onr6.x1ja2u2z > div > div.x1uvtmcs.x4k7w5x.x1h91t0o.x1beo9mf.xaigb6o.x12ejxvf.x3igimt.xarpa2k.xedcshv.x1lytzrv.x1t2pt76.x7ja8zs.x1n2onr6.x1qrby5j.x1jfb8zj > div > div > div > div > div > div > div > div.x15wfb8v.x3aagtl.x6ql1ns.x78zum5.xdl72j9.x1iyjqo2.xs83m0k.x13vbajr.x1ue5u6n > div.xwt6s21.x1t7ytsu.xpilrb4.x9f619.x78zum5.x1n2onr6.x1f4304s > div > div > div > div > div:nth-child(2) > div > div.x6s0dn4.x78zum5.x1n2onr6.xh8yej3 > div.xw2csxc.x1odjw0f.x1n2onr6.x1hnll1o.xpqswwc.xl565be.x5dp1im.xdj266r.x14z9mp.xat24cr.x1lziwak.x1w2wdq1.xen30ot.xf7dkkf.xv54qhq.xh8yej3.x5n08af.notranslate';
  const EXACT_CROP_TOGGLE_SELECTOR = 'body > div.x1n2onr6.xzkaem6 > div.x9f619.x1n2onr6.x1ja2u2z > div > div.x1uvtmcs.x4k7w5x.x1h91t0o.x1beo9mf.xaigb6o.x12ejxvf.x3igimt.xarpa2k.xedcshv.x1lytzrv.x1t2pt76.x7ja8zs.x1n2onr6.x1qrby5j.x1jfb8zj > div > div > div > div > div > div > div > div.xdl72j9.x1iyjqo2.xs83m0k.x15wfb8v.x3aagtl.xqbdwvv.x6ql1ns.x1cwzgcd > div.x6s0dn4.x78zum5.x5yr21d.xl56j7k.x1n2onr6.xh8yej3 > div > div > div > div > div.html-div.xexx8yu.xyri2b.x18d9i69.x1c1uobl.x9f619.xjbqb8w.x78zum5.x15mokao.x1ga7v0g.x16uus16.xbiv7yw.x1xmf6yo.x1xegmmw.x1e56ztr.x13fj5qh.x10l6tqk.x1ey2m1c.x1o0tod.x1plvlek.xryxfnj.x1c4vz4f.x2lah0s.xdt5ytf.xqjyukv.x1qjc9v5.x1oa3qoh.x1nhvcw1 > div > div:nth-child(2) > div > button';
  const EXACT_ORIGINAL_OPTION_SELECTOR = 'body > div.x1n2onr6.xzkaem6 > div.x9f619.x1n2onr6.x1ja2u2z > div > div.x1uvtmcs.x4k7w5x.x1h91t0o.x1beo9mf.xaigb6o.x12ejxvf.x3igimt.xarpa2k.xedcshv.x1lytzrv.x1t2pt76.x7ja8zs.x1n2onr6.x1qrby5j.x1jfb8zj > div > div > div > div > div > div > div > div.xdl72j9.x1iyjqo2.xs83m0k.x15wfb8v.x3aagtl.xqbdwvv.x6ql1ns.x1cwzgcd > div.x6s0dn4.x78zum5.x5yr21d.xl56j7k.x1n2onr6.xh8yej3 > div > div > div > div > div.html-div.xexx8yu.xyri2b.x18d9i69.x1c1uobl.x9f619.xjbqb8w.x78zum5.x15mokao.x1ga7v0g.x16uus16.xbiv7yw.x1xmf6yo.x1xegmmw.x1e56ztr.x13fj5qh.x10l6tqk.x1ey2m1c.x1o0tod.x1plvlek.xryxfnj.x1c4vz4f.x2lah0s.xdt5ytf.xqjyukv.x1qjc9v5.x1oa3qoh.x1nhvcw1 > div > div.html-div.xdj266r.x14z9mp.xat24cr.x1lziwak.x9f619.xf68679.xjbqb8w.x78zum5.x15mokao.x1ga7v0g.x16uus16.xbiv7yw.x1y1aw1k.xf159sx.xwib8y2.xmzvs34.x1n2onr6.x1plvlek.xryxfnj.x1c4vz4f.x2lah0s.xdt5ytf.xqjyukv.x1qjc9v5.x1oa3qoh.x1nhvcw1 > div > div:nth-child(1)';
  let lastMenuSourceArticle = null;

  function showToast(message, isError = false) {
    const id = 'tweetsnap-instagram-toast';
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

  function normalizeWhitespace(text) {
    return (text || '').replace(/\s+/g, ' ').trim();
  }

  function cleanInstagramCaptionText(text) {
    let t = normalizeWhitespace(text || '');
    // Strip common "expand caption" trailing labels.
    t = t.replace(/\s*(更多|顯示更多|显示更多|show more|more)\s*$/i, '').trim();
    return t;
  }

  function isInvalidCaptionText(text) {
    if (!text) return true;
    const t = normalizeWhitespace(text).toLowerCase();
    if (!t) return true;
    if (['更多', '顯示更多', '显示更多', 'show more', 'more'].includes(t)) return true;
    if (/^\d+[smhdw]$/i.test(t)) return true;
    return false;
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function getInstagramPostDescription(article) {
    const root = article || document.querySelector('article') || document.body;
    const titleNode = root.querySelector('h1');
    if (titleNode) {
      const text = cleanInstagramCaptionText(titleNode.innerText || titleNode.textContent || '');
      if (!isInvalidCaptionText(text)) return text;
    }

    const captionCandidates = Array.from(
      root.querySelectorAll('span, div[dir="auto"], h2, h3')
    );
    for (const node of captionCandidates) {
      if (!node || !isElementVisible(node)) continue;
      const text = cleanInstagramCaptionText(node.innerText || node.textContent || '');
      if (isInvalidCaptionText(text)) continue;
      if (text.length < 8) continue;
      if (text.startsWith('@')) continue;
      return text;
    }

    const og = document.querySelector('meta[property="og:description"]');
    if (og && og.content) {
      const match = og.content.match(/:\s*"([\s\S]*?)"/);
      if (match && match[1]) {
        const cleaned = cleanInstagramCaptionText(match[1]);
        if (!isInvalidCaptionText(cleaned)) return cleaned;
      }
      const cleanedOg = cleanInstagramCaptionText(og.content);
      if (!isInvalidCaptionText(cleanedOg)) return cleanedOg;
    }

    return '';
  }

  function scanPostMediaFromArticle(article) {
    if (!article) return [];
    const nodes = Array.from(article.querySelectorAll('img, video'));
    const media = [];

    for (const node of nodes) {
      const tag = node.tagName.toLowerCase();
      let src = '';
      if (tag === 'video') {
        src = node.currentSrc || node.src || '';
        if (!src) {
          const source = node.querySelector('source');
          src = source ? (source.src || '') : '';
        }
      } else {
        src = node.currentSrc || node.src || '';
      }

      if (!src || /^data:/i.test(src)) continue;
      if (!/^https?:\/\//i.test(src)) continue;
      if (/instagram\.com\/static\//i.test(src)) continue;
      if (/(logo|glyph|sprite)\./i.test(src)) continue;
      if (/\/(emoji|profile_pic|avatar)\//i.test(src)) continue;
      if (node.closest('header')) continue;
      if (node.closest('svg')) continue;

      const rect = node.getBoundingClientRect();
      const width = tag === 'img'
        ? (node.naturalWidth || rect.width || 0)
        : (node.videoWidth || rect.width || 0);
      const height = tag === 'img'
        ? (node.naturalHeight || rect.height || 0)
        : (node.videoHeight || rect.height || 0);

      // Keep videos by URL first; metadata sizes may be 0 before playback.
      if (tag === 'video') {
        media.push(src);
        continue;
      }

      const maxSide = Math.max(width, height);
      const area = width * height;
      // Post media should be reasonably large; this removes avatars/icons.
      if (maxSide < 260) continue;
      if (area < 80000) continue;

      if (tag === 'img') {
        const style = window.getComputedStyle(node);
        const borderRadiusRaw = style.borderRadius || '';
        const radius = parseFloat(borderRadiusRaw) || 0;
        // Typical avatar is circular.
        if (borderRadiusRaw.includes('%') || radius >= Math.min(width, height) / 2.2) continue;
      }

      media.push(src);
    }

    return media;
  }

  function isLikelyInstagramMediaUrl(src) {
    if (!src || !/^https?:\/\//i.test(src)) return false;
    if (/instagram\.com\/static\//i.test(src)) return false;
    if (/(logo|glyph|sprite)\./i.test(src)) return false;
    if (/\/(emoji|profile_pic|avatar)\//i.test(src)) return false;
    return /cdninstagram\.com|fbcdn\.net|scontent/i.test(src) || /\/(vp|e35|e15)\//i.test(src);
  }

  function isLikelyVideoPost(article) {
    const root = article || document.querySelector('article') || document;
    if (/\/reel\//i.test(location.pathname)) return true;
    if (root.querySelector('video, source[type*="video"]')) return true;
    const ogVideo = document.querySelector('meta[property="og:video"], meta[property="og:video:secure_url"]');
    return !!(ogVideo && ogVideo.content);
  }

  function findCarouselNextButton(article) {
    if (!article) return null;
    const selectors = [
      'button[aria-label*="Next" i]',
      'button[aria-label*="下一張"]',
      'button[aria-label*="下一张"]',
      'button[aria-label*="下一步"]'
    ];
    for (const selector of selectors) {
      const btn = article.querySelector(selector);
      if (btn && isElementVisible(btn) && !btn.disabled) return btn;
    }
    return null;
  }

  async function getInstagramPostMediaUrls(articleOverride) {
    const article = articleOverride || document.querySelector('article');

    const collected = [];
    const seen = new Set();
    const pushMedia = (items) => {
      for (const src of items) {
        if (seen.has(src)) continue;
        seen.add(src);
        collected.push(src);
      }
    };

    if (article) {
      pushMedia(scanPostMediaFromArticle(article));
    }

    // Try traversing carousel to collect more media in post order.
    let noNewRound = 0;
    for (let i = 0; i < 8; i += 1) {
      const nextBtn = article ? findCarouselNextButton(article) : null;
      if (!nextBtn) break;

      const beforeCount = collected.length;
      nextBtn.click();
      await sleep(420);
      pushMedia(scanPostMediaFromArticle(article));
      if (collected.length === beforeCount) {
        noNewRound += 1;
      } else {
        noNewRound = 0;
      }
      if (noNewRound >= 2) break;
    }

    if (collected.length > 0) return collected;

    const ogVideo = document.querySelector('meta[property="og:video"], meta[property="og:video:secure_url"]');
    if (ogVideo && ogVideo.content) return [ogVideo.content];

    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage && ogImage.content) return [ogImage.content];
    return [];
  }

  function openXComposePage() {
    return new Promise((resolve) => {
      const fallback = () => {
        const target = 'https://x.com/compose/post';
        window.open(target, '_blank', 'noopener');
        resolve(true);
      };

      if (!chrome.runtime || !chrome.runtime.sendMessage) {
        fallback();
        return;
      }

      chrome.runtime.sendMessage({ type: 'OPEN_X_COMPOSE' }, (response) => {
        if (chrome.runtime.lastError || !response || !response.ok) {
          fallback();
          return;
        }
        resolve(true);
      });
    });
  }

  function savePendingInsToX(payload) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [INS_TO_X_STORAGE_KEY]: payload }, () => {
        resolve(!chrome.runtime.lastError);
      });
    });
  }

  async function handleInsToXShare() {
    const sourceArticle = lastMenuSourceArticle || document.querySelector('article');
    const description = getInstagramPostDescription(sourceArticle);
    const mediaUrls = (await getInstagramPostMediaUrls(sourceArticle)).filter((url) => {
      if (!url) return false;
      if (/instagram\.com\/static\//i.test(url)) return false;
      if (/(logo|glyph|sprite)\./i.test(url)) return false;
      return true;
    });
    if (mediaUrls.length === 0) {
      if (isLikelyVideoPost(sourceArticle)) {
        showToast(isZhLanguage() ? '暂不支持视频' : 'Video is not supported yet', true);
      } else {
        showToast(isZhLanguage() ? '未找到可分享的图片' : 'No shareable images found', true);
      }
      return;
    }

    const payload = {
      id: `ins-to-x-${Date.now()}`,
      createdAt: Date.now(),
      sourceUrl: location.href,
      description: description || '',
      mediaUrls
    };

    const saved = await savePendingInsToX(payload);
    if (!saved) {
      showToast(isZhLanguage() ? '保存分享数据失败' : 'Failed to save share payload', true);
      return;
    }

    await openXComposePage();
    const total = mediaUrls.length;
    const willUpload = Math.min(4, total);
    showToast(
      isZhLanguage()
        ? `已发送到 X，检测到 ${total} 个媒体，将上传前 ${willUpload} 个`
        : `Sent to X. Found ${total} media, uploading first ${willUpload}`
    );
    lastMenuSourceArticle = null;
  }

  function nodeText(node) {
    return (node && (node.innerText || node.textContent) || '').replace(/\s+/g, ' ').trim();
  }

  function textMatch(text, keywords) {
    const lower = (text || '').toLowerCase();
    return keywords.some((k) => lower.includes(k));
  }

  function replaceMenuRowLabel(row, label) {
    const leaves = Array.from(row.querySelectorAll('*'))
      .filter((node) => node.childElementCount === 0)
      .filter((node) => nodeText(node).length > 0);
    if (leaves.length > 0) {
      leaves[0].textContent = label;
      return;
    }
    row.textContent = label;
  }

  function injectInsToXIntoThreeDotMenu() {
    const dialogs = Array.from(document.querySelectorAll('div[role="dialog"], div[role="menu"]'))
      .filter((menu) => isElementVisible(menu));

    for (const dialog of dialogs) {
      if (dialog.querySelector('.tweetsnap-share-x-menu-item')) continue;

      const optionNodes = Array.from(dialog.querySelectorAll('button, div[role="button"]'))
        .filter((node) => isElementVisible(node));
      if (optionNodes.length < 3) continue;

      const shareToNode = optionNodes.find((node) => textMatch(nodeText(node), [
        '分享到', 'share to', 'share to...', '分享至'
      ]));
      const copyLinkNode = optionNodes.find((node) => textMatch(nodeText(node), [
        '複製連結', '复制链接', 'copy link'
      ]));
      const cancelNode = optionNodes.find((node) => textMatch(nodeText(node), [
        '取消', 'cancel'
      ]));

      // Ensure this is the intended post three-dot menu by option text shape.
      if (!shareToNode && !copyLinkNode) continue;
      if (!cancelNode) continue;

      const baseNode = shareToNode || copyLinkNode || optionNodes[0];
      const row = baseNode.cloneNode(true);
      row.classList.add('tweetsnap-share-x-menu-item');

      // Replace text content while preserving menu row structure/styles.
      replaceMenuRowLabel(row, isZhLanguage() ? '分享到X' : 'Share to X');

      row.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        handleInsToXShare();
      });

      // Insert after "分享到……" if found, otherwise before "複製連結"/"取消".
      if (shareToNode && shareToNode.parentElement) {
        shareToNode.insertAdjacentElement('afterend', row);
      } else if (copyLinkNode && copyLinkNode.parentElement) {
        copyLinkNode.insertAdjacentElement('beforebegin', row);
      } else if (cancelNode && cancelNode.parentElement) {
        cancelNode.insertAdjacentElement('beforebegin', row);
      } else if (baseNode.parentElement) {
        baseNode.parentElement.appendChild(row);
      }
      return;
    }
  }

  function rememberMenuSourceArticleByClick(event) {
    const el = event && event.target ? event.target : null;
    if (!el || !el.closest) return;
    const btn = el.closest('button, div[role="button"]');
    if (!btn) return;
    const article = btn.closest('article');
    if (!article) return;

    const rawLabel = (
      btn.getAttribute('aria-label') ||
      (btn.querySelector('[aria-label]') && btn.querySelector('[aria-label]').getAttribute('aria-label')) ||
      btn.textContent ||
      ''
    ).toLowerCase();

    const looksLikeMoreButton = /more|更多|選項|选项|options|menu|\.\.\./i.test(rawLabel);
    if (looksLikeMoreButton) {
      lastMenuSourceArticle = article;
      return;
    }

    // Fallback: many Instagram three-dot buttons have weak labels.
    // Accept clicks in article top-right action zone as menu trigger context.
    const r = btn.getBoundingClientRect();
    const ar = article.getBoundingClientRect();
    const inTopRegion = r.top <= ar.top + Math.max(90, ar.height * 0.28);
    const inRightRegion = r.left >= ar.left + ar.width * 0.55;
    if (inTopRegion && inRightRegion) {
      lastMenuSourceArticle = article;
    }
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
    document.addEventListener('click', rememberMenuSourceArticleByClick, true);
    startAutofill();
    const observer = new MutationObserver(() => {
      injectInsToXIntoThreeDotMenu();
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
})();
