# Spec: 物理信息提供系统

## ADDED Requirements

### Requirement: 从物理计算函数获取实时数据

系统 SHALL 调用现有的物理计算函数获取关键点和轨迹点的物理参数。

#### Scenario: 获取关键点速度
- **Given** 吸附目标为关键点
- **When** 系统生成关键点信息
- **Then** 系统 SHALL 调用 `calculateVelocity(params.v0, params.g, params.theta, keypoint.t)`
- **And** 系统 SHALL 获取速度分量 `{ vx, vy, v }`

#### Scenario: 获取轨迹点速度
- **Given** 吸附目标为轨迹点
- **When** 系统生成轨迹点信息
- **Then** 系统 SHALL 调用 `calculateVelocity(params.v0, params.g, params.theta, point.t)`
- **And** 系统 SHALL 获取速度分量 `{ vx, vy, v }`

#### Scenario: 使用关键点预计算数据
- **Given** 关键点对象包含预计算的坐标和时间
- **When** 系统生成关键点信息
- **Then** 系统 SHALL 直接使用 `keypoint.x`、`keypoint.y`、`keypoint.t`
- **And** 系统 SHALL NOT 重新计算位置（避免重复计算）

#### Scenario: 使用轨迹点存储数据
- **Given** 轨迹点对象包含存储的坐标和时间
- **When** 系统生成轨迹点信息
- **Then** 系统 SHALL 直接使用 `point.x`、`point.y`、`point.t`
- **And** 系统 SHALL NOT 重新计算位置（避免重复计算）

### Requirement: 数据一致性保证

系统 SHALL 确保 tooltip 显示的数据与画布绘制的数据一致。

#### Scenario: 使用相同的物理参数
- **Given** 画布使用 `params.v0`、`params.g`、`params.theta` 绘制轨迹
- **When** 系统生成 tooltip 信息
- **Then** 系统 SHALL 使用相同的 `params` 对象
- **And** 系统 SHALL 确保计算结果一致

#### Scenario: 参数变化时更新 tooltip
- **Given** 用户修改参数（v0、g、h、theta）
- **When** 参数 `watch` 触发
- **Then** 系统 SHALL 清除吸附状态
- **And** 系统 SHALL 隐藏 tooltip（避免显示过期数据）

#### Scenario: 使用相同的坐标转换函数
- **Given** 画布使用 `physicsToCanvas()` 转换坐标
- **When** 系统检测吸附距离
- **Then** 系统 SHALL 使用相同的 `physicsToCanvas()` 函数
- **And** 系统 SHALL 确保坐标转换一致

### Requirement: 物理计算异常处理

系统 SHALL 处理物理计算函数返回的异常值。

#### Scenario: 处理速度计算返回 NaN
- **Given** `calculateVelocity()` 返回 `{ vx: NaN, vy: NaN, v: NaN }`
- **When** 系统生成 tooltip 信息
- **Then** 系统 SHALL 显示 "计算错误" 而非 "NaN m/s"

#### Scenario: 处理速度计算返回 Infinity
- **Given** `calculateVelocity()` 返回 `{ vx: Infinity, vy: Infinity, v: Infinity }`
- **When** 系统生成 tooltip 信息
- **Then** 系统 SHALL 显示 "计算错误" 而非 "Infinity m/s"

#### Scenario: 处理关键点时间为 Infinity
- **Given** 最高点时间为 `Infinity`（无重力情况）
- **When** 系统生成最高点信息
- **Then** 系统 SHALL 显示 "无法计算" 而非 "Infinity s"

### Requirement: 关键点类型映射提供

系统 SHALL 为不同类型的关键点提供中文名称和对应公式。

#### Scenario: 映射初始位置类型
- **Given** 关键点类型为 `'start'`
- **When** 系统生成关键点信息
- **Then** 系统 SHALL 显示标题 "初始位置"
- **And** 系统 SHALL 显示公式 "$x = v_0 \\cdot t \\cdot \\cos\\theta, \\quad y = h + v_0 \\cdot t \\cdot \\sin\\theta - \\frac{1}{2}gt^2$"

#### Scenario: 映射最高点类型
- **Given** 关键点类型为 `'peak'`
- **When** 系统生成关键点信息
- **Then** 系统 SHALL 显示标题 "最高点"
- **And** 系统 SHALL 显示公式 "$v_y = 0 \\Rightarrow t = \\frac{v_0 \\sin\\theta}{g}$"

#### Scenario: 映射落地位置类型
- **Given** 关键点类型为 `'landing'`
- **When** 系统生成关键点信息
- **Then** 系统 SHALL 显示标题 "落地位置"
- **And** 系统 SHALL 显示公式 "$y = 0 \\Rightarrow t = \\frac{v_0 \\sin\\theta + \\sqrt{(v_0 \\sin\\theta)^2 + 2gh}}{g}$"

### Requirement: 位移差计算

系统 SHALL 计算轨迹点相对于起点的位移差。

#### Scenario: 计算水平位移差
- **Given** 轨迹点坐标为 (x: 15.5, y: 40.2)
- **And** 起点坐标为 (x: 0, y: 50)
- **When** 系统计算位移差
- **Then** 系统 SHALL 计算 Δx = 15.5 - 0 = 15.50 m

