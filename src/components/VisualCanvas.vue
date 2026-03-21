<template>
  <div class="flex flex-col h-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
    <!-- 平抛运动可视化 -->
    <template v-if="state.currentVisualType === 'PROJECTILE'">
      <!-- PROJECTILE 模式顶部状态栏 -->
      <div class="p-5 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="bg-gradient-to-br from-purple-100 to-pink-100 w-10 h-10 rounded-xl flex items-center justify-center">
              <Zap class="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 class="text-gray-800 font-medium">平抛运动演示</h3>
              <p class="text-xs text-gray-500">Projectile Motion Simulation</p>
            </div>
          </div>
          <div class="flex gap-2">
            <button
              @click="resetCanvas"
              class="flex items-center gap-1 px-3 py-1.5 text-sm rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <RotateCcw class="w-4 h-4" />
              重置
            </button>
            <button
              @click="onClose"
              class="flex items-center gap-1 px-3 py-1.5 text-sm rounded-xl border border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
            >
              <X class="w-4 h-4" />
              关闭
            </button>
          </div>
        </div>
      </div>

      <ProjectileMotion
        ref="projectileMotionRef"
        class="flex-1"
        :initialV0="state.projectileParams.v0"
        :initialG="state.projectileParams.g"
        :initialH="state.projectileParams.h"
        :initialTheta="state.projectileParams.theta"
      />
    </template>

    <!-- 默认可视化区域 -->
    <template v-else>
      <!-- 顶部状态栏 -->
      <div class="p-5 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium text-gray-700">{{ statusText }}</p>
          <button
            @click="onToggleChat"
            class="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
            :title="isChatOpen ? '关闭对话框' : '打开对话框'"
          >
            <Minimize2 v-if="isChatOpen" class="w-4 h-4" />
            <Maximize2 v-else class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- 中心画布区域 -->
      <div class="flex-1 flex items-center justify-center p-6">
        <div id="canvas-mount-point" class="text-center">
          <p class="text-lg text-gray-400">{{ placeholderText }}</p>
        </div>
      </div>

      <!-- 底部控制区 -->
      <div class="p-5 bg-white/80 backdrop-blur-sm border-t border-gray-100">
        <button
          @click="resetCanvas"
          class="flex items-center gap-1 px-3 py-1.5 text-sm rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <RotateCcw class="w-4 h-4" />
          重置画布
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { Zap, RotateCcw, X, Minimize2, Maximize2 } from 'lucide-vue-next';
import state, { updateVisualType } from '../store';
import ProjectileMotion from './ProjectileMotion.vue';

// Props - 面板控制回调
const props = defineProps({
  onClose: {
    type: Function,
    default: () => {}
  },
  onToggleChat: {
    type: Function,
    default: () => {}
  },
  isChatOpen: {
    type: Boolean,
    default: true
  }
});

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
 * @param {String} type - 可视化类型：'PROJECTILE' 或空字符串
 */
const updateCanvas = (type) => {
  if (type === 'PROJECTILE') {
    statusText.value = '当前模式 - 平抛运动';
    placeholderText.value = '可视化画布已准备就绪';
  } else {
    statusText.value = '当前模式 - 未选择可视化';
    placeholderText.value = '可视化画布已准备就绪';
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
