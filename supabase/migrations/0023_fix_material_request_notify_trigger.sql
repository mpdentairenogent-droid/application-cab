-- Corrige notify_new_material_request() (0019) après le passage aux demandes
-- multi-articles (0021, product_name/quantity retirés de material_requests).
-- Le trigger reste AFTER INSERT sur l'en-tête : les lignes d'articles ne sont
-- pas encore insérées à ce stade (voir services/materialRequests.ts,
-- createMaterialRequest insère l'en-tête puis les lignes), donc le message
-- ne peut plus citer un produit — générique, le détail est dans l'app.
create or replace function public.notify_new_material_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_users('owner_dentist', 'material_request_new', 'Nouvelle demande de matériel',
    'Une nouvelle demande de matériel est à valider.', 'material_request', new.id, false);
  return new;
end;
$$;
