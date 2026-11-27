revoke all privileges on table public.sa_homework_tasks from public, anon, authenticated;
grant select, insert, update on public.sa_homework_tasks to anon, authenticated;

drop policy if exists sa_homework_tasks_app_access on public.sa_homework_tasks;
drop policy if exists sa_homework_tasks_read on public.sa_homework_tasks;
drop policy if exists sa_homework_tasks_insert on public.sa_homework_tasks;
drop policy if exists sa_homework_tasks_update on public.sa_homework_tasks;
create policy sa_homework_tasks_read on public.sa_homework_tasks
  for select to anon, authenticated using (true);
create policy sa_homework_tasks_insert on public.sa_homework_tasks
  for insert to anon, authenticated with check (true);
create policy sa_homework_tasks_update on public.sa_homework_tasks
  for update to anon, authenticated using (true) with check (true);

revoke all privileges on table public.sa_homework_feedback from public, anon, authenticated;
grant select, insert on public.sa_homework_feedback to anon, authenticated;

drop policy if exists sa_homework_feedback_app_access on public.sa_homework_feedback;
drop policy if exists sa_homework_feedback_read on public.sa_homework_feedback;
drop policy if exists sa_homework_feedback_insert on public.sa_homework_feedback;
create policy sa_homework_feedback_read on public.sa_homework_feedback
  for select to anon, authenticated using (true);
create policy sa_homework_feedback_insert on public.sa_homework_feedback
  for insert to anon, authenticated with check (true);
