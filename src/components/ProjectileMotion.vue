<template>
  <div class="projectile-container">
    <!-- 参数控制区 -->
    <div class="params-control" :style="{ height: layoutState.paramsHeight + 'px' }" @mousedown.stop @click.stop>
      <div class="param-item">
        <div class="param-label-row">
          <label>初速度 v₀ (m/s): {{ params.v0 }}</label>
        </div>
        <div class="param-controls-row">
          <input type="range" v-model.number="params.v0" min="1" max="50" step="0.1" />
          <input type="number" v-model.number="params.v0" min="1" max="50" step="0.1" class="param-input" />
        </div>
      </div>

      <div class="param-item">
        <div class="param-label-row">
          <label>重力加速度 g (m/s²): {{ params.g }}</label>
        </div>
        <div class="param-controls-row">
          <input type="range" v-model.number="params.g" min="1" max="20" step="0.1" />
          <input type="number" v-model.number="params.g" min="1" max="20" step="0.1" class="param-input" />
        </div>
      </div>

      <div class="param-item">
        <div class="param-label-row">
          <label>初始高度 h (m): {{ params.h }}</label>
        </div>
        <div class="param-controls-row">
          <input type="range" v-model.number="params.h" min="10" max="200" step="1" />
          <input type="number" v-model.number="params.h" min="10" max="200" step="1" class="param-input" />
        </div>
      </div>

      <div class="param-item">
        <div class="param-label-row">
          <label>发射角度 θ (°): {{ params.theta }}</label>
        </div>
        <div class="param-controls-row">
          <input type="range" v-model.number="params.theta" min="0" max="90" step="1" />
          <input type="number" v-model.number="params.theta" min="0" max="90" step="1" class="param-input" />
        </div>
      </div>

      <div class="param-item">
        <div class="param-label-row">
          <label>质量 m (kg): {{ params.mass }}</label>
        </div>
        <div class="param-controls-row">
          <input type="range" v-model.number="params.mass" min="0.1" max="100" step="0.1" />
          <input type="number" v-model.number="params.mass" min="0.1" max="100" step="0.1" class="param-input" />
        </div>
      </div>

      <div class="param-item" v-if="environmentState.mode === 'custom'">
        <div class="param-label-row">
          <label>空气阻力系数 k: {{ environmentState.dragCoefficient.toFixed(2) }}</label>
          <label class="checkbox-label">
            <input
              type="checkbox"
              :checked="environmentState.airResistanceEnabled"
              @change="toggleAirResistance"
            />
            <span>启用空气阻力</span>
          </label>
        </div>
        <div class="param-controls-row">
          <input
            type="range"
            :value="environmentState.dragCoefficient"
            @change="updateDragCoefficient(parseFloat($event.target.value))"
            @input="environmentState.dragCoefficient = parseFloat($event.target.value)"
            min="0.0"
            max="1.0"
            step="0.01"
          />
          <input
            type="number"
            :value="environmentState.dragCoefficient"
            @change="updateDragCoefficient(parseFloat($event.target.value))"
            min="0.0"
            max="1.0"
            step="0.01"
            class="param-input"
          />
        </div>
      </div>

      <div class="param-item" v-if="stroboscopicState.enabled">
        <div class="param-label-row">
          <label>频闪间隔: {{ stroboscopicState.interval }} 帧</label>
          <label class="checkbox-label">
            <input
              type="checkbox"
              :checked="stroboscopicState.showLabels"
              @change="toggleStroboscopicLabels"
            />
            <span>显示时间标签</span>
          </label>
        </div>
        <div class="param-controls-row">
          <input
            type="range"
            :value="stroboscopicState.interval"
            @input="stroboscopicState.interval = parseInt($event.target.value)"
            @change="updateStroboscopicInterval(parseInt($event.target.value))"
            min="1"
            max="60"
            step="1"
          />
        </div>
      </div>
    </div>

    <!-- 拖拽分隔条：参数控制 ↔ 画布 -->
    <div
      class="resizer"
      :class="{ active: layoutState.dragTarget === 'params' }"
      @mousedown="handleDragStart('params', $event)"
    ></div>

    <!-- 画布挂载点 -->
    <div id="projectile-canvas-mount" ref="canvasMountRef">
      <!-- 左上角快捷键提示（未缩放且未平移时显示） -->
      <div
        v-if="Math.abs(viewState.zoomLevel - 1.0) < 0.01 && viewState.scrollX === 0 && viewState.scrollY === 0"
        class="shortcut-hint"
        @mousedown.stop
      >
        Ctrl + 滚轮：缩放 &nbsp;|&nbsp; Ctrl + 拖拽：平移
      </div>

      <!-- 右上角提示（缩放或平移时显示） -->
      <button
        v-if="Math.abs(viewState.zoomLevel - 1.0) >= 0.01 || viewState.scrollX !== 0 || viewState.scrollY !== 0"
        @click.stop="resetZoom"
        @mousedown.stop
        class="reset-zoom-btn"
        title="点击还原缩放 (Ctrl+0)"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="9"/>
          <path v-if="viewState.zoomLevel > 1.0" d="M12 7v5M12 12h5"/>
          <path v-else d="M12 12h5M9.5 9.5l3.5 3.5"/>
        </svg>
        {{ formatZoomLevel(viewState.zoomLevel) }}
      </button>
    </div>

    <!-- 拖拽分隔条：画布 ↔ 底部面板 -->
    <div
      class="resizer"
      :class="{ active: layoutState.dragTarget === 'bottom' }"
      @mousedown="handleDragStart('bottom', $event)"
    ></div>

    <!-- 底部面板容器 -->
    <div class="bottom-panel" :style="{ height: layoutState.bottomPanelHeight + 'px' }">
      <!-- 动画控制区 -->
      <div class="animation-controls" :style="{ height: layoutState.animationHeight + 'px' }" @mousedown.stop @click.stop>
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
        <button
          @click="toggleVectors"
          :class="['btn', 'btn-secondary', { active: vectorState.show }]"
        >
          {{ vectorState.show ? '隐藏矢量' : '显示矢量' }}
        </button>
        <button
          @click="toggleAutoScale"
          :class="['btn', 'btn-secondary', { active: autoScaleState.enabled }]"
        >
          {{ autoScaleState.enabled ? '手动缩放' : '自动缩放' }}
        </button>
        <button
          @click="toggleStroboscopic"
          :class="['btn', 'btn-secondary', { active: stroboscopicState.enabled }]"
        >
          {{ stroboscopicState.enabled ? '隐藏频闪' : '频闪' }}
        </button>
      </div>

      <!-- 轨迹管理控制 -->
      <div class="trajectory-controls">
        <div class="trajectory-count">
          已保存: {{ trajectoryHistory.tracks.length }}/{{ trajectoryHistory.maxTracks }}
        </div>
        <button
          @click="saveTrajectory"
          :disabled="trajectoryHistory.tracks.length >= trajectoryHistory.maxTracks"
          :class="['btn', 'btn-primary', 'btn-save']"
          title="保存当前轨迹用于对比"
        >
          保存轨迹
        </button>
        <button
          @click="clearTrajectoryHistory"
          :disabled="trajectoryHistory.tracks.length === 0"
          :class="['btn', 'btn-secondary']"
          title="清除所有已保存的轨迹"
        >
          清除历史
        </button>
      </div>

      <!-- 环境控制 -->
      <div class="environment-controls">
        <div class="environment-selector">
          <label>环境:</label>
          <select
            :value="environmentState.mode"
            @change="setEnvironmentMode($event.target.value)"
            class="env-select"
          >
            <option value="earth">🌍 地球</option>
            <option value="moon">🌙 月球</option>
            <option value="mars">🔴 火星</option>
            <option value="custom">⚙️ 自定义</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 拖拽分隔条：动画控制 ↔ 公式显示 -->
    <div
      class="resizer"
      :class="{ active: layoutState.dragTarget === 'animation' }"
      @mousedown="handleDragStart('animation', $event)"
    ></div>

    <!-- 底部三栏面板 -->
    <div class="bottom-panel-columns" @mousedown.stop @click.stop>
      <!-- 左栏：核心公式 -->
      <div
        v-if="layoutState.columnLayout.leftVisible"
        class="panel-column left-column"
        :style="{ width: layoutState.columnLayout.leftWidth + '%' }"
      >
        <div class="column-header">
          <h4>核心公式</h4>
          <button @click="toggleColumn('left')" class="column-close-btn">×</button>
        </div>
        <div class="formula-section" ref="formulaDisplayRef">
          <!-- Formulas will be rendered here by JavaScript -->
        </div>
      </div>

      <!-- 左中栏之间的拖拽分隔条 -->
      <div
        v-if="layoutState.columnLayout.leftVisible && layoutState.columnLayout.centerVisible"
        class="column-resizer"
        :class="{ active: layoutState.columnDragTarget === 'left-center' }"
        @mousedown.stop="handleColumnDragStart('left-center', $event)"
      ></div>

      <!-- 中栏：实时结果数据 -->
      <div
        v-if="layoutState.columnLayout.centerVisible"
        class="panel-column center-column"
        :style="{ width: layoutState.columnLayout.centerWidth + '%' }"
      >
        <div class="column-header">
          <h4>实时结果</h4>
          <button @click="toggleColumn('center')" class="column-close-btn">×</button>
        </div>
        <div class="results-section">
          <div class="result-item">
            <span class="result-label">时间</span>
            <span class="result-value">{{ animationState.currentTime.toFixed(2) }} s</span>
          </div>
          <div class="result-item">
            <span class="result-label">位置</span>
            <span class="result-value">({{ currentPosition.x.toFixed(1) }}, {{ currentPosition.y.toFixed(1) }}) m</span>
          </div>
          <div class="result-item" v-if="environmentState.airResistanceEnabled">
            <span class="result-label">水平位移 Δx</span>
            <span class="result-value">{{ currentDisplacement.dx.toFixed(2) }} m</span>
          </div>
          <div class="result-item" v-if="environmentState.airResistanceEnabled">
            <span class="result-label">竖直位移 Δy</span>
            <span class="result-value">{{ currentDisplacement.dy.toFixed(2) }} m</span>
          </div>
          <div class="result-item" v-if="environmentState.airResistanceEnabled">
            <span class="result-label">合位移 |Δr|</span>
            <span class="result-value">{{ currentDisplacement.d.toFixed(2) }} m</span>
          </div>
          <div class="result-item">
            <span class="result-label">速度</span>
            <span class="result-value">{{ currentVelocity.toFixed(2) }} m/s</span>
          </div>
          <div class="result-item">
            <span class="result-label">动能 (Ek)</span>
            <span class="result-value">{{ currentKineticEnergy.toFixed(2) }} J</span>
          </div>
          <div class="result-item">
            <span class="result-label">势能 (Ep)</span>
            <span class="result-value">{{ currentPotentialEnergy.toFixed(2) }} J</span>
          </div>
          <div class="result-item">
            <span class="result-label">机械能 (E)</span>
            <span class="result-value">{{ currentTotalEnergy.toFixed(2) }} J</span>
          </div>
          <div class="result-item" v-if="autoScaleState.enabled">
            <span class="result-label">缩放</span>
            <span class="result-value">{{ displayScale.x.toFixed(1) }} px/m</span>
          </div>
        </div>
      </div>

      <!-- 中右栏之间的拖拽分隔条 -->
      <div
        v-if="layoutState.columnLayout.centerVisible && layoutState.columnLayout.rightVisible"
        class="column-resizer"
        :class="{ active: layoutState.columnDragTarget === 'center-right' }"
        @mousedown.stop="handleColumnDragStart('center-right', $event)"
      ></div>

      <!-- 右栏：可视化仪表 -->
      <div
        v-if="layoutState.columnLayout.rightVisible"
        class="panel-column right-column"
        :style="{ width: layoutState.columnLayout.rightWidth + '%' }"
      >
        <div class="column-header">
          <h4>可视化</h4>
          <button @click="toggleColumn('right')" class="column-close-btn">×</button>
        </div>
        <div class="visualization-section">
          <!-- Energy Gauge -->
          <div class="gauge-card gauge-card--full">
            <EnergyGauge
              :kinetic-energy="currentKineticEnergy"
              :potential-energy="currentPotentialEnergy"
              :total-energy="currentTotalEnergy"
              :max-energy="maxEnergy"
              :is-conserved="!hasDragEnabled"
              :is-drag-enabled="hasDragEnabled"
              :lost-energy="lostEnergy"
            />
          </div>
        </div>
      </div>
    </div>
    </div>

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
  calculateEnergy,
  calculateTrajectoryWithDrag,
  validateParams
} from '../utils/physic';
import EnergyGauge from './ui/EnergyGauge.vue';

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
  isHovering: false,
  cachedTrajectory: null  // 带空气阻力的预计算轨迹
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

