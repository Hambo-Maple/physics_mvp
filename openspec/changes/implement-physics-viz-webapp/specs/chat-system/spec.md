# Spec: Chat System with Context Association

## ADDED Requirements

### Requirement: Message Display and Interaction
**ID**: `chat-system-001`
**Priority**: P0

The chat component MUST implement a three-layer structure with title bar, message flow area, and input area, supporting user message sending, AI reply display, and automatic scrolling to the latest message.

#### Scenario: 对话组件正确渲染
**Given** 应用已加载
**When** 用户查看左侧对话区域
**Then** 应显示标题栏，高度 50px，背景 #006644，文字"物理可视化助手"（白色、居中、16px）
**And** 应显示消息流区域，flex: 1，背景白色，支持垂直滚动
**And** 应显示输入区，高度 80px，包含多行文本框、语音输入按钮、发送按钮

#### Scenario: 用户发送消息
**Given** 用户在输入框中输入文字"平抛运动"
**When** 用户点击发送按钮或按下回车键
**Then** 消息应添加到消息流区域，右对齐，气泡背景 #006644，文字白色
**And** 消息下方应显示发送时间（12px，#999）
**And** 输入框应清空
**And** 消息流应自动滚动到底部

#### Scenario: AI 回复消息
**Given** 用户已发送消息"平抛运动"
**When** 延迟 500ms 后
**Then** AI 回复应添加到消息流区域，左对齐，气泡背景 #f5f5f5，文字 #333
**And** 回复内容应为"收到，已为你加载平抛运动的可视化模型。公式：y = 1/2gt²，x = v₀t。[TRIGGER:PROJECTILE]"
**And** 消息流应自动滚动到底部

---

### Requirement: Context Association Logic
**ID**: `chat-system-002`
**Priority**: P0

The AI reply logic MUST support context association based on keyword matching and recent message history, capable of recognizing pronouns ("这个", "它", "该模型") and associating them with the most recent visualization type or topic.

#### Scenario: 识别直接触发关键词
**Given** 用户输入包含"平抛"
**When** AI 生成回复
**Then** 回复内容应包含平抛运动相关信息
**And** 回复应包含触发标记 `[TRIGGER:PROJECTILE]`

#### Scenario: 识别公式触发关键词
**Given** 用户输入包含"公式"
**When** AI 生成回复
**Then** 回复内容应包含物理公式相关信息
**And** 回复应包含触发标记 `[TRIGGER:FORMULA]`

#### Scenario: 上下文关联 - 指代词识别
**Given** 用户前一条消息是"平抛运动"
**And** AI 已回复并触发 PROJECTILE 类型
**When** 用户输入"这个公式"
**Then** AI 应识别"这个"指代平抛运动
**And** 回复应包含"你询问的平抛运动公式含义为：x 是水平位移，v₀ 是初速度，t 是运动时间；y 是竖直位移，g 是重力加速度（9.8m/s²）。[TRIGGER:PROJECTILE]"

#### Scenario: 默认回复
**Given** 用户输入不包含已知触发关键词
**And** 无法识别上下文关联
**When** AI 生成回复
**Then** 回复应为"已收到你的问题：${用户输入}，相关可视化即将展示。"
**And** 不包含触发标记

---

### Requirement: Voice Input Interface (Reserved)
**ID**: `chat-system-003`
**Priority**: P2

The input area MUST include a voice input button that toggles state ("语音输入" ↔ "正在识别...") when clicked, with reserved integration interface for Baidu Voice Recognition SDK.

#### Scenario: 语音输入按钮状态切换
**Given** 用户查看输入区
**When** 用户点击"语音输入"按钮
**Then** 按钮文字应变为"正在识别..."
**And** 按钮状态应更新为 isRecording = true
**When** 用户再次点击按钮
**Then** 按钮文字应恢复为"语音输入"
**And** 按钮状态应更新为 isRecording = false

#### Scenario: 预留 SDK 集成接口
**Given** 存在 `startVoiceRecognition()` 函数
**When** 查看函数实现
**Then** 应包含注释 `// TODO: Integrate Baidu Voice SDK`
**And** 应包含详细的集成说明注释：
```
// 百度语音识别接入说明：
// 1. 引入百度语音 Web SDK（需先申请 AppKey/SecretKey）；
// 2. 调用 SDK 录制音频并转换为文字；
// 3. 将识别结果赋值给 inputValue（输入框绑定的变量）；
// 4. 识别完成后重置按钮状态为"语音输入"；
```

---

### Requirement: Message Styling
**ID**: `chat-system-004`
**Priority**: P0

Message bubbles MUST apply different styles based on role (user/AI), with user messages right-aligned with dark green background, AI messages left-aligned with light gray background, and rounded corners reflecting conversation directionality.

#### Scenario: 用户消息样式
**Given** 消息列表中存在用户消息
**When** 用户查看消息
**Then** 消息应右对齐
**And** 气泡背景为 #006644，文字白色
**And** padding 为 8px 12px
**And** 圆角为 8px，左侧圆角更大（如 border-radius: 16px 8px 8px 8px）
**And** margin 为 8px 0

#### Scenario: AI 消息样式
**Given** 消息列表中存在 AI 消息
**When** 用户查看消息
**Then** 消息应左对齐
**And** 气泡背景为 #f5f5f5，文字 #333
**And** padding 为 8px 12px
**And** 圆角为 8px，右侧圆角更大（如 border-radius: 8px 16px 8px 8px）
**And** margin 为 8px 0

#### Scenario: 消息时间戳显示
**Given** 消息列表中存在任意消息
**When** 用户查看消息
**Then** 消息气泡下方应显示发送时间
**And** 时间文字大小为 12px，颜色 #999
**And** 时间格式为 HH:MM（如 14:30）
