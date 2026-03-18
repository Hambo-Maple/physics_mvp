# Design: 对话消息控制平抛运动参数

## Architecture Overview

### 核心流程
```
用户输入消息 → ChatBox.sendMessage()
    ↓
parseProjectileParams(message) 解析指令
    ↓
识别到有效参数/指令？
    ├─ 是 → validateProjectileParams(params) 校验并修正
    │       ↓
    │       updateProjectileParams(params) 更新全局状态
    │       ↓
    │       AI 回复包含确认内容（参数名+数值+单位）
    │       ↓
    │       ProjectileMotion.vue 响应式更新画布
    │
    └─ 否 → 原有对话逻辑（不调整参数）
```

### 组件职责划分

#### 1. `src/utils/paramParser.js` (NEW)
封装指令解析逻辑，导出以下函数：
- `parseProjectileParams(message)`: 解析消息，返回参数对象或指令类型
- `validateProjectileParams(params)`: 校验参数范围并自动修正
- `formatParamConfirmation(params, corrections)`: 生成 AI 确认回复内容

#### 2. `src/components/ChatBox.vue` (MODIFIED)
在 `sendMessage()` 函数中集成指令解析：
- 调用 `parseProjectileParams()` 解析用户消息
- 若识别到有效参数，调用 `validateProjectileParams()` 校验
- 调用 `updateProjectileParams()` 更新全局状态
- 在 AI 回复中插入确认内容（通过 prompt 或直接拼接）

#### 3. `src/store/index.js` (MODIFIED)
扩展 `updateProjectileParams()` 函数：
- 支持部分参数更新（仅更新传入的参数，其他保持不变）
- 添加参数重置函数 `resetProjectileParams()`

#### 4. `src/components/ProjectileMotion.vue` (MODIFIED)
扩展动画控制接口：
- 导出 `togglePlayPause()`, `resetAnimation()`, `setTimeScale()` 等函数
- 供 ChatBox 调用以实现动画控制指令

## Data Structures

### 参数映射表
```javascript
const PARAM_ALIASES = {
  v0: ['v0', '初速度', '速度'],
  g: ['g', '重力', '重力加速度'],
  h: ['h', '高度', '初始高度'],
  theta: ['θ', '角度', '发射角度'],
  mass: ['m', '质量']
};

const PARAM_UNITS = {
  v0: ['m/s', '米/秒'],
  g: ['m/s²', 'm/s2', '米/秒²'],
  h: ['m', '米'],
  theta: ['度', '°'],
  mass: ['kg', '千克']
};

const PARAM_RANGES = {
  v0: { min: 1, max: 50 },
  g: { min: 1, max: 20 },
  h: { min: 10, max: 200 },
  theta: { min: 0, max: 90 },
  mass: { min: 0.1, max: 10 }
};
```

### 指令类型枚举
```javascript
const COMMAND_TYPES = {
  PARAM_UPDATE: 'param_update',        // 参数调整（绝对值）
  PARAM_RELATIVE: 'param_relative',    // 参数相对调整（增加/减少）
  PARAM_QUERY: 'param_query',          // 参数范围查询
  RESET: 'reset',                      // 重置参数
  PLAY: 'play',                        // 播放动画
  PAUSE: 'pause',                      // 暂停动画
  SPEED: 'speed',                      // 调整倍速
  STEP: 'step'                         // 单步前进
};
```

### 解析结果结构
```javascript
{
  type: 'param_update' | 'param_relative' | 'param_query' | 'reset' | 'play' | 'pause' | 'speed' | 'step' | null,
  params: { v0: 20, g: 10, ... },           // 仅在 type='param_update' 时存在
  relativeParams: { v0: '+5', g: '-2' },    // 仅在 type='param_relative' 时存在
  queryParams: ['v0', 'g'] | 'all',         // 仅在 type='param_query' 时存在
  speedValue: 2,                             // 仅在 type='speed' 时存在
  raw: '原始消息内容'
}
```

## Implementation Details

### 1. 精准匹配规则
使用正则表达式匹配 "参数名 + 数值 + 单位（可选）" 格式：
```javascript
// 示例：匹配 "初速度 20m/s" 或 "v0 20" 或 "速度20"
const patterns = [
  /(?:v0|初速度|速度)\s*[:：]?\s*(\d+\.?\d*)\s*(?:m\/s)?/gi,
  /(?:g|重力|重力加速度)\s*[:：]?\s*(\d+\.?\d*)\s*(?:m\/s[²2])?/gi,
  // ... 其他参数
];
```

