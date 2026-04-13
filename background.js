const activeVideoDownloads = new Map();

function notifyTab(tabId, payload) {
  if (!tabId) return;
  chrome.tabs.sendMessage(tabId, payload, () => {
    // ignore runtime errors when tab has no listener or is closed
  });
}

function stopTrackingDownload(downloadId) {
  const tracking = activeVideoDownloads.get(downloadId);
  if (!tracking) return;
  if (tracking.timer) {
    clearInterval(tracking.timer);
  }
  activeVideoDownloads.delete(downloadId);
}

function startDownloadProgressPolling(downloadId) {
  const tracking = activeVideoDownloads.get(downloadId);
  if (!tracking || tracking.timer) return;

  tracking.timer = setInterval(() => {
    chrome.downloads.search({ id: downloadId }, (items) => {
      const current = activeVideoDownloads.get(downloadId);
      if (!current) {
        return;
      }

      if (chrome.runtime.lastError || !items || items.length === 0) {
        return;
      }

      const item = items[0];
      notifyTab(current.tabId, {
        type: 'VIDEO_DOWNLOAD_PROGRESS',
        id: downloadId,
        state: item.state,
        bytesReceived: typeof item.bytesReceived === 'number' ? item.bytesReceived : undefined,
        totalBytes: typeof item.totalBytes === 'number' ? item.totalBytes : undefined
      });

      if (item.state === 'complete' || item.state === 'interrupted') {
        if (item.state === 'interrupted') {
          notifyTab(current.tabId, {
            type: 'VIDEO_DOWNLOAD_PROGRESS',
            id: downloadId,
            state: 'interrupted',
            error: item.error || 'interrupted'
          });
        }
        stopTrackingDownload(downloadId);
      }
    });
  }, 600);
}

chrome.downloads.onChanged.addListener((delta) => {
  if (!delta || typeof delta.id !== 'number') return;
  const tracking = activeVideoDownloads.get(delta.id);
  if (!tracking) return;

  const progress = { type: 'VIDEO_DOWNLOAD_PROGRESS', id: delta.id };

  if (delta.totalBytes && typeof delta.totalBytes.current === 'number') {
    progress.totalBytes = delta.totalBytes.current;
  }
  if (delta.bytesReceived && typeof delta.bytesReceived.current === 'number') {
    progress.bytesReceived = delta.bytesReceived.current;
  }
  if (delta.state && delta.state.current) {
    progress.state = delta.state.current;
  }
  if (delta.error && delta.error.current) {
    progress.error = delta.error.current;
  }

  notifyTab(tracking.tabId, progress);

  if ((delta.state && delta.state.current === 'complete') || (delta.state && delta.state.current === 'interrupted')) {
    stopTrackingDownload(delta.id);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type) {
    return;
  }

  if (message.type === 'OPEN_XHS_PUBLISH') {
    const url = 'https://creator.xiaohongshu.com/publish/publish?source=&published=true&from=tab_switch&target=image';
    chrome.tabs.create({ url }, () => {
      if (chrome.runtime.lastError) {
        sendResponse({ ok: false, error: chrome.runtime.lastError.message });
        return;
      }
      sendResponse({ ok: true });
    });
    return true;
  }

  if (message.type === 'DOWNLOAD_VIDEO_URL') {
    if (!message.url) {
      sendResponse({ ok: false, error: 'Missing url' });
      return;
    }

    chrome.downloads.download(
      {
        url: message.url,
        filename: message.filename || `twitter-video-${Date.now()}.mp4`,
        conflictAction: 'uniquify',
        saveAs: false
      },
      (downloadId) => {
        if (chrome.runtime.lastError || !downloadId) {
          sendResponse({
            ok: false,
            error: chrome.runtime.lastError ? chrome.runtime.lastError.message : 'Failed to start download'
          });
          return;
        }

        if (sender && sender.tab && typeof sender.tab.id === 'number') {
          activeVideoDownloads.set(downloadId, {
            tabId: sender.tab.id,
            timer: null
          });
          notifyTab(sender.tab.id, {
            type: 'VIDEO_DOWNLOAD_PROGRESS',
            id: downloadId,
            state: 'in_progress',
            started: true
          });
          startDownloadProgressPolling(downloadId);
        }

        sendResponse({ ok: true, downloadId });
      }
    );
    return true;
  }

  sendResponse({ ok: false, error: 'Unknown message type' });
});
