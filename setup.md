# Quick Setup Guide

## 1. Supabase Database Setup

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Wait for the project to be ready (usually 2-3 minutes)

2. **Run Database Schema**
   - Go to your Supabase dashboard → SQL Editor
   - Copy and paste the contents of `database-schema.sql`
   - Click "Run" to create the table and functions

3. **Seed Test Data**
   - In the same SQL Editor
   - Copy and paste the contents of `seed-data.sql`
   - Click "Run" to insert 100 test subject lines

4. **Get API Keys**
   - Go to Settings → API in your Supabase dashboard
   - Copy your Project URL and Service Role Key

## 2. Environment Variables

1. **Update `.env.local`**
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_actual_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key
   ```

## 3. Run the Application

```bash
# Install dependencies (if not done already)
npm install

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to test the application!

## 4. Test the Search

Try searching for:
- "sale" - should show various sale-related subject lines
- "order" - should show shipping and order-related lines
- "limited" - should show urgency-based subject lines

## 5. Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables in Vercel dashboard
   - Deploy!

## Troubleshooting

- **Build errors**: Make sure all environment variables are set
- **Database errors**: Verify your Supabase credentials and that the schema was created
- **No results**: Check that the seed data was inserted successfully

## Next Steps

- Replace fuzzy text search with vector embeddings for production
- Add more sophisticated ranking algorithms
- Implement caching for better performance
- Add analytics to track popular searches
