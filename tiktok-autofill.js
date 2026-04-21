(() => {
  const TIKTOK_TO_X_STORAGE_KEY = 'tweetsnap_pending_tiktok_to_x';

  function isZhLanguage() {
    const lang = (document.documentElement.getAttribute('lang') || navigator.language || '').toLowerCase();
    return lang.startsWith('zh');
  }

  function t(zh, en) {
    return isZhLanguage() ? zh : en;
  }

  function showToast(message, isError = false) {
    const id = 'tweetsnap-tiktok-toast';
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
    el.style.background = isError ? 'rgba(215,58,73,.95)' : 'rgba(23,191,99,.95)';
    el.style.boxShadow = '0 8px 24px rgba(0,0,0,.2)';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function normalizeHttpUrl(url) {
    if (!url || typeof url !== 'string') return '';
    let raw = url.trim();
    if (!raw || raw.startsWith('blob:') || raw.startsWith('data:')) return '';

    const duplicated = Array.from(raw.matchAll(/https?:\/\/www\.tiktok\.com\//gi));
    if (duplicated.length > 1) {
      const last = duplicated[duplicated.length - 1];
      if (last && typeof last.index === 'number') {
        raw = raw.slice(last.index);
      }
    }

    try {
      const parsed = new URL(raw, location.href);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
      return parsed.toString();
    } catch (error) {
      return '';
    }
  }

  function sanitizeTikTokSourceUrl(rawUrl) {
    const raw = String(rawUrl || '').trim();
    if (!raw) return '';

    let decoded = raw
      .replace(/\\u002F/gi, '/')
      .replace(/\\\//g, '/')
      .replace(/&amp;/g, '&');

    try {
      decoded = decodeURIComponent(decoded);
    } catch (error) {
      // keep decoded as-is
    }

    const matches = decoded.match(/https?:\/\/[^\s"'<>()]+/gi) || [];
    const normalized = matches.map((u) => normalizeHttpUrl(u)).filter(Boolean);

    const tiktokUrl = normalized.find((u) => /:\/\/([a-z0-9-]+\.)?tiktok\.com\//i.test(u));
    if (!tiktokUrl) return '';

    const nestedAt = tiktokUrl.indexOf('https://', 9);
    if (nestedAt > 0) {
      return tiktokUrl.slice(0, nestedAt);
    }
    return tiktokUrl;
  }

  function parseTikTokTask(rawText) {
    const text = String(rawText || '');
    const parsed = text.match(/https?:\/\/(www\.tiktok\.com\/@[^/]+\/video\/(\d+)|vm\.tiktok\.com\/([^/]+)\/)/i);
    if (!parsed) return null;

    return {
      videoUrl: normalizeHttpUrl(parsed[0]),
      type: parsed[1].replace(/(www|vm)\.(tiktok).*/, '$1.$2'),
      parsedId: parsed.slice(2).filter(Boolean)[0] || ''
    };
  }

  function extractVideoId(url) {
    const m = String(url || '').match(/\/video\/(\d+)/i);
    return m ? m[1] : '';
  }

  function getMetaContent(selector) {
    const node = document.querySelector(selector);
    return node && node.content ? String(node.content).trim() : '';
  }

  function getCanonicalSourceUrl() {
    const ogUrl = sanitizeTikTokSourceUrl(getMetaContent('meta[property="og:url"]'));
    if (ogUrl) return ogUrl;

    const fromLocation = sanitizeTikTokSourceUrl(location.href);
    if (fromLocation) return fromLocation;

    return 'https://www.tiktok.com/';
  }

  function getDescription() {
    const selectors = [
      '[data-e2e="browse-video-desc"]',
      'h1[data-e2e*="video-desc"]',
      'h1',
      'meta[name="description"]'
    ];

    for (const selector of selectors) {
      const node = document.querySelector(selector);
      if (!node) continue;
      const text = selector.startsWith('meta')
        ? (node.getAttribute('content') || '')
        : (node.innerText || node.textContent || '');
      const cleaned = String(text || '').trim().replace(/\s+/g, ' ');
      if (cleaned) return cleaned;
    }
    return '';
  }

  function cleanDescriptionText(text) {
    const raw = String(text || '').trim();
    if (!raw) return '';
    const lines = raw.split('\n');
    const filtered = lines.filter((line) => !/^\s*(source|来源)\s*:/i.test(line.trim()));
    return filtered.join('\n').trim();
  }

  function buildComposeText(description, sourceUrl) {
    const source = sanitizeTikTokSourceUrl(sourceUrl || getCanonicalSourceUrl()) || getCanonicalSourceUrl();
    const sourceText = `${t('来源', 'Source')}: ${source}`;
    const cleaned = cleanDescriptionText(description);
    if (!cleaned) return sourceText;
    if (cleaned.includes(sourceText)) return cleaned.slice(0, 2200);
    return `${cleaned}\n\n${sourceText}`.slice(0, 2200);
  }

  function fetchJsonViaBackground(url) {
    return new Promise((resolve) => {
      if (!chrome.runtime || !chrome.runtime.sendMessage || !url) {
        resolve(null);
        return;
      }
      chrome.runtime.sendMessage({ type: 'FETCH_JSON_URL', url }, (response) => {
        if (chrome.runtime.lastError || !response || !response.ok || !response.json) {
          resolve(null);
          return;
        }
        resolve(response.json);
      });
    });
  }

  function resolveFinalUrlViaBackground(url) {
    return new Promise((resolve) => {
      if (!chrome.runtime || !chrome.runtime.sendMessage || !url) {
        resolve('');
        return;
      }
      chrome.runtime.sendMessage({ type: 'RESOLVE_FINAL_URL', url }, (response) => {
        if (chrome.runtime.lastError || !response || !response.ok || !response.url) {
          resolve('');
          return;
        }
        resolve(normalizeHttpUrl(response.url));
      });
    });
  }

  async function getVideoIdByTikDownStyle(sourceUrl) {
    const parsed = parseTikTokTask(sourceUrl || '');
    if (!parsed) {
      return extractVideoId(sourceUrl || '');
    }

    if (parsed.type === 'www.tiktok' && parsed.parsedId) {
      return parsed.parsedId;
    }

    const resolvedUrl = await resolveFinalUrlViaBackground(parsed.videoUrl);
    return extractVideoId(resolvedUrl || parsed.videoUrl);
  }

  function getUrlsFromAddr(addr) {
    if (!addr) return [];
    if (typeof addr === 'string') {
      const one = normalizeHttpUrl(addr);
      return one ? [one] : [];
    }
    if (Array.isArray(addr)) {
      return addr.map((item) => normalizeHttpUrl(item)).filter(Boolean);
    }
    if (typeof addr === 'object') {
      const out = [];
      const url = normalizeHttpUrl(addr.url || '');
      if (url) out.push(url);
      if (Array.isArray(addr.url_list)) {
        addr.url_list.forEach((item) => {
          const one = normalizeHttpUrl(item);
          if (one) out.push(one);
        });
      }
      if (Array.isArray(addr.urlList)) {
        addr.urlList.forEach((item) => {
          const one = normalizeHttpUrl(item);
          if (one) out.push(one);
        });
      }
      return out;
    }
    return [];
  }

  function pickPlayableUrlFromAweme(aweme) {
    if (!aweme || !aweme.video) return '';
    const candidates = [
      ...getUrlsFromAddr(aweme.video.play_addr),
      ...getUrlsFromAddr(aweme.video.download_addr),
      ...getUrlsFromAddr(aweme.video.playAddr),
      ...getUrlsFromAddr(aweme.video.downloadAddr)
    ];

    const unique = Array.from(new Set(candidates));
    if (unique.length === 0) return '';

    const mp4 = unique.find((url) => /\.mp4(\?|$)/i.test(url) || /mime_type=video/i.test(url));
    return mp4 || unique[0];
  }

  async function getTikTokVideoUrlByVideoId(videoId) {
    if (!videoId) return '';
    const apiUrl = `https://api-h2.tiktokv.com/aweme/v1/feed/?version_code=2613&aweme_id=${videoId}&device_type=iPad`;
    const json = await fetchJsonViaBackground(apiUrl);
    const aweme = json && Array.isArray(json.aweme_list) ? json.aweme_list[0] : null;
    return pickPlayableUrlFromAweme(aweme);
  }

  function savePendingTikTokToX(payload) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [TIKTOK_TO_X_STORAGE_KEY]: payload }, () => {
        resolve(!chrome.runtime.lastError);
      });
    });
  }

  function openXComposePage() {
    return new Promise((resolve) => {
      const fallback = () => {
        location.href = 'https://x.com/compose/post';
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

  function findTikTokContextMenu() {
    return document.querySelector('.TUXPopover-content.context-menu.TUXMenu');
  }

  function findCopyLinkMenuItem(menu) {
    if (!menu) return null;
    const nodes = Array.from(menu.querySelectorAll('[role="menuitem"], li, button, div'));
    return nodes.find((node) => {
      const text = String(node.textContent || '').trim().toLowerCase();
      if (!text || text.length > 90) return false;
      return text.includes('copy link') || text.includes('复制链接') || text.includes('複製連結');
    }) || null;
  }

  async function tryReadClipboardTikTokUrl(maxAttempts = 6, gapMs = 160) {
    if (!navigator.clipboard || !navigator.clipboard.readText) return '';
    for (let i = 0; i < maxAttempts; i += 1) {
      try {
        const text = await navigator.clipboard.readText();
        const normalized = sanitizeTikTokSourceUrl(text);
        if (normalized) {
          return normalized;
        }
      } catch (error) {
        // ignore and retry
      }
      await sleep(gapMs);
    }
    return '';
  }

  async function getSourceUrlByCopyLink(menu) {
    const copyItem = findCopyLinkMenuItem(menu);
    if (!copyItem) return '';
    try {
      copyItem.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    } catch (error) {
      try { copyItem.click(); } catch (clickError) {}
    }
    await sleep(120);
    return await tryReadClipboardTikTokUrl();
  }

  async function handleShareToX(buttonEl, options = {}) {
    const button = buttonEl || null;
    if (button) {
      button.disabled = true;
      button.style.opacity = '0.75';
      button.textContent = t('处理中...', 'Processing...');
    }

    try {
      let sourceUrl = getCanonicalSourceUrl();
      if (options && options.preferCopyLink) {
        const copied = await getSourceUrlByCopyLink(options.menu || findTikTokContextMenu());
        if (copied) {
          sourceUrl = copied;
        }
      }

      const description = getDescription();
      let videoId = await getVideoIdByTikDownStyle(sourceUrl);
      if (!videoId) {
        videoId = extractVideoId(location.href);
      }

      if (!videoId) {
        showToast(t('未识别到视频 ID', 'Failed to parse video ID'), true);
        return;
      }

      const mediaUrl = normalizeHttpUrl(await getTikTokVideoUrlByVideoId(videoId));
      if (!mediaUrl) {
        showToast(t('未获取到可上传视频链接', 'No uploadable video URL found'), true);
        return;
      }

      const payload = {
        id: `tiktok-to-x-${Date.now()}`,
        createdAt: Date.now(),
        sourceUrl,
        description: buildComposeText(description, sourceUrl),
        mediaUrls: [mediaUrl],
        mediaSource: 'tikdown_aweme_feed'
      };

      const saved = await savePendingTikTokToX(payload);
      if (!saved) {
        showToast(t('保存分享数据失败', 'Failed to save share payload'), true);
        return;
      }

      await openXComposePage();
      showToast(t('已发送到 X，正在自动上传视频', 'Sent to X, uploading video'));
    } catch (error) {
      showToast(t('处理失败，请重试', 'Processing failed, please retry'), true);
    } finally {
      if (button) {
        button.disabled = false;
        button.style.opacity = '0.96';
        button.textContent = t('分享到 X', 'Share to X');
      }
    }
  }

  function ensureFixedShareButton() {
    const id = 'tweetsnap-tiktok-fixed-share';
    let btn = document.getElementById(id);
    if (btn) return;
    if (!document.body) return;

    btn = document.createElement('button');
    btn.id = id;
    btn.type = 'button';
    btn.textContent = t('分享到 X', 'Share to X');
    btn.style.position = 'fixed';
    btn.style.right = '20px';
    btn.style.bottom = '24px';
    btn.style.zIndex = '2147483647';
    btn.style.border = '0';
    btn.style.borderRadius = '999px';
    btn.style.padding = '10px 14px';
    btn.style.fontSize = '13px';
    btn.style.fontWeight = '600';
    btn.style.background = '#1d9bf0';
    btn.style.color = '#fff';
    btn.style.cursor = 'pointer';
    btn.style.boxShadow = '0 10px 28px rgba(0,0,0,.28)';
    btn.style.opacity = '0.96';
    btn.style.transition = 'opacity .2s ease';
    btn.addEventListener('mouseenter', () => { btn.style.opacity = '1'; });
    btn.addEventListener('mouseleave', () => { btn.style.opacity = '0.96'; });
    btn.addEventListener('click', async (event) => {
      event.preventDefault();
      event.stopPropagation();
      await handleShareToX(btn, { preferCopyLink: true });
    });
    document.body.appendChild(btn);
  }

  function injectShareToXIntoContextMenu() {
    const menu = findTikTokContextMenu();
    if (!menu) return;
    if (menu.querySelector('.tweetsnap-share-x-menu-item')) return;

    const candidates = Array.from(menu.querySelectorAll('[role="menuitem"], li, button, div'))
      .filter((node) => {
        const text = String(node.textContent || '').trim().toLowerCase();
        if (!text || text.length > 80) return false;
        return text.includes('download') || text.includes('copy link') || text.includes('下载') || text.includes('复制');
      });

    const base = candidates[0];
    if (!base || !base.parentElement) return;

    const row = base.cloneNode(true);
    row.classList.add('tweetsnap-share-x-menu-item');

    const leaves = Array.from(row.querySelectorAll('*'))
      .filter((node) => node.childElementCount === 0)
      .filter((node) => String(node.textContent || '').trim().length > 0);

    if (leaves.length > 0) {
      leaves[0].textContent = t('分享到 X', 'Share to X');
    } else {
      row.textContent = t('分享到 X', 'Share to X');
    }

    row.addEventListener('click', async (event) => {
      event.preventDefault();
      event.stopPropagation();
      await handleShareToX(null, { preferCopyLink: true, menu });
    });

    base.insertAdjacentElement('afterend', row);
  }

  function boot() {
    ensureFixedShareButton();
    setInterval(() => {
      ensureFixedShareButton();
      injectShareToXIntoContextMenu();
    }, 1500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
