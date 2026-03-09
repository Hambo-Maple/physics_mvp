import express from 'express';
import cors from 'cors';
import ZhipuAI from 'zhipuai-sdk-nodejs-v4';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 系统提示词
const SYSTEM_PROMPT = `你是一位专业的物理教学助手，擅长用通俗易懂的语言解释物理概念和公式。

你的职责：
1. 回答用户关于物理的问题，提供准确、清晰的解释
2. 当用户询问特定物理场景时，在回复末尾添加触发标记来启动可视化

触发标记规范：
- 当用户询问平抛运动相关内容时，在回复末尾添加 [TRIGGER:PROJECTILE]
- 当用户询问物理公式相关内容时，在回复末尾添加 [TRIGGER:FORMULA]
- 触发标记必须放在回复的最后一行
- 一次回复只能包含一个触发标记

示例：
用户："什么是平抛运动？"
你的回复："平抛运动是指物体以一定的初速度水平抛出，仅在重力作用下的运动。它的轨迹是抛物线，水平方向做匀速直线运动，竖直方向做自由落体运动。[TRIGGER:PROJECTILE]"

注意：
- 不是所有问题都需要触发可视化，只在明确涉及平抛运动或公式展示时才添加标记
- 保持回复简洁专业，适合学生理解
- 回复长度控制在200字以内`;

// 智谱 AI 聊天接口（流式）
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body;

    // 验证 API Key
    const apiKey = process.env.VITE_ZHIPU_API_KEY;
    console.log('API Key 状态:', apiKey ? '已配置' : '未配置');
    if (!apiKey) {
      return res.status(500).json({
        error: 'API Key 配置错误，请检查环境变量'
      });
    }

    // 初始化智谱 AI 客户端
    const client = new ZhipuAI({ apiKey });

    // 构建消息列表
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history,
      { role: 'user', content: message }
    ];

    console.log('准备调用流式 API，消息数量:', messages.length);

    // 设置 SSE 响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // 调用智谱 AI API（流式）
    const stream = await client.createCompletions({
      model: 'glm-4-flash',
      messages: messages,
      temperature: 0.7,
      max_tokens: 500,
      stream: true
    });

    // 逐块读取并转发
    for await (const chunk of stream) {
      // 智谱 AI 返回的是 Buffer，需要转换为字符串
      const chunkStr = chunk.toString('utf-8');

      // 解析 SSE 格式：data: {...}
      const lines = chunkStr.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6).trim();

          // 跳过 [DONE] 标记
          if (dataStr === '[DONE]') {
            continue;
          }

          try {
            const data = JSON.parse(dataStr);
            const delta = data.choices?.[0]?.delta?.content || '';

            if (delta) {
              res.write(`data: ${JSON.stringify({ delta, done: false })}\n\n`);
            }
          } catch (e) {
            console.error('解析数据块失败:', e);
          }
        }
      }
    }

    // 发送完成标志
    res.write(`data: ${JSON.stringify({ delta: '', done: true })}\n\n`);
    res.end();

    console.log('流式输出完成');

  } catch (error) {
    console.error('智谱 AI API 调用失败:');
    console.error('错误类型:', error.constructor.name);
    console.error('错误信息:', error.message);
    console.error('错误状态码:', error.status);
    console.error('完整错误:', error);

    // 错误处理
    if (!res.headersSent) {
      if (error.status === 401 || error.status === 403) {
        return res.status(401).json({ error: 'API Key 配置错误' });
      }
      if (error.status === 429) {
        return res.status(429).json({ error: '请求过于频繁，请稍后再试' });
      }

      res.status(500).json({ error: 'AI 服务暂时不可用，请稍后再试' });
    }
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 智谱 AI 代理服务器已启动`);
  console.log(`   地址: http://localhost:${PORT}`);
  console.log(`   前端请求此服务器来调用智谱 AI\n`);
});
