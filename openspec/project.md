# Project Context

## Purpose
物理可视化交互网页应用 - 为物理学习和教学提供交互式可视化工具，用户可通过自然语言对话触发不同的物理场景可视化（如平抛运动、物理公式渲染等）。

## Tech Stack
- Vue 3 (Composition API + `<script setup>`)
- Vite 5.x
- 纯原生 CSS（无 SCSS/第三方 UI 库）
- Vue 3 内置 reactive 状态管理

## Project Conventions

### Code Style
- 所有核心函数、状态、组件传参添加详尽中文注释
- 变量/函数命名采用小驼峰（camelCase）：如 `messageList`、`sendMessage`
- 组件名采用大驼峰（PascalCase）：如 `ChatBox.vue`、`VisualCanvas.vue`
- 布局使用 Flex + 百分比/px 混合（PC 端固定适配，无需响应式）

### Architecture Patterns
- 左右分栏布局：左侧 30% 对话区，右侧 70% 可视化区
- 100vh 视口高度，overflow: hidden，避免页面整体滚动
- 组件间通过全局 reactive 状态通信
- 对话与可视化通过触发关键词联动

### Visual Design System (A2UI)
- 主色调：墨绿色 (#006644)
- 辅助色：极浅灰 (#f5f5f5)、深灰 (#333)、白色 (#fff)、边框灰 (#e0e0e0)
- 所有容器：1px 实线边框 (#e0e0e0)，圆角 4px
- 按钮默认：背景 #f5f5f5，hover #e8e8e8，active #006644（文字变白）
- 主按钮：背景 #006644（文字白色），hover #008055，active #004d33
- 字体：无衬线（微软雅黑/Inter），标题 16px，普通 14px，辅助 12px

### Testing Strategy
- 手动验证为主（前端模拟逻辑）
- 布局测试：100vh 无溢出，左右分栏比例正确
- 对话测试：发送消息、AI 回复、消息流滚动
- 联动测试：触发关键词 → 画布状态更新
- 上下文测试：指代词识别（"平抛运动" → "这个公式"）
- 样式测试：按钮 hover/active 状态、颜色规范、字体大小

### Git Workflow
- 暂无特定分支策略（初始项目）
- 提交信息使用中文，描述清晰

## Domain Context
- 物理学习辅助工具，面向学生和教师
- 支持平抛运动、物理公式等场景的可视化
- 对话系统采用前端模拟逻辑（关键词匹配 + 简单上下文关联）
- 预留第三方库集成接口：p5.js/Three.js（可视化渲染）、MathJax/KaTeX（公式渲染）、百度语音 SDK（语音识别）

## Important Constraints
- 仅适配 PC 端，不支持移动端响应式
- 不实现真实 AI 对话接口（使用前端模拟）
- 不实现实际可视化渲染（仅预留接口和占位提示）
- 不实现真实语音识别（仅预留集成接口）
- 禁止使用 SCSS/第三方 UI 库，必须使用纯原生 CSS

## External Dependencies
- 无外部 API 依赖（前端独立运行）
- 预留集成接口：
  - p5.js 或 Three.js（可视化渲染库）
  - MathJax 或 KaTeX（数学公式渲染库）
  - 百度语音 Web SDK（语音识别服务）
