create policy workspace_join_codes_no_client_access
on public.workspace_join_codes
for all
to authenticated
using (false)
with check (false);
