## ADDED Requirements

### Requirement: SSE 流式响应接口
系统 SHALL 提供基于 SSE（Server-Sent Events）的流式响应接口，支持 AI 回答的实时推送。

#### Scenario: 流式接口调用
- **WHEN** 前端发送消息到 `/api/chat` 接口
- **THEN** 后端设置响应头 `Content-Type: text/event-stream`
- **AND** 后端调用智谱 AI API 时设置 `stream: true`
- **AND** 后端逐块接收 AI 响应并转发给前端

#### Scenario: 流式数据格式
- **WHEN** 后端接收到 AI 响应的数据块
- **THEN** 后端发送格式为 `data: {"delta": "文本", "done": false}` 的 SSE 消息
- **AND** 每个数据块包含增量文本（delta）和完成标志（done）

#### Scenario: 流式完成标志
- **WHEN** AI 响应完全生成
- **THEN** 后端发送 `data: {"delta": "", "done": true}` 标志流式结束
- **AND** 关闭 SSE 连接

### Requirement: 流式输出状态管理
系统 SHALL 在全局状态中管理流式输出状态，控制输入框禁用和消息更新。

#### Scenario: 流式状态初始化
- **WHEN** 系统初始化
- **THEN** 全局状态包含 `isGenerating: false`
- **AND** 全局状态包含 `currentMessageId: null`

#### Scenario: 开始流式输出
- **WHEN** 用户发送消息
- **THEN** 创建空的 AI 消息占位
- **AND** 设置 `isGenerating = true`
- **AND** 设置 `currentMessageId` 为当前消息 ID
- **AND** 输入框和发送按钮禁用

#### Scenario: 流式输出完成
- **WHEN** 接收到 `done: true` 标志
- **THEN** 设置 `isGenerating = false`
- **AND** 设置 `currentMessageId = null`
- **AND** 输入框和发送按钮恢复可用

### Requirement: 流式数据接收和显示
系统 SHALL 实时接收流式数据并逐步更新消息内容，提供流畅的打字效果。

#### Scenario: 接收流式数据
- **WHEN** 前端接收到 SSE 数据块
- **THEN** 解析 JSON 格式的数据（`{"delta": "文本", "done": false}`）
- **AND** 累积 delta 构建完整文本
- **AND** 更新对应消息的 content 字段

#### Scenario: 实时显示文本
- **WHEN** 消息内容更新
- **THEN** 页面立即显示新增的文本
- **AND** 消息流自动滚动到底部
- **AND** 显示原始文本（不渲染公式）

#### Scenario: 流式输出速度
- **WHEN** 流式输出进行中
- **THEN** 文本显示速度由 AI 生成速度决定
- **AND** 不人为延迟或加速

### Requirement: 光标视觉反馈
系统 SHALL 在流式输出时显示闪烁光标，提供视觉反馈。

#### Scenario: 显示光标
- **WHEN** 流式输出进行中（`isGenerating = true`）
- **THEN** 在当前消息末尾显示闪烁光标（|）
- **AND** 光标颜色为墨绿色 (#006644)
- **AND** 光标以 1 秒周期闪烁

#### Scenario: 移除光标
- **WHEN** 流式输出完成（`isGenerating = false`）
- **THEN** 光标立即消失
- **AND** 消息内容保持不变

### Requirement: 公式延迟渲染
系统 SHALL 在流式输出完成后统一渲染公式，避免公式片段化。

#### Scenario: 流式输出时不渲染公式
- **WHEN** 流式输出进行中
- **THEN** 显示原始文本，包括公式语法（如 `\( x = v_0 t \)`）
- **AND** 不调用 KaTeX 渲染函数

#### Scenario: 流式完成后渲染公式
- **WHEN** 流式输出完成（接收到 `done: true`）
- **THEN** 先应用 `formatPhysicsAnswer` 加粗关键词
- **AND** 再应用 `renderMathToHTML` 渲染公式
- **AND** 更新消息内容为渲染后的 HTML

#### Scenario: 公式完整性保证
- **WHEN** 渲染公式
- **THEN** 所有公式语法完整（如 `\( ... \)` 或 `$$ ... $$`）
- **AND** 公式渲染无错误，无片段化

### Requirement: 输入框禁用控制
系统 SHALL 在流式输出时禁用输入框和发送按钮，避免并发问题。

#### Scenario: 禁用输入框
- **WHEN** `isGenerating = true`
- **THEN** 输入框设置 `:disabled="true"`
- **AND** 发送按钮设置 `:disabled="true"`
- **AND** 语音输入按钮设置 `:disabled="true"`

#### Scenario: 启用输入框
- **WHEN** `isGenerating = false`
- **THEN** 输入框恢复可用
- **AND** 发送按钮恢复可用
- **AND** 语音输入按钮恢复可用

### Requirement: 流式完成后触发联动
系统 SHALL 在流式输出完成后触发可视化联动逻辑。

#### Scenario: 解析触发标记
- **WHEN** 流式输出完成
- **THEN** 解析完整文本中的触发标记（如 `[TRIGGER:PROJECTILE]`）
- **AND** 如果存在触发标记，调用 `updateVisualType(trigger)`

#### Scenario: 可视化联动时机
- **WHEN** 触发可视化联动
- **THEN** 必须在流式输出完成后（`isGenerating = false`）
- **AND** 必须在公式渲染完成后
