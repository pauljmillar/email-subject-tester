# Email Subject Line Tester

A Next.js application that helps users test their email subject lines by finding similar high-performing subject lines from a database.

## Features

- **ChatGPT-style interface** with autocomplete suggestions
- **Real-time search** with debounced input
- **Open rate ranking** with A-F grading system
- **Fuzzy text matching** for finding similar subject lines
- **Responsive design** with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL with pg_trgm extension)
- **Deployment**: Vercel

## Setup Instructions

### 1. Database Setup (Supabase)

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor in your Supabase dashboard
3. Run the SQL from `database-schema.sql` to create the table and functions
4. Run the SQL from `seed-data.sql` to populate with test data

### 2. Environment Variables

1. Copy `.env.local.example` to `.env.local`
2. Fill in your Supabase credentials:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (found in Settings > API)

### 3. Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

### 4. Deployment (Vercel)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add your environment variables in Vercel dashboard
4. Deploy!

## Database Schema

The application uses a simple table structure:

```sql
CREATE TABLE subject_lines (
  id SERIAL PRIMARY KEY,
  subject_line TEXT NOT NULL,
  open_rate DECIMAL(5,4) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Search Algorithm

The search uses PostgreSQL's `pg_trgm` extension for fuzzy text matching:

1. **Text similarity** using trigram matching
2. **Open rate weighting** in the scoring algorithm
3. **Combined score** = (0.7 × similarity) + (0.3 × open_rate)

## Grading System

Open rates are converted to letter grades:
- **A**: ≥15% open rate
- **B**: 10-14.9% open rate  
- **C**: 5-9.9% open rate
- **D**: 2-4.9% open rate
- **F**: <2% open rate

## Production Considerations

For production with millions of subject lines:

1. **Vector embeddings**: Replace fuzzy text search with semantic similarity using pgvector
2. **Caching**: Implement Redis caching for frequent queries
3. **Rate limiting**: Add API rate limiting
4. **Analytics**: Track search patterns and popular queries
5. **A/B testing**: Test different ranking algorithms

## API Endpoints

- `GET /api/search?q={query}` - Search for similar subject lines

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request