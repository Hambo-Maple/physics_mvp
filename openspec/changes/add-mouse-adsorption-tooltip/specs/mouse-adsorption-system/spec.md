# Spec: 鼠标吸附系统

## ADDED Requirements

### Requirement: 鼠标吸附检测机制

系统 SHALL 在用户鼠标移动时检测是否靠近关键点或轨迹点，并在满足吸附条件时触发吸附效果。

#### Scenario: 鼠标靠近关键点触发吸附
- **Given** 平抛运动动画正在播放或暂停
- **When** 鼠标指针移动到距离关键点（初始位置/最高点/落地位置）10px 范围内
- **Then** 系统 SHALL 触发关键点吸附
- **And** 系统 SHALL 更新吸附状态为 `{ isActive: true, type: 'keypoint', target: <关键点对象> }`

#### Scenario: 鼠标靠近轨迹点触发吸附
- **Given** 平抛运动动画已绘制轨迹点
- **When** 鼠标指针移动到距离轨迹点 10px 范围内
- **And** 鼠标未靠近任何关键点
- **Then** 系统 SHALL 触发轨迹点吸附
- **And** 系统 SHALL 更新吸附状态为 `{ isActive: true, type: 'trajectory', target: <轨迹点对象> }`

#### Scenario: 鼠标移出吸附范围
- **Given** 系统正在吸附某个点
- **When** 鼠标指针移动到距离该点超过 10px
- **Then** 系统 SHALL 清除吸附状态
- **And** 系统 SHALL 在 0.2 秒后隐藏 tooltip

### Requirement: 吸附优先级机制

系统 SHALL 在鼠标同时靠近多个吸附目标时按优先级选择吸附目标。

#### Scenario: 关键点优先于轨迹点
- **Given** 鼠标同时靠近关键点和轨迹点（均在 10px 范围内）
- **When** 系统执行吸附检测
- **Then** 系统 SHALL 仅触发关键点吸附
- **And** 系统 SHALL 忽略轨迹点吸附

#### Scenario: 多个关键点重叠时按距离选择
- **Given** 多个关键点位置重叠或非常接近
- **When** 鼠标靠近这些关键点
- **Then** 系统 SHALL 选择距离鼠标最近的关键点
- **And** 系统 SHALL 仅触发该关键点的吸附

### Requirement: 可配置的吸附阈值

系统 SHALL 提供可配置参数调整吸附触发距离。

#### Scenario: 使用默认吸附阈值
- **Given** 系统未配置自定义吸附阈值
- **When** 系统初始化
- **Then** 系统 SHALL 使用默认阈值 10px

#### Scenario: 修改吸附阈值
- **Given** 开发者修改 `ADSORPTION_CONFIG.threshold` 为 15
- **When** 鼠标移动到距离关键点 12px 范围内
- **Then** 系统 SHALL 触发吸附（因为 12 < 15）

### Requirement: 拖拽时禁用吸附检测

系统 SHALL 在用户拖拽物体时禁用吸附检测，避免交互冲突。

#### Scenario: 拖拽物体时不触发吸附
- **Given** 用户正在拖拽运动物体（`animationState.isDragging === true`）
- **When** 鼠标移动到关键点或轨迹点附近
- **Then** 系统 SHALL NOT 触发吸附
- **And** 系统 SHALL 清除现有吸附状态（如果存在）

#### Scenario: 拖拽结束后恢复吸附检测
- **Given** 用户完成拖拽操作（`animationState.isDragging === false`）
- **When** 鼠标移动到关键点或轨迹点附近
- **Then** 系统 SHALL 正常触发吸附

### Requirement: 高性能的轨迹点检测

系统 SHALL 优化轨迹点吸附检测算法，确保不影响动画性能。

#### Scenario: 跳过画布外的轨迹点
- **Given** 轨迹点数组包含画布外的点
- **When** 系统执行轨迹点吸附检测
- **Then** 系统 SHALL 跳过画布外的点（不计算距离）
- **And** 系统 SHALL 仅检测可见范围内的点

