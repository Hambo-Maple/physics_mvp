import { reactive } from 'vue';

// 全局状态对象
const state = reactive({
  messageList: [],        // 对话列表，每条格式：{ id, role, content, time }
  conversationHistory: [], // 历史对话列表，每条格式：{ id, title, preview, time, messages, visualType, projectileParams }
  currentVisualType: '',  // 当前可视化类型：'' | 'PROJECTILE'
  isGenerating: false,    // 是否正在流式输出
  currentMessageId: null, // 当前正在输出的消息 ID
  projectileParams: {     // 平抛运动参数
    v0: 10,               // 初速度 (m/s)
    g: 9.8,               // 重力加速度 (m/s²)
    h: 50,                // 初始高度 (m)
    theta: 0,             // 发射角度 (度)
    mass: 1,              // 质量 (kg)
    timeScale: 1          // 倍速
  },
  // 连续语音模式状态
  isContinuousMode: false,      // 是否开启连续语音模式
  continuousVoiceState: 'idle', // 连续语音状态：'idle' | 'listening' | 'recording' | 'recognizing' | 'waiting_ai'
  // AI 指令派发（用数字序号作触发器，与 projectileParams 同一可靠机制）
  canvasCommandSeq: 0,          // 每次有新指令时递增，ProjectileMotion 监听此数字
  canvasCommandBatch: []        // 当前批次的指令列表
});

/**
 * 添加消息到消息列表
 * @param {Object} message - 消息对象
 * @param {Number} message.id - 消息唯一标识
 * @param {String} message.role - 消息角色：'user' | 'ai'
 * @param {String} message.content - 消息内容
 * @param {String} message.time - 发送时间（格式：HH:MM）
 */
export const addMessage = (message) => {
  state.messageList.push(message);
};

/**
 * 更新当前可视化类型
 * @param {String} type - 可视化类型：'' | 'PROJECTILE'
 */
export const updateVisualType = (type) => {
  state.currentVisualType = type;
};

/**
 * 设置流式输出状态
 * @param {Boolean} value - 是否正在生成
 * @param {String|null} messageId - 消息 ID
 */
export const setGenerating = (value, messageId = null) => {
  state.isGenerating = value;
  state.currentMessageId = messageId;
};

/**
 * 更新指定消息的内容
 * @param {String} id - 消息 ID
 * @param {String} content - 新内容
 */
export const updateMessageContent = (id, content) => {
  const message = state.messageList.find(msg => msg.id === id);
  if (message) {
    message.content = content;
  } else {
    console.warn(`消息 ID ${id} 不存在`);
  }
};

// 默认平抛运动参数常量
export const DEFAULT_PROJECTILE_PARAMS = {
  v0: 10,               // 初速度 (m/s)
  g: 9.8,               // 重力加速度 (m/s²)
  h: 50,                // 初始高度 (m)
  theta: 0,             // 发射角度 (度)
  mass: 1,              // 质量 (kg)
  timeScale: 1          // 倍速
};

/**
 * 更新平抛运动参数（支持部分参数更新）
 * @param {Object} params - 参数对象（仅更新传入的参数，其他保持不变）
 *
 * 示例：
 * updateProjectileParams({ v0: 20 })  // 仅更新初速度，其他参数不变
 * updateProjectileParams({ v0: 20, g: 10 })  // 更新初速度和重力加速度
 */
export const updateProjectileParams = (params) => {
  Object.assign(state.projectileParams, params);
};

/**
 * 重置平抛运动参数为默认值
 * 恢复所有参数到初始状态
 */
export const resetProjectileParams = () => {
  Object.assign(state.projectileParams, DEFAULT_PROJECTILE_PARAMS);
};

/**
 * 设置连续语音模式状态
 * @param {Boolean} value - 是否开启连续语音模式
 */
export const setContinuousMode = (value) => {
  state.isContinuousMode = value;
};

/**
 * 更新连续语音状态
 * @param {String} status - 状态值：'idle' | 'listening' | 'recording' | 'recognizing' | 'waiting_ai'
 */
export const updateContinuousVoiceState = (status) => {
  state.continuousVoiceState = status;
};

/**
 * 派发画布控制指令（和 updateProjectileParams 同一可靠模式）
 * @param {Array} commands - 指令数组，每条格式 { type, key?, value }
 */
export const dispatchCanvasCommands = (commands) => {
  state.canvasCommandBatch = commands;
  state.canvasCommandSeq++;  // 递增数字 → 触发 ProjectileMotion 的 watch
};

/**
 * 保存当前对话到历史记录
 * 仅在有消息时保存
 */
export const saveCurrentConversation = () => {
  if (state.messageList.length === 0) return;
  // 取第一条用户消息作为标题和预览
  const firstUserMsg = state.messageList.find(m => m.role === 'user');
  const title = firstUserMsg ? firstUserMsg.content.slice(0, 15) : '新对话';
  const preview = firstUserMsg ? firstUserMsg.content.slice(0, 30) : '';
  const now = new Date();
  const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  state.conversationHistory.unshift({
    id: Date.now(),
    title,
    preview,
    time,
    messages: JSON.parse(JSON.stringify(state.messageList)),
    visualType: state.currentVisualType,
    projectileParams: { ...state.projectileParams }
  });
};

/**
 * 加载历史对话（恢复消息列表、可视化类型、参数）
 * @param {Number} id - 历史对话 ID
 */
export const loadConversation = (id) => {
  const conv = state.conversationHistory.find(c => c.id === id);
  if (!conv) return;
  state.messageList = JSON.parse(JSON.stringify(conv.messages));
  state.currentVisualType = conv.visualType;
  Object.assign(state.projectileParams, conv.projectileParams);
};

/**
 * 删除历史对话
 * @param {Number} id - 历史对话 ID
 */
export const deleteConversation = (id) => {
  const index = state.conversationHistory.findIndex(c => c.id === id);
  if (index !== -1) state.conversationHistory.splice(index, 1);
};

/**
 * 新建对话：保存当前对话，清空状态
 */
export const createNewConversation = () => {
  saveCurrentConversation();
  state.messageList = [];
  state.currentVisualType = '';
  Object.assign(state.projectileParams, DEFAULT_PROJECTILE_PARAMS);
  state.isGenerating = false;
  state.currentMessageId = null;
};

// 导出状态对象
export default state;
