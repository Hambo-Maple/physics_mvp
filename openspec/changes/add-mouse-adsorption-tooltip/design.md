# Design: 鼠标吸附与信息悬浮展示系统

## Architecture Overview

本设计在现有 `ProjectileMotion.vue` 组件基础上，添加鼠标吸附检测和 tooltip 展示功能。核心架构分为三个子系统：

1. **鼠标吸附检测系统**：在 p5.js `mouseMoved` 事件中检测鼠标与关键点/轨迹点的距离
2. **Tooltip 展示系统**：使用 Vue 响应式状态 + HTML DOM 渲染 tooltip
3. **物理信息提供系统**：从物理计算函数中获取实时数据

```
┌─────────────────────────────────────────────────────────────┐
│                  ProjectileMotion.vue                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         p5.js Canvas (绘制层)                         │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │  mouseMoved Event                               │  │   │
│  │  │    ↓                                            │  │   │
│  │  │  detectAdsorption()                             │  │   │
│  │  │    ├─ checkKeyPointAdsorption()                 │  │   │
│  │  │    └─ checkTrajectoryAdsorption()               │  │   │
│  │  │         ↓                                       │  │   │
│  │  │  updateAdsorptionState()                        │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  │                                                        │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │  draw() - 绘制吸附高亮                          │  │   │
│  │  │    ├─ drawKeyPointHighlight()                   │  │   │
│  │  │    └─ drawTrajectoryHighlight()                 │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Vue Template (DOM 层)                         │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │  <div class="tooltip" v-if="tooltip.visible">  │  │   │
│  │  │    {{ tooltipContent }}                         │  │   │
│  │  │  </div>                                         │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Reactive State (状态层)                       │   │
│  │  adsorptionState = {                                  │   │
│  │    isActive: false,                                   │   │
│  │    type: 'keypoint' | 'trajectory' | null,            │   │
│  │    target: { ... },                                   │   │
│  │    mousePos: { x, y }                                 │   │
│  │  }                                                    │   │
│  │                                                        │   │
│  │  tooltip = {                                          │   │
│  │    visible: false,                                    │   │
│  │    x: 0, y: 0,                                        │   │
│  │    content: ''                                        │   │
│  │  }                                                    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Utils (工具层)                                │   │
│  │  ├─ generateKeyPointInfo()                            │   │
│  │  ├─ generateTrajectoryInfo()                          │   │
│  │  ├─ calculateTooltipPosition()                        │   │
│  │  └─ formatPhysicsValue()                              │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Component Design

### 1. 吸附检测系统

#### 1.1 核心数据结构

```javascript
// 吸附状态
const adsorptionState = reactive({
  isActive: false,           // 是否正在吸附
  type: null,                // 吸附类型：'keypoint' | 'trajectory' | null
  target: null,              // 吸附目标对象
  mousePos: { x: 0, y: 0 }   // 鼠标位置（canvas 坐标）
});

// 吸附配置
const ADSORPTION_CONFIG = {
  threshold: 10,             // 吸附阈值（px）
  keypointPriority: true,    // 关键点优先
  fadeOutDelay: 200          // 消失延迟（ms）
};
```

#### 1.2 吸附检测流程

```javascript
/**
 * 吸附检测主函数
 * 在 p5.js mouseMoved 事件中调用
 */
function detectAdsorption(mouseX, mouseY) {
  // 1. 优先检测关键点
  const keypointResult = checkKeyPointAdsorption(mouseX, mouseY);
  if (keypointResult) {
    updateAdsorptionState('keypoint', keypointResult);
    return;
  }

  // 2. 检测轨迹点
  const trajectoryResult = checkTrajectoryAdsorption(mouseX, mouseY);
  if (trajectoryResult) {
    updateAdsorptionState('trajectory', trajectoryResult);
    return;
  }

  // 3. 无吸附目标，清除状态
  clearAdsorptionState();
}

/**
 * 检测关键点吸附
 * 返回最近的关键点（距离 < threshold）
 */