// 矢量显示状态
const vectorState = reactive({
  show: false,               // 是否显示矢量分解
  scale: 3.0                 // 矢量显示缩放系数（像素/米）
});

// 轨迹历史状态
const trajectoryHistory = reactive({
  tracks: [],                // 已保存的轨迹数组
  maxTracks: 20,             // 最大保存数量
  colorPalette: [            // 预定义颜色调色板
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788',
    '#E59866', '#AED6F1', '#F9E79F', '#D2B4DE', '#85C1E2'
  ],
  nextColorIndex: 0          // 下一个使用的颜色索引
});

// 环境模拟状态
const environmentState = reactive({
  mode: 'earth',             // 环境模式: 'earth', 'moon', 'mars', 'custom'
  airResistanceEnabled: false, // 是否启用空气阻力
  dragCoefficient: 0.1,      // 阻力系数 (0.0 - 1.0)

  // 环境预设配置
  presets: {
    earth: {
      name: '地球',
      gravity: 9.8,
      hasDrag: false,
      backgroundColor: '#E6F3FF', // 浅蓝色
      description: '标准重力 (9.8 m/s²)'
    },
    moon: {
      name: '月球',
      gravity: 1.6,
      hasDrag: false,
      backgroundColor: '#E0E0E0', // 浅灰色
      description: '月球重力 (1.6 m/s², 约地球1/6)'
    },
    mars: {
      name: '火星',
      gravity: 3.7,
      hasDrag: false,
      backgroundColor: '#FFE6D6', // 浅红橙色
      description: '火星重力 (3.7 m/s², 约地球38%)'
    },
    custom: {
      name: '自定义',
      gravity: 9.8,
      hasDrag: true,
      backgroundColor: '#F5F5F5', // 默认灰色
      description: '自定义参数'
    }
  },

  // 当前背景颜色（用于平滑过渡）
  currentBackgroundColor: '#E6F3FF'
});

// 频闪照片状态
const stroboscopicState = reactive({
  enabled: false,            // 是否启用频闪标记
  interval: 10,              // 间隔帧数（1-60帧）
  showLabels: true,          // 是否显示时间标签
  maxMarkers: 200,           // 最大标记数量
  markers: []                // 标记数组 {x, y, t, canvasX, canvasY}
});

// 可拖拽布局状态
const layoutState = reactive({
  paramsHeight: 120,         // 参数控制区域高度
  bottomPanelHeight: 180,    // 底部面板总高度
  animationHeight: 50,       // 动画控制区域高度
  isDragging: false,         // 是否正在拖拽
  dragTarget: null,          // 当前拖拽目标（高度调整）
  columnDragTarget: null,    // 当前列拖拽目标（宽度调整）
  updateScheduled: false,    // 更新调度标志
  dragStartX: 0,            // 列拖拽起始X坐标
  dragStartWidths: {},       // 列拖拽起始宽度

  // 三栏布局状态
  columnLayout: {
    leftVisible: true,       // 左侧公式栏可见性
    centerVisible: true,     // 中间结果栏可见性
    rightVisible: true,      // 右侧可视化栏可见性
    leftWidth: 33,           // 左侧宽度百分比
    centerWidth: 34,         // 中间宽度百分比
    rightWidth: 33           // 右侧宽度百分比
  }
});

// 手动缩放状态（使用 ref 以便 Vue 响应式更新）
const zoomLevel = ref(1.0);
const scrollX = ref(0);
const scrollY = ref(0);

// 缩放限制常量
const ZOOM_LIMITS = {
  min: 0.5,
  max: 5.0
};

// 尺寸限制
const SIZE_LIMITS = {
  paramsMin: 100,
  paramsMax: 300,
  bottomMin: 120,
  bottomMax: 400,
  animationMin: 50,
  animationMax: 150
};

// 从 localStorage 加载布局
const loadLayout = () => {
  try {
    const saved = localStorage.getItem('projectile-layout');
    if (saved) {
      const layout = JSON.parse(saved);
      layoutState.paramsHeight = Math.max(SIZE_LIMITS.paramsMin, Math.min(SIZE_LIMITS.paramsMax, layout.paramsHeight || 120));
      layoutState.bottomPanelHeight = Math.max(SIZE_LIMITS.bottomMin, Math.min(SIZE_LIMITS.bottomMax, layout.bottomPanelHeight || 160));
      layoutState.animationHeight = Math.max(SIZE_LIMITS.animationMin, Math.min(SIZE_LIMITS.animationMax, layout.animationHeight || 50));
      console.log('Layout loaded from localStorage:', layout);
    } else {
      console.log('No saved layout found, using defaults');
    }
  } catch (e) {
    console.warn('Failed to load layout:', e);
  }
};

// 保存布局到 localStorage
const saveLayout = () => {
  try {
    localStorage.setItem('projectile-layout', JSON.stringify({
      paramsHeight: layoutState.paramsHeight,
      bottomPanelHeight: layoutState.bottomPanelHeight,
      animationHeight: layoutState.animationHeight
    }));
  } catch (e) {
    console.warn('Failed to save layout:', e);
  }
};

// 拖拽开始
const handleDragStart = (target, event) => {
  event.preventDefault();
  event.stopPropagation();
  layoutState.isDragging = true;
  layoutState.dragTarget = target;
  document.body.style.cursor = 'ns-resize';
  document.body.style.userSelect = 'none';
  console.log('Drag started:', target, 'Current heights:', {
    params: layoutState.paramsHeight,
    bottom: layoutState.bottomPanelHeight,
    animation: layoutState.animationHeight
  });
};

// 列拖拽开始
const handleColumnDragStart = (target, event) => {
  event.preventDefault();
  event.stopPropagation();
  layoutState.isDragging = true;
  layoutState.columnDragTarget = target;
  layoutState.dragStartX = event.clientX;

  // 保存当前宽度
  layoutState.dragStartWidths = {
    left: layoutState.columnLayout.leftWidth,
    center: layoutState.columnLayout.centerWidth,
    right: layoutState.columnLayout.rightWidth
  };

  document.body.style.cursor = 'ew-resize';
  document.body.style.userSelect = 'none';
  console.log('Column drag started:', target, 'Current widths:', layoutState.dragStartWidths);
};

// 拖拽移动
const handleDragMove = (event) => {
  if (!layoutState.isDragging) return;

  const deltaY = event.movementY;
  let hasChanged = false;

  // 高度拖拽（原有逻辑）
  if (layoutState.dragTarget === 'params') {
    // 调整参数控制区域高度
    const oldHeight = layoutState.paramsHeight;
    const newHeight = oldHeight + deltaY;
    layoutState.paramsHeight = Math.max(SIZE_LIMITS.paramsMin, Math.min(SIZE_LIMITS.paramsMax, newHeight));
    hasChanged = layoutState.paramsHeight !== oldHeight;
  } else if (layoutState.dragTarget === 'bottom') {
    // 调整底部面板高度（反向，向下拖拽增加高度）
    const oldHeight = layoutState.bottomPanelHeight;
    const newHeight = oldHeight - deltaY;
    layoutState.bottomPanelHeight = Math.max(SIZE_LIMITS.bottomMin, Math.min(SIZE_LIMITS.bottomMax, newHeight));
    hasChanged = layoutState.bottomPanelHeight !== oldHeight;
  } else if (layoutState.dragTarget === 'animation') {
    // 调整动画控制区域高度
    const oldHeight = layoutState.animationHeight;
    const newHeight = oldHeight + deltaY;
    layoutState.animationHeight = Math.max(SIZE_LIMITS.animationMin, Math.min(SIZE_LIMITS.animationMax, newHeight));
    hasChanged = layoutState.animationHeight !== oldHeight;
  }

  // 列宽拖拽（新逻辑）
  if (layoutState.columnDragTarget) {
    const containerWidth = document.querySelector('.bottom-panel-columns')?.offsetWidth || 900;
    const deltaPercent = ((event.clientX - layoutState.dragStartX) / containerWidth) * 100;

    if (layoutState.columnDragTarget === 'left-center') {
      // 调整左栏和中栏的宽度
      const newLeftWidth = layoutState.dragStartWidths.left + deltaPercent;
      const newCenterWidth = layoutState.dragStartWidths.center - deltaPercent;

      // 限制最小宽度（15%）和最大宽度（70%）
      if (newLeftWidth >= 15 && newLeftWidth <= 70 && newCenterWidth >= 15 && newCenterWidth <= 70) {
        layoutState.columnLayout.leftWidth = newLeftWidth;
        layoutState.columnLayout.centerWidth = newCenterWidth;
        hasChanged = true;
      }
    } else if (layoutState.columnDragTarget === 'center-right') {
      // 调整中栏和右栏的宽度
      const newCenterWidth = layoutState.dragStartWidths.center + deltaPercent;
      const newRightWidth = layoutState.dragStartWidths.right - deltaPercent;

      // 限制最小宽度（15%）和最大宽度（70%）
      if (newCenterWidth >= 15 && newCenterWidth <= 70 && newRightWidth >= 15 && newRightWidth <= 70) {
        layoutState.columnLayout.centerWidth = newCenterWidth;
        layoutState.columnLayout.rightWidth = newRightWidth;
        hasChanged = true;
      }
    }
  }

  if (hasChanged && (Math.abs(deltaY) > 0 || layoutState.columnDragTarget)) {
    // 限制更新频率以提高性能
    if (!layoutState.updateScheduled) {
      layoutState.updateScheduled = true;
      requestAnimationFrame(() => {
        layoutState.updateScheduled = false;
        // 强制触发响应式更新
        layoutState.paramsHeight = layoutState.paramsHeight;
        layoutState.bottomPanelHeight = layoutState.bottomPanelHeight;
        layoutState.animationHeight = layoutState.animationHeight;
      });
    }
  }
};

