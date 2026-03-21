# Design: Figma UI 迁移到 Vue 3 技术方案

## Context
当前项目是一个物理可视化交互网页应用，使用 Vue 3 + 纯手写 CSS 构建。现需要将 Figma Make 导出的 React + shadcn/ui 代码迁移到 Vue 3 项目中，以获得现代化的设计系统和更好的用户体验。

**关键约束**：
- 必须保留所有核心业务逻辑（p5.js 物理仿真、KaTeX 公式渲染、智谱 AI 调用、语音识别）
- 必须严格还原 Figma 设计稿的视觉效果
- 仅适配 PC 端，不需要移动端响应式
- 项目使用 Vue 3 Composition API + `<script setup>` 语法

**技术栈对比**：
| 维度 | 当前方案 | 目标方案 |
|------|---------|---------|
| UI 框架 | 无 | shadcn-vue |
| 样式方案 | 纯手写 CSS | Tailwind CSS |
| 组件库 | 无 | Radix Vue (无障碍原语) |
| 设计系统 | A2UI (墨绿色) | Figma 设计 token |
| 状态管理 | Vue reactive | Vue reactive (保持不变) |

## Goals / Non-Goals

**Goals**：
- 完整迁移 Figma UI 设计到 Vue 3 项目
- 引入 shadcn-vue + Tailwind CSS 设计系统
- 保留所有现有业务逻辑和功能
- 提升 UI 现代化程度和用户体验
- 建立可维护的组件化架构

**Non-Goals**：
- 不改变核心业务逻辑（物理计算、AI 调用、语音识别）
- 不实现移动端响应式（仅 PC 端）
- 不重构状态管理方案（继续使用 Vue reactive）
- 不改变后端 API 接口

## Decisions

### 1. UI 组件库选择：shadcn-vue

**决策**：使用 shadcn-vue 作为 UI 组件库

**理由**：
- shadcn-vue 是 shadcn/ui 的 Vue 3 官方移植版本，API 和组件结构与 React 版本高度一致
- 基于 Radix Vue 提供无障碍支持和可组合的原语
- 组件代码直接复制到项目中，完全可控和可定制
- 与 Tailwind CSS 深度集成，样式管理清晰

**替代方案**：
- Element Plus：过于重量级，设计风格与 Figma 不符
- Naive UI：API 差异大，迁移成本高
- Ant Design Vue：设计语言与 shadcn 差异大

### 2. 样式方案：Tailwind CSS

**决策**：使用 Tailwind CSS 替换纯手写 CSS

**理由**：
- Figma 导出的代码使用 Tailwind 类名，可以直接复用
- 提供完整的设计 token 系统（颜色、间距、圆角等）
- 与 shadcn-vue 深度集成，组件样式一致性好
- 支持主题定制（亮色/暗色模式）

**迁移策略**：
- 保留 Figma 的 theme.css 中的 CSS 变量定义
- 配置 Tailwind 使用这些变量作为设计 token
- 移除所有手写 CSS 文件（global.css, ChatBox.css 等）

### 3. 组件映射策略

**React → Vue 组件映射表**：

| React 组件 | Vue 组件 | 用途 |
|-----------|---------|------|
| `<Button>` | `<Button>` | 按钮（发送、语音输入、连续对话） |
| `<Input>` | `<Input>` | 输入框（暂不使用，保留 textarea） |
| `<Textarea>` | `<Textarea>` | 文本输入区域 |
| `<ScrollArea>` | `<ScrollArea>` | 消息流滚动区域 |
| `<Card>` | `<Card>` | 消息气泡、可视化容器 |
| `<Badge>` | `<Badge>` | 状态标签（录音中、识别中） |
| `<Progress>` | `<Progress>` | 加载进度条 |
| `<Separator>` | `<Separator>` | 分隔线 |
| `<Skeleton>` | `<Skeleton>` | 骨架屏（AI 回复加载） |

**状态管理映射**：
- React `useState` → Vue `ref`
- React `useEffect` → Vue `watch` / `watchEffect`
- React `useRef` → Vue `ref` (DOM 引用)
- React `useMemo` → Vue `computed`

### 4. 布局架构

**决策**：保持左右双栏布局，使用 Tailwind Flex 实现

**布局结构**：
```vue
<template>
  <div class="flex h-screen overflow-hidden">
    <!-- 左侧 ChatBox (30%) -->
    <div class="w-[30%] border-r border-border">
      <ChatBox />
    </div>

    <!-- 右侧 VisualCanvas (70%) -->
    <div class="flex-1">
      <VisualCanvas />
    </div>
  </div>
</template>
```

**关键样式类**：
- `h-screen`：100vh 高度
- `overflow-hidden`：禁止页面滚动
- `w-[30%]`：左侧固定 30% 宽度
- `flex-1`：右侧自适应剩余空间
- `border-r border-border`：右侧边框

### 5. 核心逻辑保留策略

**保留的模块**（不做任何修改）：
- `src/store.js` - 全局状态管理
- `src/utils/zhipuClient.js` - 智谱 AI 调用
- `src/utils/katex.js` - KaTeX 公式渲染
- `src/utils/voice.js` - 语音识别
- `src/utils/paramParser.js` - 参数解析
- `src/utils/streamHandler.js` - 流式输出处理
- `src/utils/textFormatter.js` - 文本格式化
- `server.js` - 后端服务

