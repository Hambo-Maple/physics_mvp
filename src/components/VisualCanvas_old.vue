<template>
  <div class="visual-container">
    <!-- 平抛运动可视化 -->
    <ProjectileMotion
      v-if="state.currentVisualType === 'PROJECTILE'"
      ref="projectileMotionRef"
      :initialV0="state.projectileParams.v0"
      :initialG="state.projectileParams.g"
      :initialH="state.projectileParams.h"
      :initialTheta="state.projectileParams.theta"
    />

    <!-- 默认可视化区域 -->
    <template v-else>
      <!-- 顶部状态栏 -->
      <div class="visual-status">
        {{ statusText }}
      </div>

      <!-- 中心画布区域 -->
      <div class="visual-canvas">
        <div id="canvas-mount-point">
          <p class="canvas-placeholder">{{ placeholderText }}</p>
        </div>
      </div>

      <!-- 底部控制区 -->
      <div class="visual-controls">
        <button class="btn btn-primary btn-reset" @click="resetCanvas">
          重置画布
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import state, { updateVisualType } from '../store';
import ProjectileMotion from './ProjectileMotion.vue';
import '../assets/VisualCanvas.css';

// 状态栏文字
const statusText = ref('当前模式 - 未选择可视化');

// 画布占位提示文字
const placeholderText = ref('可视化画布已准备就绪');

// ProjectileMotion 组件引用
const projectileMotionRef = ref(null);

/**
 * 更新画布内容
 * 根据传入的可视化类型更新状态栏和占位提示
 *
 * @param {String} type - 可视化类型：'PROJECTILE'
 */
const updateCanvas = (type) => {
  if (type === 'PROJECTILE') {
    statusText.value = '当前模式 - 平抛运动';
    // ProjectileMotion 组件会自动渲染
  }
};

/**
 * 重置画布
 * 清空画布内容，恢复默认状态
 */
const resetCanvas = () => {
  statusText.value = '当前模式 - 未选择可视化';
  placeholderText.value = '可视化画布已准备就绪';

  // 清空全局状态中的可视化类型
  updateVisualType('');
};

// 暴露方法供父组件调用
defineExpose({
  updateCanvas,
  projectileMotionRef
});
</script>