// 拖拽结束
const handleDragEnd = () => {
  if (layoutState.isDragging) {
    if (layoutState.dragTarget) {
      console.log('Drag ended:', layoutState.dragTarget, 'Final heights:', {
        params: layoutState.paramsHeight,
        bottom: layoutState.bottomPanelHeight,
        animation: layoutState.animationHeight
      });
    }
    if (layoutState.columnDragTarget) {
      console.log('Column drag ended:', layoutState.columnDragTarget, 'Final widths:', {
        left: layoutState.columnLayout.leftWidth,
        center: layoutState.columnLayout.centerWidth,
        right: layoutState.columnLayout.rightWidth
      });
    }

    layoutState.isDragging = false;
    layoutState.dragTarget = null;
    layoutState.columnDragTarget = null;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    saveLayout();
  }
};

// 监听拖拽事件
onMounted(() => {
  loadLayout();
  document.addEventListener('mousemove', handleDragMove);
  document.addEventListener('mouseup', handleDragEnd);
});

onUnmounted(() => {
  document.removeEventListener('mousemove', handleDragMove);
  document.removeEventListener('mouseup', handleDragEnd);
});

// Refs
const canvasMountRef = ref(null);
const formulaDisplayRef = ref(null);
let p5Instance = null;
let canvasWidth = 0;
let canvasHeight = 0;
let scaleX = 1;
let scaleY = 1;
let resizeObserver = null; // 用于监听容器尺寸变化

// 响应式的缩放显示值（用于UI显示）
const displayScale = ref({ x: 1, y: 1 });

// 手动缩放和滚动状态
const viewState = reactive({
  zoomLevel: 1.0,          // 手动缩放级别（响应式）
  scrollX: 0,               // 水平滚动偏移
  scrollY: 0,               // 垂直滚动偏移
  minZoom: 0.5,             // 最小缩放级别
  maxZoom: 5.0              // 最大缩放级别
});

// 自动缩放状态
const autoScaleState = reactive({
  enabled: false,           // 是否启用自动缩放
  lerpFactor: 0.08,         // 插值因子（0.05-0.1，越大越快）
  marginFactor: 0.15,       // 边距因子（15%留白）
  currentMaxX: 50,          // 当前追踪的最大X值
  currentMaxY: 50,          // 当前追踪的最大Y值
  targetMaxX: 50,           // 目标最大X值
  targetMaxY: 50,           // 目标最大Y值
  currentScaleX: 1,         // 当前缩放X（用于平滑过渡）
  currentScaleY: 1          // 当前缩放Y（用于平滑过渡）
});

/**
 * 线性插值函数
 */
function lerp(start, end, amt) {
  return (1 - amt) * start + amt * end;
}

/**
 * 更新自动缩放追踪的最大值
 */
function updateAutoScaleBounds(pos) {
  if (!autoScaleState.enabled) return;

  // 更新追踪的最大值
  autoScaleState.currentMaxX = Math.max(autoScaleState.currentMaxX, pos.x);
  autoScaleState.currentMaxY = Math.max(autoScaleState.currentMaxY, pos.y);

  // 考虑所有保存的轨迹
  for (const track of trajectoryHistory.tracks) {
    for (const point of track.points) {
      autoScaleState.currentMaxX = Math.max(autoScaleState.currentMaxX, point.x);
      autoScaleState.currentMaxY = Math.max(autoScaleState.currentMaxY, point.y);
    }
  }
}

/**
 * 重置自动缩放追踪的边界
 */
function resetAutoScaleBounds() {
  const landingX = keyPoints.landing?.x || 50;
  const peakY = keyPoints.peak?.y || params.h || 50;

  autoScaleState.currentMaxX = Math.max(landingX, 50);
  autoScaleState.currentMaxY = Math.max(params.h, peakY, 50);
  autoScaleState.targetMaxX = autoScaleState.currentMaxX;
  autoScaleState.targetMaxY = autoScaleState.currentMaxY;

  // 同时初始化缩放值为当前的合理值
  const horizontalMargin = autoScaleState.marginFactor;
  const verticalMargin = autoScaleState.marginFactor;
  const availableWidth = canvasWidth * (1 - 2 * horizontalMargin);
  const availableHeight = canvasHeight * (1 - 2 * verticalMargin);
  const baseScaleX = availableWidth / autoScaleState.currentMaxX;
  const baseScaleY = availableHeight / autoScaleState.currentMaxY;

  // 如果启用自动缩放，直接设置为目标值
  if (autoScaleState.enabled) {
    autoScaleState.currentScaleX = baseScaleX;
    autoScaleState.currentScaleY = baseScaleY;
  }
}

/**
 * 更新缩放比例，x轴和y轴分开计算
 */
function updateScale() {
  console.log('updateScale called:', { canvasWidth, canvasHeight, autoScaleEnabled: autoScaleState.enabled });

  // 确保画布尺寸有效
  if (!canvasWidth || !canvasHeight || canvasWidth <= 0 || canvasHeight <= 0) {
    console.warn('updateScale: Invalid canvas size, returning early');
    return;
  }

  const horizontalMargin = autoScaleState.enabled ? autoScaleState.marginFactor : 0.10;
  const verticalMargin = autoScaleState.enabled ? autoScaleState.marginFactor : 0.10;

  // 找出最大高度和最大水平距离
  let maxHeight, maxDistance;

  if (autoScaleState.enabled) {
    // 使用实时追踪的最大值
    maxHeight = Math.max(params.h, autoScaleState.currentMaxY, 50);
    maxDistance = Math.max(autoScaleState.currentMaxX, 50);
  } else {
    // 使用关键点预测值
    const peakY = keyPoints.peak?.y || 0;
    const landingX = keyPoints.landing?.x || 0;
    maxHeight = Math.max(params.h, peakY, 50);
    maxDistance = Math.max(landingX, 50);
  }

  console.log('updateScale: bounds calculated:', { maxHeight, maxDistance, peakY: keyPoints.peak?.y, landingX: keyPoints.landing?.x });

  const availableWidth = canvasWidth * (1 - 2 * horizontalMargin);
  const availableHeight = canvasHeight * (1 - 2 * verticalMargin);

  // x轴和y轴分别计算基础缩放比例
  const baseScaleX = availableWidth / maxDistance;
  const baseScaleY = availableHeight / maxHeight;

  console.log('updateScale: base scales calculated:', { baseScaleX, baseScaleY, availableWidth, availableHeight });

  // 验证缩放值有效
  if (!isFinite(baseScaleX) || !isFinite(baseScaleY) || baseScaleX <= 0 || baseScaleY <= 0) {
    console.warn('Invalid scale values:', { baseScaleX, baseScaleY, canvasWidth, canvasHeight, maxHeight, maxDistance });
    return;
  }

  console.log('updateScale: scales are valid, autoScale enabled:', autoScaleState.enabled);

  if (autoScaleState.enabled) {
    // 平滑插值到目标缩放
    autoScaleState.targetMaxX = maxDistance;
    autoScaleState.targetMaxY = maxHeight;

    const targetScaleX = baseScaleX;
    const targetScaleY = baseScaleY;

    // 使用 lerp 实现平滑过渡
    autoScaleState.currentScaleX = lerp(
      autoScaleState.currentScaleX,
      targetScaleX,
      autoScaleState.lerpFactor
    );
    autoScaleState.currentScaleY = lerp(
      autoScaleState.currentScaleY,
      targetScaleY,
      autoScaleState.lerpFactor
    );

    // 应用手动缩放级别
    const finalZoom = Math.max(viewState.minZoom, Math.min(viewState.maxZoom, viewState.zoomLevel));
    scaleX = autoScaleState.currentScaleX * finalZoom;
    scaleY = autoScaleState.currentScaleY * finalZoom;
  } else {
    console.log('updateScale: entering manual mode branch');
    // 手动模式：直接使用计算值
    const finalZoom = Math.max(viewState.minZoom, Math.min(viewState.maxZoom, viewState.zoomLevel));
    scaleX = baseScaleX * finalZoom;
    scaleY = baseScaleY * finalZoom;

    console.log('updateScale: assigned scaleX/scaleY in manual mode:', { scaleX, scaleY, finalZoom });

    // 重置当前缩放值以便下次启用自动缩放时平滑过渡
    autoScaleState.currentScaleX = scaleX / finalZoom;
    autoScaleState.currentScaleY = scaleY / finalZoom;
  }

  console.log('updateScale: about to update displayScale');

  // 更新响应式显示值
  displayScale.value = { x: scaleX, y: scaleY };

  console.log('updateScale: completed, displayScale:', displayScale.value);
}

/**
 * 重新计算关键点
 */
function recalculateKeyPoints() {
  // 起点
  keyPoints.start = { x: 0, y: params.h };

  // 判断是否有实际阻力（启用且系数 > 0）
  const hasDrag = environmentState.airResistanceEnabled && environmentState.dragCoefficient > 0;

  if (hasDrag) {
    // 有阻力时：重新预计算轨迹以获取准确的关键点
    const trajectory = calculateTrajectoryWithDrag(
      params.v0,
      params.g,
      params.h,
      params.theta,
      params.mass,
      environmentState.dragCoefficient,
      0.01,  // dt
      100    // maxTime
    );
    animationState.cachedTrajectory = trajectory;

    // 有阻力时：清空轨迹点，由动画播放时逐帧按时间索引显示
    if (animationState.currentTime === 0) {
      animationState.pathPoints = trajectory.points.filter((_, index) => index % 3 === 0);
    }

    // 找到最高点（y值最大的点）
    let maxY = -Infinity;
    let peakPoint = null;
    for (const point of trajectory.points) {
      if (point.y > maxY) {
        maxY = point.y;
        peakPoint = point;
      }
    }
    keyPoints.peak = peakPoint || { x: 0, y: params.h, t: 0 };

    // 落地点（最后一个点）
    const lastPoint = trajectory.points[trajectory.points.length - 1];
    keyPoints.landing = { x: lastPoint.x, y: 0, t: lastPoint.t };
  } else {
    // 使用解析解（无阻力或阻力系数为0）
    animationState.cachedTrajectory = null;

    const peak = calculatePeakPoint(params.v0, params.g, params.h, params.theta);
    keyPoints.peak = peak;

    const landingTime = predictLandingTime(params.v0, params.g, params.h, params.theta);
    const landingPos = calculatePosition(params.v0, params.g, params.h, params.theta, landingTime);
    keyPoints.landing = { x: landingPos.x, y: 0, t: landingTime };

    // 无阻力时：清空轨迹点，由动画播放时逐帧累积
    animationState.pathPoints = [];
  }

  // 更新缩放比例
  if (canvasWidth && canvasHeight) {
    updateScale();
  }
}