function checkKeyPointAdsorption(mouseX, mouseY) {
  const keyPointsToCheck = [
    { type: 'start', ...keyPoints.start },
    { type: 'peak', ...keyPoints.peak },
    { type: 'landing', ...keyPoints.landing }
  ];

  let closestPoint = null;
  let minDistance = ADSORPTION_CONFIG.threshold;

  for (const point of keyPointsToCheck) {
    const canvasPos = physicsToCanvas(point.x, point.y);
    const dist = Math.sqrt(
      Math.pow(mouseX - canvasPos.x, 2) +
      Math.pow(mouseY - canvasPos.y, 2)
    );

    if (dist < minDistance) {
      minDistance = dist;
      closestPoint = point;
    }
  }

  return closestPoint;
}

/**
 * 检测轨迹点吸附
 * 仅检测已绘制的 pathPoints 数组
 */
function checkTrajectoryAdsorption(mouseX, mouseY) {
  if (animationState.pathPoints.length === 0) {
    return null;
  }

  let closestPoint = null;
  let minDistance = ADSORPTION_CONFIG.threshold;

  // 优化：仅检测可见范围内的点
  for (const point of animationState.pathPoints) {
    const canvasPos = physicsToCanvas(point.x, point.y);

    // 跳过画布外的点
    if (canvasPos.x < 0 || canvasPos.x > canvasWidth ||
        canvasPos.y < 0 || canvasPos.y > canvasHeight) {
      continue;
    }

    const dist = Math.sqrt(
      Math.pow(mouseX - canvasPos.x, 2) +
      Math.pow(mouseY - canvasPos.y, 2)
    );

    if (dist < minDistance) {
      minDistance = dist;
      closestPoint = point;
    }
  }

  return closestPoint;
}
```

### 2. Tooltip 展示系统

#### 2.1 核心数据结构

```javascript
// Tooltip 状态
const tooltip = reactive({
  visible: false,            // 是否显示
  x: 0,                      // 位置 X（屏幕坐标）
  y: 0,                      // 位置 Y（屏幕坐标）
  content: '',               // HTML 内容
  fadeOutTimer: null         // 淡出定时器
});
```

#### 2.2 Tooltip 位置计算

```javascript
/**
 * 计算 tooltip 位置
 * 默认显示在鼠标右侧 10px，边界检测后自动调整
 */
function calculateTooltipPosition(mouseX, mouseY, tooltipWidth, tooltipHeight) {
  const offset = 10;
  let x = mouseX + offset;
  let y = mouseY;

  // 右边界检测
  if (x + tooltipWidth > canvasWidth) {
    x = mouseX - tooltipWidth - offset; // 显示在左侧
  }

  // 底边界检测
  if (y + tooltipHeight > canvasHeight) {
    y = canvasHeight - tooltipHeight; // 贴底显示
  }

  // 顶边界检测
  if (y < 0) {
    y = 0; // 贴顶显示
  }

  return { x, y };
}
```

#### 2.3 Tooltip 内容生成

```javascript
/**
 * 生成关键点信息内容
 */
function generateKeyPointInfo(keypoint) {
  const typeNames = {
    start: '初始位置',
    peak: '最高点',
    landing: '落地位置'
  };

  const formulas = {
    start: '$x = v_0 \\cdot t \\cdot \\cos\\theta, \\quad y = h + v_0 \\cdot t \\cdot \\sin\\theta - \\frac{1}{2}gt^2$',
    peak: '$v_y = 0 \\Rightarrow t = \\frac{v_0 \\sin\\theta}{g}$',
    landing: '$y = 0 \\Rightarrow t = \\frac{v_0 \\sin\\theta + \\sqrt{(v_0 \\sin\\theta)^2 + 2gh}}{g}$'
  };

  const vel = calculateVelocity(params.v0, params.g, params.theta, keypoint.t);

  return `
    <div class="tooltip-content">
      <div class="tooltip-title">${typeNames[keypoint.type]}</div>
      <div class="tooltip-item">
        <strong>坐标：</strong>(x: ${keypoint.x.toFixed(2)} m, y: ${keypoint.y.toFixed(2)} m)
      </div>
      <div class="tooltip-item">
        <strong>运动时间：</strong>t = ${keypoint.t.toFixed(2)} s
      </div>
      <div class="tooltip-item">
        <strong>瞬时速度：</strong>
        v<sub>x</sub> = ${vel.vx.toFixed(2)} m/s，
        v<sub>y</sub> = ${vel.vy.toFixed(2)} m/s，
        合速度 = ${vel.v.toFixed(2)} m/s
      </div>
      <div class="tooltip-formula">
        <strong>物理公式：</strong>${formulas[keypoint.type]}
      </div>
    </div>
  `;
}

