# Implementation Tasks

## 1. 语音处理工具
- [ ] 1.1 创建 `src/utils/voice.js`
- [ ] 1.2 实现 `startRecording()` 函数，启动 MediaRecorder
- [ ] 1.3 实现 `stopRecording()` 函数，停止录音并返回 Blob
- [ ] 1.4 实现 `blobToBase64(blob)` 函数，转换音频为 Base64
- [ ] 1.5 实现 `recognizeVoice(audioBase64)` 函数，调用后端接口
- [ ] 1.6 添加浏览器兼容性检测 `checkMediaRecorderSupport()`

## 2. 后端语音识别接口
- [ ] 2.1 在 `.env` 中添加百度 API 配置（BAIDU_APP_ID, BAIDU_API_KEY, BAIDU_SECRET_KEY）
- [ ] 2.2 在 `server.js` 中新增 `/api/voice/recognize` 接口
- [ ] 2.3 实现百度 API Access Token 获取逻辑
- [ ] 2.4 实现音频数据转发和结果解析
- [ ] 2.5 添加错误处理和日志记录

## 3. ChatBox 组件集成
- [ ] 3.1 在 `ChatBox.vue` 中新增 `voiceState` 状态（idle/recording/recognizing）
- [ ] 3.2 修改语音按钮点击事件，实现录音启停逻辑
- [ ] 3.3 录音停止后调用识别接口
- [ ] 3.4 识别成功后自动填充 `inputValue` 并调用 `sendMessage()`
- [ ] 3.5 添加错误处理，显示 Toast 提示

## 4. Toast 提示组件
- [ ] 4.1 在 `ChatBox.vue` 中新增 `toastMessage` 和 `toastType` 状态
- [ ] 4.2 实现 `showToast(message, type)` 函数
- [ ] 4.3 在模板中添加 Toast 提示元素
- [ ] 4.4 实现 3 秒自动消失逻辑

## 5. 视觉反馈样式
- [ ] 5.1 在 `ChatBox.css` 中添加录音状态样式（深红色 #d9534f）
- [ ] 5.2 添加识别状态样式（橙色 #f0ad4e）
- [ ] 5.3 添加加载转圈动画（@keyframes spin）
- [ ] 5.4 添加 Toast 提示样式（成功绿色/错误红色）

## 6. 按钮禁用逻辑
- [ ] 6.1 语音按钮绑定 `:disabled="state.isGenerating || voiceState !== 'idle'"`
- [ ] 6.2 录音中禁用输入框和发送按钮
- [ ] 6.3 识别中禁用输入框和发送按钮

## 7. 验证与测试
- [ ] 7.1 验证录音启停功能正常
- [ ] 7.2 验证识别结果自动填充并发送
- [ ] 7.3 验证按钮状态切换和视觉反馈
- [ ] 7.4 验证 Toast 提示显示和自动消失
- [ ] 7.5 验证流式输出时语音按钮禁用
- [ ] 7.6 验证浏览器不支持时的提示
- [ ] 7.7 验证录音权限拒绝时的提示
