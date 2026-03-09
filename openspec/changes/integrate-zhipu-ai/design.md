# Design: Zhipu AI Integration Architecture

## Architecture Overview

### Integration Flow
```
用户输入消息
    ↓
ChatBox.sendMessage()
    ↓
调用 callZhipuAI(userInput, messageHistory)
    ↓
构建请求（系统提示词 + 历史消息 + 用户输入）
    ↓
智谱 AI API 调用
    ↓
解析 AI 回复
    ↓
提取触发标记 [TRIGGER:XXX]
    ↓
添加 AI 消息到消息列表
    ↓
更新可视化类型（如果有触发标记）
```

### Component Changes

**ChatBox.vue**
- 移除 `generateAIReply()` 函数
- 新增 `callZhipuAI()` 函数
- 新增 `parseTriggerFromReply()` 函数
- 新增加载状态显示
- 新增错误处理逻辑

**新增文件**
- `.env` - 存储 API Key
- `.env.example` - 环境变量模板
- `src/utils/zhipuClient.js` - 智谱 AI 客户端封装

## Key Design Decisions

### 1. SDK 选择
**决策**: 使用智谱 AI 官方 JavaScript SDK

**理由**:
- 官方维护，稳定可靠
- 提供完整的类型定义和错误处理
- 简化 API 调用流程

**安装**:
```bash
npm install zhipuai-sdk-nodejs-v4
```

### 2. API Key 管理
**决策**: 使用 .env 文件 + Vite 环境变量

**实现**:
```env
# .env
VITE_ZHIPU_API_KEY=your_api_key_here
```

```javascript
// 访问方式
const apiKey = import.meta.env.VITE_ZHIPU_API_KEY;
```

**安全措施**:
- 将 `.env` 添加到 `.gitignore`
- 提供 `.env.example` 模板文件
- 在文档中说明不要将 API Key 提交到版本控制

### 3. 系统提示词设计
**决策**: 定义清晰的物理教学助手角色和触发标记规范

**系统提示词**:
```
你是一位专业的物理教学助手，擅长用通俗易懂的语言解释物理概念和公式。

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
```

### 4. 消息历史管理
**决策**: 将最近 10 条消息发送给 AI 作为上下文

**理由**:
- 保持上下文连贯性
- 控制 token 消耗
- 避免超出 API 限制

**实现**:
```javascript
const recentMessages = state.messageList.slice(-10).map(msg => ({
  role: msg.role === 'user' ? 'user' : 'assistant',
  content: msg.content
}));
```

### 5. 错误处理策略
**决策**: 分类处理不同类型的错误

**错误类型**:
1. **网络错误**: 显示"网络连接失败，请检查网络后重试"
2. **API Key 错误**: 显示"API Key 配置错误，请检查环境变量"
3. **限流错误**: 显示"请求过于频繁，请稍后再试"
4. **其他错误**: 显示通用错误信息

**实现**:
```javascript
try {
  const response = await client.chat.completions.create({...});
  return response.choices[0].message.content;
} catch (error) {
  if (error.code === 'ENOTFOUND') {
    throw new Error('网络连接失败，请检查网络后重试');
  } else if (error.status === 401) {
    throw new Error('API Key 配置错误，请检查环境变量');
  } else if (error.status === 429) {
    throw new Error('请求过于频繁，请稍后再试');
  } else {
    throw new Error('AI 服务暂时不可用，请稍后再试');
  }
}
```

### 6. 加载状态设计
**决策**: 在 AI 回复期间显示"正在思考..."的加载消息

**实现**:
- 发送请求前添加临时加载消息
- 收到回复后替换为真实 AI 消息
- 如果出错，替换为错误提示消息

## API Integration Details

### 智谱 AI API 调用示例
```javascript
import ZhipuAI from 'zhipuai-sdk-nodejs-v4';

const client = new ZhipuAI({
  apiKey: import.meta.env.VITE_ZHIPU_API_KEY
});

const response = await client.chat.completions.create({
  model: 'glm-4-flash',  // 使用快速模型
  messages: [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messageHistory,
    { role: 'user', content: userInput }
  ],
  temperature: 0.7,
  max_tokens: 500
});

const aiReply = response.choices[0].message.content;
```

### 触发标记解析
```javascript
const parseTriggerFromReply = (reply) => {
  const triggerMatch = reply.match(/\[TRIGGER:(PROJECTILE|FORMULA)\]/);
  if (triggerMatch) {
    return {
      content: reply.replace(/\[TRIGGER:(PROJECTILE|FORMULA)\]/, '').trim(),
      trigger: triggerMatch[1]
    };
  }
  return { content: reply, trigger: null };
};
```

## Testing Strategy
1. **基础对话测试**: 发送普通物理问题，验证 AI 回复质量
2. **触发标记测试**: 询问平抛运动，验证 [TRIGGER:PROJECTILE] 正确触发
3. **上下文测试**: 多轮对话，验证 AI 能够理解上下文
4. **错误处理测试**: 模拟网络错误、API Key 错误等场景
5. **加载状态测试**: 验证加载提示正确显示和消失

## Migration from Mock Logic
**移除的代码**:
- `generateAIReply()` 函数
- `findLastVisualMessage()` 函数
- 所有关键词匹配逻辑

**保留的代码**:
- `sendMessage()` 函数框架
- `scrollToBottom()` 函数
- `getCurrentTime()` 函数
- 消息列表渲染逻辑
