# Design: KaTeX 公式渲染与样式优化

## Context
项目当前已预留公式渲染接口（`#formula-container`），但未实现实际渲染能力。物理教学场景需要展示微积分公式（导数、积分、极限），同时现有墨绿色主题的交互细节需要优化以符合 A2UI 极简学术风格。

## Goals / Non-Goals

### Goals
- 支持行内公式（`$...$`）和块级公式（`$$...$$`）的自动渲染
- 在 AI 消息气泡和可视化区域两个位置渲染公式
- 提供公式切换功能，展示平抛运动的不同微积分表达式
- 优化按钮交互样式（hover 阴影、active 缩放）
- 优化消息气泡和公式区域的视觉呈现

### Non-Goals
- 不实现公式编辑器（仅渲染预定义公式）
- 不支持复杂的公式交互（如点击公式展开详情）
- 不实现公式动画效果

## Decisions

### 1. KaTeX vs MathJax
**决策**：选择 KaTeX
**理由**：
- KaTeX 渲染速度更快（无需多次重排）
- 输出为纯 HTML+CSS，无需 JavaScript 运行时
- 文件体积更小（~100KB vs MathJax ~500KB）
- 支持服务端渲染（未来扩展性）

**替代方案**：MathJax 功能更全面，但性能较差且体积较大

### 2. CDN vs npm 安装
**决策**：使用 CDN 引入
**理由**：
- 符合用户需求（"优先 CDN 引入"）
- 减少构建体积和时间
- 利用浏览器缓存（公共 CDN）
- 无需配置 Vite 插件

**替代方案**：npm 安装可离线使用，但增加构建复杂度

### 3. 公式渲染时机
**决策**：在 DOM 更新后（`nextTick`）调用 `renderMathInElement`
**理由**：
- 确保 DOM 节点已挂载
- 避免渲染时机错误导致公式不显示
- 符合 Vue 3 生命周期最佳实践

### 4. 公式数据存储
**决策**：在全局状态（`store/index.js`）中新增 `formulaList` 数组
**理由**：
- 集中管理公式数据，便于维护
- 支持多个组件共享公式列表
- 符合项目现有状态管理模式（reactive）

**数据结构**：
```javascript
const formulaList = [
  { id: 1, name: '位移公式', content: '$x = v_0 t, \\quad y = \\frac{1}{2} g t^2$' },
  { id: 2, name: '速度导数', content: '$\\frac{dv_x}{dt} = 0, \\quad \\frac{dv_y}{dt} = g$' },
  { id: 3, name: '位移积分', content: '$y = \\int_0^t v_y dt = \\int_0^t g t dt = \\frac{1}{2} g t^2$' }
]
```

### 5. 样式优化策略
**决策**：在现有 CSS 文件中增量添加样式，不重构整体结构
**理由**：
- 最小化变更范围，降低风险
- 保持与现有代码风格一致
- 符合 OpenSpec "最小化实现" 原则

**优化项**：
- 按钮 hover：`box-shadow: 0 2px 4px rgba(0,0,0,0.1)`
- 按钮 active：`transform: scale(0.99)`
- 消息气泡：`padding: 10px 14px; line-height: 1.5; margin-bottom: 10px`
- 公式容器：`background: #f8f8f8; border: 1px solid #e0e0e0; border-radius: 4px; padding: 20px`

## Risks / Trade-offs

### 风险 1：CDN 可用性
**风险**：CDN 服务中断或被墙导致公式无法渲染
**缓解**：使用 jsDelivr CDN（国内可访问），未来可添加 fallback 到本地文件

### 风险 2：公式语法错误
**风险**：用户输入的公式语法错误导致渲染失败
**缓解**：
- 当前阶段仅渲染预定义公式（`formulaList`），无用户输入
- 未来如需支持用户输入，添加 try-catch 错误处理

### 风险 3：性能影响
**风险**：大量公式渲染可能影响页面性能
**缓解**：
- KaTeX 渲染速度快（~1ms/公式）
- 当前场景公式数量有限（<10 个）
- 仅在需要时渲染（按需触发）

### Trade-off：灵活性 vs 简单性
**选择**：简单性优先
**说明**：
- 当前实现仅支持预定义公式切换，不支持动态公式编辑
- 如需更高灵活性，未来可扩展为公式编辑器（如集成 MathQuill）

## Migration Plan
无需迁移（新增功能，不影响现有代码）

## Open Questions
无
