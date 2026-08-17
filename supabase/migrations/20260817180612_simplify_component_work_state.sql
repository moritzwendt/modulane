update public.app_parts
set release_state = 'In Entwicklung'
where release_state = 'Frei';

alter table public.app_parts
  alter column release_state set default 'In Entwicklung';

alter table public.app_parts
  drop constraint if exists app_parts_release_state_check;

alter table public.app_parts
  add constraint app_parts_release_state_check
  check (release_state in ('In Entwicklung', 'Instabil', 'Stabil', 'Production Ready'));

drop index if exists public.app_parts_owner_user_id_idx;

alter table public.app_parts
  drop column if exists owner_user_id;

drop policy if exists app_part_active_users_insert on public.app_part_active_users;
drop policy if exists app_part_active_users_delete on public.app_part_active_users;

create policy app_part_active_users_insert
on public.app_part_active_users
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and (select private.can_edit_app_part(app_part_id))
);

create policy app_part_active_users_delete
on public.app_part_active_users
for delete
to authenticated
using (
  user_id = (select auth.uid())
  and (select private.can_edit_app_part(app_part_id))
);

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

  delete from public.feature_members fm
  using public.features f, public.projects p
  where fm.feature_id = f.id
    and f.project_id = p.id
    and p.workspace_id = target_workspace_id
    and fm.user_id = target_user_id;

  delete from public.app_part_active_users active
  using public.app_parts part, public.projects p
  where active.app_part_id = part.id
    and part.project_id = p.id
    and p.workspace_id = target_workspace_id
    and active.user_id = target_user_id;

  delete from public.project_members pm
  using public.projects p
  where pm.project_id = p.id
    and p.workspace_id = target_workspace_id
    and pm.user_id = target_user_id;

  delete from public.workspace_members
  where workspace_id = target_workspace_id
    and user_id = target_user_id;
end
$function$;

revoke all on function public.remove_workspace_member(uuid, uuid) from public, anon;
grant execute on function public.remove_workspace_member(uuid, uuid) to authenticated;
