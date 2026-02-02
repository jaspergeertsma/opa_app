
-- 1. Create notification_logs
create table public.notification_logs (
  id uuid default gen_random_uuid() primary key,
  volunteer_id uuid references public.volunteers(id),
  schedule_date_id uuid references public.schedule_dates(id),
  sent_at timestamptz not null default now(),
  to_email text not null,
  subject text not null,
  body_text text not null,
  status text check (status in ('sent', 'failed', 'skipped')) not null,
  provider_message_id text,
  error text
);

create index idx_notification_logs_volunteer_sent on public.notification_logs(volunteer_id, sent_at desc);

-- RLS
alter table public.notification_logs enable row level security;

create policy "Admin can do everything on notification_logs" on public.notification_logs
  for all using (is_admin());

-- 2. Ensure app_settings contains default templates if not exists
-- (Upsert logic to ensure keys exist)
insert into public.app_settings (key, value) values 
  ('admin_name', 'Oud Papier Team'),
  ('cc_email_1', ''),
  ('cc_email_2', ''),
  ('subject_template', 'Oud papier – planning voor zaterdag {DATE}'),
  ('text_template', 'Hallo {SALUTATION},\n\nJouw rol: {ROLE}\nTijd: {TIME_START} - {TIME_END}\n\nTot zaterdag!'),
  ('timezone', 'Europe/Amsterdam')
on conflict (key) do nothing;
