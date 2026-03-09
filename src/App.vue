<template>
  <div class="app-container">
    <!-- 左侧：对话区域 (30%) -->
    <div class="chat-section">
      <ChatBox />
    </div>

    <!-- 右侧：可视化区域 (70%) -->
    <div class="visual-section">
      <VisualCanvas ref="visualCanvasRef" />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import ChatBox from './components/ChatBox.vue';
import VisualCanvas from './components/VisualCanvas.vue';
import state from './store';

// 获取 VisualCanvas 组件的引用
const visualCanvasRef = ref(null);

/**
 * 监听全局状态中的 currentVisualType 变化
 * 当检测到变化时，调用 VisualCanvas 组件的 updateCanvas 方法
 * 实现对话与可视化的联动机制
 */
watch(
  () => state.currentVisualType,
  (newType) => {
    if (visualCanvasRef.value && newType) {
      visualCanvasRef.value.updateCanvas(newType);
    }
  }
);
</script>

<style scoped>
/* 整体容器：100vh 高度，禁止溢出 */
.app-container {
  width: 100%;
  height: 100vh;
  display: flex;
  overflow: hidden;
}

/* 左侧对话区域：30% 宽度 */
.chat-section {
  width: 30%;
  height: 100%;
  border-right: 1px solid var(--color-border);
}

/* 右侧可视化区域：70% 宽度 */
.visual-section {
  width: 70%;
  height: 100%;
}
</style>
