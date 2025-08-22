
create extension if not exists pgcrypto;
create extension if not exists pg_stat_statements;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  student_id text unique,
  name text not null,
  role text not null check (role in ('student','admin')),
  password_hash text not null,
  created_at timestamptz default now()
);

create table if not exists notices (
  id bigserial primary key,
  kind text not null check (kind in ('banner','post')),
  title text not null,
  body text,
  image_url text,
  is_public boolean default true,
  created_at timestamptz default now()
);

create table if not exists finance_entries (
  id bigserial primary key,
  kind text not null check (kind in ('income','expense')),
  item text not null,
  amount integer not null,
  occurred_on date not null,
  note text,
  created_at timestamptz default now()
);
create index if not exists idx_finance_date on finance_entries(occurred_on);

create table if not exists taxes (
  id bigserial primary key,
  student_id text not null,
  item text not null,
  amount integer not null,
  imposed_on date not null,
  status text not null check (status in ('미납','체납','납부')) default '미납',
  paid_on date,
  delinquent_on date,
  memo text,
  created_at timestamptz default now()
);
create index if not exists idx_taxes_student on taxes(student_id);
create index if not exists idx_taxes_status on taxes(status);
