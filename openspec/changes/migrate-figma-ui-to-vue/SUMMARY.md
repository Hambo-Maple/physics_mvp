# Figma UI 迁移提案总结

## 提案状态
✅ **已创建并通过验证**

- **Change ID**: `migrate-figma-ui-to-vue`
- **验证状态**: Valid (通过 `openspec validate --strict`)
- **Delta 数量**: 21 个需求变更

## 提案结构

### 1. proposal.md
定义了迁移的目标、范围和影响：
- **目标**: 将 Figma Make (React + shadcn/ui) 代码迁移到 Vue 3 项目
- **技术栈变更**: 引入 shadcn-vue + Tailwind CSS
- **核心原则**: 保留所有业务逻辑（p5.js、KaTeX、智谱 AI、语音识别）
- **破坏性变更**: 移除所有手写 CSS，重构所有组件模板

### 2. design.md
详细的技术方案设计：
- **组件映射策略**: React → Vue 组件对照表
- **依赖配置**: shadcn-vue, Tailwind CSS, Radix Vue 等
- **布局架构**: Tailwind Flex 实现左右双栏（30% / 70%）
- **迁移计划**: 7 个阶段，预计 13 小时
- **风险评估**: 包体积、学习曲线、回归测试

### 3. tasks.md
详细的实施清单（14 个阶段，共 90+ 任务）：
1. 环境准备和依赖安装 (6 tasks)
2. 设计系统配置 (6 tasks)
3. shadcn-vue 基础组件引入 (11 tasks)
4. App.vue 主布局重构 (7 tasks)
5. ChatBox 组件重构 (15 tasks)
6. VisualCanvas 组件重构 (10 tasks)
7. ProjectileMotion 组件样式更新 (7 tasks)
8. 样式细节调整 (8 tasks)
9. 响应式和交互优化 (5 tasks)
10. 全面功能测试 (10 tasks)
11. 布局和样式测试 (8 tasks)
12. 代码清理和文档 (7 tasks)
13. 性能和优化 (5 tasks)
14. 最终验收 (5 tasks)

### 4. 规范变更 (specs/)

#### 4.1 ui-system (新增能力)
- Tailwind CSS 集成
- shadcn-vue 组件库
- 设计系统一致性（颜色、字体、间距）
- 响应式布局系统
- 组件工具函数（cn, cva）
- 无障碍支持
- 主题配置
- 图标系统

#### 4.2 chat-interface (修改现有能力)
- 使用 Card, ScrollArea, Textarea, Button 组件
- 消息气泡样式（用户/AI 区分）
- 输入控件（文本输入、语音输入、连续对话）
- 状态指示器（Toast, Badge, 波形动画）
- 响应式交互（hover, active, focus 效果）
- 无障碍增强

#### 4.3 visualization-canvas (修改现有能力)
- 使用 Card 组件重构容器
- 状态栏和控制面板样式
- ProjectileMotion 组件样式更新（保留 p5.js 逻辑）
- 空状态显示
- 可视化状态管理
- 响应式画布尺寸
- 视觉一致性

## 关键决策

### ✅ 采用的方案
1. **UI 库**: shadcn-vue（与 Figma 代码高度一致）
2. **样式**: Tailwind CSS（直接复用 Figma 类名）
3. **设计系统**: 完全采用 Figma 的 token 系统，放弃 A2UI 墨绿色主题
4. **迁移策略**: 仅更新模板和样式，保留所有业务逻辑

### ❌ 不采用的方案
- Element Plus / Naive UI（设计风格不符）
- 保留 A2UI 颜色系统（与 Figma 冲突）
- 重构状态管理（无必要）

## 待确认问题

在 design.md 的 "Open Questions" 中列出了 4 个问题：

1. **是否需要支持暗色模式？**
   - 建议：先实现亮色模式，暗色模式作为后续扩展

2. **是否需要保留 A2UI 的墨绿色主题？**
   - 建议：完全采用 Figma 的设计 token

3. **是否需要引入动画库（Framer Motion Vue）？**
   - 建议：先使用 Tailwind transition，复杂动画后续按需引入

4. **是否需要迁移 Figma 示例内容（生活记录卡片）？**
   - 建议：仅提取设计系统和组件，不迁移示例内容

## 下一步行动

### 需要用户确认：
1. 审查 proposal.md、design.md、tasks.md
2. 回答 "Open Questions" 中的 4 个问题
3. 确认是否同意放弃 A2UI 墨绿色主题，采用 Figma 的黑色主题
4. 批准开始实施

### 实施前准备：
```bash
# 查看提案详情
openspec show migrate-figma-ui-to-vue

# 查看具体规范变更
openspec show migrate-figma-ui-to-vue --json --deltas-only

# 开始实施（需要用户批准后）
# 按照 tasks.md 的顺序逐步执行
```

## 预期成果

迁移完成后，项目将获得：
- ✅ 现代化的设计系统（shadcn-vue + Tailwind CSS）
- ✅ 50+ 可复用的 UI 组件
- ✅ 与 Figma 设计 1:1 还原的视觉效果
- ✅ 更好的无障碍支持（Radix Vue）
- ✅ 更易维护的代码结构
- ✅ 保留所有现有功能（物理仿真、AI 对话、语音识别）

## 风险控制

- **打包体积**: 从 ~500KB 增加到 ~1.5MB（可接受）
- **学习曲线**: 文档完善，社区资源丰富
- **回归测试**: 分阶段迁移，每个组件迁移后立即测试
- **回滚方案**: Git 版本控制，可随时回滚
