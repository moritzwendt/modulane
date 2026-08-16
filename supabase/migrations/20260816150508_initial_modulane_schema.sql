
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null,
  handle text not null unique,
  initials text not null,
  color text not null default '#5f6f7a',
  job_title text not null default '',
  last_active_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  visibility text not null default 'Nur auf Einladung' check (visibility in ('Nur auf Einladung', 'Offen für die Organisation')),
  allow_member_invites boolean not null default false,
  email_notifications boolean not null default true,
  weekly_digest boolean not null default true,
  default_project_status text not null default 'Geplant' check (default_project_status in ('Geplant', 'Aktiv', 'Pausiert', 'Abgeschlossen')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'Mitglied' check (role in ('Eigentümer', 'Administrator', 'Mitglied', 'Gast')),
  joined_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create index workspace_members_user_id_idx on public.workspace_members(user_id);

create table public.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null,
  name text not null,
  role text not null default 'Mitglied' check (role in ('Administrator', 'Mitglied', 'Gast')),
  job_title text not null default '',
  invited_by uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'Ausstehend' check (status in ('Ausstehend', 'Angenommen', 'Abgelaufen')),
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  unique (workspace_id, email)
);

create index workspace_invitations_workspace_status_idx on public.workspace_invitations(workspace_id, status);
create index workspace_invitations_invited_by_idx on public.workspace_invitations(invited_by);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  description text not null default '',
  type text not null,
  platforms text[] not null default '{}',
  status text not null default 'Geplant' check (status in ('Geplant', 'Aktiv', 'Pausiert', 'Abgeschlossen')),
  color text not null default '#6f6f82',
  icon text not null,
  visibility text not null default 'Workspace' check (visibility in ('Workspace', 'Privat')),
  feature_prefix text not null,
  repository_name text not null default '',
  auto_archive_done boolean not null default false,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_workspace_id_idx on public.projects(workspace_id);
create index projects_created_by_idx on public.projects(created_by);

create table public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create index project_members_user_id_idx on public.project_members(user_id);

create table public.app_parts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  key text not null,
  name text not null,
  description text not null default '',
  platform text not null default 'Allgemein',
  release_state text not null default 'Frei' check (release_state in ('Frei', 'In Entwicklung', 'Instabil', 'Stabil', 'Production Ready')),
  owner_user_id uuid references public.profiles(id) on delete set null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, key)
);

create index app_parts_project_id_idx on public.app_parts(project_id);
create index app_parts_owner_user_id_idx on public.app_parts(owner_user_id);
create index app_parts_created_by_idx on public.app_parts(created_by);

create table public.app_part_active_users (
  app_part_id uuid not null references public.app_parts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  started_at timestamptz not null default now(),
  primary key (app_part_id, user_id)
);

create index app_part_active_users_user_id_idx on public.app_part_active_users(user_id);

create table public.app_part_commits (
  id uuid primary key default gen_random_uuid(),
  app_part_id uuid not null references public.app_parts(id) on delete cascade,
  hash text not null,
  message text not null,
  branch text not null,
  author_id uuid not null references public.profiles(id),
  url text not null default '',
  created_at timestamptz not null default now()
);

create index app_part_commits_app_part_id_created_at_idx on public.app_part_commits(app_part_id, created_at desc);
create index app_part_commits_author_id_idx on public.app_part_commits(author_id);

create table public.features (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  app_part_id uuid references public.app_parts(id) on delete set null,
  key text not null,
  title text not null,
  description text not null default '',
  status text not null default 'Geplant' check (status in ('Idee', 'Geplant', 'Bereit', 'In Arbeit', 'Im Review', 'Blockiert', 'Fertig')),
  priority text not null default 'Normal' check (priority in ('Dringend', 'Hoch', 'Normal', 'Niedrig', 'Keine')),
  health text not null default 'Im Plan' check (health in ('Im Plan', 'Gefährdet', 'Blockiert')),
  start_date date,
  target_date date,
  estimate text not null default 'Noch offen',
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, key)
);

