// Plomberie commune à toutes les fonctions "scanner une photo -> extraire
// des champs" (factures, cycles de stérilisation, et d'autres à venir même
// modèle). Chaque fonction appelante garde son propre prompt/schéma/
// permission — seule la partie générique (vérifier l'appelant, appeler
// Claude en forçant un tool_use) est partagée ici.
import { createClient } from 'jsr:@supabase/supabase-js@2';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

/**
 * Vérifie le token de l'appelant puis sa permission via has_permission() —
 * appelée sur SON PROPRE client (pas le service_role), pour respecter les
 * dérogations par utilisateur (user_permissions), pas seulement les
 * défauts de rôle. Retourne soit `{ error: Response }` à renvoyer tel quel,
 * soit `{ caller }` pour continuer.
 */
export async function verifyCallerPermission(authHeader: string | null, permission: string) {
  if (!authHeader) return { error: json({ error: 'Authentification requise.' }, 401) };

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const callerClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });

  const {
    data: { user: caller },
    error: callerError,
  } = await callerClient.auth.getUser();
  if (callerError || !caller) return { error: json({ error: 'Session invalide.' }, 401) };

  const { data: allowed, error: permError } = await callerClient.rpc('has_permission', { perm: permission });
  if (permError || !allowed) return { error: json({ error: `Permission ${permission} requise.` }, 403) };

  return { caller };
}

export interface ClaudeVisionToolParams {
  imageBase64: string;
  mimeType: string;
  prompt: string;
  toolName: string;
  toolDescription: string;
  inputSchema: Record<string, unknown>;
}

/** Appelle Claude avec une image + un tool forcé (tool_choice) pour garantir une réponse JSON conforme au schéma — jamais de texte libre à parser. */
export async function callClaudeVisionTool(params: ClaudeVisionToolParams): Promise<Record<string, unknown>> {
  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!anthropicKey) throw new Error('Service IA non configuré (clé manquante).');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: params.mimeType, data: params.imageBase64 } },
            { type: 'text', text: params.prompt },
          ],
        },
      ],
      tools: [{ name: params.toolName, description: params.toolDescription, input_schema: params.inputSchema }],
      tool_choice: { type: 'tool', name: params.toolName },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Erreur du service IA (${response.status}) : ${errText}`);
  }

  const data = await response.json();
  const toolUseBlock = (data.content ?? []).find((block: { type: string }) => block.type === 'tool_use');
  if (!toolUseBlock) throw new Error('Réponse du service IA inattendue.');
  return toolUseBlock.input;
}
