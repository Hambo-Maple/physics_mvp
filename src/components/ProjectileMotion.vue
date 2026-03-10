<template>
  <div class="projectile-container">
    <!-- 参数控制区 -->
    <div class="params-control" @mousedown.stop @click.stop>
      <div class="param-item">
        <label>初速度 v₀ (m/s): {{ params.v0 }}</label>
        <input type="range" v-model.number="params.v0" min="1" max="50" step="0.1" />
        <input type="number" v-model.number="params.v0" min="1" max="50" step="0.1" class="param-input" />
      </div>

      <div class="param-item">
        <label>重力加速度 g (m/s²): {{ params.g }}</label>
        <input type="range" v-model.number="params.g" min="1" max="20" step="0.1" />
        <input type="number" v-model.number="params.g" min="1" max="20" step="0.1" class="param-input" />
      </div>

      <div class="param-item">
        <label>初始高度 h (m): {{ params.h }}</label>
        <input type="range" v-model.number="params.h" min="10" max="200" step="1" />
        <input type="number" v-model.number="params.h" min="10" max="200" step="1" class="param-input" />
      </div>

      <div class="param-item">
        <label>发射角度 θ (°): {{ params.theta }}</label>
        <input type="range" v-model.number="params.theta" min="0" max="90" step="1" />
        <input type="number" v-model.number="params.theta" min="0" max="90" step="1" class="param-input" />
      </div>

      <div class="param-item">
        <label>质量 m (kg): {{ params.mass }}</label>
        <span class="readonly-value">{{ params.mass }}</span>
      </div>
    </div>

    <!-- 画布挂载点 -->
    <div id="projectile-canvas-mount" ref="canvasMountRef"></div>

    <!-- 动画控制区 -->
    <div class="animation-controls" @mousedown.stop @click.stop>
      <button @click="togglePlayPause" class="btn btn-primary">
        {{ animationState.isPlaying ? '暂停' : '播放' }}
      </button>
      <button @click="resetAnimation" class="btn btn-secondary">重置</button>

      <div class="speed-controls">
        <button
          v-for="speed in [0.5, 1, 2, 3]"
          :key="speed"
          @click="setTimeScale(speed)"
          :class="['btn', 'btn-speed', { active: params.timeScale === speed }]"
        >
          {{ speed }}x
        </button>
      </div>

      <button
        @click="stepForward"
        :disabled="animationState.isPlaying"
        class="btn btn-secondary"
      >
        单步前进
      </button>

      <div class="axis-controls">
        <button
          @click="toggleAxis"
          :class="['btn', 'btn-secondary', { active: axisState.visible }]"
        >
          {{ axisState.visible ? '隐藏坐标轴' : '显示坐标轴' }}
        </button>
        <button
          @click="toggleGridMode"
          :disabled="!axisState.visible"
          :class="['btn', 'btn-secondary', { active: axisState.gridMode }]"
        >
          {{ axisState.gridMode ? '短线刻度' : '网格线' }}
        </button>
      </div>
    </div>

    <!-- 公式展示区 -->
    <div class="formula-display" ref="formulaDisplayRef" @mousedown.stop @click.stop></div>

    <!-- Tooltip 悬浮提示 -->
    <div
      v-if="tooltip.visible"
      class="tooltip"
      :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
      v-html="tooltip.content"
    ></div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, watch, nextTick, computed } from 'vue';
import p5 from 'p5';
import state, { updateProjectileParams } from '../store';
import { renderMathInElement } from '../utils/katex';
import {
  calculatePosition,
  calculateVelocity,
  predictLandingTime,
  calculatePeakPoint,
  validateParams
} from '../utils/physic';

// Props
const props = defineProps({
  initialV0: { type: Number, default: 10 },
  initialG: { type: Number, default: 9.8 },
  initialH: { type: Number, default: 50 },
  initialTheta: { type: Number, default: 0 }
});

// 参数状态
const params = reactive({
  v0: props.initialV0,
  g: props.initialG,
  h: props.initialH,
  theta: props.initialTheta,
  mass: 1,
  timeScale: 1
});

