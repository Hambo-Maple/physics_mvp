# Tasks: 鼠标吸附与信息悬浮展示功能

## 阶段 1：基础架构搭建

- [x] 1.1 定义吸附状态数据结构
  - 在 `ProjectileMotion.vue` 中添加 `adsorptionState` reactive 对象
  - 定义字段：`isActive`、`type`、`target`、`mousePos`
  - 添加 `ADSORPTION_CONFIG` 常量（threshold、fadeOutDelay）

- [x] 1.2 定义 tooltip 状态数据结构
  - 添加 `tooltip` reactive 对象
  - 定义字段：`visible`、`x`、`y`、`content`、`fadeOutTimer`

- [x] 1.3 添加 tooltip DOM 结构
  - 在 `<template>` 中添加 `<div class="tooltip">` 元素
  - 使用 `v-if="tooltip.visible"` 控制显示
  - 使用 `:style` 绑定位置（`left`、`top`）
  - 使用 `v-html="tooltip.content"` 渲染内容

## 阶段 2：吸附检测逻辑

- [x] 2.1 实现关键点吸附检测函数
  - 创建 `checkKeyPointAdsorption(mouseX, mouseY)` 函数
  - 遍历 `keyPoints`（start、peak、landing）
  - 计算鼠标与关键点的距离（canvas 坐标）
  - 返回距离最近且 < threshold 的关键点

- [x] 2.2 实现轨迹点吸附检测函数
  - 创建 `checkTrajectoryAdsorption(mouseX, mouseY)` 函数
  - 遍历 `animationState.pathPoints` 数组
  - 跳过画布外的点（优化性能）
  - 使用平方距离比较（避免 `Math.sqrt`）
  - 返回距离最近且 < threshold 的轨迹点

- [x] 2.3 实现吸附检测主函数
  - 创建 `detectAdsorption(mouseX, mouseY)` 函数
  - 优先调用 `checkKeyPointAdsorption()`
  - 若无关键点吸附，调用 `checkTrajectoryAdsorption()`
  - 若无吸附目标，调用 `clearAdsorptionState()`

- [x] 2.4 集成到 p5.js mouseMoved 事件
  - 在 `p.mouseMoved()` 中保存鼠标位置到 `adsorptionState.mousePos`
  - 检查 `animationState.isDragging`，拖拽时跳过吸附检测
  - 调用 `detectAdsorption(p.mouseX, p.mouseY)`

## 阶段 3：吸附状态管理

- [x] 3.1 实现吸附状态更新函数
  - 创建 `updateAdsorptionState(type, target)` 函数
  - 更新 `adsorptionState` 字段
  - 清除 `tooltip.fadeOutTimer`（如果存在）
  - 调用 `updateTooltip(type, target)`

- [x] 3.2 实现吸附状态清除函数
  - 创建 `clearAdsorptionState()` 函数
  - 检查 `adsorptionState.isActive`，避免重复清除
  - 重置 `adsorptionState` 字段
  - 设置 `tooltip.fadeOutTimer`（延迟 0.2 秒隐藏）

- [x] 3.3 添加状态清理逻辑
  - 在组件 `onUnmounted` 中清除 `tooltip.fadeOutTimer`
  - 在参数变化时清除吸附状态（避免显示过期数据）

## 阶段 4：视觉反馈绘制

- [x] 4.1 实现关键点高亮绘制函数
  - 创建 `drawKeyPointHighlight(p)` 函数
  - 检查 `adsorptionState.isActive` 和 `type === 'keypoint'`
  - 获取 `target` 并转换为 canvas 坐标
  - 绘制放大 1.5 倍的圆（颜色 #004d33，白色描边）

- [x] 4.2 实现轨迹点高亮绘制函数
  - 创建 `drawTrajectoryHighlight(p)` 函数
  - 检查 `adsorptionState.isActive` 和 `type === 'trajectory'`
  - 获取 `target` 并转换为 canvas 坐标
  - 绘制白色描边圆（2px 描边，无填充）

- [x] 4.3 集成到 p5.js draw 循环
  - 在 `p.draw()` 中调用 `drawKeyPointHighlight(p)`
  - 在 `p.draw()` 中调用 `drawTrajectoryHighlight(p)`
  - 确保在绘制物体之前调用（避免遮挡）

## 阶段 5：Tooltip 内容生成

