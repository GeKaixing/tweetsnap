# TwitterImage

![TwitterImage Logo](./logo.png)

A Chrome extension for **X/Twitter -> Xiaohongshu** workflows:
- Add screenshot and video-download actions to the tweet three-dot menu
- After screenshot, auto-open Xiaohongshu publish page and auto-fill content

## Features

- Tweet screenshot (rendered with mobile-friendly width)
- Video download (prefers highest-bitrate mp4 via `react-tweet` API)
- Auto-redirect to Xiaohongshu publish page after screenshot
- Auto-fill title and body text
- If a tweet contains images, upload order is:
  1. Tweet screenshot
  2. Tweet original images (appended in order)
- UI text auto-switches between Chinese/English based on X page language
- Video download status with live progress (percent or MB)

## Installation (Developer Mode)

1. Open Chrome: `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select folder: `C:\Users\gekaixing\Desktop\xtoimage`

## Usage

### 1) Screenshot a tweet and publish to Xiaohongshu

1. Open any tweet and click the three-dot menu
2. Click `Screenshot`
3. The extension will automatically:
   - capture the screenshot
   - open Xiaohongshu publish page
   - upload images and fill content

### 2) Download tweet video

1. Open a tweet that contains video
2. Click the three-dot menu
3. Click `Download Video`
4. Browser download starts with status updates

## Technical Notes

- Extension type: Chrome Extension Manifest V3
- Screenshot rendering: `dom-to-image`
- Xiaohongshu autofill: content script + `chrome.storage.local`
- Video download:
  - Primary: `https://react-tweet.vercel.app/api/tweet/<tweetId>` for mp4 URL
  - Fallback: extract source from in-page video element

## Known Limitations

- Some protected or specially encoded videos may not be directly downloadable
- If Xiaohongshu page structure changes, autofill selectors may need updates
- Max auto-upload image count is 9 (based on common platform limits)

## Core Files

- `manifest.json`: extension config
- `content.js`: X page injection, screenshot, video download, UI notices
- `background.js`: download task + progress relay
- `xhs-autofill.js`: Xiaohongshu autofill logic
- `icons/`: extension icons

## License

MIT
