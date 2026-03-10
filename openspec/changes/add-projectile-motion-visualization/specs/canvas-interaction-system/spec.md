# Spec: 画布交互系统

## 概述

提供基于 p5.js 的画布交互功能，包括鼠标拖拽物体、点击暂停/播放、交互冲突处理、视觉反馈等。

## ADDED Requirements

### Requirement: 鼠标拖拽物体

系统 SHALL 支持鼠标拖拽运动物体修改初始位置（高度和水平位置），实时更新参数和轨迹。

#### Scenario: 检测点击物体

**Given** 动画处于停止或暂停状态
**And** 物体当前位置为 (x=0, y=50)，Canvas 坐标为 (100, 200)
**When** 用户鼠标按下位置 (105, 205)
**Then** 计算鼠标与物体中心距离 dist = √((105-100)² + (205-200)²) ≈ 7.07px
**And** dist < 20px（点击阈值），判定为点击物体
**And** 设置 animationState.isDragging = true
**And** 设置 animationState.dragTarget = 'object'

#### Scenario: 拖拽修改初始高度

**Given** 用户正在拖拽物体，isDragging = true
**When** 鼠标移动到新位置 (100, 150)
**Then** 将 Canvas 坐标转换为物理坐标
**And** 更新 params.h = 新的物理高度
**And** 限制 h 在 10-200m 范围内
**And** 调用 recalculateKeyPoints() 重新计算关键点
**And** 清空已有轨迹点

#### Scenario: 拖拽时显示高度数值

**Given** 用户正在拖拽物体
**When** 鼠标移动
**Then** 在物体旁边显示当前高度文字（如"h = 65.3m"）
**And** 文字颜色 #006644，字号 14px
**And** 文字位置跟随鼠标，偏移 (20, -10) 避免遮挡

#### Scenario: 拖拽超出范围限制

**Given** 用户拖拽物体向上移动
**When** 计算的物理高度超过 200m
**Then** 限制 params.h = 200
**And** 物体停留在最大高度位置
**And** 显示提示"已达到最大高度 200m"

#### Scenario: 松开鼠标结束拖拽

**Given** 用户正在拖拽物体，isDragging = true
**When** 用户松开鼠标（mouseReleased 事件）
**Then** 设置 animationState.isDragging = false
**And** 设置 animationState.dragTarget = null
**And** 隐藏高度数值提示
**And** 不触发点击暂停/播放事件（提前 return）

---

### Requirement: 点击暂停/播放

系统 SHALL 支持点击画布空白区域切换动画播放状态，与拖拽交互区分。

#### Scenario: 点击空白区域播放动画

**Given** 动画处于暂停状态，isPlaying = false
**When** 用户点击画布空白区域（非物体区域）
**Then** 检测鼠标与物体距离 > 20px
**And** 调用 togglePlayPause()
**And** 设置 animationState.isPlaying = true
**And** 播放按钮文字变为"暂停"

#### Scenario: 点击空白区域暂停动画

**Given** 动画正在播放，isPlaying = true
**When** 用户点击画布空白区域
**Then** 调用 togglePlayPause()
**And** 设置 animationState.isPlaying = false
**And** 播放按钮文字变为"播放"
**And** 物体停留在当前位置

#### Scenario: 点击物体不触发暂停/播放

**Given** 动画正在播放
**When** 用户点击物体区域（距离 < 20px）
**Then** 进入拖拽模式，不调用 togglePlayPause()
**And** 动画状态保持不变

---

### Requirement: 交互冲突处理

系统 MUST 处理拖拽与点击的冲突，确保交互逻辑清晰无误。

#### Scenario: 拖拽松开不触发点击

**Given** 用户正在拖拽物体，isDragging = true
**When** 用户松开鼠标（mouseReleased 事件）
**Then** 检测到 isDragging = true
**And** 重置 isDragging = false
**And** 提前 return，不执行点击暂停/播放逻辑
**And** 避免拖拽结束时误触发播放状态切换

#### Scenario: 快速点击物体

**Given** 用户快速点击物体（按下并立即松开，无拖拽）
**When** mousePressed 检测到点击物体，设置 isDragging = true
**And** mouseReleased 立即触发
**Then** 检测到 isDragging = true，不触发暂停/播放
**And** 重置 isDragging = false
**And** 避免误判为点击空白区域

#### Scenario: 拖拽到物体外松开

**Given** 用户从物体开始拖拽，移动到画布边缘
**When** 用户松开鼠标
**Then** 仍然检测到 isDragging = true
**And** 不触发点击暂停/播放
**And** 正确结束拖拽状态

---

### Requirement: 视觉反馈

