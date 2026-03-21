<template>
  <div class="energy-gauge">
    <div class="energy-bars">
      <!-- Kinetic Energy Bar -->
      <div class="energy-bar-container">
        <div class="energy-bar-label">
          <span class="energy-symbol">Ek</span>
          <span class="energy-name">Kinetic</span>
        </div>
        <div class="energy-bar-track">
          <div
            class="energy-bar-fill kinetic"
            :style="{ height: kineticPercentage + '%' }"
          >
            <span class="energy-value">{{ kineticEnergy.toFixed(2) }} J</span>
          </div>
        </div>
      </div>

      <!-- Potential Energy Bar -->
      <div class="energy-bar-container">
        <div class="energy-bar-label">
          <span class="energy-symbol">Ep</span>
          <span class="energy-name">Potential</span>
        </div>
        <div class="energy-bar-track">
          <div
            class="energy-bar-fill potential"
            :style="{ height: potentialPercentage + '%' }"
          >
            <span class="energy-value">{{ potentialEnergy.toFixed(2) }} J</span>
          </div>
        </div>
      </div>

      <!-- Total Energy Bar -->
      <div class="energy-bar-container">
        <div class="energy-bar-label">
          <span class="energy-symbol">E</span>
          <span class="energy-name">Total</span>
        </div>
        <div class="energy-bar-track">
          <div
            class="energy-bar-fill total"
            :style="{ height: totalPercentage + '%' }"
          >
            <span class="energy-value">{{ totalEnergy.toFixed(2) }} J</span>
          </div>
        </div>
      </div>

      <!-- Lost Energy Bar（仅有空气阻力时显示） -->
      <div class="energy-bar-container" v-if="isDragEnabled">
        <div class="energy-bar-label">
          <span class="energy-symbol">El</span>
          <span class="energy-name">Lost</span>
        </div>
        <div class="energy-bar-track">
          <div
            class="energy-bar-fill lost"
            :style="{ height: lostPercentage + '%' }"
          >
            <span class="energy-value">{{ lostEnergy.toFixed(2) }} J</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 无阻力：能量守恒标识 -->
    <div class="conservation-indicator" v-if="isConserved && !isDragEnabled">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="8" stroke="#4ade80" stroke-width="2" fill="none"/>
        <path d="M 6 10 L 9 13 L 14 7" stroke="#4ade80" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span>Energy Conserved</span>
    </div>

    <!-- 有阻力：能量损耗标识 -->
    <div class="drag-indicator" v-if="isDragEnabled">
      <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="8" stroke="#ef4444" stroke-width="2" fill="none"/>
        <path d="M10 6v4M10 14h.01" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <span>Energy Lost to Drag</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  kineticEnergy: { type: Number, default: 0 },
  potentialEnergy: { type: Number, default: 0 },
  totalEnergy: { type: Number, default: 0 },
  maxEnergy: { type: Number, default: 1000 },
  isConserved: { type: Boolean, default: true },
  isDragEnabled: { type: Boolean, default: false },
  lostEnergy: { type: Number, default: 0 }
});

const kineticPercentage = computed(() =>
  Math.min((props.kineticEnergy / props.maxEnergy) * 100, 100)
);
const potentialPercentage = computed(() =>
  Math.min((props.potentialEnergy / props.maxEnergy) * 100, 100)
);
const totalPercentage = computed(() =>
  Math.min((props.totalEnergy / props.maxEnergy) * 100, 100)
);
const lostPercentage = computed(() =>
  Math.min((props.lostEnergy / props.maxEnergy) * 100, 100)
);
</script>

<style scoped>
.energy-gauge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 8px;
  height: 100%;
  box-sizing: border-box;
}

.energy-bars {
  display: flex;
  gap: 20px;
  align-items: flex-end;
  flex: 1;
  min-height: 0;
}

.energy-bar-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  height: 100%;
}

.energy-bar-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.energy-symbol {
  font-size: 15px;
  font-weight: bold;
  font-family: 'Times New Roman', serif;
  font-style: italic;
}

.energy-name {
  font-size: 11px;
  color: #666;
}

.energy-bar-track {
  width: 44px;
  flex: 1;
  min-height: 0;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  position: relative;
  overflow: hidden;
}

.energy-bar-fill {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 4px;
  transition: height 0.3s ease-out;
  border-radius: 0 0 4px 4px;
}

.energy-bar-fill.kinetic {
  background: linear-gradient(to top, #f97316, #fb923c);
}

.energy-bar-fill.potential {
  background: linear-gradient(to top, #3b82f6, #60a5fa);
}

.energy-bar-fill.total {
  background: linear-gradient(to top, #22c55e, #4ade80);
}

.energy-bar-fill.lost {
  background: linear-gradient(to top, #dc2626, #f87171);
}

.energy-value {
  font-size: 10px;
  font-weight: bold;
  color: #333;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
  writing-mode: horizontal-tb;
}

.conservation-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 12px;
  font-size: 11px;
  color: #166534;
  font-weight: 500;
}

.drag-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  font-size: 11px;
  color: #991b1b;
  font-weight: 500;
}

.conservation-indicator svg {
  flex-shrink: 0;
  width: 14px;
  height: 14px;
}
</style>
