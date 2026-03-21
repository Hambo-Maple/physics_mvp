<template>
  <div class="flex flex-col h-full bg-background">
    <!-- Toast 提示 -->
    <div
      v-if="toastMessage"
      :class="[
        'fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-white shadow-lg transition-opacity',
        toastType === 'success' ? 'bg-primary' : 'bg-destructive'
      ]"
    >
      {{ toastMessage }}
    </div>

    <!-- 标题栏 -->
    <div class="p-4 border-b border-border glass flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="bg-gradient-to-br from-blue-100 to-indigo-100 w-10 h-10 rounded-xl flex items-center justify-center">
          <MessageSquare class="w-5 h-5 text-blue-600" />
        </div>
        <h1 class="text-lg font-medium">物理可视化助手</h1>
      </div>
      <div class="flex items-center gap-1">
        <button
          @click="onClose"
          class="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
          title="关闭对话框"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- 连续语音状态栏 -->
    <div v-if="state.isContinuousMode" class="px-4 py-2 bg-muted border-b border-border flex items-center gap-3">
      <span class="text-sm text-muted-foreground">{{ continuousStatusText }}</span>
      <div class="flex items-center gap-1">
        <div
          v-for="i in 5"
          :key="i"
          class="w-1 bg-primary rounded-full transition-all"
          :style="{ height: waveformHeights[i - 1] + 'px' }"
        ></div>
      </div>
    </div>

    <!-- 消息流区域 -->
    <ScrollArea class="flex-1 p-4">
      <div ref="messagesRef" class="space-y-4">
        <div
          v-for="message in state.messageList"
          :key="message.id"
          :class="[
            'flex flex-col',
            message.role === 'user' ? 'items-end' : 'items-start'
          ]"
        >
          <div
            :class="[
              'max-w-[80%] rounded-2xl px-4 py-3 chat-message',
              message.role === 'user'
                ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                : 'bg-gray-50 text-gray-800 border border-gray-100'
            ]"
            v-html="message.content"
          ></div>
          <!-- 流式输出光标 -->
          <span
            v-if="state.isGenerating && state.currentMessageId === message.id"
            class="inline-block w-2 h-4 ml-1 bg-foreground animate-pulse"
          ></span>
          <div class="text-xs text-muted-foreground mt-1">{{ message.time }}</div>
        </div>
      </div>
    </ScrollArea>

    <!-- 输入区域 -->
    <div class="p-4 border-t border-border glass">
      <div class="flex flex-col gap-2">
        <Textarea
          v-model="inputValue"
          placeholder="输入消息..."
          @keydown.enter.prevent="sendMessage"
          :disabled="state.isGenerating || voiceState !== 'idle' || state.isContinuousMode"
          class="rounded-xl border-gray-200 focus:border-blue-300 min-h-[80px] resize-none"
        />
        <div class="flex gap-2">
          <Button
            variant="outline"
            @click="startVoiceRecognition"
            :disabled="state.isGenerating || voiceState === 'recognizing' || state.isContinuousMode"
            class="flex-1 rounded-xl border-gray-200 hover:bg-gray-50"
          >
            <Badge
              v-if="voiceState !== 'idle'"
              :variant="voiceState === 'recording' ? 'default' : 'secondary'"
              class="mr-2"
            >
              {{ voiceState === 'recording' ? '录音中' : '识别中' }}
            </Badge>
            {{ voiceState === 'recording' ? '正在录音...' : voiceState === 'recognizing' ? '正在识别...' : '语音输入' }}
          </Button>
          <Button
            variant="outline"
            @click="toggleContinuousMode"
            :disabled="state.isGenerating || voiceState !== 'idle'"
            :class="{ 'bg-accent': state.isContinuousMode }"
          >
            {{ state.isContinuousMode ? '停止连续' : '连续对话' }}
          </Button>
          <Button
            @click="sendMessage"
            :disabled="state.isGenerating || voiceState !== 'idle' || state.isContinuousMode"
            class="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
          >
            发送
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, watch, computed, onUnmounted } from 'vue';
import state, { addMessage, updateVisualType, setGenerating, updateMessageContent, updateProjectileParams, resetProjectileParams, setContinuousMode, updateContinuousVoiceState, dispatchCanvasCommands } from '../store';
import { parseCommandsFromReply } from '../utils/zhipuClient';
import { renderMathToHTML } from '../utils/katex';
import { formatPhysicsAnswer } from '../utils/textFormatter';
import { createStreamRequest } from '../utils/streamHandler';
import {
  checkMediaRecorderSupport,
  startRecording,
  stopRecording,
  blobToBase64,
  getAudioFormat,
  recognizeVoice,
  startContinuousListening,
  stopContinuousListening,
  getCurrentVolume
} from '../utils/voice';
import {
  parseProjectileParams,
  validateProjectileParams,
  applyRelativeAdjustment,
  formatParamConfirmation,
  formatRelativeConfirmation,
  formatRangeQueryResponse,
  COMMAND_TYPES
} from '../utils/paramParser';
import Button from './ui/Button.vue';
import Textarea from './ui/Textarea.vue';
import Badge from './ui/Badge.vue';
import ScrollArea from './ui/ScrollArea.vue';
import { MessageSquare, Minimize2, Maximize2, X } from 'lucide-vue-next';

