alter table public.workspace_members drop constraint if exists workspace_members_role_check;
alter table public.workspace_invitations drop constraint if exists workspace_invitations_role_check;
alter table public.workspace_join_codes drop constraint if exists workspace_join_codes_role_check;

alter table public.workspace_members alter column role drop default;
alter table public.workspace_invitations alter column role drop default;
alter table public.workspace_join_codes alter column role drop default;

update public.workspace_members
set role = case role
  when 'Eigentümer' then 'owner'
  when 'Administrator' then 'admin'
  when 'Mitglied' then 'member'
  when 'Gast' then 'guest'
  else role
end;

update public.workspace_invitations
set role = case role
  when 'Administrator' then 'admin'
  when 'Mitglied' then 'member'
  when 'Gast' then 'guest'
  else role
end;

update public.workspace_join_codes
set role = case role
  when 'Administrator' then 'admin'
  when 'Mitglied' then 'member'
  when 'Gast' then 'guest'
  else role
end;

alter table public.workspace_members alter column role set default 'member';
alter table public.workspace_invitations alter column role set default 'member';
alter table public.workspace_join_codes alter column role set default 'member';

alter table public.workspace_members add constraint workspace_members_role_check check (role in ('owner', 'admin', 'member', 'guest'));
alter table public.workspace_invitations add constraint workspace_invitations_role_check check (role in ('admin', 'member', 'guest'));
alter table public.workspace_join_codes add constraint workspace_join_codes_role_check check (role in ('admin', 'member', 'guest'));

