// Extrait la liste des articles (+ quantités) d'une photo de bon de
// livraison via l'API Claude (vision), pour préremplir une réception de
// stock (3e cas d'usage IA, §cahier des charges — voir aussi
// docs/contexte-projet.md).
//
// Autonome (pas d'import depuis ../_shared/claudeVision.ts) : déployée via
// l'éditeur du dashboard Supabase, qui ne bundle que ce seul fichier — un
// import relatif vers un module partagé échoue au déploiement ("Module not
// found"). analyze-expense-receipt et analyze-sterilization-cycle restent
// sur le module partagé (déployées via CLI depuis un checkout complet du
// repo, qui résout ces chemins correctement) ; si ce fichier est un jour
// redéployé via la CLI plutôt que l'éditeur, il peut être réaligné sur
// _shared/claudeVision.ts sans changer le comportement.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function verifyCallerPermission(authHeader: string | null, permission: string) {
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

interface ClaudeVisionToolParams {
  imageBase64: string;
  mimeType: string;
  prompt: string;
  toolName: string;
  toolDescription: string;
  inputSchema: Record<string, unknown>;
}

async function callClaudeVisionTool(params: ClaudeVisionToolParams): Promise<Record<string, unknown>> {
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

const EXTRACTION_PROMPT = `Tu analyses une photo de bon de livraison pour un cabinet dentaire. Utilise l'outil fourni pour enregistrer la liste des articles livrés avec leur quantité.
Ignore les lignes qui ne sont pas des articles (frais de port, taxes, sous-totaux, totaux). Si la quantité d'une ligne n'est pas lisible avec certitude, n'inclus pas cette ligne plutôt que de deviner un chiffre.
Si le fournisseur ou la date du document ne sont pas identifiables, laisse le champ correspondant à null plutôt que d'inventer une valeur.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non supportée.' }, 405);

  const { error: errorResponse } = await verifyCallerPermission(req.headers.get('Authorization'), 'manage_stock');
  if (errorResponse) return errorResponse;

  let body: { imageBase64?: string; mimeType?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Corps de requête invalide.' }, 400);
  }
  if (!body.imageBase64) return json({ error: 'Image manquante.' }, 400);

  try {
    const extracted = await callClaudeVisionTool({
      imageBase64: body.imageBase64,
      mimeType: body.mimeType || 'image/jpeg',
      prompt: EXTRACTION_PROMPT,
      toolName: 'record_delivery_extraction',
      toolDescription: "Enregistre les articles livrés extraits d'un bon de livraison.",
      inputSchema: {
        type: 'object',
        properties: {
          supplierName: { type: ['string', 'null'], description: "Nom du fournisseur tel qu'écrit sur le document" },
          deliveryDate: { type: ['string', 'null'], description: 'Date du bon de livraison, format AAAA-MM-JJ' },
          items: {
            type: 'array',
            description: 'Articles livrés, un par ligne du bon de livraison',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', description: "Nom de l'article tel qu'écrit sur le document" },
                quantity: { type: 'number', description: 'Quantité livrée' },
              },
              required: ['name', 'quantity'],
            },
          },
        },
        required: ['items'],
      },
    });
    return json({ extracted });
  } catch (error) {
    return json({ error: (error as Error).message }, 502);
  }
});