// Props - 接收 visualCanvasRef 及面板控制回调
const props = defineProps({
  visualCanvasRef: {
    type: Object,
    default: null
  },
  onToggleCanvas: {
    type: Function,
    default: () => {}
  },
  isCanvasOpen: {
    type: Boolean,
    default: true
  },
  onClose: {
    type: Function,
    default: () => {}
  }
});

// 输入框绑定值
const inputValue = ref('');

// 语音识别状态
const voiceState = ref('idle'); // 'idle' | 'recording' | 'recognizing'
const isRecording = ref(false);

// 连续语音模式相关状态
let continuousStream = null;
let continuousRecorder = null;
let continuousAudioChunks = [];
let waveformAnimationId = null;
const waveformHeights = ref([10, 10, 10, 10, 10]); // 5个波形条的高度

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
 * 1. 解析用户消息中的参数指令
 * 2. 生成用户消息对象并添加到消息列表
 * 3. 清空输入框
 * 4. 滚动消息流到底部
 * 5. 创建空的 AI 消息占位
 * 6. 启动流式输出
 */
const sendMessage = async () => {
  const content = inputValue.value.trim();
  if (!content) return;

  // ========== 步骤 1: 解析参数指令 ==========
  const parseResult = parseProjectileParams(content);
  let confirmationText = '';

  // 处理参数指令
  if (parseResult.type === COMMAND_TYPES.PARAM_UPDATE) {
    // 绝对值参数调整
    const { params, corrections } = validateProjectileParams(parseResult.params);
    updateProjectileParams(params);
    confirmationText = formatParamConfirmation(params, corrections);
  } else if (parseResult.type === COMMAND_TYPES.PARAM_RELATIVE) {
    // 相对调整
    const oldValues = { ...state.projectileParams };
    const newParams = applyRelativeAdjustment(parseResult.relativeParams, state.projectileParams);
    const { params, corrections } = validateProjectileParams(newParams);
    updateProjectileParams(params);
    confirmationText = formatRelativeConfirmation(parseResult.relativeParams, oldValues, params, corrections);
  } else if (parseResult.type === COMMAND_TYPES.PARAM_QUERY) {
    // 范围查询
    confirmationText = formatRangeQueryResponse(parseResult.queryParams);
  } else if (parseResult.type === COMMAND_TYPES.RESET) {
    // 重置参数
    resetProjectileParams();
    confirmationText = '已将所有参数恢复为默认值，平抛动画已重置。';
  } else if (parseResult.type === COMMAND_TYPES.PLAY) {
    // 播放动画
    if (props.visualCanvasRef?.projectileMotionRef) {
      props.visualCanvasRef.projectileMotionRef.togglePlayPause();
      confirmationText = '已开始播放平抛动画。';
    }
  } else if (parseResult.type === COMMAND_TYPES.PAUSE) {
    // 暂停动画
    if (props.visualCanvasRef?.projectileMotionRef) {
      props.visualCanvasRef.projectileMotionRef.togglePlayPause();
      confirmationText = '已暂停平抛动画。';
    }
  } else if (parseResult.type === COMMAND_TYPES.SPEED) {
    // 调速
    if (props.visualCanvasRef?.projectileMotionRef) {
      props.visualCanvasRef.projectileMotionRef.setTimeScale(parseResult.speedValue);
      confirmationText = `已将动画速度调整为 **${parseResult.speedValue}** 倍。`;
    }
  } else if (parseResult.type === COMMAND_TYPES.STEP) {
    // 单步前进
    if (props.visualCanvasRef?.projectileMotionRef) {
      props.visualCanvasRef.projectileMotionRef.stepForward();
      confirmationText = '已单步前进。';
    }
  } else if (parseResult.type === COMMAND_TYPES.ENV) {
    // 切换环境
    const envNames = { moon: '月球', mars: '火星', earth: '地球', custom: '自定义' };
    dispatchCanvasCommands([{ type: 'ENV', value: parseResult.envValue }]);
    confirmationText = `已切换到${envNames[parseResult.envValue] || parseResult.envValue}环境。`;
  } else if (parseResult.type === COMMAND_TYPES.ENV_OPT) {
    // 环境选项（如空气阻力开关、阻力系数）
    dispatchCanvasCommands([{ type: 'ENV_OPT', key: parseResult.envOptKey, value: parseResult.envOptValue }]);
    if (parseResult.envOptKey === 'drag') {
      confirmationText = `已将阻力系数设为 **${parseResult.envOptValue}**，并开启空气阻力（自定义模式）。`;
    } else {
      const optNames = { air: '空气阻力' };
      confirmationText = `已${parseResult.envOptValue ? '开启' : '关闭'}${optNames[parseResult.envOptKey] || parseResult.envOptKey}。`;
    }
  } else if (parseResult.type === COMMAND_TYPES.VIZ_TOGGLE) {
    // 可视化显示开关
    dispatchCanvasCommands([{ type: 'VIZ', key: parseResult.vizKey, value: parseResult.vizValue }]);
    if (parseResult.vizKey === 'strobe-interval') {
      confirmationText = `已将频闪间隔设为 **${parseResult.vizValue}** 帧。`;
    } else {
      const vizNames = { axis: '坐标轴', grid: '网格线', vector: '速度矢量', strobe: '频闪效果', autoscale: '自动缩放' };
      confirmationText = `已${parseResult.vizValue ? '开启' : '关闭'}${vizNames[parseResult.vizKey] || parseResult.vizKey}显示。`;
    }
  } else if (parseResult.type === COMMAND_TYPES.CANVAS_ACTION) {
    // 画布操作（保存轨迹、重置缩放等）
    dispatchCanvasCommands([{ type: 'ANIM', value: parseResult.actionValue }]);
    const actionNames = { save: '保存轨迹', 'reset-zoom': '重置缩放', reset: '重置动画' };
    confirmationText = `已执行${actionNames[parseResult.actionValue] || parseResult.actionValue}操作。`;
  }

  // ========== 步骤 2: 生成用户消息 ==========
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

  // ========== 步骤 3: 如果是范围查询，直接显示结果，不调用 AI ==========
  if (parseResult.type === COMMAND_TYPES.PARAM_QUERY) {
    const aiMessage = {
      id: Date.now() + Math.random(),
      role: 'ai',
      content: confirmationText,
      time: getCurrentTime()
    };
    addMessage(aiMessage);
    scrollToBottom();
    return;
  }

  // ========== 步骤 4: 创建空的 AI 消息占位 ==========
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

  // ========== 步骤 5: 启动流式请求 ==========
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

      // 解析所有控制标记
      const { content: displayContent, commands } = parseCommandsFromReply(completeText);

      // 应用格式化和公式渲染
      const formattedContent = formatPhysicsAnswer(displayContent);
      const renderedContent = renderMathToHTML(formattedContent);

      // ========== 步骤 6: 在 AI 回复前插入确认文本 ==========
      let finalContent = renderedContent;
      if (confirmationText) {
        finalContent = confirmationText + '\n\n' + renderedContent;
      }

      // 更新消息内容
      updateMessageContent(aiMessageId, finalContent);

      // 结束流式输出状态
      setGenerating(false, null);

      // 滚动到底部
      scrollToBottom();

      // 执行控制指令（和 SET 命令走同一 store 机制，保证可靠触达）
      const otherCmds = [];
      for (const cmd of commands) {
        if (cmd.type === 'TRIGGER') {
          updateVisualType(cmd.value);
        } else if (cmd.type === 'SET') {
          updateProjectileParams({ [cmd.key]: cmd.value });
        } else {
          otherCmds.push(cmd);
        }
      }
      if (otherCmds.length > 0) {
        dispatchCanvasCommands(otherCmds);
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

/**
 * 连续语音状态栏文本
 */
const continuousStatusText = computed(() => {
  switch (state.continuousVoiceState) {
    case 'listening':
      return '正在连续语音对话中...';
    case 'recording':
      return '正在录音...';
    case 'recognizing':
      return '正在识别...';
    case 'waiting_ai':
      return 'AI 正在回答...';
    default:
      return '正在连续语音对话中...';
  }
});

/**
 * 更新波形动画
 */
const updateWaveform = () => {
  if (!state.isContinuousMode) {
    return;
  }

  const volume = getCurrentVolume();

  // 将音量映射到波形高度（10-30px）
  const baseHeight = 10;
  const maxHeight = 30;
  const heightRange = maxHeight - baseHeight;

  // 为每个波形条生成略有不同的高度（模拟波动效果）
  waveformHeights.value = waveformHeights.value.map((_, index) => {
    const offset = Math.sin(Date.now() / 200 + index) * 0.3; // 添加相位偏移
    const normalizedVolume = Math.min(volume / 50, 1); // 归一化音量
    return baseHeight + heightRange * normalizedVolume * (1 + offset);
  });

  waveformAnimationId = requestAnimationFrame(updateWaveform);
};

/**
 * 切换连续语音模式
 */
const toggleContinuousMode = async () => {
  if (state.isContinuousMode) {
    // 停止连续模式
    stopContinuousVoiceMode();
  } else {
    // 启动连续模式
    await startContinuousVoiceMode();
  }
};

/**
 * 启动连续语音模式
 */
const startContinuousVoiceMode = async () => {
  try {
    setContinuousMode(true);
    updateContinuousVoiceState('listening');

    // 启动波形动画
    updateWaveform();

    // 开始监听
    await startContinuousListeningCycle();

    showToast('连续语音模式已启动', 'success');
  } catch (error) {
    console.error('启动连续语音模式失败:', error);
    showToast(error.message, 'error');
    stopContinuousVoiceMode();
  }
};

/**
 * 停止连续语音模式
 */
const stopContinuousVoiceMode = () => {
  setContinuousMode(false);
  updateContinuousVoiceState('idle');

  // 停止波形动画
  if (waveformAnimationId) {
    cancelAnimationFrame(waveformAnimationId);
    waveformAnimationId = null;
  }

  // 重置波形高度
  waveformHeights.value = [10, 10, 10, 10, 10];

  // 清理连续监听资源
  stopContinuousListening();

  // 清理录音资源
  if (continuousRecorder) {
    if (continuousRecorder.state !== 'inactive') {
      continuousRecorder.stop();
    }
    continuousRecorder = null;
  }

  if (continuousStream) {
    continuousStream.getTracks().forEach(track => track.stop());
    continuousStream = null;
  }

  continuousAudioChunks = [];

  console.log('连续语音模式已停止');
};

/**
 * 连续语音监听循环
 */
const startContinuousListeningCycle = async () => {
  if (!state.isContinuousMode) {
    return;
  }

  try {
    updateContinuousVoiceState('listening');

    // 启动麦克风监听（带静音检测）
    continuousStream = await startContinuousListening(
      // 静音检测回调
      async () => {
        if (!state.isContinuousMode || state.continuousVoiceState !== 'recording') {
          return;
        }

        // 检测到静音，停止录音并识别
        await handleContinuousRecordingStop();
      },
      // 音量更新回调（已通过 getCurrentVolume 在波形动画中处理）
      null,
      5,    // 静音阈值 RMS < 5
      1500  // 静音时长 1.5 秒
    );

    // 开始录音
    await startContinuousRecording();

  } catch (error) {
    console.error('连续语音监听失败:', error);
    showToast(error.message, 'error');

    // 错误后继续监听（不中断循环）
    if (state.isContinuousMode) {
      setTimeout(() => startContinuousListeningCycle(), 1000);
    }
  }
};

/**
 * 开始连续模式录音
 */
const startContinuousRecording = async () => {
  if (!continuousStream) {
    throw new Error('麦克风流未初始化');
  }

  updateContinuousVoiceState('recording');
  continuousAudioChunks = [];

  // 创建 MediaRecorder
  let options = { mimeType: 'audio/webm' };
  if (MediaRecorder.isTypeSupported('audio/wav')) {
    options = { mimeType: 'audio/wav' };
  } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
    options = { mimeType: 'audio/webm;codecs=opus' };
  }

  continuousRecorder = new MediaRecorder(continuousStream, options);

  continuousRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      continuousAudioChunks.push(event.data);
    }
  };

  continuousRecorder.start();
  console.log('连续模式录音已开始');
};

