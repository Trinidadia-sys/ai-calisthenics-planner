# AI Calisthenics Planner

A production-quality MVP web application that generates personalized calisthenics workout plans using AI agents that analyze popular YouTube workouts.

## Features

- **AI-Generated Workout Plans**: Personalized programs based on experience level and preferences
- **YouTube Integration**: Exercises sourced from popular calisthenics channels with video references
- **Vector Search (RAG)**: Intelligent exercise retrieval using pgvector embeddings
- **Progress Tracking**: Monitor workout completion, streaks, and fitness journey
- **Modern UI**: Nebula theme with glassmorphism design and smooth animations
- **Multi-Agent Architecture**: Modular AI system for video discovery, exercise extraction, and workout planning

## Tech Stack

### Frontend
- **Next.js 15** (App Router)
- **React 18**
- **TypeScript**
- **TailwindCSS**
- **Framer Motion**

### Backend & Database
- **Supabase** (Postgres + Auth)
- **pgvector** for vector search
- **Row Level Security (RLS)**

### AI & APIs
- **OpenAI API** (GPT-4 + Embeddings)
- **YouTube Data API v3**
- **Google APIs**

## Architecture

```
├── app/                    # Next.js app router pages
├── components/             # Reusable UI components
├── lib/                   # Utility functions and clients
├── ai/                    # AI workout generation
├── agents/                # AI agents for specific tasks
├── rag/                   # Retrieval Augmented Generation
├── api/                   # API routes
├── types/                 # TypeScript type definitions
└── styles/                # Global styles and themes
```

### AI Agents

1. **Video Discovery Agent**: Searches YouTube for calisthenics content
2. **Exercise Extraction Agent**: Extracts exercises from video transcripts
3. **Workout Plan Agent**: Generates structured workout programs

### RAG System

- **Exercise Embeddings**: Vector representations of exercises
- **Similarity Search**: Find relevant exercises based on user needs
- **Knowledge Base**: Prevents AI hallucinations with real exercise data

## Quick Start

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm
- Supabase account
- OpenAI API key
- YouTube Data API key

### 1. Clone and Install

```bash
git clone <repository-url>
cd ai-calisthenics-planner
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your environment variables:

```env
# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

# YouTube API Key
YOUTUBE_API_KEY=your_youtube_api_key_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. Database Setup

1. Create a new Supabase project
2. Run the SQL migrations:

```sql
-- Run database.sql first
-- Then run database_functions.sql
```

3. Enable the pgvector extension in your Supabase project

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Database Schema

### Core Tables

- **users**: User profiles and experience levels
- **workout_plans**: Generated workout programs
- **workout_days**: Individual workout sessions
- **exercises**: Exercise database with metadata
- **workout_exercises**: Junction table for plan exercises
- **workout_completions**: User progress tracking
- **youtube_videos**: Video metadata and transcripts
- **exercise_embeddings**: Vector embeddings for RAG

### Key Features

- **Row Level Security**: Users can only access their own data
- **Vector Search**: pgvector for semantic exercise retrieval
- **Indexes**: Optimized for performance

## API Endpoints

### Authentication
- `POST /api/signup` - Create new account
- `POST /api/login` - Sign in existing user

### Workout Plans
- `POST /api/generate-plan` - Generate new AI workout plan
- `GET /api/generate-plan` - Get user's workout plans
- `DELETE /api/generate-plan` - Delete workout plan

### Exercises
- `GET /api/exercises` - Search/filter exercises
- `POST /api/exercises` - Create new exercise

### Progress
- `POST /api/complete-workout` - Mark workout complete
- `GET /api/complete-workout` - Get completion history

### YouTube Sync
- `POST /api/youtube-sync` - Sync videos and extract exercises

## Usage

### 1. User Registration
- Sign up with email and password
- Select experience level (Beginner, Intermediate, Advanced, Expert)

### 2. Generate Workout Plan
- Click "Generate New Workout Plan"
- Specify training frequency (1-7 days/week)
- AI creates personalized weekly program

### 3. Track Progress
- Complete workouts and mark them done
- View progress statistics and streaks
- Access exercise video references

### 4. Customize Plans
- Modify exercises, sets, and reps
- Replace exercises with alternatives
- Regenerate plans as needed

## Development

### Project Structure

```
src/
├── app/
│   ├── (auth)/           # Authentication pages
│   ├── dashboard/        # Main dashboard
│   └── api/              # API routes
├── components/
│   ├── ExerciseCard.tsx  # Exercise display component
│   ├── WorkoutDayCard.tsx # Day workout view
│   ├── ProgressWidget.tsx # Progress statistics
│   └── PlanGeneratorButton.tsx # AI generation trigger
├── lib/
│   ├── auth.ts           # Authentication helpers
│   └── supabaseClient.ts # Database client
├── ai/
│   └── generateWorkoutPlan.ts # Main AI orchestrator
├── agents/
│   ├── videoDiscoveryAgent.ts # YouTube video finder
│   ├── exerciseExtractionAgent.ts # Exercise extractor
│   └── workoutPlanAgent.ts # Workout generator
└── rag/
    ├── embedExercises.ts # Embedding service
    └── queryExercises.ts # Vector search service
```

### Key Components

- **WorkoutPlanGenerator**: Main orchestrator for AI workflow
- **ExerciseQueryService**: Vector search and exercise retrieval
- **Multi-Agent Pipeline**: Modular AI processing

### Environment Variables

Required for development:

```env
OPENAI_API_KEY=sk-...
YOUTUBE_API_KEY=AIza...
NEXT_PUBLIC_SUPABASE_URL=https://....
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push

### Manual Deployment

```bash
npm run build
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Roadmap

- [ ] Mobile app development
- [ ] Advanced analytics dashboard
- [ ] Social features and sharing
- [ ] Nutrition tracking integration
- [ ] Wearable device integration
- [ ] Multi-language support

## Support

For support and questions:

- Create an issue on GitHub
- Check the documentation
- Review the API endpoints

---

Built with ❤️ using Next.js, Supabase, and OpenAI.
