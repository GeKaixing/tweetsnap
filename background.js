chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.type !== 'OPEN_XHS_PUBLISH') {
    return;
  }

  const url = 'https://creator.xiaohongshu.com/publish/publish?source=&published=true&from=tab_switch&target=image';
  chrome.tabs.create({ url }, () => {
    if (chrome.runtime.lastError) {
      sendResponse({ ok: false, error: chrome.runtime.lastError.message });
      return;
    }
    sendResponse({ ok: true });
  });

  return true;
});
