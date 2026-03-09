# Spec: System Prompt and Trigger Mark Design

## ADDED Requirements

### Requirement: Physics Assistant System Prompt
**ID**: `prompt-system-001`
**Priority**: P0

The application MUST define a comprehensive system prompt that establishes the AI as a professional physics teaching assistant with clear role definition and behavior guidelines.

#### Scenario: System prompt content
**Given** the system prompt is defined
**When** reviewing the prompt text
**Then** MUST describe AI as "专业的物理教学助手"
**And** MUST specify responsibilities: answering physics questions and triggering visualizations
**And** MUST include clear, professional tone guidelines
**And** MUST be written in Chinese

#### Scenario: System prompt usage
**Given** user sends a message
**When** calling Zhipu AI API
**Then** system prompt MUST be included as the first message with role "system"
**And** MUST be sent with every API request

---

### Requirement: Trigger Mark Specification
**ID**: `prompt-system-002`
**Priority**: P0

The system prompt MUST define clear rules for when and how AI should include trigger marks ([TRIGGER:PROJECTILE], [TRIGGER:FORMULA]) in responses.

#### Scenario: Trigger mark rules in prompt
**Given** the system prompt is defined
**When** reviewing trigger mark rules
**Then** MUST specify that [TRIGGER:PROJECTILE] is used for projectile motion questions
**And** MUST specify that [TRIGGER:FORMULA] is used for physics formula questions
**And** MUST state that trigger marks MUST be placed at the end of the reply
**And** MUST state that only one trigger mark per reply is allowed

#### Scenario: Trigger mark examples in prompt
**Given** the system prompt includes examples
**When** reviewing examples
**Then** MUST provide at least one example showing correct trigger mark usage
**And** example MUST demonstrate natural conversation with trigger mark at the end
**And** example format MUST be: user question → AI reply with [TRIGGER:XXX]

---

### Requirement: Response Quality Guidelines
**ID**: `prompt-system-003`
**Priority**: P1

The system prompt MUST include guidelines to ensure AI responses are concise, accurate, and appropriate for physics education.

#### Scenario: Response style guidelines
**Given** the system prompt is defined
**When** reviewing response guidelines
**Then** MUST instruct AI to use "通俗易懂的语言"
**And** MUST instruct AI to provide "准确、清晰的解释"
**And** MUST instruct AI to keep responses "简洁专业"
**And** MUST instruct AI to make content "适合学生理解"

#### Scenario: Selective visualization triggering
**Given** the system prompt includes trigger guidelines
**When** reviewing trigger usage rules
**Then** MUST state that NOT all questions require visualization
**And** MUST specify to only add trigger marks when explicitly relevant
**And** MUST avoid over-triggering visualizations

---

### Requirement: Supported Visualization Types
**ID**: `prompt-system-004`
**Priority**: P0

The system prompt MUST clearly define the two supported visualization types and when each should be triggered.

#### Scenario: PROJECTILE visualization definition
**Given** the system prompt defines visualization types
**When** reviewing PROJECTILE definition
**Then** MUST specify it is for "平抛运动" (projectile motion) questions
**And** MUST provide context about what topics trigger this visualization
**And** MUST use trigger mark [TRIGGER:PROJECTILE]

#### Scenario: FORMULA visualization definition
**Given** the system prompt defines visualization types
**When** reviewing FORMULA definition
**Then** MUST specify it is for "物理公式" (physics formula) questions
**And** MUST provide context about what topics trigger this visualization
**And** MUST use trigger mark [TRIGGER:FORMULA]

---

### Requirement: System Prompt Maintainability
**ID**: `prompt-system-005`
**Priority**: P2

The system prompt MUST be defined as a constant in a dedicated utility file, making it easy to update and maintain.

#### Scenario: Prompt location
**Given** the codebase structure
**When** locating the system prompt
**Then** MUST be defined in `src/utils/zhipuClient.js` or similar utility file
**And** MUST be exported as a named constant (e.g., `SYSTEM_PROMPT`)
**And** MUST be easily accessible for updates

#### Scenario: Prompt format
**Given** the system prompt constant
**When** reviewing the code
**Then** MUST be defined as a multi-line string
**And** MUST include clear section headers (职责、触发标记规范、示例、注意)
**And** MUST be well-formatted for readability
