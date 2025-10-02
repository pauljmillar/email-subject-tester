# OpenAI Chat Setup

## Setup Instructions

To enable the chat functionality, you need to add your OpenAI API key to the environment variables.

### 1. Get your OpenAI API Key
- Go to [OpenAI Platform](https://platform.openai.com/api-keys)
- Create a new API key
- Copy the key (it starts with `sk-`)

### 2. Add to Environment Variables

Add this line to your `.env.local` file:

```
OPENAI_API_KEY=your_actual_api_key_here
```

### 3. Restart the Development Server

After adding the API key, restart your development server:

```bash
npm run dev
```

## Features

The chat system includes:

- **Real-time responses** from OpenAI GPT-3.5-turbo
- **Email marketing expertise** - The AI is specialized in email subject line optimization
- **Error handling** - Proper error messages for API issues
- **Loading states** - Visual feedback during API calls

## Usage

1. Navigate to the Database view (🗄️ icon in sidebar)
2. Type your question in the input field at the bottom
3. Press Enter or click Send
4. The AI will respond with helpful insights about email subject lines

## Example Questions

- "How can I improve my subject line: 'Special Offer Inside'?"
- "What makes a good email subject line?"
- "Give me 5 subject line ideas for a Black Friday sale"
- "What's the optimal length for email subject lines?"

## Future Enhancements

This is the foundation for a RAG (Retrieval-Augmented Generation) system that will:
- Use embeddings to find similar subject lines
- Analyze high-performing subject lines
- Provide data-driven recommendations
- Include metrics like open rates and volume data
