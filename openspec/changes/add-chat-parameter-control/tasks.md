# Tasks: 对话消息控制平抛运动参数

## Phase 1: 核心工具函数实现

- [x] 创建 `src/utils/paramParser.js` 文件
- [x] 实现 `parseProjectileParams(message)` 函数
  - [x] 实现精准匹配规则（正则表达式匹配参数名+数值+单位）
  - [x] 实现自然语言解析规则（关键词匹配+数值提取）
  - [x] 实现相对调整指令识别（"增加"、"减少"、"提高"、"降低"等关键词）
  - [x] 实现范围查询指令识别（"范围"、"取值"、"最大"、"最小"等关键词）
  - [x] 实现重置指令识别（"重置"、"恢复默认"等关键词）
  - [x] 实现动画控制指令识别（"播放"、"暂停"、"调速"、"单步"等）
  - [x] 返回标准化的解析结果对象（type, params, relativeParams, queryParams, speedValue, raw）
- [x] 实现 `validateProjectileParams(params)` 函数
  - [x] 定义参数范围常量（PARAM_RANGES）
  - [x] 校验每个参数是否在范围内
  - [x] 超出范围时自动修正为边界值
  - [x] 返回修正后的参数和修正记录
- [x] 实现 `formatParamConfirmation(params, corrections)` 函数
  - [x] 生成单参数确认文本（包含参数名+数值+单位）
  - [x] 生成多参数确认文本（逗号分隔）
  - [x] 生成参数超出范围的提示文本
  - [x] 参数数值使用 Markdown 加粗格式（**20**）
- [x] 实现 `applyRelativeAdjustment(relativeParams, currentParams)` 函数
  - [x] 读取当前参数值
  - [x] 根据相对调整值计算新值（增加/减少）
  - [x] 返回计算后的绝对值参数对象
- [x] 实现 `formatRelativeConfirmation(relativeParams, oldValues, newValues, corrections)` 函数
  - [x] 生成相对调整确认文本（包含旧值→新值）
  - [x] 生成超出范围的修正提示
- [x] 实现 `formatRangeQueryResponse(queryParams)` 函数
  - [x] 生成单个参数范围回复文本
  - [x] 生成所有参数范围回复文本（列表格式）
  - [x] 生成无效参数查询的提示文本
- [x] 添加完整中文注释，说明解析规则和示例

## Phase 2: 全局状态管理扩展

- [x] 修改 `src/store/index.js`
  - [x] 扩展 `updateProjectileParams(params)` 支持部分参数更新
  - [x] 添加 `resetProjectileParams()` 函数，恢复所有参数为默认值
  - [x] 添加默认参数常量 `DEFAULT_PROJECTILE_PARAMS`
  - [x] 添加中文注释说明参数更新逻辑

## Phase 3: 平抛运动组件扩展

- [x] 修改 `src/components/ProjectileMotion.vue`
  - [x] 导出 `togglePlayPause()` 函数（供 ChatBox 调用）
  - [x] 导出 `resetAnimation()` 函数（供 ChatBox 调用）
  - [x] 导出 `setTimeScale(speed)` 函数（供 ChatBox 调用）
  - [x] 导出 `stepForward()` 函数（供 ChatBox 调用）
  - [x] 确保导出的函数可以被外部组件调用
  - [x] 添加中文注释说明导出函数的用途

## Phase 4: 对话组件集成

- [x] 修改 `src/components/ChatBox.vue`
  - [x] 导入 `parseProjectileParams`, `validateProjectileParams`, `formatParamConfirmation` 函数
  - [x] 导入 `updateProjectileParams`, `resetProjectileParams` 函数
  - [x] 导入 ProjectileMotion 组件的动画控制函数（通过 ref 或事件总线）
  - [x] 在 `sendMessage()` 函数中集成指令解析逻辑
    - [x] 调用 `parseProjectileParams()` 解析用户消息
    - [x] 判断解析结果类型（param_update / param_relative / param_query / reset / play / pause / speed / step / null）
    - [x] 若为 param_update，调用 `validateProjectileParams()` 校验参数
    - [x] 若为 param_update，调用 `updateProjectileParams()` 更新全局状态
    - [x] 若为 param_relative，调用 `applyRelativeAdjustment()` 计算新值
    - [x] 若为 param_relative，调用 `validateProjectileParams()` 校验新值
    - [x] 若为 param_relative，调用 `updateProjectileParams()` 更新全局状态
    - [x] 若为 param_query，调用 `formatRangeQueryResponse()` 生成范围回复
    - [x] 若为 reset，调用 `resetProjectileParams()` 重置参数
    - [x] 若为动画控制指令，调用对应的动画控制函数
    - [x] 生成确认文本（调用 `formatParamConfirmation()` 或 `formatRelativeConfirmation()`）
    - [x] 在 AI 回复前插入确认文本（在流式输出完成后拼接）
  - [x] 在流式输出完成回调中，检测是否有参数更新
  - [x] 若有参数更新，在 AI 回复内容前插入确认文本
  - [x] 若解析失败（无有效参数），在 AI 回复中插入提示文本
  - [x] 添加中文注释说明指令解析和参数更新流程

