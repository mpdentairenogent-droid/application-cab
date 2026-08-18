-- Phase 6 (§52) : livraison réelle des notifications push via l'API Expo.
-- pg_net est une extension standard fournie par Supabase sur tous les
-- projets — l'appel HTTP est asynchrone (ne bloque jamais l'insert qui
-- déclenche ce trigger). Respecte les préférences utilisateur (urgent
-- uniquement / catégorie désactivée) avant d'envoyer quoi que ce soit.
create extension if not exists pg_net;

create or replace function public.send_push_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prefs public.notification_preferences%rowtype;
  v_token record;
begin
  select * into v_prefs from public.notification_preferences where user_id = new.user_id;

  if v_prefs.user_id is not null then
    if v_prefs.urgent_only and not new.is_urgent then
      return new;
    end if;
    if (v_prefs.categories_enabled ? new.type) and (v_prefs.categories_enabled ->> new.type) = 'false' then
      return new;
    end if;
  end if;

  for v_token in select expo_push_token from public.device_tokens where user_id = new.user_id loop
    perform net.http_post(
      url := 'https://exp.host/--/api/v2/push/send',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := jsonb_build_object(
        'to', v_token.expo_push_token,
        'title', new.title,
        'body', coalesce(new.body, ''),
        'priority', case when new.is_urgent then 'high' else 'default' end,
        'data', jsonb_build_object('type', new.type, 'entity_type', new.entity_type, 'entity_id', new.entity_id)
      )
    );
  end loop;

  return new;
end;
$$;

create or replace trigger notifications_send_push after insert on public.notifications
  for each row execute function public.send_push_notification();
