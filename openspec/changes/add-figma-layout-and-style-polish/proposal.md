# Change: 还原 Figma 布局增强与界面风格打磨

## Why

当前项目在 `migrate-figma-ui-to-vue` 提案中完成了基础 UI 迁移（Tailwind CSS + shadcn-vue），但仍有两类关键视觉/交互差距未弥补：

1. **布局层**：App.vue 仍是固定 30/70 静态分栏，而 Figma 设计使用 `react-resizable-panels` 实现了：
   - 左右面板比例可拖拽调整
   - 左侧（Chat）和右侧（Canvas）面板可独立关闭
   - 面板关闭后在对应角落显示浮动重开按钮

2. **风格层**：当前 Button、Header、输入区等组件样式与 Figma 设计存在明显差距：
   - 按钮缺少 `rounded-xl` 圆角和渐变色（蓝→靛蓝）
   - ChatBox Header 缺少渐变图标背景和操作按钮组（关闭画布、关闭自身）
   - VisualCanvas Header 缺少渐变图标背景、Zap 图标和子标题
   - 输入区背景 `bg-gray-50/50` 与按钮圆角未对齐 Figma
   - 浮动重开按钮缺少渐变色样式

## What Changes

### 布局增强
- **引入 `vue-resizable-panels`**：替换 App.vue 中的固定 flex 分栏，实现 `PanelGroup + Panel + PanelResizeHandle`
- **面板状态管理**：在 App.vue 中添加 `isChatOpen` / `isCanvasOpen` 响应式状态
- **ChatBox props 扩展**：添加 `onToggleCanvas`, `isCanvasOpen`, `onClose` props（对齐 Figma ChatBoxProps）
- **VisualCanvas props 扩展**：添加 `onClose`, `onToggleChat`, `isChatOpen` props
- **浮动按钮**：Chat/Canvas 关闭时，在左上/右上角显示渐变浮动重开按钮

### 界面风格打磨
- **Button 组件**：`outline` variant 使用 `rounded-xl border-gray-200 hover:bg-gray-50`；主按钮使用 `rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700`
- **ChatBox Header**：渐变图标容器 `bg-gradient-to-br from-blue-100 to-indigo-100 w-10 h-10 rounded-xl`，`MessageSquare` 图标，操作按钮组（关闭画布 / 关闭自身）
- **VisualCanvas Header**（PROJECTILE 模式）：`bg-gradient-to-br from-purple-100 to-pink-100 w-10 h-10 rounded-xl`，`Zap` 图标，英文子标题
- **输入区**：`bg-gray-50/50` 背景，Textarea `rounded-xl border-gray-200 focus:border-blue-300`
- **语音按钮**：`flex-1 rounded-xl`，发送按钮保持渐变色
- **整体背景**：App 根容器 `bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50`
- **拖拽手柄**：`w-1 bg-gray-200 hover:bg-blue-400` + 中心圆点指示器

## Impact

### 受影响的文件
- `src/App.vue` — 主布局重构（引入 vue-resizable-panels，添加面板状态）
- `src/components/ChatBox.vue` — props 扩展 + Header/输入区样式打磨
- `src/components/VisualCanvas.vue` — props 扩展 + Header 样式打磨
- `src/components/ui/Button.vue` — 不修改组件本身，通过 class 覆盖实现
- `package.json` — 添加 `vue-resizable-panels` 依赖

### 不受影响的部分
- `src/store.js` — 状态管理逻辑完全保留
- `src/utils/*` — 所有工具函数（zhipuClient, katex, voice, paramParser）完全保留
- `src/components/ProjectileMotion.vue` — p5.js 物理仿真逻辑完全保留
- `server.js` — 后端服务完全保留
- 所有 ChatBox.vue 的 `<script setup>` 业务逻辑（发送消息、语音识别、连续对话等）

### 破坏性变更
- App.vue 布局从固定 flex 改为 PanelGroup，子组件需通过 props 接收面板控制回调
- ChatBox 新增必要 props（`onToggleCanvas`, `isCanvasOpen`, `onClose`）
- VisualCanvas 新增必要 props（`onClose`, `onToggleChat`, `isChatOpen`）
