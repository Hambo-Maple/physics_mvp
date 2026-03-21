# UI 界面规范文档 (Figma 可读版本)

## 📐 整体布局架构

### 主容器 (Root Container)
- **布局**: Horizontal Split Layout (Flexbox)
- **尺寸**: 100vw × 100vh (全屏)
- **溢出**: Hidden
- **背景**: CSS Variable `--background` (白色 hsl(0 0% 100%))

### 左侧面板 (Left Panel - ChatBox)
- **宽度**: 30% of viewport width
- **高度**: 100vh
- **边框**: Right border 1px solid `--border` (hsl(214.3 31.8% 91.4%))
- **布局**: Vertical Flex Column
- **背景**: `--background`

### 右侧面板 (Right Panel - VisualCanvas)
- **宽度**: 70% of viewport width (flex-1)
- **高度**: 100vh
- **布局**: Vertical Flex Column
- **背景**: `--background`

---

## 🎨 设计系统 (Design Tokens)

### 颜色系统 (Color Palette)
所有颜色使用 HSL 格式定义为 CSS 变量：

#### Light Mode (默认)
```
--background: hsl(0 0% 100%)           // 纯白色 #FFFFFF
--foreground: hsl(222.2 84% 4.9%)      // 深灰黑 #020817
--primary: hsl(222.2 47.4% 11.2%)      // 深蓝黑 #0F172A
--primary-foreground: hsl(210 40% 98%) // 浅白色 #F8FAFC
--secondary: hsl(210 40% 96.1%)        // 浅灰蓝 #F1F5F9
--secondary-foreground: hsl(222.2 47.4% 11.2%) // 深蓝黑
--muted: hsl(210 40% 96.1%)            // 柔和灰 #F1F5F9
--muted-foreground: hsl(215.4 16.3% 46.9%) // 中灰色 #64748B
--accent: hsl(210 40% 96.1%)           // 强调色 #F1F5F9
--accent-foreground: hsl(222.2 47.4% 11.2%) // 强调文字
--destructive: hsl(0 84.2% 60.2%)      // 错误红 #EF4444
--destructive-foreground: hsl(210 40% 98%) // 错误文字
--border: hsl(214.3 31.8% 91.4%)       // 边框灰 #E2E8F0
--input: hsl(214.3 31.8% 91.4%)        // 输入框边框
--ring: hsl(222.2 84% 4.9%)            // 焦点环
```

#### Dark Mode (可选)
```
--background: hsl(222.2 84% 4.9%)      // 深蓝黑
--foreground: hsl(210 40% 98%)         // 浅白色
--primary: hsl(210 40% 98%)            // 浅白色
--border: hsl(217.2 32.6% 17.5%)       // 深灰边框
```

### 圆角系统 (Border Radius)
```
--radius: 0.5rem (8px)                 // 基础圆角
lg: 0.5rem (8px)                       // 大圆角
md: calc(0.5rem - 2px) = 6px           // 中圆角
sm: calc(0.5rem - 4px) = 4px           // 小圆角
```

### 间距系统 (Spacing)
使用 Tailwind 默认间距比例：
- `gap-1`: 0.25rem (4px)
- `gap-2`: 0.5rem (8px)
- `gap-3`: 0.75rem (12px)
- `gap-4`: 1rem (16px)
- `p-4`: padding 1rem (16px)
- `px-4`: padding-left/right 1rem
- `py-2`: padding-top/bottom 0.5rem (8px)

### 字体系统 (Typography)
- **字体族**: System Default (继承浏览器默认)
- **基础字号**: 14px (text-sm)
- **标题字号**: 18px (text-lg)
- **小字号**: 12px (text-xs)
- **字重**:
  - Regular: 400 (默认)
  - Medium: 500 (font-medium)

---

## 📱 左侧面板详细规范 (ChatBox Component)

### 结构层级
```
ChatBox Container (Flex Column, h-full)
├── Toast Notification (Fixed, Conditional)
├── Header Bar
├── Continuous Voice Status Bar (Conditional)
├── Message List (ScrollArea, flex-1)
└── Input Area (Fixed Bottom)
```

### 1. Toast 通知 (Toast Notification)
- **定位**: Fixed
- **位置**: top: 1rem, right: 1rem
- **层级**: z-index: 50
- **内边距**: px-4 py-2 (16px 8px)
- **圆角**: rounded-lg (8px)
- **文字颜色**: 白色
- **阴影**: shadow-lg
- **背景色**:
  - 成功: `--primary` (深蓝黑)
  - 错误: `--destructive` (红色)
