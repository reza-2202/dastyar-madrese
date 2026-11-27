create table if not exists public.sa_homework_tasks (
  id uuid primary key default gen_random_uuid(),
  guidance_id text not null unique,
  student_id text not null,
  class_id text not null,
  source_type text,
  source_id text,
  subject text,
  homework text not null,
  guidance text,
  duration text,
  assigned_by text,
  assigned_role text,
  assigned_at timestamptz not null default now(),
  due_date date not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sa_homework_tasks_class_due_idx
  on public.sa_homework_tasks (class_id, due_date, active);
create index if not exists sa_homework_tasks_student_idx
  on public.sa_homework_tasks (student_id, assigned_at desc);

create table if not exists public.sa_homework_feedback (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.sa_homework_tasks(id) on delete restrict,
  student_id text not null,
  class_id text not null,
  status text not null check (status in ('done','partial','not_done')),
  comment text not null default '',
  next_step text not null default '',
  teacher_username text,
  teacher_name text,
  created_at timestamptz not null default now()
);

create index if not exists sa_homework_feedback_task_idx
  on public.sa_homework_feedback (task_id, created_at desc);
create index if not exists sa_homework_feedback_student_idx
  on public.sa_homework_feedback (student_id, created_at desc);

alter table public.sa_homework_tasks enable row level security;
alter table public.sa_homework_feedback enable row level security;

drop policy if exists sa_homework_tasks_app_access on public.sa_homework_tasks;
create policy sa_homework_tasks_app_access on public.sa_homework_tasks
  for all to anon, authenticated using (true) with check (true);

drop policy if exists sa_homework_feedback_app_access on public.sa_homework_feedback;
create policy sa_homework_feedback_app_access on public.sa_homework_feedback
  for all to anon, authenticated using (true) with check (true);

grant select, insert, update on public.sa_homework_tasks to anon, authenticated;
grant select, insert on public.sa_homework_feedback to anon, authenticated;

create or replace function public.sa_sync_homework_task_from_guidance()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_homework text := btrim(coalesce(new.homework, ''));
begin
  if tg_op = 'UPDATE' and v_homework = '' then
    update public.sa_homework_tasks
       set active = false, updated_at = now()
     where guidance_id = new.id and active = true;
    return new;
  end if;

  if v_homework <> '' then
    insert into public.sa_homework_tasks (
      guidance_id, student_id, class_id, source_type, source_id,
      subject, homework, guidance, duration, assigned_by, assigned_role,
      assigned_at, due_date, active, updated_at
    )
    values (
      new.id, new.student_id, new.class_id, new.source_type, new.source_id,
      new.subject, v_homework, coalesce(new.guidance, ''), coalesce(new.duration, ''),
      coalesce(new.created_by, ''), coalesce(new.created_role, ''),
      coalesce(new.created_at, now()),
      (coalesce(new.created_at, now()) at time zone 'Asia/Tehran')::date + 1,
      true, now()
    )
    on conflict (guidance_id) do update set
      student_id = excluded.student_id,
      class_id = excluded.class_id,
      source_type = excluded.source_type,
      source_id = excluded.source_id,
      subject = excluded.subject,
      homework = excluded.homework,
      guidance = excluded.guidance,
      duration = excluded.duration,
      assigned_by = excluded.assigned_by,
      assigned_role = excluded.assigned_role,
      active = true,
      updated_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists sa_student_guidance_homework_sync on public.sa_student_guidance;
create trigger sa_student_guidance_homework_sync
after insert or update on public.sa_student_guidance
for each row execute function public.sa_sync_homework_task_from_guidance();

insert into public.sa_homework_tasks (
  guidance_id, student_id, class_id, source_type, source_id,
  subject, homework, guidance, duration, assigned_by, assigned_role,
  assigned_at, due_date, active
)
select
  g.id, g.student_id, g.class_id, g.source_type, g.source_id,
  g.subject, btrim(g.homework), coalesce(g.guidance, ''), coalesce(g.duration, ''),
  coalesce(g.created_by, ''), coalesce(g.created_role, ''),
  coalesce(g.created_at, now()),
  (coalesce(g.created_at, now()) at time zone 'Asia/Tehran')::date + 1,
  true
from public.sa_student_guidance g
where nullif(btrim(coalesce(g.homework, '')), '') is not null
on conflict (guidance_id) do nothing;
