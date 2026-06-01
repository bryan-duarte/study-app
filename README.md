# AWS Preparation Quiz

A Next.js application for AWS certification preparation with quiz functionality and Supabase backend integration.

## Features

- **65 Quiz Questions**: Comprehensive AWS certification questions
- **Supabase Integration**: PostgreSQL backend with type-safe queries
- **User Authentication**: Supabase Auth for progress tracking
- **Progress Sync**: Save quiz progress across devices
- **Analytics Tracking**: Record quiz completion and performance
- **Error Handling**: Retry logic with exponential backoff
- **Type-Safe**: Full TypeScript coverage with Supabase-generated types

## Tech Stack

- **Next.js 16.2.6** with React 19.2.4
- **Supabase**: PostgreSQL database + Auth + Type generation
- **Zustand**: State management with persistence
- **Tailwind CSS v4**: Styling
- **TypeScript**: Type safety

## Getting Started

### Prerequisites

- Node.js (v20+)
- npm or pnpm
- Supabase account (free tier works)

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Set up Supabase:

```bash
# Link to your Supabase project (or create a new one)
supabase login
supabase link --project-id YOUR_PROJECT_ID
```

3. Configure environment variables:

```bash
# Copy the example template
cp .env.local.example .env.local

# Edit with your Supabase credentials
# Get these from: https://app.supabase.com/project/_/settings/api
```

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (server-only)

4. Run database migrations:

```bash
# Apply the schema to your Supabase project
supabase db push
```

5. Migrate quiz data:

```bash
# Load questions from JSON to Supabase
npx ts-node scripts/migrate-json-to-supabase.ts
```

6. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Database Schema

The application uses three tables:

- **questions**: Stores quiz questions with JSONB options
- **user_progress**: Tracks user progress and answers
- **quiz_analytics**: Records quiz completion statistics

See `supabase/migrations/` for the complete schema.

## API Routes

- `GET /api/questions`: Fetch quiz questions with pagination
- `POST /api/auth/signup`: User registration
- `POST /api/auth/login`: User authentication
- `POST /api/auth/logout`: User logout
- `GET /api/quiz/progress`: Fetch user progress
- `POST /api/quiz/progress`: Save user progress
- `GET /api/quiz/analytics`: Fetch analytics history
- `POST /api/quiz/analytics`: Record quiz completion

## Architecture

```
Next.js App
├── API Routes (Server-side)
│   └── Supabase Client (Service Role)
├── Components (Client-side)
│   └── Zustand Store (State + Persistence)
└── Supabase Backend
    ├── PostgreSQL (Questions, Progress, Analytics)
    └── Auth (User Sessions)
```

## Development

### Generate TypeScript Types

After schema changes, regenerate types:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/types/supabase.ts
```

### Run Type Checking

```bash
npm run build
```

## Troubleshooting

**"Missing environment variables"**
- Ensure `.env.local` is created with all required variables
- Restart the dev server after adding variables

**"Failed to fetch questions"**
- Check Supabase connection
- Verify migration was run successfully
- Check browser console for detailed errors

**"TypeScript errors"**
- Regenerate Supabase types after schema changes
- Run `npm run build` to check for type errors

## Deployment

### Environment Variables

Add these to your deployment platform (Vercel, Netlify, etc.):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Build

```bash
npm run build
npm start
```

## License

MIT
