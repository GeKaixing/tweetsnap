# tweetsnap

![tweetsnap Logo](./logo.png)

A Chrome extension for **X / Twitter, Instagram, and Xiaohongshu** cross-post workflows.

## Screenshots

### X Menu Actions

![X Menu](./screenshots/x-menu.png)

### Instagram Autofill Result

![Instagram Compose](./screenshots/instagram-compose.png)

## What It Does

- Adds actions to the X/Twitter tweet three-dot menu:
  - `Send to Xiaohongshu`
  - `Send to Instagram`
  - `Save Screenshot Locally`
  - `Download Video`
- Captures tweets in mobile-friendly width for posting
- Autofills Xiaohongshu publishing fields (images + title + body)
- Autofills Instagram post flow (images + caption, final publish is manual)
- Adds `Share to X` in Instagram post three-dot menu
  - Opens X composer
  - Fills text
  - Uploads media in order (up to 4 items)

## Install (Developer Mode)

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select this project folder

## Usage

### X/Twitter -> Xiaohongshu

1. Open a tweet
2. Click the tweet three-dot menu
3. Click `Send to Xiaohongshu`
4. The extension captures and autofills on Xiaohongshu

### X/Twitter -> Instagram

1. Open a tweet
2. Click the tweet three-dot menu
3. Click `Send to Instagram`
4. The extension captures and opens Instagram compose flow

### Instagram -> X

1. Open an Instagram post
2. Click the post three-dot menu
3. Click `Share to X`
4. The extension opens X composer and autofills text + media

### Local Save / Video Download

- `Save Screenshot Locally`: downloads tweet screenshot as PNG
- `Download Video`: tries high-bitrate mp4 first, with fallback extraction

## Limitations

- X media constraints apply; auto-upload currently targets up to 4 media items
- Some Instagram videos may fail due to source permissions/CORS
- Social platform DOM changes may require selector updates

## Core Files

- `manifest.json`: extension configuration
- `content.js`: X/Twitter-side logic + autofill pipeline
- `background.js`: service worker for messages/download/fetch bridge
- `xhs-autofill.js`: Xiaohongshu autofill logic
- `instagram-autofill.js`: Instagram autofill + Share-to-X logic

## License

MIT
