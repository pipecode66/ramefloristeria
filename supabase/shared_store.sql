create table if not exists public.shared_store (
  store_key text primary key,
  hero_content jsonb not null default '{}'::jsonb,
  products jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default timezone('utc', now())
);

insert into public.shared_store (store_key)
values ('main')
on conflict (store_key) do nothing;
