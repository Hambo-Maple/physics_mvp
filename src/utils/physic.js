/**
 * 物理计算模块 - 平抛运动
 *
 * 坐标系约定：
 * - 物理坐标系：Y 轴向上为正，原点在地面
 * - Canvas 坐标系：Y 轴向下为正，原点在左上角
 * - 本模块所有计算使用物理坐标系，渲染时需要进行坐标转换
 */

/**
 * 计算给定时刻的位置（物理坐标系）
 *
 * 公式：
 * - 水平位移：x = v₀ · t · cos(θ)
 * - 竖直位移：y = h + v₀ · t · sin(θ) - ½ · g · t²
 *
 * @param {number} v0 - 初速度 (m/s)
 * @param {number} g - 重力加速度 (m/s²)
 * @param {number} h - 初始高度 (m)
 * @param {number} theta - 发射角度 (度)
 * @param {number} t - 时间 (s)
 * @returns {{x: number, y: number}} 位置坐标 (m)
 */
export function calculatePosition(v0, g, h, theta, t) {
  const thetaRad = (theta * Math.PI) / 180;
  const x = v0 * t * Math.cos(thetaRad);
  const y = h + v0 * t * Math.sin(thetaRad) - 0.5 * g * t * t;
  return { x, y };
}

/**
 * 计算给定时刻的速度（物理坐标系）
 *
 * 公式：
 * - 水平速度：vₓ = v₀ · cos(θ)（恒定）
 * - 竖直速度：vᵧ = v₀ · sin(θ) - g · t
 * - 合速度：v = √(vₓ² + vᵧ²)
 *
 * @param {number} v0 - 初速度 (m/s)
 * @param {number} g - 重力加速度 (m/s²)
 * @param {number} theta - 发射角度 (度)
 * @param {number} t - 时间 (s)
 * @returns {{vx: number, vy: number, v: number}} 速度分量和合速度 (m/s)
 */
export function calculateVelocity(v0, g, theta, t) {
  const thetaRad = (theta * Math.PI) / 180;
  const vx = v0 * Math.cos(thetaRad);
  const vy = v0 * Math.sin(thetaRad) - g * t;
  const v = Math.sqrt(vx * vx + vy * vy);
  return { vx, vy, v };
}

/**
 * 预测落地时间
 *
 * 解方程：y = 0
 * h + v₀·t·sin(θ) - ½·g·t² = 0
 *
 * 使用求根公式：t = [v₀·sin(θ) + √((v₀·sin(θ))² + 2gh)] / g
 *
 * @param {number} v0 - 初速度 (m/s)
 * @param {number} g - 重力加速度 (m/s²)
 * @param {number} h - 初始高度 (m)
 * @param {number} theta - 发射角度 (度)
 * @returns {number} 落地时间 (s)，如果无解返回 Infinity
 */
export function predictLandingTime(v0, g, h, theta) {
  if (g === 0) {
    return Infinity; // 无重力，物体不会落地
  }

  const thetaRad = (theta * Math.PI) / 180;
  const v0y = v0 * Math.sin(thetaRad);

  // 判别式：(v0y)² + 2gh
  const discriminant = v0y * v0y + 2 * g * h;

  if (discriminant < 0) {
    return Infinity; // 无物理解
  }

  // 求根公式：t = [v0y + √discriminant] / g
  const t = (v0y + Math.sqrt(discriminant)) / g;
  return t;
}

/**
 * 计算最高点时间和位置
 *
 * 最高点条件：vᵧ = 0
 * 时间：t = v₀·sin(θ) / g
 *
 * @param {number} v0 - 初速度 (m/s)
 * @param {number} g - 重力加速度 (m/s²)
 * @param {number} h - 初始高度 (m)
 * @param {number} theta - 发射角度 (度)
 * @returns {{x: number, y: number, t: number}} 最高点位置和时间
 */
export function calculatePeakPoint(v0, g, h, theta) {
  const thetaRad = (theta * Math.PI) / 180;
  const v0y = v0 * Math.sin(thetaRad);

  if (v0y <= 0) {
    // 向下或水平抛，初始点即为最高点
    return { x: 0, y: h, t: 0 };
  }

  if (g === 0) {
    // 无重力，物体一直上升
    return { x: Infinity, y: Infinity, t: Infinity };
  }

  const tPeak = v0y / g;
  const pos = calculatePosition(v0, g, h, theta, tPeak);
  return { x: pos.x, y: pos.y, t: tPeak };
}

/**
 * 参数校验
 *
 * @param {Object} params - 参数对象
 * @param {number} params.v0 - 初速度 (m/s)
 * @param {number} params.g - 重力加速度 (m/s²)
 * @param {number} params.h - 初始高度 (m)
 * @param {number} params.theta - 发射角度 (度)
 * @returns {{valid: boolean, errors: string[]}} 验证结果
 */
export function validateParams(params) {
  const errors = [];

  if (params.v0 < 1 || params.v0 > 50) {
    errors.push('初速度必须在 1-50 m/s 范围内');
  }
  if (params.g < 1 || params.g > 20) {
    errors.push('重力加速度必须在 1-20 m/s² 范围内');
  }
  if (params.h < 10 || params.h > 200) {
    errors.push('初始高度必须在 10-200 m 范围内');
  }
  if (params.theta < 0 || params.theta > 90) {
    errors.push('发射角度必须在 0-90° 范围内');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
