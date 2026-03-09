# Tasks: Integrate Zhipu AI for Intelligent Conversation

## Task List

### Phase 1: Environment Setup and SDK Installation
**Dependencies**: None
**Estimated Time**: 15 minutes

1. **Install Zhipu AI SDK**
   - Run `npm install zhipuai-sdk-nodejs-v4`
   - Verify package is added to package.json
   - Test import in a temporary file

2. **Setup environment variables**
   - Create `.env` file in project root
   - Add `VITE_ZHIPU_API_KEY=` placeholder
   - Create `.env.example` template file with instructions
   - Add `.env` to `.gitignore` if not already present
   - Document API Key setup in comments

3. **Verify environment variable access**
   - Test that `import.meta.env.VITE_ZHIPU_API_KEY` is accessible
   - Add validation check for missing API Key

**Validation**: SDK installed, .env file created, environment variables accessible

---

### Phase 2: Zhipu AI Client Implementation
**Dependencies**: Phase 1 complete
**Estimated Time**: 20 minutes

4. **Create Zhipu AI client utility**
   - Create `src/utils/zhipuClient.js`
   - Import ZhipuAI SDK
   - Define SYSTEM_PROMPT constant with physics assistant role
   - Include trigger mark rules and examples in prompt
   - Add detailed Chinese comments

5. **Implement callZhipuAI function**
   - Create async function accepting userInput and messageHistory
   - Initialize Zhipu AI client with API Key
   - Format message history (last 10 messages)
   - Construct API request with system prompt, history, and user input
   - Use model "glm-4-flash", temperature 0.7, max_tokens 500
   - Return AI reply content
   - Add comprehensive Chinese comments

6. **Implement error handling**
   - Wrap API call in try-catch block
   - Handle network errors (ENOTFOUND)
   - Handle authentication errors (401)
   - Handle rate limit errors (429)
   - Handle generic errors
   - Return user-friendly error messages in Chinese
   - Add error logging to console

7. **Implement trigger mark parsing**
   - Create `parseTriggerFromReply(reply)` function
   - Use regex to match [TRIGGER:PROJECTILE] or [TRIGGER:FORMULA]
   - Extract trigger type if found
   - Remove trigger mark from display content
   - Return object: { content, trigger }
   - Add Chinese comments

**Validation**: Zhipu AI client can make API calls and parse responses correctly

---

### Phase 3: ChatBox Component Integration
**Dependencies**: Phase 2 complete
**Estimated Time**: 25 minutes

8. **Remove mock conversation logic**
   - Delete `generateAIReply()` function from ChatBox.vue
   - Delete `findLastVisualMessage()` function
   - Remove all keyword matching logic
   - Keep `sendMessage()`, `scrollToBottom()`, `getCurrentTime()` functions

9. **Import Zhipu AI client**
   - Import `callZhipuAI` and `parseTriggerFromReply` from utils
   - Import `updateVisualType` from store

10. **Add loading state**
    - Create `isLoading` reactive variable
    - Add loading message display logic
    - Style loading message (optional: add loading animation)

11. **Update sendMessage function**
    - After adding user message, set `isLoading = true`
    - Add temporary loading message: "正在思考..."
    - Call `callZhipuAI(content, state.messageList)`
    - Parse AI reply with `parseTriggerFromReply()`
    - Remove loading message
    - Add actual AI message to messageList
    - If trigger exists, call `updateVisualType(trigger)`
    - Set `isLoading = false`
    - Handle errors: replace loading message with error message
    - Add detailed Chinese comments

12. **Test error scenarios**
    - Test with invalid API Key
    - Test with network disconnected
    - Verify error messages display correctly
    - Verify user can retry after error

**Validation**:
- User sends message → AI responds intelligently
- Trigger marks correctly update visualization
- Loading state displays during API call
- Errors handled gracefully

---

### Phase 4: System Prompt Testing and Refinement
**Dependencies**: Phase 3 complete
**Estimated Time**: 20 minutes

13. **Test basic physics questions**
    - Ask "什么是重力？"
    - Ask "牛顿第一定律是什么？"
    - Verify AI provides accurate, educational responses
    - Verify responses are in Chinese and student-friendly

14. **Test projectile motion trigger**
    - Ask "什么是平抛运动？"
    - Ask "平抛运动的公式是什么？"
    - Verify AI reply includes [TRIGGER:PROJECTILE]
    - Verify canvas updates to projectile mode
    - Verify trigger mark is removed from displayed content

15. **Test formula trigger**
    - Ask "给我展示物理公式"
    - Ask "自由落体的公式"
    - Verify AI reply includes [TRIGGER:FORMULA]
    - Verify canvas updates to formula mode

16. **Test multi-turn conversation**
    - Ask "平抛运动"
    - Then ask "它的初速度方向是什么？"
    - Verify AI understands context
    - Verify conversation flows naturally

17. **Refine system prompt if needed**
    - If AI doesn't trigger correctly, adjust prompt wording
    - If responses are too verbose, add conciseness instruction
    - If trigger marks appear in wrong format, clarify rules
    - Update SYSTEM_PROMPT constant

**Validation**:
- AI responds accurately to physics questions
- Trigger marks work reliably
- Multi-turn conversations maintain context
- Response quality meets educational standards

---

### Phase 5: Documentation and Final Verification
**Dependencies**: Phase 4 complete
**Estimated Time**: 10 minutes

18. **Update .env.example**
    - Add clear instructions for obtaining Zhipu AI API Key
    - Include example format: `VITE_ZHIPU_API_KEY=your_api_key_here`
    - Add warning about not committing .env to git

19. **Add API Key setup documentation**
    - Document in code comments how to get API Key
    - Note security best practices
    - Explain environment variable usage

20. **Final integration testing**
    - Test complete user flow: send message → AI reply → visualization update
    - Test error recovery: trigger error → retry successfully
    - Test loading states: verify smooth UX during API calls
    - Verify no console errors
    - Verify all Chinese comments are clear

21. **Code quality review**
    - Verify all mock logic is removed
    - Verify error handling is comprehensive
    - Verify Chinese comments are detailed
    - Verify code follows existing conventions

**Validation**:
- Run `npm run dev` and test all scenarios
- AI integration works end-to-end
- Documentation is clear
- Code is clean and well-commented

---

## Parallelizable Work
- Tasks 4-7 (client implementation) can be done independently
- Tasks 13-16 (testing) can be done in any order

## Critical Path
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5

## Total Estimated Time
1.5 - 2 hours for complete implementation and testing
