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
 * 解析 AI 回复中的触发标记
 * @param {String} reply - AI 的原始回复内容
 * @returns {Object} - { content: 显示内容, trigger: 触发类型 }
 */
export const parseTriggerFromReply = (reply) => {
  // 使用正则表达式匹配触发标记
  const triggerMatch = reply.match(/\[TRIGGER:(PROJECTILE|FORMULA)\]/);

  if (triggerMatch) {
    // 提取触发类型
    const trigger = triggerMatch[1];

    // 移除触发标记，得到显示内容
    const content = reply.replace(/\[TRIGGER:(PROJECTILE|FORMULA)\]/, '').trim();

    return { content, trigger };
  }

  // 没有触发标记，返回原始内容
  return { content: reply, trigger: null };
};