- [x] 5.1 实现关键点信息生成函数
  - 创建 `generateKeyPointInfo(keypoint)` 函数
  - 定义关键点类型名称映射（start → 初始位置）
  - 定义关键点公式映射（start → 位移公式）
  - 调用 `calculateVelocity()` 获取速度
  - 拼接 HTML 字符串（标题、坐标、时间、速度、公式）
  - 数值保留 2 位小数，添加单位

- [x] 5.2 实现轨迹点信息生成函数
  - 创建 `generateTrajectoryInfo(point)` 函数
  - 调用 `calculateVelocity()` 获取速度
  - 计算位移差（`deltaX`、`deltaY`）
  - 拼接 HTML 字符串（标题、坐标、时间、速度、位移差）
  - 数值保留 2 位小数，添加单位

- [x] 5.3 实现数值格式化工具函数
  - 创建 `formatPhysicsValue(value, unit)` 函数
  - 保留 2 位小数
  - 添加单位（m、m/s、s）
  - 处理特殊值（Infinity、NaN）

## 阶段 6：Tooltip 位置计算

- [x] 6.1 实现位置计算函数
  - 创建 `calculateTooltipPosition(mouseX, mouseY, tooltipWidth, tooltipHeight)` 函数
  - 默认位置：鼠标右侧 10px
  - 右边界检测：超出则显示在左侧
  - 底边界检测：超出则贴底显示
  - 顶边界检测：超出则贴顶显示
  - 返回 `{ x, y }` 对象

- [x] 6.2 实现 tooltip 尺寸获取
  - 在 `updateTooltip()` 中获取 tooltip DOM 元素
  - 使用 `getBoundingClientRect()` 获取实际尺寸
  - 首次显示时使用预估尺寸（300x150）

- [x] 6.3 实现 tooltip 更新函数
  - 创建 `updateTooltip(type, target)` 函数
  - 调用 `generateKeyPointInfo()` 或 `generateTrajectoryInfo()` 生成内容
  - 调用 `calculateTooltipPosition()` 计算位置
  - 更新 `tooltip` 状态（content、x、y、visible）
  - 使用 `nextTick()` 确保 DOM 更新后渲染 KaTeX

## 阶段 7：KaTeX 公式渲染

- [x] 7.1 集成 KaTeX 渲染
  - 在 `updateTooltip()` 的 `nextTick()` 中调用 `renderMathInElement()`
  - 传入 tooltip DOM 元素
  - 处理渲染失败情况（显示原始 LaTeX）

- [x] 7.2 实现公式缓存优化
  - 在 `onMounted` 中预渲染关键点公式
  - 创建 `formulaCache` 对象存储渲染结果
  - 在 `generateKeyPointInfo()` 中使用缓存

- [x] 7.3 验证公式渲染效果
  - 检查行内公式样式（字号、颜色）
  - 确保公式与文字对齐
  - 验证特殊符号（θ、Δ、√）正常显示

## 阶段 8：Tooltip 样式实现

- [x] 8.1 添加 tooltip 基础样式
  - 创建 `.tooltip` 样式类
  - 设置背景色（#f5f5f5，透明度 0.9）
  - 设置文字颜色（#333）、字体大小（14px）
  - 设置内边距（12px）、圆角（4px）
  - 设置 `position: absolute`、`z-index: 100`
  - 设置 `pointer-events: none`（不拦截鼠标事件）

- [x] 8.2 添加 tooltip 内容样式
  - 创建 `.tooltip-title` 样式（16px、加粗、墨绿色 #006644）
  - 创建 `.tooltip-item` 样式（14px、行高 1.6）
  - 创建 `.tooltip-formula` 样式（墨绿色、居中对齐）
  - 设置 `<strong>` 标签样式（加粗、墨绿色）

- [x] 8.3 添加淡出动画
  - 设置 `transition: opacity 0.2s`
  - 使用 `opacity: 0` 实现淡出效果
  - 在 `clearAdsorptionState()` 中先设置 `opacity: 0`，再延迟隐藏

## 阶段 9：性能优化

- [x] 9.1 优化轨迹点检测性能
  - 跳过画布外的点（减少 50% 计算量）
  - 使用平方距离比较（避免 `Math.sqrt`）
  - 提前退出（找到第一个满足条件的点）

- [x] 9.2 优化 tooltip 更新性能
  - 使用 `requestAnimationFrame` 节流
  - 添加 `tooltipUpdateScheduled` 标志位
  - 避免频繁 DOM 操作

