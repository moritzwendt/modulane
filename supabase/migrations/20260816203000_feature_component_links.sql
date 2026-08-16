create table public.feature_app_parts (
  feature_id uuid not null references public.features(id) on delete cascade,
  app_part_id uuid not null references public.app_parts(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (feature_id, app_part_id)
);

create index feature_app_parts_app_part_id_idx on public.feature_app_parts(app_part_id);

insert into public.feature_app_parts (feature_id, app_part_id)
select id, app_part_id
from public.features
where app_part_id is not null
on conflict do nothing;

alter table public.feature_app_parts enable row level security;

revoke all on table public.feature_app_parts from public, anon;
grant select, insert, delete on table public.feature_app_parts to authenticated;
grant all on table public.feature_app_parts to service_role;

create policy feature_app_parts_select
on public.feature_app_parts
for select
to authenticated
using ((select private.can_access_feature(feature_id)));

create policy feature_app_parts_insert
on public.feature_app_parts
for insert
to authenticated
with check (
  (select private.can_write_feature(feature_id))
  and (select private.can_access_app_part(app_part_id))
  and exists (
    select 1
    from public.features feature
    join public.app_parts app_part on app_part.project_id = feature.project_id
    where feature.id = feature_app_parts.feature_id
      and app_part.id = feature_app_parts.app_part_id
  )
);

create policy feature_app_parts_delete
on public.feature_app_parts
for delete
to authenticated
using ((select private.can_write_feature(feature_id)));

alter table public.features drop column app_part_id;
