# RecipeAI - Smart Recipe Management System

An AI-powered recipe management application built with Next.js 14, Supabase, and Claude AI.

## Features

- **Recipe Management** — Full CRUD: add, edit, delete recipes with rich metadata
- **Status Tagging** — Mark recipes as Favorite, To Try, or Made Before
- **Smart Search** — Search by title, description, cuisine, ingredients
- **AI Recipe Generator** — Generate recipes from ingredients you have using Claude AI
- **AI Ingredient Substitutions** — Get smart substitutions for any ingredient (hover any ingredient)
- **AI Nutritional Analysis** — Auto-estimate calories, protein, carbs, fat, fiber on save
- **AI Meal Planner** — Claude generates a weekly meal plan from your saved recipes
- **Multi-user Support** — Each user has their own private collection with RLS
- **Recipe Sharing** — Share recipes with specific users or make them public
- **Community Explorer** — Browse publicly shared recipes
- **User Profiles** — Manage your profile and view your recipe stats

## Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **UI**: Tailwind CSS v4 + Radix UI components
- **Database & Auth**: Supabase (PostgreSQL + Row Level Security)
- **AI**: Anthropic Claude API (claude-sonnet-4-6 + claude-haiku-4-5)
- **Deployment**: Vercel

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ANTHROPIC_API_KEY=your_anthropic_key
```

### 3. Set up Supabase database
Run the SQL in `supabase/schema.sql` via:
Supabase Dashboard → SQL Editor → New Query → paste & run

### 4. Run development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment (Vercel)

1. Push to GitHub
2. Import project in Vercel
3. Add all 4 environment variables in Vercel project settings
4. Deploy
