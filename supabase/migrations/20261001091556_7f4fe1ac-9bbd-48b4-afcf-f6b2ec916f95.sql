begin;
create table if not exists public.portfolio_admin (
  singleton boolean primary key default true check (singleton),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.portfolio_admin enable row level security;
revoke all on public.portfolio_admin from public, anon, authenticated;
grant all on public.portfolio_admin to service_role;

create or replace function public.is_portfolio_admin()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists(select 1 from public.portfolio_admin where user_id = (select auth.uid())); $$;
revoke all on function public.is_portfolio_admin() from public;
grant execute on function public.is_portfolio_admin() to anon, authenticated, service_role;

create table if not exists public.portfolio_brands (
  id text primary key check (length(id) between 1 and 100),
  name text not null check (length(trim(name)) between 2 and 100),
  category text not null default 'Other' check (category in ('Fashion','Beauty','Food','Books','Technology','Lifestyle','Other')),
  logo text check (logo is null or (length(logo) <= 2048 and (logo ~ '^logos/[a-z0-9-]+\.webp$' or logo ~ '^https://[a-z0-9.-]+/storage/v1/object/public/portfolio-assets/logos/[a-f0-9-]+\.webp$'))),
  url text check (url is null or (length(url) <= 2048 and url ~ '^https://[^/@[:space:]]+\.[^/@[:space:]]+(/[^[:space:]]*)?$')),
  link_enabled boolean not null default false,
  is_visible boolean not null default true,
  position integer not null default 0 check(position between 0 and 100000),
  featured boolean not null default false,
  theme text,
  headline text,
  meta text,
  tags text[] not null default '{}',
  description text,
  note text,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint enabled_link_requires_url check(not link_enabled or url is not null)
);
create unique index if not exists portfolio_brands_name_unique on public.portfolio_brands(lower(trim(name)));
create index if not exists portfolio_brands_published_order on public.portfolio_brands(is_visible,position);
alter table public.portfolio_brands enable row level security;
revoke all on public.portfolio_brands from public, anon, authenticated;
grant select on public.portfolio_brands to anon, authenticated;
grant insert, update, delete on public.portfolio_brands to authenticated;
grant all on public.portfolio_brands to service_role;
drop policy if exists portfolio_read on public.portfolio_brands;
create policy portfolio_read on public.portfolio_brands for select to anon, authenticated using(is_visible or (select public.is_portfolio_admin()));
drop policy if exists portfolio_insert on public.portfolio_brands;
create policy portfolio_insert on public.portfolio_brands for insert to authenticated with check((select public.is_portfolio_admin()));
drop policy if exists portfolio_update on public.portfolio_brands;
create policy portfolio_update on public.portfolio_brands for update to authenticated using((select public.is_portfolio_admin())) with check((select public.is_portfolio_admin()));
drop policy if exists portfolio_delete on public.portfolio_brands;
create policy portfolio_delete on public.portfolio_brands for delete to authenticated using((select public.is_portfolio_admin()));

create or replace function public.portfolio_touch_version()
returns trigger language plpgsql set search_path = '' as $$
begin
 new.version := old.version + 1;
 new.updated_at := now();
 return new;
end; $$;
revoke all on function public.portfolio_touch_version() from public;
drop trigger if exists portfolio_updated on public.portfolio_brands;
create trigger portfolio_updated before update on public.portfolio_brands for each row execute function public.portfolio_touch_version();

drop policy if exists portfolio_logo_insert on storage.objects;
create policy portfolio_logo_insert on storage.objects for insert to authenticated with check(bucket_id='portfolio-assets' and (storage.foldername(name))[1]='logos' and name ~ '^logos/[a-f0-9-]+\.webp$' and (select public.is_portfolio_admin()));
drop policy if exists portfolio_logo_select on storage.objects;
create policy portfolio_logo_select on storage.objects for select to authenticated using(bucket_id='portfolio-assets' and (select public.is_portfolio_admin()));
drop policy if exists portfolio_logo_delete on storage.objects;
create policy portfolio_logo_delete on storage.objects for delete to authenticated using(bucket_id='portfolio-assets' and (select public.is_portfolio_admin()));
commit;