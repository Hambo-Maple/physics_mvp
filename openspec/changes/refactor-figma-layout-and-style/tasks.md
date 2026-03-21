# Tasks: 重构 Figma 布局与界面风格

## 0. 前置：归档旧提案
- [x] 0.1 归档 `migrate-figma-ui-to-vue`（已被本提案替代，验证失败跳过）
- [x] 0.2 归档 `add-figma-layout-and-style-polish`（已被本提案替代，验证失败跳过）

## 1. 安装依赖
- [x] 1.1 安装 `vue-resizable-panels`（`npm install vue-resizable-panels`）
- [x] 1.2 验证 package.json 中新增依赖

## 2. App.vue 布局重构
- [x] 2.1 引入 `PanelGroup`、`Panel`、`PanelResizeHandle` from `vue-resizable-panels`
- [x] 2.2 添加 `isChatOpen = ref(true)` 和 `isCanvasOpen = ref(true)` 状态
- [x] 2.3 添加 `handleToggleCanvas()` 和 `handleToggleChat()` 方法
- [x] 2.4 将固定 flex 分栏替换为 `PanelGroup direction="horizontal"`
- [x] 2.5 左侧 Panel：`v-if="isChatOpen"`，defaultSize 根据 isCanvasOpen 动态调整
- [x] 2.6 添加 `PanelResizeHandle`（仅当两个面板都打开时显示）
- [x] 2.7 右侧 Panel：`v-if="isCanvasOpen"`
- [x] 2.8 添加浮动「打开对话框」按钮（`v-if="!isChatOpen"`，左上角，blue→indigo 渐变）
- [x] 2.9 添加浮动「打开画布」按钮（`v-if="!isCanvasOpen"`，右上角，purple→pink 渐变）
- [x] 2.10 根容器背景改为 `bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50`
- [x] 2.11 向 ChatBox 传递 `onToggleCanvas`、`isCanvasOpen`、`onClose` props
- [x] 2.12 向 VisualCanvas 传递 `onClose`、`onToggleChat`、`isChatOpen` props
- [x] 2.13 保留 `visualCanvasRef` 引用和 `watch(state.currentVisualType)` 逻辑
- [ ] 2.14 测试：两面板均显示、拖拽调整比例、分别关闭后浮动按钮出现、重开后恢复

## 3. ChatBox Header 重构
- [x] 3.1 在 `defineProps` 中添加 `onToggleCanvas`、`isCanvasOpen`、`onClose` 三个 props
- [x] 3.2 重构 Header 模板：左侧渐变图标容器（from-blue-100 to-indigo-100）+ MessageSquare 图标
- [x] 3.3 Header 右侧添加「关闭画布/打开画布」按钮（根据 isCanvasOpen 切换图标 Minimize2/Maximize2）
- [x] 3.4 Header 右侧添加「关闭自身」X 按钮（调用 onClose）
- [x] 3.5 确认 `<script setup>` 所有逻辑无任何修改
- [ ] 3.6 测试：Header 渲染正确、关闭画布/打开画布按钮联动、关闭自身按钮生效

## 4. VisualCanvas Header 重构
- [x] 4.1 在 `defineProps` 中添加 `onClose`、`onToggleChat`、`isChatOpen` 三个 props
- [x] 4.2 PROJECTILE 模式 Header：渐变图标容器（from-purple-100 to-pink-100）+ Zap 图标
- [x] 4.3 PROJECTILE Header：添加中英文双行标题（「平抛运动演示」+ 「Projectile Motion Simulation」）
- [x] 4.4 PROJECTILE Header 右侧：重置按钮 + 关闭按钮（调用 onClose，hover 变红）
- [x] 4.5 默认模式 Header：添加 ToggleChat 按钮（Minimize2/Maximize2 图标）
- [x] 4.6 确认 `canvas-mount-point` DOM ID 保持不变（p5.js 挂载点）
- [x] 4.7 确认 `defineExpose({ updateCanvas, projectileMotionRef })` 保持不变
- [ ] 4.8 测试：PROJECTILE 模式 Header 渲染正确、关闭按钮调用 onClose、p5 画布挂载正常

## 5. 全局样式打磨
- [x] 5.1 ChatBox 语音按钮改为 `rounded-xl border-gray-200 hover:bg-gray-50 flex-1`
- [x] 5.2 ChatBox 发送按钮改为 `rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700`
- [x] 5.3 ChatBox Textarea 改为 `rounded-xl border-gray-200 focus:border-blue-300 min-h-[80px] resize-none`
- [x] 5.4 ChatBox 输入区背景改为 `bg-gray-50/50`
- [x] 5.5 App.vue 拖拽手柄样式：`w-1 bg-gray-200 hover:bg-blue-400 transition-colors relative group` + 中心圆点
- [ ] 5.6 测试：按钮渐变色正确、Textarea 圆角正确、拖拽手柄 hover 变蓝

## 6. 集成验证
- [x] 6.1 构建验证（`npm run build`），确认无编译错误
- [ ] 6.2 验证发送消息、AI 流式回复功能正常
- [ ] 6.3 验证语音输入、连续对话功能正常
- [ ] 6.4 验证平抛运动触发（输入关键词）→ VisualCanvas 切换到 PROJECTILE 模式
- [ ] 6.5 验证 p5.js 物理仿真在重构后仍能正常挂载和渲染
- [ ] 6.6 验证 KaTeX 公式渲染正常
- [ ] 6.7 验证参数控制（绝对值/相对调整/查询/重置）正常
- [ ] 6.8 验证动画控制（播放/暂停/调速/单步）正常
- [ ] 6.9 验证 100vh 无溢出、无横向滚动条
- [ ] 6.10 与 Figma 设计稿视觉对比确认
