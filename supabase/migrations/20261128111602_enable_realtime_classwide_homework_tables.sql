do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'sa_class_homework'
  ) then
    alter publication supabase_realtime add table public.sa_class_homework;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'sa_class_homework_feedback'
  ) then
    alter publication supabase_realtime add table public.sa_class_homework_feedback;
  end if;
end $$;
