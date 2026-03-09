# Change: 新增 KaTeX 微积分公式渲染功能并优化墨绿色主题样式

## Why
当前项目仅预留了公式渲染接口（`#formula-container`），但未实现实际的数学公式渲染能力。为了支持物理教学场景中的微积分公式展示（导数、积分、极限），需要集成 KaTeX 库，并在 AI 回复消息和可视化区域两个位置实现公式渲染。同时，现有墨绿色主题的交互细节（按钮阴影、气泡间距、公式区域样式）需要优化，以符合 A2UI 极简学术风格。

## What Changes
- 集成 KaTeX 0.16.9（通过 CDN 引入），支持行内公式（`$...$`）和块级公式（`$$...$$`）
- 在 ChatBox 组件的 AI 消息气泡中自动渲染公式
- 在 VisualCanvas 组件的可视化区域渲染微积分公式，并新增「切换公式」按钮
- 新增 `src/utils/katex.js` 工具函数封装公式渲染逻辑
- 在全局状态中新增 `formulaList` 数组，存储平抛运动的位移/速度/加速度公式
- 优化全局样式：按钮 hover 阴影、active 缩放、消息气泡间距、公式区域背景
- 更新 `index.html` 引入 KaTeX CDN 资源

## Impact
- 新增能力：`formula-rendering`（公式渲染）
- 修改能力：`ui-styling`（UI 样式优化）
- 影响文件：
  - `index.html`（新增 KaTeX CDN）
  - `src/utils/katex.js`（新建）
  - `src/store/index.js`（新增 formulaList）
  - `src/components/ChatBox.vue`（消息内公式渲染）
  - `src/components/VisualCanvas.vue`（可视化区公式渲染 + 切换按钮）
  - `src/assets/global.css`（按钮样式优化）
  - `src/assets/ChatBox.css`（气泡间距优化）
  - `src/assets/VisualCanvas.css`（公式区域样式）
