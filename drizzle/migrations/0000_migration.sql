create table public.portfolio_visits (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  kind text not null check (kind in ('view','brand_open','store_click')),
  brand_id text check (brand_id is null or length(brand_id) <= 100),
  referrer_host text check (referrer_host is null or length(referrer_host) <= 120),
  country text check (country is null or length(country) <= 3),
  device text not null default 'desktop' check (device in ('desktop','mobile','tablet'))
);
grant insert on public.portfolio_visits to anon, authenticated;
grant all on public.portfolio_visits to service_role;
alter table public.portfolio_visits enable row level security;
create policy "anyone can record a visit" on public.portfolio_visits for insert to anon, authenticated with check (true);
create policy "admin reads visits" on public.portfolio_visits for select to authenticated using (public.is_portfolio_admin());
create index portfolio_visits_created_idx on public.portfolio_visits (created_at desc);

create or replace function public.portfolio_visit_stats(days int default 30)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare since timestamptz := now() - make_interval(days => greatest(1, least(days, 365)));
begin
  if not public.is_portfolio_admin() then raise exception 'forbidden'; end if;
  return jsonb_build_object(
    'total', (select count(*) from public.portfolio_visits where kind='view' and created_at >= since),
    'daily', coalesce((select jsonb_agg(jsonb_build_object('day', d, 'n', n) order by d) from (select (created_at at time zone 'Asia/Riyadh')::date d, count(*) n from public.portfolio_visits where kind='view' and created_at >= since group by 1) x), '[]'),
    'countries', coalesce((select jsonb_agg(jsonb_build_object('k', k, 'n', n) order by n desc) from (select coalesce(country,'??') k, count(*) n from public.portfolio_visits where kind='view' and created_at >= since group by 1 order by 2 desc limit 10) x), '[]'),
    'devices', coalesce((select jsonb_agg(jsonb_build_object('k', k, 'n', n) order by n desc) from (select device k, count(*) n from public.portfolio_visits where kind='view' and created_at >= since group by 1) x), '[]'),
    'sources', coalesce((select jsonb_agg(jsonb_build_object('k', k, 'n', n) order by n desc) from (select coalesce(referrer_host,'direct') k, count(*) n from public.portfolio_visits where kind='view' and created_at >= since group by 1 order by 2 desc limit 10) x), '[]'),
    'brands', coalesce((select jsonb_agg(jsonb_build_object('k', k, 'opens', o, 'clicks', c) order by o + c desc) from (select brand_id k, count(*) filter (where kind='brand_open') o, count(*) filter (where kind='store_click') c from public.portfolio_visits where brand_id is not null and created_at >= since group by 1 order by 2 + 3 desc limit 10) x), '[]')
  );
end $$;
revoke all on function public.portfolio_visit_stats(int) from public, anon;
grant execute on function public.portfolio_visit_stats(int) to authenticated;