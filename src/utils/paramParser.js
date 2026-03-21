/**
 * 平抛运动参数解析工具
 *
 * 功能：
 * 1. 解析用户消息中的参数指令（精准匹配 + 自然语言）
 * 2. 校验参数范围并自动修正
 * 3. 生成 AI 确认回复内容
 *
 * 支持的指令类型：
 * - 绝对值调整：初速度 20m/s
 * - 相对调整：初速度增加 5
 * - 范围查询：初速度的范围是多少
 * - 重置参数：重置平抛参数
 * - 动画控制：播放、暂停、调速、单步
 */

// 参数别名映射表
const PARAM_ALIASES = {
  v0: ['v0', '初速度'],  // 移除"速度"，避免与"重力加速度"冲突
  g: ['g', '重力', '重力加速度'],
  h: ['h', '高度', '初始高度'],
  theta: ['θ', '角度', '发射角度'],
  mass: ['m', '质量']
};

// 参数单位映射表
const PARAM_UNITS = {
  v0: 'm/s',
  g: 'm/s²',
  h: 'm',
  theta: '°',
  mass: 'kg'
};

// 参数中文名称
const PARAM_NAMES = {
  v0: '初速度',
  g: '重力加速度',
  h: '初始高度',
  theta: '发射角度',
  mass: '质量'
};

// 参数范围限制
export const PARAM_RANGES = {
  v0: { min: 1, max: 50 },
  g: { min: 1, max: 20 },
  h: { min: 10, max: 200 },
  theta: { min: 0, max: 90 },
  mass: { min: 0.1, max: 10 }
};

// 指令类型枚举
export const COMMAND_TYPES = {
  PARAM_UPDATE: 'param_update',        // 参数调整（绝对值）
  PARAM_RELATIVE: 'param_relative',    // 参数相对调整（增加/减少）
  PARAM_QUERY: 'param_query',          // 参数范围查询
  RESET: 'reset',                      // 重置参数
  PLAY: 'play',                        // 播放动画
  PAUSE: 'pause',                      // 暂停动画
  SPEED: 'speed',                      // 调整倍速
  STEP: 'step',                        // 单步前进
  ENV: 'env',                          // 切换环境（earth/moon/mars/custom）
  ENV_OPT: 'env_opt',                  // 环境选项（空气阻力）
  VIZ_TOGGLE: 'viz_toggle',            // 可视化开关（坐标轴/网格/频闪/矢量/自动缩放）
  CANVAS_ACTION: 'canvas_action'       // 画布操作（保存轨迹/重置缩放/重置动画）
};

/**
 * 解析平抛运动参数指令
 * @param {string} message - 用户输入的消息
 * @returns {Object} 解析结果
 *
 * 返回结构：
 * {
 *   type: 'param_update' | 'param_relative' | 'param_query' | 'reset' | 'play' | 'pause' | 'speed' | 'step' | null,
 *   params: { v0: 20, g: 10, ... },           // 仅在 type='param_update' 时存在
 *   relativeParams: { v0: 5, g: -2 },         // 仅在 type='param_relative' 时存在（数值为增量）
 *   queryParams: ['v0', 'g'] | 'all',         // 仅在 type='param_query' 时存在
 *   speedValue: 2,                             // 仅在 type='speed' 时存在
 *   raw: '原始消息内容'
 * }
 *
 * 示例：
 * parseProjectileParams("初速度 20m/s")
 *   → { type: 'param_update', params: { v0: 20 }, raw: '...' }
 *
 * parseProjectileParams("初速度增加 5")
 *   → { type: 'param_relative', relativeParams: { v0: 5 }, raw: '...' }
 *
 * parseProjectileParams("初速度的范围是多少")
 *   → { type: 'param_query', queryParams: ['v0'], raw: '...' }
 */
