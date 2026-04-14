# TwitterImage

![TwitterImage Logo](./logo.png)

一个用于 **X/Twitter -> 小红书 / Instagram** 的 Chrome 扩展：
- 在推文三点菜单中提供截图与视频下载能力
- 截图后自动跳转小红书创作页并自动填充图文
- 支持截图后自动跳转 Instagram 创建贴文页并自动填充

## 功能

- 推文截图（按移动端宽度渲染）
- 视频下载（优先通过 `react-tweet` API 获取最高码率 mp4）
- 截图后自动跳转到小红书发布页
- 自动填充标题与正文
- 截图后自动跳转到 Instagram 贴文创建页
- 自动上传图片并填充 Instagram 文案（发布按钮需手动确认）
- 支持截图并直接保存到本地（浏览器下载）
- 如果推文包含图片，上传顺序为：
  1. 推文截图
  2. 推文原图（依次追加）
- 文案中英文自动跟随 X 页面语言
- 视频下载显示实时状态（下载中/完成/失败，支持百分比或 MB）

## 安装（开发者模式）

1. 打开 Chrome：`chrome://extensions`
2. 打开右上角“开发者模式”
3. 点击“加载已解压的扩展程序”
4. 选择目录：`C:\Users\gekaixing\Desktop\xtoimage`

## 使用

### 1) 推文截图并发布到小红书

1. 打开任意推文，点击右上角三点菜单
2. 点击 `发送到小红书`
3. 扩展会自动：
   - 生成截图
   - 打开小红书发布页
   - 自动上传图片并填充文案

### 2) 推文截图并发送到 Instagram 贴文

1. 打开任意推文，点击右上角三点菜单
2. 点击 `发送到 Instagram`
3. 扩展会自动：
   - 生成截图
   - 打开 Instagram 创建贴文页
   - 自动上传图片并填充 caption（你手动点发布）

### 3) 推文截图保存到本地

1. 打开任意推文，点击右上角三点菜单
2. 点击 `截图保存到本地`
3. 浏览器会直接下载截图 PNG
### 4) 下载推文视频

1. 打开带视频的推文，点击三点菜单
2. 点击 `Download Video`
3. 浏览器开始下载并显示下载状态

## 技术说明

- 扩展类型：Chrome Extension Manifest V3
- 截图渲染：`dom-to-image`
- 小红书自动填充：content script + `chrome.storage.local`
- 视频下载：
  - 主路径：`https://react-tweet.vercel.app/api/tweet/<tweetId>` 解析 mp4 直链
  - 备选路径：从页面 video 元素提取源地址

## 已知限制

- 某些受保护或特殊编码视频可能无法直接下载
- 小红书页面结构变动时，自动填充选择器可能需要更新
- 自动上传图片数量默认最多 9 张（受平台常见上限影响）

## 项目结构（核心文件）

- `manifest.json`：扩展配置
- `content.js`：X 页面注入、截图、视频下载、提示逻辑
- `background.js`：下载任务与进度消息
- `xhs-autofill.js`：小红书页面自动填充
- `instagram-autofill.js`：Instagram 贴文页面自动填充
- `icons/`：扩展图标

## License

MIT
