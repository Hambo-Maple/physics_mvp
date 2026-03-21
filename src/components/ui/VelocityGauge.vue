<template>
  <div class="velocity-gauge">
    <svg viewBox="0 0 200 120" class="gauge-svg">
      <!-- Background arc -->
      <path
        d="M 20 100 A 80 80 0 0 1 180 100"
        fill="none"
        stroke="#e0e0e0"
        stroke-width="20"
        stroke-linecap="round"
      />

      <!-- Colored arc segments -->
      <path
        d="M 20 100 A 80 80 0 0 1 73.92 35.28"
        fill="none"
        stroke="#4ade80"
        stroke-width="20"
        stroke-linecap="round"
        class="gauge-segment"
      />
      <path
        d="M 73.92 35.28 A 80 80 0 0 1 126.08 35.28"
        fill="none"
        stroke="#facc15"
        stroke-width="20"
        stroke-linecap="round"
        class="gauge-segment"
      />
      <path
        d="M 126.08 35.28 A 80 80 0 0 1 180 100"
        fill="none"
        stroke="#f87171"
        stroke-width="20"
        stroke-linecap="round"
        class="gauge-segment"
      />

      <!-- Value arc -->
      <path
        :d="valueArcPath"
        fill="none"
        :stroke="valueColor"
        stroke-width="16"
        stroke-linecap="round"
        class="gauge-value"
        :style="{ transition: 'all 0.3s ease-out' }"
      />

      <!-- Needle -->
      <line
        :x1="100"
        y1="100"
        :x2="needleX"
        :y2="needleY"
        :stroke="valueColor"
        stroke-width="3"
        stroke-linecap="round"
        class="gauge-needle"
        :style="{ transition: 'all 0.3s ease-out' }"
      />

      <!-- Center circle -->
      <circle
        cx="100"
        cy="100"
        r="8"
        :fill="valueColor"
        class="gauge-center"
      />

      <!-- Value text -->
      <text
        x="100"
        y="85"
        text-anchor="middle"
        class="gauge-value-text"
        font-size="24"
        font-weight="bold"
        :fill="valueColor"
      >
        {{ displayValue }}
      </text>

      <!-- Label -->
      <text
        x="100"
        y="115"
        text-anchor="middle"
        class="gauge-label"
        font-size="12"
        fill="#666"
      >
        Velocity (m/s)
      </text>
    </svg>

    <!-- Range indicators -->
    <div class="gauge-ranges">
      <div class="range-item">
        <div class="range-color" style="background: #4ade80;"></div>
        <span class="range-label">Low: 0-{{ (maxVelocity * 0.33).toFixed(0) }}</span>
      </div>
      <div class="range-item">
        <div class="range-color" style="background: #facc15;"></div>
        <span class="range-label">Med: {{ (maxVelocity * 0.33).toFixed(0) }}-{{ (maxVelocity * 0.66).toFixed(0) }}</span>
      </div>
      <div class="range-item">
        <div class="range-color" style="background: #f87171;"></div>
        <span class="range-label">High: {{ (maxVelocity * 0.66).toFixed(0) }}-{{ maxVelocity.toFixed(0) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';

const props = defineProps({
  velocity: {
    type: Number,
    default: 0
  },
  maxVelocity: {
    type: Number,
    default: 50
  }
});

// Current display value for smooth animation
const displayValue = ref(props.velocity.toFixed(1));

// Needle position
const needleX = ref(100);
const needleY = ref(100);

// Update animation loop
let animationFrame = null;

const animateNeedle = (targetValue) => {
  const centerX = 100;
  const centerY = 100;
  const radius = 70;

  // Calculate angle (from 180° to 0°)
  const percentage = Math.min(targetValue / props.maxVelocity, 1);
  const angle = Math.PI - (percentage * Math.PI);

  // Calculate needle position
  const x = centerX + radius * Math.cos(angle);
  const y = centerY - radius * Math.sin(angle);

  needleX.value = x;
  needleY.value = y;
  displayValue.value = targetValue.toFixed(1);
};

// Computed properties
const percentage = computed(() => {
  return Math.min(props.velocity / props.maxVelocity, 1);
});

const valueColor = computed(() => {
  if (percentage.value < 0.33) return '#4ade80'; // green
  if (percentage.value < 0.66) return '#facc15'; // yellow
  return '#f87171'; // red
});

const valueArcPath = computed(() => {
  const centerX = 100;
  const centerY = 100;
  const radius = 80;

  const startAngle = Math.PI; // 180° (left)
  const endAngle = Math.PI - (percentage.value * Math.PI);

  const startX = centerX + radius * Math.cos(startAngle);
  const startY = centerY - radius * Math.sin(startAngle);
  const endX = centerX + radius * Math.cos(endAngle);
  const endY = centerY - radius * Math.sin(endAngle);

  return `M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`;
});

// Watch for velocity changes
watch(() => props.velocity, (newVal) => {
  animateNeedle(newVal);
}, { immediate: true });

onMounted(() => {
  animateNeedle(props.velocity);
});
</script>

<style scoped>
.velocity-gauge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.gauge-svg {
  width: 160px;
  height: 90px;
}

.gauge-value {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.gauge-needle {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.gauge-value-text {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
}

.gauge-ranges {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.range-item {
  display: flex;
  align-items: center;
  gap: 3px;
}

.range-color {
  width: 8px;
  height: 8px;
  border-radius: 2px;
}

.range-label {
  font-size: 9px;
  color: #666;
}
</style>