/**
 * 物理坐标转 Canvas 坐标
 */
function physicsToCanvas(physicsX, physicsY) {
  const margin = canvasWidth * 0.10;
  const canvasX = physicsX * scaleX + margin + viewState.scrollX;
  const canvasY = canvasHeight - physicsY * scaleY - canvasHeight * 0.10 - viewState.scrollY;
  return { x: canvasX, y: canvasY };
}

/**
 * Canvas 坐标转物理坐标
 */
function canvasToPhysics(canvasX, canvasY) {
  const margin = canvasWidth * 0.10;
  const physicsX = (canvasX - margin - viewState.scrollX) / scaleX;
  const physicsY = (canvasHeight - canvasY - canvasHeight * 0.10 - viewState.scrollY) / scaleY;
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
 * 获取当前位置（支持空气阻力）
 */
function getCurrentPosition() {
  // 判断是否有实际阻力（启用且系数 > 0）
  const hasDrag = environmentState.airResistanceEnabled && environmentState.dragCoefficient > 0;

  if (!hasDrag) {
    // 使用解析解（理想抛体运动）
    return calculatePosition(params.v0, params.g, params.h, params.theta, animationState.currentTime);
  }

  // 使用预计算的轨迹（带阻力）
  const cachedTrajectory = animationState.cachedTrajectory;
  if (cachedTrajectory && cachedTrajectory.points.length > 0) {
    // 在预计算的轨迹点中插值
    const t = animationState.currentTime;

    // 找到时间点
    let low = 0, high = cachedTrajectory.points.length - 1;
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (cachedTrajectory.points[mid].t < t) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }

    if (low === 0) {
      return cachedTrajectory.points[0];
    }

    const p1 = cachedTrajectory.points[low - 1];
    const p2 = cachedTrajectory.points[low];

    // 线性插值
    const ratio = (t - p1.t) / (p2.t - p1.t);
    return {
      x: p1.x + (p2.x - p1.x) * ratio,
      y: Math.max(0, p1.y + (p2.y - p1.y) * ratio)
    };
  }

  // fallback: 返回初始位置
  return { x: 0, y: params.h };
}

/**
 * 获取当前速度（支持空气阻力）
 */
function getCurrentVelocityWithDrag() {
  // 判断是否有实际阻力（启用且系数 > 0）
  const hasDrag = environmentState.airResistanceEnabled && environmentState.dragCoefficient > 0;

  if (!hasDrag) {
    return calculateVelocity(params.v0, params.g, params.theta, animationState.currentTime);
  }

  // 使用预计算轨迹中的速度
  const cachedTrajectory = animationState.cachedTrajectory;
  if (cachedTrajectory && cachedTrajectory.points.length > 0) {
    const t = animationState.currentTime;

    // 找到时间点
    let low = 0, high = cachedTrajectory.points.length - 1;
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (cachedTrajectory.points[mid].t < t) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }

    const point = cachedTrajectory.points[Math.min(low, cachedTrajectory.points.length - 1)];
    return {
      vx: point.vx,
      vy: point.vy,
      v: Math.sqrt(point.vx * point.vx + point.vy * point.vy)
    };
  }

  // fallback: 返回初速度
  const thetaRad = (params.theta * Math.PI) / 180;
  return {
    vx: params.v0 * Math.cos(thetaRad),
    vy: params.v0 * Math.sin(thetaRad),
    v: params.v0
  };
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

  const vel = environmentState.airResistanceEnabled
    ? getCurrentVelocityWithDrag()
    : calculateVelocity(params.v0, params.g, params.theta, keypoint.t);

  // 计算阻力力（如果启用）
  let dragInfo = '';
  if (environmentState.airResistanceEnabled) {
    const dragForceX = environmentState.dragCoefficient * vel.vx;
    const dragForceY = environmentState.dragCoefficient * vel.vy;
    const dragForce = Math.sqrt(dragForceX * dragForceX + dragForceY * dragForceY);
    const dragAccel = dragForce / params.mass;

    dragInfo = `
      <div class="tooltip-item" style="color: #856404; background: #fff3cd; padding: 4px; border-radius: 4px; margin-top: 6px;">
        <strong>🌬️ 空气阻力：</strong>
        <div style="font-size: 11px; margin-top: 2px;">
          F<sub>drag</sub> = ${formatPhysicsValue(dragForce, 'N')}<br>
          a<sub>drag</sub> = ${formatPhysicsValue(dragAccel, 'm/s²')}
        </div>
      </div>
    `;
  }

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
      ${dragInfo}
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
/**
 * 绘制历史轨迹
 */
function drawHistoricalTrajectories(p) {
  if (trajectoryHistory.tracks.length === 0) return;

  // 绘制每一条保存的轨迹
  for (const track of trajectoryHistory.tracks) {
    if (track.points.length < 2) continue;

    // 设置虚线样式和低透明度
    const trackColor = track.color;

    // 将十六进制颜色转换为 RGB 并添加透明度
    const r = parseInt(trackColor.slice(1, 3), 16);
    const g = parseInt(trackColor.slice(3, 5), 16);
    const b = parseInt(trackColor.slice(5, 7), 16);

    p.stroke(r, g, b, 100); // 100/255 ≈ 40% 透明度
    p.strokeWeight(2);

    // 绘制虚线轨迹
    for (let i = 0; i < track.points.length - 1; i++) {
      const point = track.points[i];
      const nextPoint = track.points[i + 1];

      const canvasPos = physicsToCanvas(point.x, point.y);
      const nextCanvasPos = physicsToCanvas(nextPoint.x, nextPoint.y);

      // 虚线效果：每隔4个像素绘制一段
      const dx = nextCanvasPos.x - canvasPos.x;
      const dy = nextCanvasPos.y - canvasPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 8) {
        const segments = Math.floor(distance / 8);
        for (let j = 0; j < segments; j += 2) {
          const t1 = (j * 8) / distance;
          const t2 = Math.min((j * 8 + 4) / distance, 1);

          const x1 = canvasPos.x + dx * t1;
          const y1 = canvasPos.y + dy * t1;
          const x2 = canvasPos.x + dx * t2;
          const y2 = canvasPos.y + dy * t2;

          p.line(x1, y1, x2, y2);
        }
      } else {
        p.line(canvasPos.x, canvasPos.y, nextCanvasPos.x, nextCanvasPos.y);
      }
    }

    // 绘制关键点标记（起点、最高点、落地点）
    const keyPointRadius = 4;
    p.noStroke();

    // 起点
    if (track.keyPoints.start) {
      const startCanvas = physicsToCanvas(track.keyPoints.start.x, track.keyPoints.start.y);
      p.fill(r, g, b, 150);
      p.circle(startCanvas.x, startCanvas.y, keyPointRadius * 2);
    }

    // 最高点
    if (track.keyPoints.peak && track.keyPoints.peak.x !== Infinity) {
      const peakCanvas = physicsToCanvas(track.keyPoints.peak.x, track.keyPoints.peak.y);
      p.fill(r, g, b, 150);
      p.circle(peakCanvas.x, peakCanvas.y, keyPointRadius * 2);
    }

    // 落地点
    if (track.keyPoints.landing && track.keyPoints.landing.x !== Infinity) {
      const landingCanvas = physicsToCanvas(track.keyPoints.landing.x, track.keyPoints.landing.y);
      p.fill(r, g, b, 150);
      p.circle(landingCanvas.x, landingCanvas.y, keyPointRadius * 2);
    }
  }
}

/**
 * 绘制轨迹高亮吸附
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
  let pos = getCurrentPosition();

  // 如果已落地，将位置修正到地面（y=0）
  if (pos.y < 0) {
    pos = { x: pos.x, y: 0 };
  }

  const canvasPos = physicsToCanvas(pos.x, pos.y);

  // 绘制物体
  p.fill(0, 102, 68); // #006644
  if (animationState.isDragging || animationState.isHovering) {
    p.stroke(255);
    p.strokeWeight(2);
  } else {
    p.noStroke();
  }

  const radius = 10 + Math.pow(Math.max(0.1, params.mass), 0.1);
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
  p.line(-margin, xAxisY, canvasWidth + margin, xAxisY);

  // X 轴箭头
  const arrowSize = 8;
  p.line(canvasWidth + margin, xAxisY, canvasWidth + margin - arrowSize, xAxisY - arrowSize / 2);
  p.line(canvasWidth + margin, xAxisY, canvasWidth + margin - arrowSize, xAxisY + arrowSize / 2);

  // Y 轴（起点位置）
  const yAxisX = originCanvas.x;
  p.line(yAxisX, canvasHeight + margin, yAxisX, -margin);

  // Y 轴箭头
  p.line(yAxisX, -margin, yAxisX - arrowSize / 2, -margin + arrowSize);
  p.line(yAxisX, -margin, yAxisX + arrowSize / 2, -margin + arrowSize);

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

  // X 轴刻度 - 扩展到负值和更大的正值
  const minX = -20;
  const maxX = Math.max(keyPoints.landing.x * 1.5, 100);
  p.textAlign(p.CENTER, p.TOP);

  for (let x = Math.floor(minX / interval.x) * interval.x; x <= maxX; x += interval.x) {
    const canvasPos = physicsToCanvas(x, 0);

    // 只绘制在可见范围内的刻度
    if (canvasPos.x < -50 || canvasPos.x > canvasWidth + 50) continue;

    if (axisState.gridMode) {
      // 网格线模式
      p.stroke(200, 200, 200, 100);
      p.strokeWeight(1);
      p.drawingContext.setLineDash([2, 2]);
      p.line(canvasPos.x, -100, canvasPos.x, canvasHeight + 100);
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

  // Y 轴刻度 - 扩展到更大的正值
  const minY = -10;
  const maxY = Math.max(params.h, keyPoints.peak.y) * 1.5;
  p.textAlign(p.RIGHT, p.CENTER);

  for (let y = Math.floor(minY / interval.y) * interval.y; y <= maxY; y += interval.y) {
    const canvasPos = physicsToCanvas(0, y);

    // 只绘制在可见范围内的刻度
    if (canvasPos.y < -50 || canvasPos.y > canvasHeight + 50) continue;

    if (axisState.gridMode) {
      // 网格线模式
      p.stroke(200, 200, 200, 100);
      p.strokeWeight(1);
      p.drawingContext.setLineDash([2, 2]);
      p.line(-100, canvasPos.y, canvasWidth + 100, canvasPos.y);
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
  // 未开始播放时不显示轨迹
  if (!animationState.isPlaying && animationState.currentTime === 0) return;
  if (animationState.pathPoints.length < 2) return;

  p.noFill();

  // 判断是否有阻力
  const hasDrag = environmentState.airResistanceEnabled && environmentState.dragCoefficient > 0;

  // 确定绘制的终点索引
  let endIndex = animationState.pathPoints.length - 1;

  if (hasDrag && animationState.cachedTrajectory && animationState.isPlaying) {
    // 有阻力且正在播放时：只绘制到当前播放时间对应的点
    const t = animationState.currentTime;

    // 找到对应的时间点
    let low = 0, high = animationState.pathPoints.length - 1;
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (animationState.pathPoints[mid].t <= t) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }
    endIndex = Math.min(low, animationState.pathPoints.length - 1);
  } else if (hasDrag && animationState.cachedTrajectory && !animationState.isPlaying && animationState.currentTime > 0) {
    // 有阻力且暂停时：显示到当前暂停时刻的轨迹
    const t = animationState.currentTime;

    // 找到对应的时间点
    let low = 0, high = animationState.pathPoints.length - 1;
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (animationState.pathPoints[mid].t <= t) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }
    endIndex = Math.min(low, animationState.pathPoints.length - 1);
  }
  // 其他情况（未播放、落地后等）：显示完整轨迹（endIndex 保持为 pathPoints.length - 1）

  // 绘制轨迹线
  for (let i = 0; i < endIndex; i++) {
    const point = animationState.pathPoints[i];
    const nextPoint = animationState.pathPoints[i + 1];

    const canvasPos = physicsToCanvas(point.x, point.y);
    const nextCanvasPos = physicsToCanvas(nextPoint.x, nextPoint.y);

    // 渐变颜色
    const ratio = i / (endIndex);
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
 * 生成轨迹点（用于静态显示）
 */
