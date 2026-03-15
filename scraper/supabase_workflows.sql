create extension if not exists "pgcrypto";

create table if not exists workflows (
  id uuid primary key default gen_random_uuid(),
  owner_email text not null,
  name text not null,
  nodes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_workflows_owner_email_updated_at
  on workflows(owner_email, updated_at desc);

create or replace function set_workflow_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists workflows_set_updated_at on workflows;

create trigger workflows_set_updated_at
before update on workflows
for each row
execute function set_workflow_updated_at();
