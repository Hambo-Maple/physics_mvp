# Design: AI 回答流式输出

## Context
当前项目使用智谱 AI API 的非流式模式（`stream: false`），前端需要等待完整响应后才能显示内容。为了提升用户体验，需要实现真实的流式输出，让 AI 回答逐步显示。

## Goals / Non-Goals

### Goals
- 实现真实的 SSE 流式输出，而非模拟打字效果
- 流式输出时禁用输入，避免并发问题
- 公式完整输出后再渲染，避免片段化
- 保持现有 KaTeX 渲染、关键词加粗和样式不变

### Non-Goals
- 不支持流式输出中断（用户主动停止）
- 不实现多轮对话并发
- 不缓存流式输出的中间状态

## Decisions

### 1. SSE vs WebSocket
**决策**：使用 SSE（Server-Sent Events）
**理由**：
- SSE 是单向通信，适合服务器推送数据
- 实现简单，基于 HTTP，无需额外协议
- 智谱 AI SDK 原生支持 SSE 流式输出
- 浏览器原生支持 EventSource API

**替代方案**：WebSocket 双向通信，但对于单向推送过于复杂

### 2. 流式数据格式
**决策**：后端逐块发送 JSON 格式的数据块
**格式**：
```javascript
data: {"delta": "平", "done": false}
data: {"delta": "抛", "done": false}
data: {"delta": "运动", "done": false}
data: {"delta": "", "done": true}
```

**理由**：
- 每个数据块包含增量文本（delta）和完成标志（done）
- 前端累积 delta 构建完整文本
- done 标志通知前端流式输出结束

### 3. 公式渲染时机
**决策**：流式输出完成后统一渲染公式
**理由**：
- 流式输出过程中，公式语法可能不完整（如 `$y = \frac{1`）
- 不完整的公式无法渲染，会导致错误
- 等待完整文本后再渲染，确保公式正确性

**实现方式**：
1. 流式输出时，直接显示原始文本（包括公式语法）
2. 输出完成后，调用 `formatPhysicsAnswer` 和 `renderMathToHTML`
3. 替换消息内容为渲染后的 HTML

### 4. 状态管理
**决策**：在全局状态中新增 `isGenerating` 和 `currentMessageId`
**理由**：
- `isGenerating` 控制输入框禁用状态
- `currentMessageId` 标识当前正在输出的消息
- 多个组件需要访问这些状态（ChatBox、输入框）

### 5. 打字速度控制
**决策**：不控制打字速度，实时显示 SSE 数据
**理由**：
- 真实流式输出的速度由 AI 生成速度决定
- 人为延迟会降低响应速度，违背流式输出初衷
- 如果 AI 生成过快，可以在前端添加节流（throttle）

### 6. 光标动画
**决策**：使用 CSS 动画实现闪烁光标
**样式**：
```css
.typing-cursor {
  display: inline-block;
  width: 2px;
  height: 1em;
  background: #006644;
  margin-left: 2px;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}
```

## Risks / Trade-offs

### 风险 1：SSE 连接中断
**风险**：网络不稳定导致 SSE 连接断开
**缓解**：
- 监听 EventSource 的 error 事件
- 连接断开时显示错误提示
- 不自动重连，避免重复请求

### 风险 2：公式渲染延迟
**风险**：流式输出完成后，公式渲染可能有短暂延迟
**缓解**：
- 使用 `nextTick` 确保 DOM 更新后再渲染
- 公式渲染通常很快（<50ms），用户感知不明显

### 风险 3：并发请求
**风险**：用户在流式输出时尝试发送新消息
**缓解**：
- `isGenerating` 为 true 时禁用输入框和发送按钮
- UI 层面阻止用户操作

### Trade-off：实时性 vs 公式完整性
**选择**：公式完整性优先
**说明**：
- 流式输出时不渲染公式，等待完整文本
- 牺牲了公式的实时渲染，但保证了正确性
- 对于纯文本内容，仍然是实时显示

## Migration Plan
无需迁移（新增功能，不影响现有消息）

## Open Questions
无
