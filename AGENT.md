# AGENT.md

## Purpose

This repository is a Chrome Extension (Manifest V3) for converting X/Twitter content into assets suitable for Xiaohongshu publishing.

Primary goals:
- Add actions in the tweet three-dot menu.
- Screenshot tweet content and auto-publish workflow to Xiaohongshu creator page.
- Download tweet videos with user-visible progress.
- Keep Chinese/English UI text aligned with X page language.

## Tech Stack

- Chrome Extension MV3
- Content scripts + background service worker
- `dom-to-image` for screenshot rendering
- `chrome.downloads` for reliable video downloading

## Core Files

- `manifest.json`: Extension permissions, hosts, scripts, icons.
- `content.js`: X page UI injection, screenshot, video download trigger, i18n text, progress UI.
- `background.js`: Message handling (`OPEN_XHS_PUBLISH`, `DOWNLOAD_VIDEO_URL`) and download progress relay.
- `xhs-autofill.js`: Xiaohongshu publish page autofill (images/title/content).
- `icons/`: Extension icon assets.

## Product Behavior (Current)

1. `Screenshot`
- Capture current tweet at mobile-friendly width.
- Handle embedded video snapshot replacement to avoid black blocks in screenshots.
- Save payload to local storage and open Xiaohongshu publish page.
- Auto-upload images in order:
  1. Tweet screenshot
  2. Tweet original images (if any)
- Auto-fill title/body.

2. `Download Video`
- Extract tweet ID and request `https://react-tweet.vercel.app/api/tweet/<tweetId>`.
- Prefer highest bitrate mp4 variant.
- Start browser download via background script.
- Show in-page progress status (percent when total known, MB otherwise).

## Guardrails

- Do not remove/rename message types used across scripts unless all call sites are updated:
  - `OPEN_XHS_PUBLISH`
  - `DOWNLOAD_VIDEO_URL`
  - `VIDEO_DOWNLOAD_PROGRESS`
- Do not change image upload ordering unless explicitly requested.
- Keep UI language switching logic (`t(zh, en)`) intact.
- Avoid introducing external paid services or secrets.

## Editing Rules

- Prefer minimal, targeted changes.
- Preserve existing user-facing behavior unless task explicitly requires behavior change.
- Keep code ASCII unless file already uses non-ASCII text.
- If adding new permissions/host permissions, document why in PR/commit message.

## Manual QA Checklist

After changes, verify:
1. Extension loads in `chrome://extensions` with no manifest errors.
2. On X tweet menu, `Screenshot` appears and works.
3. Screenshot flow opens Xiaohongshu publish page and autofills content.
4. Image order on Xiaohongshu is screenshot first, then original tweet images.
5. `Download Video` starts browser download.
6. Download progress toast updates (percent or MB), then completion/failure state.
7. Chinese/English text follows X page language.

## Known Limitations

- Some protected/encoded media may not provide downloadable mp4 variants.
- Xiaohongshu DOM changes can break selectors and require maintenance.
- Video direct download may be limited by source/CORS/state restrictions.

## Release Notes Guidance

When preparing release notes, include:
- User-visible behavior changes.
- Permission changes.
- Any fallback behavior updates for download/autofill.
- Regression risks (X DOM and Xiaohongshu DOM dependency).
