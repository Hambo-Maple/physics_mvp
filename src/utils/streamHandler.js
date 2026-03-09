/**
 * 流式数据处理工具
 * 用于处理 SSE（Server-Sent Events）流式响应
 */

/**
 * 创建流式请求
 * @param {String} message - 用户消息
 * @param {Array} history - 历史消息
 * @param {Function} onChunk - 接收到数据块时的回调 (delta) => void
 * @param {Function} onComplete - 流式完成时的回调 (fullText) => void
 * @param {Function} onError - 错误时的回调 (error) => void
 */
export const createStreamRequest = (message, history, onChunk, onComplete, onError) => {
  let fullText = '';

  // 使用 fetch 的流式读取
  fetch('http://localhost:3001/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, history })
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      // 递归读取流式数据
      const readChunk = () => {
        reader.read().then(({ done, value }) => {
          if (done) {
            // 流式完成
            onComplete(fullText);
            return;
          }

          // 解码数据
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          lines.forEach(line => {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.done) {
                  // 流式完成
                  onComplete(fullText);
                } else if (data.delta) {
                  // 累积文本
                  fullText += data.delta;
                  onChunk(data.delta);
                }
              } catch (e) {
                console.error('解析 SSE 数据失败:', e);
              }
            }
          });

          // 继续读取下一块
          readChunk();
        }).catch(onError);
      };

      readChunk();
    })
    .catch(onError);
};