#### Scenario: 计算竖直位移差
- **Given** 轨迹点坐标为 (x: 15.5, y: 40.2)
- **And** 起点坐标为 (x: 0, y: 50)
- **When** 系统计算位移差
- **Then** 系统 SHALL 计算 Δy = 40.2 - 50 = -9.80 m

#### Scenario: 位移差为负值时正常显示
- **Given** 竖直位移差为 -9.80 m（向下）
- **When** 系统格式化该值
- **Then** 系统 SHALL 显示 "-9.80 m"（保留负号）

### Requirement: 物理信息实时更新

系统 SHALL 在吸附目标变化时实时更新 tooltip 内容。

#### Scenario: 鼠标移动到不同关键点
- **Given** 鼠标正在吸附初始位置
- **When** 鼠标移动到最高点附近
- **Then** 系统 SHALL 更新吸附目标为最高点
- **And** 系统 SHALL 重新生成 tooltip 内容（显示最高点信息）
- **And** 系统 SHALL 重新渲染 tooltip

#### Scenario: 鼠标从关键点移动到轨迹点
- **Given** 鼠标正在吸附关键点
- **When** 鼠标移动到轨迹点附近
- **Then** 系统 SHALL 更新吸附目标为轨迹点
- **And** 系统 SHALL 重新生成 tooltip 内容（显示轨迹点信息）
- **And** 系统 SHALL 重新渲染 tooltip

#### Scenario: 动画播放时实时更新
- **Given** 动画正在播放
- **And** 鼠标正在吸附某个轨迹点
- **When** 该轨迹点的物理参数未变化
- **Then** 系统 SHALL 保持 tooltip 内容不变
- **And** 系统 SHALL NOT 重新计算（避免性能浪费）

### Requirement: 数值格式化工具函数提供

系统 SHALL 提供统一的数值格式化函数，确保显示一致性。

#### Scenario: 格式化函数接口
- **Given** 系统需要格式化物理数值
- **When** 调用 `formatPhysicsValue(value, unit)`
- **Then** 系统 SHALL 返回格式化后的字符串（如 "12.35 m"）

#### Scenario: 保留 2 位小数
- **Given** 数值为 12.3456789
- **When** 调用 `formatPhysicsValue(12.3456789, 'm')`
- **Then** 系统 SHALL 返回 "12.35 m"

#### Scenario: 自动添加单位
- **Given** 数值为 9.8，单位为 'm/s²'
- **When** 调用 `formatPhysicsValue(9.8, 'm/s²')`
- **Then** 系统 SHALL 返回 "9.80 m/s²"

#### Scenario: 处理整数
- **Given** 数值为 10（整数）
- **When** 调用 `formatPhysicsValue(10, 'm')`
- **Then** 系统 SHALL 返回 "10.00 m"（保留 2 位小数）

### Requirement: 现有物理计算函数复用

系统 SHALL 复用 src/utils/physic.js 中的现有函数，避免重复实现。

#### Scenario: 复用 calculateVelocity 函数
- **Given** 系统需要计算速度
- **When** 系统生成 tooltip 信息
- **Then** 系统 SHALL 调用 `calculateVelocity()` 函数
- **And** 系统 SHALL NOT 重新实现速度计算逻辑

#### Scenario: 复用 calculatePosition 函数
- **Given** 系统需要验证位置（如果需要）
- **When** 系统执行验证
- **Then** 系统 SHALL 调用 `calculatePosition()` 函数
- **And** 系统 SHALL NOT 重新实现位置计算逻辑

#### Scenario: 使用相同的物理公式
- **Given** `physic.js` 使用特定的物理公式
- **When** 系统生成 tooltip 信息
- **Then** 系统 SHALL 使用相同的公式（确保一致性）
- **And** tooltip 显示的公式 SHALL 与实际计算公式一致

### Requirement: 边界情况处理

系统 SHALL 处理各种边界情况，确保不会显示错误信息。

#### Scenario: 处理初始高度为 0
- **Given** 参数 h = 0（起点在地面）
- **When** 系统生成初始位置信息
- **Then** 系统 SHALL 显示 "y: 0.00 m"
- **And** 系统 SHALL NOT 显示负值或错误

#### Scenario: 处理发射角度为 0
- **Given** 参数 θ = 0（纯平抛）
- **When** 系统生成关键点信息
- **Then** 系统 SHALL 显示 "vᵧ = -g·t"（初速度竖直分量为 0）
- **And** 系统 SHALL 正确计算速度

#### Scenario: 处理发射角度为 90
- **Given** 参数 θ = 90（竖直上抛）
- **When** 系统生成关键点信息
- **Then** 系统 SHALL 显示 "vₓ = 0"（水平速度为 0）
- **And** 系统 SHALL 正确计算速度

#### Scenario: 处理重力加速度为 0
- **Given** 参数 g = 0（无重力）
- **When** 系统生成最高点信息
- **Then** 系统 SHALL 显示 "无法计算"（最高点时间为 Infinity）
- **And** 系统 SHALL NOT 显示 "Infinity s"
