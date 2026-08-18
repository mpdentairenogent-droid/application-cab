-- Vue dérivée pour le suivi des péremptions (§33) : pas de table dédiée, un
-- simple classement par échéance sur stock_items.
--
-- security_invoker = true est essentiel ici : sans cette option une vue
-- s'exécute par défaut avec les droits de son créateur (le rôle des
-- migrations), ce qui court-circuiterait silencieusement le RLS de
-- stock_items. Avec security_invoker, la vue respecte les policies de
-- l'utilisateur qui interroge.
create or replace view public.stock_expiry_overview
with (security_invoker = true) as
select
  id,
  name,
  category,
  quantity,
  unit,
  location,
  expiry_date,
  case
    when expiry_date < current_date then 'expired'
    when expiry_date < current_date + interval '30 days' then 'under_30'
    when expiry_date < current_date + interval '60 days' then '30_to_60'
    when expiry_date < current_date + interval '90 days' then '60_to_90'
    else 'beyond_90'
  end as expiry_bucket
from public.stock_items
where expiry_date is not null
order by expiry_date asc;
