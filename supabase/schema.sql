-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique,
  full_name text,
  avatar_url text,
  bio text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Recipes table
create table if not exists public.recipes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  ingredients jsonb not null default '[]',
  instructions text not null default '',
  cuisine_type text,
  prep_time integer,
  cook_time integer,
  servings integer,
  difficulty text check (difficulty in ('easy', 'medium', 'hard')),
  status text default 'to_try' check (status in ('favorite', 'to_try', 'made_before')),
  tags text[] default '{}',
  image_url text,
  is_public boolean default false,
  nutritional_info jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Recipe shares table
create table if not exists public.recipe_shares (
  id uuid default gen_random_uuid() primary key,
  recipe_id uuid references public.recipes(id) on delete cascade not null,
  shared_by uuid references auth.users(id) on delete cascade not null,
  shared_with uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(recipe_id, shared_with)
);

-- Meal plans table
create table if not exists public.meal_plans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  week_start date not null,
  meals jsonb not null default '{}',
  created_at timestamptz default now()
);

-- Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_shares enable row level security;
alter table public.meal_plans enable row level security;

-- Profiles policies
create policy "Users can view all profiles" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Recipes policies
create policy "Users can view own recipes" on public.recipes for select using (auth.uid() = user_id or is_public = true);
create policy "Users can insert own recipes" on public.recipes for insert with check (auth.uid() = user_id);
create policy "Users can update own recipes" on public.recipes for update using (auth.uid() = user_id);
create policy "Users can delete own recipes" on public.recipes for delete using (auth.uid() = user_id);

-- Recipe shares policies
create policy "Users can view shares" on public.recipe_shares for select using (auth.uid() = shared_by or auth.uid() = shared_with);
create policy "Users can create shares" on public.recipe_shares for insert with check (auth.uid() = shared_by);
create policy "Users can delete own shares" on public.recipe_shares for delete using (auth.uid() = shared_by);

-- Meal plans policies
create policy "Users can view own meal plans" on public.meal_plans for select using (auth.uid() = user_id);
create policy "Users can insert own meal plans" on public.meal_plans for insert with check (auth.uid() = user_id);
create policy "Users can update own meal plans" on public.meal_plans for update using (auth.uid() = user_id);
create policy "Users can delete own meal plans" on public.meal_plans for delete using (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, username)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    split_part(new.email, '@', 1)
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
