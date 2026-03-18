import { reactive } from 'vue';

// 全局状态对象
const state = reactive({
  messageList: [],        // 对话列表，每条格式：{ id, role, content, time }
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
  continuousVoiceState: 'idle'  // 连续语音状态：'idle' | 'listening' | 'recording' | 'recognizing' | 'waiting_ai'
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

// 导出状态对象
export default state;
