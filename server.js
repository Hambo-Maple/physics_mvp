import express from 'express';
import cors from 'cors';
import ZhipuAI from 'zhipuai-sdk-nodejs-v4';
import dotenv from 'dotenv';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
dotenv.config();

const app = express();
const PORT = 3001;

// 创建临时文件目录
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

/**
 * 将 webm 音频转换为 wav 格式
 * @param {Buffer} webmBuffer - webm 音频数据
 * @returns {Promise<Buffer>} - wav 音频数据
 */
function convertWebmToWav(webmBuffer) {
  return new Promise((resolve, reject) => {
    const inputPath = path.join(tempDir, `input-${Date.now()}.webm`);
    const outputPath = path.join(tempDir, `output-${Date.now()}.wav`);

    // 写入临时文件
    fs.writeFileSync(inputPath, webmBuffer);

    // 使用 ffmpeg 转换
    ffmpeg(inputPath)
      .toFormat('wav')
      .audioFrequency(16000) // 设置采样率为 16000Hz
      .audioChannels(1)      // 单声道
      .on('end', () => {
        // 读取转换后的文件
        const wavBuffer = fs.readFileSync(outputPath);

        // 删除临时文件
        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);

        resolve(wavBuffer);
      })
      .on('error', (err) => {
        // 清理临时文件
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

        reject(err);
      })
      .save(outputPath);
  });
}

// 中间件
app.use(cors());
app.use(express.json({ limit: '50mb' })); // 增加请求体大小限制，支持音频数据

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

// 百度语音识别接口
// 配置说明：
// 1. 在百度智能云控制台（https://console.bce.baidu.com/）创建语音识别应用
// 2. 获取 AppID、API Key、Secret Key
// 3. 在 .env 文件中配置：
//    BAIDU_APP_ID=你的AppID
//    BAIDU_API_KEY=你的API_Key
//    BAIDU_SECRET_KEY=你的Secret_Key
app.post('/api/voice/recognize', async (req, res) => {
  try {
    const { audio, format } = req.body;

    // 验证参数
    if (!audio || !format) {
      return res.status(400).json({ error: '缺少音频数据或格式参数' });
    }

    // 验证百度 API 配置
    const appId = process.env.BAIDU_APP_ID;
    const apiKey = process.env.BAIDU_API_KEY;
    const secretKey = process.env.BAIDU_SECRET_KEY;

    if (!appId || !apiKey || !secretKey) {
      console.error('百度 API 配置缺失');
      return res.status(500).json({ error: '语音识别服务未配置' });
    }

    // 步骤 1: 获取 Access Token
    const tokenResponse = await fetch(
      `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secretKey}`,
      { method: 'POST' }
    );
    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error('获取百度 Access Token 失败:', tokenData);
      return res.status(500).json({ error: '语音识别服务初始化失败' });
    }

    const accessToken = tokenData.access_token;

    // 步骤 2: 转换音频格式（webm → wav）
    console.log('开始转换音频格式...');
    const audioBuffer = Buffer.from(audio, 'base64');

    let wavBuffer;
    if (format === 'webm' || format.includes('webm')) {
      try {
        wavBuffer = await convertWebmToWav(audioBuffer);
        console.log('音频转换成功，WAV 大小:', wavBuffer.length);
      } catch (error) {
        console.error('音频转换失败:', error);
        return res.status(500).json({ error: '音频格式转换失败' });
      }
    } else {
      wavBuffer = audioBuffer;
    }

    // 步骤 3: 调用百度语音识别 API
    const params = new URLSearchParams({
      format: 'wav',
      rate: 16000,
      channel: 1,
      cuid: appId,
      token: accessToken,
      dev_pid: 1537,
      len: wavBuffer.length
    });

    console.log('发送百度 API 请求，格式: wav, 大小:', wavBuffer.length);

    const recognizeResponse = await fetch(
      `https://vop.baidu.com/server_api?${params.toString()}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'audio/wav; rate=16000'
        },
        body: wavBuffer
      }
    );

    const recognizeData = await recognizeResponse.json();
    console.log('百度 API 响应:', recognizeData);

    // 步骤 4: 解析识别结果
    if (recognizeData.err_no === 0 && recognizeData.result && recognizeData.result.length > 0) {
      const text = recognizeData.result[0];
      console.log('语音识别成功:', text);
      res.json({ text });
    } else {
      console.error('百度语音识别失败:', recognizeData);
      res.status(500).json({ error: recognizeData.err_msg || '识别失败，请稍后重试' });
    }

  } catch (error) {
    console.error('语音识别接口错误:', error);
    res.status(500).json({ error: '识别失败，请稍后重试' });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 智谱 AI 代理服务器已启动`);
  console.log(`   地址: http://localhost:${PORT}`);
  console.log(`   前端请求此服务器来调用智谱 AI\n`);
});