// 动画状态
const animationState = reactive({
  isPlaying: false,
  currentTime: 0,
  pathPoints: [],
  isDragging: false,
  dragTarget: null,
  isHovering: false
});

// 关键点
const keyPoints = reactive({
  start: { x: 0, y: 0 },
  peak: { x: 0, y: 0, t: 0 },
  landing: { x: 0, y: 0, t: 0 }
});

// 吸附配置
const ADSORPTION_CONFIG = {
  threshold: 10,        // 吸附阈值（px）
  fadeOutDelay: 200     // tooltip 消失延迟（ms）
};

// 吸附状态
const adsorptionState = reactive({
  isActive: false,           // 是否正在吸附
  type: null,                // 吸附类型：'keypoint' | 'trajectory' | null
  target: null,              // 吸附目标对象
  mousePos: { x: 0, y: 0 }   // 鼠标位置（canvas 坐标）
});

// Tooltip 状态
const tooltip = reactive({
  visible: false,            // 是否显示
  x: 0,                      // 位置 X（屏幕坐标）
  y: 0,                      // 位置 Y（屏幕坐标）
  content: '',               // HTML 内容
  fadeOutTimer: null         // 淡出定时器
});

// 坐标轴状态
const axisState = reactive({
  visible: true,             // 是否显示坐标轴
  gridMode: false            // false: 短线刻度, true: 网格线
});

// Refs
const canvasMountRef = ref(null);
const formulaDisplayRef = ref(null);
let p5Instance = null;
let canvasWidth = 0;
let canvasHeight = 0;
let scaleX = 1;
let scaleY = 1;

/**
 * 更新缩放比例，x轴和y轴分开计算
 */
function updateScale() {
  // 找出最大高度和最大水平距离
  const maxHeight = Math.max(params.h, keyPoints.peak.y);
  const maxDistance = keyPoints.landing.x;

  // 左右边距：左右各留15%的空间，让起点和落地点可以动态调整
  const horizontalMargin = 0.15;
  const availableWidth = canvasWidth * (1 - 2 * horizontalMargin);

  // 上下边距：上下各15%留白
  const verticalMargin = 0.15;
  const availableHeight = canvasHeight * (1 - 2 * verticalMargin);

  // x轴和y轴分别计算缩放比例
  scaleX = availableWidth / maxDistance;
  scaleY = availableHeight / maxHeight;
}

/**
 * 重新计算关键点
 */
function recalculateKeyPoints() {
  // 起点
  keyPoints.start = { x: 0, y: params.h };

  // 最高点
  const peak = calculatePeakPoint(params.v0, params.g, params.h, params.theta);
  keyPoints.peak = peak;

  // 落地点
  const landingTime = predictLandingTime(params.v0, params.g, params.h, params.theta);
  const landingPos = calculatePosition(params.v0, params.g, params.h, params.theta, landingTime);
  keyPoints.landing = { x: landingPos.x, y: 0, t: landingTime };

  // 更新缩放比例
  if (canvasWidth && canvasHeight) {
    updateScale();
  }
}

/**
 * 物理坐标转 Canvas 坐标
 */
function physicsToCanvas(physicsX, physicsY) {
  const canvasX = physicsX * scaleX + canvasWidth * 0.15;
  const canvasY = canvasHeight - physicsY * scaleY - canvasHeight * 0.15;
  return { x: canvasX, y: canvasY };
}

/**
 * Canvas 坐标转物理坐标
 */
function canvasToPhysics(canvasX, canvasY) {
  const physicsX = (canvasX - canvasWidth * 0.15) / scaleX;
  const physicsY = (canvasHeight - canvasY - canvasHeight * 0.15) / scaleY;
  return { x: physicsX, y: physicsY };
}

/**
 * 检测关键点吸附
 * 返回距离最近且在阈值内的关键点
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
 * 仅检测已绘制的 pathPoints 数组，使用性能优化
 */
