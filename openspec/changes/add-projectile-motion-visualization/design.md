# Design: 平抛运动可视化系统

## 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                        App.vue                              │
│  ┌──────────────────┐         ┌─────────────────────────┐  │
│  │   ChatBox.vue    │         │   VisualCanvas.vue      │  │
│  │  (30% width)     │         │   (70% width)           │  │
│  │                  │         │  ┌──────────────────┐   │  │
│  │  - 对话列表      │◄────────┤  │ ProjectileMotion │   │  │
│  │  - 输入框        │  watch  │  │     .vue         │   │  │
│  │  - 语音输入      │         │  │  (p5.js canvas)  │   │  │
│  └──────────────────┘         │  └──────────────────┘   │  │
│           │                   │  - 参数控制面板          │  │
│           │                   │  - 动画控制按钮          │  │
│           ▼                   │  - 公式展示区            │  │
│    ┌──────────────┐           └─────────────────────────┘  │
│    │ store/index  │                      │                  │
│    │  - messageList                      │                  │
│    │  - currentVisualType                │                  │
│    │  - projectileParams ◄───────────────┘                  │
│    └──────────────┘                                         │
│           │                                                  │
│           ▼                                                  │
│    ┌──────────────┐                                         │
│    │utils/physic.js│                                        │
│    │ - calculatePosition()                                  │
│    │ - calculateVelocity()                                  │
│    │ - predictLandingTime()                                 │
│    │ - validateParams()                                     │
│    └──────────────┘                                         │
└─────────────────────────────────────────────────────────────┘
```

## 核心模块设计

### 1. ProjectileMotion.vue（可视化组件）

**职责**：
- 初始化和管理 p5.js 实例
- 渲染平抛运动动画和轨迹
- 处理用户交互（拖拽、点击）
- 控制动画播放状态
- 展示参数控制 UI 和公式

**关键状态**：
```javascript
const params = reactive({
  v0: 10,        // 初速度 (m/s)
  g: 9.8,        // 重力加速度 (m/s²)
  h: 50,         // 初始高度 (m)
  theta: 0,      // 发射角度 (度)
  mass: 1,       // 质量 (kg)
  timeScale: 1   // 倍速 (0.5x/1x/2x/3x)
});

const animationState = reactive({
  isPlaying: false,
  currentTime: 0,
  pathPoints: [],      // 轨迹点数组 [{x, y, t}]
  isDragging: false,
  dragTarget: null     // 'object' | null
});

const keyPoints = reactive({
  start: { x: 0, y: 0 },
  peak: { x: 0, y: 0, t: 0 },
  landing: { x: 0, y: 0, t: 0 }
});
```

**生命周期管理**：
```javascript
onMounted(() => {
  // 检查挂载点是否已存在画布
  const mountPoint = document.getElementById('canvas-mount-point');
  if (mountPoint.querySelector('canvas')) {
    console.warn('Canvas already exists, removing...');
    mountPoint.innerHTML = '';
  }

  // 初始化 p5.js
  p5Instance = new p5(sketch, 'canvas-mount-point');
});

