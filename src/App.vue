<template>
  <div class="flex h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
    <PanelGroup direction="horizontal">
      <!-- 左侧面板：ChatBox -->
      <Panel
        v-if="isChatOpen"
        :default-size="isCanvasOpen ? 30 : 95"
        :min-size="20"
        :max-size="isCanvasOpen ? 50 : 95"
      >
        <div class="flex flex-row h-full overflow-hidden">
          <ConversationSidebar
            :is-open="sidebarOpen"
            @toggle="sidebarOpen = !sidebarOpen"
            @new-conversation="handleNewConversation"
            @load-conversation="handleLoadConversation"
          />
          <div class="flex-1 min-w-0">
            <ChatBox
              :visualCanvasRef="visualCanvasRef"
              :on-toggle-canvas="handleToggleCanvas"
              :is-canvas-open="isCanvasOpen"
              :on-close="() => isChatOpen = false"
            />
          </div>
        </div>
      </Panel>

      <!-- 拖拽手柄（两个面板都打开时显示） -->
      <PanelResizeHandle
        v-if="isChatOpen && isCanvasOpen"
        class="w-1 bg-gray-200 hover:bg-blue-400 transition-colors relative group"
      >
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-12 bg-gray-300 rounded-full group-hover:bg-blue-500 transition-colors" />
      </PanelResizeHandle>

      <!-- 右侧面板：VisualCanvas -->
      <Panel v-if="isCanvasOpen">
        <VisualCanvas
          ref="visualCanvasRef"
          :on-close="() => isCanvasOpen = false"
          :on-toggle-chat="handleToggleChat"
          :is-chat-open="isChatOpen"
        />
      </Panel>
    </PanelGroup>

    <!-- 浮动按钮：打开对话框 -->
    <button
      v-if="!isChatOpen"
      @click="isChatOpen = true"
      class="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg transition-all"
    >
      <MessageSquare class="w-5 h-5" />
      打开对话框
    </button>

    <!-- 浮动按钮：打开画布 -->
    <button
      v-if="!isCanvasOpen"
      @click="isCanvasOpen = true"
      class="fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-lg transition-all"
    >
      <Zap class="w-5 h-5" />
      打开画布
    </button>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { PanelGroup, Panel, PanelResizeHandle } from 'vue-resizable-panels';
import { MessageSquare, Zap } from 'lucide-vue-next';
import ChatBox from './components/ChatBox.vue';
import VisualCanvas from './components/VisualCanvas.vue';
import ConversationSidebar from './components/ConversationSidebar.vue';
import state, { createNewConversation, loadConversation, updateVisualType } from './store';

// 获取 VisualCanvas 组件的引用
const visualCanvasRef = ref(null);

// 面板显示状态
const isChatOpen = ref(true);
const isCanvasOpen = ref(true);
const sidebarOpen = ref(true);

// 切换画布面板
const handleToggleCanvas = () => {
  isCanvasOpen.value = !isCanvasOpen.value;
};

// 切换对话面板
const handleToggleChat = () => {
  isChatOpen.value = !isChatOpen.value;
};

// 新建对话
const handleNewConversation = () => {
  createNewConversation();  // 已在 store 中重置 currentVisualType
  // 同步更新 VisualCanvas UI 状态
  if (visualCanvasRef.value) {
    visualCanvasRef.value.updateCanvas('');
  }
};

// 加载历史对话
const handleLoadConversation = (id) => {
  loadConversation(id);
  // 恢复可视化
  if (visualCanvasRef.value && state.currentVisualType) {
    visualCanvasRef.value.updateCanvas(state.currentVisualType);
  } else if (visualCanvasRef.value) {
    visualCanvasRef.value.updateCanvas('');
  }
};

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
