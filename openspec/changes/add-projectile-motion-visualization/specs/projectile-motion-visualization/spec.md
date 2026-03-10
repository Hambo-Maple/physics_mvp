# Spec: 平抛运动可视化

## 概述

提供基于 p5.js 的平抛运动（含发射角度）交互式可视化功能，支持实时参数调节、轨迹绘制、公式展示和动画控制。

## ADDED Requirements

### Requirement: 可视化渲染核心

系统 SHALL 使用 p5.js 在右侧画布区域（#canvas-mount-point）渲染平抛运动动画，MUST 支持窗口自适应和坐标系正确映射。

#### Scenario: 初始化 p5.js 画布

**Given** 用户打开应用并触发平抛运动可视化
**When** ProjectileMotion 组件挂载
**Then** 在 #canvas-mount-point 节点创建 p5.js 画布
**And** 画布尺寸自适应右侧区域（70% 宽度，100% 高度）
**And** 帧率设置为 60fps
**And** 计算物理单位到像素的缩放比例（确保初始高度占画布 70%）

#### Scenario: 窗口缩放时重绘画布

**Given** p5.js 画布已初始化
**When** 用户调整浏览器窗口大小
**Then** 画布尺寸自动调整为新的右侧区域尺寸
**And** 重新计算缩放比例
**And** 重绘所有元素（物体、轨迹、辅助线）

#### Scenario: 组件卸载时清理资源

**Given** ProjectileMotion 组件已挂载
**When** 用户切换到其他可视化类型或关闭应用
**Then** 调用 p5Instance.remove() 清理 p5.js 实例
**And** 清空画布挂载点的 DOM 内容
**And** 释放所有事件监听器

---

### Requirement: 参数控制系统

系统 SHALL 提供 6 个可调节参数（初速度、重力加速度、初始高度、发射角度、质量、倍速），MUST 支持滑块和输入框双向绑定。

#### Scenario: 调节初速度参数

**Given** 平抛运动可视化已加载
**When** 用户拖动初速度滑块或输入数值
**Then** 参数值在 1-50 m/s 范围内更新
**And** 输入框和滑块保持同步
**And** 如果动画正在播放，自动暂停并重置
**And** 如果动画已停止，重新计算关键点和轨迹预览

#### Scenario: 调节发射角度参数

**Given** 平抛运动可视化已加载
**When** 用户拖动角度滑块从 0° 调整到 45°
**Then** 参数值在 0-90° 范围内更新
**And** 轨迹从纯平抛变为斜抛
**And** 最高点位置重新计算并标注
**And** 公式展示区更新角度数值

#### Scenario: 参数验证失败

**Given** 用户在输入框中输入参数
**When** 输入值超出有效范围（如初速度 100 m/s）
**Then** 显示红色错误提示"初速度必须在 1-50 m/s 范围内"
**And** 输入框边框变为红色
**And** 参数值不更新，保持上一次有效值

---

### Requirement: 动画控制功能

系统 SHALL 提供播放/暂停、重置、倍速调节、单步前进四类控制按钮，MUST 支持动画状态管理。

#### Scenario: 播放和暂停动画

**Given** 平抛运动可视化已加载，动画处于停止状态
**When** 用户点击"播放"按钮
**Then** 动画开始播放，物体沿轨迹运动
**And** 按钮文字变为"暂停"
**And** 实时更新当前时间、位移、速度
**When** 用户再次点击"暂停"按钮
**Then** 动画暂停，物体停留在当前位置
**And** 按钮文字变为"播放"

#### Scenario: 重置动画

**Given** 动画已播放一段时间
**When** 用户点击"重置"按钮
**Then** 动画停止并重置到初始状态
**And** 当前时间归零
**And** 轨迹清空
**And** 物体回到初始位置
**And** 所有参数恢复默认值（v0=10, g=9.8, h=50, θ=0）

#### Scenario: 调节动画倍速

**Given** 动画正在以 1x 倍速播放
**When** 用户点击"2x"倍速按钮
**Then** 动画速度加倍（每帧时间步长从 1/60s 变为 2/60s）
**And** "2x"按钮高亮显示
**And** 轨迹采样间隔相应调整（避免点位过密）