/**
 * 生成轨迹点信息内容
 */
function generateTrajectoryInfo(point) {
  const vel = calculateVelocity(params.v0, params.g, params.theta, point.t);
  const deltaX = point.x - keyPoints.start.x;
  const deltaY = point.y - keyPoints.start.y;

  return `
    <div class="tooltip-content">
      <div class="tooltip-title">轨迹点</div>
      <div class="tooltip-item">
        <strong>坐标：</strong>(x: ${point.x.toFixed(2)} m, y: ${point.y.toFixed(2)} m)
      </div>
      <div class="tooltip-item">
        <strong>运动时间：</strong>t = ${point.t.toFixed(2)} s
      </div>
      <div class="tooltip-item">
        <strong>瞬时速度：</strong>
        v<sub>x</sub> = ${vel.vx.toFixed(2)} m/s，
        v<sub>y</sub> = ${vel.vy.toFixed(2)} m/s
      </div>
      <div class="tooltip-item">
        <strong>位移差：</strong>
        Δx = ${deltaX.toFixed(2)} m（与起点水平差），
        Δy = ${deltaY.toFixed(2)} m（与起点竖直差）
      </div>
    </div>
  `;
}
```

### 3. 视觉反馈系统

#### 3.1 关键点高亮绘制

```javascript
/**
 * 绘制关键点高亮效果
 * 在 p5.js draw() 循环中调用
 */
function drawKeyPointHighlight(p) {
  if (!adsorptionState.isActive || adsorptionState.type !== 'keypoint') {
    return;
  }

  const target = adsorptionState.target;
  const canvasPos = physicsToCanvas(target.x, target.y);

  // 放大 1.5 倍，颜色加深
  p.fill(0, 77, 51); // #004d33
  p.stroke(255);
  p.strokeWeight(2);
  p.circle(canvasPos.x, canvasPos.y, 12 * 1.5);
}

/**
 * 绘制轨迹点高亮效果
 */
function drawTrajectoryHighlight(p) {
  if (!adsorptionState.isActive || adsorptionState.type !== 'trajectory') {
    return;
  }

  const target = adsorptionState.target;
  const canvasPos = physicsToCanvas(target.x, target.y);

  // 白色描边
  p.noFill();
  p.stroke(255);
  p.strokeWeight(2);
  p.circle(canvasPos.x, canvasPos.y, 8);
}
```

### 4. 状态管理

#### 4.1 吸附状态更新

```javascript
/**
 * 更新吸附状态
 */
function updateAdsorptionState(type, target) {
  adsorptionState.isActive = true;
  adsorptionState.type = type;
  adsorptionState.target = target;

  // 清除淡出定时器
  if (tooltip.fadeOutTimer) {
    clearTimeout(tooltip.fadeOutTimer);
    tooltip.fadeOutTimer = null;
  }

  // 更新 tooltip
  updateTooltip(type, target);
}

/**
 * 清除吸附状态
 */
function clearAdsorptionState() {
  if (!adsorptionState.isActive) {
    return;
  }

  adsorptionState.isActive = false;
  adsorptionState.type = null;
  adsorptionState.target = null;

  // 延迟隐藏 tooltip
  tooltip.fadeOutTimer = setTimeout(() => {
    tooltip.visible = false;
  }, ADSORPTION_CONFIG.fadeOutDelay);
}

/**
 * 更新 tooltip 内容和位置
 */
