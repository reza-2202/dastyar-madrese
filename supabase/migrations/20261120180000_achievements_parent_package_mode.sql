create or replace function public.get_parent_portal_package_mode(
  p_class_id text,
  p_username text,
  p_password text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_mode text;
begin
  if not public.dastyar_parent_portal_authorized(p_class_id, p_username, p_password) then
    raise exception 'اجازه بررسی وضعیت پرونده اولیا برای این کلاس را ندارید.' using errcode = '42501';
  end if;

  select p.package->>'login_mode'
    into v_mode
    from public.sa_parent_portal_packages p
   where p.class_id = p_class_id
     and p.enabled = true
     and (p.expires_at is null or p.expires_at > now())
   limit 1;

  if not found then
    return jsonb_build_object('exists', false, 'reason', 'no_active_package');
  end if;

  return jsonb_build_object('exists', true, 'login_mode', v_mode);
end;
$function$;

revoke execute on function public.get_parent_portal_package_mode(text, text, text) from public, authenticated;
grant execute on function public.get_parent_portal_package_mode(text, text, text) to anon;