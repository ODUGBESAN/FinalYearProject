alter table public.profiles
  add column if not exists academic_level text
  check (academic_level is null or academic_level in ('100', '200'));

alter table public.lessons
  add column if not exists target_level text
  check (target_level is null or target_level in ('100', '200'));

create index if not exists lessons_department_level_created_idx
  on public.lessons (department_id, target_level, created_at desc);

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email, student_id, department_id, academic_level, role)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)),
    new.email,
    nullif(trim(new.raw_user_meta_data ->> 'student_id'), ''),
    nullif(new.raw_user_meta_data ->> 'department_id', '')::uuid,
    nullif(new.raw_user_meta_data ->> 'academic_level', ''),
    'student'
  );
  return new;
end;
$$;

drop policy if exists "Read lessons for own department" on public.lessons;
drop policy if exists "Read lessons for own department and level" on public.lessons;
create policy "Read lessons for own department and level"
  on public.lessons for select to authenticated
  using (
    (select public.is_admin())
    or (
      department_id = (
        select p.department_id from public.profiles as p where p.id = (select auth.uid())
      )
      and (
        target_level is null
        or target_level = (
          select p.academic_level from public.profiles as p where p.id = (select auth.uid())
        )
      )
    )
  );
