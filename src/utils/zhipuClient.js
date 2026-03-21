/**
 * 调用后端代理服务器来访问智谱 AI API
 * @param {String} userInput - 用户输入的消息
 * @param {Array} messageHistory - 历史消息列表
 * @returns {Promise<String>} - AI 生成的回复内容
 */
export const callZhipuAI = async (userInput, messageHistory) => {
  try {
    // 格式化消息历史（取最近 10 条消息）
    const recentMessages = messageHistory
      .slice(-10)
      .map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

    // 调用后端代理服务器
    const response = await fetch('http://localhost:3001/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: userInput,
        history: recentMessages
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'AI 服务暂时不可用');
    }

    const data = await response.json();
    return data.reply;

  } catch (error) {
    console.error('智谱 AI API 调用失败:', error);

    // 错误处理
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error('无法连接到 AI 服务器，请确保后端服务器已启动（运行 npm run server）');
    }

    throw new Error(error.message || 'AI 服务暂时不可用，请稍后再试');
  }
};

/**
 * 解析 AI 回复中的所有控制标记
 * @param {String} reply - AI 的原始回复内容
 * @returns {Object} - { content: 显示内容, commands: 指令数组 }
 *
 * 支持的标记格式：
 *   [TRIGGER:PROJECTILE]     触发可视化
 *   [SET:v0=20]              修改物理参数（v0/g/h/theta/mass）
 *   [ENV:moon]               切换环境（earth/moon/mars/custom）
 *   [ANIM:play|pause|reset]  控制动画
 *   [VIZ:strobe=on|off]      可视化选项（strobe/vector）
 */
export const parseCommandsFromReply = (reply) => {
  const commands = [];
  let content = reply;

  // TRIGGER:PROJECTILE
  if (content.includes('[TRIGGER:PROJECTILE]')) {
    commands.push({ type: 'TRIGGER', value: 'PROJECTILE' });
    content = content.replace(/\[TRIGGER:PROJECTILE\]/g, '');
  }

  // SET 参数：[SET:key=value]
  const setRegex = /\[SET:(\w+)=([\d.]+)\]/g;
  let m;
  while ((m = setRegex.exec(reply)) !== null) {
    commands.push({ type: 'SET', key: m[1], value: parseFloat(m[2]) });
    content = content.replace(m[0], '');
  }

  // ENV 二元选项：[ENV:key=on|off]（如空气阻力 [ENV:air=on]）
  const envOptRegex = /\[ENV:(\w+)=(on|off)\]/g;
  while ((m = envOptRegex.exec(reply)) !== null) {
    commands.push({ type: 'ENV_OPT', key: m[1], value: m[2] === 'on' });
    content = content.replace(m[0], '');
  }

  // ENV 环境切换：[ENV:mode]
  const envMatch = content.match(/\[ENV:(\w+)\]/);
  if (envMatch) {
    commands.push({ type: 'ENV', value: envMatch[1] });
    content = content.replace(envMatch[0], '');
  }

  // ANIM 动画控制：[ANIM:action]
  const animMatch = content.match(/\[ANIM:(play|pause|reset|reset-zoom|save)\]/);
  if (animMatch) {
    commands.push({ type: 'ANIM', value: animMatch[1] });
    content = content.replace(animMatch[0], '');
  }

  // VIZ 可视化选项：[VIZ:key=on|off]
  const vizRegex = /\[VIZ:(\w+)=(on|off)\]/g;
  while ((m = vizRegex.exec(reply)) !== null) {
    commands.push({ type: 'VIZ', key: m[1], value: m[2] === 'on' });
    content = content.replace(m[0], '');
  }

  return { content: content.trim(), commands };
};

// 保留旧接口兼容
export const parseTriggerFromReply = (reply) => {
  const { content, commands } = parseCommandsFromReply(reply);
  const trigger = commands.find(c => c.type === 'TRIGGER')?.value ?? null;
  return { content, trigger };
};
