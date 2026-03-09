/**
 * 语音处理工具模块
 * 提供录音、音频转换、语音识别等功能
 */

let mediaRecorder = null;
let audioChunks = [];

/**
 * 检查浏览器是否支持 MediaRecorder API
 * @returns {boolean} 是否支持
 */
export function checkMediaRecorderSupport() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
}

/**
 * 开始录音
 * @returns {Promise<void>}
 * @throws {Error} 麦克风权限拒绝或浏览器不支持
 */
export async function startRecording() {
  if (!checkMediaRecorderSupport()) {
    throw new Error('您的浏览器不支持语音输入');
  }

  try {
    // 请求麦克风权限
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // 清空之前的录音数据
    audioChunks = [];

    // 尝试使用 WAV 格式，如果不支持则使用默认格式
    let options = { mimeType: 'audio/webm' };
    if (MediaRecorder.isTypeSupported('audio/wav')) {
      options = { mimeType: 'audio/wav' };
    } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      options = { mimeType: 'audio/webm;codecs=opus' };
    }

    // 创建 MediaRecorder 实例
    mediaRecorder = new MediaRecorder(stream, options);

    // 监听数据可用事件
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    // 开始录音
    mediaRecorder.start();

    console.log('录音已开始，格式:', mediaRecorder.mimeType);
  } catch (error) {
    console.error('录音启动失败:', error);
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      throw new Error('麦克风权限被拒绝，请在浏览器设置中开启');
    }
    throw new Error('录音启动失败，请检查麦克风设备');
  }
}

/**
 * 停止录音
 * @returns {Promise<Blob>} 录音数据 Blob
 * @throws {Error} 录音未启动或停止失败
 */
export function stopRecording() {
  return new Promise((resolve, reject) => {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
      reject(new Error('录音未启动'));
      return;
    }

    // 监听停止事件
    mediaRecorder.onstop = () => {
      // 合并音频数据
      const audioBlob = new Blob(audioChunks, { type: mediaRecorder.mimeType });

      // 停止所有音频轨道
      mediaRecorder.stream.getTracks().forEach(track => track.stop());

      console.log('录音已停止，音频大小:', audioBlob.size, 'bytes');
      resolve(audioBlob);
    };

    // 停止录音
    mediaRecorder.stop();
  });
}

/**
 * 将 Blob 转换为 Base64 字符串
 * @param {Blob} blob - 音频 Blob 数据
 * @returns {Promise<string>} Base64 字符串
 */
export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // 移除 data:audio/webm;base64, 前缀
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * 获取音频格式
 * @param {Blob} blob - 音频 Blob 数据
 * @returns {string} 音频格式（webm/ogg/wav）
 */
export function getAudioFormat(blob) {
  const mimeType = blob.type;
  if (mimeType.includes('webm')) return 'webm';
  if (mimeType.includes('ogg')) return 'ogg';
  if (mimeType.includes('wav')) return 'wav';
  return 'webm'; // 默认
}

/**
 * 调用后端语音识别接口
 * @param {string} audioBase64 - Base64 编码的音频数据
 * @param {string} format - 音频格式
 * @returns {Promise<string>} 识别的文字内容
 * @throws {Error} 识别失败
 */
export async function recognizeVoice(audioBase64, format) {
  try {
    const response = await fetch('http://localhost:3001/api/voice/recognize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        audio: audioBase64,
        format: format
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || '识别失败，请稍后重试');
    }

    if (!data.text || data.text.trim() === '') {
      throw new Error('未识别到内容，请重试');
    }

    return data.text;
  } catch (error) {
    console.error('语音识别失败:', error);
    throw error;
  }
}