系统 SHALL 提供清晰的视觉反馈，增强交互体验。

#### Scenario: 鼠标悬停物体

**Given** 鼠标移动到画布上
**When** 鼠标与物体距离 < 20px
**Then** 鼠标光标变为手型（cursor: pointer）
**And** 物体边框高亮（2px 白色边框）
**When** 鼠标移出物体区域
**Then** 鼠标光标恢复默认（cursor: default）
**And** 物体边框消失

#### Scenario: 拖拽时物体高亮

**Given** 用户正在拖拽物体
**When** 渲染物体
**Then** 物体边框显示为 2px 白色
**And** 物体阴影增强（shadow: 0 0 10px rgba(0,102,68,0.5)）
**And** 视觉上明显区分拖拽状态

#### Scenario: 拖拽时显示辅助线

**Given** 用户正在拖拽物体
**When** 渲染画布
**Then** 绘制水平虚线从物体到 Y 轴（显示高度）
**And** 虚线颜色 #999，线宽 1px
**And** 在 Y 轴位置显示高度刻度标签

#### Scenario: 点击空白区域无视觉反馈

**Given** 用户点击画布空白区域
**When** 触发暂停/播放
**Then** 不显示点击波纹或高亮效果
**And** 仅通过播放按钮状态变化反馈

---

### Requirement: 触摸设备支持（预留）

系统 SHALL 预留触摸设备支持接口，当前版本仅支持鼠标交互。

#### Scenario: 触摸拖拽（未实现）

**Given** 用户在触摸设备上操作
**When** 触摸物体并拖动
**Then** 当前版本不支持，显示提示"请使用鼠标操作"
**And** 预留 touchStart、touchMove、touchEnd 事件处理函数

#### Scenario: 触摸点击（未实现）

**Given** 用户在触摸设备上点击画布
**When** 触发 touchStart 事件
**Then** 当前版本不支持
**And** 预留事件处理逻辑

---

### Requirement: 交互状态管理

系统 SHALL 管理交互相关的状态，确保状态一致性和可追溯性。

#### Scenario: 初始化交互状态

**Given** ProjectileMotion 组件挂载
**When** 初始化 animationState
**Then** isDragging = false
**And** dragTarget = null
**And** isHovering = false

#### Scenario: 拖拽状态转换

**Given** 初始状态 isDragging = false
**When** 用户点击物体
**Then** isDragging = true, dragTarget = 'object'
**When** 用户松开鼠标
**Then** isDragging = false, dragTarget = null

#### Scenario: 悬停状态转换

**Given** 初始状态 isHovering = false
**When** 鼠标移入物体区域
**Then** isHovering = true
**When** 鼠标移出物体区域
**Then** isHovering = false

#### Scenario: 状态同步到全局

**Given** 用户拖拽修改初始高度 h = 80
**When** 拖拽结束
**Then** 更新 state.projectileParams.h = 80
**And** 全局状态与组件状态保持同步

---

### Requirement: 边界条件处理

系统 SHALL 处理边界情况，确保交互逻辑健壮。

#### Scenario: 画布外松开鼠标

**Given** 用户正在拖拽物体
**When** 鼠标移出画布区域并松开
**Then** 仍然触发 mouseReleased 事件
**And** 正确结束拖拽状态
**And** 参数更新为最后一次有效位置

#### Scenario: 快速连续点击

**Given** 用户快速连续点击空白区域 3 次
**When** 每次点击触发 togglePlayPause()
**Then** 播放状态依次切换：播放 → 暂停 → 播放
**And** 不出现状态错乱或卡死

#### Scenario: 拖拽时窗口失焦

**Given** 用户正在拖拽物体
**When** 窗口失去焦点（如切换标签页）
**Then** 自动结束拖拽状态（监听 blur 事件）
**And** 重置 isDragging = false
**And** 避免拖拽状态残留

#### Scenario: 动画播放时拖拽

**Given** 动画正在播放，isPlaying = true
**When** 用户点击物体开始拖拽
**Then** 自动暂停动画（设置 isPlaying = false）
**And** 进入拖拽模式
**And** 避免拖拽时物体继续运动

---

### Requirement: 性能优化

系统 SHALL 优化交互性能，确保响应及时、流畅。

#### Scenario: 鼠标移动事件节流

**Given** 用户快速移动鼠标
**When** 触发大量 mouseMoved 事件
**Then** 使用节流（throttle）限制处理频率为 60fps
**And** 避免过度计算悬停状态
**And** 减少 CPU 占用

#### Scenario: 拖拽时减少重绘