export function parseProjectileParams(message) {
  if (!message || typeof message !== 'string') {
    return { type: null, raw: message };
  }

  const result = {
    type: null,
    raw: message
  };

  // 0. 环境切换（优先检测，避免"月球重力"等被误识别为参数）
  const envMode = parseEnvironment(message);
  if (envMode) {
    result.type = COMMAND_TYPES.ENV;
    result.envValue = envMode;
    return result;
  }

  // 0b. 环境选项（空气阻力开关）
  const envOpt = parseEnvOption(message);
  if (envOpt) {
    result.type = COMMAND_TYPES.ENV_OPT;
    result.envOptKey = envOpt.key;
    result.envOptValue = envOpt.value;
    return result;
  }

  // 0c. 可视化开关（坐标轴/网格/频闪/矢量/自动缩放）
  const vizToggle = parseVizToggle(message);
  if (vizToggle) {
    result.type = COMMAND_TYPES.VIZ_TOGGLE;
    result.vizKey = vizToggle.key;
    result.vizValue = vizToggle.value;
    return result;
  }

  // 0d. 画布操作（保存轨迹/重置缩放/重置动画）
  const canvasAction = parseCanvasAction(message);
  if (canvasAction) {
    result.type = COMMAND_TYPES.CANVAS_ACTION;
    result.actionValue = canvasAction;
    return result;
  }

  // 1. 检测重置指令
  if (/重置|恢复默认|初始化|还原/.test(message) && /参数|平抛/.test(message)) {
    result.type = COMMAND_TYPES.RESET;
    return result;
  }

  // 2. 检测动画控制指令
  // 播放
  if (/播放|开始|启动/.test(message) && /动画|平抛/.test(message)) {
    result.type = COMMAND_TYPES.PLAY;
    return result;
  }

  // 暂停
  if (/暂停|停止/.test(message) && (/动画|平抛|轨迹/.test(message) || message.length < 10)) {
    result.type = COMMAND_TYPES.PAUSE;
    return result;
  }

  // 单步前进
  if (/单步|前进一步/.test(message)) {
    result.type = COMMAND_TYPES.STEP;
    return result;
  }

  // 调速（排除"重力加速度"、"初速度"等物理参数）
  // 只匹配明确的倍速指令，如"调速2倍"、"速度调到3倍"、"2倍速"
  if (!/重力|初速/.test(message)) {
    const speedMatch = message.match(/(?:调速|倍速).*?(\d+(?:\.\d+)?)\s*[倍x×X]?|(\d+(?:\.\d+)?)\s*[倍x×X]\s*(?:速|播放)/);
    if (speedMatch) {
      result.type = COMMAND_TYPES.SPEED;
      result.speedValue = parseFloat(speedMatch[1] || speedMatch[2]);
      return result;
    }
  }

  // 3. 检测范围查询指令
  const queryResult = parseRangeQuery(message);
  if (queryResult) {
    result.type = COMMAND_TYPES.PARAM_QUERY;
    result.queryParams = queryResult;
    return result;
  }

  // 4. 检测相对调整指令
  const relativeResult = parseRelativeAdjustment(message);
  if (relativeResult && Object.keys(relativeResult).length > 0) {
    result.type = COMMAND_TYPES.PARAM_RELATIVE;
    result.relativeParams = relativeResult;
    return result;
  }

  // 5. 检测绝对值参数调整指令（精准匹配 + 自然语言）
  const paramsResult = parseAbsoluteParams(message);
  if (paramsResult && Object.keys(paramsResult).length > 0) {
    result.type = COMMAND_TYPES.PARAM_UPDATE;
    result.params = paramsResult;
    return result;
  }

  // 未识别到任何指令
  return result;
}

/**
 * 解析范围查询指令
 * @param {string} message - 用户消息
 * @returns {Array|string|null} 查询的参数列表或 'all'
 */
function parseRangeQuery(message) {
  // 检测是否包含范围查询关键词
  if (!/范围|取值|最大|最小|上限|下限/.test(message)) {
    return null;
  }

  // 查询所有参数
  if (/所有|全部/.test(message) && /参数/.test(message)) {
    return 'all';
  }

  // 查询单个参数
  const queryParams = [];

  for (const [paramKey, aliases] of Object.entries(PARAM_ALIASES)) {
    for (const alias of aliases) {
      const pattern = new RegExp(alias);
      if (pattern.test(message)) {
        queryParams.push(paramKey);
        break;
      }
    }
  }

  return queryParams.length > 0 ? queryParams : null;
}