#### Scenario: 单步前进

**Given** 动画处于暂停状态
**When** 用户点击"单步前进"按钮
**Then** 动画前进 0.1 秒
**And** 更新物体位置、轨迹点、实时结果
**And** 动画保持暂停状态
**When** 动画正在播放
**Then** "单步前进"按钮禁用（灰色显示）

---

### Requirement: 画布交互功能

系统 SHALL 支持鼠标拖拽物体修改初始位置，MUST 支持点击空白区域暂停/播放，MUST 区分交互优先级避免冲突。

#### Scenario: 拖拽物体修改初始高度

**Given** 动画处于停止或暂停状态
**When** 用户鼠标按下物体小球区域（距离中心 < 20px）
**Then** 进入拖拽模式，物体跟随鼠标移动
**And** 实时显示当前高度数值
**When** 用户拖动鼠标到新位置
**Then** 将鼠标位置转换为物理坐标
**And** 更新初始高度 h（限制在 10-200m 范围内）
**And** 重新计算关键点和轨迹预览
**When** 用户松开鼠标
**Then** 退出拖拽模式
**And** 不触发点击暂停/播放事件

#### Scenario: 点击空白区域切换播放状态

**Given** 动画处于暂停状态
**When** 用户点击画布空白区域（非物体区域）
**Then** 动画开始播放
**And** 播放按钮文字变为"暂停"
**When** 用户再次点击空白区域
**Then** 动画暂停
**And** 播放按钮文字变为"播放"

#### Scenario: 拖拽与点击冲突处理

**Given** 用户正在拖拽物体
**When** 用户松开鼠标（mouseReleased 事件）
**Then** 检测到 isDragging 标志位为 true
**And** 不触发点击暂停/播放逻辑
**And** 重置 isDragging 和 dragTarget 状态

---

### Requirement: 轨迹可视化

系统 SHALL 绘制渐变轨迹线（深绿到浅灰），MUST 标注关键节点（初始位置、最高点、落地位置），MUST 使用 A2UI 配色。

#### Scenario: 绘制渐变轨迹

**Given** 动画正在播放
**When** 物体沿轨迹运动
**Then** 每隔采样间隔（根据倍速调整）记录一个轨迹点
**And** 使用 p5.beginShape() 绘制连续曲线
**And** 轨迹颜色从起点 #006644（深绿）渐变到终点 #CCCCCC（浅灰）
**And** 轨迹线宽为 2px

#### Scenario: 标注关键节点

**Given** 轨迹已绘制
**When** 渲染画布
**Then** 在初始位置绘制 #006644 圆点（半径 6px）+ 文字"起点"
**And** 在最高点绘制 #FF6B6B 圆点（半径 6px）+ 文字"最高点"
**And** 在落地位置绘制 #4ECDC4 圆点（半径 6px）+ 文字"落地"
**And** 文字使用 12px 字体，颜色与圆点一致

#### Scenario: 绘制运动物体

**Given** 动画正在播放或暂停
**When** 渲染当前帧
**Then** 在当前位置绘制实心圆（颜色 #006644）
**And** 圆的半径根据质量参数轻微变化（基础半径 10px，质量每增加 1kg 增加 1px）
**And** 鼠标悬停时显示手型光标
**And** 拖拽时物体边框高亮（2px 白色边框）

---

### Requirement: 公式与结果展示

系统 SHALL 在画布底部展示核心物理公式（KaTeX 渲染）和实时计算结果，MUST 确保样式与现有公式统一。

#### Scenario: 展示核心物理公式

**Given** 平抛运动可视化已加载
**When** 渲染公式展示区
**Then** 显示水平位移公式 `$x = v_0 \cdot t \cdot \cos(\theta)$`
**And** 显示竖直位移公式 `$y = h + v_0 \cdot t \cdot \sin(\theta) - \frac{1}{2} \cdot g \cdot t^2$`
**And** 显示速度公式 `$v_x = v_0 \cdot \cos(\theta), \quad v_y = v_0 \cdot \sin(\theta) - g \cdot t$`
**And** 使用 KaTeX 渲染，块级公式居中对齐，字号 18px

