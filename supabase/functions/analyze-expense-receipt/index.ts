// Extrait montant/date/fournisseur/catégorie/résumé d'une photo de
// facture/reçu via l'API Claude (vision). Tourne côté serveur car elle seule
// détient ANTHROPIC_API_KEY — jamais envoyée au client (même règle que
// SUPABASE_SERVICE_ROLE_KEY). Plomberie commune (auth, appel Claude) dans
// _shared/claudeVision.ts, partagée avec analyze-sterilization-cycle.
import { callClaudeVisionTool, corsHeaders, json, verifyCallerPermission } from '../_shared/claudeVision.ts';

const EXPENSE_CATEGORIES = ['consumables', 'equipment', 'laboratory', 'staff', 'maintenance', 'it', 'rent', 'insurance', 'subscription', 'other'];

const EXTRACTION_PROMPT = `Tu analyses une photo de facture ou de reçu pour un cabinet dentaire. Utilise l'outil fourni pour enregistrer ce que tu peux lire.
Pour "category", déduis la catégorie la plus probable du contenu (ex. gants/masques/consommables dentaires -> consumables ; matériel/appareil -> equipment ; travaux de laboratoire dentaire -> laboratory ; loyer -> rent). Si aucune ne correspond clairement, utilise "other".
Si un champ est illisible ou absent du document, laisse-le à null plutôt que d'inventer une valeur.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non supportée.' }, 405);

  const { error: errorResponse } = await verifyCallerPermission(req.headers.get('Authorization'), 'manage_expenses');
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
      toolName: 'record_expense_extraction',
      toolDescription: "Enregistre les informations extraites d'une facture ou d'un reçu.",
      inputSchema: {
        type: 'object',
        properties: {
          amount: { type: ['number', 'null'], description: 'Montant total TTC en euros' },
          expenseDate: { type: ['string', 'null'], description: 'Date du document, format AAAA-MM-JJ' },
          supplierName: { type: ['string', 'null'], description: "Nom du fournisseur/vendeur tel qu'écrit sur le document" },
          category: { type: 'string', enum: EXPENSE_CATEGORIES },
          comment: { type: ['string', 'null'], description: 'Résumé bref du contenu, une phrase' },
        },
        required: ['category'],
      },
    });
    return json({ extracted });
  } catch (error) {
    return json({ error: (error as Error).message }, 502);
  }
});
