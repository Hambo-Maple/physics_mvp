# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

## Common Commands

### Development
```bash
# Start dev server (frontend on :3000)
npm run dev

# Start backend server (Express proxy on :3001)
node server.js

# Build for production
npm run build

# Preview production build
npm run preview
```

### OpenSpec Workflow
```bash
# List active changes and specs
openspec list
openspec list --specs

# Validate a change (always use --strict)
openspec validate [change-id] --strict

# Show change details
openspec show [change-id]

# Archive completed change
openspec archive <change-id> --yes
```

## Architecture Overview

This is a physics visualization webapp with conversational AI interaction, built with Vue 3 and a custom Express backend.

### Tech Stack
- **Frontend**: Vue 3 (Composition API with `<script setup>`), Vite 5.x
- **Styling**: Tailwind CSS + custom design tokens (recently migrated from pure CSS)
- **State Management**: Custom reactive state in `src/store/index.js` (no Pinia/Vuex)
- **Visualization**: p5.js for physics rendering
- **AI Backend**: Express server proxying to Zhipu AI (GLM-4-flash model)
- **Voice Recognition**: Baidu Voice Recognition API integration

### Directory Structure
```
src/
├── components/        # Vue components
│   ├── ChatBox.vue           # Chat interface with streaming support
│   ├── VisualCanvas.vue      # Visualization canvas container
│   ├── ProjectileMotion.vue  # Projectile motion simulation (p5.js)
│   └── ui/                   # Reusable UI components (Button, Card, etc.)
├── store/            # Global reactive state
├── utils/            # Utility functions (voice, katex, stream handling, etc.)
├── styles/           # Global styles and Tailwind CSS
└── main.js           # App entry point

openspec/
├── specs/            # Current specifications (what IS built)
├── changes/          # Active change proposals (what SHOULD change)
└── archive/          # Completed changes
```

### Key Architecture Patterns

#### State Management
- Uses Vue's built-in `reactive()` for global state (see `src/store/index.js`)
- State includes: `messageList`, `currentVisualType`, `projectileParams`, `isContinuousMode`
- Components access state directly via imports: `import state from './store'`
- No external state management library (Pinia/Vuex not used)

#### Chat-Visualization Linkage
- AI responses include trigger markers like `[TRIGGER:PROJECTILE]`
- `App.vue` watches `state.currentVisualType` and calls `VisualCanvas.updateCanvas()`
- System prompt controls when triggers are added (see `server.js:SYSTEM_PROMPT`)
- Parameter adjustments during visualization should NOT include trigger markers

#### Resizable Panel Layout
- Uses `vue-resizable-panels` library
- Left panel: ChatBox (30% by default, adjustable 20-50%)
- Right panel: VisualCanvas (remaining space)
- Floating buttons reopen closed panels

#### Streaming AI Responses
- Backend: Express server proxies to Zhipu AI with SSE (Server-Sent Events)
- Frontend: `src/utils/streamHandler.js` handles SSE parsing
- Messages update incrementally as chunks arrive

#### Voice Recognition Flow
1. Browser records audio (WebRTC) → webm format
2. Frontend sends base64 audio to `/api/voice/recognize`
3. Backend converts webm → wav (using fluent-ffmpeg)
4. Calls Baidu Voice Recognition API
5. Returns recognized text to frontend

## Code Conventions

### Chinese Comments Required
- All core functions, state variables, and component props MUST have detailed Chinese comments
- Explains purpose and usage patterns for Chinese-speaking developers

### Naming Conventions
- Components: PascalCase (e.g., `ChatBox.vue`, `ProjectileMotion.vue`)
- Functions/Variables: camelCase (e.g., `messageList`, `sendMessage`)
- Constants: UPPER_SNAKE_CASE (e.g., `DEFAULT_PROJECTILE_PARAMS`)

### File Naming
- Change IDs: kebab-case with verb prefix (e.g., `add-voice-input`, `refactor-figma-layout`)
- Capabilities: verb-noun format (e.g., `user-auth`, `payment-capture`)

### Visual Design System
Colors are defined via CSS variables (Tailwind config + `src/styles/tailwind.css`):
- Primary: Green (#006644) - main actions, active states
- Background: Gradient slate/blue/indigo
- All containers: 1px solid border, 4px rounded corners
- Button states: default (gray), hover (darker), active (green with white text)

## Important Constraints

### What's Built
- ✅ Chat interface with streaming AI responses (Zhipu AI)
- ✅ Projectile motion visualization with p5.js
- ✅ Voice input via Baidu API
- ✅ Formula rendering with KaTeX
- ✅ Resizable split-panel layout
- ✅ Continuous voice conversation mode

### What's NOT Built (Intentional)
- ❌ Mobile responsive (PC-only, 100vh fixed viewport)
- ❌ Other physics visualizations beyond projectile motion
- ❌ Real-time WebSocket (uses SSE for streaming)
- ❌ Third-party UI libraries (uses Tailwind + custom components)

### External Dependencies
- **Required for operation**: Zhipu AI API key (in `.env`)
- **Optional**: Baidu Voice API (if voice feature used)
- **Visualization libraries**: p5.js (integrated), KaTeX (integrated)

## Testing Strategy

Manual verification is primary approach:
- **Layout**: 100vh no overflow, panel resize works
- **Chat**: Send message, streaming response, message scroll
- **Voice**: Record → recognize → send to chat
- **Visualization**: Trigger keyword → canvas updates, parameter controls work
- **Context**: Pronoun resolution ("这个公式" refers to previous formula)

## Configuration Files

### Environment Variables
```bash
# .env file (not in git)
VITE_ZHIPU_API_KEY=your_key_here        # Required for AI chat
BAIDU_APP_ID=xxx                         # Optional: voice recognition
BAIDU_API_KEY=xxx                        # Optional: voice recognition
BAIDU_SECRET_KEY=xxx                     # Optional: voice recognition
```

### Vite Config
- Frontend dev server: `localhost:3000`
- Path alias: `@/` → `src/`
- Vue plugin enabled

## Common Tasks

### Adding a New Visualization Type
1. Create new component in `src/components/` (e.g., `WaveMotion.vue`)
2. Add trigger marker to system prompt in `server.js`
3. Update `src/store/index.js` to add new visual type
4. Add rendering logic in `VisualCanvas.vue` to handle new type
5. Create OpenSpec change proposal first

### Modifying AI System Prompt
- Edit `SYSTEM_PROMPT` constant in `server.js`
- Include trigger marker logic for new visualizations
- Keep responses under 200 characters
- Test streaming response formatting

### Debugging Streaming Issues
- Check browser Network tab for SSE connection
- Backend logs show "流式输出完成" when done
- Ensure `data: [DONE]` handled correctly in `src/utils/streamHandler.js`
- Buffer chunking logic in `server.js` handles incomplete JSON

### Working with OpenSpec
1. Check existing specs: `openspec list --specs`
2. For new features: Create proposal under `openspec/changes/[change-id]/`
3. Write delta specs with `## ADDED|MODIFIED|REMOVED Requirements`
4. Each requirement needs at least one `#### Scenario:`
5. Validate: `openspec validate [change-id] --strict`
6. After implementation: `openspec archive <change-id> --yes`
