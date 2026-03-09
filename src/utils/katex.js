/**
 * KaTeX 公式渲染工具函数
 * 用于在指定 DOM 元素中自动渲染数学公式
 */

/**
 * 在指定元素中渲染数学公式
 * 支持行内公式（$...$）和块级公式（$$...$$）
 *
 * @param {HTMLElement} element - 需要渲染公式的 DOM 元素
 */
export const renderMathInElement = (element) => {
  if (!element) return;

  // 检查 KaTeX 是否已加载
  if (typeof window.renderMathInElement === 'undefined') {
    console.warn('KaTeX auto-render 未加载，无法渲染公式');
    return;
  }

  try {
    // 调用 KaTeX auto-render 扩展
    window.renderMathInElement(element, {
      delimiters: [
        { left: '$$', right: '$$', display: true },   // 块级公式
        { left: '$', right: '$', display: false },     // 行内公式
        { left: '\\[', right: '\\]', display: true },  // LaTeX 块级公式
        { left: '\\(', right: '\\)', display: false }  // LaTeX 行内公式
      ],
      throwOnError: false,  // 遇到错误不抛出异常，继续渲染其他公式
      errorColor: '#cc0000' // 错误公式显示为红色
    });
  } catch (error) {
    console.error('KaTeX 渲染失败:', error);
  }
};

/**
 * 将文本中的公式渲染为 HTML
 * @param {String} text - 包含公式的文本（可能包含 HTML 标签）
 * @returns {String} - 渲染后的 HTML
 */
export const renderMathToHTML = (text) => {
  console.log('renderMathToHTML 被调用，输入文本:', text);

  if (!text) return '';

  // 如果 KaTeX 未加载，返回原始文本
  if (typeof window === 'undefined' || typeof window.katex === 'undefined' || typeof window.renderMathInElement === 'undefined') {
    console.warn('KaTeX 未加载，返回原始文本');
    return text;
  }

  try {
    // 创建临时容器
    const tempDiv = document.createElement('div');
    // 使用 innerHTML 而不是 textContent，保留 HTML 标签
    tempDiv.innerHTML = text;

    console.log('渲染前 HTML:', tempDiv.innerHTML);

    // 渲染公式
    window.renderMathInElement(tempDiv, {
      delimiters: [
        { left: '$$', right: '$$', display: true },   // 块级公式
        { left: '$', right: '$', display: false },     // 行内公式
        { left: '\\[', right: '\\]', display: true },  // LaTeX 块级公式
        { left: '\\(', right: '\\)', display: false }  // LaTeX 行内公式
      ],
      throwOnError: false,
      errorColor: '#cc0000'
    });

    console.log('渲染后 HTML:', tempDiv.innerHTML);
    return tempDiv.innerHTML;
  } catch (error) {
    console.error('KaTeX 渲染失败:', error);
    return text;
  }
};
