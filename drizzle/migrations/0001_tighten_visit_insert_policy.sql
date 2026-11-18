drop policy if exists "anyone can record a visit" on public.portfolio_visits;
create policy "record valid visit" on public.portfolio_visits for insert to anon, authenticated
with check (
  created_at >= now() - interval '1 minute' and created_at <= now() + interval '1 minute'
  and ((kind = 'view' and brand_id is null)
    or (kind in ('brand_open','store_click') and brand_id is not null
        and exists (select 1 from public.portfolio_brands b where b.id = brand_id and b.is_visible)))
);