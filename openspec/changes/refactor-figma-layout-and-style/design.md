# Design: 重构 Figma 布局与界面风格技术方案

## Context

基础设施已就绪（Tailwind CSS、shadcn-vue 组件、lucide-vue-next），本提案聚焦纯 UI 层改造。参考源：`ui_style/src/app/App.tsx`、`ui_style/src/app/components/ChatBox.tsx`、`ui_style/src/app/components/VisualCanvas.tsx`。

## Decisions

### 1.