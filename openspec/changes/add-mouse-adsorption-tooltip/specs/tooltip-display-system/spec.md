# Spec: Tooltip 展示系统

## ADDED Requirements

### Requirement: 跟随鼠标的 tooltip 弹窗

系统 SHALL 在吸附触发时显示跟随鼠标的 tooltip，展示物理信息。

#### Scenario: 吸附触发时显示 tooltip
- **Given** 系统触发吸附（关键点或轨迹点）
- **When** 调用 `updateTooltip(type, target)`
- **Then** 系统 SHALL 设置 `tooltip.visible` 为 `true`
- **And** 系统 SHALL 在 DOM 中渲染 tooltip 元素

#### Scenario: 吸附消失时隐藏 tooltip
- **Given** 系统清除吸附状态
- **When** 0.2 秒延迟后
- **Then** 系统 SHALL 设置 `tooltip.visible` 为 `false`
- **And** 系统 SHALL 从 DOM 中移除 tooltip 元素

#### Scenario: tooltip 不拦截鼠标事件
- **Given** tooltip 正在显示
- **When** 用户点击 tooltip 覆盖的区域
- **Then** 系统 SHALL 将鼠标事件传递到下层元素
- **And** 系统 SHALL 正常触发点击暂停/播放功能

### Requirement: tooltip 位置自适应算法

系统 SHALL 根据鼠标位置和画布边界自动调整 tooltip 显示位置。

#### Scenario: 默认显示在鼠标右侧
- **Given** 鼠标位置距离画布右边缘 > tooltip 宽度 + 10px
- **When** 系统计算 tooltip 位置
- **Then** 系统 SHALL 将 tooltip 显示在鼠标右侧 10px 处

#### Scenario: 靠近右边缘时显示在左侧
- **Given** 鼠标位置距离画布右边缘 < tooltip 宽度 + 10px
- **When** 系统计算 tooltip 位置
- **Then** 系统 SHALL 将 tooltip 显示在鼠标左侧 10px 处

#### Scenario: 靠近底边缘时贴底显示
- **Given** 鼠标位置距离画布底边缘 < tooltip 高度
- **When** 系统计算 tooltip 位置
- **Then** 系统 SHALL 将 tooltip 贴底显示（y = canvasHeight - tooltipHeight）

#### Scenario: 靠近顶边缘时贴顶显示
- **Given** 鼠标位置距离画布顶边缘 < 0
- **When** 系统计算 tooltip 位置
- **Then** 系统 SHALL 将 tooltip 贴顶显示（y = 0）

### Requirement: 关键点信息内容生成

系统 SHALL 为不同类型的关键点生成完整的物理信息。

#### Scenario: 生成初始位置信息
- **Given** 吸附目标为初始位置关键点
- **When** 调用 `generateKeyPointInfo(keypoint)`
- **Then** 系统 SHALL 返回包含以下内容的 HTML 字符串：
  - 标题："初始位置"
  - 坐标：(x: 0.00 m, y: <h> m)
  - 运动时间：t = 0.00 s
  - 瞬时速度：vₓ、vᵧ、合速度
  - 物理公式：位移公式（KaTeX 格式）

#### Scenario: 生成最高点信息
- **Given** 吸附目标为最高点关键点
- **When** 调用 `generateKeyPointInfo(keypoint)`
- **Then** 系统 SHALL 返回包含以下内容的 HTML 字符串：
  - 标题："最高点"
  - 坐标：(x: <peak.x> m, y: <peak.y> m)
  - 运动时间：t = <peak.t> s
  - 瞬时速度：vₓ、vᵧ = 0、合速度
  - 物理公式：vᵧ = 0 → t = (v₀·sinθ)/g

#### Scenario: 生成落地位置信息
- **Given** 吸附目标为落地位置关键点
- **When** 调用 `generateKeyPointInfo(keypoint)`
- **Then** 系统 SHALL 返回包含以下内容的 HTML 字符串：
  - 标题："落地位置"
  - 坐标：(x: <landing.x> m, y: 0.00 m)
  - 运动时间：t = <landing.t> s
  - 瞬时速度：vₓ、vᵧ、合速度
  - 物理公式：落地时间公式（KaTeX 格式）

### Requirement: 轨迹点信息内容生成

系统 SHALL 为轨迹点生成完整的物理信息。

#### Scenario: 生成轨迹点信息
- **Given** 吸附目标为轨迹点
- **When** 调用 `generateTrajectoryInfo(point)`
- **Then** 系统 SHALL 返回包含以下内容的 HTML 字符串：
  - 标题："轨迹点"
  - 坐标：(x: <point.x> m, y: <point.y> m)
  - 运动时间：t = <point.t> s
  - 瞬时速度：vₓ、vᵧ
  - 位移差：Δx（与起点水平差），Δy（与起点竖直差）

#### Scenario: 计算位移差
- **Given** 轨迹点坐标为 (x: 10, y: 45)，起点坐标为 (x: 0, y: 50)
- **When** 系统计算位移差
- **Then** 系统 SHALL 计算 Δx = 10 - 0 = 10.00 m
- **And** 系统 SHALL 计算 Δy = 45 - 50 = -5.00 m

### Requirement: 物理数值格式化

系统 SHALL 统一格式化所有物理数值，保留 2 位小数并添加单位。

#### Scenario: 格式化坐标值
- **Given** 坐标值为 12.3456
- **When** 系统格式化该值
- **Then** 系统 SHALL 返回 "12.35 m"

