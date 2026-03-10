<template>
  <div class="visual-container">
    <!-- 平抛运动可视化 -->
    <ProjectileMotion
      v-if="state.currentVisualType === 'PROJECTILE'"
      :initialV0="state.projectileParams.v0"
      :initialG="state.projectileParams.g"
      :initialH="state.projectileParams.h"
      :initialTheta="state.projectileParams.theta"
    />

    <!-- 原有可视化区域 -->
    <template v-else>
      <!-- 顶部状态栏 -->
      <div class="visual-status">
        {{ statusText }}
      </div>

      <!-- 中心画布区域 -->
      <div class="visual-canvas">
        <div id="canvas-mount-point">
          <p class="canvas-placeholder">{{ placeholderText }}</p>
          <!-- 公式渲染容器 -->
          <div id="formula-container" ref="formulaContainerRef"></div>
        </div>
      </div>

      <!-- 底部控制区 -->
      <div class="visual-controls">
        <button class="btn btn-primary btn-reset" @click="resetCanvas">
          重置画布
        </button>
        <button
          v-if="state.currentVisualType === 'FORMULA'"
          class="btn btn-primary"
          @click="switchFormula"
        >
          切换公式
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue';
import state, { updateVisualType, nextFormula, formulaList } from '../store';
import { renderMathInElement } from '../utils/katex';
import ProjectileMotion from './ProjectileMotion.vue';
import '../assets/VisualCanvas.css';

// 状态栏文字
const statusText = ref('当前模式 - 未选择可视化');

// 画布占位提示文字
const placeholderText = ref('可视化画布已准备就绪');

// 公式容器引用
const formulaContainerRef = ref(null);

/**
 * 渲染公式到容器
 * @param {String} formulaContent - 公式内容（LaTeX 格式）
 */
const renderFormula = (formulaContent) => {
  if (!formulaContainerRef.value) return;

  // 设置公式内容
  formulaContainerRef.value.innerHTML = formulaContent;

  // 使用 nextTick 确保 DOM 更新后再渲染
  nextTick(() => {
    renderMathInElement(formulaContainerRef.value);
  });
};

/**
 * 更新画布内容
 * 根据传入的可视化类型更新状态栏和占位提示
 *
 * 可视化渲染入口：
 * 1. 后续可引入 p5.js，在 canvas-mount-point 中初始化画布
 * 2. 根据 type 渲染对应内容：PROJECTILE=平抛运动，FORMULA=物理公式
 * 3. 公式渲染使用 KaTeX，在 formula-container 中显示
 *
 * @param {String} type - 可视化类型：'PROJECTILE' | 'FORMULA'
 */
const updateCanvas = (type) => {
  if (type === 'PROJECTILE') {
    statusText.value = '当前模式 - 平抛运动';
    // ProjectileMotion 组件会自动渲染
  } else if (type === 'FORMULA') {
    statusText.value = '当前模式 - 物理公式';
    placeholderText.value = '物理公式画布已准备就绪';

    // 渲染默认公式（第一个公式）
    const currentFormula = formulaList[state.currentFormulaIndex];
    renderFormula(currentFormula.content);
  }
};

/**
 * 切换公式
 * 在可视化区域切换显示不同的微积分公式
 */
const switchFormula = () => {
  // 切换到下一个公式
  nextFormula();

  // 获取当前公式并渲染
  const currentFormula = formulaList[state.currentFormulaIndex];
  statusText.value = `当前模式 - ${currentFormula.name}`;
  renderFormula(currentFormula.content);
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

  // 清空公式容器
  if (formulaContainerRef.value) {
    formulaContainerRef.value.innerHTML = '';
  }

  // 重置公式索引
  state.currentFormulaIndex = 0;
};

// 暴露方法供父组件调用
defineExpose({
  updateCanvas
});
</script>
