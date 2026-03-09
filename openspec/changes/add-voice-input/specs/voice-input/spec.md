## ADDED Requirements

### Requirement: 录音控制
系统 SHALL 提供录音启停控制功能，支持主流浏览器的 MediaRecorder API。

#### Scenario: 开始录音
- **WHEN** 用户点击语音输入按钮（状态为 idle）
- **THEN** 请求麦克风权限
- **AND** 启动 MediaRecorder 开始录音
- **AND** 按钮状态切换为 recording
- **AND** 按钮颜色变为深红色 (#d9534f)
- **AND** 按钮文字变为 "正在录音..."
- **AND** 显示加载转圈动画

#### Scenario: 停止录音
- **WHEN** 用户再次点击语音输入按钮（状态为 recording）
- **THEN** 停止 MediaRecorder
- **AND** 获取录音 Blob 数据
- **AND** 按钮状态切换为 recognizing
- **AND** 按钮颜色变为橙色 (#f0ad4e)
- **AND** 按钮文字变为 "正在识别..."

#### Scenario: 浏览器不支持
- **WHEN** 浏览器不支持 MediaRecorder API
- **THEN** 语音输入按钮禁用
- **AND** 显示 Toast 提示 "您的浏览器不支持语音输入"

#### Scenario: 麦克风权限拒绝
- **WHEN** 用户拒绝麦克风权限
- **THEN** 停止录音流程
- **AND** 按钮状态恢复为 idle
- **AND** 显示 Toast 提示 "麦克风权限被拒绝，请在浏览器设置中开启"

### Requirement: 音频数据处理
系统 SHALL 将录音数据转换为 Base64 格式，并通过后端接口发送给百度语音识别 API。

#### Scenario: 音频转换
- **WHEN** 录音停止
- **THEN** 将 Blob 数据转换为 Base64 字符串
- **AND** 获取音频格式（webm/ogg/wav）

#### Scenario: 调用后端接口
- **WHEN** 音频转换完成
- **THEN** 发送 POST 请求到 `/api/voice/recognize`
- **AND** 请求体包含 `{ audio: "base64数据", format: "音频格式" }`

#### Scenario: 接口超时
- **WHEN** 后端接口超时（超过 10 秒）
- **THEN** 取消请求
- **AND** 按钮状态恢复为 idle
- **AND** 显示 Toast 提示 "识别超时，请重试"

### Requirement: 识别结果处理
系统 SHALL 在识别成功后自动填充输入框并触发发送，启动流式对话。

#### Scenario: 识别成功
- **WHEN** 后端返回识别结果 `{ text: "识别的文字" }`
- **THEN** 将文字填充到输入框（`inputValue`）
- **AND** 自动调用 `sendMessage()` 函数
- **AND** 按钮状态恢复为 idle
- **AND** 触发流式输出、公式渲染、可视化联动

#### Scenario: 识别失败
- **WHEN** 后端返回错误 `{ error: "错误信息" }`
- **THEN** 保留输入框原有内容
- **AND** 按钮状态恢复为 idle
- **AND** 显示 Toast 提示错误信息

#### Scenario: 识别结果为空
- **WHEN** 后端返回 `{ text: "" }` 或 `{ text: null }`
- **THEN** 保留输入框原有内容
- **AND** 按钮状态恢复为 idle
- **AND** 显示 Toast 提示 "未识别到内容，请重试"

### Requirement: Toast 提示
系统 SHALL 提供非阻塞式文字提示，3 秒后自动消失。

#### Scenario: 显示成功提示
- **WHEN** 调用 `showToast(message, 'success')`
- **THEN** 在页面顶部显示绿色提示框
- **AND** 背景色为 #4caf50
- **AND** 显示传入的消息文字
- **AND** 3 秒后自动消失

#### Scenario: 显示错误提示
- **WHEN** 调用 `showToast(message, 'error')`
- **THEN** 在页面顶部显示红色提示框
- **AND** 背景色为 #f44336
- **AND** 显示传入的消息文字
- **AND** 3 秒后自动消失

#### Scenario: 提示不阻塞操作
- **WHEN** Toast 提示显示中
- **THEN** 用户可以继续操作输入框、发送按钮、语音按钮
- **AND** 不使用 alert/confirm 等阻塞式弹窗

### Requirement: 视觉反馈
系统 SHALL 根据语音输入状态提供清晰的视觉反馈，匹配墨绿色主题。

#### Scenario: 空闲状态
- **WHEN** `voiceState === 'idle'`
- **THEN** 按钮背景色为墨绿色 (#006644)
- **AND** 按钮文字为 "语音输入"
- **AND** 无加载动画

#### Scenario: 录音状态
- **WHEN** `voiceState === 'recording'`
- **THEN** 按钮背景色为深红色 (#d9534f)
- **AND** 按钮文字为 "正在录音..."
- **AND** 显示转圈加载动画

#### Scenario: 识别状态
- **WHEN** `voiceState === 'recognizing'`
- **THEN** 按钮背景色为橙色 (#f0ad4e)
- **AND** 按钮文字为 "正在识别..."
- **AND** 显示转圈加载动画

#### Scenario: 加载动画
- **WHEN** 按钮处于 recording 或 recognizing 状态
- **THEN** 按钮内显示转圈动画
- **AND** 动画为极简风格，不破坏整体 A2UI 设计
- **AND** 动画速度为 1 秒一圈

### Requirement: 按钮禁用逻辑
系统 SHALL 在特定状态下禁用语音输入按钮，避免冲突。

#### Scenario: 流式输出时禁用
- **WHEN** `state.isGenerating === true`
- **THEN** 语音输入按钮禁用
- **AND** 按钮样式变为灰色
- **AND** 鼠标悬停无效果

#### Scenario: 录音或识别时禁用其他按钮
- **WHEN** `voiceState === 'recording'` 或 `voiceState === 'recognizing'`
- **THEN** 输入框禁用
- **AND** 发送按钮禁用
- **AND** 语音按钮可点击（用于停止录音）

#### Scenario: 空闲时全部启用
- **WHEN** `voiceState === 'idle'` 且 `state.isGenerating === false`
- **THEN** 输入框、发送按钮、语音按钮全部启用

### Requirement: 后端语音识别接口
系统 SHALL 提供后端接口转发百度语音识别 API，保障密钥安全。

#### Scenario: 接收前端请求
- **WHEN** 前端发送 POST 请求到 `/api/voice/recognize`
- **THEN** 后端接收 `{ audio: "base64数据", format: "音频格式" }`
- **AND** 验证请求参数完整性

#### Scenario: 获取百度 Access Token
- **WHEN** 后端需要调用百度 API
- **THEN** 使用 API Key 和 Secret Key 获取 Access Token
- **AND** 缓存 Token（有效期 30 天）

#### Scenario: 调用百度语音识别 API
- **WHEN** 获取到 Access Token
- **THEN** 将 Base64 音频数据发送到百度 API
- **AND** 设置识别参数（语言：中文，采样率：16000）

#### Scenario: 返回识别结果
- **WHEN** 百度 API 返回识别结果
- **THEN** 解析结果中的文字内容
- **AND** 返回给前端 `{ text: "识别的文字" }`

#### Scenario: 百度 API 错误处理
- **WHEN** 百度 API 返回错误（如限额、网络问题）
- **THEN** 记录错误日志
- **AND** 返回给前端 `{ error: "识别失败，请稍后重试" }`

### Requirement: 环境变量配置
系统 SHALL 在 `.env` 文件中配置百度 API 密钥。

#### Scenario: 配置密钥
- **WHEN** 开发者配置百度 API
- **THEN** 在 `.env` 文件中添加以下配置：
  ```
  BAIDU_APP_ID=你的AppID
  BAIDU_API_KEY=你的API_Key
  BAIDU_SECRET_KEY=你的Secret_Key
  ```

#### Scenario: 密钥未配置
- **WHEN** 后端启动时检测到密钥未配置
- **THEN** 在控制台输出警告信息
- **AND** 语音识别接口返回错误 "语音识别服务未配置"
