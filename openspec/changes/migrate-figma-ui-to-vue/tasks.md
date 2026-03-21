# Tasks: Figma UI 迁移到 Vue 3

## 1. 环境准备和依赖安装
- [ ] 1.1 安装 Tailwind CSS 和相关依赖
- [ ] 1.2 安装 shadcn-vue 核心依赖（radix-vue, class-variance-authority, clsx, tailwind-merge）
- [ ] 1.3 安装图标库（lucide-vue-next）
- [ ] 1.4 配置 Vite 支持 Tailwind CSS
- [ ] 1.5 创建 tailwind.config.js 配置文件
- [ ] 1.6 创建 postcss.config.js 配置文件

## 2. 设计系统配置
- [ ] 2.1 复制 Figma 的 theme.css 到 src/styles/theme.css
- [ ] 2.2 创建 src/styles/tailwind.css 入口文件
- [ ] 2.3 在 main.js 中引入 Tailwind CSS
- [ ] 2.4 配置 Tailwind 的颜色 token（使用 CSS 变量）
- [ ] 2.5 配置 Tailwind 的圆角、间距等设计 token
- [ ] 2.6 移除旧的 global.css 文件

## 3. shadcn-vue 基础组件引入
- [ ] 3.1 创建 src/components/ui/ 目录
- [ ] 3.2 创建 src/components/ui/utils.ts 工具函数（cn 函数）
- [ ] 3.3 引入 Button 组件（src/components/ui/button.vue）
- [ ] 3.4 引入 Input 组件（src/components/ui/input.vue）
- [ ] 3.5 引入 Textarea 组件（src/components/ui/textarea.vue）
- [ ] 3.6 引入 ScrollArea 组件（src/components/ui/scroll-area.vue）
- [ ] 3.7 引入 Card 组件（src/components/ui/card.vue）
- [ ] 3.8 引入 Badge 组件（src/components/ui/badge.vue）
- [ ] 3.9 引入 Separator 组件（src/components/ui/separator.vue）
- [ ] 3.10 引入 Skeleton 组件（src/components/ui/skeleton.vue）
- [ ] 3.11 测试所有组件独立渲染

## 4. App.vue 主布局重构
- [ ] 4.1 更新 App.vue 模板，使用 Tailwind Flex 布局
- [ ] 4.2 实现左右双栏布局（30% / 70%）
- [ ] 4.3 添加 h-screen 和 overflow-hidden 类
- [ ] 4.4 添加左侧边框分隔线
- [ ] 4.5 移除旧的 scoped style
- [ ] 4.6 保留 visualCanvasRef 引用和 watch 逻辑
- [ ] 4.7 测试布局渲染和比例

## 5. ChatBox 组件重构
- [ ] 5.1 更新 ChatBox 模板结构
- [ ] 5.2 使用 Card 组件替换 .chatbox-container
- [ ] 5.3 使用 ScrollArea 组件替换 .chatbox-messages
- [ ] 5.4 使用 Textarea 组件替换原生 textarea
- [ ] 5.5 使用 Button 组件替换所有按钮
- [ ] 5.6 使用 Badge 组件显示语音状态
- [ ] 5.7 更新消息气泡样式（使用 Tailwind 类）
- [ ] 5.8 更新 Toast 提示样式
- [ ] 5.9 更新连续语音状态栏样式
- [ ] 5.10 移除 ChatBox.css 文件
- [ ] 5.11 保留所有 script 逻辑（不做任何修改）
- [ ] 5.12 测试消息发送功能
- [ ] 5.13 测试语音输入功能
- [ ] 5.14 测试连续对话功能
- [ ] 5.15 测试参数控制功能

## 6. VisualCanvas 组件重构
- [ ] 6.1 更新 VisualCanvas 模板结构
- [ ] 6.2 使用 Card 组件替换 .visual-container
- [ ] 6.3 更新状态栏样式（使用 Tailwind 类）
- [ ] 6.4 更新画布容器样式
- [ ] 6.5 使用 Button 组件替换重置按钮
- [ ] 6.6 移除 VisualCanvas.css 文件
- [ ] 6.7 保留 ProjectileMotion 组件引用
- [ ] 6.8 保留所有 script 逻辑（不做任何修改）
- [ ] 6.9 测试可视化渲染
- [ ] 6.10 测试参数更新联动

