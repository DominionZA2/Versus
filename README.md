# Versus

A browser-based PWA for creating and managing comparisons. Built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Features

- 🔐 Email magic link authentication with Supabase Auth
- 📊 Create and manage comparisons
- 🔒 Row Level Security (RLS) - users can only access their own data
- 📱 Progressive Web App (PWA) - installable on desktop and mobile
- 🎨 Modern UI with shadcn/ui components
- ⚡ Server-side rendering with Next.js App Router
- 🔧 Type-safe with TypeScript

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **State Management**: React Hook Form, TanStack Query (for client-side fetching)

## Prerequisites

- Node.js 18+ and npm
- Supabase account and project

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/DominionZA/Versus.git
cd Versus
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Create a new Supabase project at [https://app.supabase.com](https://app.supabase.com)

2. Once your project is created, go to the SQL Editor and run the schema from `supabase/schema.sql`:

```sql
-- Copy and paste the contents of supabase/schema.sql
```

3. Enable Email Auth in your Supabase project:
   - Go to Authentication → Providers
   - Enable Email provider
   - Configure email templates as needed

### 4. Configure environment variables

1. Copy the example environment file:

```bash
cp .env.local.example .env.local
```

2. Update `.env.local` with your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

You can find these values in your Supabase project settings:
- Go to Settings → API
- Copy the Project URL and anon/public key

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub

2. Import your repository on [Vercel](https://vercel.com)

3. Configure environment variables in Vercel:
   - Add `NEXT_PUBLIC_SUPABASE_URL`
   - Add `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. Deploy!

### Deploy to other platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Google Cloud Run
- Self-hosted with Node.js

Make sure to:
1. Build the production bundle: `npm run build`
2. Set environment variables
3. Run with: `npm start`

## Project Structure

```
versus/
├── public/              # Static files (manifest, service worker)
├── src/
│   ├── app/            # Next.js app router pages
│   │   ├── api/        # API routes
│   │   ├── auth/       # Auth callback routes
│   │   └── comparisons/ # Comparisons pages
│   ├── components/     # React components
│   │   ├── ui/         # shadcn/ui components
│   │   └── ...         # Feature components
│   ├── lib/            # Utility functions
│   │   └── supabase/   # Supabase client configuration
│   └── types/          # TypeScript type definitions
├── supabase/           # Database schema
└── package.json
```

## API Routes

- `GET /api/comparisons` - List user's comparisons
- `POST /api/comparisons` - Create a new comparison
- `GET /api/comparisons/[slug]` - Get a single comparison
- `GET /api/comparisons/[id]/contenders` - List contenders (scaffolded)
- `POST /api/comparisons/[id]/contenders` - Create contender (scaffolded)

## Database Schema

### Comparisons Table
- `id` (UUID) - Primary key
- `user_id` (UUID) - Reference to auth.users
- `name` (TEXT) - Comparison name
- `slug` (TEXT) - URL-friendly slug
- `created_at` (TIMESTAMPTZ) - Creation timestamp

### Contenders Table
- `id` (UUID) - Primary key
- `comparison_id` (UUID) - Reference to comparisons
- `name` (TEXT) - Contender name
- `created_at` (TIMESTAMPTZ) - Creation timestamp

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary.