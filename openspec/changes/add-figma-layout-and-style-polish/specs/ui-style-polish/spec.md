# Spec: 界面风格打磨（按钮、Header、输入区、背景）

## MODIFIED Requirements

### Requirement: ChatBox Header 样式
ChatBox 顶部 Header 重构为 Figma 设计风格：左侧渐变图标 + 标题，右侧操作按钮组。

- Header 容器：`p-5 border-b border-gray-100`
- 左侧：
  - 图标容器：`bg-gradient-to-br from-blue-100 to-indigo-100 w-10 h-10 rounded-xl flex items-center justify-center`
  - 图标：`MessageSquare` from lucide-vue-next，`class="w-5 h-5 text-blue-600"`
  - 标题文字：`text-gray-800`，内容「物理可视化助手」
- 右侧操作按钮组（`flex gap-2`）：
  - 「关闭画布」/「打开画布」切换按钮：`variant="outline" size="sm" rounded-xl border-gray-200 hover:bg-gray-50`，图标 `Minimize2`/`Maximize2`（依据 `isCanvasOpen` prop 切换）
  - 关闭自身按钮：`variant="outline" size="sm" rounded-xl border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600`，图标 `X`
- 旧的简单 `<h1>` 标题行替换为上述结构

#### Scenario: ChatBox Header 渲染
给定 `isCanvasOpen = true`，
当 ChatBox 渲染时，
则 Header 显示渐变蓝色图标容器 + MessageSquare 图标 + 「物理可视化助手」标题，右侧显示「关闭画布」（Minimize2）按钮和 X 按钮。

#### Scenario: ChatBox Header 画布已关闭状态
给定 `isCanvasOpen = false`，
当 ChatBox Header 渲染时，
则「关闭画布」按钮变为「打开画布」（Maximize2 图标）。

---

### Requirement: VisualCanvas Header 样式（PROJECTILE 模式）
VisualCanvas 在 PROJECTILE 可视化模式下，状态栏重构为 Figma 设计风格：渐变图标 + 标题 + 子标题 + 右侧按钮组。

- 状态栏容器：`p-5 bg-white/80 backdrop-blur-sm border-b border-gray-100`
- 左侧：
  - 图标容器：`bg-gradient-to-br from-purple-100 to-pink-100 w-10 h-10 rounded-xl flex items-center justify-center`
  - 图标：`Zap` from lucide-vue-next，`class="w-5 h-5 text-purple-600"`
  - 标题：`text-gray-800`，内容「平抛运动演示」
  - 子标题：`text-xs text-gray-500`，内容「Projectile Motion Simulation」
- 右侧按钮组（`flex gap-2`）：
  - 重置按钮：`variant="outline" size="sm" rounded-xl border-gray-200 hover:bg-gray-50`，图标 `RotateCcw` + 文字「重置」
  - 关闭按钮：`variant="outline" size="sm" rounded-xl border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600`，图标 `X` + 文字「关闭」，点击调用 `onClose` prop

#### Scenario: PROJECTILE 模式 Header 渲染
给定 `state.currentVisualType === 'PROJECTILE'`，
当 VisualCanvas 渲染时，
则 Header 显示紫-粉渐变图标容器 + Zap 图标 + 「平抛运动演示」+ 英文子标题 + 重置/关闭按钮。

#### Scenario: 点击 VisualCanvas 关闭按钮
给定 PROJECTILE 模式，Header 右侧「关闭」按钮，
当用户点击时，
则调用 `onClose` prop（在 App.vue 中将 `isCanvasOpen` 置为 `false`）。

---

### Requirement: 发送按钮渐变样式
输入区发送按钮使用 Figma 设计的蓝-靛蓝渐变，替代当前的纯色 primary。

- 样式：`rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700`
- 图标：`Send` from lucide-vue-next，`class="w-4 h-4 mr-2"`
- disabled 状态：`!inputValue.trim() || state.isGenerating`（保持现有逻辑）

#### Scenario: 发送按钮样式
给定 ChatBox 输入区，
当渲染时，
则发送按钮显示蓝-靛蓝渐变背景，hover 时渐变加深。

---

### Requirement: 语音输入按钮样式
语音输入按钮使用 `flex-1 rounded-xl` 样式，与 Figma 设计对齐。

- 样式：`flex-1 rounded-xl border-gray-200 hover:bg-gray-50`
- 含 `Badge` 状态指示（录音中 / 识别中）保持现有逻辑
- 图标：`Mic` from lucide-vue-next（已有）

#### Scenario: 语音按钮布局
给定 ChatBox 输入区按钮行，
当渲染时，
则语音按钮占据剩余宽度（flex-1），圆角为 rounded-xl。

---

### Requirement: 连续对话按钮样式
连续对话按钮与 Figma 风格一致。

- 非激活态：`rounded-xl border-gray-200 hover:bg-gray-50`
- 激活态：`rounded-xl bg-orange-500 hover:bg-orange-600 text-white`（保持现有逻辑区分）

#### Scenario: 连续对话按钮默认态
给定 `state.isContinuousMode = false`，
当渲染时，
则连续对话按钮显示 outline 风格，rounded-xl。

---

### Requirement: 输入区容器样式
输入区容器使用 Figma 设计的浅灰背景。

- 容器样式：`p-5 border-t border-gray-100 bg-gray-50/50`
- Textarea 样式：`min-h-[80px] resize-none bg-white border-gray-200 focus:border-blue-300 focus:ring-blue-100 rounded-xl`

#### Scenario: 输入区背景
给定 ChatBox 底部输入区，
当渲染时，
则容器背景为半透明浅灰（bg-gray-50/50），Textarea 为白色背景、圆角 xl、focus 时蓝色边框。

---

### Requirement: VisualCanvas 空状态样式
VisualCanvas 非 PROJECTILE 模式下的空状态使用 Figma 设计风格。

- 根容器：`h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50`
- 顶部状态栏：`p-5 bg-white/80 backdrop-blur-sm border-b border-gray-100`，包含：
  - 左侧图标容器 + 标题（与 PROJECTILE 同结构，但图标/色彩不同，可用默认占位）
  - 右侧「关闭」按钮（调用 `onClose`）和「收起对话」切换按钮（调用 `onToggleChat`）
- 底部控制栏：`p-5 bg-white/80 backdrop-blur-sm border-t border-gray-100`，「重置画布」按钮使用 `rounded-xl border-gray-200 hover:bg-gray-50`

#### Scenario: 空状态顶部栏
给定 `state.currentVisualType !== 'PROJECTILE'`，
当 VisualCanvas 渲染时，
则顶部栏显示白色半透明背景（backdrop-blur）+ 关闭/切换按钮。

#### Scenario: 空状态底部栏样式
给定空状态 VisualCanvas，
当渲染时，
则「重置画布」按钮圆角为 rounded-xl，样式为 outline。
