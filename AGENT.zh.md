# AGENT.zh.md

## 项目目标

本仓库是一个 Chrome Extension（Manifest V3），用于将 X/Twitter 内容处理为适合小红书发布的素材。

核心目标：
- 在推文三点菜单中提供操作入口。
- 支持推文截图并自动跳转小红书发布页自动填充。
- 支持推文视频下载并给用户显示可见下载进度。
- 扩展文案自动跟随 X 页面中英文。

## 技术栈

- Chrome Extension MV3
- Content Script + Background Service Worker
- `dom-to-image`（截图渲染）
- `chrome.downloads`（可靠视频下载）

## 核心文件

- `manifest.json`：扩展权限、域名、脚本、图标配置。
- `content.js`：X 页面按钮注入、截图、视频下载触发、i18n 文案、进度提示。
- `background.js`：消息处理（`OPEN_XHS_PUBLISH`、`DOWNLOAD_VIDEO_URL`）与下载进度回传。
- `xhs-autofill.js`：小红书发布页自动上传与自动填充。
- `icons/`：扩展图标资源。

## 当前产品行为

1. `Screenshot`
- 以移动端宽度渲染当前推文截图。
- 对推文内视频做快照替换，避免截图黑块。
- 将数据写入本地存储并打开小红书发布页。
- 自动上传图片顺序：
  1. 推文截图
  2. 推文原图（如果有）
- 自动填充标题与正文。

2. `Download Video`
- 提取 tweetId，请求 `https://react-tweet.vercel.app/api/tweet/<tweetId>`。
- 优先选择最高码率 mp4 下载地址。
- 通过后台脚本触发浏览器下载。
- 页面显示下载状态（有总大小显示百分比，无总大小显示 MB）。

## 关键约束（Guardrails）

- 不要随意删除/重命名跨脚本消息类型，除非同步更新全部调用：
  - `OPEN_XHS_PUBLISH`
  - `DOWNLOAD_VIDEO_URL`
  - `VIDEO_DOWNLOAD_PROGRESS`
- 未经明确需求，不要修改上传图片顺序。
- 保持 i18n 方法（`t(zh, en)`）可用。
- 不要引入需要密钥或付费依赖的外部服务。

## 修改规则

- 优先做小范围、可回归验证的修改。
- 非明确需求下，不改变现有用户行为。
- 文件默认使用 ASCII（除非已有中文文案）。
- 若新增权限或 host 权限，需要在提交说明中标注原因。

## 手工回归清单

每次改动后至少验证：
1. `chrome://extensions` 中扩展可正常加载，无清单报错。
2. X 推文三点菜单存在 `Screenshot` 并可执行。
3. 截图流程可跳转小红书并自动填充。
4. 小红书图片顺序为“截图在前，原图在后”。
5. `Download Video` 能触发浏览器下载。
6. 下载提示能显示“下载中/完成/失败”，并尽量显示 `%` 或 `MB`。
7. 文案随 X 页面语言在中英文间切换。

## 已知限制

- 部分受保护/特殊编码视频可能拿不到可直接下载的 mp4。
- 小红书页面结构变化会影响自动填充选择器，需要维护。
- 视频下载可能受源站/CORS/登录态限制。

## 发布说明建议

发布时建议说明：
- 用户可感知功能变更。
- 权限变更。
- 下载/自动填充的 fallback 逻辑变化。
- 潜在回归风险（依赖 X 与小红书 DOM 结构）。
