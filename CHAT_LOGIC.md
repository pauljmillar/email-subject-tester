# Chat Interface Logic Documentation

## **3-Step RAG (Retrieval-Augmented Generation) Workflow**

### **Complete Chat Flow (DatabaseViewIntent.tsx)**

```
User types message in chat input
↓
sendMessageToAI(messageContent, isInitialRequest)
↓
STEP 1: Intent Analysis
API Call: POST /api/chat/intent
  - userPrompt: messageContent
  - originalSubjectLine: originalSubjectLine
↓
Intent API Logic:
  - Analyze user request using LLM
  - Determine what data would be most helpful
  - Generate facets with SQL queries or vector search parameters
  - Return JSON with intent and facets
↓
STEP 2: Data Collection
API Call: POST /api/chat/gather
  - intentResponse: { intent, facets }
  - originalSubjectLine: originalSubjectLine
↓
Gather API Logic:
  - Execute database queries in parallel for each facet
  - Use SQL queries or vector search based on facet type
  - Combine all results into contextText
  - Return aggregated context data
↓
STEP 3: Final Response
API Call: POST /api/chat
  - message: user's original message
  - isInitialRequest: false
  - originalSubjectLine: originalSubjectLine
  - contextText: aggregated data from gather step
↓
Chat API Logic:
  - Create system prompt with database context
  - Generate AI response using context + user message
  - Return final response
↓
Display Logic:
  - Show AI response with typewriter effect
  - Include relevant database data in response
```

## **Step 1: Intent Analysis (/api/chat/intent)**

### **Intent Processing Prompt**

```
Analyze this user request and determine what data would be most helpful:

User request: "${userPrompt}"
${originalSubjectLine ? `Original subject line: "${originalSubjectLine}"` : ''}

Current date context: Today is ${currentDate}. The database contains email data primarily from 2025 (July-October 2025). When generating date ranges, use 2025 dates instead of 2024.

Database Schema:
Table: subject_lines
- id (int): Primary key
- subject_line (text): The email subject line text
- company (text): Company name (e.g., "Capital One", "Chase", "American Express")
- sub_industry (text): Industry category (e.g., "Financial Services - Banking", "Financial Services - Credit Cards")
- open_rate (float): Open rate as decimal (0.0 to 1.0)
- projected_volume (int): Email volume/send size
- date_sent (date): When the email was sent
- created_at (timestamp): Record creation time
- mailing_type (text): Type of mailing (e.g., "Acquisition", "Retention")
- inbox_rate (float): Inbox delivery rate
- spam_rate (float): Spam rate
- read_rate (float): Read rate
- read_delete_rate (float): Read and delete rate
- delete_without_read_rate (float): Delete without read rate

Sample rows:
1. id: 3644, subject_line: "A federal holiday is coming up", company: "Capital One", sub_industry: "Financial Services - Banking", open_rate: 0.3004, projected_volume: 10681779, date_sent: "2025-08-11", mailing_type: "Acquisition"
2. id: 3645, subject_line: "As the seasons change, so do fraud tactics", company: "Capital One", sub_industry: "Financial Services - Banking", open_rate: 0.254, projected_volume: 10147179, date_sent: "2025-08-12", mailing_type: "Acquisition"

Table: subject_line_embeddings  
- subject_line_id (int): Foreign key to subject_lines.id
- embedding (vector): 1536-dimensional vector embedding for similarity search

Return JSON with this EXACT structure:
{
  "intent": "Clear description of what the user is trying to determine",
  "facets": [
    {
      "type": "subject_line|volume|open_rates",
      "parameters": {
        "company": [],
        "industry": [],
        "timeframe": "recent|last 3 months|this year"
      },
      "subject_line": "actual subject line here",
      "sql": "SQL statement to run in postgres for this specific facet"
    }
  ]
}

Facet types:
- "subject_line": For subject line analysis, examples, and searches
- "volume": For email volume, largest campaigns, biggest sends, high-volume campaigns  
- "open_rates": For successful campaigns, popular messages, good subject lines, engaged emails

CRITICAL: For subject_line facets, determine the search method based on the user's request:

VECTOR SEARCH (use subject_line parameter, NO SQL):
- User asks about subject line CONTENT/CONTEXT: "announce APR", "welcome emails", "engaging subject lines", "about fraud", "regarding rewards"
- User asks for similar subject lines: "like this one", "similar to", "examples of"
- User asks about subject line themes: "holiday emails", "promotional subject lines", "security alerts"
- When using VECTOR SEARCH: Set subject_line parameter with the content/context keywords, leave sql as empty string ""

SQL SEARCH (generate SQL, NO subject_line parameter):
- User asks for subject line FILTERING/LISTING: "from Chase", "sent by Capital One", "recent subject lines", "last month", "all subject lines"
- User asks for subject line statistics: "how many subject lines", "count of emails", "list of campaigns"
- When using SQL SEARCH: Leave subject_line as empty string "", generate appropriate SQL query

Examples:
- "Find good subject lines that announce APR" → VECTOR search with subject_line="announce APR"
- "Show me subject lines from Chase" → SQL search with company filter
- "Welcome emails from last month" → VECTOR search with subject_line="welcome emails" + date filter
- "All subject lines sent by Capital One" → SQL search with company filter
- "Find good subject lines from Credit Karma that announce APR" → VECTOR search with subject_line="announce APR" + company=["Credit Karma"]
- "Engaging subject lines from Chase about rewards" → VECTOR search with subject_line="rewards" + company=["Chase"]

IMPORTANT: For VECTOR SEARCH with company filters, include the company in parameters AND set subject_line for content search.

IMPORTANT: For comparison questions (e.g., "Did X send more emails in July or August?", "Compare X vs Y", "Which month had higher volume?"), create SEPARATE facets for each comparison point:
- One facet for July data
- One facet for August data
- One facet for Company A vs Company B
- etc.

This allows the system to retrieve data for each comparison point separately and provide accurate comparisons.

Only include facets that are relevant. If no facets are needed, return {"intent": "...", "facets": []}.

Return ONLY valid JSON, no other text.
```

