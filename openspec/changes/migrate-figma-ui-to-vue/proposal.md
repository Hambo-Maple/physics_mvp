# Change: 将 Figma Make 导出的 React UI 迁移到 Vue 3 项目

## Why
当前项目使用纯手写 CSS 和简单的 UI 结构，缺乏现代化的设计系统和组件库支持。Figma Make 导出的代码基于 shadcn/ui + Tailwind CSS，提供了高质量的现代化 UI 组件和设计系统。通过将其迁移到 Vue 3，可以：
- 获得完整的设计系统（shadcn-vue + Tailwind CSS）
- 提升 UI 的现代化程度和用户体验
- 保持代码可维护性和可扩展性
- 严格还原 Figma 设计稿的视觉效果

## What Changes
- **引入 shadcn-vue 和 Tailwind CSS**：替换当前的纯手写 CSS 方案
- **迁移 UI 组件**：将 React 的 shadcn 组件（Button, ScrollArea, Card, Input, Textarea 等）转换为 shadcn-vue 对应组件
- **保留核心逻辑**：完整保留 p5.js 物理仿真、KaTeX 公式渲染、智谱 AI 调用、语音识别等核心功能
- **还原布局设计**：严格按照 Figma 设计实现现代双栏布局（左侧 ChatBox 30%，右侧 VisualCanvas 70%）
- **样式系统升级**：从 A2UI 颜色系统（墨绿色 #006644）迁移到 Figma 的设计 token 系统
- **交互对齐**：实现 Figma 代码中的状态管理（Loading 状态、输入框聚焦效果、动画过渡等）

## Impact
- **破坏性变更 (BREAKING)**：
  - 移除所有现有的手写 CSS 文件（global.css, ChatBox.css, VisualCanvas.css 等）
  - 更新 package.json 依赖（添加 shadcn-vue, Tailwind CSS, Radix Vue 等）
  - 重构所有 Vue 组件的模板和样式部分

- **受影响的文件**：
  - `src/App.vue` - 主布局重构
  - `src/components/ChatBox.vue` - 聊天界面重构
  - `src/components/VisualCanvas.vue` - 可视化区域重构
  - `src/components/ProjectileMotion.vue` - 保留逻辑，更新样式
  - `src/assets/*.css` - 全部替换为 Tailwind 配置
  - `vite.config.js` - 添加 Tailwind 插件配置
  - `package.json` - 更新依赖列表

- **不受影响的部分**：
  - `src/store.js` - 状态管理逻辑保持不变
  - `src/utils/*` - 所有工具函数（zhipuClient, katex, voice, paramParser 等）保持不变
  - `server.js` - 后端服务保持不变
  - 物理计算逻辑、AI 调用逻辑、语音识别逻辑完全保留

- **新增的能力**：
  - 完整的设计系统和主题支持（亮色/暗色模式）
  - 可复用的 UI 组件库（50+ shadcn-vue 组件）
  - 响应式设计能力（虽然当前仅适配 PC 端）
  - 更好的无障碍支持（Radix Vue 提供）
