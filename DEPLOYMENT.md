# Deployment Guide

## 🚀 Deploy to Vercel

### Prerequisites
- GitHub repository created and code pushed
- Supabase project set up with database

### Step 1: GitHub Setup
1. Create a new repository at https://github.com/new
2. Name: `email-subject-tester`
3. Description: `A Next.js app for testing email subject lines with AI-powered suggestions`
4. Make it **PUBLIC** (required for free Vercel deployment)
5. Don't initialize with README, .gitignore, or license
6. Push your code using the commands GitHub provides

### Step 2: Vercel Deployment
1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "New Project"
3. Import your `email-subject-tester` repository
4. Vercel will auto-detect it's a Next.js project
5. Click "Deploy"

### Step 3: Environment Variables
In your Vercel dashboard, go to Project Settings > Environment Variables and add:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Step 4: Database Setup
1. Go to your Supabase dashboard
2. Run the SQL from `database-schema.sql` in the SQL Editor
3. Run the SQL from `seed-data.sql` to populate with test data
4. Run the SQL from `bank-subject-lines.sql` to add bank subject lines

### Step 5: Redeploy
After adding environment variables, redeploy your project in Vercel.

## 🔧 Local Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev
```

## 📊 Features

- **Dark Theme**: Modern dark UI with proper contrast
- **Enhanced Search**: Returns 5-10 results even with low similarity
- **Bank Subject Lines**: 100+ banking and credit card subject lines
- **Real-time Search**: Debounced input with instant results
- **Open Rate Grading**: A-F grading system for subject lines
- **Responsive Design**: Works on all devices

## 🗄️ Database Schema

The app uses a simple PostgreSQL table with:
- `id`: Primary key
- `subject_line`: The email subject line text
- `open_rate`: Decimal (0.0000 to 1.0000)
- `created_at`: Timestamp

## 🔍 Search Algorithm

- Uses PostgreSQL's `pg_trgm` extension for fuzzy text matching
- Combined scoring: 70% similarity + 30% open rate
- Returns results even with low similarity scores
- Optimized for banking and credit card subject lines

## 🎨 UI Features

- Dark theme with proper contrast ratios
- Grade badges with color coding (A=green, B=blue, etc.)
- Hover effects and smooth transitions
- Mobile-responsive design
- Loading states and error handling