/**
 * 处理连续模式录音停止
 */
const handleContinuousRecordingStop = async () => {
  if (!continuousRecorder || continuousRecorder.state === 'inactive') {
    return;
  }

  return new Promise((resolve) => {
    continuousRecorder.onstop = async () => {
      try {
        updateContinuousVoiceState('recognizing');

        // 合并音频数据
        const audioBlob = new Blob(continuousAudioChunks, { type: continuousRecorder.mimeType });
        console.log('连续模式录音已停止，音频大小:', audioBlob.size, 'bytes');

        // 转换为 Base64
        const audioBase64 = await blobToBase64(audioBlob);
        const format = getAudioFormat(audioBlob);

        // 调用识别接口
        const text = await recognizeVoice(audioBase64, format);

        // 识别成功，自动发送消息
        inputValue.value = text;
        await sendMessage();

        // 进入等待 AI 状态
        updateContinuousVoiceState('waiting_ai');

        resolve();
      } catch (error) {
        console.error('连续模式识别失败:', error);
        showToast(error.message, 'error');

        // 识别失败，继续监听（不中断循环）
        if (state.isContinuousMode) {
          setTimeout(() => startContinuousListeningCycle(), 1000);
        }

        resolve();
      }
    };

    continuousRecorder.stop();
  });
};

/**
 * 监听 AI 生成状态，完成后继续监听
 */
watch(() => state.isGenerating, (isGenerating) => {
  if (!isGenerating && state.continuousVoiceState === 'waiting_ai' && state.isContinuousMode) {
    // AI 完成，继续监听下一段
    console.log('AI 回答完成，继续监听下一段语音');
    setTimeout(() => startContinuousListeningCycle(), 500);
  }
});

/**
 * 组件卸载时清理资源
 */
onUnmounted(() => {
  if (state.isContinuousMode) {
    stopContinuousVoiceMode();
  }
});
</script>
