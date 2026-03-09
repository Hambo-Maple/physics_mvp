# Design: Physics Visualization Web Application

## Architecture Overview

### System Components
```
┌─────────────────────────────────────────────────────────┐
│                      App.vue (Root)                      │
│  - 左右分栏布局 (30% / 70%)                              │
│  - 监听 currentVisualType 变化并触发画布更新             │
└─────────────────────────────────────────────────────────┘
           │                                    │
           ▼                                    ▼
┌──────────────────────┐           ┌──────────────────────┐
│   ChatBox.vue        │           │  VisualCanvas.vue    │
│  - 标题栏            │           │  - 状态栏            │
│  - 消息流区域        │◄─────────►│  - 画布挂载点        │
│  - 输入区            │  联动机制  │  - 控制区            │
└──────────────────────┘           └──────────────────────┘
           │                                    │
           ▼                                    ▼
┌─────────────────────────────────────────────────────────┐
│              Global State (store/index.js)               │
│  - messageList: 对话历史                                 │
│  - currentVisualType: 当前可视化类型                     │
└─────────────────────────────────────────────────────────┘
```

### Data Flow
1. **用户输入** → ChatBox 发送消息 → 添加到 messageList
2. **AI 回复逻辑** → 解析用户输入 → 生成回复内容 → 提取触发关键词
3. **触发可视化** → 更新 currentVisualType → App.vue 监听变化 → 调用 VisualCanvas.updateCanvas()
4. **画布更新** → 更新状态栏文字 → 更新画布占位提示

## Key Design Decisions

### 1. 状态管理方案
**决策**: 使用 Vue 3 内置的 `reactive` 创建全局状态对象，而非引入 Pinia/Vuex

**理由**:
- 项目规模较小，状态简单（仅消息列表和可视化类型）
- 避免引入额外依赖，保持项目轻量
- `reactive` 足以满足跨组件状态共享需求

**实现**:
```javascript
// src/store/index.js
import { reactive } from 'vue';

const state = reactive({
  messageList: [],
  currentVisualType: ''
});

export const addMessage = (message) => {
  state.messageList.push(message);
};

export const updateVisualType = (type) => {
  state.currentVisualType = type;
};

export default state;
```

### 2. 上下文关联策略
**决策**: 采用基于关键词匹配 + 最近消息历史的简单策略

**理由**:
- 无需引入 NLP 库或 AI 接口，纯前端实现
- 满足 MVP 阶段的基本上下文需求
- 易于扩展（后续可替换为真实 AI 接口）

**实现逻辑**:
```javascript
// 上下文关联函数
function generateAIReply(userInput, messageHistory) {
  // 1. 检查指代词（"这个"、"它"、"该模型"）
  if (/这个|它|该模型/.test(userInput)) {
    // 查找最近的可视化类型或话题
    const lastVisualMessage = findLastVisualMessage(messageHistory);
    if (lastVisualMessage) {
      return generateContextualReply(userInput, lastVisualMessage);
    }
  }

  // 2. 检查直接触发关键词
  if (userInput.includes('平抛')) {
    return {
      content: '收到，已为你加载平抛运动的可视化模型。公式：y = 1/2gt²，x = v₀t。',
      trigger: 'PROJECTILE'
    };
  }

  // 3. 默认回复
  return {
    content: `已收到你的问题：${userInput}，相关可视化即将展示。`,
    trigger: ''
  };
}
```

### 3. 可视化接口设计
**决策**: 提供 DOM 挂载点 + 类型参数传递机制，预留详细集成注释

**理由**:
- 当前阶段不实现实际渲染，避免过早引入复杂依赖
- 提供清晰的集成路径，方便后续接入 p5.js/Three.js
- 通过占位提示验证联动逻辑正确性

**接口设计**:
```vue
<!-- VisualCanvas.vue -->
<template>
  <div id="canvas-mount-point">
    <p>{{ placeholderText }}</p>
    <!-- 预留公式渲染容器 -->
    <div id="formula-container"></div>
  </div>
</template>

<script setup>
// 可视化渲染入口
function updateCanvas(type) {
  // TODO: 集成 p5.js/Three.js
  // 1. 根据 type 初始化对应的渲染器
  // 2. PROJECTILE: 创建平抛运动动画
  // 3. FORMULA: 使用 MathJax/KaTeX 渲染公式

  // 当前仅更新占位提示
  if (type === 'PROJECTILE') {
    placeholderText.value = '平抛运动画布已准备就绪';
  } else if (type === 'FORMULA') {
    placeholderText.value = '物理公式画布已准备就绪';
  }
}
</script>
```

### 4. 视觉样式架构
**决策**: 纯原生 CSS，样式文件按组件拆分，全局样式统一管理

**理由**:
- 避免引入 SCSS/第三方 UI 库，减少构建复杂度
- 组件样式独立，便于维护和调整
- 全局样式（颜色变量、通用类）集中管理，保证一致性

**文件结构**:
```
src/assets/
├── global.css        # 全局样式（CSS Reset、颜色变量、通用类）
├── ChatBox.css       # 对话组件样式
└── VisualCanvas.css  # 可视化组件样式
```

**颜色变量定义**:
```css
/* global.css */
:root {
  --color-primary: #006644;      /* 墨绿色 */
  --color-primary-hover: #008055;
  --color-primary-active: #004d33;
  --color-bg-light: #f5f5f5;     /* 极浅灰 */
  --color-bg-white: #fff;
  --color-text-dark: #333;       /* 深灰 */
  --color-text-light: #999;
  --color-border: #e0e0e0;       /* 边框灰 */
}
```

## Component Specifications

### ChatBox.vue
**职责**: 管理对话交互、消息展示、用户输入

**关键方法**:
- `sendMessage()`: 发送用户消息，触发 AI 回复逻辑
- `generateAIReply()`: 根据用户输入和历史消息生成 AI 回复
- `scrollToBottom()`: 滚动消息流到底部
- `startVoiceRecognition()`: 语音输入（预留接口）

**状态**:
- `inputValue`: 输入框绑定值
- `isRecording`: 语音识别状态

### VisualCanvas.vue
**职责**: 管理可视化画布、状态栏、控制区

**关键方法**:
- `updateCanvas(type)`: 更新画布内容（预留渲染接口）
- `resetCanvas()`: 重置画布到初始状态

**状态**:
- `statusText`: 状态栏文字
- `placeholderText`: 画布占位提示

### App.vue
**职责**: 整体布局、组件集成、状态联动

**关键逻辑**:
- 使用 `watch` 监听 `currentVisualType` 变化
- 通过 `ref` 获取 VisualCanvas 组件实例，调用 `updateCanvas` 方法

## Testing Strategy
由于是前端模拟逻辑，测试主要通过手动验证：

1. **布局测试**: 检查 100vh 布局无溢出，左右分栏比例正确
2. **对话测试**: 发送消息 → 验证 AI 回复 → 检查消息流滚动
3. **联动测试**: 发送 "平抛运动" → 验证画布状态栏更新 → 检查占位提示变化
4. **上下文测试**: 发送 "平抛运动" → 发送 "这个公式" → 验证 AI 识别上下文
5. **样式测试**: 检查按钮 hover/active 状态、颜色规范、字体大小

## Future Enhancements
1. 接入真实 AI 对话接口（如 OpenAI API、Claude API）
2. 集成 p5.js 实现平抛运动动画渲染
3. 集成 MathJax/KaTeX 实现物理公式渲染
4. 接入百度语音识别 SDK
5. 添加更多物理场景类型（自由落体、圆周运动等）
6. 支持移动端响应式布局