function updateTooltip(type, target) {
  // 生成内容
  tooltip.content = type === 'keypoint'
    ? generateKeyPointInfo(target)
    : generateTrajectoryInfo(target);

  // 计算位置
  const mousePos = adsorptionState.mousePos;
  const tooltipSize = { width: 300, height: 150 }; // 预估尺寸
  const pos = calculateTooltipPosition(
    mousePos.x,
    mousePos.y,
    tooltipSize.width,
    tooltipSize.height
  );

  tooltip.x = pos.x;
  tooltip.y = pos.y;
  tooltip.visible = true;

  // 渲染 KaTeX 公式
  nextTick(() => {
    const tooltipEl = document.querySelector('.tooltip');
    if (tooltipEl) {
      renderMathInElement(tooltipEl);
    }
  });
}
```

## Integration Points

### 1. 与现有交互的兼容性

#### 1.1 拖拽物体
- **冲突点**：拖拽时 `mouseMoved` 事件仍会触发
- **解决方案**：在 `detectAdsorption()` 中检查 `animationState.isDragging`，拖拽时跳过吸附检测

```javascript
function detectAdsorption(mouseX, mouseY) {
  // 拖拽时不触发吸附
  if (animationState.isDragging) {
    clearAdsorptionState();
    return;
  }

  // ... 正常吸附检测逻辑
}
```

#### 1.2 点击暂停/播放
- **冲突点**：tooltip 可能遮挡点击区域
- **解决方案**：tooltip 使用 `pointer-events: none`，不拦截鼠标事件

```css
.tooltip {
  pointer-events: none; /* 不拦截鼠标事件 */
}
```

### 2. 与 p5.js 的集成

#### 2.1 事件处理
```javascript
p.mouseMoved = () => {
  // 保存鼠标位置
  adsorptionState.mousePos = { x: p.mouseX, y: p.mouseY };

  // 检测吸附
  detectAdsorption(p.mouseX, p.mouseY);

  // 原有逻辑（物体悬停检测）
  const pos = getCurrentPosition();
  const canvasPos = physicsToCanvas(pos.x, pos.y);
  const dist = p.dist(p.mouseX, p.mouseY, canvasPos.x, canvasPos.y);
  animationState.isHovering = dist < 20;
};

p.draw = () => {
  // ... 原有绘制逻辑

  // 绘制吸附高亮
  drawKeyPointHighlight(p);
  drawTrajectoryHighlight(p);
};
```

## Performance Considerations

### 1. 吸附检测优化

#### 1.1 关键点检测
- **复杂度**：O(3) - 固定 3 个关键点
- **优化**：无需优化，成本极低

#### 1.2 轨迹点检测
- **复杂度**：O(n) - n 为 `pathPoints` 数组长度（最大 1000）
- **优化策略**：
  1. 跳过画布外的点（减少 50% 计算量）
  2. 使用平方距离比较（避免 `Math.sqrt`）
  3. 提前退出（找到第一个满足条件的点）

```javascript
function checkTrajectoryAdsorption(mouseX, mouseY) {
  const thresholdSquared = ADSORPTION_CONFIG.threshold ** 2;

  for (const point of animationState.pathPoints) {
    const canvasPos = physicsToCanvas(point.x, point.y);

    // 跳过画布外的点
    if (canvasPos.x < 0 || canvasPos.x > canvasWidth ||
        canvasPos.y < 0 || canvasPos.y > canvasHeight) {
      continue;
    }

    // 使用平方距离比较
    const distSquared =
      (mouseX - canvasPos.x) ** 2 +
      (mouseY - canvasPos.y) ** 2;

    if (distSquared < thresholdSquared) {
      return point; // 提前退出
    }
  }

  return null;
}
```

### 2. Tooltip 渲染优化

#### 2.1 KaTeX 公式缓存
- **问题**：关键点公式固定，重复渲染浪费性能
- **解决方案**：预渲染关键点公式，缓存结果

```javascript
// 组件初始化时预渲染
const formulaCache = {};

onMounted(() => {
  const formulas = {
    start: '$x = v_0 \\cdot t \\cdot \\cos\\theta$',
    peak: '$v_y = 0 \\Rightarrow t = \\frac{v_0 \\sin\\theta}{g}$',
    landing: '$y = 0$'
  };

  for (const [key, formula] of Object.entries(formulas)) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = formula;
    renderMathInElement(tempDiv);
    formulaCache[key] = tempDiv.innerHTML;
  }
});
```

#### 2.2 DOM 更新节流
- **问题**：`mouseMoved` 事件频繁触发（60fps），tooltip 频繁更新
- **解决方案**：使用 `requestAnimationFrame` 节流

```javascript
let tooltipUpdateScheduled = false;