/**
 * 解析相对调整指令
 * @param {string} message - 用户消息
 * @returns {Object|null} 相对调整参数对象 { v0: 5, g: -2 }
 */
function parseRelativeAdjustment(message) {
  const relativeParams = {};

  // 增加关键词：增加、加、提高、上升
  // 减少关键词：减少、减、降低、下降

  // v0 - 初速度
  for (const alias of PARAM_ALIASES.v0) {
    // 增加
    let match = message.match(new RegExp(`${alias}\\s*(?:增加|加|提高|上升)\\s*(\\d+(?:\\.\\d+)?)`));
    if (match) {
      relativeParams.v0 = parseFloat(match[1]);
      break;
    }
    // 减少
    match = message.match(new RegExp(`${alias}\\s*(?:减少|减|降低|下降)\\s*(\\d+(?:\\.\\d+)?)`));
    if (match) {
      relativeParams.v0 = -parseFloat(match[1]);
      break;
    }
  }

  // g - 重力加速度
  for (const alias of PARAM_ALIASES.g) {
    let match = message.match(new RegExp(`${alias}\\s*(?:增加|加|提高|上升)\\s*(\\d+(?:\\.\\d+)?)`));
    if (match) {
      relativeParams.g = parseFloat(match[1]);
      break;
    }
    match = message.match(new RegExp(`${alias}\\s*(?:减少|减|降低|下降)\\s*(\\d+(?:\\.\\d+)?)`));
    if (match) {
      relativeParams.g = -parseFloat(match[1]);
      break;
    }
  }

  // h - 初始高度
  for (const alias of PARAM_ALIASES.h) {
    let match = message.match(new RegExp(`${alias}\\s*(?:增加|加|提高|上升)\\s*(\\d+(?:\\.\\d+)?)`));
    if (match) {
      relativeParams.h = parseFloat(match[1]);
      break;
    }
    match = message.match(new RegExp(`${alias}\\s*(?:减少|减|降低|下降)\\s*(\\d+(?:\\.\\d+)?)`));
    if (match) {
      relativeParams.h = -parseFloat(match[1]);
      break;
    }
  }

  // theta - 发射角度
  for (const alias of PARAM_ALIASES.theta) {
    let match = message.match(new RegExp(`${alias}\\s*(?:增加|加|提高|上升)\\s*(\\d+(?:\\.\\d+)?)`));
    if (match) {
      relativeParams.theta = parseFloat(match[1]);
      break;
    }
    match = message.match(new RegExp(`${alias}\\s*(?:减少|减|降低|下降)\\s*(\\d+(?:\\.\\d+)?)`));
    if (match) {
      relativeParams.theta = -parseFloat(match[1]);
      break;
    }
  }

  return Object.keys(relativeParams).length > 0 ? relativeParams : null;
}

/**
 * 解析绝对值参数（精准匹配 + 自然语言）
 * @param {string} message - 用户消息
 * @returns {Object|null} 参数对象 { v0: 20, g: 10 }
 */
