create extension if not exists pgcrypto;
create sequence if not exists public.mitc_student_id_seq start with 24019;

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(trim(name)) > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null unique,
  student_id text unique default ('MITC-' || nextval('public.mitc_student_id_seq')),
  role text not null default 'student' check (role in ('admin', 'student')),
  department_id uuid references public.departments (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) > 0),
  notes text not null default '',
  video_url text not null,
  department_id uuid not null references public.departments (id) on delete restrict,
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now()
);

create index if not exists profiles_department_id_idx on public.profiles (department_id);
create index if not exists lessons_department_created_idx on public.lessons (department_id, created_at desc);

insert into public.departments (name) values
  ('Web Design'),
  ('Software Engineering'),
  ('Hardware Repair and Maintenance'),
  ('Plumbing'),
  ('Electrical'),
  ('Building')
on conflict (name) do nothing;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email, student_id, department_id, role)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)),
    new.email,
    nullif(trim(new.raw_user_meta_data ->> 'student_id'), ''),
    nullif(new.raw_user_meta_data ->> 'department_id', '')::uuid,
    'student'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_mitc on auth.users;
create trigger on_auth_user_created_mitc
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();

alter table public.departments enable row level security;
alter table public.profiles enable row level security;
alter table public.lessons enable row level security;

revoke all on public.departments, public.profiles, public.lessons from anon;
grant select, insert, update, delete on public.departments, public.profiles, public.lessons to authenticated;

drop policy if exists "Signed-in users can read departments" on public.departments;
create policy "Signed-in users can read departments"
  on public.departments for select to authenticated
  using ((select auth.uid()) is not null);

drop policy if exists "Admins manage departments" on public.departments;
create policy "Admins manage departments"
  on public.departments for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Students and admins read permitted profiles" on public.profiles;
create policy "Students and admins read permitted profiles"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "Admins manage profiles" on public.profiles;
create policy "Admins manage profiles"
  on public.profiles for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Read lessons for own department" on public.lessons;
create policy "Read lessons for own department"
  on public.lessons for select to authenticated
  using (
    (select public.is_admin())
    or department_id = (
      select p.department_id from public.profiles as p where p.id = (select auth.uid())
    )
  );

drop policy if exists "Admins manage lessons" on public.lessons;
create policy "Admins manage lessons"
  on public.lessons for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()) and created_by = (select auth.uid()));
