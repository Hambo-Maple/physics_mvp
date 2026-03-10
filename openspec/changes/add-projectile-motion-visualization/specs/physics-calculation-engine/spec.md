# Spec: 物理计算引擎

## 概述

提供纯函数物理计算模块，封装平抛运动的核心计算逻辑，包括位置、速度、落地时间、最高点等计算，严格区分物理坐标系和渲染坐标系。

## ADDED Requirements

### Requirement: 位置计算

系统 SHALL 根据平抛运动公式计算给定时刻物体的位置坐标（物理坐标系）。

#### Scenario: 纯平抛运动位置计算

**Given** 参数 v0=10 m/s, g=9.8 m/s², h=50 m, θ=0°, t=2s
**When** 调用 calculatePosition(v0, g, h, theta, t)
**Then** 返回 { x: 20.0, y: 30.4 }
**And** 水平位移 x = v0 * t * cos(0°) = 10 * 2 = 20m
**And** 竖直位移 y = h + v0 * t * sin(0°) - 0.5 * g * t² = 50 - 0.5 * 9.8 * 4 = 30.4m
**And** 计算误差 < 0.01m

#### Scenario: 斜抛运动位置计算

**Given** 参数 v0=20 m/s, g=9.8 m/s², h=50 m, θ=45°, t=1s
**When** 调用 calculatePosition(v0, g, h, theta, t)
**Then** 返回 { x: 14.14, y: 59.24 }
**And** 水平位移 x = 20 * 1 * cos(45°) ≈ 14.14m
**And** 竖直位移 y = 50 + 20 * 1 * sin(45°) - 0.5 * 9.8 * 1 ≈ 59.24m
**And** 计算误差 < 0.01m

---

### Requirement: 速度计算

系统 SHALL 根据速度公式计算给定时刻物体的速度分量和合速度。

#### Scenario: 纯平抛运动速度计算

**Given** 参数 v0=10 m/s, g=9.8 m/s², θ=0°, t=2s
**When** 调用 calculateVelocity(v0, g, theta, t)
**Then** 返回 { vx: 10.0, vy: -19.6, v: 22.02 }
**And** 水平速度 vx = v0 * cos(0°) = 10 m/s（恒定）
**And** 竖直速度 vy = v0 * sin(0°) - g * t = -19.6 m/s（向下）
**And** 合速度 v = √(vx² + vy²) ≈ 22.02 m/s
**And** 计算误差 < 0.01 m/s

---

### Requirement: 落地时间预测

系统 SHALL 解方程 y = 0 计算物体落地时间，MUST 处理无解情况。

#### Scenario: 纯平抛运动落地时间

**Given** 参数 v0=10 m/s, g=9.8 m/s², h=50 m, θ=0°
**When** 调用 predictLandingTime(v0, g, h, theta)
**Then** 返回 t ≈ 3.19 秒
**And** 验证：代入位移公式 y = 50 - 0.5 * 9.8 * 3.19² ≈ 0
**And** 计算误差 < 0.01s

---

### Requirement: 最高点计算

系统 SHALL 计算斜抛运动的最高点时间和位置，MUST 处理纯平抛和向下抛的特殊情况。

#### Scenario: 斜抛运动最高点

**Given** 参数 v0=20 m/s, g=9.8 m/s², h=50 m, θ=45°
**When** 调用 calculatePeakPoint(v0, g, h, theta)
**Then** 返回 { x: 20.4, y: 60.2, t: 1.44 }
**And** 最高点时间 t = v0 * sin(45°) / g ≈ 1.44s
**And** 最高点高度 y = h + (v0*sin(θ))² / (2g) ≈ 60.2m
**And** 验证：此时 vy = 0

---

### Requirement: 参数校验

系统 SHALL 验证输入参数的有效性，MUST 返回错误信息列表。

#### Scenario: 所有参数有效

**Given** 参数 { v0: 10, g: 9.8, h: 50, theta: 45, mass: 1, timeScale: 1 }
**When** 调用 validateParams(params)
**Then** 返回 { valid: true, errors: [] }

#### Scenario: 初速度超出范围

**Given** 参数 { v0: 100, g: 9.8, h: 50, theta: 0 }
**When** 调用 validateParams(params)
**Then** 返回 { valid: false, errors: ['初速度必须在 1-50 m/s 范围内'] }

---

### Requirement: 坐标系转换

系统 SHALL 提供物理坐标系与 Canvas 坐标系之间的双向转换，MUST 确保渲染正确性。

#### Scenario: 物理坐标转 Canvas 坐标

**Given** 物理坐标 (x=20m, y=30m)
**And** 画布尺寸 800x600px，缩放比例 scale=10 px/m
**And** 边距：左侧 10%，底部 10%
**When** 调用 physicsToCanvas(20, 30)
**Then** 返回 Canvas 坐标 { x: 280, y: 240 }
**And** canvasX = 20 * 10 + 800 * 0.1 = 280
**And** canvasY = 600 - 30 * 10 - 600 * 0.1 = 240

---

### Requirement: 数值精度与稳定性

系统 MUST 确保计算结果的数值精度和稳定性，MUST 处理浮点误差和边界情况。

#### Scenario: 浮点误差控制

**Given** 参数 v0=10 m/s, g=9.8 m/s², h=50 m, θ=0°
**When** 计算落地时间 t，然后代入位移公式验证 y
**Then** |y| < 0.01m（误差小于 1cm）
**And** 不出现累积误差导致的偏差

---

### Requirement: 函数纯度与可测试性

所有计算函数 MUST 为纯函数，MUST NOT 有副作用，SHALL 便于单元测试和调试。

#### Scenario: 纯函数特性

**Given** 参数 v0=10, g=9.8, h=50, theta=0, t=2
**When** 多次调用 calculatePosition(v0, g, h, theta, t)
**Then** 每次返回相同结果 { x: 20, y: 30.4 }
**And** 不修改输入参数
**And** 不依赖外部状态

---

### Requirement: 错误处理与边界保护

系统 SHALL 处理异常输入和边界情况，MUST 返回合理的默认值或错误信息。

#### Scenario: 负数初速度

**Given** 参数 v0=-10 m/s
**When** 调用 validateParams
**Then** 返回错误信息"初速度必须在 1-50 m/s 范围内"
**And** 不执行计算

---

### Requirement: 性能优化

系统 SHALL 优化计算性能，MUST 避免重复计算和不必要的三角函数调用。

#### Scenario: 缓存三角函数值

**Given** 参数 θ=45° 在一次动画中保持不变
**When** 每帧计算位置和速度
**Then** 只计算一次 sin(45°) 和 cos(45°)
**And** 缓存结果供后续帧使用
**And** 减少三角函数调用次数

---

### Requirement: 文档与注释

系统 SHALL 提供完整的中文注释，MUST 说明物理公式、坐标系约定、参数含义。

#### Scenario: 函数注释完整性

**Given** 查看 calculatePosition 函数
**When** 阅读注释
**Then** 包含函数功能说明
**And** 包含所有参数说明（类型、单位、范围）
**And** 包含返回值说明（类型、单位、坐标系）
**And** 包含物理公式说明（LaTeX 格式）
**And** 包含使用示例
