(function() {
    'use strict';
    const XHS_PUBLISH_URL = 'https://creator.xiaohongshu.com/publish/publish?source=&published=true&from=tab_switch&target=image';
    const INSTAGRAM_CREATE_URL = 'https://www.instagram.com/';
    const XHS_STORAGE_KEY = 'tweetsnap_pending_post';
    const INSTAGRAM_STORAGE_KEY = 'tweetsnap_pending_post_instagram';
    const INS_TO_X_STORAGE_KEY = 'tweetsnap_pending_ins_to_x';
    const INS_TO_X_DONE_KEY = 'tweetsnap_last_applied_ins_to_x';
    const MOBILE_TWEET_WIDTH = 375;
    const REACT_TWEET_API_BASE_URL = 'https://react-tweet.vercel.app/api/tweet/';

    function isZhLanguage() {
        const lang = (document.documentElement.getAttribute('lang') || navigator.language || '').toLowerCase();
        return lang.startsWith('zh');
    }

    function t(zh, en) {
        return isZhLanguage() ? zh : en;
    }

    function addStyle(cssText) {
        const style = document.createElement('style');
        style.textContent = cssText;
        document.head.appendChild(style);
    }

    // Add only necessary button styles
    addStyle(`
        .screenshot-button { 
            display: flex; 
            align-items: center;
            flex-direction: row;
            width: 100%;
            padding: 12px 16px;
            cursor: pointer;
            font-size: 15px;
            transition-property: background-color, box-shadow;
            transition-duration: 0.2s;
            outline-style: none;
            box-sizing: border-box;
            min-height: 0px;
            min-width: 0px;
            border: 0 solid black;
            background-color: rgba(0, 0, 0, 0);
            margin: 0px;
        }
        .screenshot-button:hover { 
            background-color: rgba(15, 20, 25, 0.1); 
        }
        .screenshot-icon { 
            margin-right: 0px; /* Keep margin 0, alignment handled by flex */
            width: 18.75px;
            height: 18.75px; 
            /* font-weight: bold; Removed as it doesn't apply well to SVG stroke */
            vertical-align: text-bottom; /* Align icon better with text */
        }
        .screenshot-notification { 
            position: fixed; 
            top: 20px; 
            left: 50%; 
            transform: translateX(-50%); 
            background-color: #1DA1F2; 
            color: white; 
            padding: 10px 20px; 
            border-radius: 20px; 
            z-index: 9999; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            opacity: 1;
            transition: opacity 0.5s ease-out;
        }
        .screenshot-notification.fade-out {
            opacity: 0;
        }
    `);

    function findTweetMainContent(menuButton) {
        const article = menuButton.closest('article[role="article"]');
        if (!article) return null;
        return article;
    }

    function collectTweetData(tweetContainer) {
        const textNode = tweetContainer.querySelector('[data-testid="tweetText"]');
        const text = textNode ? textNode.innerText.trim() : '';
        const userNameNode = tweetContainer.querySelector('[data-testid="User-Name"]');
        const author = userNameNode ? userNameNode.innerText.split('\n')[0].trim() : '';
        const statusLink = tweetContainer.querySelector('a[href*="/status/"][role="link"]');
        const tweetUrl = statusLink ? new URL(statusLink.getAttribute('href'), location.origin).toString() : location.href;
        return { text, author, tweetUrl };
    }

    function showNotification(message, background = '#1DA1F2', durationMs = 2200) {
        const notification = document.createElement('div');
        notification.className = 'screenshot-notification';
        notification.textContent = message;
        notification.style.backgroundColor = background;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 500);
        }, durationMs);
        return notification;
    }

    function getVideoProgressToast() {
        const id = 'tweetsnap-video-progress';
        let el = document.getElementById(id);
        if (!el) {
            el = document.createElement('div');
            el.id = id;
            el.className = 'screenshot-notification';
            el.style.minWidth = '240px';
            el.style.textAlign = 'center';
            document.body.appendChild(el);
        }
        return el;
    }

    function updateVideoProgressToast(text, background = '#1DA1F2', autoHideMs = 0) {
        const el = getVideoProgressToast();
        el.classList.remove('fade-out');
        el.textContent = text;
        el.style.backgroundColor = background;
        if (autoHideMs > 0) {
            setTimeout(() => {
                const current = document.getElementById('tweetsnap-video-progress');
                if (!current) return;
                current.classList.add('fade-out');
                setTimeout(() => current.remove(), 500);
            }, autoHideMs);
        }
    }

    function sanitizeFilename(text) {
        return (text || 'tweet')
            .replace(/[\\/:*?"<>|]/g, '_')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 40) || 'tweet';
    }

    function setNativeInputValue(input, value) {
        const proto = Object.getPrototypeOf(input);
        const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');
        if (descriptor && descriptor.set) {
            descriptor.set.call(input, value);
        } else {
            input.value = value;
        }
    }

    function setComposerText(node, text) {
        if (!node) return false;
        const value = String(text || '');
        node.focus();

        if ('value' in node) {
            setNativeInputValue(node, value);
            node.dispatchEvent(new Event('input', { bubbles: true }));
            node.dispatchEvent(new Event('change', { bubbles: true }));
            const readback = String(node.value || '');
            return value ? readback.includes(value.slice(0, Math.min(16, value.length))) : true;
        }

        const isEditable = node.getAttribute('contenteditable') === 'true' || node.isContentEditable;
        if (isEditable) {
            try {
                const selection = window.getSelection();
                const range = document.createRange();
                range.selectNodeContents(node);
                selection.removeAllRanges();
                selection.addRange(range);
                document.execCommand('insertText', false, value);
            } catch (error) {
                // Fallback to direct assignment when execCommand is blocked.
                node.textContent = value;
            }

            try {
                node.dispatchEvent(new InputEvent('input', {
                    bubbles: true,
                    inputType: 'insertText',
                    data: value
                }));
            } catch (error) {
                node.dispatchEvent(new Event('input', { bubbles: true }));
            }
            node.dispatchEvent(new Event('change', { bubbles: true }));
            const readback = (node.innerText || node.textContent || '').trim();
            return value ? readback.includes(value.slice(0, Math.min(16, value.length))) : true;
        }

        node.textContent = value;
        node.dispatchEvent(new Event('input', { bubbles: true }));
        node.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
    }

    function fetchRemoteBlobViaBackground(url) {
        return new Promise((resolve) => {
            if (!chrome.runtime || !chrome.runtime.sendMessage) {
                resolve(null);
                return;
            }

            chrome.runtime.sendMessage({ type: 'FETCH_REMOTE_BLOB', url }, (response) => {
                if (chrome.runtime.lastError || !response || !response.ok || !response.dataUrl) {
                    resolve(null);
                    return;
                }
                try {
                    const [header, base64] = String(response.dataUrl).split(',');
                    const mimeMatch = header.match(/data:(.*?);base64/);
                    const mime = mimeMatch ? mimeMatch[1] : (response.mime || 'application/octet-stream');
                    const binary = atob(base64 || '');
                    const bytes = new Uint8Array(binary.length);
                    for (let i = 0; i < binary.length; i += 1) {
                        bytes[i] = binary.charCodeAt(i);
                    }
                    const blob = new Blob([bytes], { type: mime });
                    resolve(blob);
                } catch (error) {
                    resolve(null);
                }
            });
        });
    }

    function getPreferredXComposerRoot() {
        const dialogCandidates = Array.from(document.querySelectorAll('[role="dialog"]'))
            .filter((dialog) => dialog && dialog.offsetParent !== null)
            .filter((dialog) => dialog.querySelector('[data-testid="tweetTextarea_0"], div[role="textbox"][contenteditable="true"], textarea'));
        if (dialogCandidates.length > 0) {
            return dialogCandidates[dialogCandidates.length - 1];
        }

        const pageComposer = document.querySelector('main [data-testid="tweetTextarea_0"], main div[role="textbox"][contenteditable="true"], main textarea[data-testid="tweetTextarea_0"]');
        if (pageComposer) {
            return pageComposer.closest('main') || document;
        }
        return document;
    }

    function getXComposerTextNode(root = document) {
        const selectors = [
            'div[data-testid="tweetTextarea_0"][contenteditable="true"]',
            'div[role="textbox"][data-testid="tweetTextarea_0"]',
            'textarea[data-testid="tweetTextarea_0"]',
            '[data-testid="tweetTextarea_0"] div[role="textbox"][contenteditable="true"]'
        ];
        for (const selector of selectors) {
            const node = root.querySelector(selector);
            if (!node || node.offsetParent === null) continue;
            const inComposer = node.closest('[data-testid="tweetTextarea_0"], [data-testid="toolBar"], [aria-label*="Post" i], [aria-label*="贴文"]');
            if (!inComposer && !node.matches('[data-testid="tweetTextarea_0"]')) continue;
            return node;
        }
        return null;
    }

    function getXComposerFileInput(root = document) {
        const selectors = [
            'input[data-testid="fileInput"]',
            'input[type="file"][accept*="image"]',
            'input[type="file"][accept*="video"]'
        ];
        for (const selector of selectors) {
            const node = root.querySelector(selector);
            if (node && !node.disabled) return node;
        }
        return null;
    }

    function extensionFromMime(mime) {
        if (!mime) return 'bin';
        if (mime.includes('jpeg')) return 'jpg';
        if (mime.includes('png')) return 'png';
        if (mime.includes('gif')) return 'gif';
        if (mime.includes('webp')) return 'webp';
        if (mime.includes('mp4')) return 'mp4';
        if (mime.includes('webm')) return 'webm';
        if (mime.includes('quicktime')) return 'mov';
        return 'bin';
    }

    async function uploadInsMediaToX(fileInput, mediaUrls) {
        if (!fileInput || !Array.isArray(mediaUrls) || mediaUrls.length === 0) {
            return { uploaded: 0, total: 0 };
        }

        const limitedMediaUrls = mediaUrls.slice(0, 4);
        const dt = new DataTransfer();
        let uploaded = 0;
        for (let i = 0; i < limitedMediaUrls.length; i += 1) {
            const mediaUrl = limitedMediaUrls[i];
            let blob = await fetchRemoteBlobViaBackground(mediaUrl);
            if (!blob) {
                await new Promise((resolve) => setTimeout(resolve, 450));
                blob = await fetchRemoteBlobViaBackground(mediaUrl);
            }
            if (!blob) continue;
            const ext = extensionFromMime(blob.type);
            const file = new File([blob], `instagram_media_${i + 1}.${ext}`, {
                type: blob.type || 'application/octet-stream'
            });
            dt.items.add(file);
            uploaded += 1;
        }

        if (uploaded === 0) {
            return { uploaded: 0, total: limitedMediaUrls.length };
        }

        fileInput.files = dt.files;
        fileInput.dispatchEvent(new Event('input', { bubbles: true }));
        fileInput.dispatchEvent(new Event('change', { bubbles: true }));
        return { uploaded, total: limitedMediaUrls.length };
    }

    function markInsToXDone(id) {
        if (!chrome.storage || !chrome.storage.local) return;
        chrome.storage.local.set({ [INS_TO_X_DONE_KEY]: id }, () => {
            chrome.storage.local.remove(INS_TO_X_STORAGE_KEY);
        });
    }

    function startInsToXAutofill() {
        if (!chrome.storage || !chrome.storage.local) return;
        chrome.storage.local.get([INS_TO_X_STORAGE_KEY, INS_TO_X_DONE_KEY], (data) => {
            const payload = data[INS_TO_X_STORAGE_KEY];
            const doneId = data[INS_TO_X_DONE_KEY];
            if (!payload || !payload.id) return;
            if (doneId && doneId === payload.id) return;

            const age = Date.now() - (payload.createdAt || 0);
            if (age > 30 * 60 * 1000) {
                chrome.storage.local.remove(INS_TO_X_STORAGE_KEY);
                return;
            }

            let attempts = 0;
            const maxAttempts = 80;
            let textDone = false;
            let mediaDone = false;
            let finalUploadResult = null;

            const timer = setInterval(async () => {
                attempts += 1;
                const composerRoot = getPreferredXComposerRoot();
                const textNode = getXComposerTextNode(composerRoot);
                const fileInput = getXComposerFileInput(composerRoot);

                if (!textDone && textNode) {
                    textDone = setComposerText(textNode, payload.description || '');
                }

                if (!mediaDone && fileInput) {
                    mediaDone = true;
                    finalUploadResult = await uploadInsMediaToX(fileInput, payload.mediaUrls || []);
                }

                if (textDone && mediaDone) {
                    clearInterval(timer);
                    markInsToXDone(payload.id);
                    const uploaded = finalUploadResult && typeof finalUploadResult.uploaded === 'number'
                        ? finalUploadResult.uploaded
                        : 0;
                    const total = finalUploadResult && typeof finalUploadResult.total === 'number'
                        ? finalUploadResult.total
                        : 0;
                    if (uploaded === total && total > 0) {
                        showNotification(t('已自动填充并上传 Instagram 媒体到 X', 'Instagram content filled and media uploaded to X'), '#17BF63', 2600);
                    } else if (total > 0) {
                        showNotification(t(`已上传 ${uploaded}/${total} 个媒体，请检查后发送`, `${uploaded}/${total} media uploaded, please review`), '#F59E0B', 3000);
                    } else {
                        showNotification(t('未找到可上传媒体，请检查后发送', 'No media uploaded, please review'), '#F59E0B', 3000);
                    }
                    return;
                }

                if (attempts >= maxAttempts) {
                    clearInterval(timer);
                    showNotification(t('自动导入 Instagram 内容超时，请手动检查', 'Instagram import timed out, please check manually'), '#E0245E', 3000);
                }
            }, 500);
        });
    }

    function extractTweetId(tweetUrl) {
        if (!tweetUrl) return null;
        try {
            const parsed = new URL(tweetUrl, location.origin);
            const match = parsed.pathname.match(/\/status\/(\d+)/);
            return match ? match[1] : null;
        } catch (error) {
            const match = String(tweetUrl).match(/\/status\/(\d+)/);
            return match ? match[1] : null;
        }
    }

    function pickBestMp4FromVariants(variants) {
        if (!Array.isArray(variants) || variants.length === 0) {
            return null;
        }

        const mp4s = variants
            .filter((item) => item && (item.content_type === 'video/mp4' || item.type === 'video/mp4'))
            .map((item) => ({
                url: item.url || item.src,
                bitrate: typeof item.bitrate === 'number' ? item.bitrate : 0
            }))
            .filter((item) => !!item.url);

        if (mp4s.length === 0) return null;
        mp4s.sort((a, b) => b.bitrate - a.bitrate);
        return mp4s[0].url;
    }

    async function fetchVideoUrlFromReactTweetApi(tweetId) {
        if (!tweetId) return null;
        const apiUrl = `${REACT_TWEET_API_BASE_URL}${tweetId}`;

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) return null;
            const json = await response.json();
            const data = json && json.data;
            if (!data) return null;

            // Priority: mediaDetails.video_info.variants -> video.variants
            if (Array.isArray(data.mediaDetails)) {
                for (const media of data.mediaDetails) {
                    const best = pickBestMp4FromVariants(media && media.video_info && media.video_info.variants);
                    if (best) return best;
                }
            }

            const bestFromVideo = pickBestMp4FromVariants(data.video && data.video.variants);
            if (bestFromVideo) return bestFromVideo;
            return null;
        } catch (error) {
            return null;
        }
    }

    function findVideoSourceInTweet(tweetContainer) {
        const videoEl = tweetContainer.querySelector('video');
        if (!videoEl) {
            return null;
        }

        const candidates = [];
        if (videoEl.currentSrc) candidates.push(videoEl.currentSrc);
        if (videoEl.src) candidates.push(videoEl.src);
        videoEl.querySelectorAll('source').forEach((source) => {
            if (source.src) candidates.push(source.src);
        });

        const unique = Array.from(new Set(candidates.filter(Boolean)));
        if (unique.length === 0) {
            return null;
        }

        const direct = unique.find((url) => /\.(mp4|webm)(\?|$)/i.test(url) || url.startsWith('blob:'));
        return direct || unique[0];
    }

    function downloadBlob(blob, filename) {
        const link = document.createElement('a');
        const objectUrl = URL.createObjectURL(blob);
        link.href = objectUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 3000);
    }

    function triggerBrowserDownload(url, filename) {
        return new Promise((resolve) => {
            if (!chrome.runtime || !chrome.runtime.sendMessage) {
                resolve({ ok: false, error: 'runtime unavailable' });
                return;
            }

            chrome.runtime.sendMessage(
                {
                    type: 'DOWNLOAD_VIDEO_URL',
                    url,
                    filename
                },
                (response) => {
                    if (chrome.runtime.lastError) {
                        resolve({ ok: false, error: chrome.runtime.lastError.message });
                        return;
                    }
                    resolve(response || { ok: false, error: 'empty response' });
                }
            );
        });
    }

    async function downloadVideoFromTweet(menuButton) {
        const tweetContainer = findTweetMainContent(menuButton);
        if (!tweetContainer) {
            showNotification(t('未找到推文容器', 'Tweet container not found'), '#E0245E');
            return;
        }

        const tweetData = collectTweetData(tweetContainer);
        const tweetId = extractTweetId(tweetData && tweetData.tweetUrl ? tweetData.tweetUrl : location.href);
        const apiVideoUrl = await fetchVideoUrlFromReactTweetApi(tweetId);
        const { author } = tweetData || {};
        const filename = `${sanitizeFilename(author)}_${Date.now()}.mp4`;

        const sourceUrl = apiVideoUrl || findVideoSourceInTweet(tweetContainer);
        if (!sourceUrl) {
            showNotification(t('未找到可下载的视频直链', 'No downloadable video URL found'), '#E0245E', 2600);
            return;
        }

        showNotification(t('正在下载视频...', 'Starting video download...'));

        try {
            if (/\.m3u8(\?|$)/i.test(sourceUrl)) {
                showNotification(t('检测到流媒体地址，暂不支持直接下载该格式', 'Detected m3u8 stream, direct download is not supported'), '#F59E0B', 2800);
                return;
            }

            const dlResult = await triggerBrowserDownload(sourceUrl, filename);
            if (dlResult && dlResult.ok) {
                showNotification(t('视频下载已开始', 'Video download started'), '#17BF63');
                return;
            }

            const response = await fetch(sourceUrl);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const blob = await response.blob();
            downloadBlob(blob, filename);
            showNotification(t('视频下载已开始', 'Video download started'), '#17BF63');
        } catch (error) {
            console.error('Video download failed:', error);
            showNotification(t('视频下载失败，可能受跨域或源格式限制', 'Video download failed (CORS or source format limitation)'), '#E0245E', 2800);
        }
    }

    function setupVideoDownloadProgressListener() {
        if (!chrome.runtime || !chrome.runtime.onMessage) {
            return;
        }

        chrome.runtime.onMessage.addListener((message) => {
            if (!message || message.type !== 'VIDEO_DOWNLOAD_PROGRESS') {
                return;
            }

            if (message.state === 'complete') {
                updateVideoProgressToast(t('视频下载完成', 'Video download complete'), '#17BF63', 1800);
                return;
            }

            if (message.state === 'interrupted') {
                const reason = message.error ? (isZhLanguage() ? `（${message.error}）` : ` (${message.error})`) : '';
                updateVideoProgressToast(`${t('视频下载失败', 'Video download failed')}${reason}`, '#E0245E', 2600);
                return;
            }

            const received = typeof message.bytesReceived === 'number' ? message.bytesReceived : 0;
            const total = typeof message.totalBytes === 'number' ? message.totalBytes : 0;
            if (total > 0) {
                const percent = Math.max(0, Math.min(100, Math.floor((received / total) * 100)));
                updateVideoProgressToast(`${t('视频下载中', 'Downloading video')} ${percent}%`, '#1DA1F2');
                return;
            }

            if (received > 0) {
                const mb = (received / (1024 * 1024)).toFixed(1);
                updateVideoProgressToast(`${t('视频下载中', 'Downloading video')} ${mb}MB`, '#1DA1F2');
                return;
            }

            updateVideoProgressToast(`${t('视频下载中', 'Downloading video')}...`, '#1DA1F2');
        });
    }

    function blobToDataURL(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    function loadImageFromDataUrl(dataUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = dataUrl;
        });
    }

    async function normalizeInstagramImageTopAnchored(dataUrl) {
        // Instagram feed max portrait is 4:5. If image is taller than that,
        // crop from the top instead of center to keep the "start" of content.
        const MIN_RATIO = 4 / 5;
        try {
            const img = await loadImageFromDataUrl(dataUrl);
            const width = img.naturalWidth || img.width;
            const height = img.naturalHeight || img.height;
            if (!width || !height) return { dataUrl, wasTopCropped: false };

            const ratio = width / height;
            if (ratio >= MIN_RATIO) {
                return { dataUrl, wasTopCropped: false };
            }

            const targetHeight = Math.floor(width / MIN_RATIO);
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = targetHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) return { dataUrl, wasTopCropped: false };

            // Top-aligned draw: keep top area, cut from the bottom.
            ctx.drawImage(img, 0, 0, width, targetHeight, 0, 0, width, targetHeight);
            return {
                dataUrl: canvas.toDataURL('image/png'),
                wasTopCropped: true
            };
        } catch (error) {
            return { dataUrl, wasTopCropped: false };
        }
    }

    async function fetchImageAsDataUrl(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                return null;
            }
            const blob = await response.blob();
            return await blobToDataURL(blob);
        } catch (error) {
            return null;
        }
    }

    function normalizeTweetImageUrl(url) {
        if (!url) return null;
        try {
            const parsed = new URL(url, location.origin);
            if (parsed.searchParams.has('name')) {
                parsed.searchParams.set('name', 'large');
            }
            return parsed.toString();
        } catch (error) {
            return url;
        }
    }

    async function collectTweetImageDataUrls(tweetContainer) {
        const imageNodes = Array.from(tweetContainer.querySelectorAll('div[data-testid="tweetPhoto"] img'));
        const rawUrls = imageNodes
            .map((img) => img.currentSrc || img.src)
            .filter(Boolean)
            .map(normalizeTweetImageUrl);

        const uniqueUrls = Array.from(new Set(rawUrls)).slice(0, 8);
        const results = [];
        for (const imageUrl of uniqueUrls) {
            const dataUrl = await fetchImageAsDataUrl(imageUrl);
            if (dataUrl) {
                results.push(dataUrl);
            }
        }
        return results;
    }

    function openXhsPublishPage() {
        return new Promise((resolve) => {
            let resolved = false;
            const done = (ok) => {
                if (!resolved) {
                    resolved = true;
                    resolve(ok);
                }
            };

            // Hard fallback: always navigate if extension messaging path fails.
            const fallbackTimer = setTimeout(() => {
                window.location.href = XHS_PUBLISH_URL;
                done(true);
            }, 900);

            if (!chrome.runtime || !chrome.runtime.sendMessage) {
                clearTimeout(fallbackTimer);
                window.location.href = XHS_PUBLISH_URL;
                done(true);
                return;
            }

            chrome.runtime.sendMessage({ type: 'OPEN_XHS_PUBLISH' }, (response) => {
                clearTimeout(fallbackTimer);
                if (chrome.runtime.lastError || !response || !response.ok) {
                    window.location.href = XHS_PUBLISH_URL;
                    done(true);
                    return;
                }
                done(true);
            });
        });
    }

    async function savePendingPost(blob, tweetContainer, storageKey, options = {}) {
        if (!chrome.storage || !chrome.storage.local) {
            return false;
        }

        const forInstagram = !!options.forInstagram;
        const tweetData = collectTweetData(tweetContainer);
        const screenshotDataUrlRaw = await blobToDataURL(blob);
        const screenshotProcessed = forInstagram
            ? await normalizeInstagramImageTopAnchored(screenshotDataUrlRaw)
            : { dataUrl: screenshotDataUrlRaw, wasTopCropped: false };
        const screenshotDataUrl = screenshotProcessed.dataUrl;

        const tweetImageDataUrlsRaw = await collectTweetImageDataUrls(tweetContainer);
        const tweetImageProcessed = forInstagram
            ? await Promise.all(tweetImageDataUrlsRaw.map((item) => normalizeInstagramImageTopAnchored(item)))
            : tweetImageDataUrlsRaw.map((item) => ({ dataUrl: item, wasTopCropped: false }));
        const tweetImageDataUrls = tweetImageProcessed.map((item) => item.dataUrl);
        const instagramNeedsOriginalClick = forInstagram && (
            screenshotProcessed.wasTopCropped || tweetImageProcessed.some((item) => item.wasTopCropped)
        );

        const imageDataUrls = [screenshotDataUrl, ...tweetImageDataUrls];
        const payload = {
            id: `tweetsnap-${Date.now()}`,
            createdAt: Date.now(),
            filename: `twitter-post-${Date.now()}.png`,
            imageDataUrl: screenshotDataUrl,
            imageDataUrls,
            tweetText: tweetData.text,
            tweetUrl: tweetData.tweetUrl,
            author: tweetData.author,
            instagramNeedsOriginalClick
        };

        return new Promise((resolve) => {
            chrome.storage.local.set({ [storageKey]: payload }, () => {
                resolve(!chrome.runtime.lastError);
            });
        });
    }

    function openInstagramCreatePage() {
        return new Promise((resolve) => {
            let resolved = false;
            const done = (ok) => {
                if (!resolved) {
                    resolved = true;
                    resolve(ok);
                }
            };

            const fallbackTimer = setTimeout(() => {
                window.location.href = INSTAGRAM_CREATE_URL;
                done(true);
            }, 900);

            if (!chrome.runtime || !chrome.runtime.sendMessage) {
                clearTimeout(fallbackTimer);
                window.location.href = INSTAGRAM_CREATE_URL;
                done(true);
                return;
            }

            chrome.runtime.sendMessage({ type: 'OPEN_INSTAGRAM_CREATE' }, (response) => {
                clearTimeout(fallbackTimer);
                if (chrome.runtime.lastError || !response || !response.ok) {
                    window.location.href = INSTAGRAM_CREATE_URL;
                    done(true);
                    return;
                }
                done(true);
            });
        });
    }

    function getVideoSnapshotDataUrl(videoEl) {
        try {
            const width = videoEl.videoWidth || videoEl.clientWidth || 0;
            const height = videoEl.videoHeight || videoEl.clientHeight || 0;
            if (!width || !height) {
                return null;
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return null;
            }
            ctx.drawImage(videoEl, 0, 0, width, height);
            return canvas.toDataURL('image/png');
        } catch (error) {
            return null;
        }
    }

    function replaceVideosForScreenshot(originalRoot, cloneRoot) {
        const originalVideos = Array.from(originalRoot.querySelectorAll('video'));
        const cloneVideos = Array.from(cloneRoot.querySelectorAll('video'));

        for (let i = 0; i < cloneVideos.length; i += 1) {
            const originalVideo = originalVideos[i];
            const cloneVideo = cloneVideos[i];
            if (!cloneVideo) {
                continue;
            }

            const computed = originalVideo ? window.getComputedStyle(originalVideo) : null;
            const width = cloneVideo.clientWidth || (originalVideo && originalVideo.clientWidth) || 320;
            const height = cloneVideo.clientHeight || (originalVideo && originalVideo.clientHeight) || 180;

            const img = document.createElement('img');
            img.alt = 'video frame';
            img.width = width;
            img.height = height;
            img.style.width = `${width}px`;
            img.style.height = `${height}px`;
            img.style.display = computed ? computed.display : 'block';
            img.style.objectFit = computed ? computed.objectFit : 'cover';
            img.style.borderRadius = computed ? computed.borderRadius : '0';
            img.style.background = '#000';

            let src = null;
            if (originalVideo) {
                src = getVideoSnapshotDataUrl(originalVideo);
                if (!src) {
                    src = originalVideo.getAttribute('poster');
                }
            }

            if (src) {
                img.src = src;
                cloneVideo.replaceWith(img);
            } else {
                const placeholder = document.createElement('div');
                placeholder.style.width = `${width}px`;
                placeholder.style.height = `${height}px`;
                placeholder.style.background = '#000';
                placeholder.style.borderRadius = computed ? computed.borderRadius : '0';
                cloneVideo.replaceWith(placeholder);
            }
        }
    }

    function createScreenshotClone(targetNode, options = {}) {
        const forceMobileWidth = !!options.forceMobileWidth;
        const mobileWidth = options.mobileWidth || MOBILE_TWEET_WIDTH;
        const clone = targetNode.cloneNode(true);
        const mount = document.createElement('div');
        mount.style.position = 'fixed';
        mount.style.left = '-10000px';
        mount.style.top = '0';
        mount.style.pointerEvents = 'none';
        mount.style.zIndex = '-1';
        mount.style.background = 'transparent';
        if (forceMobileWidth) {
            mount.style.width = `${mobileWidth}px`;
        }
        mount.appendChild(clone);
        document.body.appendChild(mount);

        if (forceMobileWidth) {
            clone.style.width = `${mobileWidth}px`;
            clone.style.maxWidth = `${mobileWidth}px`;
            clone.style.minWidth = '0';
            clone.style.boxSizing = 'border-box';
        }

        replaceVideosForScreenshot(targetNode, clone);
        return { mount, clone };
    }

    function takeScreenshot(menuButton, destination = 'xhs') {
        const notification = document.createElement('div');
        notification.className = 'screenshot-notification';
        notification.innerHTML = t('正在截图...', 'Taking screenshot...');
        document.body.appendChild(notification);

        try {
            const tweetContainer = findTweetMainContent(menuButton);
            if (!tweetContainer) {
                throw new Error('Could not find tweet content');
            }

            const scale = window.devicePixelRatio * 2;

            let bgColor = 'rgb(255, 255, 255)';
            try {
                const bodyStyle = window.getComputedStyle(document.body);
                bgColor = bodyStyle.backgroundColor || bgColor;
                if (!bgColor || bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent') {
                    const mainContent = document.querySelector('main') || document.querySelector('#react-root');
                    if (mainContent) {
                        bgColor = window.getComputedStyle(mainContent).backgroundColor || 'rgb(255, 255, 255)';
                    }
                }
                if (bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent') {
                    bgColor = 'rgb(255, 255, 255)';
                }
            } catch (bgError) {
                console.warn('Could not detect background color, defaulting to white.', bgError);
                bgColor = 'rgb(255, 255, 255)';
            }

            const { mount, clone } = createScreenshotClone(tweetContainer, {
                forceMobileWidth: true,
                mobileWidth: MOBILE_TWEET_WIDTH
            });
            const cloneRect = clone.getBoundingClientRect();
            const renderWidth = Math.max(1, Math.round(cloneRect.width));
            const renderHeight = Math.max(1, Math.round(cloneRect.height));

            const config = {
                height: renderHeight * scale,
                width: renderWidth * scale,
                style: {
                    transform: `scale(${scale})`,
                    transformOrigin: 'top left',
                    width: `${renderWidth}px`,
                    height: `${renderHeight}px`,
                    margin: 0,
                    border: 'none',
                    borderRadius: 0
                },
                quality: 1.0,
                bgcolor: bgColor
            };
            domtoimage.toBlob(clone, config)
                .then(async function(blob) {
                    if (mount && mount.parentNode) {
                        mount.remove();
                    }
                    try {
                        if (navigator.clipboard && window.ClipboardItem) {
                            await navigator.clipboard.write([
                                new ClipboardItem({
                                    'image/png': blob
                                })
                            ]);
                        }
                    } catch (clipboardError) {
                        console.warn('Clipboard copy failed:', clipboardError);
                    }

                    if (destination === 'download') {
                        const tweetData = collectTweetData(tweetContainer);
                        const filename = `${sanitizeFilename(tweetData && tweetData.author ? tweetData.author : 'tweet')}_${Date.now()}.png`;
                        downloadBlob(blob, filename);
                        notification.innerHTML = `<div>${t('截图已保存到本地', 'Screenshot saved to local')}</div>`;
                        notification.style.backgroundColor = '#17BF63';
                        setTimeout(() => {
                            notification.classList.add('fade-out');
                            setTimeout(() => notification.remove(), 500);
                        }, 1800);
                        return;
                    }

                    const isInstagram = destination === 'instagram';
                    const storageKey = isInstagram ? INSTAGRAM_STORAGE_KEY : XHS_STORAGE_KEY;
                    const saved = await savePendingPost(blob, tweetContainer, storageKey, { forInstagram: isInstagram });
                    if (isInstagram) {
                        await openInstagramCreatePage();
                    } else {
                        await openXhsPublishPage();
                    }

                    if (saved && isInstagram) {
                        notification.innerHTML = `<div>${t('截图成功，正在跳转 Instagram 并自动填充贴文...', 'Screenshot captured. Redirecting to Instagram and preparing post...')}</div>`;
                        notification.style.backgroundColor = '#17BF63';
                    } else if (saved) {
                        notification.innerHTML = `<div>${t('截图成功，正在跳转小红书并自动填充...', 'Screenshot captured. Redirecting to Xiaohongshu and autofilling...')}</div>`;
                        notification.style.backgroundColor = '#17BF63';
                    } else {
                        notification.innerHTML = `<div>${isInstagram
                            ? t('已跳转 Instagram，但自动填充数据保存失败，请手动上传。', 'Redirected to Instagram, but autofill data failed to save. Please upload manually.')
                            : t('已跳转小红书，但自动填充数据保存失败，请手动上传。', 'Redirected to Xiaohongshu, but autofill data failed to save. Please upload manually.')
                        }</div>`;
                        notification.style.backgroundColor = '#F59E0B';
                    }
                    setTimeout(() => {
                        notification.classList.add('fade-out');
                        setTimeout(() => notification.remove(), 500);
                    }, 1800);
                })
                .catch(function(error) {
                    if (mount && mount.parentNode) {
                        mount.remove();
                    }
                    console.error('Screenshot failed:', error);
                    notification.textContent = t('截图失败', 'Screenshot failed');
                    notification.style.backgroundColor = '#E0245E';
                    setTimeout(() => notification.remove(), 2000);
                });
        } catch (error) {
            console.error('Error during screenshot:', error);
            notification.textContent = t('截图失败', 'Screenshot failed');
            notification.style.backgroundColor = '#E0245E';
            setTimeout(() => notification.remove(), 2000);
        }
    }
    function createScreenshotIcon() {
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("xmlns", svgNS);
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute("width", "18.75");
        svg.setAttribute("height", "18.75");
        svg.setAttribute("fill", "none"); // Use fill=none for line icons
        svg.setAttribute("stroke", "currentColor"); // Inherit color via stroke
        svg.setAttribute("stroke-width", "2");
        svg.setAttribute("stroke-linecap", "round");
        svg.setAttribute("stroke-linejoin", "round");
        svg.classList.add("screenshot-icon");

        // Feather Icons: camera
        const path = document.createElementNS(svgNS, "path");
        path.setAttribute("d", "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z");
        const circle = document.createElementNS(svgNS, "circle");
        circle.setAttribute("cx", "12");
        circle.setAttribute("cy", "13");
        circle.setAttribute("r", "4");

        svg.appendChild(path);
        svg.appendChild(circle);
        return svg;
    }

    function createThreadIcon() {
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("xmlns", svgNS);
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute("width", "18.75");
        svg.setAttribute("height", "18.75");
        svg.setAttribute("fill", "none");
        svg.setAttribute("stroke", "currentColor");
        svg.setAttribute("stroke-width", "2");
        svg.setAttribute("stroke-linecap", "round");
        svg.setAttribute("stroke-linejoin", "round");
        svg.classList.add("screenshot-icon"); // Reuse same class for basic styling

        // Simple thread icon (line connecting dots)
        const path1 = document.createElementNS(svgNS, "path");
        path1.setAttribute("d", "M6 3v12");
        const circle1 = document.createElementNS(svgNS, "circle");
        circle1.setAttribute("cx", "6");
        circle1.setAttribute("cy", "3");
        circle1.setAttribute("r", "1");
        const circle2 = document.createElementNS(svgNS, "circle");
        circle2.setAttribute("cx", "6");
        circle2.setAttribute("cy", "9");
        circle2.setAttribute("r", "1");
         const circle3 = document.createElementNS(svgNS, "circle");
        circle3.setAttribute("cx", "6");
        circle3.setAttribute("cy", "15");
        circle3.setAttribute("r", "1");
        // Add a parallel element to suggest thread
        const path2 = document.createElementNS(svgNS, "path");
        path2.setAttribute("d", "M18 9v12");
        const circle4 = document.createElementNS(svgNS, "circle");
        circle4.setAttribute("cx", "18");
        circle4.setAttribute("cy", "9");
        circle4.setAttribute("r", "1");
        const circle5 = document.createElementNS(svgNS, "circle");
        circle5.setAttribute("cx", "18");
        circle5.setAttribute("cy", "15");
        circle5.setAttribute("r", "1");
         const circle6 = document.createElementNS(svgNS, "circle");
        circle6.setAttribute("cx", "18");
        circle6.setAttribute("cy", "21");
        circle6.setAttribute("r", "1");


        svg.appendChild(path1);
        svg.appendChild(circle1);
        svg.appendChild(circle2);
        svg.appendChild(circle3);
        svg.appendChild(path2);
        svg.appendChild(circle4);
        svg.appendChild(circle5);
        svg.appendChild(circle6);


        return svg;
    }

    function createDownloadIcon() {
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("xmlns", svgNS);
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute("width", "18.75");
        svg.setAttribute("height", "18.75");
        svg.setAttribute("fill", "none");
        svg.setAttribute("stroke", "currentColor");
        svg.setAttribute("stroke-width", "2");
        svg.setAttribute("stroke-linecap", "round");
        svg.setAttribute("stroke-linejoin", "round");
        svg.classList.add("screenshot-icon");

        const path = document.createElementNS(svgNS, "path");
        path.setAttribute("d", "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4");
        const polyline = document.createElementNS(svgNS, "polyline");
        polyline.setAttribute("points", "7 10 12 15 17 10");
        const line = document.createElementNS(svgNS, "line");
        line.setAttribute("x1", "12");
        line.setAttribute("y1", "15");
        line.setAttribute("x2", "12");
        line.setAttribute("y2", "3");

        svg.appendChild(path);
        svg.appendChild(polyline);
        svg.appendChild(line);
        return svg;
    }

    function createInstagramIcon() {
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("xmlns", svgNS);
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute("width", "18.75");
        svg.setAttribute("height", "18.75");
        svg.setAttribute("fill", "none");
        svg.setAttribute("stroke", "currentColor");
        svg.setAttribute("stroke-width", "2");
        svg.setAttribute("stroke-linecap", "round");
        svg.setAttribute("stroke-linejoin", "round");
        svg.classList.add("screenshot-icon");

        const rect = document.createElementNS(svgNS, "rect");
        rect.setAttribute("x", "3");
        rect.setAttribute("y", "3");
        rect.setAttribute("width", "18");
        rect.setAttribute("height", "18");
        rect.setAttribute("rx", "5");
        rect.setAttribute("ry", "5");

        const circle = document.createElementNS(svgNS, "circle");
        circle.setAttribute("cx", "12");
        circle.setAttribute("cy", "12");
        circle.setAttribute("r", "4");

        const dot = document.createElementNS(svgNS, "circle");
        dot.setAttribute("cx", "17");
        dot.setAttribute("cy", "7");
        dot.setAttribute("r", "1");

        svg.appendChild(rect);
        svg.appendChild(circle);
        svg.appendChild(dot);
        return svg;
    }

    async function captureThread(menuButton) {
        const notification = document.createElement('div');
        notification.className = 'screenshot-notification';
        notification.innerHTML = 'Capturing thread... Finding author and posts...';
        document.body.appendChild(notification);

        try {
            // 1. Find original tweet and author
            const originalArticle = findTweetMainContent(menuButton);
            if (!originalArticle) {
                throw new Error('Could not find the starting tweet.');
            }

            // Find author's handle (needs a robust selector, this is an example)
            // Twitter structure changes, this might need adjustment.
            const userElement = originalArticle.querySelector('[data-testid="User-Name"]'); // Try Test ID first
            let authorHandle = null;
            if (userElement) {
                 // Find the span containing the handle like '@handle'
                 const spans = userElement.querySelectorAll('span');
                 for (const span of spans) {
                     if (span.textContent.startsWith('@')) {
                         authorHandle = span.textContent;
                         break;
                     }
                 }
            }

            // Fallback if data-testid not found or handle not in spans
            if (!authorHandle) {
                const authorLink = originalArticle.querySelector('a[href*="/status/"][dir="ltr"]');
                 if (authorLink) {
                    const linkParts = authorLink.href.split('/');
                    // Usually the handle is the 3rd part like ['https:', '', 'twitter.com', 'handle', 'status', 'id']
                    if (linkParts.length > 3) {
                         authorHandle = '@' + linkParts[3];
                     }
                }
            }


            if (!authorHandle) {
                throw new Error('Could not reliably determine the author\'s handle.');
            }
            notification.innerHTML = `Capturing thread by ${authorHandle}... Expanding replies...`;
            console.log(`Author Handle: ${authorHandle}`);

            // 2. Find and click "Show more replies" repeatedly
            const conversationContainer = originalArticle.closest('div[data-testid="conversation"]'); // Find the container holding the thread
            let showMoreButton;
            const maxClicks = 15; // Limit clicks to prevent infinite loops
            let clicks = 0;
            const showMoreSelector = 'span.css-1jxf684.r-bcqeeo.r-1ttztb7.r-qvutc0.r-poiln3'; // User provided selector

            while (clicks < maxClicks) {
                 // Find the button within the conversation context if possible
                 showMoreButton = conversationContainer
                     ? conversationContainer.querySelector(showMoreSelector)
                     : document.querySelector(showMoreSelector); // Fallback to document search

                // Check if the button text actually indicates more replies
                if (showMoreButton && showMoreButton.textContent.includes('Show') && showMoreButton.closest('div[role="button"]')) { // Check text and if it's clickable
                    console.log(`Clicking "Show more" (${clicks + 1}/${maxClicks})`);
                     notification.innerHTML = `Capturing thread by ${authorHandle}... Expanding replies (${clicks + 1})...`;
                    showMoreButton.closest('div[role="button"]').click(); // Click the clickable parent
                    clicks++;
                    // Wait for content to load - adjust delay as needed
                    await new Promise(resolve => setTimeout(resolve, 1500)); // Wait 1.5 seconds
                } else {
                     console.log("No more 'Show more' buttons found or button text doesn't match.");
                    break; // Exit loop if no more buttons or limit reached
                }
            }
            if (clicks === maxClicks) {
                console.warn("Reached maximum 'Show more' clicks limit.");
            }

            notification.innerHTML = `Capturing thread by ${authorHandle}... Finding all posts...`;

            // 3. Filter replies by original author
            // Select all articles *after* the initial expansion
             const allArticles = Array.from(document.querySelectorAll('article[role="article"]'));
            const authorTweets = allArticles.filter(article => {
                // Re-check author handle for each potential tweet in the thread
                const userElement = article.querySelector('[data-testid="User-Name"]');
                let currentHandle = null;
                if (userElement) {
                     const spans = userElement.querySelectorAll('span');
                     for (const span of spans) {
                         if (span.textContent.startsWith('@')) {
                             currentHandle = span.textContent;
                             break;
                         }
                     }
                }
                 // Fallback check
                 if (!currentHandle) {
                     const authorLink = article.querySelector('a[href*="/status/"][dir="ltr"]');
                     if (authorLink) {
                        const linkParts = authorLink.href.split('/');
                        if (linkParts.length > 3) {
                            currentHandle = '@' + linkParts[3];
                        }
                     }
                 }
                return currentHandle === authorHandle;
            });


            if (authorTweets.length === 0) {
                 // If filtering removed everything, at least include the original tweet
                 authorTweets.push(originalArticle);
            }
            // Ensure tweets are in order (usually they are by DOM order, but sort just in case)
            // This relies on DOM order being correct. A more robust way might involve timestamps if available.
            authorTweets.sort((a, b) => a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);


            console.log(`Found ${authorTweets.length} tweets by ${authorHandle}`);
            notification.innerHTML = `Taking ${authorTweets.length} screenshots... (0%)`;

            // 4. Screenshot each tweet individually
            const blobs = [];
            const scale = window.devicePixelRatio * 1.5; // Slightly lower scale for potentially long images

            for (let i = 0; i < authorTweets.length; i++) {
                const tweet = authorTweets[i];
                 const percentage = Math.round(((i + 1) / authorTweets.length) * 100);
                 notification.innerHTML = `Taking ${authorTweets.length} screenshots... (${percentage}%)`;

                 // Ensure tweet is visible for screenshot (scrollIntoView might be needed sometimes)
                 // tweet.scrollIntoView({ block: 'nearest' });
                 // await new Promise(resolve => setTimeout(resolve, 100)); // Small delay after scroll

                try {
                    // ---> New: Check for and click internal "Show more" button within the tweet text
                    const internalShowMoreButton = tweet.querySelector('button[data-testid="tweet-text-show-more-link"]');
                    if (internalShowMoreButton) {
                        console.log(`Clicking internal "Show more" for tweet ${i + 1}`);
                        internalShowMoreButton.click();
                        // Wait a short moment for the text to expand
                        await new Promise(resolve => setTimeout(resolve, 500)); // 0.5 second delay
                    }
                    // <--- End new section

                     // --- Start Background Color Detection (for thread) ---
                     let threadBgColor = 'rgb(255, 255, 255)'; // Default to white
                     try {
                         const bodyStyle = window.getComputedStyle(document.body);
                         threadBgColor = bodyStyle.backgroundColor || threadBgColor;
                         if (!threadBgColor || threadBgColor === 'rgba(0, 0, 0, 0)' || threadBgColor === 'transparent') {
                             const mainContent = document.querySelector('main') || document.querySelector('#react-root');
                             if (mainContent) {
                                 threadBgColor = window.getComputedStyle(mainContent).backgroundColor || 'rgb(255, 255, 255)';
                             }
                         }
                         if (threadBgColor === 'rgba(0, 0, 0, 0)' || threadBgColor === 'transparent') {
                            threadBgColor = 'rgb(255, 255, 255)';
                         }
                     } catch (bgError) {
                         console.warn("Could not detect background color for thread tweet, defaulting to white.", bgError);
                         threadBgColor = 'rgb(255, 255, 255)';
                     }
                    // --- End Background Color Detection ---

                     const config = {
                         height: tweet.offsetHeight * scale,
                         width: tweet.offsetWidth * scale,
                         style: {
                             transform: `scale(${scale})`,
                             transformOrigin: 'top left',
                             width: `${tweet.offsetWidth}px`,
                             height: `${tweet.offsetHeight}px`,
                             margin: 0, // Ensure no extra margin affects layout
                             border: 'none', // Remove borders for stitching
                             borderRadius: 0 // Remove border radius for stitching
                         },
                         quality: 0.95 // Slightly lower quality for performance/size
                     };
                    // --- Add bgcolor to config (for thread) ---
                    config.bgcolor = threadBgColor;
                    // --- End add bgcolor ---

                    const { mount, clone } = createScreenshotClone(tweet);
                    let blob = null;
                    try {
                        blob = await domtoimage.toBlob(clone, config);
                    } finally {
                        if (mount && mount.parentNode) {
                            mount.remove();
                        }
                    }
                    blobs.push(blob);
                } catch (screenshotError) {
                    console.error(`Failed to screenshot tweet ${i + 1}:`, screenshotError);
                     // Optionally skip this tweet or stop the process
                     notification.innerHTML = `Error screenshotting tweet ${i + 1}. Skipping.`;
                     await new Promise(resolve => setTimeout(resolve, 1500));
                }
            }

            if (blobs.length === 0) {
                throw new Error("No screenshots were successfully taken.");
            }

            notification.innerHTML = `Combining ${blobs.length} screenshots...`;

            // 5. Combine images using Canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            let totalHeight = 0;
            let maxWidth = 0;
            const images = [];

            // Convert blobs to Image objects to get dimensions
            for (const blob of blobs) {
                const img = new Image();
                 const url = URL.createObjectURL(blob);
                img.src = url;
                await new Promise(resolve => { img.onload = resolve; }); // Wait for image data to load
                images.push(img);
                totalHeight += img.height;
                maxWidth = Math.max(maxWidth, img.width);
                // URL.revokeObjectURL(url); // Revoke later after drawing
            }

            // Set canvas dimensions
            canvas.width = maxWidth;
            canvas.height = totalHeight;

            // Draw images onto canvas
            let currentY = 0;
            for (const img of images) {
                ctx.drawImage(img, 0, currentY);
                currentY += img.height;
                 URL.revokeObjectURL(img.src); // Revoke URL now
            }

            // 6. Get final blob from canvas
            canvas.toBlob(function(finalBlob) {
                // 7. Handle final blob (copy/download/notification)
                navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': finalBlob })
                ]).then(() => {
                    notification.innerHTML = `
                        <div>Thread screenshot copied! (${images.length} posts)</div>
                        <button class="download-btn" style="background: white; color: #1DA1F2; border: none; padding: 5px 10px; border-radius: 15px; margin-top: 5px; cursor: pointer;">Download</button>
                    `;
                    notification.style.backgroundColor = '#17BF63';

                    const downloadBtn = notification.querySelector('.download-btn');
                    downloadBtn.addEventListener('click', () => {
                        const link = document.createElement('a');
                        link.download = `twitter-thread-${authorHandle.substring(1)}-${Date.now()}.png`;
                        link.href = URL.createObjectURL(finalBlob);
                        link.click();
                        URL.revokeObjectURL(link.href);
                        // Keep notification open after download click for a bit
                         setTimeout(() => {
                             notification.classList.add('fade-out');
                             setTimeout(() => notification.remove(), 500);
                         }, 1500);
                    });

                    // Auto fade out after longer time for thread capture
                    setTimeout(() => {
                         if (!notification.classList.contains('fade-out')) { // Avoid double fade if download clicked
                            notification.classList.add('fade-out');
                            setTimeout(() => notification.remove(), 500);
                         }
                    }, 4000); // Keep notification longer
                }).catch(err => {
                     console.error('Failed to copy final image:', err);
                     notification.textContent = 'Failed to copy thread screenshot.';
                     notification.style.backgroundColor = '#E0245E';
                     setTimeout(() => notification.remove(), 3000);
                });

            }, 'image/png', 0.9); // Specify type and quality

        } catch (error) {
            console.error('Capture Thread failed:', error);
            notification.textContent = `Capture Thread failed: ${error.message}`;
            notification.style.backgroundColor = '#E0245E';
            setTimeout(() => {
                notification.classList.add('fade-out');
                setTimeout(() => notification.remove(), 500);
            }, 3000);
        }
    }

    function addScreenshotButtonToMenu(menuButton) {
        const menu = document.querySelector('[role="menu"]');
        // Check if buttons already exist
        if (!menu || menu.querySelector('.screenshot-button') || menu.querySelector('.capture-thread-button') || menu.querySelector('.download-video-button') || menu.querySelector('.post-instagram-button') || menu.querySelector('.save-local-button')) return;

        function createScreenshotMenuItem(label) {
            const button = document.createElement('div');
            button.className = 'screenshot-button';
            button.setAttribute('role', 'menuitem');
            button.setAttribute('tabindex', '0');

            button.appendChild(createScreenshotIcon());
            const text = document.createElement('span');
            text.textContent = label;
            text.style.marginLeft = '12px';
            text.style.fontSize = '15px';
            text.style.fontWeight = 'bold';
            button.appendChild(text);

            button.addEventListener('click', (event) => {
                event.stopPropagation();
                takeScreenshot(menuButton);
                setTimeout(() => {
                    const closeButton = document.querySelector('[data-testid="Dropdown"] [aria-label="Close"]');
                    if (closeButton) closeButton.click();
                }, 100);
            });

            return button;
        }

        const screenshotButton = createScreenshotMenuItem(t('发送到小红书', 'Send to Xiaohongshu'));
        menu.insertBefore(screenshotButton, menu.firstChild);

        const instagramButton = document.createElement('div');
        instagramButton.className = 'screenshot-button post-instagram-button';
        instagramButton.setAttribute('role', 'menuitem');
        instagramButton.setAttribute('tabindex', '0');
        instagramButton.appendChild(createInstagramIcon());

        const textInstagram = document.createElement('span');
        textInstagram.textContent = t('发送到 Instagram', 'Send to Instagram');
        textInstagram.style.marginLeft = '12px';
        textInstagram.style.fontSize = '15px';
        textInstagram.style.fontWeight = 'bold';
        instagramButton.appendChild(textInstagram);

        instagramButton.addEventListener('click', (event) => {
            event.stopPropagation();
            takeScreenshot(menuButton, 'instagram');
            setTimeout(() => {
                const closeButton = document.querySelector('[data-testid="Dropdown"] [aria-label="Close"]');
                if (closeButton) closeButton.click();
            }, 100);
        });
        menu.appendChild(instagramButton);

        const saveLocalButton = document.createElement('div');
        saveLocalButton.className = 'screenshot-button save-local-button';
        saveLocalButton.setAttribute('role', 'menuitem');
        saveLocalButton.setAttribute('tabindex', '0');
        saveLocalButton.appendChild(createDownloadIcon());

        const textLocal = document.createElement('span');
        textLocal.textContent = t('截图保存到本地', 'Save Screenshot Locally');
        textLocal.style.marginLeft = '12px';
        textLocal.style.fontSize = '15px';
        textLocal.style.fontWeight = 'bold';
        saveLocalButton.appendChild(textLocal);

        saveLocalButton.addEventListener('click', (event) => {
            event.stopPropagation();
            takeScreenshot(menuButton, 'download');
            setTimeout(() => {
                const closeButton = document.querySelector('[data-testid="Dropdown"] [aria-label="Close"]');
                if (closeButton) closeButton.click();
            }, 100);
        });
        menu.appendChild(saveLocalButton);

        const downloadVideoButton = document.createElement('div');
        downloadVideoButton.className = 'screenshot-button download-video-button';
        downloadVideoButton.setAttribute('role', 'menuitem');
        downloadVideoButton.setAttribute('tabindex', '0');
        downloadVideoButton.appendChild(createDownloadIcon());

        const textVideo = document.createElement('span');
        textVideo.textContent = t('下载视频', 'Download Video');
        textVideo.style.marginLeft = '12px';
        textVideo.style.fontSize = '15px';
        textVideo.style.fontWeight = 'bold';
        downloadVideoButton.appendChild(textVideo);

        downloadVideoButton.addEventListener('click', (event) => {
            event.stopPropagation();
            downloadVideoFromTweet(menuButton);
            setTimeout(() => {
                const closeButton = document.querySelector('[data-testid="Dropdown"] [aria-label="Close"]');
                if (closeButton) closeButton.click();
            }, 100);
        });
        menu.appendChild(downloadVideoButton);


        // Capture Thread is intentionally hidden.
    }

    function addScreenshotButtons() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length) {
                    mutation.addedNodes.forEach((node) => {
                        // Check if the added node itself is a menu or contains one
                        if (node.nodeType === 1) { // Check if it's an element node
                            const menu = node.matches('[role="menu"]') ? node : node.querySelector('[role="menu"]');
                            if (menu) {
                                // Find the button that triggered this menu
                                const menuButton = document.querySelector('[aria-haspopup="menu"][aria-expanded="true"]');
                                // IMPORTANT CHECK: Ensure the menu was triggered by the "More" button (three dots)
                                // within an article, typically identified by data-testid="caret".
                                if (menuButton && menuButton.closest('article[role="article"]') && menuButton.getAttribute('data-testid') === 'caret') {
                                    console.log("Detected 'More' menu, adding buttons.");
                                    addScreenshotButtonToMenu(menuButton);
                                } else {
                                     // Optional: Log why buttons weren't added
                                     // console.log("Detected menu, but not triggered by the target 'More' button or not within an article.");
                                }
                            }
                        }
                    });
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    addScreenshotButtons();
    setupVideoDownloadProgressListener();
    startInsToXAutofill();
})();