- **动画**: transition-opacity
- **显示条件**: v-if="toastMessage"

### 2. 标题栏 (Header Bar)
- **内边距**: p-4 (16px)
- **边框**: border-bottom 1px solid `--border`
- **标题文字**: "物理可视化助手"
  - 字号: text-lg (18px)
  - 字重: font-medium (500)
  - 颜色: `--foreground`

### 3. 连续语音状态栏 (Continuous Voice Status Bar)
- **显示条件**: v-if="state.isContinuousMode"
- **内边距**: px-4 py-2 (16px 8px)
- **背景**: `--muted`
- **边框**: border-bottom 1px solid `--border`
- **布局**: Flex Row, items-center, gap-3 (12px)
- **内容**:
  - 状态文字: text-sm, color: `--muted-foreground`
  - 波形动画: 5个竖条
    - 宽度: 4px (w-1)
    - 背景: `--primary`
    - 圆角: rounded-full
    - 高度: 动态变化 (8px-24px)
    - 间距: gap-1 (4px)
    - 动画: transition-all

### 4. 消息流区域 (Message List)
- **组件**: ScrollArea (Radix Vue)
- **布局**: flex-1 (占据剩余空间)
- **内边距**: p-4 (16px)
- **消息容器**: space-y-4 (垂直间距 16px)

#### 单条消息结构 (Message Item)
- **外层容器**: Flex Column
  - 用户消息: items-end (右对齐)
  - AI消息: items-start (左对齐)

- **消息气泡 (Message Bubble)**:
  - 最大宽度: max-w-[80%]
  - 圆角: rounded-lg (8px)
  - 内边距: px-4 py-3 (16px 12px)
  - 用户消息背景: `--primary` (深蓝黑)
  - 用户消息文字: `--primary-foreground` (浅白)
  - AI消息背景: `--muted` (浅灰蓝)
  - AI消息文字: `--foreground` (深灰黑)
  - 内容: HTML 渲染 (支持 KaTeX 公式)

- **流式输出光标**:
  - 显示条件: v-if="state.isGenerating && state.currentMessageId === message.id"
  - 尺寸: w-2 h-4 (8px × 16px)
  - 背景: `--foreground`
  - 动画: animate-pulse
  - 位置: ml-1 (margin-left 4px)

- **时间戳**:
  - 字号: text-xs (12px)
  - 颜色: `--muted-foreground`
  - 间距: mt-1 (margin-top 4px)

### 5. 输入区域 (Input Area)
- **内边距**: p-4 (16px)
- **边框**: border-top 1px solid `--border`
- **布局**: Flex Column, gap-2 (8px)

#### 文本输入框 (Textarea)
- **组件**: Textarea (shadcn-vue)
- **最小高度**: min-h-[80px]
- **调整大小**: resize-none
- **占位符**: "输入消息..."
- **边框**: 1px solid `--input`
- **圆角**: rounded-md (6px)
- **内边距**: px-3 py-2 (12px 8px)
- **背景**: `--background`
- **文字**: text-sm, color: `--foreground`
- **焦点状态**:
  - outline: none
  - ring: 2px solid `--ring`
  - ring-offset: 2px
- **禁用状态**:
  - cursor: not-allowed
  - opacity: 0.5

#### 按钮组 (Button Group)
- **布局**: Flex Row, gap-2 (8px)

**按钮 1: 语音输入 (Voice Input Button)**
- **变体**: outline
- **布局**: flex-1 (占据剩余空间)
- **高度**: h-10 (40px)
- **内边距**: px-4 py-2 (16px 8px)
- **边框**: 1px solid `--input`
- **圆角**: rounded-md (6px)
- **背景**: `--background`
- **文字**: text-sm, color: `--foreground`
- **Hover**: bg: `--accent`, text: `--accent-foreground`
- **禁用状态**: pointer-events-none, opacity: 0.5
- **内容**:
  - Badge (条件显示):
    - 录音中: variant="default", text="录音中"
    - 识别中: variant="secondary", text="识别中"
    - 间距: mr-2 (margin-right 8px)
  - 文字: "语音输入" / "正在录音..." / "正在识别..."

**按钮 2: 连续对话 (Continuous Mode Button)**
- **变体**: outline
- **高度**: h-10 (40px)
- **内边距**: px-4 py-2 (16px 8px)
- **边框**: 1px solid `--input`
- **圆角**: rounded-md (6px)
- **背景**: `--background`
- **激活状态**: bg: `--accent`
- **文字**: "连续对话" / "停止连续"

