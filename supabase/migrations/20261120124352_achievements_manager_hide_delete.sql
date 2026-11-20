-- Add manager-only hiding and authenticated full deletion for school achievements.
alter table public.sa_achievements
  add column if not exists manager_hidden boolean not null default false,
  add column if not exists manager_hidden_by text,
  add column if not exists manager_hidden_at timestamptz;

create or replace function public.sa_achievements_manager_hide(
  p_username text,
  p_password text,
  p_id text,
  p_hidden boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user public.sa_users;
  v_row public.sa_achievements;
begin
  v_user := public.sa_achievements_auth(p_username, p_password);
  if v_user.role <> 'admin' then
    raise exception 'پنهان‌کردن از فهرست فقط در اختیار مدیر است';
  end if;

  update public.sa_achievements
  set manager_hidden = coalesce(p_hidden, true),
      manager_hidden_by = case when coalesce(p_hidden, true) then coalesce(v_user.full_name, v_user.username) else null end,
      manager_hidden_at = case when coalesce(p_hidden, true) then now() else null end,
      updated_at = now()
  where id = p_id
  returning * into v_row;

  if v_row.id is null then
    raise exception 'درخواست تشویق یافت نشد';
  end if;
  return to_jsonb(v_row);
end;
$function$;

create or replace function public.sa_achievements_delete(
  p_username text,
  p_password text,
  p_id text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user public.sa_users;
  v_row public.sa_achievements;
begin
  v_user := public.sa_achievements_auth(p_username, p_password);
  if v_user.role <> 'admin' then
    raise exception 'حذف کامل تشویق فقط در اختیار مدیر است';
  end if;

  delete from public.sa_achievements
  where id = p_id
  returning * into v_row;

  if v_row.id is null then
    raise exception 'درخواست تشویق یافت نشد';
  end if;

  return jsonb_build_object(
    'deleted', true,
    'id', v_row.id,
    'student_id', v_row.student_id,
    'class_id', v_row.class_id
  );
end;
$function$;

revoke execute on function public.sa_achievements_manager_hide(text, text, text, boolean) from public, authenticated;
revoke execute on function public.sa_achievements_delete(text, text, text) from public, authenticated;
grant execute on function public.sa_achievements_manager_hide(text, text, text, boolean) to anon;
grant execute on function public.sa_achievements_delete(text, text, text) to anon;
