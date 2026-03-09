## ADDED Requirements

### Requirement: KaTeX 库集成
系统 SHALL 通过 CDN 引入 KaTeX 0.16.9 库，包括核心 CSS、核心 JS 和 auto-render 扩展。

#### Scenario: KaTeX CDN 资源加载
- **WHEN** 用户访问应用首页
- **THEN** 浏览器加载 KaTeX CSS（katex.min.css）、核心 JS（katex.min.js）和 auto-render 扩展（auto-render.min.js）
- **AND** 所有资源从 jsDelivr CDN 加载（https://cdn.jsdelivr.net/npm/katex@0.16.9/）

### Requirement: 公式渲染工具函数
系统 SHALL 提供 `renderMathInElement` 工具函数，用于在指定 DOM 元素中自动渲染数学公式。

#### Scenario: 渲染行内公式
- **WHEN** DOM 元素包含行内公式语法（`$...$`）
- **THEN** 工具函数将公式渲染为 KaTeX HTML 元素
- **AND** 渲染后的公式与周围文字基线对齐

#### Scenario: 渲染块级公式
- **WHEN** DOM 元素包含块级公式语法（`$$...$$`）
- **THEN** 工具函数将公式渲染为 KaTeX HTML 元素
- **AND** 渲染后的公式居中显示
- **AND** 公式上下间距为 10px

#### Scenario: 渲染微积分公式
- **WHEN** 公式包含导数（`\frac{dy}{dx}`）、积分（`\int_0^t`）或极限（`\lim_{t \to \infty}`）语法
- **THEN** 工具函数正确渲染微积分符号
- **AND** 渲染结果符合数学排版规范

### Requirement: AI 消息内公式渲染
系统 SHALL 在 ChatBox 组件的 AI 消息气泡中自动渲染数学公式。

#### Scenario: AI 回复包含行内公式
- **WHEN** AI 回复内容为 "平抛运动位移公式：$x = v_0 t$，速度导数：$\frac{dv_y}{dt} = g$"
- **THEN** 消息气泡中显示文字和渲染后的公式
- **AND** 公式与文字在同一行内显示
- **AND** 公式不超出气泡宽度

#### Scenario: AI 回复包含块级公式
- **WHEN** AI 回复内容包含块级公式 "$$y = \frac{1}{2} g t^2$$"
- **THEN** 公式在消息气泡中居中显示
- **AND** 公式上下各有 10px 间距

### Requirement: 可视化区域公式渲染
系统 SHALL 在 VisualCanvas 组件的 `#formula-container` 中渲染微积分公式。

#### Scenario: 触发公式可视化
- **WHEN** `updateCanvas('FORMULA')` 被调用
- **THEN** 状态栏显示 "当前模式 - 物理公式"
- **AND** `#formula-container` 中渲染默认公式（位移公式）
- **AND** 公式容器背景色为 #f8f8f8，边框 1px #e0e0e0，圆角 4px，内边距 20px

#### Scenario: 触发平抛运动可视化并渲染公式
- **WHEN** `updateCanvas('PROJECTILE')` 被调用
- **THEN** 状态栏显示 "当前模式 - 平抛运动"
- **AND** `#formula-container` 中渲染平抛运动位移公式 "$y = \int_0^t (\int_0^t g dt) dt = \frac{1}{2} g t^2$"

### Requirement: 公式切换功能
系统 SHALL 提供「切换公式」按钮，允许用户在可视化区域切换不同的微积分公式。

#### Scenario: 切换到下一个公式
- **WHEN** 用户点击「切换公式」按钮
- **THEN** `#formula-container` 中显示 `formulaList` 的下一个公式
- **AND** 如果当前是最后一个公式，则循环到第一个公式

#### Scenario: 公式列表内容
- **WHEN** 系统初始化
- **THEN** `formulaList` 包含以下公式：
  - 位移公式：`$x = v_0 t, \quad y = \frac{1}{2} g t^2$`
  - 速度导数：`$\frac{dv_x}{dt} = 0, \quad \frac{dv_y}{dt} = g$`
  - 位移积分：`$y = \int_0^t v_y dt = \int_0^t g t dt = \frac{1}{2} g t^2$`

### Requirement: 公式渲染不破坏布局
系统 SHALL 确保公式渲染后不破坏页面布局和消息流滚动。

#### Scenario: 消息气泡宽度限制
- **WHEN** AI 消息包含长公式
- **THEN** 公式自动换行或缩放以适应气泡宽度
- **AND** 消息气泡不超出对话区域（30% 宽度）

#### Scenario: 消息流自动滚动
- **WHEN** 新消息添加并包含公式
- **THEN** 公式渲染完成后，消息流自动滚动到底部
- **AND** 用户可以看到完整的新消息
