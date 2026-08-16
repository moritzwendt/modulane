alter table public.workspace_join_codes
add column role text not null default 'Mitglied'
check (role in ('Administrator', 'Mitglied', 'Gast'));

alter table public.workspace_join_codes
add column expires_at timestamptz;

update public.workspace_join_codes
set expires_at = created_at + interval '1 hour';

alter table public.workspace_join_codes
alter column expires_at set not null;

create or replace function private.enforce_workspace_join_code_expiry()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  new.expires_at := statement_timestamp() + interval '1 hour';
  return new;
end
$function$;

revoke all on function private.enforce_workspace_join_code_expiry() from public, anon, authenticated;

create trigger enforce_workspace_join_code_expiry
before insert or update on public.workspace_join_codes
for each row
execute function private.enforce_workspace_join_code_expiry();