onUnmounted(() => {
  // 强制清理 p5 实例
  if (p5Instance) {
    p5Instance.remove();
    p5Instance = null;
  }
});
```

**p5.js Sketch 结构**：
```javascript
const sketch = (p) => {
  let canvasWidth, canvasHeight;
  let scale; // 物理单位到像素的缩放比例

  p.setup = () => {
    const container = p.canvas.parentElement;
    canvasWidth = container.clientWidth;
    canvasHeight = container.clientHeight;
    p.createCanvas(canvasWidth, canvasHeight);
    p.frameRate(60);

    // 动态计算缩放比例（确保初始高度占画布 70%）
    scale = (canvasHeight * 0.7) / params.h;
  };

  p.draw = () => {
    p.background(245); // #F5F5F5

    // 更新动画时间
    if (animationState.isPlaying) {
      const dt = (1 / 60) * params.timeScale;
      animationState.currentTime += dt;

      // 计算当前位置
      const pos = calculatePosition(
        params.v0, params.g, params.h, params.theta,
        animationState.currentTime
      );

      // 检查是否落地
      if (pos.y <= 0) {
        animationState.isPlaying = false;
        animationState.currentTime = keyPoints.landing.t;
      }

      // 记录轨迹点（根据倍速采样）
      if (animationState.currentTime % getSampleInterval() < dt) {
        animationState.pathPoints.push({
          x: pos.x,
          y: pos.y,
          t: animationState.currentTime
        });
      }
    }

    // 绘制轨迹
    drawTrajectory(p);

    // 绘制关键节点
    drawKeyPoints(p);

    // 绘制物体
    drawObject(p);

    // 绘制辅助线（地面、初始位置虚线）
    drawGuides(p);
  };

  p.windowResized = () => {
    const container = p.canvas.parentElement;
    canvasWidth = container.clientWidth;
    canvasHeight = container.clientHeight;
    p.resizeCanvas(canvasWidth, canvasHeight);
    scale = (canvasHeight * 0.7) / params.h;
  };

  p.mousePressed = () => {
    // 检查是否点击物体
    const pos = getCurrentPosition();
    const canvasPos = physicsToCanvas(pos.x, pos.y);
    const dist = p.dist(p.mouseX, p.mouseY, canvasPos.x, canvasPos.y);

    if (dist < 20) {
      animationState.isDragging = true;
      animationState.dragTarget = 'object';
      return;
    }

    // 点击空白区域：播放/暂停
    togglePlayPause();
  };

  p.mouseDragged = () => {
    if (animationState.isDragging && animationState.dragTarget === 'object') {
      // 将鼠标位置转换为物理坐标
      const physicsPos = canvasToPhysics(p.mouseX, p.mouseY);

      // 更新初始高度（限制在范围内）
      params.h = Math.max(10, Math.min(200, physicsPos.y));

      // 重新计算关键点
      recalculateKeyPoints();
    }
  };

  p.mouseReleased = () => {
    if (animationState.isDragging) {
      animationState.isDragging = false;
      animationState.dragTarget = null;
      // 不触发点击事件
      return;
    }
  };
};
```

### 2. utils/physic.js（物理计算模块）

**职责**：
- 提供纯函数物理计算
- 参数校验和边界处理
- 坐标系无关的计算逻辑

**核心函数**：

```javascript
/**
 * 计算给定时刻的位置（物理坐标系）
 * @param {number} v0 - 初速度 (m/s)
 * @param {number} g - 重力加速度 (m/s²)
 * @param {number} h - 初始高度 (m)
 * @param {number} theta - 发射角度 (度)
 * @param {number} t - 时间 (s)
 * @returns {{x: number, y: number}} 位置坐标
 */
export function calculatePosition(v0, g, h, theta, t) {
  const thetaRad = (theta * Math.PI) / 180;
  const x = v0 * t * Math.cos(thetaRad);
  const y = h + v0 * t * Math.sin(thetaRad) - 0.5 * g * t * t;
  return { x, y };
}

/**
 * 计算给定时刻的速度（物理坐标系）
 * @returns {{vx: number, vy: number, v: number}} 速度分量和合速度
 */
export function calculateVelocity(v0, g, theta, t) {
  const thetaRad = (theta * Math.PI) / 180;
  const vx = v0 * Math.cos(thetaRad);
  const vy = v0 * Math.sin(thetaRad) - g * t;
  const v = Math.sqrt(vx * vx + vy * vy);
  return { vx, vy, v };
}

/**
 * 预测落地时间
 * 解方程：h + v0*t*sin(θ) - 0.5*g*t² = 0
 * @returns {number} 落地时间 (s)，如果无解返回 Infinity
 */
export function predictLandingTime(v0, g, h, theta) {
  const thetaRad = (theta * Math.PI) / 180;
  const v0y = v0 * Math.sin(thetaRad);

  // 使用求根公式：t = [v0y + √(v0y² + 2gh)] / g
  const discriminant = v0y * v0y + 2 * g * h;

  if (discriminant < 0) {
    return Infinity; // 无物理解
  }

  const t = (v0y + Math.sqrt(discriminant)) / g;
  return t;
}

