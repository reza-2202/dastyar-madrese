-- Class-wide homework assignments and per-student feedback, separate from individual guidance tasks.
create table if not exists public.sa_class_homework (
  id uuid primary key default gen_random_uuid(),
  class_id text not null,
  class_name text not null default '',
  title text not null default 'تکالیف امروز کلاس',
  items jsonb not null default '[]'::jsonb,
  assigned_by text not null default '',
  assigned_username text not null default '',
  assigned_at timestamptz not null default now(),
  due_date date not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sa_class_homework_items_array check (jsonb_typeof(items) = 'array')
);
create index if not exists sa_class_homework_class_due_idx on public.sa_class_homework (class_id, due_date desc, assigned_at desc);
create index if not exists sa_class_homework_assigned_idx on public.sa_class_homework (assigned_at desc);

create table if not exists public.sa_class_homework_feedback (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.sa_class_homework(id) on delete restrict,
  class_id text not null,
  student_id text not null,
  status text not null check (status in ('done','partial','not_done')),
  comment text not null default '',
  teacher_username text not null default '',
  teacher_name text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists sa_class_homework_feedback_task_idx on public.sa_class_homework_feedback (task_id, student_id, created_at desc);
create index if not exists sa_class_homework_feedback_class_idx on public.sa_class_homework_feedback (class_id, created_at desc);

alter table public.sa_class_homework enable row level security;
alter table public.sa_class_homework_feedback enable row level security;
revoke all privileges on table public.sa_class_homework from public, anon, authenticated;
grant select, insert, update on public.sa_class_homework to anon, authenticated;
drop policy if exists sa_class_homework_read on public.sa_class_homework;
drop policy if exists sa_class_homework_insert on public.sa_class_homework;
drop policy if exists sa_class_homework_update on public.sa_class_homework;
create policy sa_class_homework_read on public.sa_class_homework for select to anon, authenticated using (true);
create policy sa_class_homework_insert on public.sa_class_homework for insert to anon, authenticated with check (true);
create policy sa_class_homework_update on public.sa_class_homework for update to anon, authenticated using (true) with check (true);

revoke all privileges on table public.sa_class_homework_feedback from public, anon, authenticated;
grant select, insert on public.sa_class_homework_feedback to anon, authenticated;
drop policy if exists sa_class_homework_feedback_read on public.sa_class_homework_feedback;
drop policy if exists sa_class_homework_feedback_insert on public.sa_class_homework_feedback;
create policy sa_class_homework_feedback_read on public.sa_class_homework_feedback for select to anon, authenticated using (true);
create policy sa_class_homework_feedback_insert on public.sa_class_homework_feedback for insert to anon, authenticated with check (true);