**按钮 3: 发送 (Send Button)**
- **变体**: default
- **高度**: h-10 (40px)
- **内边距**: px-4 py-2 (16px 8px)
- **背景**: `--primary` (深蓝黑)
- **文字**: `--primary-foreground` (浅白)
- **圆角**: rounded-md (6px)
- **Hover**: bg: `--primary` with 90% opacity
- **禁用状态**: pointer-events-none, opacity: 0.5
- **文字**: "发送"

---

## 🎯 右侧面板详细规范 (VisualCanvas Component)

### 结构层级
```
VisualCanvas Container (Flex Column, h-full)
├── ProjectileMotion Component (Conditional)
└── Default View
    ├── Status Bar (Top)
    ├── Canvas Area (Center, flex-1)
    └── Control Bar (Bottom)
```

### 1. 平抛运动组件 (ProjectileMotion)
- **显示条件**: v-if="state.currentVisualType === 'PROJECTILE'"
- **组件**: ProjectileMotion.vue (p5.js canvas)
- **尺寸**: 占据整个右侧面板
- **参数**:
  - initialV0: 初速度
  - initialG: 重力加速度
  - initialH: 初始高度
  - initialTheta: 抛射角度

### 2. 默认视图 - 顶部状态栏 (Status Bar)
- **内边距**: p-4 (16px)
- **边框**: border-bottom 1px solid `--border`
- **背景**: `--muted` with 50% opacity
- **文字**:
  - 字号: text-sm (14px)
  - 字重: font-medium (500)
  - 颜色: `--foreground`
  - 内容: "当前模式 - 未选择可视化" / "当前模式 - 平抛运动"

### 3. 默认视图 - 中心画布区域 (Canvas Area)
- **布局**: flex-1, flex, items-center, justify-center
- **内边距**: p-6 (24px)
- **内容容器**: #canvas-mount-point
  - 文本对齐: text-center
  - 占位文字:
    - 字号: text-lg (18px)
    - 颜色: `--muted-foreground`
    - 内容: "可视化画布已准备就绪"

### 4. 默认视图 - 底部控制区 (Control Bar)
- **内边距**: p-4 (16px)
- **边框**: border-top 1px solid `--border`
- **按钮**: "重置画布"
  - 变体: outline
  - 高度: h-10 (40px)
  - 内边距: px-4 py-2 (16px 8px)
  - 边框: 1px solid `--input`
  - 圆角: rounded-md (6px)
  - 背景: `--background`
  - Hover: bg: `--accent`

---

## 🧩 UI 组件库规范 (shadcn-vue Components)

### Button 组件
**变体 (Variants)**:
1. **default**: bg: `--primary`, text: `--primary-foreground`, hover: 90% opacity
2. **destructive**: bg: `--destructive`, text: `--destructive-foreground`, hover: 90% opacity
3. **outline**: border: 1px solid `--input`, bg: `--background`, hover: bg: `--accent`
4. **secondary**: bg: `--secondary`, text: `--secondary-foreground`, hover: 80% opacity
5. **ghost**: bg: transparent, hover: bg: `--accent`
6. **link**: text: `--primary`, underline-offset: 4px, hover: underline

**尺寸 (Sizes)**:
1. **default**: h-10 (40px), px-4 py-2
2. **sm**: h-9 (36px), px-3
3. **lg**: h-11 (44px), px-8
4. **icon**: h-10 w-10 (40px × 40px)

**通用样式**:
- 布局: inline-flex, items-center, justify-center
- 间距: gap-2 (8px)
- 文字: text-sm, font-medium, whitespace-nowrap
- 圆角: rounded-md (6px)
- 过渡: transition-colors
- 焦点: outline-none, ring-2 solid `--ring`, ring-offset-2
- 禁用: pointer-events-none, opacity: 0.5

### Textarea 组件
**样式**:
- 布局: flex
- 最小高度: min-h-[80px]
- 宽度: w-full
- 圆角: rounded-md (6px)
- 边框: 1px solid `--input`
- 背景: `--background`
- 内边距: px-3 py-2 (12px 8px)
- 文字: text-sm
- 环偏移: ring-offset-background
- 占位符: text: `--muted-foreground`
- 焦点: outline-none, ring-2 solid `--ring`, ring-offset-2
- 禁用: cursor-not-allowed, opacity: 0.5

