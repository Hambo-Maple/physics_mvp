# Spec: UI Layout and Visual Style System

## ADDED Requirements

### Requirement: 100vh Split-Pane Layout
**ID**: `ui-layout-001`
**Priority**: P0

The application MUST implement a stable full-viewport-height split-pane layout, with left side occupying 30% width for chat area, right side occupying 70% width for visualization area, overall height fixed at 100vh to avoid page-level scrolling.

#### Scenario: 页面加载时显示正确的分栏布局
**Given** 用户在浏览器中打开应用
**When** 页面加载完成
**Then** 页面应显示左右分栏布局，左侧宽度为 30%，右侧宽度为 70%
**And** 整体高度为 100vh，无垂直滚动条
**And** 左右两侧各自独立管理内部滚动

#### Scenario: 窗口调整大小时布局保持稳定
**Given** 应用已加载并显示分栏布局
**When** 用户调整浏览器窗口大小
**Then** 左右分栏比例保持 30%/70%
**And** 整体高度始终为 100vh
**And** 不出现布局溢出或错位

---

### Requirement: A2UI Visual Style System
**ID**: `ui-layout-002`
**Priority**: P0

The application MUST follow A2UI minimalist academic style visual specifications, using dark green as primary color, complemented by light gray, dark gray, white, and border gray, with all containers using 1px solid borders and 4px border radius.

#### Scenario: 主色调和辅助色正确应用
**Given** 应用已加载
**When** 用户查看界面
**Then** 主色调应为墨绿色 (#006644)
**And** 辅助色应包括极浅灰 (#f5f5f5)、深灰 (#333)、白色 (#fff)、边框灰 (#e0e0e0)
**And** 所有容器边框为 1px 实线 #e0e0e0，圆角 4px

#### Scenario: 按钮状态样式符合规范
**Given** 界面中存在按钮元素
**When** 用户与按钮交互
**Then** 默认按钮背景为 #f5f5f5，边框 1px #e0e0e0
**And** hover 状态背景变为 #e8e8e8
**And** active 状态背景变为 #006644，文字变为白色
**And** 主按钮（发送/重置）默认背景为 #006644，文字白色
**And** 主按钮 hover 背景为 #008055，active 背景为 #004d33

#### Scenario: 文字样式符合规范
**Given** 界面中存在文字内容
**When** 用户查看文字
**Then** 字体应为无衬线字体（微软雅黑/Inter）
**And** 标题文字大小为 16px
**And** 普通文字大小为 14px
**And** 辅助文字大小为 12px

---

### Requirement: Global CSS Architecture
**ID**: `ui-layout-003`
**Priority**: P0

The style system MUST use pure native CSS, split style files by component, and manage global styles (CSS Reset, color variables, common classes) uniformly in `src/assets/global.css`.

#### Scenario: 全局样式文件正确加载
**Given** 应用启动
**When** 主入口文件 `main.js` 执行
**Then** 应导入 `src/assets/global.css`
**And** 全局样式应包含 CSS Reset（去除默认 margin/padding）
**And** 应定义 CSS 变量（--color-primary、--color-bg-light 等）
**And** 应定义通用类（如 .btn、.btn-primary）

#### Scenario: 组件样式文件独立拆分
**Given** 存在 ChatBox 和 VisualCanvas 组件
**When** 组件被引入使用
**Then** ChatBox 组件应导入 `src/assets/ChatBox.css`
**And** VisualCanvas 组件应导入 `src/assets/VisualCanvas.css`
**And** 组件样式不应相互污染

---

### Requirement: Vite Configuration
**ID**: `ui-layout-004`
**Priority**: P0

The project MUST use Vite 5.x as build tool, configure development server port to 3000, and set path alias `@` pointing to `src` directory.

#### Scenario: Vite 配置正确
**Given** 项目根目录存在 `vite.config.js`
**When** 执行 `npm run dev`
**Then** 开发服务器应在 http://localhost:3000 启动
**And** 代码中可使用 `@/` 作为 `src/` 的别名
**And** 支持 Vue 3 单文件组件的热更新
