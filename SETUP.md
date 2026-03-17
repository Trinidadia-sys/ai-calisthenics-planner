# Setup Guide

This guide will walk you through setting up the AI Calisthenics Planner from scratch.

## Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Git** - [Download here](https://git-scm.com/)
- **Supabase Account** - [Sign up free](https://supabase.com/)
- **OpenAI API Key** - [Get API key](https://platform.openai.com/api-keys)
- **YouTube Data API Key** - [Enable API](https://console.developers.google.com/)

## Step 1: Project Setup

### Clone and Install

```bash
git clone <your-repository-url>
cd ai-calisthenics-planner
npm install
```

### Verify Installation

```bash
npm run dev
```

You should see the Next.js development server start successfully.

## Step 2: Environment Configuration

### Create Environment File

```bash
cp .env.example .env.local
```

### Get API Keys

#### OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy the key (starts with `sk-`)

#### YouTube Data API Key
1. Go to [Google Cloud Console](https://console.developers.google.com/)
2. Create a new project or select existing
3. Enable "YouTube Data API v3"
4. Create credentials -> API Key
5. Copy the key (starts with `AIza`)

#### Supabase Configuration
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project
3. Go to Project Settings -> API
4. Copy:
   - Project URL (starts with `https://`)
   - Anon public key
   - Service role key (found in Database settings)

### Update .env.local

```env
# OpenAI API Key
OPENAI_API_KEY=sk-your-openai-key-here

# YouTube API Key
YOUTUBE_API_KEY=AIza-your-youtube-key-here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ-your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=eyJ-your-service-role-key-here
```

## Step 3: Database Setup

### Enable pgvector Extension

1. In Supabase Dashboard, go to **Database**
2. Click **Extensions**
3. Search for "vector" and enable **pgvector**

### Run Database Migrations

1. In Supabase Dashboard, go to **SQL Editor**
2. Create a new query
3. Copy and paste the contents of `database.sql`
4. Click **Run** to execute

### Run Database Functions

1. Create another new query
2. Copy and paste the contents of `database_functions.sql`
3. Click **Run** to execute

### Verify Tables

You should see these tables in your database:
- `users`
- `workout_plans`
- `workout_days`
- `exercises`
- `workout_exercises`
- `workout_completions`
- `youtube_videos`
- `exercise_embeddings`

## Step 4: Test the Application

### Start Development Server

```bash
npm run dev
```

### Test User Registration

1. Open [http://localhost:3000](http://localhost:3000)
2. Click "Sign Up"
3. Enter email and password
4. Select experience level
5. Click "Sign Up"

### Test Workout Generation

1. After signing in, you'll be redirected to dashboard
2. Click "Generate New Workout Plan"
3. The AI should create a personalized workout plan

## Step 5: YouTube Sync (Optional)

### Sync Videos and Extract Exercises

You can trigger the YouTube sync process to populate your exercise database:

```bash
curl -X POST http://localhost:3000/api/youtube-sync \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

This will:
1. Search YouTube for calisthenics videos
2. Extract exercises from video transcripts
3. Store exercises in database
4. Generate vector embeddings

## Step 6: Production Deployment

### Vercel Deployment (Recommended)

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com/)
3. Click "New Project"
4. Import your GitHub repository
5. Add environment variables in Vercel dashboard
6. Deploy

### Manual Deployment

```bash
npm run build
npm start
```

## Troubleshooting

### Common Issues

#### "Cannot find module '@/types'"
- Make sure you're in the `src/app` directory structure
- Check that TypeScript is properly configured

#### "Supabase connection failed"
- Verify your Supabase URL and keys in .env.local
- Check that your Supabase project is active
- Ensure pgvector extension is enabled

#### "OpenAI API error"
- Verify your OpenAI API key is valid
- Check your OpenAI account has credits
- Ensure the key has proper permissions

#### "YouTube API error"
- Verify YouTube Data API v3 is enabled
- Check your API key has proper permissions
- Ensure you haven't exceeded quota limits

### Debug Mode

Add this to your .env.local for debugging:

```env
NODE_ENV=development
```

This will provide more detailed error messages in API responses.

### Database Issues

#### Reset Database

If you need to start fresh:

1. In Supabase Dashboard, go to **Settings**
2. Click **Reset project password**
3. Run the migrations again

#### Check Tables

```sql
-- List all tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check exercise count
SELECT COUNT(*) FROM exercises;

-- Check user count
SELECT COUNT(*) FROM users;
```

## Next Steps

Once setup is complete:

1. **Explore the Dashboard**: Navigate through the UI
2. **Generate Workout Plans**: Test AI generation with different parameters
3. **Track Progress**: Complete workouts and monitor statistics
4. **Customize Plans**: Modify exercises and regenerate plans
5. **Sync YouTube Content**: Populate your exercise database

## Support

If you encounter issues:

1. Check the [README.md](./README.md) for documentation
2. Review the error messages in browser console
3. Check the server logs in your terminal
4. Create an issue on GitHub with detailed error information

---

Happy coding! 🚀