## 7. ProjectileMotion 组件样式更新
- [ ] 7.1 更新 ProjectileMotion 容器样式（使用 Tailwind 类）
- [ ] 7.2 更新控制面板样式
- [ ] 7.3 使用 Button 组件替换控制按钮
- [ ] 7.4 使用 Separator 组件添加分隔线
- [ ] 7.5 保留所有 p5.js 逻辑（不做任何修改）
- [ ] 7.6 测试动画播放
- [ ] 7.7 测试参数调整

## 8. 样式细节调整
- [ ] 8.1 调整消息气泡的圆角和间距
- [ ] 8.2 调整用户消息和 AI 消息的颜色区分
- [ ] 8.3 调整按钮的 hover 和 active 状态
- [ ] 8.4 调整输入框的聚焦样式
- [ ] 8.5 调整滚动条样式（使用 ScrollArea 的默认样式）
- [ ] 8.6 调整 Toast 提示的位置和动画
- [ ] 8.7 调整波形动画的样式
- [ ] 8.8 调整加载状态的骨架屏样式

## 9. 响应式和交互优化
- [ ] 9.1 添加按钮点击的过渡动画
- [ ] 9.2 添加消息出现的淡入动画
- [ ] 9.3 添加输入框聚焦的边框动画
- [ ] 9.4 优化滚动到底部的平滑效果
- [ ] 9.5 优化 Toast 提示的进入/退出动画

## 10. 全面功能测试
- [ ] 10.1 测试消息发送和 AI 回复
- [ ] 10.2 测试流式输出和光标动画
- [ ] 10.3 测试 KaTeX 公式渲染
- [ ] 10.4 测试语音输入（单次）
- [ ] 10.5 测试连续语音对话
- [ ] 10.6 测试参数控制（绝对值、相对调整、查询、重置）
- [ ] 10.7 测试动画控制（播放、暂停、调速、单步）
- [ ] 10.8 测试平抛运动可视化
- [ ] 10.9 测试消息流自动滚动
- [ ] 10.10 测试按钮禁用状态

## 11. 布局和样式测试
- [ ] 11.1 验证 100vh 高度无溢出
- [ ] 11.2 验证左右分栏比例（30% / 70%）
- [ ] 11.3 验证边框和分隔线样式
- [ ] 11.4 验证颜色系统（primary, secondary, muted 等）
- [ ] 11.5 验证字体大小和行高
- [ ] 11.6 验证圆角和间距一致性
- [ ] 11.7 验证按钮状态样式（default, hover, active, disabled）
- [ ] 11.8 验证输入框状态样式（default, focus, disabled）

## 12. 代码清理和文档
- [ ] 12.1 移除所有旧的 CSS 文件（global.css, ChatBox.css, VisualCanvas.css）
- [ ] 12.2 移除 src/assets/ 目录中的旧样式文件
- [ ] 12.3 更新 package.json 中的依赖版本
- [ ] 12.4 更新 README.md 说明新的技术栈
- [ ] 12.5 添加 Tailwind 和 shadcn-vue 的使用说明
- [ ] 12.6 验证所有导入路径正确
- [ ] 12.7 验证没有未使用的依赖

## 13. 性能和优化
- [ ] 13.1 验证打包体积（应小于 2MB）
- [ ] 13.2 验证首屏加载时间
- [ ] 13.3 验证 Tailwind CSS Tree-shaking 生效
- [ ] 13.4 验证组件按需加载
- [ ] 13.5 验证没有样式冲突

## 14. 最终验收
- [ ] 14.1 与 Figma 设计稿对比视觉效果
- [ ] 14.2 验证所有核心功能正常工作
- [ ] 14.3 验证没有控制台错误或警告
- [ ] 14.4 验证代码符合项目规范（命名、注释等）
- [ ] 14.5 创建 Git commit 并推送