### 2. 自然语言解析规则
使用关键词匹配 + 数值提取：
```javascript
// 示例："把平抛的初始速度调到 20" → v0=20
if (/(?:调|改|设置|变成|调整|修改).*?(?:初速度|速度).*?(\d+\.?\d*)/.test(message)) {
  params.v0 = parseFloat(RegExp.$1);
}
```

### 3. 相对调整解析规则
识别增加/减少关键词：
```javascript
// 示例："初速度增加 5" → v0: +5
const relativePatterns = [
  /(?:v0|初速度|速度)\s*(?:增加|加|提高|上升)\s*(\d+\.?\d*)/gi,
  /(?:v0|初速度|速度)\s*(?:减少|减|降低|下降)\s*(\d+\.?\d*)/gi,
  // ... 其他参数
];

// 计算新值时需要读取当前值
const currentValue = state.projectileParams.v0;
const newValue = currentValue + parseFloat(delta);
```

### 4. 范围查询解析规则
识别查询关键词：
```javascript
// 示例："初速度的范围是多少" → query: ['v0']
if (/(?:初速度|速度).*?(?:范围|取值|最大|最小)/.test(message)) {
  queryParams.push('v0');
}

// 示例："所有参数的范围" → query: 'all'
if (/(?:所有|全部).*?参数.*?范围/.test(message)) {
  queryParams = 'all';
}
```

### 5. 参数校验与修正
```javascript
function validateProjectileParams(params) {
  const corrections = {};

  for (const [key, value] of Object.entries(params)) {
    const range = PARAM_RANGES[key];
    if (!range) continue;

    if (value < range.min) {
      corrections[key] = { original: value, corrected: range.min };
      params[key] = range.min;
    } else if (value > range.max) {
      corrections[key] = { original: value, corrected: range.max };
      params[key] = range.max;
    }
  }

  return { params, corrections };
}
```

### 6. AI 回复生成策略
两种方案：
- **方案 A（推荐）**：在 ChatBox 中拼接确认内容到 AI 回复前
  - 优点：实现简单，不依赖 AI 模型理解
  - 缺点：回复格式固定，缺乏自然语言变化

- **方案 B**：通过 system prompt 告知 AI 参数已更新
  - 优点：回复更自然
  - 缺点：依赖 AI 模型理解，可能不稳定

**采用方案 A**，在流式输出完成后，检测到参数更新时，在 AI 回复前插入确认内容：
```javascript
const confirmText = formatParamConfirmation(params, corrections);
const finalContent = confirmText + '\n\n' + aiReplyContent;
```

## Trade-offs

### 精准匹配 vs 自然语言解析
- **精准匹配**：准确率高，但用户需要记住参数名
- **自然语言解析**：用户友好，但可能误识别
- **决策**：精准匹配优先，自然语言作为备选，解析失败时不调整参数

### 参数校验策略
- **严格模式**：超出范围直接拒绝，提示用户重新输入
- **宽松模式**：自动修正为边界值，提示用户已修正
- **决策**：采用宽松模式，提升用户体验，避免反复输入

### AI 回复生成方式
- **前端拼接**：实现简单，格式固定
- **AI 生成**：回复自然，但不稳定
- **决策**：采用前端拼接，确保功能稳定性

## Testing Strategy

### 单元测试（手动验证）
- `parseProjectileParams()` 函数测试：
  - 精准匹配：各种参数名、单位组合
  - 自然语言：口语化指令识别
  - 边界情况：无效输入、空字符串、特殊字符

- `validateProjectileParams()` 函数测试：
  - 正常范围内参数
  - 超出范围参数（上下边界）
  - 空对象、部分参数

### 集成测试（手动验证）
- 对话指令 → 参数更新 → 画布刷新 全流程
- 多参数批量调整
- 重置指令
- 动画控制指令
- 异常处理（解析失败、数值超出范围）

### 兼容性测试
- 验证所有现有功能不受影响：
  - 流式输出
  - 语音输入
  - 鼠标吸附
  - 公式渲染
  - 墨绿色主题

## Performance Considerations
- 指令解析在消息发送时同步执行，正则匹配性能开销可忽略
- 参数更新触发 Vue 响应式更新，性能影响可忽略
- 无需引入额外依赖，不增加打包体积

## Security Considerations
- 用户输入经过严格校验，防止注入攻击
- 参数范围限制，防止异常数值导致渲染错误
- 不涉及后端交互，无网络安全风险
