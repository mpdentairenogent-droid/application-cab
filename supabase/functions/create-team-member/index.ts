// Crée un compte réel pour un nouveau membre de l'équipe (§15 "créer
// utilisateur"), appelée depuis l'écran Équipe de l'app par un titulaire/super
// admin. Tourne côté serveur (Edge Function) car elle seule peut détenir la
// clé service_role — jamais envoyée au client. L'appelant est vérifié via son
// propre token (RLS sur profiles), pas via un rôle passé dans le corps de la
// requête, pour qu'un appel forgé ne puisse pas s'auto-attribuer l'autorisation.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const VALID_ROLES = ['assistant', 'collaborator_dentist', 'owner_dentist', 'admin_staff', 'accountant', 'super_admin'];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < 14; i++) password += chars[Math.floor(Math.random() * chars.length)];
  return password;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non supportée.' }, 405);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Authentification requise.' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // Client "appelant" : porte le token de la personne qui appelle, soumis à RLS.
  // Sert uniquement à vérifier qui appelle réellement — jamais à créer le compte.
  const callerClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });

  const {
    data: { user: caller },
    error: callerError,
  } = await callerClient.auth.getUser();
  if (callerError || !caller) return json({ error: 'Session invalide.' }, 401);

  const { data: callerProfile, error: profileError } = await callerClient.from('profiles').select('role, status').eq('id', caller.id).single();

  const isAuthorized = !!callerProfile && callerProfile.status === 'active' && (callerProfile.role === 'owner_dentist' || callerProfile.role === 'super_admin');
  if (profileError || !isAuthorized) return json({ error: 'Réservé au titulaire ou au super admin.' }, 403);

  let body: { email?: string; firstName?: string; lastName?: string; role?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Corps de requête invalide.' }, 400);
  }

  const email = body.email?.trim();
  const firstName = body.firstName?.trim();
  const lastName = body.lastName?.trim();
  const role = body.role;

  if (!email || !firstName || !lastName || !role || !VALID_ROLES.includes(role)) {
    return json({ error: 'Champs manquants ou rôle invalide.' }, 400);
  }

  const password = generatePassword();
  const adminClient = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { first_name: firstName, last_name: lastName, role },
  });

  if (createError) return json({ error: createError.message }, 400);

  return json({ userId: created.user?.id, email, temporaryPassword: password });
});