#### Scenario: 格式化速度值
- **Given** 速度值为 9.876
- **When** 系统格式化该值
- **Then** 系统 SHALL 返回 "9.88 m/s"

#### Scenario: 格式化时间值
- **Given** 时间值为 3.14159
- **When** 系统格式化该值
- **Then** 系统 SHALL 返回 "3.14 s"

#### Scenario: 处理特殊值
- **Given** 数值为 `Infinity` 或 `NaN`
- **When** 系统格式化该值
- **Then** 系统 SHALL 返回 "计算错误"

### Requirement: KaTeX 公式渲染集成

系统 SHALL 在 tooltip 中渲染 LaTeX 格式的物理公式。

#### Scenario: 渲染关键点公式
- **Given** tooltip 内容包含 LaTeX 公式（如 `$v_y = 0$`）
- **When** 系统更新 tooltip 内容
- **Then** 系统 SHALL 在 `nextTick()` 中调用 `renderMathInElement()`
- **And** 系统 SHALL 将 LaTeX 公式渲染为可视化数学符号

#### Scenario: 处理公式渲染失败
- **Given** LaTeX 公式语法错误
- **When** KaTeX 渲染失败
- **Then** 系统 SHALL 显示原始 LaTeX 字符串
- **And** 系统 SHALL NOT 抛出错误（避免中断程序）

#### Scenario: 使用公式缓存优化性能
- **Given** 关键点公式固定不变
- **When** 组件初始化（`onMounted`）
- **Then** 系统 SHALL 预渲染所有关键点公式
- **And** 系统 SHALL 将渲染结果存储到 `formulaCache` 对象
- **And** 系统 SHALL 在生成内容时使用缓存（避免重复渲染）

### Requirement: tooltip 样式实现

系统 SHALL 为 tooltip 应用符合 A2UI 规范的样式。

#### Scenario: 应用基础样式
- **Given** tooltip 元素已渲染到 DOM
- **When** 系统应用 CSS 样式
- **Then** 系统 SHALL 设置背景色为 #f5f5f5，透明度 0.9
- **And** 系统 SHALL 设置文字颜色为 #333，字体大小 14px
- **And** 系统 SHALL 设置内边距 12px，圆角 4px
- **And** 系统 SHALL 设置 `position: absolute`，`z-index: 100`
- **And** 系统 SHALL 设置 `pointer-events: none`

#### Scenario: 应用标题样式
- **Given** tooltip 包含标题元素（`.tooltip-title`）
- **When** 系统应用 CSS 样式
- **Then** 系统 SHALL 设置字体大小 16px，加粗
- **And** 系统 SHALL 设置颜色为墨绿色 #006644

#### Scenario: 应用内容样式
- **Given** tooltip 包含内容元素（`.tooltip-item`）
- **When** 系统应用 CSS 样式
- **Then** 系统 SHALL 设置字体大小 14px，行高 1.6
- **And** 系统 SHALL 设置 `<strong>` 标签颜色为墨绿色 #006644，加粗

#### Scenario: 应用公式样式
- **Given** tooltip 包含公式元素（`.tooltip-formula`）
- **When** 系统应用 CSS 样式
- **Then** 系统 SHALL 设置颜色为墨绿色 #006644
- **And** 系统 SHALL 设置文字居中对齐

### Requirement: tooltip 淡出动画实现

系统 SHALL 在 tooltip 消失时应用平滑的淡出动画。

#### Scenario: 应用淡出过渡效果
- **Given** tooltip 元素已渲染
- **When** 系统应用 CSS 样式
- **Then** 系统 SHALL 设置 `transition: opacity 0.2s`

#### Scenario: 执行淡出动画
- **Given** 系统清除吸附状态
- **When** 延迟 0.2 秒后
- **Then** 系统 SHALL 设置 `tooltip.visible` 为 `false`
- **And** 浏览器 SHALL 应用 opacity 过渡效果（从 1 到 0）

### Requirement: tooltip 更新性能优化

系统 SHALL 优化 tooltip 更新逻辑，避免频繁 DOM 操作影响性能。

#### Scenario: 使用 requestAnimationFrame 节流
- **Given** `mouseMoved` 事件频繁触发（60fps）
- **When** 系统更新 tooltip
- **Then** 系统 SHALL 使用 `requestAnimationFrame` 节流
- **And** 系统 SHALL 设置 `tooltipUpdateScheduled` 标志位
- **And** 系统 SHALL 避免在同一帧内多次更新

#### Scenario: 仅在内容变化时重新渲染
- **Given** tooltip 内容未变化
- **When** 系统更新 tooltip
- **Then** 系统 SHALL 跳过 KaTeX 渲染
- **And** 系统 SHALL 仅更新位置（x、y）

### Requirement: tooltip 实际尺寸获取

系统 SHALL 获取 tooltip 的实际尺寸，用于位置计算。

#### Scenario: 首次显示时使用预估尺寸
- **Given** tooltip 首次显示
- **When** 系统计算位置
- **Then** 系统 SHALL 使用预估尺寸（宽度 300px，高度 150px）

#### Scenario: 显示后获取实际尺寸
- **Given** tooltip 已渲染到 DOM
- **When** 系统需要调整位置
- **Then** 系统 SHALL 使用 `getBoundingClientRect()` 获取实际尺寸
- **And** 系统 SHALL 使用实际尺寸重新计算位置
