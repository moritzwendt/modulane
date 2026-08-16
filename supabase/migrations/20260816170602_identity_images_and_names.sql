alter table public.profiles
  add column first_name text not null default '',
  add column last_name text not null default '',
  add column avatar_url text not null default '';

alter table public.workspaces
  add column logo_url text not null default '';

update public.profiles
set
  first_name = split_part(trim(name), ' ', 1),
  last_name = trim(substr(trim(name), length(split_part(trim(name), ' ', 1)) + 1));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('identity-assets', 'identity-assets', true, 5242880, array['image/png'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy identity_assets_insert
on storage.objects for insert to authenticated
with check (
  bucket_id = 'identity-assets'
  and (
    (storage.foldername(name))[1] = 'profiles'
    and (storage.foldername(name))[2] = (select auth.uid())::text
    or
    (storage.foldername(name))[1] = 'organizations'
    and (storage.foldername(name))[2] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    and private.can_manage_workspace(((storage.foldername(name))[2])::uuid)
  )
);

create policy identity_assets_select
on storage.objects for select to authenticated
using (
  bucket_id = 'identity-assets'
  and (
    (storage.foldername(name))[1] = 'profiles'
    and (storage.foldername(name))[2] = (select auth.uid())::text
    or
    (storage.foldername(name))[1] = 'organizations'
    and (storage.foldername(name))[2] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    and private.can_manage_workspace(((storage.foldername(name))[2])::uuid)
  )
);

create policy identity_assets_update
on storage.objects for update to authenticated
using (
  bucket_id = 'identity-assets'
  and (
    (storage.foldername(name))[1] = 'profiles'
    and (storage.foldername(name))[2] = (select auth.uid())::text
    or
    (storage.foldername(name))[1] = 'organizations'
    and (storage.foldername(name))[2] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    and private.can_manage_workspace(((storage.foldername(name))[2])::uuid)
  )
)
with check (
  bucket_id = 'identity-assets'
  and (
    (storage.foldername(name))[1] = 'profiles'
    and (storage.foldername(name))[2] = (select auth.uid())::text
    or
    (storage.foldername(name))[1] = 'organizations'
    and (storage.foldername(name))[2] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    and private.can_manage_workspace(((storage.foldername(name))[2])::uuid)
  )
);

create policy identity_assets_delete
on storage.objects for delete to authenticated
using (
  bucket_id = 'identity-assets'
  and (
    (storage.foldername(name))[1] = 'profiles'
    and (storage.foldername(name))[2] = (select auth.uid())::text
    or
    (storage.foldername(name))[1] = 'organizations'
    and (storage.foldername(name))[2] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    and private.can_manage_workspace(((storage.foldername(name))[2])::uuid)
  )
);

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
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
      when new.raw_user_meta_data ->> 'workspace_role' in ('Administrator', 'Mitglied', 'Gast') then new.raw_user_meta_data ->> 'workspace_role'
      else 'Mitglied'
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
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;
