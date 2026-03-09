# Tasks: Implement Physics Visualization Web Application

## Task List

### Phase 1: Project Scaffolding and Configuration
**Dependencies**: None
**Estimated Time**: 30 minutes

1. **Initialize Vite + Vue 3 project**
   - Run `npm create vite@latest . -- --template vue`
   - Install dependencies: `npm install`
   - Verify project structure created correctly

2. **Configure Vite**
   - Create `vite.config.js` with port 3000 and `@` alias pointing to `src`
   - Test dev server starts correctly: `npm run dev`

3. **Create project directory structure**
   - Create `src/components/` directory
   - Create `src/assets/` directory
   - Create `src/store/` directory
   - Verify all directories exist

4. **Setup global CSS**
   - Create `src/assets/global.css` with CSS Reset, color variables, and common button styles
   - Import global.css in `src/main.js`
   - Verify styles load correctly in browser

**Validation**: Run `npm run dev` and verify app loads at http://localhost:3000 with global styles applied

---

### Phase 2: State Management Implementation
**Dependencies**: Phase 1 complete
**Estimated Time**: 20 minutes

5. **Implement global state store**
   - Create `src/store/index.js`
   - Define `reactive` state object with `messageList` and `currentVisualType`
   - Implement `addMessage(message)` method with detailed Chinese comments
   - Implement `updateVisualType(type)` method with detailed Chinese comments
   - Export state and methods

6. **Test state reactivity**
   - Import state in a test component
   - Call `addMessage` and verify messageList updates
   - Call `updateVisualType` and verify currentVisualType updates

**Validation**: State changes trigger reactive updates in components

---

### Phase 3: UI Layout and Root Component
**Dependencies**: Phase 1, Phase 2 complete
**Estimated Time**: 30 minutes

7. **Create App.vue root layout**
   - Implement 100vh container with `overflow: hidden`
   - Create left-right split layout (30% / 70%)
   - Add placeholders for ChatBox and VisualCanvas components
   - Add Chinese comments explaining layout structure

8. **Implement state linkage in App.vue**
   - Import global state and VisualCanvas ref
   - Use `watch` to monitor `currentVisualType` changes
   - Call `VisualCanvas.updateCanvas(type)` when type changes
   - Add detailed Chinese comments for linkage logic

9. **Create component-specific CSS files**
   - Create `src/assets/ChatBox.css` (empty for now)
   - Create `src/assets/VisualCanvas.css` (empty for now)

**Validation**: App.vue renders with correct split-pane layout, no overflow

---

### Phase 4: ChatBox Component Implementation
**Dependencies**: Phase 3 complete
**Estimated Time**: 60 minutes

10. **Create ChatBox.vue structure**
    - Create three-layer structure: title bar, message area, input area
    - Apply A2UI color scheme (#006644 for title bar)
    - Set correct heights (title: 50px, input: 80px, messages: flex 1)
    - Add Chinese comments for each section

11. **Implement message display**
    - Create message list rendering with v-for
    - Apply user message styles (right-aligned, #006644 background)
    - Apply AI message styles (left-aligned, #f5f5f5 background)
    - Add timestamp display below each message (12px, #999)
    - Add Chinese comments for styling logic

12. **Implement input area**
    - Create textarea with 70% width, proper styling
    - Create voice input button (15% width) with state toggle
    - Create send button (10% width) with primary button styles
    - Bind textarea to `inputValue` reactive variable
    - Add Chinese comments for input controls

13. **Implement sendMessage logic**
    - Create `sendMessage()` function triggered by button click or Enter key
    - Generate user message object with unique ID, role, content, time
    - Call `addMessage` to add user message to state
    - Clear input field
    - Scroll message area to bottom
    - Add detailed Chinese comments

14. **Implement AI reply logic**
    - Create `generateAIReply(userInput, messageHistory)` function
    - Implement keyword matching for "平抛" → PROJECTILE trigger
    - Implement keyword matching for "公式" → FORMULA trigger
    - Implement context association for "这个/它/该模型" with history lookup
    - Generate AI message and call `addMessage` after 500ms delay
    - Parse `[TRIGGER:XXX]` and call `updateVisualType`
    - Add extensive Chinese comments explaining logic

15. **Implement voice input interface (reserved)**
    - Create `startVoiceRecognition()` function
    - Add TODO comment and detailed Baidu Voice SDK integration instructions
    - Implement button state toggle (isRecording true/false)
    - Add Chinese comments for future SDK integration

16. **Style ChatBox component**
    - Complete `src/assets/ChatBox.css` with all message, input, button styles
    - Ensure hover/active states match A2UI spec
    - Test scrolling behavior in message area

**Validation**:
- Send message "平抛运动" → AI replies with PROJECTILE trigger
- Send "公式" → AI replies with FORMULA trigger
- Send "平抛运动" then "这个公式" → AI recognizes context
- Voice button toggles state correctly
- All styles match A2UI specification

---

### Phase 5: VisualCanvas Component Implementation
**Dependencies**: Phase 3 complete
**Estimated Time**: 40 minutes

17. **Create VisualCanvas.vue structure**
    - Create three-layer structure: status bar, canvas area, control area
    - Set status bar height 50px, background #f5f5f5
    - Create `#canvas-mount-point` div with flexbox centering
    - Create `#formula-container` div inside mount point
    - Set control area height 50px
    - Add Chinese comments for each section

18. **Implement canvas state management**
    - Create `statusText` reactive variable (default: "当前模式 - 未选择可视化")
    - Create `placeholderText` reactive variable (default: "可视化画布已准备就绪")
    - Bind variables to template

19. **Implement updateCanvas method**
    - Create `updateCanvas(type)` function exposed via `defineExpose`
    - Handle PROJECTILE type: update statusText and placeholderText
    - Handle FORMULA type: update statusText and placeholderText
    - Add detailed Chinese comments with p5.js/Three.js/MathJax integration instructions
    - Add TODO comments for future rendering implementation

20. **Implement resetCanvas method**
    - Create `resetCanvas()` function
    - Reset statusText and placeholderText to defaults
    - Call `updateVisualType('')` to clear global state
    - Add Chinese comments

21. **Create reset button**
    - Add "重置画布" button in control area
    - Apply primary button styles
    - Bind click event to `resetCanvas`

22. **Style VisualCanvas component**
    - Complete `src/assets/VisualCanvas.css` with all layout and button styles
    - Ensure button hover/active states match A2UI spec
    - Test canvas area centering and placeholder display

**Validation**:
- Canvas displays default placeholder on load
- Calling `updateCanvas('PROJECTILE')` updates status and placeholder
- Calling `updateCanvas('FORMULA')` updates status and placeholder
- Reset button restores default state
- All styles match A2UI specification

---

### Phase 6: Integration and End-to-End Testing
**Dependencies**: Phase 4, Phase 5 complete
**Estimated Time**: 30 minutes

23. **Integrate components in App.vue**
    - Import ChatBox and VisualCanvas components
    - Add components to template with proper layout
    - Verify ref binding for VisualCanvas works
    - Test watch callback triggers correctly

24. **End-to-end linkage testing**
    - Test: Send "平抛运动" → Verify canvas updates to PROJECTILE mode
    - Test: Send "公式" → Verify canvas updates to FORMULA mode
    - Test: Send "平抛运动" then "这个公式" → Verify context recognition and canvas stays in PROJECTILE mode
    - Test: Click reset button → Verify canvas and state reset
    - Test: Multiple type switches → Verify smooth transitions

25. **Visual style verification**
    - Verify 100vh layout with no overflow
    - Verify left/right split ratio (30%/70%)
    - Verify all colors match A2UI spec (#006644, #f5f5f5, etc.)
    - Verify button hover/active states
    - Verify message bubble styles and alignment
    - Verify font sizes (16px title, 14px normal, 12px auxiliary)

26. **Code quality review**
    - Verify all core functions have detailed Chinese comments
    - Verify variable naming follows camelCase convention
    - Verify component naming follows PascalCase convention
    - Verify TODO comments for SDK integration are clear and detailed

**Validation**:
- Run `npm install && npm run dev`
- App loads at http://localhost:3000 without errors
- All interaction flows work correctly
- All visual styles match specification
- Code is well-commented in Chinese

---

### Phase 7: Documentation and Delivery
**Dependencies**: Phase 6 complete
**Estimated Time**: 20 minutes

27. **Verify package.json**
    - Ensure `dev` script exists: `"dev": "vite"`
    - Ensure `build` script exists: `"build": "vite build"`
    - Verify all dependencies are listed

28. **Create project README (optional)**
    - Document how to run the project
    - List key features implemented
    - Note reserved interfaces for future integration

29. **Final verification checklist**
    - [ ] `npm install` runs without errors
    - [ ] `npm run dev` starts server at http://localhost:3000
    - [ ] 100vh layout displays correctly with no overflow
    - [ ] Message flow scrolls independently
    - [ ] Send message → AI replies → Canvas updates
    - [ ] Context association works ("平抛运动" → "这个公式")
    - [ ] Button hover/active states work
    - [ ] Reset button clears canvas and state
    - [ ] All Chinese comments are present and clear

**Validation**: Complete checklist with all items passing

---

## Parallelizable Work
- Tasks 10-16 (ChatBox) and 17-22 (VisualCanvas) can be implemented in parallel after Phase 3
- Tasks 4 (global CSS) and 5-6 (state management) can be done in parallel

## Critical Path
Phase 1 → Phase 2 → Phase 3 → (Phase 4 || Phase 5) → Phase 6 → Phase 7

## Total Estimated Time
3.5 - 4 hours for complete implementation and testing