#### Scenario: 使用平方距离比较
- **Given** 系统需要比较鼠标与轨迹点的距离
- **When** 系统执行距离计算
- **Then** 系统 SHALL 使用平方距离比较（避免 `Math.sqrt` 计算）
- **And** 系统 SHALL 在找到满足条件的点后立即返回（提前退出）

#### Scenario: 保持 60fps 动画性能
- **Given** 轨迹点数组包含 1000 个点
- **When** 用户移动鼠标触发吸附检测
- **Then** 系统 SHALL 在 1ms 内完成检测
- **And** 动画帧率 SHALL 保持 60fps

### Requirement: p5.js mouseMoved 事件集成

系统 SHALL 在 p5.js 的 mouseMoved 事件处理函数中调用吸附检测逻辑。

#### Scenario: mouseMoved 事件触发吸附检测
- **Given** p5.js 画布已初始化
- **When** 用户移动鼠标
- **Then** 系统 SHALL 触发 `p.mouseMoved()` 事件
- **And** 系统 SHALL 保存鼠标位置到 `adsorptionState.mousePos`
- **And** 系统 SHALL 调用 `detectAdsorption(p.mouseX, p.mouseY)`

#### Scenario: 保留原有 mouseMoved 逻辑
- **Given** 原有 `p.mouseMoved()` 包含物体悬停检测逻辑
- **When** 添加吸附检测逻辑
- **Then** 系统 SHALL 保留原有逻辑（`animationState.isHovering` 更新）
- **And** 系统 SHALL 确保两者不冲突

### Requirement: 吸附状态管理函数

系统 SHALL 提供清晰的 API 用于更新和清除吸附状态。

#### Scenario: 更新吸附状态
- **Given** 系统检测到吸附目标
- **When** 调用 `updateAdsorptionState(type, target)`
- **Then** 系统 SHALL 更新 `adsorptionState.isActive` 为 `true`
- **And** 系统 SHALL 更新 `adsorptionState.type` 为传入的类型
- **And** 系统 SHALL 更新 `adsorptionState.target` 为传入的目标对象
- **And** 系统 SHALL 清除 `tooltip.fadeOutTimer`（如果存在）
- **And** 系统 SHALL 调用 `updateTooltip(type, target)`

#### Scenario: 清除吸附状态
- **Given** 系统正在吸附某个点
- **When** 调用 `clearAdsorptionState()`
- **Then** 系统 SHALL 更新 `adsorptionState.isActive` 为 `false`
- **And** 系统 SHALL 重置 `adsorptionState.type` 和 `target` 为 `null`
- **And** 系统 SHALL 设置 `tooltip.fadeOutTimer`（延迟 0.2 秒隐藏 tooltip）

#### Scenario: 避免重复清除
- **Given** 吸附状态已清除（`adsorptionState.isActive === false`）
- **When** 再次调用 `clearAdsorptionState()`
- **Then** 系统 SHALL 提前返回（不执行任何操作）

### Requirement: 组件卸载时清理吸附状态

系统 SHALL 在组件卸载时清理定时器和状态，避免内存泄漏。

#### Scenario: 组件卸载时清除定时器
- **Given** `tooltip.fadeOutTimer` 存在
- **When** 组件触发 `onUnmounted` 生命周期
- **Then** 系统 SHALL 调用 `clearTimeout(tooltip.fadeOutTimer)`
- **And** 系统 SHALL 重置 `tooltip.fadeOutTimer` 为 `null`

#### Scenario: 参数变化时清除吸附状态
- **Given** 用户修改参数（v0、g、h、theta）
- **When** 参数 `watch` 触发
- **Then** 系统 SHALL 调用 `clearAdsorptionState()`
- **And** 系统 SHALL 避免显示过期数据
