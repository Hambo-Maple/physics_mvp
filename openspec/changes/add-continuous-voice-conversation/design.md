# Design: 连续语音对话模式

## Context
当前系统已实现单次语音输入功能（点击开始 → 录音 → 点击停止 → 识别 → 自动发送），但每次对话都需要手动操作，不适合连续交互场景。用户希望实现类似智能音箱的连续对话体验，提升物理学习场景下的交互效率。

技术约束：
- 前端使用 Vue 3 Composition API + 纯原生 CSS
- 语音识别使用百度智能云 API（通过后端代理）
- 浏览器 MediaRecorder API 用于录音
- 需要保持现有功能完全不变

## Goals / Non-Goals

### Goals
- 实现全自动连续语音对话循环（无需手动点击）
- 提供清晰的视觉反馈（状态栏、按钮闪烁、波形动画）
- 与现有功能无缝集成（参数解析、可视化联动、流式输出）
- 优雅的错误处理与恢复机制

### Non-Goals
- 不实现语音唤醒功能（需要持续监听，隐私和性能问题）
- 不实现离线语音识别（依赖百度云服务）
- 不实现语音打断AI回答功能（用户选择等待AI完成）
- 不实现移动端适配（项目仅支持PC端）

## Decisions

### 1. 静音检测算法
**决策**：使用 Web Audio API 的 AnalyserNode 实时分析音量，当检测到声音后音量低于阈值且持续 1.5 秒时触发停止录音。如果用户一直沉默未说话，系统保持录音状态等待用户开始说话。

**实现细节**：
```javascript
// 音量计算：使用 getByteTimeDomainData 获取波形数据
// 计算 RMS（均方根）作为音量指标
// 阈值设定：RMS < 5（0-255范围）视为静音
// 时间窗口：检测到声音后，连续 1.5 秒静音触发停止
// 特殊处理：如果一直未检测到声音，不触发静音计时，保持录音等待
```

**替代方案**：
- 方案A：固定时长录音（如5秒）→ 不灵活，用户说话长度不一
- 方案B：使用 VAD（Voice Activity Detection）库 → 增加依赖，过度工程化

**选择理由**：Web Audio API 原生支持，性能好，阈值可调，符合"简单优先"原则。

### 2. 连续循环状态机
**决策**：使用状态机模式管理连续语音循环，状态包括：idle（空闲）→ listening（监听中）→ recording（录音中）→ recognizing（识别中）→ waiting_ai（等待AI）→ listening（继续监听）。

**状态转换逻辑**：
```
用户点击"连续语音"按钮
  ↓
idle → listening（开始监听麦克风）
  ↓
检测到声音 → recording（开始录音）
  ↓
检测到1.5秒静音 → recognizing（停止录音，调用识别API）
  ↓
识别成功 → 自动发送消息 → waiting_ai（等待AI流式输出完成）
  ↓
AI输出完成 → listening（继续监听下一段）
  ↓
用户点击"停止连续语音"按钮 → idle（清理资源）
```

**错误处理**：
- 识别失败 → 显示Toast提示 → 继续 listening（不中断循环）
- 网络错误 → 显示Toast提示 → 继续 listening
- 麦克风权限丢失 → 停止连续模式 → 回到 idle

### 3. 与AI生成状态的协调
**决策**：连续模式下，等待 `state.isGenerating` 变为 `false` 后再开始下一轮监听。

**实现方式**：
```javascript
// 使用 watch 监听 state.isGenerating
watch(() => state.isGenerating, (isGenerating) => {
  if (!isGenerating && continuousState.value === 'waiting_ai') {
    // AI完成，继续监听
    startNextListening();
  }
});
```

**替代方案**：
- 方案A：立即打断AI回答 → 用户体验差，丢失AI内容
- 方案B：同时进行，缓存录音 → 复杂度高，对话不连贯

**选择理由**：符合用户选择（等待AI完成），实现简单，对话连贯性好。

### 4. 视觉反馈设计
**决策**：三重反馈机制确保用户清晰感知连续模式状态。