function parseAbsoluteParams(message) {
  const params = {};

  // 精准匹配：参数名 + 数值 + 单位（可选）

  // v0 - 初速度
  for (const alias of PARAM_ALIASES.v0) {
    const pattern = new RegExp(`(?:${alias})\\s*[:：]?\\s*(\\d+(?:\\.\\d+)?)\\s*(?:m\\/s)?`, 'i');
    const match = message.match(pattern);
    if (match) {
      params.v0 = parseFloat(match[1]);
      break;
    }
  }

  // g - 重力加速度
  for (const alias of PARAM_ALIASES.g) {
    const pattern = new RegExp(`(?:${alias})\\s*[:：]?\\s*(\\d+(?:\\.\\d+)?)\\s*(?:m\\/s[²2])?`, 'i');
    const match = message.match(pattern);
    if (match) {
      params.g = parseFloat(match[1]);
      break;
    }
  }

  // h - 初始高度
  for (const alias of PARAM_ALIASES.h) {
    const pattern = new RegExp(`(?:${alias})\\s*[:：]?\\s*(\\d+(?:\\.\\d+)?)\\s*(?:m|米)?`, 'i');
    const match = message.match(pattern);
    if (match) {
      params.h = parseFloat(match[1]);
      break;
    }
  }

  // theta - 发射角度
  for (const alias of PARAM_ALIASES.theta) {
    const pattern = new RegExp(`(?:${alias})\\s*[:：]?\\s*(\\d+(?:\\.\\d+)?)\\s*(?:度|°)?`, 'i');
    const match = message.match(pattern);
    if (match) {
      params.theta = parseFloat(match[1]);
      break;
    }
  }

  // 如果精准匹配未找到参数，尝试自然语言解析
  if (Object.keys(params).length === 0) {
    return parseNaturalLanguage(message);
  }

  return Object.keys(params).length > 0 ? params : null;
}

/**
 * 自然语言解析（口语化指令）
 * @param {string} message - 用户消息
 * @returns {Object|null} 参数对象
 */
function parseNaturalLanguage(message) {
  const params = {};

  // 匹配 "把...调到/改成/设置为 数值" 格式

  // v0 - 初速度（只匹配"初速度"，不匹配"速度"，避免与"重力加速度"冲突）
  let match = message.match(/(?:把|将)?(?:平抛的?)?(?:初速度)(?:调到|改成|设置为|变成|调整为|修改为)\s*(\d+(?:\.\d+)?)/);
  if (match) {
    params.v0 = parseFloat(match[1]);
  }

  // g - 重力加速度
  match = message.match(/(?:把|将)?(?:平抛的?)?(?:重力|重力加速度)(?:调到|改成|设置为|变成|调整为|修改为)\s*(\d+(?:\.\d+)?)/);
  if (match) {
    params.g = parseFloat(match[1]);
  }

  // h - 初始高度
  match = message.match(/(?:把|将)?(?:平抛的?)?(?:高度|初始高度)(?:调到|改成|设置为|变成|调整为|修改为)\s*(\d+(?:\.\d+)?)/);
  if (match) {
    params.h = parseFloat(match[1]);
  }

  // theta - 发射角度
  match = message.match(/(?:把|将)?(?:平抛的?)?(?:角度|发射角度)(?:调到|改成|设置为|变成|调整为|修改为)\s*(\d+(?:\.\d+)?)/);
  if (match) {
    params.theta = parseFloat(match[1]);
  }

  return Object.keys(params).length > 0 ? params : null;
}

/**
 * 校验参数范围并自动修正
 * @param {Object} params - 参数对象
 * @returns {Object} { params: 修正后的参数, corrections: 修正记录 }
 *
 * 示例：
 * validateProjectileParams({ v0: 100 })
 *   → { params: { v0: 50 }, corrections: { v0: { original: 100, corrected: 50 } } }
 */
export function validateProjectileParams(params) {
  const corrections = {};
  const validatedParams = { ...params };

  for (const [key, value] of Object.entries(validatedParams)) {
    const range = PARAM_RANGES[key];
    if (!range) continue;

    if (value < range.min) {
      corrections[key] = { original: value, corrected: range.min };
      validatedParams[key] = range.min;
    } else if (value > range.max) {
      corrections[key] = { original: value, corrected: range.max };
      validatedParams[key] = range.max;
    }
  }

  return { params: validatedParams, corrections };
}

/**
 * 应用相对调整（计算新值）
 * @param {Object} relativeParams - 相对调整参数 { v0: 5, g: -2 }
 * @param {Object} currentParams - 当前参数值
 * @returns {Object} 计算后的绝对值参数对象
 *
 * 示例：
 * applyRelativeAdjustment({ v0: 5 }, { v0: 10, g: 9.8 })
 *   → { v0: 15 }
 */
