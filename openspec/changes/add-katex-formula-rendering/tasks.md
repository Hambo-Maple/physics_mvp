# Implementation Tasks

## 1. KaTeX 集成基础设施
- [x] 1.1 在 `index.html` 中引入 KaTeX 0.16.9 CDN（CSS + JS + auto-render）
- [x] 1.2 创建 `src/utils/katex.js` 工具函数，封装 `renderMathInElement` 逻辑
- [x] 1.3 在 `src/store/index.js` 中新增 `formulaList` 数组（位移/速度/加速度公式）

## 2. ChatBox 消息内公式渲染
- [x] 2.1 修改 `ChatBox.vue`，在 AI 消息渲染后调用 KaTeX 渲染函数
- [x] 2.2 更新 `ChatBox.css`，优化消息气泡间距（10px）和行高（1.5）
- [x] 2.3 确保行内公式与文字基线对齐，块级公式居中显示

## 3. VisualCanvas 可视化区公式渲染
- [x] 3.1 修改 `VisualCanvas.vue` 的 `updateCanvas` 方法，在 `type=FORMULA` 时渲染公式
- [x] 3.2 新增「切换公式」按钮，点击切换 `formulaList` 中的不同公式
- [x] 3.3 更新 `VisualCanvas.css`，设置公式容器样式（背景 #f8f8f8，边框 1px #e0e0e0，圆角 4px，padding 20px）

## 4. 全局样式优化（A2UI 极简学术风）
- [x] 4.1 在 `global.css` 中为按钮添加 hover 阴影（box-shadow: 0 2px 4px rgba(0,0,0,0.1)）
- [x] 4.2 为按钮添加 active 缩放效果（transform: scale(0.99)）
- [x] 4.3 添加全局文字抗锯齿（-webkit-font-smoothing: antialiased）
- [x] 4.4 确保元素间距为 8px/16px 倍数

## 5. 验证与测试
- [ ] 5.1 验证 AI 回复中的行内公式（如 `$x = v_0 t$`）渲染正常
- [ ] 5.2 验证 AI 回复中的块级公式（如 `$$y = \frac{1}{2}gt^2$$`）居中显示
- [ ] 5.3 验证可视化区域公式渲染和切换功能
- [ ] 5.4 验证按钮 hover/active 样式优化生效
- [ ] 5.5 验证上下文关联："平抛运动" → "这个微积分公式" 触发对应公式渲染
