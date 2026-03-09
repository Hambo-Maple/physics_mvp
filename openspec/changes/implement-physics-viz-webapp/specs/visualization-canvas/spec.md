# Spec: Visualization Canvas and Linkage Mechanism

## ADDED Requirements

### Requirement: Canvas Component Structure
**ID**: `visualization-canvas-001`
**Priority**: P0

The visualization component MUST implement a three-layer structure with status bar, center canvas, and bottom control area, where the status bar displays current mode, canvas area provides DOM mount point, and control area contains reset button.

#### Scenario: 可视化组件正确渲染
**Given** 应用已加载
**When** 用户查看右侧可视化区域
**Then** 应显示顶部状态栏，高度 50px，背景 #f5f5f5，文字"当前模式 - 未选择可视化"（14px，#333）
**And** 应显示中心画布，flex: 1，背景白色，包含 `div#canvas-mount-point`
**And** 画布挂载点应设置 width: 100%, height: 100%, display: flex, justify-content: center, align-items: center
**And** 应显示底部控制区，高度 50px，包含"重置画布"按钮

#### Scenario: 默认占位提示
**Given** 应用刚加载，未触发任何可视化
**When** 用户查看画布区域
**Then** 应显示占位提示"可视化画布已准备就绪"
**And** 状态栏文字为"当前模式 - 未选择可视化"

---

### Requirement: Canvas Update Interface
**ID**: `visualization-canvas-002`
**Priority**: P0

The visualization component MUST provide an `updateCanvas(type)` method that accepts visualization type parameters (PROJECTILE/FORMULA), updates status bar and placeholder text, and reserves rendering interface for p5.js/Three.js integration.

#### Scenario: 更新为平抛运动类型
**Given** 可视化组件已渲染
**When** 调用 `updateCanvas('PROJECTILE')`
**Then** 状态栏文字应更新为"当前模式 - 平抛运动"
**And** 占位提示应更新为"平抛运动画布已准备就绪"

#### Scenario: 更新为公式类型
**Given** 可视化组件已渲染
**When** 调用 `updateCanvas('FORMULA')`
**Then** 状态栏文字应更新为"当前模式 - 物理公式"
**And** 占位提示应更新为"物理公式画布已准备就绪"

#### Scenario: 预留渲染接口注释
**Given** 存在 `updateCanvas(type)` 方法
**When** 查看方法实现
**Then** 应包含详细的集成注释：
```
// 可视化渲染入口：
// 1. 后续可引入 p5.js，在 canvas-mount-point 中初始化画布；
// 2. 根据 type 渲染对应内容：PROJECTILE=平抛运动，FORMULA=物理公式；
// 3. 公式渲染可集成 MathJax/KaTeX，此处预留 DOM 节点（<div id="formula-container"></div>）；
```

---

### Requirement: Canvas Reset Functionality
**ID**: `visualization-canvas-003`
**Priority**: P0

The reset button in the bottom control area MUST be able to clear canvas content, restore default placeholder text, and update status bar to initial state.

#### Scenario: 重置画布
**Given** 画布当前显示"平抛运动画布已准备就绪"
**And** 状态栏显示"当前模式 - 平抛运动"
**When** 用户点击"重置画布"按钮
**Then** 占位提示应恢复为"可视化画布已准备就绪"
**And** 状态栏应恢复为"当前模式 - 未选择可视化"
**And** 全局状态 `currentVisualType` 应清空为 ''

---

### Requirement: Chat-Canvas Linkage
**ID**: `visualization-canvas-004`
**Priority**: P0

The application root component MUST listen to changes in global state `currentVisualType`, and when changes are detected, call the VisualCanvas component's `updateCanvas` method to achieve chat-canvas linkage.

#### Scenario: 对话触发可视化更新
**Given** 用户在对话区输入"平抛运动"并发送
**When** AI 回复包含 `[TRIGGER:PROJECTILE]`
**Then** 全局状态 `currentVisualType` 应更新为 'PROJECTILE'
**And** App.vue 应监听到变化
**And** 应调用 VisualCanvas 的 `updateCanvas('PROJECTILE')` 方法
**And** 画布状态栏和占位提示应相应更新

#### Scenario: 多次触发不同类型
**Given** 画布当前显示平抛运动
**When** 用户在对话区输入"公式"并发送
**And** AI 回复包含 `[TRIGGER:FORMULA]`
**Then** 全局状态 `currentVisualType` 应更新为 'FORMULA'
**And** 画布应从平抛运动切换到公式模式
**And** 状态栏和占位提示应相应更新

---

### Requirement: Formula Container Reservation
**ID**: `visualization-canvas-005`
**Priority**: P1

The canvas mount point MUST reserve a `<div id="formula-container"></div>` node inside for future integration of MathJax/KaTeX to render physics formulas.

#### Scenario: 公式容器存在
**Given** 可视化组件已渲染
**When** 查看 DOM 结构
**Then** `#canvas-mount-point` 内部应包含 `#formula-container` 节点
**And** 该节点应默认隐藏或为空
**And** 当 `updateCanvas('FORMULA')` 被调用时，该节点可用于挂载公式渲染库