function updateTooltip(type, target) {
  if (tooltipUpdateScheduled) {
    return;
  }

  tooltipUpdateScheduled = true;
  requestAnimationFrame(() => {
    // ... 实际更新逻辑
    tooltipUpdateScheduled = false;
  });
}
```

## Testing Strategy

### 1. 功能测试

#### 1.1 吸附检测测试
- 鼠标悬停关键点（距离 < 10px）→ 触发吸附
- 鼠标悬停轨迹点（距离 < 10px）→ 触发吸附
- 鼠标同时靠近关键点和轨迹点 → 仅触发关键点吸附
- 鼠标移出吸附范围（距离 > 10px）→ 0.2 秒后清除吸附

#### 1.2 Tooltip 显示测试
- 吸附触发时 → tooltip 立即显示
- Tooltip 内容正确（坐标、时间、速度、公式）
- Tooltip 位置自适应（靠近边缘时调整方向）
- KaTeX 公式正常渲染

#### 1.3 视觉反馈测试
- 关键点吸附 → 放大 1.5 倍 + 颜色加深（#004d33）
- 轨迹点吸附 → 白色描边（2px）

### 2. 性能测试

#### 2.1 帧率测试
- 使用 Chrome DevTools Performance 监控
- 动画播放 + 鼠标移动 → 保持 60fps
- 轨迹点数量 1000 个 → 吸附检测耗时 < 1ms

#### 2.2 内存测试
- 长时间运行（10 分钟）→ 无内存泄漏
- Tooltip 频繁显示/隐藏 → 无 DOM 节点堆积

### 3. 兼容性测试

#### 3.1 交互兼容性
- 拖拽物体时 → 不触发吸附
- 点击空白区域 → 正常暂停/播放
- Tooltip 显示时 → 不拦截鼠标事件

#### 3.2 功能兼容性
- 参数调节 → tooltip 内容实时更新
- 窗口缩放 → tooltip 位置正确适配
- 切换可视化类型 → tooltip 正确清理

## Edge Cases

### 1. 边界情况处理

#### 1.1 轨迹点为空
- **场景**：动画刚开始，`pathPoints` 数组为空
- **处理**：`checkTrajectoryAdsorption()` 提前返回 `null`

#### 1.2 关键点重叠
- **场景**：初始高度为 0，起点和落地点重叠
- **处理**：按优先级返回（起点 > 最高点 > 落地点）

#### 1.3 Tooltip 超出画布
- **场景**：鼠标靠近画布边缘
- **处理**：`calculateTooltipPosition()` 自动调整方向

#### 1.4 快速移动鼠标
- **场景**：鼠标快速移动，跳过吸附点
- **处理**：可接受（用户可放慢速度重新悬停）

### 2. 异常情况处理

#### 2.1 物理计算异常
- **场景**：`calculateVelocity()` 返回 `NaN`
- **处理**：tooltip 显示 "计算错误"

#### 2.2 KaTeX 渲染失败
- **场景**：公式语法错误
- **处理**：显示原始 LaTeX 字符串

## Migration Path

本次变更为纯新增功能，无需迁移现有代码。实施步骤：

1. **阶段 1**：添加吸附检测逻辑（不影响现有功能）
2. **阶段 2**：添加视觉反馈（仅在吸附时显示）
3. **阶段 3**：添加 tooltip 展示（独立 DOM 元素）
4. **阶段 4**：集成测试（验证兼容性）

## Future Enhancements

以下功能可在后续版本中考虑：

1. **吸附阈值动态调整**：根据画布缩放比例自动调整阈值
2. **Tooltip 内容自定义**：用户可配置显示/隐藏特定字段
3. **多语言支持**：中英文切换
4. **轨迹点编辑**：点击轨迹点可修改参数
5. **历史轨迹对比**：显示多条轨迹的 tooltip