/**
 * 计算最高点时间和位置
 * 最高点条件：vy = 0 => t = v0*sin(θ) / g
 */
export function calculatePeakPoint(v0, g, h, theta) {
  const thetaRad = (theta * Math.PI) / 180;
  const v0y = v0 * Math.sin(thetaRad);

  if (v0y <= 0) {
    // 向下或水平抛，初始点即为最高点
    return { x: 0, y: h, t: 0 };
  }

  const tPeak = v0y / g;
  const pos = calculatePosition(v0, g, h, theta, tPeak);
  return { x: pos.x, y: pos.y, t: tPeak };
}

/**
 * 参数校验
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateParams(params) {
  const errors = [];

  if (params.v0 < 1 || params.v0 > 50) {
    errors.push('初速度必须在 1-50 m/s 范围内');
  }
  if (params.g < 1 || params.g > 20) {
    errors.push('重力加速度必须在 1-20 m/s² 范围内');
  }
  if (params.h < 10 || params.h > 200) {
    errors.push('初始高度必须在 10-200 m 范围内');
  }
  if (params.theta < 0 || params.theta > 90) {
    errors.push('发射角度必须在 0-90° 范围内');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```

### 3. 坐标系转换

**物理坐标系 → Canvas 坐标系**：
```javascript
function physicsToCanvas(physicsX, physicsY) {
  const canvasX = physicsX * scale + canvasWidth * 0.1; // 左侧留 10% 边距
  const canvasY = canvasHeight - physicsY * scale - canvasHeight * 0.1; // 底部留 10% 边距
  return { x: canvasX, y: canvasY };
}
```

**Canvas 坐标系 → 物理坐标系**：
```javascript
function canvasToPhysics(canvasX, canvasY) {
  const physicsX = (canvasX - canvasWidth * 0.1) / scale;
  const physicsY = (canvasHeight - canvasY - canvasHeight * 0.1) / scale;
  return { x: physicsX, y: physicsY };
}
```

### 4. 轨迹渲染

**渐变轨迹绘制**：
```javascript
function drawTrajectory(p) {
  if (animationState.pathPoints.length < 2) return;

  p.noFill();
  p.beginShape();

  for (let i = 0; i < animationState.pathPoints.length; i++) {
    const point = animationState.pathPoints[i];
    const canvasPos = physicsToCanvas(point.x, point.y);

    // 计算渐变颜色（从深绿到浅灰）
    const ratio = i / (animationState.pathPoints.length - 1);
    const r = 0 + (204 - 0) * ratio;
    const g = 102 + (204 - 102) * ratio;
    const b = 68 + (204 - 68) * ratio;

    p.stroke(r, g, b);
    p.strokeWeight(2);
    p.vertex(canvasPos.x, canvasPos.y);
  }

  p.endShape();
}
```

### 5. 参数更新策略

**策略矩阵**：

| 动画状态 | 参数修改行为 | 轨迹处理 |
|---------|------------|---------|
| 停止    | 立即更新初始状态 | 清空轨迹，重新计算关键点 |
| 播放    | 自动暂停并重置 | 清空轨迹，重置时间为 0 |
| 暂停    | 更新当前状态 | 保留已有轨迹，重新计算后续 |

**实现**：
```javascript
watch(() => [params.v0, params.g, params.h, params.theta], () => {
  if (animationState.isPlaying) {
    // 播放时修改参数：自动暂停并重置
    animationState.isPlaying = false;
    resetAnimation();
  } else {
    // 停止/暂停时：重新计算关键点
    recalculateKeyPoints();
  }

  // 同步到全局状态
  state.projectileParams = { ...params };
}, { deep: true });
```

### 6. 公式展示

**展示内容**：
```javascript
const formulaContent = computed(() => {
  const theta = params.theta;
  return `
    <div class="formula-section">
      <h3>核心公式</h3>
      <div class="formula-block">
        $x = v_0 \\cdot t \\cdot \\cos(${theta}°)$
      </div>
      <div class="formula-block">
        $y = ${params.h} + v_0 \\cdot t \\cdot \\sin(${theta}°) - \\frac{1}{2} \\cdot ${params.g} \\cdot t^2$
      </div>
      <div class="formula-block">
        $v_x = v_0 \\cdot \\cos(${theta}°), \\quad v_y = v_0 \\cdot \\sin(${theta}°) - ${params.g} \\cdot t$
      </div>
    </div>

    <div class="result-section">
      <h3>实时结果</h3>
      <p><strong>当前时间：</strong>${animationState.currentTime.toFixed(2)} s</p>
      <p><strong>水平位移：</strong>${currentPos.x.toFixed(2)} m</p>
      <p><strong>竖直位移：</strong>${currentPos.y.toFixed(2)} m</p>
      <p><strong>合速度：</strong>${currentVel.v.toFixed(2)} m/s</p>
      <p><strong>落地时间：</strong>${keyPoints.landing.t.toFixed(2)} s</p>
      <p><strong>落地位置：</strong>${keyPoints.landing.x.toFixed(2)} m</p>
    </div>
  `;
});

watch(formulaContent, () => {
  nextTick(() => {
    const container = document.getElementById('formula-display');
    if (container) {
      container.innerHTML = formulaContent.value;
      renderMathInElement(container);
    }
  });
});
```

## 性能优化

### 1. 轨迹点采样策略
```javascript
function getSampleInterval() {
  // 根据倍速调整采样间隔
  const baseInterval = 0.1; // 1x 时每 0.1s 采样一次
  return baseInterval / params.timeScale;
}
```

### 2. 避免不必要的重绘
```javascript
// 仅在参数变化或动画播放时重绘
let lastDrawTime = 0;
const drawInterval = 1000 / 60; // 60fps

p.draw = () => {
  const now = Date.now();
  if (!animationState.isPlaying && now - lastDrawTime < drawInterval) {
    return; // 跳过本帧
  }
  lastDrawTime = now;

  // ... 绘制逻辑
};
```

### 3. 内存管理
```javascript
// 限制轨迹点数量（最多 1000 个点）
if (animationState.pathPoints.length > 1000) {
  animationState.pathPoints.shift(); // 移除最早的点
}
```

## 对话联动机制

**触发规则**：
```javascript
// 在 ChatBox.vue 的 AI 回复处理中
function handleAIResponse(content) {
  // 检测关键词
  const projectilePattern = /平抛运动|抛体运动|projectile/i;
  const v0Pattern = /初速度\s*(\d+\.?\d*)\s*m\/s/i;
  const thetaPattern = /角度\s*(\d+\.?\d*)\s*[°度]/i;

  if (projectilePattern.test(content)) {
    // 提取参数
    const v0Match = content.match(v0Pattern);
    const thetaMatch = content.match(thetaPattern);

    const params = {
      v0: v0Match ? parseFloat(v0Match[1]) : 10,
      theta: thetaMatch ? parseFloat(thetaMatch[1]) : 0
    };

    // 更新全局状态
    state.currentVisualType = 'PROJECTILE';
    state.projectileParams = params;
  }
}
```

## 测试策略

### 1. 物理计算准确性测试
- 纯平抛（θ=0°）：验证 x = v₀t，y = h - ½gt²
- 斜抛（θ=45°）：验证最大射程公式
- 边界条件：h=0、v₀=0、θ=90°

### 2. 交互测试
- 拖拽物体不触发点击暂停
- 参数修改后轨迹正确更新
- 窗口缩放后画布正确适配

### 3. 性能测试
- 长时间运行（10 分钟）无内存泄漏
- 60fps 稳定性（使用 Chrome DevTools Performance）
- 参数修改响应时间 < 100ms

### 4. 视觉回归测试
- 截图对比：初始状态、播放中、暂停、落地
- 配色验证：使用取色器检查关键元素颜色
