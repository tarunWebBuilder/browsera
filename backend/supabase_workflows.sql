create extension if not exists "pgcrypto";

create table if not exists workflows (
  id uuid primary key default gen_random_uuid(),
  owner_email text not null,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists workflow_nodes (
  id text primary key,
  workflow_id uuid not null references workflows(id) on delete cascade,
  sort_order integer not null default 0,
  type text not null check (type in ('trigger', 'action', 'logic', 'finish')),
  variant text,
  label text not null,
  icon text,
  action_template_id text,
  pos_x double precision not null default 0,
  pos_y double precision not null default 0,
  inputs jsonb not null default '{}'::jsonb,
  config jsonb not null default '{}'::jsonb,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_workflows_owner_updated_at
  on workflows(owner_email, updated_at desc);

create index if not exists idx_workflow_nodes_workflow_id_sort_order
  on workflow_nodes(workflow_id, sort_order);

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