## Phase 5: 动画控制联动

- [x] 实现 ChatBox 与 ProjectileMotion 的通信机制
  - [x] 方案 A：通过全局状态（在 store 中添加动画控制状态）
  - [x] 方案 B：通过事件总线（使用 mitt 或 Vue 3 provide/inject）
  - [x] 方案 C：通过 ref 引用（在父组件 App.vue 中获取 ProjectileMotion 的 ref）
  - [x] 选择并实现一种方案（推荐方案 C，最直接）
- [x] 在 `src/App.vue` 中获取 ProjectileMotion 组件的 ref
- [x] 将 ProjectileMotion 的 ref 传递给 ChatBox（通过 props 或 provide）
- [x] 在 ChatBox 中调用 ProjectileMotion 的动画控制函数

## Phase 6: 测试与验证

- [ ] 测试精准匹配指令解析
  - [ ] 测试单参数指令（"初速度 20m/s"）
  - [ ] 测试省略单位指令（"重力 10"）
  - [ ] 测试多参数指令（"初速度 20 重力 9.8 高度 60 角度 30"）
  - [ ] 测试各种参数名别名（v0 / 初速度 / 速度）
- [ ] 测试自然语言指令解析
  - [ ] 测试口语化单参数指令（"把平抛的初始速度调到 20"）
  - [ ] 测试口语化多参数指令（"重力改成 10，高度 50"）
- [ ] 测试相对调整指令
  - [ ] 测试增加参数指令（"初速度增加 5"），验证从当前值增加
  - [ ] 测试减少参数指令（"重力减少 2"），验证从当前值减少
  - [ ] 测试相对调整导致超出范围，验证自动修正并提示
  - [ ] 测试多种表述（"高度加 20"、"角度提高 15"、"速度降低 5"）
- [ ] 测试范围查询指令
  - [ ] 测试单个参数范围查询（"初速度的范围是多少"），验证 AI 回复包含范围
  - [ ] 测试所有参数范围查询（"所有参数的范围"），验证 AI 回复包含所有参数范围列表
  - [ ] 测试无效参数查询（"温度的范围是多少"），验证 AI 回复提示不存在该参数
- [ ] 测试重置指令
  - [ ] 测试 "重置平抛参数"
  - [ ] 测试 "恢复默认值"
  - [ ] 验证所有参数恢复为默认值
  - [ ] 验证动画重置
- [ ] 测试动画控制指令
  - [ ] 测试 "播放平抛动画"，验证动画开始播放，按钮状态更新
  - [ ] 测试 "暂停平抛动画"，验证动画暂停，按钮状态更新
  - [ ] 测试 "调速 2 倍"，验证动画倍速更新，对应按钮高亮
  - [ ] 测试 "单步前进"，验证动画前进一帧
- [ ] 测试参数范围校验
  - [ ] 测试超出上限参数（"初速度 100"），验证修正为 50，AI 回复包含提示
  - [ ] 测试超出下限参数（"重力 0.5"），验证修正为 1，AI 回复包含提示
  - [ ] 测试多参数部分超出范围，验证仅超出参数被修正
- [ ] 测试解析失败处理
  - [ ] 测试无具体数值指令（"调整初速度"），验证 AI 回复提示
  - [ ] 测试无匹配参数指令（"调整温度 30"），验证 AI 回复提示
  - [ ] 测试非参数控制指令（"显示公式"），验证原有逻辑不受影响
- [ ] 测试全局状态同步
  - [ ] 验证参数调整后，公式展示区实时更新
  - [ ] 验证参数调整后，鼠标吸附功能读取最新参数
  - [ ] 验证动画控制后，控制按钮状态同步
- [ ] 测试兼容性
  - [ ] 验证流式输出功能正常工作
  - [ ] 验证语音输入功能正常工作
  - [ ] 验证鼠标吸附功能正常工作
  - [ ] 验证公式渲染功能正常工作
  - [ ] 验证墨绿色主题保持一致
- [ ] 测试 AI 回复格式
  - [ ] 验证单参数确认回复格式
  - [ ] 验证多参数确认回复格式
  - [ ] 验证参数超出范围的异常回复格式
  - [ ] 验证解析失败的提示回复格式
  - [ ] 验证回复中的公式仍使用 KaTeX 渲染

## Phase 7: 文档与优化

- [x] 在 `src/utils/paramParser.js` 中添加指令解析示例注释
- [x] 在 `src/components/ChatBox.vue` 中添加参数控制流程注释
- [x] 验证所有中文注释完整且清晰
- [ ] 代码格式化和 lint 检查
- [ ] 性能验证（指令解析无明显延迟）

## Phase 8: 文档输出

- [x] 创建详细测试计划文档（TEST_PLAN.md）
- [x] 创建实现总结文档（IMPLEMENTATION_SUMMARY.md）
- [x] 更新 tasks.md 标记已完成任务