### Badge 组件
**变体 (Variants)**:
1. **default**: bg: `--primary`, text: `--primary-foreground`, hover: 80% opacity
2. **secondary**: bg: `--secondary`, text: `--secondary-foreground`, hover: 80% opacity
3. **destructive**: bg: `--destructive`, text: `--destructive-foreground`, hover: 80% opacity
4. **outline**: border: 1px solid `--border`, text: `--foreground`

**通用样式**:
- 布局: inline-flex, items-center
- 圆角: rounded-full
- 边框: 1px solid transparent
- 内边距: px-2.5 py-0.5 (10px 2px)
- 文字: text-xs, font-semibold
- 过渡: transition-colors
- 焦点: outline-none, ring-2 solid `--ring`, ring-offset-2

### ScrollArea 组件
**样式**:
- 基于 Radix Vue ScrollArea
- 滚动条宽度: 10px
- 滚动条背景: `--muted`
- 滚动条滑块: `--border`, hover: `--muted-foreground`
- 滚动条圆角: rounded-full
- 平滑滚动: smooth scrolling

---

## 📏 响应式断点 (Responsive Breakpoints)

当前设计为固定布局 (30% / 70%)，未实现响应式断点。

**建议的响应式规则**:
- **Desktop (>1024px)**: 30% / 70% (当前实现)
- **Tablet (768px-1024px)**: 40% / 60%
- **Mobile (<768px)**: 垂直堆叠，ChatBox 在上，VisualCanvas 在下

---

## 🎭 交互状态规范

### 按钮状态
1. **默认 (Default)**: 基础样式
2. **悬停 (Hover)**: 背景色变化，过渡 150ms
3. **激活 (Active)**: 轻微缩放或颜色加深
4. **焦点 (Focus)**: 显示 2px 焦点环
5. **禁用 (Disabled)**: 透明度 50%，禁止点击

### 输入框状态
1. **默认 (Default)**: 边框 `--input`
2. **悬停 (Hover)**: 边框颜色加深
3. **焦点 (Focus)**: 显示 2px 焦点环
4. **禁用 (Disabled)**: 透明度 50%，光标 not-allowed
5. **错误 (Error)**: 边框 `--destructive`

### 消息状态
1. **发送中 (Sending)**: 输入框禁用，按钮禁用
2. **生成中 (Generating)**: 显示光标动画，输入框禁用
3. **完成 (Complete)**: 恢复输入框，自动滚动到底部

### 语音状态
1. **空闲 (Idle)**: 按钮显示"语音输入"
2. **录音中 (Recording)**: Badge 显示"录音中"，按钮文字变化
3. **识别中 (Recognizing)**: Badge 显示"识别中"
4. **连续模式 (Continuous)**: 显示波形动画，禁用其他按钮

---

## 🔤 文案规范 (Copy Specifications)

### 中文文案
- **标题**: "物理可视化助手"
- **输入占位符**: "输入消息..."
- **按钮文字**:
  - "发送"
  - "语音输入"
  - "正在录音..."
  - "正在识别..."
  - "连续对话"
  - "停止连续"
  - "重置画布"
- **状态文字**:
  - "当前模式 - 未选择可视化"
  - "当前模式 - 平抛运动"
  - "可视化画布已准备就绪"
- **Badge 文字**:
  - "录音中"
  - "识别中"

---

## 🎨 视觉效果规范

### 阴影 (Shadows)
- **Toast**: shadow-lg (0 10px 15px -3px rgba(0,0,0,0.1))
- **Card**: shadow-sm (0 1px 2px 0 rgba(0,0,0,0.05))

### 过渡动画 (Transitions)
- **颜色过渡**: transition-colors (150ms)
- **透明度过渡**: transition-opacity (150ms)
- **全属性过渡**: transition-all (150ms)
- **光标动画**: animate-pulse (2s infinite)

### 焦点环 (Focus Ring)
- **宽度**: 2px
- **颜色**: `--ring`
- **偏移**: 2px
- **样式**: solid

---

## 📦 组件导入路径

```javascript
// UI 组件
import Button from './ui/Button.vue'
import Textarea from './ui/Textarea.vue'
import Badge from './ui/Badge.vue'
import ScrollArea from './ui/ScrollArea.vue'
import Card from './ui/Card.vue'
import Separator from './ui/Separator.vue'

// 工具函数
import { cn } from './ui/utils.js'
```

