<template>
  <div class="chatbox-container">
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
        :disabled="state.isGenerating"
      ></textarea>
      <button class="btn btn-voice" @click="startVoiceRecognition" :disabled="state.isGenerating">
        {{ isRecording ? '正在识别...' : '语音输入' }}
      </button>
      <button class="btn btn-primary btn-send" @click="sendMessage" :disabled="state.isGenerating">
        发送
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue';
import state, { addMessage, updateVisualType, setGenerating, updateMessageContent } from '../store';
import { parseTriggerFromReply } from '../utils/zhipuClient';
import { renderMathToHTML } from '../utils/katex';
import { formatPhysicsAnswer } from '../utils/textFormatter';
import { createStreamRequest } from '../utils/streamHandler';
import '../assets/ChatBox.css';

// 输入框绑定值
const inputValue = ref('');

// 语音识别状态
const isRecording = ref(false);

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
 * 语音输入功能（预留接口）
 * TODO: Integrate Baidu Voice SDK
 *
 * 百度语音识别接入说明：
 * 1. 引入百度语音 Web SDK（需先申请 AppKey/SecretKey）
 * 2. 调用 SDK 录制音频并转换为文字
 * 3. 将识别结果赋值给 inputValue（输入框绑定的变量）
 * 4. 识别完成后重置按钮状态为"语音输入"
 */
const startVoiceRecognition = () => {
  // 切换录音状态
  isRecording.value = !isRecording.value;

  // TODO: 实际集成时，在此处调用百度语音 SDK
  // 示例伪代码：
  // if (isRecording.value) {
  //   baiduVoiceSDK.startRecording();
  // } else {
  //   const result = baiduVoiceSDK.stopRecording();
  //   inputValue.value = result.text;
  //   isRecording.value = false;
  // }
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
