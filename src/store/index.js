import { reactive } from 'vue';

// 全局状态对象
const state = reactive({
  messageList: [],        // 对话列表，每条格式：{ id, role, content, time }
  currentVisualType: '',  // 当前可视化类型：'' | 'PROJECTILE' | 'FORMULA'
  currentFormulaIndex: 0, // 当前显示的公式索引
  isGenerating: false,    // 是否正在流式输出
  currentMessageId: null, // 当前正在输出的消息 ID
  projectileParams: {     // 平抛运动参数
    v0: 10,               // 初速度 (m/s)
    g: 9.8,               // 重力加速度 (m/s²)
    h: 50,                // 初始高度 (m)
    theta: 0,             // 发射角度 (度)
    mass: 1,              // 质量 (kg)
    timeScale: 1          // 倍速
  }
});

// 公式列表：平抛运动的微积分公式
export const formulaList = [
  {
    id: 1,
    name: '位移公式',
    content: '$x = v_0 t, \\quad y = \\frac{1}{2} g t^2$'
  },
  {
    id: 2,
    name: '速度导数',
    content: '$\\frac{dv_x}{dt} = 0, \\quad \\frac{dv_y}{dt} = g$'
  },
  {
    id: 3,
    name: '位移积分',
    content: '$y = \\int_0^t v_y dt = \\int_0^t g t dt = \\frac{1}{2} g t^2$'
  }
];

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
 * @param {String} type - 可视化类型：'' | 'PROJECTILE' | 'FORMULA'
 */
export const updateVisualType = (type) => {
  state.currentVisualType = type;
};

/**
 * 切换到下一个公式
 */
export const nextFormula = () => {
  state.currentFormulaIndex = (state.currentFormulaIndex + 1) % formulaList.length;
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

/**
 * 更新平抛运动参数
 * @param {Object} params - 参数对象
 */
export const updateProjectileParams = (params) => {
  Object.assign(state.projectileParams, params);
};

// 导出状态对象
export default state;