- [x] 9.3 优化 KaTeX 渲染性能
  - 预渲染关键点公式（组件初始化时）
  - 缓存渲染结果（避免重复渲染）
  - 仅在内容变化时重新渲染

## 阶段 10：兼容性处理

- [x] 10.1 处理拖拽冲突
  - 在 `detectAdsorption()` 中检查 `animationState.isDragging`
  - 拖拽时跳过吸附检测
  - 拖拽时清除吸附状态

- [x] 10.2 处理点击冲突
  - 设置 tooltip `pointer-events: none`
  - 确保点击空白区域正常触发暂停/播放
  - 验证 tooltip 不拦截鼠标事件

- [x] 10.3 处理参数变化
  - 在参数 `watch` 中清除吸附状态
  - 避免显示过期数据
  - 确保 tooltip 内容实时更新

## 阶段 11：边界情况处理

- [x] 11.1 处理轨迹点为空
  - 在 `checkTrajectoryAdsorption()` 中检查 `pathPoints.length === 0`
  - 提前返回 `null`

- [x] 11.2 处理关键点重叠
  - 按优先级返回（起点 > 最高点 > 落地点）
  - 确保不会同时吸附多个关键点

- [x] 11.3 处理 tooltip 超出画布
  - 在 `calculateTooltipPosition()` 中检测边界
  - 自动调整显示方向（左/上/下）

- [x] 11.4 处理物理计算异常
  - 在 `generateKeyPointInfo()` 中检查 `NaN`
  - 显示 "计算错误" 提示
  - 避免显示 `NaN` 或 `Infinity`

## 阶段 12：测试与验证

- [x] 12.1 功能测试
  - 测试关键点吸附（距离 < 10px 触发）
  - 测试轨迹点吸附（距离 < 10px 触发）
  - 测试吸附优先级（关键点 > 轨迹点）
  - 测试吸附消失（移出 > 10px 后 0.2 秒消失）

- [x] 12.2 视觉测试
  - 验证关键点高亮（放大 1.5 倍 + 颜色 #004d33）
  - 验证轨迹点高亮（白色描边 2px）
  - 验证 tooltip 样式（半透明背景、文字颜色）
  - 验证 KaTeX 公式渲染（行内公式、字号）

- [x] 12.3 性能测试
  - 使用 Chrome DevTools Performance 监控帧率
  - 验证动画保持 60fps（吸附检测不影响性能）
  - 验证轨迹点检测耗时 < 1ms（1000 个点）
  - 验证长时间运行无内存泄漏（10 分钟）

- [x] 12.4 兼容性测试
  - 测试拖拽物体时不触发吸附
  - 测试点击空白区域正常暂停/播放
  - 测试参数调节后 tooltip 内容更新
  - 测试窗口缩放后 tooltip 位置正确

- [x] 12.5 边界情况测试
  - 测试轨迹点为空时不报错
  - 测试关键点重叠时正确吸附
  - 测试 tooltip 超出画布时自动调整
  - 测试物理计算异常时显示错误提示

## 阶段 13：文档与收尾

- [x] 13.1 添加代码注释
  - 在吸附检测函数中添加完整中文注释
  - 在 tooltip 生成函数中添加参数说明
  - 在位置计算函数中添加算法说明

- [x] 13.2 更新 tasks.md
  - 标记所有已完成任务为 `[x]`
  - 确认所有功能已实现

- [x] 13.3 最终验证
  - 运行 `npm run dev` 启动项目
  - 完整测试所有功能（吸附、tooltip、视觉反馈）
  - 确认无控制台错误或警告
  - 确认性能指标达标（60fps）

## 验收标准

- ✅ 鼠标悬停关键点时，tooltip 显示完整信息（类型、坐标、时间、速度、公式）
- ✅ 鼠标悬停轨迹点时，tooltip 显示完整信息（坐标、时间、速度、位移差）
- ✅ 吸附触发时，关键点/轨迹点高亮显示
- ✅ Tooltip 位置自适应，不超出画布边界
- ✅ KaTeX 公式正常渲染，样式与现有公式统一
- ✅ 动画帧率保持 60fps（吸附检测不影响性能）
- ✅ 不影响现有拖拽、点击暂停/播放功能
- ✅ 配色符合 A2UI 规范（墨绿色主题）
- ✅ 数值保留 2 位小数，单位统一标注
