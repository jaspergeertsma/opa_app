
-- Enable RLS
alter table if exists public.volunteers enable row level security;
alter table if exists public.schedules enable row level security;
alter table if exists public.schedule_dates enable row level security;
alter table if exists public.assignments enable row level security;

-- Create tables
create table public.app_settings (
  key text primary key,
  value text not null
);

insert into public.app_settings (key, value) values ('admin_email', 'change_me@example.com') on conflict do nothing;

create table public.volunteers (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text not null,
  notes text,
  allow_double boolean default false,
  active boolean default true,
  created_at timestamptz default now()
);

create table public.schedules (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  year int not null,
  is_active boolean default false,
  created_at timestamptz default now()
);

create table public.schedule_dates (
  id uuid default gen_random_uuid() primary key,
  schedule_id uuid references public.schedules(id) on delete cascade not null,
  date date not null,
  reminder_sent_at timestamptz
);

create table public.assignments (
  id uuid default gen_random_uuid() primary key,
  schedule_date_id uuid references public.schedule_dates(id) on delete cascade not null,
  role text check (role in ('V1', 'V2', 'L1', 'L2', 'R1', 'R2')),
  volunteer_id uuid references public.volunteers(id) on delete set null
);

-- Policies
-- We create a helper function to check admin status to keep policies clean
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.app_settings 
    where key = 'admin_email' 
    and value = auth.email()
  );
$$ language sql security definer;

-- Volunteers
create policy "Admin can do everything on volunteers" on public.volunteers
  for all using (is_admin());

-- Schedules
create policy "Admin can do everything on schedules" on public.schedules
  for all using (is_admin());

-- Schedule Dates
create policy "Admin can do everything on schedule_dates" on public.schedule_dates
  for all using (is_admin());

-- Assignments
create policy "Admin can do everything on assignments" on public.assignments
  for all using (is_admin());

-- App Settings
create policy "Admin can view settings" on public.app_settings
  for select using (is_admin());

-- Allow anyone to read settings? No, only admin. But logic needs to read it for is_admin check? 
-- The is_admin function is security definer, so it bypasses RLS on app_settings.
-- But to update the admin email via UI, we need a policy.
create policy "Admin can update settings" on public.app_settings
  for update using (is_admin());
