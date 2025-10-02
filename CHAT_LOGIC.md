# Chat Interface Logic Documentation

## **Search/Chat Interface Logic Pseudocode (Detailed)**

### **Initial Chat Request (from Search Page)**

```
User clicks arrow button on Search page
↓
handleSuggestionRequest(subjectLine):
  - Extract clean subject line from input
  - Create formatted prompt: "This is a subject line I'm considering for a marketing email: \"[subjectLine]\". Provide some suggestions to help me achieve higher engagement."
  - Set initialChatMessage = formatted prompt
  - Set originalSubjectLine = clean subject line
  - Navigate to chat view (DatabaseView)
↓
DatabaseView receives initialMessage and originalSubjectLine
↓
useEffect triggers sendMessageToAI(initialMessage, true)
↓
API Call: POST /api/chat
  - isInitialRequest: true
  - message: "This is a subject line I'm considering for a marketing email: \"[subjectLine]\". Provide some suggestions to help me achieve higher engagement."
  - originalSubjectLine: "[subjectLine]" (passed directly from UI)
↓
Chat API Logic (isInitialRequest = true):
  - Use originalSubjectLine directly (no parsing needed)
  - Generate embedding for subject line using OpenAI text-embedding-ada-002
  - Run RAG: vector similarity search (hybrid: vector + keyword matching)
    - Call supabase.rpc('find_similar_subject_lines')
    - Return 10 similar subject lines with stats
  - Create contextText: "Here are some relevant high-performing subject lines from our database: [10 lines with stats]"
  - Create system prompt: "You are an expert email marketing consultant specializing in subject line optimization... [contextText] Analyze the user's subject line and provide specific, actionable suggestions for improvement..."
↓
LLM receives:
  - System prompt: "You are an expert email marketing consultant specializing in subject line optimization. Your goal is to help users create compelling, high-performing email subject lines that drive engagement and conversions. Key principles for effective subject lines: - Keep them concise (under 50 characters when possible) - Use action-oriented language and power words - Create urgency or curiosity without being spammy - Personalize when possible - Test different approaches (benefit-focused vs. curiosity-driven) - Avoid spam trigger words - Consider mobile display (shorter is better) Here are some relevant high-performing subject lines from our database: 1. \"[similar line 1]\" (Open Rate: 100.0%, Company: [company], Industry: [industry]) ... 10. \"[similar line 10]\" (Open Rate: 100.0%, Company: [company], Industry: [industry]) Analyze the user's subject line and provide specific, actionable suggestions for improvement. Focus on: 1. Immediate improvements they can make 2. Alternative approaches to test 3. Best practices from successful campaigns 4. Specific word choices and phrasing suggestions Be encouraging but honest about what works and what doesn't. Provide concrete examples."
  - User prompt: "This is a subject line I'm considering for a marketing email: \"[subjectLine]\". Provide some suggestions to help me achieve higher engagement."
↓
DatabaseView receives response:
  - context_subject_lines: 10 similar lines with stats
  - response: LLM analysis
↓
Display Logic:
  - Show "You're considering this subject line: [originalSubjectLine]"
  - Show "Here are some similar subject lines to consider:" + 10 lines with stats
  - Show "Based on the successful subject lines..." + LLM response
  - Use typewriter effect for all text
```

### **Subsequent Chat Requests (in Chat View)**

```
User types message in chat input
↓
handleSubmit():
  - All user-typed messages are subsequent requests (isInitialRequest = false)
  - Call sendMessageToAI(message, false)
↓
API Call: POST /api/chat
  - isInitialRequest: false
  - message: user's typed message (e.g., "How short is 'too short' and how long is 'too long' for subject lines?")
  - originalSubjectLine: null (not needed for subsequent requests)
↓
Chat API Logic (isInitialRequest = false):
  - contextSubjectLines = [] (no RAG, no similar lines)
  - Create system prompt: "You are an expert email marketing consultant. Help the user with their email marketing questions and provide valuable insights based on your expertise. Be helpful, knowledgeable, and provide actionable advice. Focus on answering their specific questions about email marketing best practices, subject line optimization, and engagement strategies."
↓
LLM receives:
  - System prompt: "You are an expert email marketing consultant. Help the user with their email marketing questions and provide valuable insights based on your expertise. Be helpful, knowledgeable, and provide actionable advice. Focus on answering their specific questions about email marketing best practices, subject line optimization, and engagement strategies."
  - User prompt: "How short is 'too short' and how long is 'too long' for subject lines?"
↓
DatabaseView receives response:
  - context_subject_lines: [] (empty)
  - response: LLM general advice
↓
Display Logic:
  - Show only LLM response (no similar lines)
  - Use typewriter effect
```

## **RAG Usage Summary**

**RAG is ONLY used on initial requests:**
- ✅ **Initial requests**: RAG finds 10 similar subject lines using vector similarity + keyword matching
- ❌ **Subsequent requests**: No RAG, no similar lines, just clean chat

**RAG Process:**
1. Generate embedding for user's subject line
2. Call `supabase.rpc('find_similar_subject_lines')` with embedding
3. Apply hybrid filtering (vector similarity + keyword matching)
4. Return top 10 similar subject lines with performance stats
5. Include these in the LLM system prompt as context

**No RAG on subsequent messages** - they get general email marketing advice without database context.

## **Key Components**

- **Search Page**: User enters subject line, clicks arrow
- **Chat API**: Handles RAG and LLM calls
- **DatabaseView**: Manages chat UI and message display
- **Vector Search**: Finds similar subject lines using embeddings
- **LLM Integration**: Provides analysis and suggestions
- **Typewriter Effect**: Animated text display
