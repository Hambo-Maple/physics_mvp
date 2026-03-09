## MODIFIED Requirements

### Requirement: 按钮交互样式
按钮 SHALL 在 hover 和 active 状态下提供视觉反馈，符合 A2UI 极简学术风格。

#### Scenario: 按钮 hover 状态
- **WHEN** 用户鼠标悬停在按钮上
- **THEN** 按钮显示阴影效果（box-shadow: 0 2px 4px rgba(0,0,0,0.1)）
- **AND** 背景色变化（普通按钮 #e8e8e8，主按钮 #008055）

#### Scenario: 按钮 active 状态
- **WHEN** 用户点击按钮
- **THEN** 按钮缩小 1%（transform: scale(0.99)）
- **AND** 背景色变化（普通按钮 #006644，主按钮 #004d33）

### Requirement: 消息气泡样式
消息气泡 SHALL 具有合适的内边距、行高和间距，确保可读性和美观性。

#### Scenario: 消息气泡内边距和行高
- **WHEN** 消息显示在对话区域
- **THEN** 消息气泡内边距为 10px 14px
- **AND** 文字行高为 1.5
- **AND** 消息气泡之间的间距为 10px

#### Scenario: 公式在消息气泡中的对齐
- **WHEN** 消息包含公式
- **THEN** 行内公式与文字基线对齐
- **AND** 块级公式在气泡内居中显示
- **AND** 公式渲染区域与文字区域无额外间隙

### Requirement: 可视化区域样式
可视化区域 SHALL 提供清晰的视觉层次，公式渲染区域具有独立的背景和边框。

#### Scenario: 画布占位提示样式
- **WHEN** 可视化区域未激活
- **THEN** 占位提示文字大小为 16px
- **AND** 文字颜色为 #999（浅灰）

#### Scenario: 公式容器样式
- **WHEN** 公式在可视化区域渲染
- **THEN** 公式容器背景色为 #f8f8f8
- **AND** 边框为 1px solid #e0e0e0
- **AND** 圆角为 4px
- **AND** 内边距为 20px
- **AND** 公式在容器内居中显示

### Requirement: 全局样式规范
全局样式 SHALL 遵循 A2UI 设计规范，确保视觉一致性。

#### Scenario: 元素间距规范
- **WHEN** 页面渲染
- **THEN** 所有元素间距为 8px 或 16px 的倍数
- **AND** 按钮内边距为 8px 16px
- **AND** 消息气泡间距为 10px（向上取整到 8px 倍数为 16px，但为保持紧凑使用 10px）

#### Scenario: 文字抗锯齿
- **WHEN** 页面渲染
- **THEN** 所有文字应用 `-webkit-font-smoothing: antialiased`
- **AND** 文字边缘平滑，无明显锯齿