#### Scenario: 实时更新计算结果

**Given** 动画正在播放
**When** 每帧更新
**Then** 显示当前时间（保留 2 位小数）
**And** 显示水平位移（保留 2 位小数）
**And** 显示竖直位移（保留 2 位小数）
**And** 显示合速度（保留 2 位小数）
**And** 显示落地预测时间和位置（保留 2 位小数）
**And** 数值加粗显示，颜色 #006644

#### Scenario: 参数变化时更新公式

**Given** 用户修改发射角度从 0° 到 45°
**When** 参数更新
**Then** 公式中的 θ 值更新为 45°
**And** 在 nextTick 中重新调用 renderMathInElement() 渲染 KaTeX
**And** 公式显示无延迟或闪烁

---

### Requirement: 物理计算引擎

系统 SHALL 提供纯函数物理计算模块，MUST 严格遵循平抛运动公式，MUST 区分物理坐标系和 Canvas 坐标系。

#### Scenario: 计算给定时刻的位置

**Given** 参数 v0=10 m/s, g=9.8 m/s², h=50 m, θ=0°, t=2s
**When** 调用 calculatePosition(v0, g, h, theta, t)
**Then** 返回 { x: 20, y: 30.4 }（物理坐标系）
**And** 计算误差 < 1%

#### Scenario: 计算给定时刻的速度

**Given** 参数 v0=10 m/s, g=9.8 m/s², θ=0°, t=2s
**When** 调用 calculateVelocity(v0, g, theta, t)
**Then** 返回 { vx: 10, vy: -19.6, v: 22.02 }
**And** 计算误差 < 1%

#### Scenario: 预测落地时间

**Given** 参数 v0=10 m/s, g=9.8 m/s², h=50 m, θ=0°
**When** 调用 predictLandingTime(v0, g, h, theta)
**Then** 返回 t ≈ 3.19 秒
**And** 验证：代入位移公式 y = 0
**And** 计算误差 < 1%

#### Scenario: 计算最高点

**Given** 参数 v0=20 m/s, g=9.8 m/s², h=50 m, θ=45°
**When** 调用 calculatePeakPoint(v0, g, h, theta)
**Then** 返回最高点时间 t ≈ 1.44 秒
**And** 返回最高点位置 { x: 20.4, y: 60.2 }
**And** 验证：此时 vy = 0

#### Scenario: 坐标系转换

**Given** 物理坐标 (x=20m, y=30m)，画布尺寸 800x600px，缩放比例 scale=10
**When** 调用 physicsToCanvas(20, 30)
**Then** 返回 Canvas 坐标 { x: 280, y: 240 }
**And** 验证：canvasY = canvasHeight - physicsY * scale - margin

---

### Requirement: 对话联动机制

系统 SHALL 在 AI 回复中触发平抛运动可视化时自动提取参数并加载到画布，MUST 支持关键词检测和参数解析。

#### Scenario: 关键词触发可视化

**Given** 用户在对话框输入"给我展示平抛运动"
**When** AI 回复包含关键词"平抛运动"
**Then** 检测到关键词，设置 state.currentVisualType = 'PROJECTILE'
**And** 使用默认参数初始化 ProjectileMotion 组件
**And** 自动播放动画

#### Scenario: 提取初速度参数

**Given** AI 回复"这是初速度 20m/s 的平抛运动"
**When** 解析回复内容
**Then** 提取参数 v0 = 20
**And** 更新 state.projectileParams.v0 = 20
**And** 画布加载时使用提取的参数

#### Scenario: 提取发射角度参数

**Given** AI 回复"45 度角抛出的物体"
**When** 解析回复内容
**Then** 提取参数 θ = 45
**And** 更新 state.projectileParams.theta = 45
**And** 画布渲染斜抛运动

#### Scenario: 多参数同时提取