create or replace function private.workspace_role(target_workspace_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $function$
  select role
  from public.workspace_members
  where workspace_id = target_workspace_id
    and user_id = (select auth.uid())
$function$;

create or replace function private.is_workspace_owner(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select coalesce(private.workspace_role(target_workspace_id) = 'owner', false)
$function$;

create or replace function private.can_write_workspace(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select coalesce(private.workspace_role(target_workspace_id) in ('owner', 'admin', 'member'), false)
$function$;

create or replace function private.can_manage_workspace(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select coalesce(private.workspace_role(target_workspace_id) in ('owner', 'admin'), false)
$function$;

create or replace function private.can_update_workspace(
  target_workspace_id uuid,
  next_visibility text,
  next_allow_member_invites boolean
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select case private.workspace_role(target_workspace_id)
    when 'owner' then true
    when 'admin' then exists (
      select 1
      from public.workspaces
      where id = target_workspace_id
        and visibility = next_visibility
        and allow_member_invites = next_allow_member_invites
    )
    else false
  end
$function$;

create or replace function private.can_access_project(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.projects p
    join public.workspace_members wm on wm.workspace_id = p.workspace_id
    where p.id = target_project_id
      and wm.user_id = (select auth.uid())
      and (
        wm.role in ('owner', 'admin')
        or wm.role = 'member' and (
          p.visibility = 'Workspace'
          or exists (
            select 1
            from public.project_members pm
            where pm.project_id = p.id
              and pm.user_id = (select auth.uid())
          )
        )
        or wm.role = 'guest' and exists (
          select 1
          from public.project_members pm
          where pm.project_id = p.id
            and pm.user_id = (select auth.uid())
        )
      )
  )
$function$;

create or replace function private.can_write_project(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.projects p
    join public.workspace_members wm on wm.workspace_id = p.workspace_id
    where p.id = target_project_id
      and wm.user_id = (select auth.uid())
      and (
        wm.role in ('owner', 'admin')
        or wm.role = 'member' and (
          p.visibility = 'Workspace'
          or exists (
            select 1
            from public.project_members pm
            where pm.project_id = p.id
              and pm.user_id = (select auth.uid())
          )
        )
        or wm.role = 'guest' and exists (
          select 1
          from public.project_members pm
          where pm.project_id = p.id
            and pm.user_id = (select auth.uid())
        )
      )
  )
$function$;

create or replace function private.can_manage_project(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.projects p
    join public.workspace_members wm on wm.workspace_id = p.workspace_id
    where p.id = target_project_id
      and wm.user_id = (select auth.uid())
      and wm.role in ('owner', 'admin')
  )
$function$;

create or replace function private.can_edit_app_part(target_app_part_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.app_parts ap
    join public.projects p on p.id = ap.project_id
    join public.workspace_members wm on wm.workspace_id = p.workspace_id
    where ap.id = target_app_part_id
      and wm.user_id = (select auth.uid())
      and wm.role in ('owner', 'admin', 'member')
      and (
        wm.role in ('owner', 'admin')
        or p.visibility = 'Workspace'
        or exists (
          select 1
          from public.project_members pm
          where pm.project_id = p.id
            and pm.user_id = (select auth.uid())
        )
      )
  )
$function$;

create or replace function private.can_view_workspace_member(target_workspace_id uuid, target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.workspace_members mine
    where mine.workspace_id = target_workspace_id
      and mine.user_id = (select auth.uid())
      and (
        mine.role <> 'guest'
        or target_user_id = (select auth.uid())
        or exists (
          select 1
          from public.projects p
          join public.project_members my_project on my_project.project_id = p.id
          join public.project_members their_project on their_project.project_id = p.id
          where p.workspace_id = target_workspace_id
            and my_project.user_id = (select auth.uid())
            and their_project.user_id = target_user_id
        )
      )
  )
$function$;

create or replace function private.can_view_profile(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select target_user_id = (select auth.uid()) or exists (
    select 1
    from public.workspace_members mine
    join public.workspace_members theirs on theirs.workspace_id = mine.workspace_id
    where mine.user_id = (select auth.uid())
      and theirs.user_id = target_user_id
      and (
        mine.role <> 'guest'
        or exists (
          select 1
          from public.projects p
          join public.project_members my_project on my_project.project_id = p.id
          join public.project_members their_project on their_project.project_id = p.id
          where p.workspace_id = mine.workspace_id
            and my_project.user_id = (select auth.uid())
            and their_project.user_id = target_user_id
        )
      )
  )
$function$;

create or replace function public.change_workspace_member_role(
  target_workspace_id uuid,
  target_user_id uuid,
  new_role text
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  actor_role text;
  target_role text;
  owner_count integer;
begin
  if new_role not in ('owner', 'admin', 'member', 'guest') then
    raise exception 'Diese Rolle ist ungültig.' using errcode = '22023';
  end if;

  select role into actor_role
  from public.workspace_members
  where workspace_id = target_workspace_id
    and user_id = (select auth.uid());

  select role into target_role
  from public.workspace_members
  where workspace_id = target_workspace_id
    and user_id = target_user_id;

  if actor_role is null or target_role is null then
    raise exception 'Die Mitgliedschaft wurde nicht gefunden.' using errcode = 'P0002';
  end if;

  if actor_role = 'admin' and (target_role not in ('member', 'guest') or new_role not in ('member', 'guest')) then
    raise exception 'Administratoren dürfen nur Mitglieder und Gäste verwalten.' using errcode = '42501';
  end if;

  if actor_role not in ('owner', 'admin') then
    raise exception 'Du darfst keine Rollen verwalten.' using errcode = '42501';
  end if;

  if target_role = 'owner' and new_role <> 'owner' then
    select count(*) into owner_count
    from public.workspace_members
    where workspace_id = target_workspace_id
      and role = 'owner';

    if owner_count <= 1 then
      raise exception 'Die Organisation benötigt mindestens einen Eigentümer.' using errcode = '23514';
    end if;
  end if;

  update public.workspace_members
  set role = new_role
  where workspace_id = target_workspace_id
    and user_id = target_user_id;
end
$function$;

create or replace function public.remove_workspace_member(
  target_workspace_id uuid,
  target_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  actor_role text;
  target_role text;
  owner_count integer;
begin
  if target_user_id = (select auth.uid()) then
    raise exception 'Du kannst dich nicht selbst über die Teamverwaltung entfernen.' using errcode = '42501';
  end if;

  select role into actor_role
  from public.workspace_members
  where workspace_id = target_workspace_id
    and user_id = (select auth.uid());

  select role into target_role
  from public.workspace_members
  where workspace_id = target_workspace_id
    and user_id = target_user_id;

  if actor_role = 'admin' and target_role not in ('member', 'guest') then
    raise exception 'Administratoren dürfen nur Mitglieder und Gäste entfernen.' using errcode = '42501';
  end if;

  if actor_role not in ('owner', 'admin') or target_role is null then
    raise exception 'Du darfst diese Person nicht entfernen.' using errcode = '42501';
  end if;

  if target_role = 'owner' then
    select count(*) into owner_count
    from public.workspace_members
    where workspace_id = target_workspace_id
      and role = 'owner';

    if owner_count <= 1 then
      raise exception 'Die Organisation benötigt mindestens einen Eigentümer.' using errcode = '23514';
    end if;
  end if;

  delete from public.workspace_members
  where workspace_id = target_workspace_id
    and user_id = target_user_id;
end
$function$;

revoke all on function public.change_workspace_member_role(uuid, uuid, text) from public, anon;
revoke all on function public.remove_workspace_member(uuid, uuid) from public, anon;
grant execute on function public.change_workspace_member_role(uuid, uuid, text) to authenticated;
grant execute on function public.remove_workspace_member(uuid, uuid) to authenticated;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated using ((select private.can_view_profile(id)));

drop policy if exists workspaces_update on public.workspaces;
create policy workspaces_update on public.workspaces for update to authenticated
using ((select private.can_manage_workspace(id)))
with check ((select private.can_update_workspace(id, visibility, allow_member_invites)));

drop policy if exists workspace_members_select on public.workspace_members;
drop policy if exists workspace_members_update on public.workspace_members;
drop policy if exists workspace_members_delete on public.workspace_members;
create policy workspace_members_select on public.workspace_members for select to authenticated using ((select private.can_view_workspace_member(workspace_id, user_id)));

drop policy if exists workspace_invitations_insert on public.workspace_invitations;

drop policy if exists projects_insert on public.projects;
drop policy if exists projects_update on public.projects;
drop policy if exists projects_delete on public.projects;
create policy projects_insert on public.projects for insert to authenticated with check ((select private.can_manage_workspace(workspace_id)) and created_by = (select auth.uid()));
create policy projects_update on public.projects for update to authenticated using ((select private.can_manage_project(id))) with check ((select private.can_manage_workspace(workspace_id)));
create policy projects_delete on public.projects for delete to authenticated using ((select private.can_manage_project(id)));

drop policy if exists project_members_insert on public.project_members;
drop policy if exists project_members_delete on public.project_members;
create policy project_members_insert on public.project_members for insert to authenticated with check ((select private.can_manage_project(project_id)));
create policy project_members_delete on public.project_members for delete to authenticated using ((select private.can_manage_project(project_id)));

drop policy if exists app_parts_insert on public.app_parts;
drop policy if exists app_parts_update on public.app_parts;
drop policy if exists app_parts_delete on public.app_parts;
create policy app_parts_insert on public.app_parts for insert to authenticated with check ((select private.can_write_project(project_id)) and (select private.workspace_role((select workspace_id from public.projects where id = project_id))) <> 'guest' and created_by = (select auth.uid()));
create policy app_parts_update on public.app_parts for update to authenticated using ((select private.can_edit_app_part(id))) with check ((select private.can_edit_app_part(id)));
create policy app_parts_delete on public.app_parts for delete to authenticated using ((select private.can_manage_project(project_id)));

drop policy if exists app_part_commits_update on public.app_part_commits;
drop policy if exists app_part_commits_delete on public.app_part_commits;
create policy app_part_commits_update on public.app_part_commits for update to authenticated using (author_id = (select auth.uid()) or (select private.can_manage_project((select project_id from public.app_parts where id = app_part_id)))) with check (author_id = (select auth.uid()) or (select private.can_manage_project((select project_id from public.app_parts where id = app_part_id))));
create policy app_part_commits_delete on public.app_part_commits for delete to authenticated using (author_id = (select auth.uid()) or (select private.can_manage_project((select project_id from public.app_parts where id = app_part_id))));

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  first_name_value text;
  last_name_value text;
  display_name text;
  invited_workspace_id uuid;
  member_role text;
begin
  first_name_value := coalesce(nullif(trim(new.raw_user_meta_data ->> 'first_name'), ''), split_part(coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)), ' ', 1));
  last_name_value := coalesce(nullif(trim(new.raw_user_meta_data ->> 'last_name'), ''), trim(substr(coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), ''), length(first_name_value) + 1)));
  display_name := trim(first_name_value || ' ' || last_name_value);

  insert into public.profiles (id, email, name, first_name, last_name, handle, initials, job_title)
  values (
    new.id,
    lower(new.email),
    display_name,
    first_name_value,
    last_name_value,
    lower(regexp_replace(split_part(new.email, '@', 1), '[^a-zA-Z0-9]', '', 'g')) || '_' || left(new.id::text, 6),
    upper(left(first_name_value, 1) || left(coalesce(nullif(last_name_value, ''), first_name_value), 1)),
    coalesce(new.raw_user_meta_data ->> 'job_title', '')
  );

  if nullif(new.raw_user_meta_data ->> 'invited_workspace_id', '') is not null then
    invited_workspace_id := (new.raw_user_meta_data ->> 'invited_workspace_id')::uuid;
    member_role := case
      when new.raw_user_meta_data ->> 'workspace_role' in ('admin', 'member', 'guest') then new.raw_user_meta_data ->> 'workspace_role'
      else 'member'
    end;

    insert into public.workspace_members (workspace_id, user_id, role)
    values (invited_workspace_id, new.id, member_role)
    on conflict (workspace_id, user_id) do update set role = excluded.role;

    update public.workspace_invitations
    set status = 'Angenommen', accepted_at = now()
    where workspace_invitations.workspace_id = invited_workspace_id
      and lower(email) = lower(new.email);
  end if;

  return new;
end
$function$;

revoke all on function private.handle_new_user() from public, anon, authenticated;
