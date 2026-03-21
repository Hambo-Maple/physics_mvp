# Change: 重构 Figma 布局与界面风格（整合替代旧提案）

## Why

两个先前提案（`migrate-figma-ui-to-vue` 和 `add-figma-layout-and-style-polish`）均未执行，且存在部分重叠。当前项目已完成基础设施迁移（Tailwind CSS 已配置、shadcn-vue 组件已在 `src/components/ui/` 中存在、lucide-vue-next 已安装），但以下三类工作仍未落地：

1. **布局动态化**：App.vue 仍是固定 30/70 静态分栏，Figma 设计要求可拖拽调整比例、左右面板可独立关闭并显示浮动重开按钮。
2. **ChatBox Header 重构**：缺少渐变图标容器、面板操作按钮组（关闭画布 / 关闭自身）。
3. **VisualCanvas Header 重构**：缺少渐变图标容器、Zap 图标、英文子标题、关闭按钮。
4. **按钮/输入框样式打磨**：Button 缺少 `rounded-xl` 圆角和渐变色；Textarea 缺少 `rounded-xl border-gray-200` 样式；整体背景缺少渐变。

本提案整合替代两个旧提案，聚焦以上四类 UI 层改造，不修改任何业务逻辑。

## What Changes

### 1. 安装依赖
- 安装 `vue-resizable-panels`（对齐 Figma 的 `react-resizable-panels`）

### 2. App.vue 布局重构
- 引入 `PanelGroup + Panel + PanelResizeHandle`（来自 vue-resizable-panels）
- 添加 `isChatOpen` / `isCanvasOpen` 两个 `ref` 状态
- 面板关闭时在对应角落显示渐变浮动重开按钮
- 整体背景改为 `bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50`

### 3. ChatBox 新增 Props + Header 重构
- 新增 props：`onToggleCanvas`, `isCanvasOpen`, `onClose`
- Header 左侧：渐变图标容器（blue→indigo）+ MessageSquare 图标 + 标题
- Header 右侧：「关闭画布/打开画布」按钮 + 「关闭自身」X 按钮
- 所有 `<script setup>` 业务逻辑（发送/语音/连续对话/参数控制）一行不改

### 4. VisualCanvas 新增 Props + Header 重构
- 新增 props：`onClose`, `onToggleChat`, `isChatOpen`
- PROJECTILE 模式 Header：渐变图标容器（purple→pink）+ Zap 图标 + 中英文双行标题 + 重置/关闭按钮
- 默认模式 Header：同样添加渐变图标容器 + ToggleChat 按钮
- p5.js canvas-mount-point DOM ID 保持不变

### 5. 全局样式打磨
- Button `outline` variant：`rounded-xl border-gray-200 hover:bg-gray-50`
- Button primary（发送）：`rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700`
- Textarea：`rounded-xl border-gray-200 focus:border-blue-300 min-h-[80px] resize-none`
- 输入区背景：`bg-gray-50/50`
- 拖拽手柄：`w-1 bg-gray-200 hover:bg-blue-400` + 中心圆点指示器

## Impact

### 受影响的文件
- `package.json` — 添加 `vue-resizable-panels`
- `src/App.vue` — 主布局重构（PanelGroup + 面板状态管理 + 浮动按钮）
- `src/components/ChatBox.vue` — 新增 props + Header 模板重构（script 不变）
- `src/components/VisualCanvas.vue` — 新增 props + Header 模板重构

### 不受影响的部分
- `src/store.js` / `src/store/*` — 全局状态管理完全保留
- `src/utils/*` — zhipuClient、katex、voice、paramParser 完全保留
- `src/components/ProjectileMotion.vue` — p5.js 仿真逻辑完全保留
- `src/components/ui/*` — shadcn-vue 组件完全保留
- `server.js` — 后端服务完全保留
- ChatBox `<script setup>` 所有业务逻辑（发送/语音/连续对话/参数/动画控制）

### 破坏性变更
- App.vue 布局从固定 flex 改为 PanelGroup；子组件需接收新 props
- ChatBox 新增必要 props：`onToggleCanvas`, `isCanvasOpen`, `onClose`
- VisualCanvas 新增必要 props：`onClose`, `onToggleChat`, `isChatOpen`

### 归档的旧提案
- `migrate-figma-ui-to-vue`（0/110 任务未执行，基础设施部分已完成，剩余 UI 工作由本提案覆盖）
- `add-figma-layout-and-style-polish`（0 任务未执行，完整由本提案覆盖）
