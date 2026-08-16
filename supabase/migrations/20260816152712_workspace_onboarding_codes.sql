
create table public.workspace_join_codes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null unique references public.workspaces(id) on delete cascade,
  code_hash text not null unique,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index workspace_join_codes_created_by_idx on public.workspace_join_codes(created_by);

alter table public.workspace_join_codes enable row level security;

revoke all on public.workspace_join_codes from public, anon, authenticated;
grant select, insert, update, delete on public.workspace_join_codes to service_role;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  display_name text;
  invited_workspace_id uuid;
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

