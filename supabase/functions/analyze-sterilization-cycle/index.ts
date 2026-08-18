// Extrait numéro de cycle/programme/lot/résultat d'une photo d'étiquette ou
// de ticket d'autoclave via l'API Claude (vision). Même plomberie partagée
// que analyze-expense-receipt — voir _shared/claudeVision.ts.
import { callClaudeVisionTool, corsHeaders, json, verifyCallerPermission } from '../_shared/claudeVision.ts';

// "result" déclenche automatiquement le circuit de non-conformité (§35)
// côté app dès que la fiche est enregistrée à "non_conforming" — un mauvais
// diagnostic ici a une vraie conséquence opérationnelle (ou l'inverse : un
// vrai échec non détecté). Le prompt insiste donc explicitement pour ne
// jamais deviner ce champ, contrairement aux autres champs de ce document.
const EXTRACTION_PROMPT = `Tu analyses une photo d'étiquette ou de ticket imprimé par un autoclave de stérilisation, pour un cabinet dentaire. Utilise l'outil fourni pour enregistrer ce que tu peux lire.

Pour "result" : ne renseigne "conforming" ou "non_conforming" que si l'étiquette indique CLAIREMENT et SANS AMBIGUÏTÉ un résultat (texte imprimé du type "OK"/"CONFORME"/"CYCLE VALIDE" vs "ECHEC"/"NON CONFORME"/une alarme, ou un indicateur/intégrateur physique dont le changement de couleur est nettement lisible sur la photo). En cas du moindre doute, laisse "result" à null — ne devine jamais sur ce champ, c'est une donnée de sécurité sanitaire, jamais une simple estimation.
Pour les autres champs (numéro de cycle, programme, numéro de lot), si illisible ou absent, laisse à null plutôt que d'inventer une valeur.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non supportée.' }, 405);

  const { error: errorResponse } = await verifyCallerPermission(req.headers.get('Authorization'), 'manage_sterilization');
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
      toolName: 'record_cycle_extraction',
      toolDescription: "Enregistre les informations extraites d'une étiquette ou d'un ticket de cycle de stérilisation.",
      inputSchema: {
        type: 'object',
        properties: {
          cycleNumber: { type: ['string', 'null'], description: 'Numéro du cycle' },
          program: { type: ['string', 'null'], description: 'Programme utilisé' },
          batchNumber: { type: ['string', 'null'], description: 'Numéro de lot' },
          result: { type: ['string', 'null'], enum: ['conforming', 'non_conforming', null], description: 'Uniquement si indiqué sans ambiguïté sur le document' },
          comment: { type: ['string', 'null'], description: 'Résumé bref, une phrase' },
        },
        required: [],
      },
    });
    return json({ extracted });
  } catch (error) {
    return json({ error: (error as Error).message }, 502);
  }
});
