# Spec: 可拖拽分栏布局与面板开关

## ADDED Requirements

### Requirement: 可拖拽左右分栏
应用布局使用 `vue-resizable-panels` 的 `PanelGroup / Panel / PanelResizeHandle` 实现左右分栏，用户可通过拖拽手柄动态调整左右面板比例。

- `PanelGroup` 方向为 `horizontal`
- 左侧 Panel（ChatBox）默认尺寸：`isCanvasOpen` 时 30%，否则 95%；最小 20%，最大 50%（画布开时）
- 右侧 Panel（VisualCanvas）默认尺寸：`isChatOpen` 时 70%，否则 100%
- 拖拽手柄样式：`w-1 bg-gray-200 hover:bg-blue-400 transition-colors`，中心圆点 `w-1 h-12 bg-gray-300 rounded-full group-hover:bg-blue-500`
- 手柄仅在两个面板均可见时显示（`isChatOpen && isCanvasOpen`）

#### Scenario: 两个面板均打开时可拖拽
给定 `isChatOpen = true` 且 `isCanvasOpen = true`，
当用户拖拽分栏手柄时，
则左右面板比例实时更新，且不低于各自最小尺寸（20%）。

#### Scenario: 画布关闭时 Chat 独占
给定 `isCanvasOpen = false`，
当布局渲染时，
则 ChatBox Panel `defaultSize` 为 95，拖拽手柄不显示。

---

### Requirement: 左侧面板（ChatBox）独立关闭
`isChatOpen` 为 `false` 时，ChatBox Panel 从布局中移除，同时拖拽手柄隐藏。

- `isChatOpen` 由 App.vue 的 `ref(true)` 管理
- ChatBox 接收 `onClose` prop（`() => void`），点击 Header 关闭按钮时调用
- App.vue 中 `handleToggleChat` 将 `isChatOpen` 取反

#### Scenario: 点击 ChatBox 关闭按钮
给定 ChatBox Header 右侧的 X 按钮，
当用户点击时，
则 `isChatOpen` 变为 `false`，ChatBox 从视图移除，左上角浮动「打开对话框」按钮出现。

---

### Requirement: 右侧面板（VisualCanvas）独立关闭
`isCanvasOpen` 为 `false` 时，VisualCanvas Panel 从布局中移除。

- `isCanvasOpen` 由 App.vue 的 `ref(true)` 管理
- VisualCanvas 接收 `onClose` prop（`() => void`），点击 Header 关闭按钮时调用
- ChatBox 接收 `onToggleCanvas` prop（`() => void`）和 `isCanvasOpen` prop（`boolean`），Header 中显示「关闭画布」/「打开画布」切换按钮

#### Scenario: 点击 VisualCanvas 关闭按钮
给定 VisualCanvas Header 右侧的「关闭」按钮，
当用户点击时，
则 `isCanvasOpen` 变为 `false`，VisualCanvas 从视图移除，右上角浮动「打开画布」按钮出现。

#### Scenario: 从 ChatBox Header 关闭画布
给定 ChatBox Header 的「关闭画布」按钮（`isCanvasOpen = true` 时显示），
当用户点击时，
则 `isCanvasOpen` 变为 `false`，效果与点击 VisualCanvas 关闭按钮相同。

---

### Requirement: 浮动重开按钮
面板关闭后，界面提供浮动按钮让用户重新打开对应面板。

- `!isChatOpen` 时：左上角固定定位按钮，样式 `fixed top-6 left-6 z-50 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg`，图标 `MessageSquare`，文字「打开对话框」
- `!isCanvasOpen` 时：右上角固定定位按钮，样式 `fixed top-6 right-6 z-50 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-lg`，图标 `Zap`，文字「打开画布」
- 点击浮动按钮将对应 `ref` 置回 `true`

#### Scenario: 打开已关闭的 ChatBox
给定 `isChatOpen = false`，左上角显示「打开对话框」浮动按钮，
当用户点击时，
则 `isChatOpen` 变为 `true`，ChatBox 重新出现，浮动按钮消失。

#### Scenario: 打开已关闭的 VisualCanvas
给定 `isCanvasOpen = false`，右上角显示「打开画布」浮动按钮，
当用户点击时，
则 `isCanvasOpen` 变为 `true`，VisualCanvas 重新出现，浮动按钮消失。

---

### Requirement: App 根容器背景
App 根容器样式更新为 Figma 设计的渐变背景。

- 旧样式：`flex h-screen overflow-hidden`（无背景色）
- 新样式：`flex h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50`

#### Scenario: 页面背景渐变
给定应用加载完成，
当页面渲染时，
则根容器背景为从 slate-50 经 blue-50 到 indigo-50 的对角渐变。
