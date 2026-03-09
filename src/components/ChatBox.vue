<template>
  <div class="chatbox-container">
    <!-- Toast 提示 -->
    <div v-if="toastMessage" :class="['toast', toastType]">
      {{ toastMessage }}
    </div>

    <!-- 标题栏 -->
    <div class="chatbox-header">
      物理可视化助手
    </div>

    <!-- 消息流区域 -->
    <div class="chatbox-messages" ref="messagesRef">
      <div
        v-for="message in state.messageList"
        :key="message.id"
        :class="['message-item', message.role]"
      >
        <div class="message-bubble" v-html="message.content"></div>
        <!-- 流式输出光标 -->
        <span v-if="state.isGenerating && state.currentMessageId === message.id" class="typing-cursor"></span>
        <div class="message-time">{{ message.time }}</div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="chatbox-input">
      <textarea
        v-model="inputValue"
        placeholder="输入消息..."
        @keydown.enter.prevent="sendMessage"
        :disabled="state.isGenerating || voiceState !== 'idle'"
      ></textarea>
      <button
        class="btn btn-voice"
        :class="{
          'recording': voiceState === 'recording',
          'recognizing': voiceState === 'recognizing',
          'loading': voiceState === 'recording' || voiceState === 'recognizing'
        }"
        @click="startVoiceRecognition"
        :disabled="state.isGenerating || voiceState === 'recognizing'"
      >
        {{ voiceState === 'recording' ? '正在录音...' : voiceState === 'recognizing' ? '正在识别...' : '语音输入' }}
      </button>
      <button class="btn btn-primary btn-send" @click="sendMessage" :disabled="state.isGenerating || voiceState !== 'idle'">
        发送
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue';
import state, { addMessage, updateVisualType, setGenerating, updateMessageContent } from '../store';
import { parseTriggerFromReply } from '../utils/zhipuClient';
import { renderMathToHTML } from '../utils/katex';
import { formatPhysicsAnswer } from '../utils/textFormatter';
import { createStreamRequest } from '../utils/streamHandler';
import {
  checkMediaRecorderSupport,
  startRecording,
  stopRecording,
  blobToBase64,
  getAudioFormat,
  recognizeVoice
} from '../utils/voice';
import '../assets/ChatBox.css';

// 输入框绑定值
const inputValue = ref('');

// 语音识别状态
const voiceState = ref('idle'); // 'idle' | 'recording' | 'recognizing'
const isRecording = ref(false);

// Toast 提示状态
const toastMessage = ref('');
const toastType = ref('success'); // 'success' | 'error'
let toastTimer = null;

/**
 * 显示 Toast 提示
 * @param {string} message - 提示消息
 * @param {string} type - 提示类型（success/error）
 */
const showToast = (message, type = 'success') => {
  toastMessage.value = message;
  toastType.value = type;

  // 清除之前的定时器
  if (toastTimer) {
    clearTimeout(toastTimer);
  }

  // 3 秒后自动消失
  toastTimer = setTimeout(() => {
    toastMessage.value = '';
  }, 3000);
};

/**
 * 语音输入按钮点击事件
 * 第一次点击：开始录音
 * 第二次点击：停止录音并识别
 */
const startVoiceRecognition = async () => {
  // 空闲状态：开始录音
  if (voiceState.value === 'idle') {
    try {
      await startRecording();
      voiceState.value = 'recording';
      isRecording.value = true;
    } catch (error) {
      showToast(error.message, 'error');
    }
  }
  // 录音中：停止录音并识别
  else if (voiceState.value === 'recording') {
    try {
      voiceState.value = 'recognizing';
      isRecording.value = false;

      // 停止录音
      const audioBlob = await stopRecording();

      // 转换为 Base64
      const audioBase64 = await blobToBase64(audioBlob);
      const format = getAudioFormat(audioBlob);

      // 调用识别接口
      const text = await recognizeVoice(audioBase64, format);

      // 识别成功：填充输入框并自动发送
      inputValue.value = text;
      voiceState.value = 'idle';

      // 自动发送消息
      await sendMessage();

    } catch (error) {
      voiceState.value = 'idle';
      showToast(error.message, 'error');
    }
  }
};

// 组件挂载时检查浏览器支持
onMounted(() => {
  if (!checkMediaRecorderSupport()) {
    showToast('您的浏览器不支持语音输入', 'error');
  }
});

// 消息流容器引用
const messagesRef = ref(null);

/**
 * 发送消息
 * 1. 生成用户消息对象并添加到消息列表
 * 2. 清空输入框
 * 3. 滚动消息流到底部
 * 4. 创建空的 AI 消息占位
 * 5. 启动流式输出
 */
const sendMessage = async () => {
  const content = inputValue.value.trim();
  if (!content) return;

  // 生成用户消息
  const userMessage = {
    id: Date.now() + Math.random(),
    role: 'user',
    content: content,
    time: getCurrentTime()
  };

  // 添加到消息列表
  addMessage(userMessage);

  // 清空输入框
  inputValue.value = '';

  // 滚动到底部
  scrollToBottom();

  // 创建空的 AI 消息占位
  const aiMessageId = Date.now() + Math.random();
  const aiMessage = {
    id: aiMessageId,
    role: 'ai',
    content: '',
    time: getCurrentTime()
  };
  addMessage(aiMessage);

  // 设置流式输出状态
  setGenerating(true, aiMessageId);

  // 滚动到底部
  scrollToBottom();

  // 格式化历史消息
  const recentMessages = state.messageList
    .slice(-10)
    .filter(msg => msg.id !== aiMessageId) // 排除刚创建的占位消息
    .map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));

  let fullText = '';

  // 启动流式请求
  createStreamRequest(
    content,
    recentMessages,
    // onChunk: 接收到数据块
    (delta) => {
      fullText += delta;
      updateMessageContent(aiMessageId, fullText);
      scrollToBottom();
    },
    // onComplete: 流式完成
    (completeText) => {
      console.log('流式输出完成，完整文本:', completeText);

      // 解析触发标记
      const { content: displayContent, trigger } = parseTriggerFromReply(completeText);

      // 应用格式化和公式渲染
      const formattedContent = formatPhysicsAnswer(displayContent);
      const renderedContent = renderMathToHTML(formattedContent);

      // 更新消息内容
      updateMessageContent(aiMessageId, renderedContent);

      // 结束流式输出状态
      setGenerating(false, null);

      // 滚动到底部
      scrollToBottom();

      // 如果有触发标记，更新可视化类型
      if (trigger) {
        updateVisualType(trigger);
      }
    },
    // onError: 错误处理
    (error) => {
      console.error('流式输出失败:', error);

      // 移除占位消息
      const messageIndex = state.messageList.findIndex(msg => msg.id === aiMessageId);
      if (messageIndex !== -1) {
        state.messageList.splice(messageIndex, 1);
      }

      // 添加错误消息
      const errorMessage = {
        id: Date.now() + Math.random(),
        role: 'ai',
        content: `抱歉，${error.message || 'AI 服务暂时不可用，请稍后再试'}`,
        time: getCurrentTime()
      };
      addMessage(errorMessage);

      // 结束流式输出状态
      setGenerating(false, null);

      scrollToBottom();
    }
  );
};

/**
 * 获取当前时间（格式：HH:MM）
 * @returns {String} - 格式化的时间字符串
 */
const getCurrentTime = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * 滚动消息流到底部
 */
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
    }
  });
};
</script>
