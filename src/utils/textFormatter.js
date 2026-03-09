/**
 * 文本格式化工具
 * 用于自动识别物理关键词并加粗
 */

// 物理关键词列表（按长度降序排列，避免短词匹配导致嵌套）
const physicsKeywords = [
  '一阶线性微分方程', '机械能守恒', '牛顿第二定律', '匀速直线运动', '重力加速度',
  '分离变量法', '自由落体', '平抛运动', '水平方向', '竖直方向',
  '微分方程', '初速度', '加速度', '抛物线', '轨迹',
  '位移', '速度', '时间', '动能', '势能', '恒定'
];

/**
 * 自动加粗关键词
 * @param {String} text - 原始文本
 * @returns {String} - 加粗后的文本
 */
export const boldKeywords = (text) => {
  if (!text) return '';

  // 先提取公式区域，避免公式内的关键词被加粗
  const formulaRegex = /(\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\$\$[\s\S]*?\$\$|\$[^\$]+?\$)/g;
  const formulas = [];
  let processedText = text;

  // 用占位符替换公式
  processedText = processedText.replace(formulaRegex, (match) => {
    const index = formulas.length;
    formulas.push(match);
    return `__FORMULA_${index}__`;
  });

  // 在非公式区域加粗关键词
  physicsKeywords.forEach(keyword => {
    // 使用负向前瞻和负向后顾，避免在已加粗的内容中再次加粗
    const regex = new RegExp(`(?<!<strong>[^<]*)(${keyword})(?![^<]*<\/strong>)`, 'g');
    processedText = processedText.replace(regex, '<strong>$1</strong>');
  });

  // 恢复公式
  formulas.forEach((formula, index) => {
    processedText = processedText.replace(`__FORMULA_${index}__`, formula);
  });

  return processedText;
};

/**
 * 格式化物理回答文本
 * 先加粗关键词，保持公式完整
 * @param {String} text - 原始文本
 * @returns {String} - 格式化后的文本
 */
export const formatPhysicsAnswer = (text) => {
  if (!text) return '';

  console.log('formatPhysicsAnswer 输入:', text);

  // 应用关键词加粗
  const result = boldKeywords(text);

  console.log('formatPhysicsAnswer 输出:', result);

  return result;
};
