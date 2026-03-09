## MODIFIED Requirements

### Requirement: 语音输入按钮交互
系统 SHALL 修改语音输入按钮的点击逻辑，实现录音启停和识别流程。

#### Scenario: 按钮点击逻辑
- **WHEN** 用户点击语音输入按钮
- **THEN** 根据当前 `voiceState` 执行不同操作：
  - `idle` → 开始录音
  - `recording` → 停止录音并开始识别
  - `recognizing` → 无操作（按钮禁用）

#### Scenario: 录音启动
- **WHEN** `voiceState === 'idle'` 且用户点击按钮
- **THEN** 调用 `startRecording()` 函数
- **AND** 设置 `voiceState = 'recording'`
- **AND** 设置 `isRecording = true`（用于按钮文字显示）

#### Scenario: 录音停止
- **WHEN** `voiceState === 'recording'` 且用户点击按钮
- **THEN** 调用 `stopRecording()` 函数
- **AND** 设置 `voiceState = 'recognizing'`
- **AND** 设置 `isRecording = false`
- **AND** 调用 `recognizeVoice()` 函数

### Requirement: 识别结果自动发送
系统 SHALL 在语音识别成功后自动填充输入框并触发发送。

#### Scenario: 自动填充并发送
- **WHEN** 识别成功返回文字内容
- **THEN** 设置 `inputValue.value = 识别文字`
- **AND** 调用 `sendMessage()` 函数
- **AND** 触发流式输出流程

#### Scenario: 识别失败保留原内容
- **WHEN** 识别失败
- **THEN** 不修改 `inputValue.value`
- **AND** 用户可以继续手动输入或重新录音

### Requirement: 按钮状态管理
系统 SHALL 新增 `voiceState` 状态管理语音输入流程。

#### Scenario: 状态初始化
- **WHEN** 组件初始化
- **THEN** 设置 `voiceState = 'idle'`

#### Scenario: 状态切换
- **WHEN** 语音输入流程进行中
- **THEN** 状态按以下顺序切换：
  - `idle` → `recording` → `recognizing` → `idle`

#### Scenario: 错误恢复
- **WHEN** 任何步骤发生错误
- **THEN** 状态立即恢复为 `idle`
- **AND** 显示错误提示

### Requirement: 按钮禁用条件
系统 SHALL 修改按钮禁用条件，兼容语音输入状态。

#### Scenario: 语音按钮禁用
- **WHEN** 渲染语音输入按钮
- **THEN** 禁用条件为：`state.isGenerating || voiceState === 'recognizing'`
- **AND** 录音中（`voiceState === 'recording'`）按钮可点击

#### Scenario: 输入框和发送按钮禁用
- **WHEN** 渲染输入框和发送按钮
- **THEN** 禁用条件为：`state.isGenerating || voiceState !== 'idle'`
- **AND** 录音或识别时禁用