**Given** AI 回复"初速度 15m/s，30 度角，高度 80m 的平抛运动"
**When** 解析回复内容
**Then** 提取参数 v0=15, θ=30, h=80
**And** 更新 state.projectileParams
**And** 画布加载时使用所有提取的参数

---

### Requirement: 性能优化

系统 MUST 确保 60fps 动画流畅，MUST 保证参数修改响应时间 < 100ms，MUST 确保长时间运行无内存泄漏。

#### Scenario: 轨迹点采样优化

**Given** 动画以 2x 倍速播放
**When** 记录轨迹点
**Then** 采样间隔从 0.1s 调整为 0.2s
**And** 轨迹点数量减少，避免点位过密
**And** 视觉效果保持流畅

#### Scenario: 限制轨迹点数量

**Given** 动画长时间运行，轨迹点数量超过 1000
**When** 添加新轨迹点
**Then** 移除最早的轨迹点（shift）
**And** 保持轨迹点数组长度 ≤ 1000
**And** 避免内存持续增长

#### Scenario: 停止状态下减少重绘

**Given** 动画处于停止状态，参数未变化
**When** p5.draw() 循环执行
**Then** 检测到无需更新，跳过本帧绘制
**And** 减少 CPU 占用

#### Scenario: 参数修改响应时间

**Given** 用户拖动初速度滑块
**When** 参数值变化
**Then** 在 100ms 内完成轨迹重算和画布重绘
**And** 用户感受不到延迟

---

### Requirement: 样式与视觉一致性

系统 SHALL 使用 A2UI 墨绿色主题，MUST 确保与现有组件样式统一，MUST 确保公式样式与现有公式一致。

#### Scenario: 参数控制区样式

**Given** 渲染参数控制区
**When** 显示滑块和输入框
**Then** 滑块轨道颜色 #e0e0e0，滑块颜色 #006644
**And** 输入框边框 #e0e0e0，聚焦时边框 #006644
**And** 标签字体 14px，颜色 #333
**And** 使用 grid 布局，2 列排列

#### Scenario: 动画控制按钮样式

**Given** 渲染动画控制按钮组
**When** 显示播放/暂停、重置、倍速、单步按钮
**Then** 主按钮背景 #006644，文字白色
**And** 次要按钮背景 #f5f5f5，文字 #333
**And** hover 时背景变为 #008055（主按钮）或 #e8e8e8（次要按钮）
**And** active 时背景变为 #004d33（主按钮）
**And** 按钮间距 8px，水平排列

#### Scenario: 公式展示区样式

**Given** 渲染公式展示区
**When** 显示公式和结果
**Then** 背景 #fff，边框 #e0e0e0，圆角 4px
**And** 标题字体 16px，颜色 #006644，加粗
**And** 公式块级居中，字号 18px
**And** 结果文字 14px，数值加粗，颜色 #006644
**And** 左右分栏，各占 50%

---

### Requirement: 兼容性保障

系统 MUST NOT 破坏现有功能（流式输出、语音输入、公式渲染），MUST 支持与其他可视化类型切换。

#### Scenario: 切换到其他可视化类型

**Given** 平抛运动可视化正在显示
**When** 用户触发公式可视化（state.currentVisualType = 'FORMULA'）
**Then** ProjectileMotion 组件卸载
**And** p5.js 实例正确清理（调用 remove()）
**And** 公式可视化正常显示
**And** 无控制台错误或警告

#### Scenario: 流式输出不受影响

**Given** AI 正在流式输出回复
**When** 回复中包含平抛运动关键词
**Then** 流式输出继续正常进行
**And** 可视化在回复完成后触发
**And** 不中断流式输出过程

#### Scenario: 语音输入不受影响

**Given** 用户点击语音输入按钮
**When** 录音并识别为"平抛运动"
**Then** 语音输入正常工作
**And** 识别结果发送到对话框
**And** 触发平抛运动可视化

#### Scenario: 现有公式渲染不受影响

**Given** 对话中包含其他物理公式（如 $E=mc^2$）
**When** 渲染对话消息
**Then** KaTeX 正常渲染公式
**And** 公式样式与平抛运动公式样式一致
**And** 不出现样式冲突或渲染错误
