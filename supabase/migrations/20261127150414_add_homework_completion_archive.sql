alter table public.sa_homework_tasks
  add column if not exists completed_at timestamptz,
  add column if not exists completed_by text,
  add column if not exists completed_role text;

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
      active = public.sa_homework_tasks.active,
      completed_at = public.sa_homework_tasks.completed_at,
      completed_by = public.sa_homework_tasks.completed_by,
      completed_role = public.sa_homework_tasks.completed_role,
      updated_at = now();
  end if;
  return new;
end;
$$;
