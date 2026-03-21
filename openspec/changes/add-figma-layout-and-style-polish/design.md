# Design: Figma 布局增强与界面风格打磨技术方案

## Context

当前项目已完成基础 Tailwind CSS + shadcn-vue 迁移，但 App.vue 布局和组件视觉样式与 Figma 设计仍有差距。本方案聚焦两个独立但相关的维度：布局动态化和风格对齐。

**参考源**：`ui_style/src/app/App.tsx`、`ui_style/src/app/components/ChatBox.tsx`、`ui_style/src/app/components/VisualCanvas.tsx`

## Decisions

### 1. 可拖拽分栏库：vue-resizable-panels

**决策**：使用 `vue-resizable-panels`

**理由**：
- 用户明确指定，与 Figma 原始代码 `react-resizable-panels` API 高度对齐
- 直接映射：`PanelGroup` → `PanelGroup`，`Panel` → `Panel`，`PanelResizeHandle` → `PanelResizeHandle`
- 降低迁移心智负担，代码结构与 Figma 参考一一对应

**替代方案（已排除）**：
- splitpanes：API 差异大，需要更多适配工作
- 纯 CSS resize：拖拽体验差，无法精确控制比例

### 2. 面板状态管理：App.vue 集中管理

**决策**：在 App.vue 的 `<script setup>` 中用 `ref` 管理 `isChatOpen` 和 `isCanvasOpen`，通过 props 传递给子组件。

**理由**：
- 面板开关是布局层决策，属于 App 级状态
- 子组件（ChatBox/VisualCanvas）只需接收回调 props，职责清晰
- 无需引入新的全局状态，保持 store.js 不变

```
App.vue
├── isChatOpen: ref(true)
├── isCanvasOpen: ref(true)
├── handleToggleCanvas() → isCanvasOpen 取反
├── handleToggleChat() → isChatOpen 取反
├── ChatBox props: { onToggleCanvas, isCanvasOpen, onClose: () => isChatOpen=false }
└── VisualCanvas props: { onClose: () => isCanvasOpen=false, onToggleChat, isChatOpen }
```

### 3. 布局结构

```vue
<PanelGroup direction="horizontal">
  <!-- 左侧 Chat（isChatOpen 时显示）-->
  <template v-if="isChatOpen">
    <Panel :default-size="isCanvasOpen ? 30 : 95" :min-size="20" :max-size="isCanvasOpen ? 50 : 95">
      <ChatBox ... />
    </Panel>
    <PanelResizeHandle v-if="isCanvasOpen" class="w-1 bg-gray-200 hover:bg-blue-400 ..." />
  </template>

  <!-- 右侧 Canvas（isCanvasOpen 时显示）-->
  <Panel v-if="isCanvasOpen" :default-size="isChatOpen ? 70 : 100">
    <VisualCanvas ... />
  </Panel>
</PanelGroup>

<!-- 浮动按钮（面板关闭时显示）-->
<Button v-if="!isChatOpen" class="fixed top-6 left-6 z-50 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 ...">
  <MessageSquare /> 打开对话框
</Button>
<Button v-if="!isCanvasOpen" class="fixed top-6 right-6 z-50 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 ...">
  <Zap /> 打开画布
</Button>
```

### 4. 风格打磨策略：class 覆盖，不改 UI 组件

**决策**：不修改 `src/components/ui/Button.vue` 等基础组件，而是在业务组件调用时通过 class prop 覆盖样式。

**理由**：
- 基础 UI 组件保持通用性和可复用性
- `cn()` + `twMerge` 已支持 class 合并，直接传 class 即可覆盖
- 与 shadcn-vue 惯例一致

**关键样式映射**：

| 位置 | 当前样式 | 目标样式（Figma） |
|------|---------|------------------|
| 发送按钮 | `bg-primary rounded-md` | `rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700` |
| 语音按钮 | `rounded-md` | `flex-1 rounded-xl border-gray-200 hover:bg-gray-50` |
| outline 按钮 | `rounded-md` | `rounded-xl border-gray-200 hover:bg-gray-50` |
| hover:red 按钮 | 无 | `hover:bg-red-50 hover:border-red-200 hover:text-red-600` |
| App 背景 | `bg-background` | `bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50` |
| ChatBox 根 | `bg-background` | `bg-white` |
| Header 图标容器 | 无 | `bg-gradient-to-br from-blue-100 to-indigo-100 w-10 h-10 rounded-xl` |
| 输入区容器 | `border-t` | `border-t border-gray-100 bg-gray-50/50` |
| Textarea | `rounded-md` | `rounded-xl border-gray-200 focus:border-blue-300 focus:ring-blue-100 min-h-[80px] resize-none` |

### 5. ChatBox Header 重构

Figma 设计的 ChatBox Header 包含：
- 左侧：渐变图标容器（blue→indigo）+ MessageSquare 图标 + 标题文字
- 右侧：按钮组（关闭画布 toggle + 关闭自身 X）

当前 ChatBox 有标题栏但无图标，无 Header 按钮组。需新增 props 并重构 Header 模板。

**注意**：ChatBox 的 `<script setup>` 中现有的发送/语音/连续对话等所有逻辑**一行不改**。

### 6. 新增 lucide 图标

Figma 代码使用的图标（已安装 lucide-vue-next）：
- `MessageSquare` — ChatBox Header
- `Zap` — VisualCanvas Header + 浮动重开按钮
- `X` — 关闭按钮
- `Minimize2` / `Maximize2` — 画布开关按钮
- `RotateCcw` — 重置按钮（已有）
- `Play` — 播放按钮（已有）

## Open Questions

1. **ChatBox 的 Header 按钮「关闭画布」/「打开画布」切换**：Figma 代码中通过 `isCanvasOpen` prop 动态显示 Minimize2/Maximize2 + 文字。当前 ChatBox 没有这个 prop。确认：新增该 prop 后，是否需要同步更新 store.js 中对应字段，还是仅作为 prop 传递？→ 建议仅作为 prop，不改 store。

2. **VisualCanvas 的「关闭画布」按钮**：Figma VisualCanvas 在 PROJECTILE 模式的 Header 右侧有「重置」和「关闭」两个按钮。「关闭」触发 `onClose`。当前 VisualCanvas 的 Header 由 `updateCanvas()` 逻辑控制，关闭逻辑不同。确认：「关闭」是否等同于调用 `updateVisualType('')`（即重置画布类型）？→ 建议是。
