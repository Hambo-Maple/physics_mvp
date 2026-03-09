# Implementation Tasks

## 1. 后端 SSE 流式接口
- [x] 1.1 修改 `server.js`，设置智谱 AI API 的 `stream: true`
- [x] 1.2 实现 SSE 响应头设置（Content-Type: text/event-stream）
- [x] 1.3 逐块读取智谱 AI 流式响应，转发给前端
- [x] 1.4 发送完成标志 `{"delta": "", "done": true}`

## 2. 全局状态管理
- [x] 2.1 在 `src/store/index.js` 中新增 `isGenerating` 状态
- [x] 2.2 在 `src/store/index.js` 中新增 `currentMessageId` 状态
- [x] 2.3 新增 `setGenerating(value)` 方法
- [x] 2.4 新增 `updateMessageContent(id, content)` 方法

## 3. 流式数据处理工具
- [x] 3.1 创建 `src/utils/streamHandler.js`
- [x] 3.2 实现 `createStreamReader(url, options)` 函数，返回 EventSource
- [x] 3.3 实现流式数据解析逻辑，累积 delta 构建完整文本
- [x] 3.4 处理流式完成事件，触发回调

## 4. ChatBox 组件集成
- [x] 4.1 修改 `sendMessage` 函数，使用流式接口
- [x] 4.2 创建空的 AI 消息占位，设置 `isGenerating = true`
- [x] 4.3 逐步更新消息内容，显示原始文本（不渲染公式）
- [x] 4.4 流式完成后，应用 `formatPhysicsAnswer` 和 `renderMathToHTML`
- [x] 4.5 设置 `isGenerating = false`，触发可视化联动

## 5. UI 交互优化
- [x] 5.1 在 `ChatBox.css` 中添加光标动画样式
- [x] 5.2 流式输出时，在消息末尾显示闪烁光标
- [x] 5.3 流式输出时，禁用输入框和发送按钮（`:disabled` 绑定 `isGenerating`）
- [x] 5.4 流式完成后，移除光标，启用输入框

## 6. 验证与测试
- [ ] 6.1 验证流式输出逐字显示，速度自然
- [ ] 6.2 验证流式输出时输入框禁用
- [ ] 6.3 验证光标动画正常显示和消失
- [ ] 6.4 验证公式在流式完成后正确渲染
- [ ] 6.5 验证关键词加粗功能正常
- [ ] 6.6 验证可视化联动在流式完成后触发