---

## 🔧 技术实现细节

### CSS 变量使用
所有颜色通过 CSS 变量定义，使用 `hsl(var(--variable-name))` 格式：
```css
background-color: hsl(var(--primary));
color: hsl(var(--primary-foreground));
border-color: hsl(var(--border));
```

### Tailwind 类名合并
使用 `cn()` 工具函数合并类名：
```javascript
import { cn } from './ui/utils.js'
const classes = cn('base-class', conditionalClass && 'conditional-class', props.class)
```

### 响应式状态
使用 Vue 3 Composition API 的 `ref` 和 `reactive`：
```javascript
const inputValue = ref('')
const voiceState = ref('idle') // 'idle' | 'recording' | 'recognizing'
```

---

## 📐 尺寸参考表

| 元素 | 宽度 | 高度 | 内边距 | 圆角 |
|------|------|------|--------|------|
| 左侧面板 | 30vw | 100vh | - | - |
| 右侧面板 | 70vw | 100vh | - | - |
| 标题栏 | 100% | auto | 16px | - |
| 消息气泡 | max 80% | auto | 16px 12px | 8px |
| 输入框 | 100% | min 80px | 12px 8px | 6px |
| 按钮 (default) | auto | 40px | 16px 8px | 6px |
| 按钮 (sm) | auto | 36px | 12px | 6px |
| 按钮 (lg) | auto | 44px | 32px 8px | 6px |
| Badge | auto | auto | 10px 2px | 9999px |
| Toast | auto | auto | 16px 8px | 8px |

---

## 🎯 可访问性规范 (Accessibility)

### 键盘导航
- **Tab**: 在可交互元素间切换
- **Enter**:
  - 在输入框中: 发送消息
  - 在按钮上: 触发点击
- **Escape**: 关闭 Toast 通知

### ARIA 属性
- 按钮: `role="button"`, `aria-disabled="true/false"`
- 输入框: `aria-label="输入消息"`, `aria-placeholder="输入消息..."`
- 消息列表: `role="log"`, `aria-live="polite"`

### 焦点管理
- 所有交互元素显示焦点环
- 焦点环颜色: `--ring`
- 焦点环宽度: 2px
- 焦点环偏移: 2px

---

## 📱 设备兼容性

### 浏览器支持
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### 屏幕尺寸
- 最小宽度: 1024px (推荐)
- 最小高度: 600px
- 最佳体验: 1920×1080

---

## 🎨 Figma 导入建议

### 颜色变量映射
在 Figma 中创建以下颜色变量：
1. Background: #FFFFFF
2. Foreground: #020817
3. Primary: #0F172A
4. Primary Foreground: #F8FAFC
5. Secondary: #F1F5F9
6. Muted: #F1F5F9
7. Muted Foreground: #64748B
8. Border: #E2E8F0
9. Destructive: #EF4444

### 组件创建顺序
1. 创建颜色样式 (Color Styles)
2. 创建文字样式 (Text Styles)
3. 创建按钮组件 (Button Component)
4. 创建输入框组件 (Textarea Component)
5. 创建徽章组件 (Badge Component)
6. 创建消息气泡组件 (Message Bubble Component)
7. 组装左侧面板 (ChatBox Frame)
8. 组装右侧面板 (VisualCanvas Frame)
9. 组装主布局 (Main Layout Frame)

### Auto Layout 设置
- 主容器: Horizontal, Space Between, Fill Container
- 左侧面板: Vertical, Hug Contents, Fixed Width 30%
- 右侧面板: Vertical, Fill Container
- 消息列表: Vertical, Auto Layout, Gap 16px
- 按钮组: Horizontal, Auto Layout, Gap 8px

---

## ✅ 验收清单

- [ ] 左右布局比例 30% / 70%
- [ ] 所有颜色使用 CSS 变量
- [ ] 圆角统一为 8px (lg) / 6px (md)
- [ ] 间距使用 4px 倍数
- [ ] 按钮支持 6 种变体
- [ ] 输入框支持焦点状态
- [ ] 消息气泡左右对齐正确
- [ ] 滚动条样式自定义
- [ ] Toast 通知固定在右上角
- [ ] 语音状态 Badge 显示正确
- [ ] 波形动画流畅
- [ ] 所有交互状态完整
- [ ] 焦点环显示正确
- [ ] 禁用状态样式正确

---

**文档版本**: 1.0
**最后更新**: 2026-03-18
**适用于**: Figma Design System Import