### **Intent Response Format**

```json
{
  "intent": "User wants to find successful subject lines about APR from Chase",
  "facets": [
    {
      "type": "subject_line",
      "parameters": {
        "company": ["Chase"],
        "timeframe": "recent"
      },
      "subject_line": "APR",
      "sql": "SELECT * FROM subject_lines WHERE company = 'Chase' AND subject_line ILIKE '%APR%' ORDER BY open_rate DESC LIMIT 10"
    }
  ]
}
```

## **Step 2: Data Collection (/api/chat/gather)**

### **Gather API Logic**

```
For each facet in intentResponse.facets:
  - If facet.sql exists → Call /api/data/query-sql with SQL query
  - If facet.subject_line exists → Call /api/data/query-sql with vector search
  - Execute all queries in parallel using Promise.all()
  - Combine results into contextText

Return:
{
  "contextText": "1. 'Your APR has changed' (Open Rate: 45.2%, Company: Chase)\n2. 'Important APR update' (Open Rate: 38.7%, Company: Chase)...",
  "facetCount": 1,
  "successCount": 1
}
```

## **Step 3: Final Response (/api/chat)**

### **Chat API with Context**

```
System Prompt (with context):
"You are an expert email marketing consultant. 

- If we have included information here from our database of email marketing campaign performance, it will show up here:
${contextText}
You should try to answer the user's request with it. Print 3-5 rows of the data from the database to demonstrate your thinking, as long as it is relevant.

- If no data from our database has been included, reply, "I couldn't find any information about that in our database," then briefly answer the request as best you can.

Either way, reply succinctly and decisively, using short bullet points and a summary sentence."

User Message: Original user request
↓
LLM generates response using database context
↓
Return final response with typewriter effect
```

## **Database Schema Details**

### **Main Table: `subject_lines`**
- **Primary Key**: `id` (int)
- **Content**: `subject_line` (text) - The actual email subject line
- **Company**: `company` (text) - Bank/financial institution name
- **Industry**: `sub_industry` (text) - Financial services category
- **Performance Metrics**:
  - `open_rate` (float): 0.0 to 1.0 decimal
  - `inbox_rate` (float): Delivery rate
  - `spam_rate` (float): Spam rate
  - `read_rate` (float): Read rate
  - `read_delete_rate` (float): Read and delete rate
  - `delete_without_read_rate` (float): Delete without read rate
- **Volume**: `projected_volume` (int) - Email send size
- **Timing**: `date_sent` (date), `created_at` (timestamp)
- **Campaign Type**: `mailing_type` (text) - "Acquisition", "Retention"

### **Vector Search Table: `subject_line_embeddings`**
- **Foreign Key**: `subject_line_id` (int) → `subject_lines.id`
- **Vector**: `embedding` (vector) - 1536-dimensional embeddings for semantic search

## **Search Methods**

1. **Vector Search**: For content/context queries using semantic similarity
2. **SQL Search**: For filtering, statistics, and structured queries

## **Key Features**

- **Intent Analysis**: Determines what data to retrieve based on user request
- **Parallel Data Collection**: Executes multiple database queries simultaneously
- **Context-Aware Responses**: AI gets relevant database context for accurate answers
- **Vector + SQL Search**: Supports both semantic similarity and structured queries
- **Faceted Queries**: Can handle complex multi-faceted requests
- **Typewriter Effect**: Animated text display for better UX

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

## **Key Decision Points**

**What sets `isInitialRequest: true`?**
- ✅ **ONLY**: Clicking the arrow button from the Search page
- ❌ **NEVER**: Typing in the chat input field

**What sets `isInitialRequest: false`?**
- ✅ **ALL**: User-typed messages in chat input
- ✅ **ALL**: Follow-up questions in chat

## **Key Components**

- **Search Page**: User enters subject line, clicks arrow → `isInitialRequest: true`
- **Chat Input**: User types message → `isInitialRequest: false`
- **Chat API**: Handles RAG and LLM calls
- **DatabaseView**: Manages chat UI and message display
- **Vector Search**: Finds similar subject lines using embeddings
- **LLM Integration**: Provides analysis and suggestions
- **Typewriter Effect**: Animated text display
