# Change: 添加 AI 回答流式输出功能

## Why
当前 AI 回复采用一次性返回模式，用户需要等待完整生成后才能看到内容，体验不够流畅。为了提升交互体验，需要实现真实的流式输出，让用户在 AI 生成过程中就能逐步看到回答内容。

## What Changes
- 后端支持 SSE（Server-Sent Events）流式响应，设置 `stream: true`
- 前端实现流式数据接收和逐字显示
- 新增全局状态 `isGenerating` 和 `currentMessageId` 管理流式输出状态
- 流式输出时禁用输入框和发送按钮
- 添加闪烁光标视觉反馈
- 公式在完整输出后再渲染，避免片段化
- 流式输出完成后触发可视化联动

## Impact
- 新增能力：`streaming-output`（流式输出）
- 修改能力：`chat-interaction`（对话交互）
- 影响文件：
  - `server.js`（新增 SSE 流式接口）
  - `src/store/index.js`（新增流式状态）
  - `src/utils/streamHandler.js`（新建，流式数据处理）
  - `src/components/ChatBox.vue`（集成流式输出）
  - `src/assets/ChatBox.css`（光标动画样式）
