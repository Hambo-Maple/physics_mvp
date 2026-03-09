# Spec: AI Integration with Zhipu AI

## ADDED Requirements

### Requirement: Zhipu AI SDK Integration
**ID**: `ai-integration-001`
**Priority**: P0

The application MUST integrate Zhipu AI SDK to replace the frontend mock conversation logic, enabling real AI-powered responses.

#### Scenario: SDK installation and initialization
**Given** the project has package.json
**When** installing dependencies
**Then** zhipuai-sdk-nodejs-v4 package MUST be installed
**And** the SDK MUST be initialized with API Key from environment variables

#### Scenario: API client creation
**Given** API Key is available in environment variables
**When** creating Zhipu AI client
**Then** client MUST be initialized with `import.meta.env.VITE_ZHIPU_API_KEY`
**And** client MUST be ready to make API calls

---

### Requirement: API Key Management
**ID**: `ai-integration-002`
**Priority**: P0

The application MUST manage API Key securely using environment variables, with .env file for local development and clear documentation for security best practices.

#### Scenario: Environment variable configuration
**Given** the project root directory
**When** setting up API Key
**Then** a `.env` file MUST exist containing `VITE_ZHIPU_API_KEY=your_api_key_here`
**And** `.env` MUST be added to `.gitignore`
**And** a `.env.example` template file MUST be provided

#### Scenario: API Key access in code
**Given** API Key is configured in .env
**When** accessing the key in JavaScript code
**Then** MUST use `import.meta.env.VITE_ZHIPU_API_KEY`
**And** MUST validate that the key exists before making API calls

---

### Requirement: AI Conversation API Call
**ID**: `ai-integration-003`
**Priority**: P0

The application MUST implement a function to call Zhipu AI API with system prompt, message history, and user input, returning AI-generated responses.

#### Scenario: Basic API call
**Given** user sends a message "什么是平抛运动？"
**When** calling Zhipu AI API
**Then** request MUST include system prompt defining the physics assistant role
**And** request MUST include recent message history (last 10 messages)
**And** request MUST include the user's current message
**And** MUST use model "glm-4-flash" for fast responses

#### Scenario: Message history formatting
**Given** messageList contains user and AI messages
**When** preparing API request
**Then** MUST convert message history to API format: `{ role: 'user'|'assistant', content: string }`
**And** MUST include only the most recent 10 messages to control token usage
**And** MUST prepend system prompt as the first message

#### Scenario: API response handling
**Given** API call succeeds
**When** receiving response
**Then** MUST extract content from `response.choices[0].message.content`
**And** MUST return the AI reply text

---

### Requirement: Error Handling and Retry
**ID**: `ai-integration-004`
**Priority**: P0

The application MUST handle various API error scenarios gracefully, displaying user-friendly error messages and providing retry capability.

#### Scenario: Network error handling
**Given** network connection is unavailable
**When** API call fails with network error
**Then** MUST display error message "网络连接失败，请检查网络后重试"
**And** MUST allow user to retry by sending message again

#### Scenario: API Key error handling
**Given** API Key is invalid or missing
**When** API call fails with 401 status
**Then** MUST display error message "API Key 配置错误，请检查环境变量"
**And** MUST log error details to console for debugging

#### Scenario: Rate limit error handling
**Given** API rate limit is exceeded
**When** API call fails with 429 status
**Then** MUST display error message "请求过于频繁，请稍后再试"

#### Scenario: Generic error handling
**Given** API call fails with unknown error
**When** error occurs
**Then** MUST display error message "AI 服务暂时不可用，请稍后再试"
**And** MUST log full error details to console

---

### Requirement: Loading State Display
**ID**: `ai-integration-005`
**Priority**: P1

The application MUST display a loading indicator while waiting for AI response, improving user experience during API calls.

#### Scenario: Loading message display
**Given** user sends a message
**When** API call is in progress
**Then** MUST add a temporary AI message with content "正在思考..."
**And** message MUST be visually distinguishable as loading state

#### Scenario: Loading message replacement
**Given** loading message is displayed
**When** AI response is received
**Then** MUST replace loading message with actual AI reply
**And** MUST maintain correct message order in the list

#### Scenario: Loading message on error
**Given** loading message is displayed
**When** API call fails
**Then** MUST replace loading message with error message
**And** error message MUST be styled as AI message

---

### Requirement: Trigger Mark Parsing
**ID**: `ai-integration-006`
**Priority**: P0

The application MUST parse special trigger marks ([TRIGGER:PROJECTILE], [TRIGGER:FORMULA]) from AI replies and update visualization type accordingly.

#### Scenario: PROJECTILE trigger parsing
**Given** AI reply contains "[TRIGGER:PROJECTILE]"
**When** parsing the reply
**Then** MUST extract trigger type as "PROJECTILE"
**And** MUST remove trigger mark from displayed content
**And** MUST call `updateVisualType('PROJECTILE')`

#### Scenario: FORMULA trigger parsing
**Given** AI reply contains "[TRIGGER:FORMULA]"
**When** parsing the reply
**Then** MUST extract trigger type as "FORMULA"
**And** MUST remove trigger mark from displayed content
**And** MUST call `updateVisualType('FORMULA')`

#### Scenario: No trigger mark
**Given** AI reply does not contain trigger mark
**When** parsing the reply
**Then** MUST return original content unchanged
**And** MUST NOT update visualization type

---

### Requirement: Mock Logic Removal
**ID**: `ai-integration-007`
**Priority**: P0

The application MUST completely remove the frontend mock conversation logic, including generateAIReply and findLastVisualMessage functions.

#### Scenario: Mock functions removed
**Given** ChatBox.vue component
**When** reviewing the code
**Then** `generateAIReply()` function MUST NOT exist
**And** `findLastVisualMessage()` function MUST NOT exist
**And** keyword matching logic MUST NOT exist

#### Scenario: AI integration replaces mock
**Given** user sends a message
**When** generating AI reply
**Then** MUST call Zhipu AI API instead of mock logic
**And** MUST NOT use any hardcoded response patterns