create index features_project_id_idx on public.features(project_id);
create index features_app_part_id_idx on public.features(app_part_id);
create index features_created_by_idx on public.features(created_by);

create table public.feature_members (
  feature_id uuid not null references public.features(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'Beteiligte' check (role in ('Lead', 'Beteiligte', 'Review')),
  added_at timestamptz not null default now(),
  primary key (feature_id, user_id)
);

create index feature_members_user_id_idx on public.feature_members(user_id);

create table public.requirements (
  id uuid primary key default gen_random_uuid(),
  feature_id uuid not null references public.features(id) on delete cascade,
  title text not null,
  completed boolean not null default false,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create index requirements_feature_id_idx on public.requirements(feature_id);
create index requirements_created_by_idx on public.requirements(created_by);

create table public.feature_updates (
  id uuid primary key default gen_random_uuid(),
  feature_id uuid not null references public.features(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  message text not null,
  health text not null check (health in ('Im Plan', 'Gefährdet', 'Blockiert')),
  created_at timestamptz not null default now()
);

create index feature_updates_feature_id_created_at_idx on public.feature_updates(feature_id, created_at desc);
create index feature_updates_author_id_idx on public.feature_updates(author_id);

create or replace function private.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = target_workspace_id
      and user_id = (select auth.uid())
  )
$$;

create or replace function private.can_write_workspace(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = target_workspace_id
      and user_id = (select auth.uid())
      and role in ('Eigentümer', 'Administrator', 'Mitglied')
  )
$$;

create or replace function private.can_manage_workspace(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = target_workspace_id
      and user_id = (select auth.uid())
      and role in ('Eigentümer', 'Administrator')
  )
$$;

create or replace function private.shares_workspace(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members mine
    join public.workspace_members theirs on theirs.workspace_id = mine.workspace_id
    where mine.user_id = (select auth.uid())
      and theirs.user_id = target_user_id
  )
$$;

create or replace function private.can_access_project(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.projects p
    join public.workspace_members wm on wm.workspace_id = p.workspace_id
    where p.id = target_project_id
      and wm.user_id = (select auth.uid())
      and (
        p.visibility = 'Workspace'
        or exists (
          select 1 from public.project_members pm
          where pm.project_id = p.id and pm.user_id = (select auth.uid())
        )
      )
  )
$$;

create or replace function private.can_write_project(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.projects p
    join public.workspace_members wm on wm.workspace_id = p.workspace_id
    where p.id = target_project_id
      and wm.user_id = (select auth.uid())
      and wm.role in ('Eigentümer', 'Administrator', 'Mitglied')
      and (
        p.visibility = 'Workspace'
        or exists (
          select 1 from public.project_members pm
          where pm.project_id = p.id and pm.user_id = (select auth.uid())
        )
      )
  )
$$;

create or replace function private.can_access_feature(target_feature_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.can_access_project(project_id)
  from public.features
  where id = target_feature_id
$$;

create or replace function private.can_write_feature(target_feature_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.can_write_project(project_id)
  from public.features
  where id = target_feature_id
$$;

create or replace function private.can_access_app_part(target_app_part_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.can_access_project(project_id)
  from public.app_parts
  where id = target_app_part_id
$$;

create or replace function private.can_write_app_part(target_app_part_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.can_write_project(project_id)
  from public.app_parts
  where id = target_app_part_id
$$;

revoke all on all functions in schema private from public, anon;
grant usage on schema private to authenticated;
grant execute on all functions in schema private to authenticated;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end
$$;

create trigger profiles_set_updated_at before update on public.profiles for each row execute function private.set_updated_at();
create trigger workspaces_set_updated_at before update on public.workspaces for each row execute function private.set_updated_at();
create trigger projects_set_updated_at before update on public.projects for each row execute function private.set_updated_at();
create trigger app_parts_set_updated_at before update on public.app_parts for each row execute function private.set_updated_at();
create trigger features_set_updated_at before update on public.features for each row execute function private.set_updated_at();

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  display_name text;
  workspace_name text;
  workspace_id uuid;
  member_role text;
begin
  display_name := coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1));
  insert into public.profiles (id, email, name, handle, initials, job_title)
  values (
    new.id,
    lower(new.email),
    display_name,
    lower(regexp_replace(split_part(new.email, '@', 1), '[^a-zA-Z0-9]', '', 'g')) || '_' || left(new.id::text, 6),
    upper(left(split_part(display_name, ' ', 1), 1) || left(coalesce(nullif(split_part(display_name, ' ', 2), ''), split_part(display_name, ' ', 1)), 1)),
    coalesce(new.raw_user_meta_data ->> 'job_title', '')
  );

  if nullif(new.raw_user_meta_data ->> 'invited_workspace_id', '') is not null then
    workspace_id := (new.raw_user_meta_data ->> 'invited_workspace_id')::uuid;
    member_role := case
      when new.raw_user_meta_data ->> 'workspace_role' in ('Administrator', 'Mitglied', 'Gast') then new.raw_user_meta_data ->> 'workspace_role'
      else 'Mitglied'
    end;
    insert into public.workspace_members (workspace_id, user_id, role)
    values (workspace_id, new.id, member_role)
    on conflict (workspace_id, user_id) do update set role = excluded.role;
    update public.workspace_invitations
    set status = 'Angenommen', accepted_at = now()
    where workspace_invitations.workspace_id = handle_new_user.workspace_id
      and lower(email) = lower(new.email);
  else
    workspace_name := coalesce(nullif(trim(new.raw_user_meta_data ->> 'workspace_name'), ''), display_name || ' Workspace');
    insert into public.workspaces (name, slug)
    values (
      workspace_name,
      lower(regexp_replace(workspace_name, '[^a-zA-Z0-9]+', '_', 'g')) || '_' || left(new.id::text, 6)
    )
    returning id into workspace_id;
    insert into public.workspace_members (workspace_id, user_id, role)
    values (workspace_id, new.id, 'Eigentümer');
  end if;

  return new;
end
$$;

create or replace function private.sync_user_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = lower(new.email) where id = new.id;
  end if;
  return new;
end
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;
revoke all on function private.sync_user_email() from public, anon, authenticated;

create trigger on_auth_user_created after insert on auth.users for each row execute function private.handle_new_user();
create trigger on_auth_user_email_updated after update of email on auth.users for each row execute function private.sync_user_email();

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.workspace_invitations enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.app_parts enable row level security;
alter table public.app_part_active_users enable row level security;
alter table public.app_part_commits enable row level security;
alter table public.features enable row level security;
alter table public.feature_members enable row level security;
alter table public.requirements enable row level security;
alter table public.feature_updates enable row level security;

create policy profiles_select on public.profiles for select to authenticated using (id = (select auth.uid()) or private.shares_workspace(id));
create policy profiles_update on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy workspaces_select on public.workspaces for select to authenticated using (private.is_workspace_member(id));
create policy workspaces_update on public.workspaces for update to authenticated using (private.can_manage_workspace(id)) with check (private.can_manage_workspace(id));

create policy workspace_members_select on public.workspace_members for select to authenticated using (private.is_workspace_member(workspace_id));
create policy workspace_members_update on public.workspace_members for update to authenticated using (private.can_manage_workspace(workspace_id)) with check (private.can_manage_workspace(workspace_id));
create policy workspace_members_delete on public.workspace_members for delete to authenticated using (private.can_manage_workspace(workspace_id) and user_id <> (select auth.uid()));

create policy workspace_invitations_select on public.workspace_invitations for select to authenticated using (private.can_manage_workspace(workspace_id));
create policy workspace_invitations_insert on public.workspace_invitations for insert to authenticated with check (private.can_manage_workspace(workspace_id) or (private.can_write_workspace(workspace_id) and (select allow_member_invites from public.workspaces where id = workspace_id)));
create policy workspace_invitations_update on public.workspace_invitations for update to authenticated using (private.can_manage_workspace(workspace_id)) with check (private.can_manage_workspace(workspace_id));
create policy workspace_invitations_delete on public.workspace_invitations for delete to authenticated using (private.can_manage_workspace(workspace_id));

create policy projects_select on public.projects for select to authenticated using (private.can_access_project(id));
create policy projects_insert on public.projects for insert to authenticated with check (private.can_write_workspace(workspace_id) and created_by = (select auth.uid()));
create policy projects_update on public.projects for update to authenticated using (private.can_write_project(id)) with check (private.can_write_workspace(workspace_id));
create policy projects_delete on public.projects for delete to authenticated using (private.can_write_project(id));

create policy project_members_select on public.project_members for select to authenticated using (private.can_access_project(project_id));
create policy project_members_insert on public.project_members for insert to authenticated with check (private.can_write_project(project_id));
create policy project_members_delete on public.project_members for delete to authenticated using (private.can_write_project(project_id));

create policy app_parts_select on public.app_parts for select to authenticated using (private.can_access_project(project_id));
create policy app_parts_insert on public.app_parts for insert to authenticated with check (private.can_write_project(project_id) and created_by = (select auth.uid()));
create policy app_parts_update on public.app_parts for update to authenticated using (private.can_write_project(project_id)) with check (private.can_write_project(project_id));
create policy app_parts_delete on public.app_parts for delete to authenticated using (private.can_write_project(project_id));

create policy app_part_active_users_select on public.app_part_active_users for select to authenticated using (private.can_access_app_part(app_part_id));
create policy app_part_active_users_insert on public.app_part_active_users for insert to authenticated with check (private.can_write_app_part(app_part_id));
create policy app_part_active_users_delete on public.app_part_active_users for delete to authenticated using (private.can_write_app_part(app_part_id));

create policy app_part_commits_select on public.app_part_commits for select to authenticated using (private.can_access_app_part(app_part_id));
create policy app_part_commits_insert on public.app_part_commits for insert to authenticated with check (private.can_write_app_part(app_part_id) and author_id = (select auth.uid()));
create policy app_part_commits_update on public.app_part_commits for update to authenticated using (private.can_write_app_part(app_part_id)) with check (private.can_write_app_part(app_part_id));
create policy app_part_commits_delete on public.app_part_commits for delete to authenticated using (private.can_write_app_part(app_part_id));

create policy features_select on public.features for select to authenticated using (private.can_access_project(project_id));
create policy features_insert on public.features for insert to authenticated with check (private.can_write_project(project_id) and created_by = (select auth.uid()));
create policy features_update on public.features for update to authenticated using (private.can_write_project(project_id)) with check (private.can_write_project(project_id));
create policy features_delete on public.features for delete to authenticated using (private.can_write_project(project_id));

create policy feature_members_select on public.feature_members for select to authenticated using (private.can_access_feature(feature_id));
create policy feature_members_insert on public.feature_members for insert to authenticated with check (private.can_write_feature(feature_id));
create policy feature_members_update on public.feature_members for update to authenticated using (private.can_write_feature(feature_id)) with check (private.can_write_feature(feature_id));
create policy feature_members_delete on public.feature_members for delete to authenticated using (private.can_write_feature(feature_id));

create policy requirements_select on public.requirements for select to authenticated using (private.can_access_feature(feature_id));
create policy requirements_insert on public.requirements for insert to authenticated with check (private.can_write_feature(feature_id) and created_by = (select auth.uid()));
create policy requirements_update on public.requirements for update to authenticated using (private.can_write_feature(feature_id)) with check (private.can_write_feature(feature_id));
create policy requirements_delete on public.requirements for delete to authenticated using (private.can_write_feature(feature_id));

create policy feature_updates_select on public.feature_updates for select to authenticated using (private.can_access_feature(feature_id));
create policy feature_updates_insert on public.feature_updates for insert to authenticated with check (private.can_write_feature(feature_id) and author_id = (select auth.uid()));
create policy feature_updates_update on public.feature_updates for update to authenticated using (private.can_write_feature(feature_id)) with check (private.can_write_feature(feature_id));
create policy feature_updates_delete on public.feature_updates for delete to authenticated using (private.can_write_feature(feature_id));

revoke all on all tables in schema public from anon;
grant select, insert, update, delete on all tables in schema public to authenticated;