**组件设计**：
1. **顶部状态栏**：
   - 位置：ChatBox 顶部，标题栏下方
   - 样式：墨绿色背景（#006644）、白色文字、高度 32px
   - 内容：显示当前状态（"正在连续语音对话中..." / "正在录音..." / "正在识别..."）
   - 显示条件：仅在连续模式开启时显示

2. **连续语音按钮**：
   - 位置：语音输入按钮右侧，发送按钮左侧
   - 默认状态：灰色背景（#f5f5f5）、文字"连续对话"
   - 激活状态：墨绿色背景（#006644）、白色文字、闪烁动画（1.5秒周期）
   - 禁用条件：单次语音输入进行中时禁用

3. **麦克风波形动画**：
   - 位置：状态栏右侧或按钮内部
   - 样式：3-5个竖条（宽度4px，间距4px，高度随音量变化10-30px）
   - 颜色：白色（状态栏内）或墨绿色（按钮内）
   - 更新频率：60fps（使用 requestAnimationFrame）

### 5. 音量分析与波形动画
**决策**：使用 Web Audio API 的 AnalyserNode 实时获取音量数据，驱动波形动画。

**实现细节**：
```javascript
// 创建音频分析节点
const audioContext = new AudioContext();
const analyser = audioContext.createAnalyser();
analyser.fftSize = 256;

// 连接麦克风流
const source = audioContext.createMediaStreamSource(stream);
source.connect(analyser);

// 实时获取音量数据
const dataArray = new Uint8Array(analyser.frequencyBinCount);
function updateWaveform() {
  analyser.getByteTimeDomainData(dataArray);
  const volume = calculateRMS(dataArray); // 计算RMS音量
  // 更新波形条高度
  waveformBars.forEach((bar, i) => {
    bar.height = mapVolume(volume, i); // 映射到10-30px
  });
  requestAnimationFrame(updateWaveform);
}
```

**性能优化**：
- 使用 `requestAnimationFrame` 控制更新频率
- 仅在连续模式开启时运行动画循环
- 停止连续模式时清理 AudioContext 资源

## Risks / Trade-offs

### 风险1：静音检测误触发
**风险**：用户思考停顿时可能被误判为静音，提前停止录音。
**缓解措施**：
- 设置合理的静音阈值（1.5秒）和音量阈值（RMS < 5）
- 提供用户反馈（Toast提示"未识别到内容"），用户可继续说话
- 未来可考虑添加阈值配置选项

### 风险2：长时间运行的资源占用
**风险**：连续模式长时间运行可能导致内存泄漏或性能下降。
**缓解措施**：
- 每次录音结束后清理 MediaRecorder 和音频轨道
- 使用 `mediaRecorder.stream.getTracks().forEach(track => track.stop())` 释放资源
- 停止连续模式时清理 AudioContext 和定时器

### 风险3：与现有功能的冲突
**风险**：连续模式可能与单次语音输入、手动输入产生冲突。
**缓解措施**：
- 连续模式开启时禁用单次语音按钮和输入框
- 单次语音输入进行中时禁用连续语音按钮
- 使用互斥状态管理确保同一时间只有一种输入方式激活

### Trade-off：等待AI完成 vs 立即打断
**选择**：等待AI完成后再继续监听
**优点**：对话连贯，不丢失AI内容，实现简单
**缺点**：用户需要等待AI回答完成才能说下一句，可能感觉不够"实时"
**理由**：用户明确选择此方案，且符合当前物理学习场景（用户需要理解AI回答后再提问）

## Migration Plan
无需迁移，纯新增功能，不影响现有代码和数据。

## Open Questions
1. **是否需要添加连续模式的快捷键？**（如按住空格键开启/关闭）
   - 建议：初版不实现，根据用户反馈决定

2. **是否需要记录连续模式的使用偏好？**（如用户上次是否开启连续模式）
   - 建议：初版不实现，避免过度设计

3. **是否需要添加连续模式的使用统计？**（如识别成功率、平均对话轮次）
   - 建议：初版不实现，后续可考虑添加
