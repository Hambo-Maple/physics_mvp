# Spec: Global State Management

## ADDED Requirements

### Requirement: Reactive State Object
**ID**: `state-management-001`
**Priority**: P0

The application MUST use Vue 3's built-in `reactive` to create a global state object, managing message list (messageList) and current visualization type (currentVisualType), and expose operation methods.

#### Scenario: 状态对象正确定义
**Given** 存在 `src/store/index.js` 文件
**When** 导入状态对象
**Then** 应包含 `messageList` 数组，初始值为空数组
**And** 应包含 `currentVisualType` 字符串，初始值为空字符串 ''
**And** 应暴露 `addMessage(message)` 方法
**And** 应暴露 `updateVisualType(type)` 方法

#### Scenario: 状态对象响应式
**Given** 组件导入并使用全局状态
**When** 调用 `addMessage` 或 `updateVisualType`
**Then** 所有使用该状态的组件应自动更新
**And** Vue 的响应式系统应正确追踪变化

---

### Requirement: Message Management
**ID**: `state-management-002`
**Priority**: P0

The `addMessage` method MUST accept a message object containing id (unique identifier), role (user role: user/ai), content (message content), time (send time), and add it to messageList.

#### Scenario: 添加用户消息
**Given** 用户发送消息"平抛运动"
**When** 调用 `addMessage({ id: 1, role: 'user', content: '平抛运动', time: '14:30' })`
**Then** messageList 应包含该消息对象
**And** 消息应按添加顺序排列

#### Scenario: 添加 AI 消息
**Given** AI 生成回复
**When** 调用 `addMessage({ id: 2, role: 'ai', content: '收到...', time: '14:30' })`
**Then** messageList 应包含该消息对象
**And** 消息应追加到列表末尾

#### Scenario: 消息 ID 唯一性
**Given** 多次调用 `addMessage`
**When** 生成消息 ID
**Then** 每条消息的 ID 应唯一（可使用 Date.now() + 随机数）
**And** 不应出现 ID 冲突

---

### Requirement: Visualization Type Management
**ID**: `state-management-003`
**Priority**: P0

The `updateVisualType` method MUST accept visualization type string ('', 'PROJECTILE', 'FORMULA'), update currentVisualType state, and trigger reactive updates in related components.

#### Scenario: 更新为平抛运动类型
**Given** 当前 currentVisualType 为 ''
**When** 调用 `updateVisualType('PROJECTILE')`
**Then** currentVisualType 应更新为 'PROJECTILE'
**And** 监听该状态的组件应触发更新

#### Scenario: 更新为公式类型
**Given** 当前 currentVisualType 为 'PROJECTILE'
**When** 调用 `updateVisualType('FORMULA')`
**Then** currentVisualType 应更新为 'FORMULA'
**And** 画布应从平抛运动切换到公式模式

#### Scenario: 清空可视化类型
**Given** 当前 currentVisualType 为 'PROJECTILE'
**When** 调用 `updateVisualType('')`
**Then** currentVisualType 应更新为 ''
**And** 画布应恢复到初始状态

---

### Requirement: State Persistence (Non-Goal)
**ID**: `state-management-004`
**Priority**: P3

State MUST NOT be persisted to localStorage or other storage; after page refresh, state SHALL reset to initial values (messageList empty, currentVisualType '').

#### Scenario: 页面刷新后状态重置
**Given** 用户已发送多条消息，画布显示平抛运动
**When** 用户刷新页面（F5 或 Ctrl+R）
**Then** messageList 应为空数组
**And** currentVisualType 应为空字符串
**And** 对话区应显示空白消息流
**And** 画布应显示默认占位提示

---

### Requirement: State Access Pattern
**ID**: `state-management-005`
**Priority**: P0

Components MUST access global state by importing `src/store/index.js`, read state using destructuring or direct reference, and modify state by calling exposed methods.

#### Scenario: 组件导入状态
**Given** ChatBox 组件需要访问 messageList
**When** 在组件中导入状态
**Then** 应使用 `import state, { addMessage } from '@/store'`
**And** 可通过 `state.messageList` 读取消息列表
**And** 可通过 `addMessage(message)` 添加消息

#### Scenario: 组件监听状态变化
**Given** App.vue 需要监听 currentVisualType 变化
**When** 使用 `watch` 监听状态
**Then** 应使用 `watch(() => state.currentVisualType, (newType) => { ... })`
**And** 当状态变化时，回调函数应被触发
