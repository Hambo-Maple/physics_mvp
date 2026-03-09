# Proposal: Integrate Zhipu AI for Intelligent Conversation

## Change ID
`integrate-zhipu-ai`

## Summary
集成智谱 AI 大语言模型，替换现有的前端模拟对话逻辑，实现真实的智能对话功能。AI 将扮演物理教学助手角色，能够解释物理概念、公式，并通过特殊标记触发可视化功能。

## Why
现有的前端模拟逻辑基于简单的关键词匹配，无法理解复杂的用户问题，也无法提供有深度的物理知识解答。集成智谱 AI 后，用户可以：
- 用自然语言提问任何物理问题，获得专业的解答
- 获得更智能的上下文理解和多轮对话能力
- 通过 AI 判断自动触发合适的可视化场景
- 提升整体用户体验，使应用真正成为有价值的物理学习工具

## Goals
1. 集成智谱 AI SDK，实现真实的 AI 对话功能
2. 使用环境变量管理 API Key，确保安全性
3. 设计物理教学助手的系统提示词，定义 AI 角色和行为规范
4. 实现 AI 回复中的特殊标记解析，触发可视化功能（[TRIGGER:PROJECTILE]、[TRIGGER:FORMULA]）
5. 完全替换现有的前端模拟逻辑（generateAIReply 函数）
6. 添加加载状态、错误处理和重试机制

## Non-Goals
- 不实现 Function Calling（使用更简单的特殊标记方案）
- 不保留前端模拟逻辑作为降级方案（完全替换）
- 不实现用户自定义 API Key 输入界面（使用环境变量）
- 不实现对话历史持久化（刷新后仍清空）

## Scope
此变更涉及以下能力模块：
- **ai-integration**: 智谱 AI SDK 集成、API 调用、错误处理
- **prompt-system**: 系统提示词设计、触发标记规范、角色定义

## Dependencies
- 依赖现有的 `implement-physics-viz-webapp` 提案（已完成）
- 需要用户提供有效的智谱 AI API Key

## Risks & Mitigations
- **风险**: API 调用失败导致对话功能不可用
  - **缓解**: 实现错误提示和重试机制，向用户展示清晰的错误信息
- **风险**: API Key 泄露风险
  - **缓解**: 使用 .env 文件管理，添加到 .gitignore，在文档中明确说明安全注意事项
- **风险**: AI 回复不包含触发标记，导致可视化无法触发
  - **缓解**: 在系统提示词中明确要求 AI 在合适时机返回标记，提供示例

## Success Criteria
- 用户发送消息后，AI 能够返回智能的、符合物理教学助手角色的回复
- AI 回复中包含的 [TRIGGER:XXX] 标记能够正确触发可视化更新
- 错误情况下显示友好的错误提示
- API Key 通过环境变量安全管理
- 所有前端模拟逻辑已移除

## Timeline Estimate
- SDK 集成和 API 调用: 1 小时
- 系统提示词设计和测试: 0.5 小时
- 错误处理和优化: 0.5 小时
- 总计: 2 小时
