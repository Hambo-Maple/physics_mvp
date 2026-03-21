# Chat Interface Specification

## MODIFIED Requirements

### Requirement: Chat Interface Layout
The system SHALL display a chat interface in the left pane using modern UI components from shadcn-vue.

#### Scenario: Container structure
- **WHEN** the ChatBox component renders
- **THEN** it uses a Card component as the main container
- **AND** the container has full height (h-full)
- **AND** the container uses flex column layout (flex flex-col)
- **AND** the container has no overflow on the outer level

#### Scenario: Header section
- **WHEN** the chat interface displays
- **THEN** it shows a header with the title "物理可视化助手"
- **AND** the header uses CardHeader component
- **AND** the header has consistent padding (p-4 or p-6)
- **AND** the header has a bottom border (border-b border-border)

#### Scenario: Message area
- **WHEN** messages are displayed
- **THEN** they appear in a ScrollArea component
- **AND** the ScrollArea has flex-1 to fill available space
- **AND** the ScrollArea has padding (p-4)
- **AND** messages automatically scroll to bottom when new messages arrive

#### Scenario: Input area
- **WHEN** the input section renders
- **THEN** it uses CardFooter or a div with border-t
- **AND** it contains a Textarea component for text input
- **AND** it contains Button components for actions
- **AND** it has consistent padding (p-4)
- **AND** it stays fixed at the bottom

### Requirement: Message Display
The system SHALL display user and AI messages with distinct visual styling using Tailwind classes.

#### Scenario: User message styling
- **WHEN** a user message is displayed
- **THEN** it uses a Card or div with background color
- **AND** it aligns to the right side (ml-auto)
- **AND** it has a maximum width (max-w-[80%])
- **AND** it uses primary or accent colors (bg-primary text-primary-foreground)
- **AND** it has rounded corners (rounded-lg or rounded-xl)
- **AND** it has padding (p-3 or p-4)

#### Scenario: AI message styling
- **WHEN** an AI message is displayed
- **THEN** it uses a Card or div with background color
- **AND** it aligns to the left side (mr-auto)
- **AND** it has a maximum width (max-w-[80%])
- **AND** it uses muted or secondary colors (bg-muted text-foreground)
- **AND** it has rounded corners (rounded-lg or rounded-xl)
- **AND** it has padding (p-3 or p-4)

#### Scenario: Message timestamp
- **WHEN** a message displays a timestamp
- **THEN** it uses small text (text-xs)
- **AND** it uses muted color (text-muted-foreground)
- **AND** it appears below the message content
- **AND** it has top margin (mt-1 or mt-2)

#### Scenario: Streaming cursor
- **WHEN** AI is generating a response
- **THEN** a typing cursor appears after the message content
- **AND** the cursor uses an animation class (animate-pulse or custom)
- **AND** the cursor is visible only during generation

### Requirement: Input Controls
The system SHALL provide input controls using shadcn-vue Button and Textarea components.

#### Scenario: Text input area
- **WHEN** the text input renders
- **THEN** it uses the Textarea component from shadcn-vue
- **AND** it has placeholder text "输入消息..."
- **AND** it supports Enter key to send (with Shift+Enter for new line)
- **AND** it is disabled during AI generation or voice input
- **AND** it has focus ring styling (focus-visible:ring-2)

#### Scenario: Send button
- **WHEN** the send button renders
- **THEN** it uses the Button component with primary variant
- **AND** it displays "发送" text
- **AND** it is disabled when input is empty or AI is generating
- **AND** it has hover and active states

#### Scenario: Voice input button
- **WHEN** the voice input button renders
- **THEN** it uses the Button component with secondary or outline variant
- **AND** it displays "语音输入" when idle
- **AND** it displays "正在录音..." when recording
- **AND** it displays "正在识别..." when recognizing
- **AND** it is disabled during AI generation or continuous mode
- **AND** it has a loading state with Badge or animation

#### Scenario: Continuous conversation button
- **WHEN** the continuous conversation button renders
- **THEN** it uses the Button component with secondary or outline variant
- **AND** it displays "连续对话" when inactive
- **AND** it displays "停止连续" when active
- **AND** it has an active state style (different background or border)
- **AND** it is disabled during AI generation or single voice input

### Requirement: Status Indicators
The system SHALL display status indicators using Badge and custom components.

#### Scenario: Toast notifications
- **WHEN** a toast notification appears
- **THEN** it uses fixed positioning (fixed top-4 right-4 or similar)
- **AND** it has background color based on type (bg-primary for success, bg-destructive for error)
- **AND** it has white text (text-white or text-primary-foreground)
- **AND** it has rounded corners (rounded-lg)
- **AND** it has padding (px-4 py-2)
- **AND** it auto-dismisses after 3 seconds
- **AND** it has enter/exit animations (transition-opacity or animate-in/out)

#### Scenario: Continuous voice status bar
- **WHEN** continuous voice mode is active
- **THEN** a status bar appears below the header
- **AND** it displays current state text ("正在连续语音对话中...", "正在录音...", etc.)
- **AND** it shows waveform animation bars
- **AND** it uses muted background (bg-muted)
- **AND** it has padding (p-2 or p-3)

#### Scenario: Voice state badge
- **WHEN** voice input is in progress
- **THEN** a Badge component displays the current state
- **AND** it uses appropriate variant (default, secondary, destructive)
- **AND** it appears near the voice button or in the status bar

### Requirement: Responsive Interactions
The system SHALL provide smooth transitions and animations using Tailwind utilities.

#### Scenario: Button hover effects
- **WHEN** a user hovers over a button
- **THEN** the button background changes (hover:bg-primary/90)
- **AND** the transition is smooth (transition-colors)
- **AND** the cursor changes to pointer

#### Scenario: Button active effects
- **WHEN** a user clicks a button
- **THEN** the button scales slightly (active:scale-95 or similar)
- **AND** the background darkens (active:bg-primary/80)

#### Scenario: Input focus effects
- **WHEN** a user focuses on the textarea
- **THEN** a focus ring appears (focus-visible:ring-2 ring-ring)
- **AND** the border color changes (focus-visible:border-ring)
- **AND** the transition is smooth

#### Scenario: Message appearance animation
- **WHEN** a new message is added
- **THEN** it fades in smoothly (animate-in fade-in)
- **AND** it may slide in from the side (slide-in-from-bottom-2)
- **AND** the animation duration is short (duration-300)

### Requirement: Accessibility Enhancements
The system SHALL ensure the chat interface is accessible through proper ARIA attributes and keyboard navigation.

#### Scenario: Keyboard navigation
- **WHEN** a user navigates with Tab key
- **THEN** focus moves through textarea, buttons in logical order
- **AND** focus indicators are clearly visible
- **AND** Enter key sends message from textarea
- **AND** Escape key can dismiss modals or cancel actions

#### Scenario: Screen reader support
- **WHEN** a screen reader is used
- **THEN** buttons have descriptive labels
- **AND** message roles are announced (user vs assistant)
- **AND** status changes are announced (recording, recognizing, generating)
- **AND** disabled states are announced

#### Scenario: Disabled state clarity
- **WHEN** controls are disabled
- **THEN** they have reduced opacity (opacity-50)
- **AND** they have disabled cursor (cursor-not-allowed)
- **AND** they don't respond to clicks
- **AND** the reason for disabling is clear from context
