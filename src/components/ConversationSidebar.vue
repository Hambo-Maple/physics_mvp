<template>
  <div class="sidebar-wrapper" :class="{ collapsed: !isOpen }">
    <!-- 确认删除弹窗 -->
    <div v-if="confirmId !== null" class="confirm-overlay" @click.self="confirmId = null">
      <div class="confirm-box">
        <p>确定删除这条对话记录吗？</p>
        <div class="confirm-actions">
          <button class="confirm-cancel" @click="confirmId = null">取消</button>
          <button class="confirm-ok" @click="doDelete">删除</button>
        </div>
      </div>
    </div>

    <!-- 侧边栏内容 -->
    <div v-show="isOpen" class="sidebar-content">
      <!-- 新建对话按钮 -->
      <button class="new-conv-btn" @click="$emit('new-conversation')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        新建对话
      </button>

      <!-- 历史对话列表 -->
      <div class="conv-list">
        <div v-if="state.conversationHistory.length === 0" class="conv-empty">
          暂无历史对话
        </div>
        <div
          v-for="conv in state.conversationHistory"
          :key="conv.id"
          class="conv-item"
          @click="$emit('load-conversation', conv.id)"
        >
          <div class="conv-main">
            <div class="conv-title">{{ conv.title }}</div>
            <div class="conv-preview">{{ conv.preview }}</div>
            <div class="conv-time">{{ conv.time }}</div>
          </div>
          <button
            class="delete-btn"
            @click.stop="confirmDelete(conv.id)"
            title="删除对话"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14H6L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4h6v2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 折叠/展开按钮 -->
    <button class="toggle-btn" @click="$emit('toggle')" :title="isOpen ? '收起侧边栏' : '展开侧边栏'">
      <svg
        width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2"
        :style="{ transform: isOpen ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.2s' }"
      >
        <polyline points="15 18 9 12 15 6"/>
      </svg>
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import state, { deleteConversation } from '../store';

defineProps({
  isOpen: { type: Boolean, default: true }
});

const emit = defineEmits(['toggle', 'new-conversation', 'load-conversation']);

// 确认删除状态：null = 未激活，'current' = 删除当前，数字 = 删除历史某条
const confirmId = ref(null);

const confirmDelete = (id) => {
  confirmId.value = id;
};

const doDelete = () => {
  deleteConversation(confirmId.value);
  confirmId.value = null;
};
</script>

<style scoped>
.sidebar-wrapper {
  display: flex;
  flex-direction: row;
  height: 100%;
  flex-shrink: 0;
  transition: width 0.2s ease;
  width: 220px;
  border-right: 1px solid #c7d2fe;
  background: linear-gradient(to bottom, #eff6ff, #eef2ff);
  backdrop-filter: blur(12px);
  position: relative;
}

.sidebar-wrapper.collapsed {
  width: 28px;
}

.sidebar-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 10px 0;
}

.new-conv-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 4px 10px 6px;
  padding: 9px 14px;
  background: linear-gradient(to right, #3b82f6, #4f46e5);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 0.15s;
}

.new-conv-btn:hover {
  opacity: 0.9;
}

.conv-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 6px;
}

.conv-empty {
  font-size: 13px;
  color: #6366f1;
  text-align: center;
  padding: 20px 8px;
}

.conv-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 10px 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
  margin-bottom: 4px;
  border: 1px solid transparent;
}

.conv-item:hover {
  background: linear-gradient(to right, #dbeafe, #e0e7ff);
  border-color: #c7d2fe;
}

.conv-item:hover .delete-btn {
  opacity: 1;
}

.conv-main {
  flex: 1;
  min-width: 0;
}

.conv-title {
  font-size: 14px;
  font-weight: 600;
  color: #1e3a8a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.conv-preview {
  font-size: 12px;
  color: #4338ca;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 3px;
  opacity: 0.8;
}

.conv-time {
  font-size: 11px;
  color: #6366f1;
  margin-top: 3px;
  opacity: 0.7;
}

.delete-btn {
  opacity: 0;
  flex-shrink: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #ef4444;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  transition: opacity 0.15s, background 0.15s;
}

.delete-btn:hover {
  background: #fee2e2;
}

.toggle-btn {
  position: absolute;
  right: -13px;
  top: 50%;
  transform: translateY(-50%);
  width: 22px;
  height: 40px;
  background: linear-gradient(to right, #3b82f6, #4f46e5);
  border: none;
  border-radius: 0 8px 8px 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  color: white;
  padding: 0;
  transition: opacity 0.15s;
  flex-shrink: 0;
}

.toggle-btn:hover {
  opacity: 0.85;
}

/* 确认弹窗 */
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
}

.confirm-box {
  background: white;
  border-radius: 12px;
  padding: 24px;
  width: 260px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

.confirm-box p {
  font-size: 15px;
  color: #1e293b;
  margin: 0 0 16px;
  text-align: center;
}

.confirm-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.confirm-cancel {
  padding: 8px 20px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  color: #64748b;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.15s;
}

.confirm-cancel:hover {
  background: #f1f5f9;
}

.confirm-ok {
  padding: 8px 20px;
  border: none;
  border-radius: 8px;
  background: #ef4444;
  color: white;
  font-size: 14px;
  cursor: pointer;
  transition: opacity 0.15s;
}

.confirm-ok:hover {
  opacity: 0.85;
}
</style>