export function applyRelativeAdjustment(relativeParams, currentParams) {
  const newParams = {};

  for (const [key, delta] of Object.entries(relativeParams)) {
    const currentValue = currentParams[key];
    if (currentValue !== undefined) {
      newParams[key] = currentValue + delta;
    }
  }

  return newParams;
}

/**
 * 生成参数确认回复文本
 * @param {Object} params - 参数对象
 * @param {Object} corrections - 修正记录
 * @returns {string} 确认文本
 *
 * 示例：
 * formatParamConfirmation({ v0: 20, g: 10 }, {})
 *   → "已将初速度调整为 **20 m/s**，重力加速度调整为 **10 m/s²**，平抛动画已更新。"
 */
export function formatParamConfirmation(params, corrections) {
  const messages = [];

  // 处理修正提示
  for (const [key, correction] of Object.entries(corrections)) {
    const name = PARAM_NAMES[key];
    const unit = PARAM_UNITS[key];
    const range = PARAM_RANGES[key];
    messages.push(
      `你输入的${name}数值超出范围（${range.min}-${range.max}），已自动调整为 **${correction.corrected} ${unit}**`
    );
  }

  // 处理正常参数确认
  const normalParams = Object.entries(params).filter(([key]) => !corrections[key]);
  if (normalParams.length > 0) {
    const paramTexts = normalParams.map(([key, value]) => {
      const name = PARAM_NAMES[key];
      const unit = PARAM_UNITS[key];
      return `${name}调整为 **${value} ${unit}**`;
    });

    if (paramTexts.length === 1) {
      messages.push(`已将${paramTexts[0]}`);
    } else {
      messages.push(`已将${paramTexts.join('，')}`);
    }
  }

  messages.push('平抛动画已更新。');

  return messages.join('，');
}

/**
 * 生成相对调整确认回复文本
 * @param {Object} relativeParams - 相对调整参数
 * @param {Object} oldValues - 旧值
 * @param {Object} newValues - 新值
 * @param {Object} corrections - 修正记录
 * @returns {string} 确认文本
 */
export function formatRelativeConfirmation(relativeParams, oldValues, newValues, corrections) {
  const messages = [];

  for (const [key, delta] of Object.entries(relativeParams)) {
    const name = PARAM_NAMES[key];
    const unit = PARAM_UNITS[key];
    const oldValue = oldValues[key];
    const newValue = newValues[key];

    if (corrections[key]) {
      // 有修正
      const range = PARAM_RANGES[key];
      const action = delta > 0 ? '增加' : '减少';
      messages.push(
        `${name}${action} ${Math.abs(delta)} 后为 ${oldValue + delta} ${unit}，超出范围（${range.min}-${range.max}），已自动调整为 **${newValue} ${unit}**`
      );
    } else {
      // 无修正
      const action = delta > 0 ? '增加到' : '减少到';
      messages.push(
        `已将${name}从 ${oldValue} ${unit} ${action} **${newValue} ${unit}**`
      );
    }
  }

  messages.push('平抛动画已更新。');

  return messages.join('，');
}

/**
 * 生成范围查询回复文本
 * @param {Array|string} queryParams - 查询的参数列表或 'all'
 * @returns {string} 回复文本
 */
export function formatRangeQueryResponse(queryParams) {
  if (queryParams === 'all') {
    // 返回所有参数范围
    const lines = [
      '平抛运动模拟支持的参数范围如下：',
      '',
      `- **初速度（v₀）**：${PARAM_RANGES.v0.min} ~ ${PARAM_RANGES.v0.max} m/s`,
      `- **重力加速度（g）**：${PARAM_RANGES.g.min} ~ ${PARAM_RANGES.g.max} m/s²`,
      `- **初始高度（h）**：${PARAM_RANGES.h.min} ~ ${PARAM_RANGES.h.max} m`,
      `- **发射角度（θ）**：${PARAM_RANGES.theta.min} ~ ${PARAM_RANGES.theta.max}°`,
      `- **质量（m）**：${PARAM_RANGES.mass.min} ~ ${PARAM_RANGES.mass.max} kg`
    ];
    return lines.join('\n');
  }

  if (Array.isArray(queryParams) && queryParams.length > 0) {
    // 返回指定参数范围
    const lines = queryParams.map(key => {
      const name = PARAM_NAMES[key];
      const unit = PARAM_UNITS[key];
      const range = PARAM_RANGES[key];
      return `**${name}**的有效范围是 **${range.min} ~ ${range.max} ${unit}**`;
    });
    return lines.join('\n\n');
  }

  return '平抛运动模拟中没有该参数，支持的参数有：初速度、重力加速度、初始高度、发射角度、质量。';
}

