/**
 * Incoterm.ts
 * Interfaces TypeScript pour les Incoterms 2020
 * Source : Chambre de Commerce Internationale (CCI) - ICC Incoterms® 2020
 */

// ─────────────────────────────────────────────────────────────────────────────
// Énumérations
// ─────────────────────────────────────────────────────────────────────────────

/** Les 11 acronymes officiels des Incoterms 2020 (ICC) */
export type IncotermCode =
  | "EXW"
  | "FCA"
  | "CPT"
  | "CIP"
  | "DAP"
  | "DPU"
  | "DDP"
  | "FAS"
  | "FOB"
  | "CFR"
  | "CIF";

/**
 * Modes de transport autorisés.
 * - ALL   : Tous modes (route, air, rail, mer, multimodal)
 * - SEA   : Transport maritime et voies navigables intérieures uniquement
 */
export type TransportMode = "ALL" | "SEA";

/** Groupe ICC : E = départ, F = franco, C = coût principal, D = arrivée */
export type IncotermGroup = "E" | "F" | "C" | "D";

// ─────────────────────────────────────────────────────────────────────────────
// Interface principale
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Représente un Incoterm 2020 tel que défini par la CCI.
 * Chaque champ reflète une règle académique du référentiel BTS Commerce International.
 */
export interface Incoterm {
  /** Acronyme officiel ICC (ex : "CIF") */
  code: IncotermCode;

  /** Dénomination complète officielle en anglais (ex : "Cost Insurance and Freight") */
  fullNameEN: string;

  /** Dénomination complète officielle en français (ex : "Coût, Assurance et Fret") */
  fullNameFR: string;

  /** Groupe ICC (E, F, C ou D) */
  group: IncotermGroup;

  /** Mode de transport autorisé */
  transportMode: TransportMode;

  /**
   * Point de transfert des RISQUES (du vendeur vers l'acheteur).
   * C'est le moment où la marchandise passe sous la responsabilité de l'acheteur.
   */
  riskTransferPoint: {
    /** Description précise du point de transfert */
    description: string;
    /** Lieu nommé de référence (ex : "port d'embarquement convenu", "locaux du vendeur") */
    namedPlace: string;
  };

  /**
   * Point de transfert des FRAIS (du vendeur vers l'acheteur).
   * Pour les Incoterms de groupe C, ce point diffère du point de risque.
   */
  costTransferPoint: {
    /** Description précise du point de transfert des frais */
    description: string;
    /** Lieu nommé de référence */
    namedPlace: string;
  };

  /** Obligations douanières */
  customsObligations: {
    /** Qui effectue le dédouanement à l'EXPORT ? */
    exportClearance: "SELLER" | "BUYER" | "SHARED";
    /** Qui effectue le dédouanement à l'IMPORT ? */
    importClearance: "SELLER" | "BUYER" | "SHARED";
    /** Qui paie les droits et taxes à l'IMPORT ? */
    importDutiesPaidBy: "SELLER" | "BUYER";
  };

  /** Obligations d'assurance */
  insuranceObligation: {
    /** Qui a l'obligation contractuelle de souscrire une assurance ? */
    obligatedParty: "SELLER" | "BUYER" | "NONE";
    /**
     * Niveau de couverture minimum requis par l'Incoterm.
     * - ICC_A : Toutes risques (CIP 2020)
     * - ICC_C : Couverture minimale (CIF 2020)
     * - NONE  : Pas d'obligation contractuelle
     */
    minimumCoverage: "ICC_A" | "ICC_C" | "NONE";
    /** Note explicative sur l'obligation d'assurance */
    note: string;
  };

  /**
   * Indicateur de position dans la cascade des prix.
   * Plus le niveau est élevé, plus la part de frais à la charge du vendeur est grande.
   * Échelle : 1 (EXW) → 7 (DDP)
   */
  cascadeLevel: 1 | 2 | 3 | 4 | 5 | 6 | 7;

  /**
   * Frais inclus dans le prix selon cet Incoterm (à la charge du vendeur).
   * Utilisé pour l'affichage pédagogique de la cascade.
   */
  sellerChargesIncluded: SellerCharge[];

  /** Notes académiques spécifiques à cet Incoterm (ex : nouveautés 2020, pièges d'examen) */
  academicNotes: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Types auxiliaires
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Types de frais pouvant être à la charge du vendeur selon l'Incoterm.
 * Utilisés pour construire la cascade des prix.
 */
export type SellerCharge =
  | "PRODUCTION_COST"      // Coût de production / coût de revient
  | "EXPORT_PACKAGING"     // Emballage et marquage export
  | "LOADING_AT_FACTORY"   // Chargement en usine
  | "INLAND_TRANSPORT_EXPORT" // Transport intérieur pays export
  | "EXPORT_CUSTOMS_FEES"  // Frais de dédouanement export
  | "ORIGIN_PORT_FEES"     // Frais portuaires au départ (THC départ)
  | "MAIN_FREIGHT"         // Fret principal (mer, air, route)
  | "INSURANCE"            // Prime d'assurance transport
  | "DESTINATION_PORT_FEES" // Frais portuaires à destination (THC arrivée)
  | "UNLOADING"            // Déchargement au lieu de destination
  | "INLAND_TRANSPORT_IMPORT" // Transport intérieur pays import
  | "IMPORT_CUSTOMS_FEES"  // Frais de dédouanement import
  | "IMPORT_DUTIES";       // Droits et taxes à l'importation
