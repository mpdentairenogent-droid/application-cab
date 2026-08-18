-- Phase 5 (§51) : générateurs de notifications événementiels supplémentaires.
-- Les 3 autres exemples du cahier des charges ("3 tâches en retard",
-- "maintenance dans 7 jours", "produit expire dans 15 jours") sont par
-- nature périodiques — ils nécessitent un déclenchement planifié (pg_cron ou
-- Edge Function) qui n'est pas encore configuré sur ce projet, plutôt qu'un
-- trigger sur mutation de ligne. Volontairement non simulés ici ; l'app
-- affiche déjà ces informations en direct dans Stock/Activité/Équipements,
-- seule leur remontée dans le centre de notifications reste à faire plus tard.

create or replace function public.notify_new_material_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_users('owner_dentist', 'material_request_new', 'Nouvelle demande de matériel',
    new.product_name || ' × ' || new.quantity, 'material_request', new.id, false);
  return new;
end;
$$;

create or replace trigger material_requests_notify_new after insert on public.material_requests
  for each row execute function public.notify_new_material_request();

create or replace function public.notify_order_to_receive()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'ordered' and (old.status is null or old.status is distinct from 'ordered') then
    perform public.notify_users('assistant', 'order_to_receive', 'Commande à réceptionner',
      coalesce('Commande ' || new.order_number, 'Une commande') || ' est en cours, à réceptionner prochainement.',
      'order', new.id, false);
  end if;
  return new;
end;
$$;

create or replace trigger orders_notify_to_receive after update on public.orders
  for each row execute function public.notify_order_to_receive();
