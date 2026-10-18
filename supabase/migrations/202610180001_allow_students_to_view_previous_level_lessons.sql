-- Let promoted students access earlier-level lessons from their own department.
-- The student portal separates these rows into the Past lessons tab.
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
        or (
          target_level = '100'
          and (
            select p.academic_level from public.profiles as p where p.id = (select auth.uid())
          ) = '200'
        )
      )
    )
  );