function generatePathPoints() {
  // 如果 canvas 还未初始化，跳过
  if (!canvasWidth || !canvasHeight || canvasWidth <= 0 || canvasHeight <= 0) {
    return;
  }

  animationState.pathPoints = [];
  const hasDrag = environmentState.airResistanceEnabled && environmentState.dragCoefficient > 0;

  if (hasDrag && animationState.cachedTrajectory) {
    // 有阻力时使用预计算的轨迹（供吸附检测使用）
    animationState.pathPoints = animationState.cachedTrajectory.points.filter((_, index) => index % 3 === 0);
  }
  // 无阻力时：pathPoints 保持空数组，由动画播放时逐帧累积
  console.log('Generated pathPoints:', animationState.pathPoints.length, 'points');
}

/**
 * p5.js sketch
 */
const sketch = (p) => {
  // 平移拖拽状态
  let isPanning = false;
  let panStartMouseX = 0;
  let panStartMouseY = 0;
  let panStartScrollX = 0;
  let panStartScrollY = 0;

  p.setup = () => {
    const container = canvasMountRef.value;
    canvasWidth = container.clientWidth || 800;  // 默认宽度
    canvasHeight = container.clientHeight || 600;  // 默认高度
    console.log('p5 setup: canvas size =', canvasWidth, 'x', canvasHeight);
    p.createCanvas(canvasWidth, canvasHeight);
    p.frameRate(60);

    // 初始化关键点
    recalculateKeyPoints();

    // 初始化自动缩放状态
    const landingX = keyPoints.landing?.x || 50;
    const peakY = keyPoints.peak?.y || params.h || 50;
    autoScaleState.currentMaxX = Math.max(landingX, 50);
    autoScaleState.currentMaxY = Math.max(params.h, peakY, 50);

    // 初始化 currentScale 为合理的初始值
    const horizontalMargin = 0.10;
    const verticalMargin = 0.10;
    const availableWidth = canvasWidth * (1 - 2 * horizontalMargin);
    const availableHeight = canvasHeight * (1 - 2 * verticalMargin);
    autoScaleState.currentScaleX = availableWidth / autoScaleState.currentMaxX;
    autoScaleState.currentScaleY = availableHeight / autoScaleState.currentMaxY;

    // 动态计算缩放比例（确保所有关键点都在画布内）
    updateScale();

    // 重新计算关键点（会自动生成轨迹点）
    recalculateKeyPoints();
  };

  p.draw = () => {
    // 使用环境背景颜色
    const bgColor = environmentState.currentBackgroundColor;
    // 转换hex颜色为RGB
    const r = parseInt(bgColor.slice(1, 3), 16);
    const g = parseInt(bgColor.slice(3, 5), 16);
    const b = parseInt(bgColor.slice(5, 7), 16);
    p.background(r, g, b);

    // 更新动画时间
    if (animationState.isPlaying) {
      const dt = (1 / 60) * params.timeScale;
      animationState.currentTime += dt;

      const pos = getCurrentPosition();

      // 更新自动缩放边界（如果启用）
      if (autoScaleState.enabled) {
        updateAutoScaleBounds(pos);
        updateScale();  // 只在启用自动缩放时更新缩放
      }

      // 检查是否落地
      if (pos.y <= 0) {
        animationState.isPlaying = false;
        animationState.currentTime = keyPoints.landing.t;
      }

      // 记录轨迹点
      // 当无阻力或阻力系数为0时，实时记录轨迹点
      // 有阻力时使用预计算的轨迹点
      const hasDrag = environmentState.airResistanceEnabled && environmentState.dragCoefficient > 0;

      if (!hasDrag) {
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

      // 添加频闪标记（如果启用，独立于路径采样逻辑）
      if (stroboscopicState.enabled && stroboscopicState.interval > 0) {
        const frameCount = Math.floor(animationState.currentTime * 60 / params.timeScale);
        if (frameCount % stroboscopicState.interval === 0) {
          const hasMarkerAtTime = stroboscopicState.markers.some(
            m => Math.abs(m.t - animationState.currentTime) < 0.02
          );
          if (!hasMarkerAtTime) {
            addStroboscopicMarker(pos, animationState.currentTime);
          }
        }
      }
    }

    // 绘制
    drawAxes(p);
    drawGuides(p);
    drawHistoricalTrajectories(p);  // 先绘制历史轨迹
    drawTrajectory(p);               // 再绘制当前轨迹
    drawKeyPoints(p);
    drawKeyPointCoordinates(p);
    drawKeyPointHighlight(p);
    drawTrajectoryHighlight(p);
    drawObject(p);
    drawVelocityVectors(p);
    drawStroboscopicMarkers(p);

    // 绘制快捷键提示（仅在未缩放且未平移时显示）
    if (Math.abs(viewState.zoomLevel - 1.0) < 0.01 && viewState.scrollX === 0 && viewState.scrollY === 0) {
      drawShortcutHint(p);
    }
  };

  /**
   * 绘制快捷键提示
   */
  function drawShortcutHint(p) {
    const lines = ['Ctrl + 滚轮：缩放', 'Ctrl + 拖拽：平移'];

    p.push();
    p.noStroke();
    p.textSize(13);
    p.textAlign(p.LEFT, p.TOP);

    lines.forEach((text, i) => {
      const y = 11 + i * 18;
      p.fill(0, 0, 0, 100);
      p.text(text, 12, y + 1);
      p.fill(255);
      p.text(text, 12, y);
    });
    p.pop();
  }

  p.windowResized = () => {
    const container = canvasMountRef.value;
    if (!container) return;

    const oldWidth = canvasWidth;
    const oldHeight = canvasHeight;
    canvasWidth = container.clientWidth;
    canvasHeight = container.clientHeight;

    // 只有当尺寸真的改变时才更新
    if (oldWidth !== canvasWidth || oldHeight !== canvasHeight) {
      p.resizeCanvas(canvasWidth, canvasHeight);

      // 实时更新缩放
      updateScale();

      // 调整滚动偏移以保持视野中心
      if (oldWidth > 0 && oldHeight > 0) {
        viewState.scrollX = viewState.scrollX * (canvasWidth / oldWidth);
        viewState.scrollY = viewState.scrollY * (canvasHeight / oldHeight);
      }

      console.log('Canvas resized:', canvasWidth, 'x', canvasHeight);
    }
  };

  // 鼠标滚轮事件：Ctrl+滚轮缩放
  p.mouseWheel = (event) => {
    // 检查鼠标是否在画布内
    if (p.mouseX < 0 || p.mouseX > canvasWidth || p.mouseY < 0 || p.mouseY > canvasHeight) {
      return;
    }

    // Ctrl+滚轮：缩放
    if (event.ctrlKey) {
      const delta = -Math.sign(event.delta);
      const zoomFactor = 1.1;
      const oldZoom = viewState.zoomLevel;
      const mouseX = p.mouseX;
      const mouseY = p.mouseY;

      // 计算缩放前的物理坐标（鼠标位置）
      const marginX = canvasWidth * 0.10;
      const marginY = canvasHeight * 0.10;
      const physicsX_Before = (mouseX - marginX - viewState.scrollX) / scaleX;
      const physicsY_Before = (canvasHeight - mouseY - marginY - viewState.scrollY) / scaleY;

      // 更新缩放级别
      if (delta > 0) {
        viewState.zoomLevel = Math.min(viewState.maxZoom, viewState.zoomLevel * zoomFactor);
      } else {
        viewState.zoomLevel = Math.max(viewState.minZoom, viewState.zoomLevel / zoomFactor);
      }

      // 如果缩放级别改变了
      if (viewState.zoomLevel !== oldZoom) {
        // 更新缩放比例
        updateScale();

        // 计算新的滚动偏移，使鼠标指向的物理坐标保持不变
        // mouseX = physicsX * newScaleX + marginX + newScrollX
        // newScrollX = mouseX - physicsX * newScaleX - marginX
        viewState.scrollX = mouseX - physicsX_Before * scaleX - marginX;
        viewState.scrollY = mouseY - (canvasHeight - physicsY_Before * scaleY - marginY);

        console.log('Zoom:', oldZoom.toFixed(2), '->', viewState.zoomLevel.toFixed(2),
                    'at physics coords:', physicsX_Before.toFixed(1), physicsY_Before.toFixed(1));
      }

      return false; // 阻止默认滚动行为
    }

    // 普通滚轮：滚动（如果坐标轴超出画布）
    return false; // 阻止默认滚动行为，我们自己处理
  };

  // 键盘事件：Ctrl+0 还原缩放
  p.keyPressed = () => {
    if (p.key === '0' && p.keyIsDown(p.CONTROL)) {
      resetZoom();
    }
  };

  /**
   * 绘制箭头
   * @param {p5.Renderer} p - p5.js 实例
   * @param {number} startX - 起点 X 坐标
   * @param {number} startY - 起点 Y 坐标
   * @param {number} length - 箭头长度
   * @param {number} angle - 角度（弧度）
   * @param {string} color - 颜色
   * @param {number} weight - 线条粗细
   */
  function drawArrow(p, startX, startY, length, angle, color, weight = 2) {
    // 计算箭头终点
    const endX = startX + length * Math.cos(angle);
    const endY = startY - length * Math.sin(angle);

    // 绘制箭头杆
    p.stroke(color);
    p.strokeWeight(weight);
    p.line(startX, startY, endX, endY);

    // 绘制箭头头部
    const arrowSize = 8; // 箭头大小
    const arrowAngle = Math.PI / 6; // 30度

    // 左箭头边
    const leftAngle = angle + Math.PI - arrowAngle;
    const leftX = endX + arrowSize * Math.cos(leftAngle);
    const leftY = endY - arrowSize * Math.sin(leftAngle);

    // 右箭头边
    const rightAngle = angle + Math.PI + arrowAngle;
    const rightX = endX + arrowSize * Math.cos(rightAngle);
    const rightY = endY - arrowSize * Math.sin(rightAngle);

    p.stroke(color);
    p.strokeWeight(weight);
    p.line(endX, endY, leftX, leftY);
    p.line(endX, endY, rightX, rightY);
  }

  /**
   * 绘制速度矢量
   */
  function drawVelocityVectors(p) {
    if (!vectorState.show) return;

    const pos = getCurrentPosition();
    if (pos.y < 0) return; // 已落地，不绘制

    const vel = getCurrentVelocityWithDrag();
    const ballCanvas = physicsToCanvas(pos.x, pos.y);

    // 计算矢量角度（从水平向右开始，顺时针为负）
    const vxAngle = 0; // 水平向右
    const vyAngle = Math.PI / 2; // 垂直向上
    const vAngle = Math.atan2(vel.vy, vel.vx);

    // 矢量长度缩放（像素/米）
    const vectorScale = vectorState.scale;
    const maxLength = 100; // 最大像素长度

    // 计算实际长度（限制最大值）
    let vxLength = Math.abs(vel.vx) * vectorScale;
    let vyLength = Math.abs(vel.vy) * vectorScale;
    let vLength = vel.v * vectorScale;

    // 确保矢量不会太长或太短
    vxLength = Math.max(10, Math.min(maxLength, vxLength));
    vyLength = Math.max(10, Math.min(maxLength, vyLength));
    vLength = Math.max(10, Math.min(maxLength, vLength));

    // 绘制水平分量 vx（绿色）
    drawArrow(p, ballCanvas.x, ballCanvas.y, vxLength, vxAngle, '#00AA00', 3);

    // 绘制垂直分量 vy（蓝色）
    drawArrow(p, ballCanvas.x, ballCanvas.y, vyLength, vyAngle, '#0066CC', 3);

    // 绘制合速度 v（深色）
    drawArrow(p, ballCanvas.x, ballCanvas.y, vLength, vAngle, '#333333', 4);
  }

  /**
   * 绘制频闪标记
   */
  function drawStroboscopicMarkers(p) {
    if (!stroboscopicState.enabled || stroboscopicState.markers.length === 0) {
      return;
    }

    // 绘制所有标记
    for (const marker of stroboscopicState.markers) {
      const canvasPos = physicsToCanvas(marker.x, marker.y);
      // 绘制半透明小球
      p.noStroke();
      p.fill(0, 102, 68, 80); // 80/255 ≈ 31% 透明度
      p.circle(canvasPos.x, canvasPos.y, 20); // 与小球相同大小

      // 绘制时间标签
      if (stroboscopicState.showLabels) {
        p.fill(0, 0, 0);
        p.noStroke();
        p.textSize(10);
        p.textAlign('center');
        p.text(marker.t.toFixed(2) + 's', canvasPos.x, canvasPos.y + 18);
      }
    }
  }

  p.mousePressed = () => {
    // 检查鼠标是否在画布内
    if (p.mouseX < 0 || p.mouseX > canvasWidth || p.mouseY < 0 || p.mouseY > canvasHeight) {
      return;
    }

    // Ctrl + 鼠标拖拽：开始平移
    if (p.keyIsDown(p.CONTROL)) {
      isPanning = true;
      panStartMouseX = p.mouseX;
      panStartMouseY = p.mouseY;
      panStartScrollX = viewState.scrollX;
      panStartScrollY = viewState.scrollY;
      return;
    }

    // 检查是否点击了右上角的还原按钮区域
    // 按钮位置：top: 10px, right: 10px, 大小约 70x35px
    const buttonArea = {
      x: canvasWidth - 80,
      y: 0,
      width: 80,
      height: 45
    };

    if (p.mouseX >= buttonArea.x && p.mouseX <= buttonArea.x + buttonArea.width &&
        p.mouseY >= buttonArea.y && p.mouseY <= buttonArea.y + buttonArea.height) {
      // 点击了还原按钮区域，不处理
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
    // Ctrl 拖拽：平移视口
    if (isPanning) {
      viewState.scrollX = panStartScrollX + (p.mouseX - panStartMouseX);
      viewState.scrollY = panStartScrollY - (p.mouseY - panStartMouseY);
      return;
    }
    if (animationState.isDragging && animationState.dragTarget === 'object') {
      const physicsPos = canvasToPhysics(p.mouseX, p.mouseY);
      params.h = Math.max(10, Math.min(200, physicsPos.y));
      recalculateKeyPoints();
    }
  };

  p.mouseReleased = () => {
    if (isPanning) {
      isPanning = false;
      return;
    }
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
 * 切换播放/暂停（供外部调用）
 */
function togglePlayPause() {
  animationState.isPlaying = !animationState.isPlaying;
}

/**
 * 重置动画（供外部调用）
 */
function resetAnimation() {
  animationState.isPlaying = false;
  animationState.currentTime = 0;

  // 清除频闪标记
  clearStroboscopicMarkers();

  // 重置自动缩放边界
  if (autoScaleState.enabled) {
    resetAutoScaleBounds();
  }

  // 重新计算关键点（会自动处理带阻力的轨迹并生成轨迹点）
  recalculateKeyPoints();
}

/**
 * 设置倍速（供外部调用）
 */
function setTimeScale(speed) {
  params.timeScale = speed;
}

/**
 * 单步前进（供外部调用）
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
 * 还原缩放到默认级别
 */
function resetZoom() {
  viewState.zoomLevel = 1.0;
  viewState.scrollX = 0;
  viewState.scrollY = 0;
  updateScale();
  console.log('Zoom reset to 1.0x');
}

/**
 * 格式化缩放级别显示（智能精度）
 */
function formatZoomLevel(zoom) {
  // 小于1.1显示一位小数，大于等于1.1显示两位小数
  if (Math.abs(zoom - 1.0) < 0.1) {
    return zoom.toFixed(1) + 'x';
  } else {
    return zoom.toFixed(2) + 'x';
  }
}

// 导出动画控制函数供 ChatBox 调用
defineExpose({
  togglePlayPause,
  resetAnimation,
  setTimeScale,
  stepForward,
  resetZoom
});

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
 * 切换速度矢量显示/隐藏
 */
function toggleVectors() {
  vectorState.show = !vectorState.show;
}

/**
 * 切换自动缩放
 */
function toggleAutoScale() {
  autoScaleState.enabled = !autoScaleState.enabled;

  if (autoScaleState.enabled) {
    // 启用时，重置边界到当前值
    resetAutoScaleBounds();

    // 立即计算并设置正确的缩放值（不使用 lerp 渐变）
    const horizontalMargin = autoScaleState.marginFactor;
    const verticalMargin = autoScaleState.marginFactor;

    const maxHeight = Math.max(params.h, autoScaleState.currentMaxY, 50);
    const maxDistance = Math.max(autoScaleState.currentMaxX, 50);

    const availableWidth = canvasWidth * (1 - 2 * horizontalMargin);
    const availableHeight = canvasHeight * (1 - 2 * verticalMargin);

    const baseScaleX = availableWidth / maxDistance;
    const baseScaleY = availableHeight / maxHeight;

    // 直接设置为目标值，跳过 lerp 渐变
    autoScaleState.currentScaleX = baseScaleX;
    autoScaleState.currentScaleY = baseScaleY;

    console.log('自动缩放已启用');
  } else {
    console.log('自动缩放已禁用');
  }

  // 更新缩放
  updateScale();
}

/**
 * 保存当前轨迹到历史记录
 */
function saveTrajectory() {
  // 检查是否已达到最大保存数量
  if (trajectoryHistory.tracks.length >= trajectoryHistory.maxTracks) {
    console.warn('已达到最大轨迹保存数量', trajectoryHistory.maxTracks);
    return;
  }

  // 生成轨迹数据
  const trajectory = {
    id: Date.now(),                                  // 唯一标识符
    timestamp: new Date().toISOString(),              // 保存时间
    color: trajectoryHistory.colorPalette[trajectoryHistory.nextColorIndex % trajectoryHistory.colorPalette.length], // 分配颜色
    params: {                                         // 参数快照
      v0: params.v0,
      g: params.g,
      h: params.h,
      theta: params.theta,
      mass: params.mass
    },
    points: [...animationState.pathPoints],          // 轨迹点数组（浅拷贝）
    keyPoints: {                                      // 关键点
      start: { ...keyPoints.start },
      peak: { ...keyPoints.peak },
      landing: { ...keyPoints.landing }
    }
  };

  // 添加到历史记录
  trajectoryHistory.tracks.push(trajectory);
  trajectoryHistory.nextColorIndex++;

  console.log('轨迹已保存:', {
    id: trajectory.id,
    color: trajectory.color,
    totalTracks: trajectoryHistory.tracks.length
  });
}

/**
 * 清除所有轨迹历史
 */
function clearTrajectoryHistory() {
  trajectoryHistory.tracks = [];
  trajectoryHistory.nextColorIndex = 0;
  console.log('轨迹历史已清除');
}

/**
 * 删除指定轨迹
 */
function deleteTrajectory(trajectoryId) {
  const index = trajectoryHistory.tracks.findIndex(t => t.id === trajectoryId);
  if (index !== -1) {
    trajectoryHistory.tracks.splice(index, 1);
    console.log('轨迹已删除:', trajectoryId);
  }
}

/**
 * 切换环境模式
 */
function setEnvironmentMode(mode) {
  const preset = environmentState.presets[mode];
  if (!preset) return;

  environmentState.mode = mode;

  // 应用重力
  params.g = preset.gravity;

  // 应用空气阻力设置
  environmentState.airResistanceEnabled = preset.hasDrag;

  // 自定义模式保持当前阻力系数，其他模式禁用阻力
  if (mode !== 'custom') {
    environmentState.dragCoefficient = 0.1;
  }

  // 更新背景颜色
  environmentState.currentBackgroundColor = preset.backgroundColor;

  // 重置动画
  resetAnimation();

  console.log('环境模式已切换:', mode, preset);
}

/**
 * 切换空气阻力
 */
function toggleAirResistance() {
  environmentState.airResistanceEnabled = !environmentState.airResistanceEnabled;
  // 不再需要手动调用 resetAnimation()，watch 会自动处理
  console.log('空气阻力:', environmentState.airResistanceEnabled ? '启用' : '禁用');
}

/**
 * 更新阻力系数
 */
function updateDragCoefficient(value) {
  environmentState.dragCoefficient = Math.max(0, Math.min(1.0, value));
  // 不再需要手动调用 resetAnimation()，watch 会自动处理
}

/**
 * 切换频闪标记
 */
function toggleStroboscopic() {
  stroboscopicState.enabled = !stroboscopicState.enabled;
  // 如果禁用，清除所有标记
  if (!stroboscopicState.enabled) {
    stroboscopicState.markers = [];
  }
}

/**
 * 更新频闪间隔
 */
function updateStroboscopicInterval(value) {
  stroboscopicState.interval = Math.max(1, Math.min(60, value));
  // 清除标记，让新的间隔生效
  stroboscopicState.markers = [];
}

/**
 * 切换频闪标签显示
 */
function toggleStroboscopicLabels() {
  stroboscopicState.showLabels = !stroboscopicState.showLabels;
}

/**
 * 清除频闪标记
 */
function clearStroboscopicMarkers() {
  stroboscopicState.markers = [];
}

/**
 * 添加频闪标记
 */
function addStroboscopicMarker(pos, t) {
  if (stroboscopicState.markers.length >= stroboscopicState.maxMarkers) {
    return; // 达到最大数量，不再添加
  }

  stroboscopicState.markers.push({
    x: pos.x,
    y: pos.y,
    t: t
  });
}

/**
 * 切换三栏显示/隐藏
 */
function toggleColumn(column) {
  const layout = layoutState.columnLayout;

  switch(column) {
    case 'left':
      layout.leftVisible = !layout.leftVisible;
      break;
    case 'center':
      layout.centerVisible = !layout.centerVisible;
      break;
    case 'right':
      layout.rightVisible = !layout.rightVisible;
      break;
  }

  // 重新计算宽度百分比
  recalculateColumnWidths();
}

/**
 * 重新计算三栏宽度百分比
 */
function recalculateColumnWidths() {
  const layout = layoutState.columnLayout;
  const visibleCount = [layout.leftVisible, layout.centerVisible, layout.rightVisible]
    .filter(Boolean).length;

  if (visibleCount === 0) return;

  const equalWidth = 100 / visibleCount;

  if (layout.leftVisible) layout.leftWidth = equalWidth;
  if (layout.centerVisible) layout.centerWidth = equalWidth;
  if (layout.rightVisible) layout.rightWidth = equalWidth;
}

/**
 * 切换能量条显示/隐藏
 */
/**
 * 更新公式显示
 */
const formulaContent = computed(() => {
  const pos = getCurrentPosition();
  const vel = getCurrentVelocityWithDrag();
  const Ek = currentKineticEnergy.value;
  const Ep = currentPotentialEnergy.value;
  const E = currentTotalEnergy.value;

  // 环境信息
  const preset = environmentState.presets[environmentState.mode];
  let environmentInfo = `
    <div style="margin-bottom: 8px; padding: 6px; background: #f0f9ff; border-radius: 4px; font-size: 11px;">
      <strong>环境:</strong> ${preset.name} | <strong>重力:</strong> g = ${params.g} m/s²
      ${environmentState.airResistanceEnabled ? `| <strong>阻力:</strong> k = ${environmentState.dragCoefficient.toFixed(2)}` : ''}
    </div>
  `;

  // 根据是否启用阻力显示不同的公式
  let motionFormulas = '';
  if (environmentState.airResistanceEnabled) {
    const pos = getCurrentPosition();
    const dx = pos.x;
    const dy = pos.y - params.h;
    const d = Math.sqrt(dx * dx + dy * dy);
    const b = environmentState.dragCoefficient;
    const m = params.mass;
    const g = params.g;
    const thetaRad = (params.theta * Math.PI) / 180;
    const vx0 = (params.v0 * Math.cos(thetaRad)).toFixed(2);
    const vy0 = (params.v0 * Math.sin(thetaRad)).toFixed(2);
    const vt = (m * g / b).toFixed(2);
    const bm = (b / m).toFixed(4);
    const mOverB = (m / b).toFixed(2);
    const vy0PlusVt = (parseFloat(vy0) + parseFloat(vt)).toFixed(2);
    motionFormulas = `
      <div class="formula-block">
        $$F_{drag} = -b v, \\quad v_t = \\frac{mg}{b} = \\frac{${m} \\times ${g}}{${b.toFixed(2)}} = ${vt} \\text{ m/s}$$
      </div>
      <h3 style="margin-top: 12px;">速度解析解</h3>
      <div class="formula-block">
        $$v_x = v_{x0} \\cdot e^{-(b/m)t} = ${vx0} \\cdot e^{-${bm}t}$$
      </div>
      <div class="formula-block">
        $$v_y = (v_{y0} + v_t) \\cdot e^{-(b/m)t} - v_t = ${vy0PlusVt} \\cdot e^{-${bm}t} - ${vt}$$
      </div>
      <h3 style="margin-top: 12px;">坐标解析解</h3>
      <div class="formula-block">
        $$x = \\frac{m}{b} v_{x0} \\left(1 - e^{-(b/m)t}\\right) = ${mOverB} \\times ${vx0} \\times (1 - e^{-${bm}t}) = ${dx.toFixed(2)} \\text{ m}$$
      </div>
      <div class="formula-block">
        $$y = h_0 + \\frac{m}{b}(v_{y0}+v_t)\\left(1-e^{-(b/m)t}\\right) - v_t t = ${params.h} + ${mOverB} \\times ${vy0PlusVt} \\times (1-e^{-${bm}t}) - ${vt}t = ${pos.y.toFixed(2)} \\text{ m}$$
      </div>
      <h3 style="margin-top: 12px;">位移</h3>
      <div class="formula-block">
        $$\\Delta x = x - x_0 = ${dx.toFixed(2)} - 0 = ${dx.toFixed(2)} \\text{ m}$$
      </div>
      <div class="formula-block">
        $$\\Delta y = y - h_0 = ${pos.y.toFixed(2)} - ${params.h} = ${dy.toFixed(2)} \\text{ m}$$
      </div>
      <div class="formula-block">
        $$|\\Delta \\vec{r}| = \\sqrt{\\Delta x^2 + \\Delta y^2} = ${d.toFixed(2)} \\text{ m}$$
      </div>
    `;
  } else {
    motionFormulas = `
      <div class="formula-block">
        $$x = v_0 \\cdot t \\cdot \\cos(${params.theta}°)$$
      </div>
      <div class="formula-block">
        $$y = ${params.h} + v_0 \\cdot t \\cdot \\sin(${params.theta}°) - \\frac{1}{2} \\cdot ${params.g} \\cdot t^2$$
      </div>
      <div class="formula-block">
        $$v_x = v_0 \\cdot \\cos(${params.theta}°), \\quad v_y = v_0 \\cdot \\sin(${params.theta}°) - ${params.g} \\cdot t$$
      </div>
    `;
  }

  // 能量守恒提示
  let energyNote = '';
  if (environmentState.airResistanceEnabled) {
    energyNote = `
      <div style="margin-top: 8px; padding: 4px 8px; background: #fff3cd; border-radius: 4px; font-size: 10px; color: #856404;">
        ⚠️ 空气阻力导致能量不守恒
      </div>
    `;
  }

  return `
    ${environmentInfo}
    <h3>核心公式</h3>
    ${motionFormulas}
    <h3 style="margin-top: 12px;">能量公式</h3>
    <div class="formula-block">
      $$E_k = \\frac{1}{2} m v^2 = ${Ek.toFixed(2)} \\text{ J}$$
    </div>
    <div class="formula-block">
      $$E_p = m g h = ${Ep.toFixed(2)} \\text{ J}$$
    </div>
    <div class="formula-block">
      $$E = E_k + E_p = ${E.toFixed(2)} \\text{ J}$$
    </div>
    ${energyNote}
  `;
});

// Current position for results display
const currentPosition = computed(() => {
  return getCurrentPosition();
});

// 位移计算（相对初始位置）
const currentDisplacement = computed(() => {
  const pos = getCurrentPosition();
  const dx = pos.x;                    // 水平位移（初始x=0）
  const dy = pos.y - params.h;         // 竖直位移（向下为负）
  const d = Math.sqrt(dx * dx + dy * dy); // 合位移
  return { dx, dy, d };
});

// Current velocity for gauge
const currentVelocity = computed(() => {
  const vel = getCurrentVelocityWithDrag();
  return vel.v;
});

// Energy calculations for dashboard
const currentKineticEnergy = computed(() => {
  const vel = getCurrentVelocityWithDrag();
  return 0.5 * params.mass * vel.v * vel.v;
});

const currentPotentialEnergy = computed(() => {
  const pos = getCurrentPosition();
  return params.mass * params.g * pos.y;
});

const currentTotalEnergy = computed(() => {
  return currentKineticEnergy.value + currentPotentialEnergy.value;
});

const maxEnergy = computed(() => {
  // Calculate maximum possible energy for scaling
  const initialVel = calculateVelocity(params.v0, params.g, params.theta, 0);
  const initialEk = 0.5 * params.mass * initialVel.v * initialVel.v;
  const maxEp = params.mass * params.g * params.h;
  return Math.max(initialEk, maxEp) * 1.2; // 20% buffer
});

// 初始总机械能（动画开始时记录，用于计算阻力损失）
const initialTotalEnergy = ref(0);

// 有阻力时的损失能量
const lostEnergy = computed(() => {
  const hasDrag = environmentState.airResistanceEnabled && environmentState.dragCoefficient > 0;
  if (!hasDrag || initialTotalEnergy.value === 0) return 0;
  return Math.max(0, initialTotalEnergy.value - currentTotalEnergy.value);
});

// 是否有空气阻力（供 EnergyGauge 判断显示）
const hasDragEnabled = computed(() =>
  environmentState.airResistanceEnabled && environmentState.dragCoefficient > 0
);

// 动画开始播放时记录初始能量
watch(() => animationState.isPlaying, (isPlaying) => {
  if (isPlaying && animationState.currentTime < 0.05) {
    initialTotalEnergy.value = currentTotalEnergy.value;
  }
});

// 重置时清空初始能量
watch(() => animationState.currentTime, (t) => {
  if (t === 0) initialTotalEnergy.value = 0;
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

// 监听 store 中的参数变化（从对话框同步到组件）
watch(() => state.projectileParams, (newParams) => {
  // 同步到本地 params
  params.v0 = newParams.v0;
  params.g = newParams.g;
  params.h = newParams.h;
  params.theta = newParams.theta;
  params.mass = newParams.mass;
  params.timeScale = newParams.timeScale;

  // 重置动画
  if (animationState.isPlaying) {
    animationState.isPlaying = false;
  }
  animationState.currentTime = 0;

  // 重新计算关键点（会自动生成轨迹点）
  recalculateKeyPoints();

  // 清除吸附状态（避免显示过期数据）
  clearAdsorptionState();
}, { deep: true });

// 监听本地参数变化（从滑块/输入框同步到 store）
watch(() => [params.v0, params.g, params.h, params.theta], () => {
  // 同步到 store
  updateProjectileParams({
    v0: params.v0,
    g: params.g,
    h: params.h,
    theta: params.theta
  });

  // 重置动画（如果正在播放，停止并重置）
  if (animationState.isPlaying) {
    animationState.isPlaying = false;
  }
  animationState.currentTime = 0;

  // 重新计算关键点（会自动生成轨迹点）
  recalculateKeyPoints();

  // 清除吸附状态（避免显示过期数据）
  clearAdsorptionState();
}, { deep: true });

// 监听环境参数变化（空气阻力）
watch(
  () => [environmentState.airResistanceEnabled, environmentState.dragCoefficient],
  () => {
    // 环境参数变化时立即响应（change事件，松开后触发）
    if (!animationState.isPlaying) {
      animationState.currentTime = 0;
    }

    // 重新计算关键点（会自动处理带阻力的轨迹并生成轨迹点）
    recalculateKeyPoints();
  },
  { deep: true }
);

// 监听 AI 指令（监听数字序号，与监听 projectileParams 同一可靠机制）
watch(() => state.canvasCommandSeq, () => {
  for (const cmd of state.canvasCommandBatch) {
    if (cmd.type === 'ENV') {
      setEnvironmentMode(cmd.value);
    } else if (cmd.type === 'ENV_OPT') {
      if (cmd.key === 'air') {
        // 开启空气阻力时自动切换到自定义模式，使控件可见
        if (cmd.value && environmentState.mode !== 'custom') setEnvironmentMode('custom');
        if (cmd.value !== environmentState.airResistanceEnabled) toggleAirResistance();
      } else if (cmd.key === 'drag') {
        // 设置阻力系数，并自动启用空气阻力+切换自定义模式
        if (environmentState.mode !== 'custom') setEnvironmentMode('custom');
        environmentState.dragCoefficient = Math.max(0, Math.min(1.0, cmd.value));
        if (!environmentState.airResistanceEnabled) toggleAirResistance();
      }
    } else if (cmd.type === 'ANIM') {
      if (cmd.value === 'play') { if (!animationState.isPlaying) togglePlayPause(); }
      else if (cmd.value === 'pause') { if (animationState.isPlaying) togglePlayPause(); }
      else if (cmd.value === 'reset') resetAnimation();
      else if (cmd.value === 'reset-zoom') resetZoom();
      else if (cmd.value === 'save') saveTrajectory();
    } else if (cmd.type === 'VIZ') {
      if (cmd.key === 'axis') axisState.visible = cmd.value;
      else if (cmd.key === 'grid') axisState.gridMode = cmd.value;
      else if (cmd.key === 'vector') vectorState.show = cmd.value;
      else if (cmd.key === 'strobe') { if (cmd.value !== stroboscopicState.enabled) toggleStroboscopic(); }
      else if (cmd.key === 'strobe-interval') { stroboscopicState.interval = Math.max(1, Math.min(60, cmd.value)); }
      else if (cmd.key === 'autoscale') { if (cmd.value !== autoScaleState.enabled) toggleAutoScale(); }
    }
  }
});

// 生命周期
onMounted(() => {
  const mountPoint = canvasMountRef.value;
  if (mountPoint.querySelector('canvas')) {
    mountPoint.innerHTML = '';
  }
  p5Instance = new p5(sketch, mountPoint);

  // 添加 ResizeObserver 以监听容器尺寸变化
  if (mountPoint && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (p5Instance && (width !== canvasWidth || height !== canvasHeight)) {
          // 触发 p5.js 的 resizeCanvas
          if (p5Instance._renderer) {
            canvasWidth = width;
            canvasHeight = height;
            p5Instance.resizeCanvas(width, height);
            updateScale();
            console.log('Canvas resized via ResizeObserver:', width, 'x', height);
          }
        }
      }
    });

    resizeObserver.observe(mountPoint);
    console.log('ResizeObserver attached to canvas mount point');
  }
});

onUnmounted(() => {
  // 清除 tooltip 定时器
  if (tooltip.fadeOutTimer) {
    clearTimeout(tooltip.fadeOutTimer);
    tooltip.fadeOutTimer = null;
  }

  // 清理 ResizeObserver
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
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
  overflow: hidden;
}

/* 拖拽分隔条 */
.resizer {
  height: 10px;
  background: transparent;
  cursor: ns-resize;
  transition: background 0.2s ease;
  flex-shrink: 0;
  position: relative;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
}

.resizer::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  transition: background 0.2s ease;
}

.resizer:hover::before {
  background: rgba(59, 130, 246, 0.08);
}

.resizer::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 15px;
  right: 15px;
  height: 3px;
  background: #9ca3af;
  transform: translateY(-50%);
  border-radius: 2px;
  transition: all 0.2s ease;
  pointer-events: none;
}

.resizer:hover::after {
  height: 4px;
  background: #3b82f6;
  left: 10px;
  right: 10px;
}

.resizer.active::after {
  height: 5px;
  background: #2563eb;
  box-shadow: 0 0 6px rgba(37, 99, 235, 0.4);
  left: 8px;
  right: 8px;
}

.resizer.active:hover::before {
  background: rgba(59, 130, 246, 0.12);
}

/* 列分隔条（垂直） */
.column-resizer {
  width: 8px;
  background: transparent;
  cursor: ew-resize;
  transition: background 0.2s ease;
  flex-shrink: 0;
  position: relative;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
}

.column-resizer::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  transition: background 0.2s ease;
}

.column-resizer:hover::before {
  background: rgba(59, 130, 246, 0.08);
}

.column-resizer::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 8px;
  bottom: 8px;
  width: 3px;
  background: #9ca3af;
  transform: translateX(-50%);
  border-radius: 2px;
  transition: all 0.2s ease;
  pointer-events: none;
}

