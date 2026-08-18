/** Types générés par les triggers serveur (migrations 0012 et 0020) — utilisés pour les préférences par catégorie (§52). */
export const NOTIFICATION_TYPE_LABEL: Record<string, string> = {
  stock_out: 'Rupture de stock',
  stock_low: 'Stock faible',
  sterilization_non_conforming: 'Cycle de stérilisation non conforme',
  material_request_new: 'Nouvelle demande de matériel',
  order_to_receive: 'Commande à réceptionner',
};

export const NOTIFICATION_TYPES = Object.keys(NOTIFICATION_TYPE_LABEL);