**需要更新的部分**（仅更新模板和样式）：
- `src/App.vue` - 更新布局模板，保留逻辑
- `src/components/ChatBox.vue` - 更新 UI 组件，保留所有事件处理和状态管理
- `src/components/VisualCanvas.vue` - 更新容器样式，保留画布逻辑
- `src/components/ProjectileMotion.vue` - 保留 p5.js 逻辑，更新容器样式

### 6. 依赖安装和配置

**新增依赖**：
```json
{
  "dependencies": {
    "radix-vue": "^1.9.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.3.0",
    "lucide-vue-next": "^0.400.0"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.1.12",
    "tailwindcss": "^4.1.12",
    "autoprefixer": "^10.4.19"
  }
}
```

**Vite 配置更新**：
```js
// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss()
  ],
  // ... 其他配置保持不变
})
```

**Tailwind 配置**：
```js
// tailwind.config.js
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        // ... 其他颜色
      }
    }
  }
}
```

## Risks / Trade-offs

**风险 1：依赖包体积增加**
- **影响**：项目打包体积从 ~500KB 增加到 ~1.5MB
- **缓解**：Tailwind CSS 支持 Tree-shaking，未使用的样式会被自动移除；shadcn-vue 组件按需引入

**风险 2：学习曲线**
- **影响**：团队需要学习 Tailwind CSS 和 shadcn-vue 的使用方式
- **缓解**：shadcn-vue 文档完善，Tailwind 有丰富的社区资源；组件代码可读性高

**风险 3：现有功能回归测试**
- **影响**：UI 重构可能引入新的 bug
- **缓解**：保持核心逻辑不变，仅更新模板和样式；分阶段迁移，每个组件迁移后立即测试

**Trade-off 1：设计系统灵活性 vs 一致性**
- **选择**：优先保证与 Figma 设计的一致性
- **理由**：项目目标是还原 Figma 设计，而非创建自定义设计系统

**Trade-off 2：组件库完整性 vs 项目需求**
- **选择**：仅引入当前需要的组件（Button, ScrollArea, Card 等），不引入全部 50+ 组件
- **理由**：减少项目复杂度，按需扩展

## Migration Plan

### 阶段 1：环境准备（预计 1 小时）
1. 安装 shadcn-vue 和 Tailwind CSS 依赖
2. 配置 Vite 和 Tailwind
3. 复制 Figma 的 theme.css 到项目
4. 创建 `src/components/ui/` 目录

### 阶段 2：基础组件迁移（预计 2 小时）
1. 从 shadcn-vue 复制基础组件（Button, Input, Textarea, ScrollArea, Card）
2. 调整组件路径和导入方式
3. 测试组件独立渲染

### 阶段 3：布局重构（预计 1 小时）
1. 重构 `App.vue` 主布局
2. 使用 Tailwind Flex 实现左右双栏
3. 测试布局响应和边框样式

### 阶段 4：ChatBox 组件迁移（预计 3 小时）
1. 更新 ChatBox 模板，使用 shadcn-vue 组件
2. 保留所有事件处理逻辑（sendMessage, startVoiceRecognition 等）
3. 保留所有状态管理（inputValue, voiceState, toastMessage 等）
4. 测试消息发送、语音输入、连续对话功能

### 阶段 5：VisualCanvas 组件迁移（预计 2 小时）
1. 更新 VisualCanvas 容器样式
2. 保留 ProjectileMotion 组件引用和逻辑
3. 测试可视化渲染和参数控制

### 阶段 6：样式细节调整（预计 2 小时）
1. 调整消息气泡样式（用户/AI 区分）
2. 调整按钮状态样式（hover, active, disabled）
3. 调整滚动条样式
4. 调整动画过渡效果

### 阶段 7：全面测试（预计 2 小时）
1. 功能测试：消息发送、AI 回复、语音输入、连续对话、参数控制
2. 布局测试：100vh 无溢出、左右分栏比例
3. 样式测试：颜色、字体、间距、圆角
4. 交互测试：按钮状态、输入框聚焦、动画过渡

### 回滚计划
如果迁移失败，可以通过 Git 回滚到迁移前的版本：
```bash
git checkout <commit-before-migration>
```

## Open Questions

1. **是否需要支持暗色模式？**
   - Figma 设计包含暗色模式的 token，但当前项目未提及此需求
   - 建议：先实现亮色模式，暗色模式作为后续扩展

2. **是否需要保留 A2UI 的墨绿色主题？**
   - Figma 设计使用不同的颜色系统（黑色 #030213 为主色）
   - 建议：完全采用 Figma 的设计 token，放弃 A2UI 颜色系统

3. **是否需要引入动画库（如 Framer Motion Vue）？**
   - Figma 代码中使用了 motion 库做动画
   - 建议：先使用 Tailwind 的 transition 类实现基础动画，复杂动画后续按需引入

4. **是否需要迁移 Figma 代码中的示例内容（生活记录卡片）？**
   - Figma App.tsx 是一个示例应用，与物理可视化无关
   - 建议：仅提取设计系统和组件，不迁移示例内容
