/**
 * 语音处理工具模块
 * 提供录音、音频转换、语音识别等功能
 */

let mediaRecorder = null;
let audioChunks = [];

// 连续语音模式相关变量
let audioContext = null;
let analyser = null;
let silenceTimer = null;
let volumeCheckInterval = null;
let currentStream = null;

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

/**
 * 计算音频数据的 RMS（均方根）音量
 * @param {Uint8Array} dataArray - 音频时域数据
 * @returns {number} RMS 音量值（0-255）
 */
function calculateRMS(dataArray) {
  let sum = 0;
  for (let i = 0; i < dataArray.length; i++) {
    const normalized = (dataArray[i] - 128) / 128; // 归一化到 -1 到 1
    sum += normalized * normalized;
  }
  const rms = Math.sqrt(sum / dataArray.length);
  return rms * 255; // 转换回 0-255 范围
}

/**
 * 开始连续语音模式的麦克风监听（带静音检测）
 * @param {Function} onSilenceDetected - 检测到静音时的回调函数
 * @param {Function} onVolumeUpdate - 音量更新回调（用于波形动画）
 * @param {number} silenceThreshold - 静音阈值（RMS < 此值视为静音，默认 5）
 * @param {number} silenceDuration - 静音持续时长（毫秒，默认 1500ms）
 * @returns {Promise<MediaStream>} 麦克风音频流
 * @throws {Error} 麦克风权限拒绝或浏览器不支持
 */
export async function startContinuousListening(
  onSilenceDetected,
  onVolumeUpdate,
  silenceThreshold = 5,
  silenceDuration = 1500
) {
  if (!checkMediaRecorderSupport()) {
    throw new Error('您的浏览器不支持语音输入');
  }

  try {
    // 请求麦克风权限
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    currentStream = stream;

    // 创建 AudioContext 和 AnalyserNode
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;

    // 连接麦克风流到分析器
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    // 创建数据数组
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    let hasDetectedSound = false; // 是否检测到过声音
    let isSilent = false;
    let silenceStartTime = null;

    // 定期检查音量
    volumeCheckInterval = setInterval(() => {
      analyser.getByteTimeDomainData(dataArray);
      const volume = calculateRMS(dataArray);

      // 回调音量更新（用于波形动画）
      if (onVolumeUpdate) {
        onVolumeUpdate(volume);
      }

      // 检测是否有声音
      if (volume >= silenceThreshold) {
        hasDetectedSound = true; // 标记已检测到声音
        isSilent = false;
        silenceStartTime = null;
      } else {
        // 当前是静音
        // 只有在检测到过声音之后，静音才开始计时
        if (hasDetectedSound) {
          if (!isSilent) {
            // 刚开始静音
            isSilent = true;
            silenceStartTime = Date.now();
          } else {
            // 持续静音，检查是否超过阈值时长
            const silentTime = Date.now() - silenceStartTime;
            if (silentTime >= silenceDuration) {
              // 触发静音检测回调
              if (onSilenceDetected) {
                onSilenceDetected();
              }
              // 重置状态，准备下一轮检测
              hasDetectedSound = false;
              isSilent = false;
              silenceStartTime = null;
            }
          }
        }
        // 如果还没检测到声音，不做任何处理，继续等待
      }
    }, 100); // 每 100ms 检查一次

    console.log('连续语音监听已启动，静音阈值:', silenceThreshold, '静音时长:', silenceDuration, 'ms');
    return stream;
  } catch (error) {
    console.error('连续语音监听启动失败:', error);
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      throw new Error('麦克风权限被拒绝，请在浏览器设置中开启');
    }
    throw new Error('麦克风启动失败，请检查麦克风设备');
  }
}

/**
 * 停止连续语音模式的麦克风监听
 * 清理所有音频资源
 */
export function stopContinuousListening() {
  // 清除音量检查定时器
  if (volumeCheckInterval) {
    clearInterval(volumeCheckInterval);
    volumeCheckInterval = null;
  }

  // 清除静音定时器
  if (silenceTimer) {
    clearTimeout(silenceTimer);
    silenceTimer = null;
  }

  // 停止音频流
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
    currentStream = null;
  }

  // 关闭 AudioContext
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }

  analyser = null;

  console.log('连续语音监听已停止，资源已清理');
}

/**
 * 获取当前实时音量（用于波形动画）
 * @returns {number} 当前音量值（0-255），如果未初始化返回 0
 */
export function getCurrentVolume() {
  if (!analyser) {
    return 0;
  }

  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteTimeDomainData(dataArray);
  return calculateRMS(dataArray);
}