**Given** 用户正在拖拽物体
**When** 每帧更新
**Then** 仅重绘必要元素（物体、辅助线、高度标签）
**And** 不重绘轨迹和关键节点（已清空）
**And** 提高拖拽流畅度

#### Scenario: 距离计算优化

**Given** 需要判断鼠标是否在物体区域
**When** 计算距离
**Then** 使用平方距离比较（避免开方）
**And** dist² < 20² 即可判定
**And** 减少计算开销

---

### Requirement: 可访问性（预留）

系统 SHALL 预留键盘操作和屏幕阅读器支持，当前版本仅支持鼠标交互。

#### Scenario: 键盘拖拽（未实现）

**Given** 用户使用键盘操作
**When** 按下方向键
**Then** 当前版本不支持
**And** 预留 keyPressed 事件处理函数
**And** 未来可实现：上下键调节高度，左右键调节水平位置

#### Scenario: 屏幕阅读器支持（未实现）

**Given** 用户使用屏幕阅读器
**When** 聚焦到画布
**Then** 当前版本不支持
**And** 预留 ARIA 标签和角色定义
**And** 未来可实现：朗读当前参数和动画状态

---

### Requirement: 错误处理

系统 SHALL 处理交互过程中的异常情况，确保不影响用户体验。

#### Scenario: 坐标转换失败

**Given** 用户拖拽物体到极端位置
**When** 调用 canvasToPhysics 转换坐标
**And** 转换结果为 NaN 或 Infinity
**Then** 使用上一次有效值
**And** 显示错误提示"坐标转换失败，请重试"
**And** 不更新参数

#### Scenario: 参数更新失败

**Given** 用户拖拽修改高度
**When** 调用 validateParams 验证失败
**Then** 不更新 params.h
**And** 显示错误提示（红色文字）
**And** 物体回到上一次有效位置

#### Scenario: p5 实例未初始化

**Given** 组件刚挂载，p5 实例尚未创建
**When** 用户尝试点击画布
**Then** 检测到 p5Instance = null
**And** 不执行交互逻辑
**And** 显示提示"画布正在加载，请稍候"

---

### Requirement: 调试与日志

系统 SHALL 提供调试信息，便于开发和问题排查。

#### Scenario: 开发模式日志

**Given** 应用运行在开发模式
**When** 用户拖拽物体
**Then** 控制台输出日志"[Drag] Start at (100, 200)"
**And** 拖拽过程中输出"[Drag] Move to (150, 180), h = 65.3m"
**And** 拖拽结束输出"[Drag] End, final h = 65.3m"

#### Scenario: 生产模式无日志

**Given** 应用运行在生产模式
**When** 用户进行任何交互
**Then** 不输出控制台日志
**And** 减少性能开销

#### Scenario: 错误日志

**Given** 交互过程中发生错误
**When** 捕获异常
**Then** 控制台输出错误日志"[Error] Coordinate conversion failed: ..."
**And** 包含错误堆栈和上下文信息
**And** 便于问题定位

---

### Requirement: 测试支持

系统 SHALL 提供测试接口，便于自动化测试和手动测试。

#### Scenario: 模拟鼠标点击

**Given** 编写自动化测试
**When** 调用 simulateMouseClick(x, y)
**Then** 触发 mousePressed 和 mouseReleased 事件
**And** 执行相应的交互逻辑
**And** 可验证播放状态切换

#### Scenario: 模拟拖拽操作

**Given** 编写自动化测试
**When** 调用 simulateDrag(startX, startY, endX, endY)
**Then** 依次触发 mousePressed、mouseDragged、mouseReleased
**And** 可验证参数更新和轨迹重算

#### Scenario: 获取交互状态

**Given** 编写测试断言
**When** 调用 getInteractionState()
**Then** 返回 { isDragging, dragTarget, isHovering, isPlaying }
**And** 可验证状态转换是否正确

---

### Requirement: 文档与注释

系统 SHALL 提供完整的中文注释，MUST 说明交互逻辑、状态管理、冲突处理。

#### Scenario: 交互逻辑注释

**Given** 查看 mousePressed 函数
**When** 阅读注释
**Then** 说明点击检测逻辑（距离判断）
**And** 说明拖拽和点击的优先级
**And** 说明状态更新流程

#### Scenario: 冲突处理注释

**Given** 查看 mouseReleased 函数
**When** 阅读注释
**Then** 说明为何需要检查 isDragging 标志位
**And** 说明如何避免拖拽松开时触发点击
**And** 提供示例场景说明

#### Scenario: 状态管理注释

**Given** 查看 animationState 定义
**When** 阅读注释
**Then** 说明每个状态字段的含义
**And** 说明状态转换规则
**And** 说明与全局状态的同步机制