/**
 * 解析环境切换指令
 * 要求明确的切换动词，避免"月球上的重力"等问句误触发
 */
function parseEnvironment(message) {
  const switchVerb = /切换到|换到|改成|变成|模拟|在.*上/;
  if (switchVerb.test(message) && /月球|moon/i.test(message)) return 'moon';
  if (switchVerb.test(message) && /火星|mars/i.test(message)) return 'mars';
  if (switchVerb.test(message) && /地球|earth/i.test(message)) return 'earth';
  if (/月球.*(环境|模式)/.test(message)) return 'moon';
  if (/火星.*(环境|模式)/.test(message)) return 'mars';
  if (/地球.*(环境|模式)/.test(message)) return 'earth';
  if (/(切换到|换到|改成|自定义).*(自定义|custom)/i.test(message) || /自定义.*(环境|模式)/.test(message)) return 'custom';
  return null;
}

/**
 * 解析环境选项（空气阻力开关）
 */
function parseEnvOption(message) {
  if (/空气阻力|阻力系数/.test(message)) {
    // 检测阻力系数数值设置，如"阻力系数0.3"、"阻力系数设为0.5"
    const numMatch = message.match(/(\d+\.?\d*)/);
    if (numMatch && /系数|k值/.test(message)) {
      const v = parseFloat(numMatch[1]);
      if (!isNaN(v)) return { key: 'drag', value: v };
    }
    if (/打开|开启|开|加|添加|启用/.test(message)) return { key: 'air', value: true };
    if (/关闭|关|取消|移除|禁用|去掉/.test(message)) return { key: 'air', value: false };
  }
  return null;
}

/**
 * 解析可视化开关指令
 */
function parseVizToggle(message) {
  const on = /打开|开启|显示|恢复|开/;
  const off = /隐藏|关闭|取消|关/;

  if (/坐标轴/.test(message)) {
    if (off.test(message)) return { key: 'axis', value: false };
    if (on.test(message)) return { key: 'axis', value: true };
  }
  if (/网格/.test(message)) {
    if (on.test(message)) return { key: 'grid', value: true };
    if (off.test(message)) return { key: 'grid', value: false };
  }
  if (/频闪/.test(message)) {
    // 检测间隔帧数，如"频闪间隔20帧"、"频闪间隔设为30"
    const numMatch = message.match(/(\d+)/);
    if (numMatch && /间隔|帧/.test(message)) {
      const v = parseInt(numMatch[1]);
      if (!isNaN(v)) return { key: 'strobe-interval', value: v };
    }
    if (on.test(message)) return { key: 'strobe', value: true };
    if (off.test(message)) return { key: 'strobe', value: false };
  }
  if (/矢量|速度矢量|速度向量/.test(message)) {
    if (on.test(message)) return { key: 'vector', value: true };
    if (off.test(message)) return { key: 'vector', value: false };
  }
  if (/自动缩放|自动比例/.test(message)) {
    if (on.test(message)) return { key: 'autoscale', value: true };
    if (off.test(message)) return { key: 'autoscale', value: false };
  }
  return null;
}

/**
 * 解析画布操作指令
 */
function parseCanvasAction(message) {
  if (/保存轨迹|保存当前轨迹|保存路径/.test(message)) return 'save';
  if (/重置缩放|重置视图|恢复缩放|恢复视图/.test(message)) return 'reset-zoom';
  if (/重置动画|重置播放|动画重置/.test(message)) return 'reset';
  return null;
}