function checkTrajectoryAdsorption(mouseX, mouseY) {
  if (animationState.pathPoints.length === 0) {
    return null;
  }

  let closestPoint = null;
  let minDistanceSquared = ADSORPTION_CONFIG.threshold ** 2;

  // 优化：仅检测可见范围内的点
  for (const point of animationState.pathPoints) {
    const canvasPos = physicsToCanvas(point.x, point.y);

    // 跳过画布外的点
    if (canvasPos.x < 0 || canvasPos.x > canvasWidth ||
        canvasPos.y < 0 || canvasPos.y > canvasHeight) {
      continue;
    }

    // 使用平方距离比较（避免 Math.sqrt）
    const distSquared =
      (mouseX - canvasPos.x) ** 2 +
      (mouseY - canvasPos.y) ** 2;

    if (distSquared < minDistanceSquared) {
      minDistanceSquared = distSquared;
      closestPoint = point;
    }
  }

  return closestPoint;
}

/**
 * 吸附检测主函数
 * 优先检测关键点，再检测轨迹点
 */
function detectAdsorption(mouseX, mouseY) {
  // 拖拽时不触发吸附
  if (animationState.isDragging) {
    clearAdsorptionState();
    return;
  }

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
 * 获取当前位置
 */
function getCurrentPosition() {
  return calculatePosition(params.v0, params.g, params.h, params.theta, animationState.currentTime);
}

/**
 * 获取采样间隔
 */
function getSampleInterval() {
  const baseInterval = 0.1;
  return baseInterval / params.timeScale;
}

/**
 * 格式化物理数值
 * 保留 2 位小数并添加单位
 */
function formatPhysicsValue(value, unit) {
  if (isNaN(value) || !isFinite(value)) {
    return '计算错误';
  }
  return `${value.toFixed(2)} ${unit}`;
}

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
        <strong>坐标：</strong>(x: ${formatPhysicsValue(keypoint.x, 'm')}, y: ${formatPhysicsValue(keypoint.y, 'm')})
      </div>
      <div class="tooltip-item">
        <strong>运动时间：</strong>t = ${formatPhysicsValue(keypoint.t, 's')}
      </div>
      <div class="tooltip-item">
        <strong>瞬时速度：</strong>
        v<sub>x</sub> = ${formatPhysicsValue(vel.vx, 'm/s')}，
        v<sub>y</sub> = ${formatPhysicsValue(vel.vy, 'm/s')}，
        合速度 = ${formatPhysicsValue(vel.v, 'm/s')}
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
        <strong>坐标：</strong>(x: ${formatPhysicsValue(point.x, 'm')}, y: ${formatPhysicsValue(point.y, 'm')})
      </div>
      <div class="tooltip-item">
        <strong>运动时间：</strong>t = ${formatPhysicsValue(point.t, 's')}
      </div>
      <div class="tooltip-item">
        <strong>瞬时速度：</strong>
        v<sub>x</sub> = ${formatPhysicsValue(vel.vx, 'm/s')}，
        v<sub>y</sub> = ${formatPhysicsValue(vel.vy, 'm/s')}
      </div>
      <div class="tooltip-item">
        <strong>位移差：</strong>
        Δx = ${formatPhysicsValue(deltaX, 'm')}（与起点水平差），
        Δy = ${formatPhysicsValue(deltaY, 'm')}（与起点竖直差）
      </div>
    </div>
  `;
}

/**
 * 计算 tooltip 位置
 * 默认显示在鼠标右侧，边界检测后自动调整
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

/**
 * 更新 tooltip 内容和位置
 */
function updateTooltip(type, target) {
  // 生成内容
  tooltip.content = type === 'keypoint'
    ? generateKeyPointInfo(target)
    : generateTrajectoryInfo(target);

  // 计算位置（使用鼠标位置，而非吸附点位置）
  const mousePos = adsorptionState.mousePos;
  const tooltipSize = { width: 300, height: 150 };

  // 获取画布容器的位置偏移
  const container = canvasMountRef.value;
  const containerRect = container ? container.getBoundingClientRect() : { left: 0, top: 0 };

  const pos = calculateTooltipPosition(
    mousePos.x,
    mousePos.y,
    tooltipSize.width,
    tooltipSize.height
  );

  // 转换为相对于页面的绝对坐标
  tooltip.x = containerRect.left + pos.x;
  tooltip.y = containerRect.top + pos.y;
  tooltip.visible = true;

  // 渲染 KaTeX 公式
  nextTick(() => {
    const tooltipEl = document.querySelector('.tooltip');
    if (tooltipEl) {
      renderMathInElement(tooltipEl);
    }
  });
}

/**
 * 绘制关键点高亮效果
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

/**
 * 绘制物体
 */
function drawObject(p) {
  const pos = getCurrentPosition();
  if (pos.y < 0) return; // 已落地，不绘制

  const canvasPos = physicsToCanvas(pos.x, pos.y);

  // 绘制物体
  p.fill(0, 102, 68); // #006644
  if (animationState.isDragging || animationState.isHovering) {
    p.stroke(255);
    p.strokeWeight(2);
  } else {
    p.noStroke();
  }

  const radius = 10 + params.mass;
  p.circle(canvasPos.x, canvasPos.y, radius * 2);
}

/**
 * 绘制辅助线
 */
function drawGuides(p) {
  p.stroke(153); // #999
  p.strokeWeight(1);
  p.drawingContext.setLineDash([5, 5]);

  // 地面线
  const groundY = canvasHeight - canvasHeight * 0.1;
  p.line(0, groundY, canvasWidth, groundY);

  p.drawingContext.setLineDash([]);
}

/**
 * 计算自适应刻度间隔
 * 根据当前缩放比例自动选择合适的刻度间隔
 */
function calculateTickInterval() {
  // 获取当前可见范围（物理坐标）
  const maxX = keyPoints.landing.x;
  const maxY = Math.max(params.h, keyPoints.peak.y);

  // 目标：X 轴显示 5-6 个刻度，Y 轴显示 8-10 个刻度
  const targetTicksX = 6;
  const targetTicksY = 10;

  // 计算理想间隔
  const idealIntervalX = maxX / targetTicksX;
  const idealIntervalY = maxY / targetTicksY;

  // 选择合适的"整数"间隔（1, 2, 5, 10, 20, 50, 100...）
  const niceIntervals = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];

  let intervalX = niceIntervals[niceIntervals.length - 1];
  for (const interval of niceIntervals) {
    if (interval >= idealIntervalX) {
      intervalX = interval;
      break;
    }
  }

  let intervalY = niceIntervals[niceIntervals.length - 1];
  for (const interval of niceIntervals) {
    if (interval >= idealIntervalY) {
      intervalY = interval;
      break;
    }
  }

  return { x: intervalX, y: intervalY };
}

/**
 * 绘制坐标轴
 */
function drawAxes(p) {
  if (!axisState.visible) return;

  const originCanvas = physicsToCanvas(0, 0);
  const margin = canvasWidth * 0.1;

  // 坐标轴颜色和样式
  p.stroke(102); // #666
  p.strokeWeight(2);
  p.fill(102);

  // X 轴（地面线位置）
  const xAxisY = originCanvas.y;
  p.line(0, xAxisY, canvasWidth - margin / 2, xAxisY);

  // X 轴箭头
  const arrowSize = 8;
  p.line(canvasWidth - margin / 2, xAxisY, canvasWidth - margin / 2 - arrowSize, xAxisY - arrowSize / 2);
  p.line(canvasWidth - margin / 2, xAxisY, canvasWidth - margin / 2 - arrowSize, xAxisY + arrowSize / 2);

  // Y 轴（起点位置）
  const yAxisX = originCanvas.x;
  p.line(yAxisX, canvasHeight, yAxisX, margin / 2);

  // Y 轴箭头
  p.line(yAxisX, margin / 2, yAxisX - arrowSize / 2, margin / 2 + arrowSize);
  p.line(yAxisX, margin / 2, yAxisX + arrowSize / 2, margin / 2 + arrowSize);

  // 绘制刻度
  drawTicks(p);

  // 绘制标签
  p.textSize(10);
  p.noStroke();
  p.fill(102);

  // X 轴标签
  p.text('x (m)', canvasWidth - margin / 2 - 30, xAxisY + 20);

  // Y 轴标签
  p.text('y (m)', yAxisX + 10, margin / 2 + 15);

  // 原点标签
  p.text('O', yAxisX - 15, xAxisY + 15);
}

/**
 * 绘制刻度（短线或网格）
 */
function drawTicks(p) {
  const originCanvas = physicsToCanvas(0, 0);
  const interval = calculateTickInterval();
  const tickLength = 5;

  p.textSize(10);
  p.textAlign(p.CENTER, p.TOP);

  // X 轴刻度
  const maxX = keyPoints.landing.x;
  for (let x = interval.x; x <= maxX; x += interval.x) {
    const canvasPos = physicsToCanvas(x, 0);

    if (axisState.gridMode) {
      // 网格线模式
      p.stroke(200, 200, 200, 100); // 浅灰色半透明
      p.strokeWeight(1);
      p.drawingContext.setLineDash([2, 2]);
      p.line(canvasPos.x, 0, canvasPos.x, canvasHeight);
      p.drawingContext.setLineDash([]);
    } else {
      // 短线刻度模式
      p.stroke(102);
      p.strokeWeight(2);
      p.line(canvasPos.x, originCanvas.y - tickLength, canvasPos.x, originCanvas.y + tickLength);
    }

    // 刻度标签
    p.noStroke();
    p.fill(102);
    p.text(x.toFixed(0), canvasPos.x, originCanvas.y + 8);
  }

  // Y 轴刻度
  const maxY = Math.max(params.h, keyPoints.peak.y);
  p.textAlign(p.RIGHT, p.CENTER);

  for (let y = interval.y; y <= maxY; y += interval.y) {
    const canvasPos = physicsToCanvas(0, y);

    if (axisState.gridMode) {
      // 网格线模式
      p.stroke(200, 200, 200, 100);
      p.strokeWeight(1);
      p.drawingContext.setLineDash([2, 2]);
      p.line(0, canvasPos.y, canvasWidth, canvasPos.y);
      p.drawingContext.setLineDash([]);
    } else {
      // 短线刻度模式
      p.stroke(102);
      p.strokeWeight(2);
      p.line(originCanvas.x - tickLength, canvasPos.y, originCanvas.x + tickLength, canvasPos.y);
    }

    // 刻度标签
    p.noStroke();
    p.fill(102);
    p.text(y.toFixed(0), originCanvas.x - 8, canvasPos.y);
  }

  p.textAlign(p.LEFT, p.BASELINE); // 恢复默认对齐
}

/**
 * 绘制关键点坐标标注
 */
function drawKeyPointCoordinates(p) {
  if (!axisState.visible) return;

  p.textSize(10);
  p.noStroke();
  p.fill(0, 102, 68); // #006644

  // 起点坐标（显示在左侧下方，避免与"起点"文字重叠）
  const startCanvas = physicsToCanvas(keyPoints.start.x, keyPoints.start.y);
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`(${keyPoints.start.x.toFixed(1)}, ${keyPoints.start.y.toFixed(1)})`,
         startCanvas.x - 15, startCanvas.y + 8);

  // 最高点坐标（显示在上方，避免与"最高点"文字重叠）
  if (keyPoints.peak.t > 0) {
    const peakCanvas = physicsToCanvas(keyPoints.peak.x, keyPoints.peak.y);
    p.fill(255, 107, 107); // #FF6B6B
    p.textAlign(p.LEFT, p.BASELINE);
    p.text(`(${keyPoints.peak.x.toFixed(1)}, ${keyPoints.peak.y.toFixed(1)})`,
           peakCanvas.x + 15, peakCanvas.y - 15);
  }

  // 落地点坐标
  const landingCanvas = physicsToCanvas(keyPoints.landing.x, keyPoints.landing.y);
  p.fill(78, 205, 196); // #4ECDC4
  p.textAlign(p.LEFT, p.BASELINE);
  p.text(`(${keyPoints.landing.x.toFixed(1)}, ${keyPoints.landing.y.toFixed(1)})`,
         landingCanvas.x + 15, landingCanvas.y + 15);

  // 恢复默认对齐方式
  p.textAlign(p.LEFT, p.BASELINE);
}

/**
 * 绘制轨迹
 */
function drawTrajectory(p) {
  if (animationState.pathPoints.length < 2) return;

  p.noFill();
  for (let i = 0; i < animationState.pathPoints.length - 1; i++) {
    const point = animationState.pathPoints[i];
    const nextPoint = animationState.pathPoints[i + 1];

    const canvasPos = physicsToCanvas(point.x, point.y);
    const nextCanvasPos = physicsToCanvas(nextPoint.x, nextPoint.y);

    // 渐变颜色
    const ratio = i / (animationState.pathPoints.length - 1);
    const r = 0 + (204 - 0) * ratio;
    const g = 102 + (204 - 102) * ratio;
    const b = 68 + (204 - 68) * ratio;

    p.stroke(r, g, b);
    p.strokeWeight(2);
    p.line(canvasPos.x, canvasPos.y, nextCanvasPos.x, nextCanvasPos.y);
  }
}

/**
 * 绘制关键节点
 */
function drawKeyPoints(p) {
  // 起点
  const startCanvas = physicsToCanvas(keyPoints.start.x, keyPoints.start.y);
  p.fill(0, 102, 68); // #006644
  p.noStroke();
  p.circle(startCanvas.x, startCanvas.y, 12);
  p.fill(0, 102, 68);
  p.textSize(12);
  p.textAlign(p.RIGHT, p.BASELINE);
  p.text('起点', startCanvas.x - 10, startCanvas.y - 5);
  p.textAlign(p.LEFT, p.BASELINE); // 恢复默认对齐

  // 最高点
  if (keyPoints.peak.t > 0) {
    const peakCanvas = physicsToCanvas(keyPoints.peak.x, keyPoints.peak.y);
    p.fill(255, 107, 107); // #FF6B6B
    p.circle(peakCanvas.x, peakCanvas.y, 12);
    p.fill(255, 107, 107);
    p.text('最高点', peakCanvas.x + 10, peakCanvas.y);
  }

  // 落地点
  const landingCanvas = physicsToCanvas(keyPoints.landing.x, keyPoints.landing.y);
  p.fill(78, 205, 196); // #4ECDC4
  p.circle(landingCanvas.x, landingCanvas.y, 12);
  p.fill(78, 205, 196);
  p.text('落地', landingCanvas.x + 10, landingCanvas.y);
}

/**
 * p5.js sketch
 */
const sketch = (p) => {
  p.setup = () => {
    const container = canvasMountRef.value;
    canvasWidth = container.clientWidth;
    canvasHeight = container.clientHeight;
    p.createCanvas(canvasWidth, canvasHeight);
    p.frameRate(60);

    // 初始化关键点
    recalculateKeyPoints();

    // 动态计算缩放比例（确保所有关键点都在画布内）
    updateScale();
  };

  p.draw = () => {
    p.background(245); // #F5F5F5

    // 更新动画时间
    if (animationState.isPlaying) {
      const dt = (1 / 60) * params.timeScale;
      animationState.currentTime += dt;

      const pos = getCurrentPosition();

      // 检查是否落地
      if (pos.y <= 0) {
        animationState.isPlaying = false;
        animationState.currentTime = keyPoints.landing.t;
      }

      // 记录轨迹点
      const sampleInterval = getSampleInterval();
      if (animationState.pathPoints.length === 0 ||
          animationState.currentTime - animationState.pathPoints[animationState.pathPoints.length - 1].t >= sampleInterval) {
        animationState.pathPoints.push({
          x: pos.x,
          y: pos.y,
          t: animationState.currentTime
        });

        // 限制轨迹点数量
        if (animationState.pathPoints.length > 1000) {
          animationState.pathPoints.shift();
        }
      }
    }

    // 绘制
    drawAxes(p);
    drawGuides(p);
    drawTrajectory(p);
    drawKeyPoints(p);
    drawKeyPointCoordinates(p);
    drawKeyPointHighlight(p);
    drawTrajectoryHighlight(p);
    drawObject(p);
  };

  p.windowResized = () => {
    const container = canvasMountRef.value;
    canvasWidth = container.clientWidth;
    canvasHeight = container.clientHeight;
    p.resizeCanvas(canvasWidth, canvasHeight);
    updateScale();
  };

  p.mousePressed = () => {
    // 检查鼠标是否在画布内
    if (p.mouseX < 0 || p.mouseX > canvasWidth || p.mouseY < 0 || p.mouseY > canvasHeight) {
      return;
    }

    const pos = getCurrentPosition();
    const canvasPos = physicsToCanvas(pos.x, pos.y);
    const dist = p.dist(p.mouseX, p.mouseY, canvasPos.x, canvasPos.y);

    if (dist < 20) {
      animationState.isDragging = true;
      animationState.dragTarget = 'object';
      if (animationState.isPlaying) {
        animationState.isPlaying = false;
      }
      return;
    }

    // 点击空白区域：播放/暂停
    togglePlayPause();
  };

  p.mouseDragged = () => {
    if (animationState.isDragging && animationState.dragTarget === 'object') {
      const physicsPos = canvasToPhysics(p.mouseX, p.mouseY);
      params.h = Math.max(10, Math.min(200, physicsPos.y));
      recalculateKeyPoints();
    }
  };

  p.mouseReleased = () => {
    if (animationState.isDragging) {
      animationState.isDragging = false;
      animationState.dragTarget = null;
      return;
    }
  };

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
};

/**
 * 切换播放/暂停
 */
function togglePlayPause() {
  animationState.isPlaying = !animationState.isPlaying;
}

/**
 * 重置动画
 */
function resetAnimation() {
  animationState.isPlaying = false;
  animationState.currentTime = 0;
  animationState.pathPoints = [];
  params.v0 = 10;
  params.g = 9.8;
  params.h = 50;
  params.theta = 0;
  params.timeScale = 1;
  recalculateKeyPoints();
}

/**
 * 设置倍速
 */
function setTimeScale(speed) {
  params.timeScale = speed;
}

/**
 * 单步前进
 */
function stepForward() {
  if (!animationState.isPlaying) {
    animationState.currentTime += 0.1;
    const pos = getCurrentPosition();
    if (pos.y > 0) {
      animationState.pathPoints.push({
        x: pos.x,
        y: pos.y,
        t: animationState.currentTime
      });
    }
  }
}

/**
 * 切换坐标轴显示/隐藏
 */
function toggleAxis() {
  axisState.visible = !axisState.visible;
}

/**
 * 切换刻度模式（短线/网格）
 */
function toggleGridMode() {
  axisState.gridMode = !axisState.gridMode;
}

/**
 * 更新公式显示
 */
const formulaContent = computed(() => {
  const pos = getCurrentPosition();
  const vel = calculateVelocity(params.v0, params.g, params.theta, animationState.currentTime);

  return `
    <div class="formula-section">
      <h3>核心公式</h3>
      <div class="formula-block">
        $$x = v_0 \\cdot t \\cdot \\cos(${params.theta}°)$$
      </div>
      <div class="formula-block">
        $$y = ${params.h} + v_0 \\cdot t \\cdot \\sin(${params.theta}°) - \\frac{1}{2} \\cdot ${params.g} \\cdot t^2$$
      </div>
      <div class="formula-block">
        $$v_x = v_0 \\cdot \\cos(${params.theta}°), \\quad v_y = v_0 \\cdot \\sin(${params.theta}°) - ${params.g} \\cdot t$$
      </div>
    </div>

    <div class="result-section">
      <h3>实时结果</h3>
      <p><strong>当前时间：</strong>${animationState.currentTime.toFixed(2)} s</p>
      <p><strong>水平位移：</strong>${pos.x.toFixed(2)} m</p>
      <p><strong>竖直位移：</strong>${pos.y.toFixed(2)} m</p>
      <p><strong>合速度：</strong>${vel.v.toFixed(2)} m/s</p>
      <p><strong>落地时间：</strong>${keyPoints.landing.t.toFixed(2)} s</p>
      <p><strong>落地位置：</strong>${keyPoints.landing.x.toFixed(2)} m</p>
    </div>
  `;
});

// 监听公式内容变化
watch(formulaContent, () => {
  nextTick(() => {
    if (formulaDisplayRef.value) {
      formulaDisplayRef.value.innerHTML = formulaContent.value;
      renderMathInElement(formulaDisplayRef.value);
    }
  });
}, { immediate: true });

// 监听参数变化
watch(() => [params.v0, params.g, params.h, params.theta], () => {
  if (animationState.isPlaying) {
    animationState.isPlaying = false;
    animationState.currentTime = 0;
    animationState.pathPoints = [];
  }
  recalculateKeyPoints();
  updateProjectileParams(params);

  // 清除吸附状态（避免显示过期数据）
  clearAdsorptionState();
}, { deep: true });

// 生命周期
onMounted(() => {
  const mountPoint = canvasMountRef.value;
  if (mountPoint.querySelector('canvas')) {
    mountPoint.innerHTML = '';
  }
  p5Instance = new p5(sketch, mountPoint);
});

onUnmounted(() => {
  // 清除 tooltip 定时器
  if (tooltip.fadeOutTimer) {
    clearTimeout(tooltip.fadeOutTimer);
    tooltip.fadeOutTimer = null;
  }

  // 清理 p5 实例
  if (p5Instance) {
    p5Instance.remove();
    p5Instance = null;
  }
});
</script>

<style scoped>
.projectile-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.params-control {
  padding: 16px;
  background: #fff;
  border-bottom: 1px solid #e0e0e0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  flex-shrink: 0;
  position: relative;
  z-index: 10;
}

.param-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.param-item label {
  font-size: 14px;
  color: #333;
}

.param-item input[type="range"] {
  width: 100%;
  accent-color: #006644;
}

.param-input {
  width: 80px;
  padding: 4px 8px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 14px;
}

.param-input:focus {
  outline: none;
  border-color: #006644;
}

.readonly-value {
  font-size: 14px;
  color: #666;
}

#projectile-canvas-mount {
  flex: 1;
  position: relative;
  min-height: 300px;
  z-index: 1;
}

#projectile-canvas-mount canvas {
  position: absolute;
  top: 0;
  left: 0;
}

.animation-controls {
  padding: 12px 16px;
  background: #fff;
  border-top: 1px solid #e0e0e0;
  display: flex;
  gap: 8px;
  align-items: center;
  flex-shrink: 0;
  position: relative;
  z-index: 10;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary {
  background: #006644;
  color: #fff;
}

.btn-primary:hover {
  background: #008055;
}

.btn-primary:active {
  background: #004d33;
}

.btn-secondary {
  background: #f5f5f5;
  color: #333;
}

.btn-secondary:hover {
  background: #e8e8e8;
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.speed-controls {
  display: flex;
  gap: 4px;
  margin-left: auto;
}

.btn-speed {
  padding: 6px 12px;
  background: #f5f5f5;
  color: #333;
  font-size: 12px;
}

.btn-speed.active {
  background: #006644;
  color: #fff;
}

.axis-controls {
  display: flex;
  gap: 4px;
  margin-left: 8px;
}

.btn-secondary.active {
  background: #006644;
  color: #fff;
}

.formula-display {
  padding: 16px;
  background: #fff;
  border-top: 1px solid #e0e0e0;
  max-height: 180px;
  min-height: 120px;
  overflow-y: auto;
  display: flex;
  gap: 24px;
  flex-shrink: 0;
  position: relative;
  z-index: 10;
}

.formula-section, .result-section {
  flex: 1;
}

.formula-section h3, .result-section h3 {
  font-size: 16px;
  color: #006644;
  font-weight: bold;
  margin-bottom: 8px;
}

.formula-block {
  text-align: center;
  margin: 8px 0;
  font-size: 18px;
}

.result-section p {
  font-size: 14px;
  margin: 4px 0;
}

.result-section strong {
  color: #006644;
}

/* Tooltip 样式 */
.tooltip {
  position: fixed;
  background: rgba(245, 245, 245, 0.9);
  color: #333;
  font-size: 14px;
  padding: 12px;
  border-radius: 4px;
  z-index: 100;
  pointer-events: none;
  max-width: 300px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: opacity 0.2s;
}

.tooltip-content {
  line-height: 1.6;
}

.tooltip-title {
  font-size: 16px;
  font-weight: bold;
  color: #006644;
  margin-bottom: 8px;
}

.tooltip-item {
  font-size: 14px;
  margin: 4px 0;
}

.tooltip-item strong {
  color: #006644;
  font-weight: bold;
}

.tooltip-formula {
  margin-top: 8px;
  color: #006644;
  text-align: center;
}

.tooltip-formula strong {
  color: #006644;
}
</style>
