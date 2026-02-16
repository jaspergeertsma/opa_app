
-- Drop existing specific policies
drop policy if exists "Admin can view settings" on public.app_settings;
drop policy if exists "Admin can update settings" on public.app_settings;

-- Create a single "ALL" policy for admins
-- This covers SELECT, INSERT, UPDATE, and DELETE
create policy "Admin can do everything on app_settings" on public.app_settings
  for all using (is_admin());
