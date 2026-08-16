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

  update public.app_parts part
  set owner_user_id = null
  from public.projects p
  where part.project_id = p.id
    and p.workspace_id = target_workspace_id
    and part.owner_user_id = target_user_id;

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
