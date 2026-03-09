## MODIFIED Requirements

### Requirement: 消息发送流程
系统 SHALL 在发送消息时创建空的 AI 消息占位，并启动流式输出。

#### Scenario: 发送消息并创建占位
- **WHEN** 用户点击发送按钮
- **THEN** 创建用户消息并添加到消息列表
- **AND** 创建空的 AI 消息占位（content 为空字符串）
- **AND** 设置 `isGenerating = true`
- **AND** 禁用输入框和发送按钮

#### Scenario: 启动流式请求
- **WHEN** 创建 AI 消息占位后
- **THEN** 调用流式接口 `/api/chat`
- **AND** 使用 EventSource 接收 SSE 数据
- **AND** 逐步更新 AI 消息的 content

#### Scenario: 流式请求错误处理
- **WHEN** 流式请求失败（网络错误、API 错误）
- **THEN** 移除 AI 消息占位
- **AND** 添加错误消息到消息列表
- **AND** 设置 `isGenerating = false`
- **AND** 启用输入框和发送按钮

### Requirement: 消息内容更新
系统 SHALL 提供方法动态更新指定消息的内容。

#### Scenario: 更新消息内容
- **WHEN** 调用 `updateMessageContent(id, content)`
- **THEN** 查找消息列表中 ID 匹配的消息
- **AND** 更新该消息的 content 字段
- **AND** 触发 Vue 响应式更新

#### Scenario: 消息不存在处理
- **WHEN** 调用 `updateMessageContent` 但消息 ID 不存在
- **THEN** 不执行任何操作
- **AND** 在控制台输出警告信息

### Requirement: 消息渲染逻辑
系统 SHALL 根据流式输出状态决定是否渲染公式和加粗关键词。

#### Scenario: 流式输出中的消息渲染
- **WHEN** 消息正在流式输出（`isGenerating = true` 且消息 ID 匹配 `currentMessageId`）
- **THEN** 使用 `v-html` 显示原始文本
- **AND** 不应用 `formatPhysicsAnswer`
- **AND** 不应用 `renderMathToHTML`
- **AND** 在消息末尾显示光标

#### Scenario: 流式完成后的消息渲染
- **WHEN** 消息流式输出完成
- **THEN** 应用 `formatPhysicsAnswer` 加粗关键词
- **AND** 应用 `renderMathToHTML` 渲染公式
- **AND** 更新消息 content 为渲染后的 HTML
- **AND** 移除光标
