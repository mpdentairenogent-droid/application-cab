-- Application des mouvements de stock + génération automatique de
-- notifications sur deux événements représentatifs (rupture/stock faible,
-- cycle de stérilisation non conforme). Les autres générateurs (tâche en
-- retard, maintenance à échéance, etc.) seront ajoutés au fil des phases
-- correspondantes plutôt que tous d'un coup ici.

create or replace function public.notify_users(p_role app_role, p_type text, p_title text, p_body text, p_entity_type text, p_entity_id uuid, p_urgent boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, type, title, body, entity_type, entity_id, is_urgent)
  select id, p_type, p_title, p_body, p_entity_type, p_entity_id, p_urgent
  from public.profiles
  where status = 'active'
    and (p_role is null or role = p_role or role in ('owner_dentist', 'super_admin'));
end;
$$;

-- stock_items.quantity n'est jamais modifiée directement par l'app : elle est
-- entièrement dérivée de la somme des mouvements, ce qui élimine tout risque
-- de désynchronisation entre le stock affiché et son historique.
create or replace function public.apply_stock_movement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item public.stock_items%rowtype;
  v_delta numeric;
begin
  v_delta := case new.movement_type
    when 'in' then new.quantity
    when 'order_reception' then new.quantity
    when 'correction' then new.quantity
    else -new.quantity
  end;

  update public.stock_items
  set quantity = quantity + v_delta
  where id = new.stock_item_id
  returning * into v_item;

  if v_item.quantity <= 0 then
    perform public.notify_users(null, 'stock_out', 'Rupture de stock',
      v_item.name || ' est en rupture de stock.', 'stock_item', v_item.id, true);
  elsif v_item.quantity <= v_item.minimum_quantity then
    perform public.notify_users(null, 'stock_low', 'Stock faible',
      v_item.name || ' passe sous le seuil minimum (' || v_item.quantity || ' ' || v_item.unit || ').',
      'stock_item', v_item.id, false);
  end if;

  return new;
end;
$$;

create or replace trigger stock_movements_apply after insert on public.stock_movements
  for each row execute function public.apply_stock_movement();

create or replace function public.notify_non_conforming_cycle()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.result = 'non_conforming' then
    perform public.notify_users(null, 'sterilization_non_conforming', 'Cycle de stérilisation non conforme',
      coalesce('Cycle ' || new.cycle_number, 'Un cycle') || ' déclaré non conforme.',
      'sterilization_cycle', new.id, true);
  end if;
  return new;
end;
$$;

create or replace trigger sterilization_cycles_notify_non_conforming after insert on public.sterilization_cycles
  for each row execute function public.notify_non_conforming_cycle();