.column-resizer:hover::after {
  width: 4px;
  background: #3b82f6;
  top: 6px;
  bottom: 6px;
}

.column-resizer.active::after {
  width: 5px;
  background: #2563eb;
  box-shadow: 0 0 6px rgba(37, 99, 235, 0.4);
  top: 5px;
  bottom: 5px;
}

.column-resizer.active:hover::before {
  background: rgba(59, 130, 246, 0.12);
}

/* 底部面板容器 */
.bottom-panel {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow: hidden;
}

.params-control {
  padding: 8px 12px;
  background: hsla(0, 0%, 100%, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid hsla(214.3, 31.8%, 91.4%, 0.3);
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
  flex-shrink: 0;
  position: relative;
  z-index: 10;
  overflow-y: auto;
}

.param-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.param-item label {
  font-size: 12px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Fallback for browsers without backdrop-filter support */
@supports not (backdrop-filter: blur(12px)) {
  .params-control {
    background: hsla(0, 0%, 100%, 0.95);
  }
}

.param-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.param-item > label:first-child,
.param-item > .param-label-row:first-child {
  min-height: 20px;
}

.param-item label {
  font-size: 14px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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

/* 参数控制区的checkbox样式 */
.param-label-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.param-controls-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

.param-controls-row input[type="range"] {
  flex: 1;
  accent-color: #006644;
}

.params-control .checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  user-select: none;
  padding: 4px 0;
}

.params-control .checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

#projectile-canvas-mount {
  flex: 1 1 0;
  position: relative;
  min-height: 200px;
  z-index: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

#projectile-canvas-mount canvas {
  position: absolute;
  top: 0;
  left: 0;
}

/* 缩放还原按钮 */
.reset-zoom-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.reset-zoom-btn:hover {
  background: rgba(0, 0, 0, 0.85);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.reset-zoom-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.reset-zoom-btn svg {
  flex-shrink: 0;
}

/* 左上角快捷键提示 */
.shortcut-hint {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 10;
  font-size: 13px;
  font-weight: 500;
  color: #fff;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  pointer-events: none;
}

.animation-controls {
  padding: 6px 10px;
  background: hsla(0, 0%, 100%, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-top: 1px solid hsla(214.3, 31.8%, 91.4%, 0.3);
  display: flex;
  gap: 4px;
  align-items: center;
  flex-shrink: 0;
  position: relative;
  z-index: 10;
  overflow: hidden;
  min-height: 50px;
}

.btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
}

/* Fallback for browsers without backdrop-filter support */
@supports not (backdrop-filter: blur(12px)) {
  .animation-controls {
    background: hsla(0, 0%, 100%, 0.95);
  }
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

/* 轨迹管理控制 */
.trajectory-controls {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: 8px;
  padding-left: 8px;
  border-left: 1px solid #e5e7eb;
}

.trajectory-count {
  font-size: 11px;
  color: #666;
  white-space: nowrap;
  padding: 0 4px;
}

.btn-save {
  min-width: 70px;
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 频闪控制 */
.stroboscopic-info {
  font-size: 11px;
  color: #666;
  white-space: nowrap;
}

/* 环境控制 */
.environment-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 8px;
  padding-left: 8px;
  border-left: 1px solid #e5e7eb;
}

.environment-selector {
  display: flex;
  align-items: center;
  gap: 4px;
}

.environment-selector label {
  font-size: 11px;
  color: #666;
  white-space: nowrap;
}

.env-select {
  font-size: 11px;
  padding: 2px 6px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: #f9fafb;
  cursor: pointer;
}

.env-select:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.btn-secondary.active {
  background: #006644;
  color: #fff;
}

/* 底部三栏面板 */
.bottom-panel-columns {
  padding: 8px 12px;
  background: hsla(0, 0%, 100%, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-top: 1px solid hsla(214.3, 31.8%, 91.4%, 0.3);
  display: flex;
  gap: 8px;
  flex: 1;
  position: relative;
  z-index: 10;
  min-height: 80px;
  overflow: hidden;
}

/* Fallback for browsers without backdrop-filter support */
@supports not (backdrop-filter: blur(12px)) {
  .bottom-panel-columns {
    background: hsla(0, 0%, 100%, 0.95);
  }
}

/* 每一列的样式 */
.panel-column {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  border-right: 1px solid hsla(214.3, 31.8%, 91.4%, 0.5);
}

.panel-column:last-child {
  border-right: none;
}

/* 列头 */
.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px;
  background: hsla(214.3, 31.8%, 91.4%, 0.3);
  border-radius: 4px;
  margin-bottom: 8px;
}

.column-header h4 {
  font-size: 12px;
  color: #006644;
  font-weight: bold;
  margin: 0;
}

.column-close-btn {
  background: none;
  border: none;
  font-size: 18px;
  color: #666;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.column-close-btn:hover {
  background: hsla(0, 0%, 0%, 0.05);
  color: #333;
}

/* 左栏：核心公式 */
.left-column .formula-section {
  flex: 1;
  overflow-y: auto;
  padding: 4px;
}

/* 中栏：实时结果 */
.center-column .results-section {
  flex: 1;
  overflow-y: auto;
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 12px;
}

.result-label {
  color: #666;
  font-weight: 500;
}

.result-value {
  color: #333;
  font-weight: bold;
  font-family: 'Courier New', monospace;
}

/* 右栏：可视化 */
.right-column .visualization-section {
  flex: 1;
  overflow-y: auto;
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.formula-section h3 {
  font-size: 12px;
  color: #006644;
  font-weight: bold;
  margin-bottom: 4px;
}

.formula-block {
  text-align: center;
  margin: 2px 0;
  font-size: 12px;
  line-height: 1.4;
}

.gauge-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 4px;
  transition: all 0.2s ease;
}

.gauge-card--full {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.gauge-card--full > * {
  flex: 1;
  min-height: 0;
}

.gauge-card:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.dashboard-section h3 {
  font-size: 12px;
  color: #006644;
  font-weight: bold;
  margin-bottom: 4px;
}

/* Legacy styles for compatibility */
.formula-display {
  /* Deprecated, use .bottom-panel-columns instead */
}

.formula-section {
  /* Deprecated */
}

.dashboard-section {
  /* Deprecated */
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
