/**
 * modules.ts
 * Interfaces TypeScript pour le système modulaire BTS CI E5 (MOI)
 * Couvre les 5 modules du programme : Logistique, Douane, Paiements, Risque de Change, Incoterms
 */

// ─────────────────────────────────────────────────────────────────────────────
// Identifiants de modules
// ─────────────────────────────────────────────────────────────────────────────

/** Les 5 modules du programme E5 — MOI (BTS Commerce International) */
export type ModuleId =
  | "logistique-transport"
  | "douane-fiscalite"
  | "paiements-financements"
  | "risque-change-pays"
  | "incoterms-supply-chain";

// ─────────────────────────────────────────────────────────────────────────────
// Bloc de contenu (unité atomique d'une fiche de cours)
// ─────────────────────────────────────────────────────────────────────────────

/** Types de blocs de contenu pour le rendu dynamique */
export type ContentBlockType =
  | "paragraph"
  | "heading"
  | "bullet_list"
  | "numbered_list"
  | "table"
  | "formula"
  | "exam_trap"       // Callout « Piège à l'examen » (amber/rouge)
  | "key_definition"  // Définition clé (indigo)
  | "example"         // Exemple concret
  | "comparison";     // Comparaison côte à côte (ex: CREDOC vs REMDOC)

/** Bloc de contenu au sein d'une fiche de cours */
export interface ContentBlock {
  /** Type de bloc — détermine le rendu visuel */
  type: ContentBlockType;

  /** Contenu texte principal (supporte **gras** inline) */
  content: string;

  /** Éléments de liste (pour bullet_list, numbered_list, comparison) */
  items?: string[];

  /** En-têtes de tableau (pour type: "table") */
  headers?: string[];

  /** Lignes de tableau — chaque ligne est un tableau de cellules (pour type: "table") */
  rows?: string[][];

  /** Titre/label du bloc (ex: nom de formule, terme défini) */
  label?: string;

  /** Mots-clés à mettre en évidence lors du rendu */
  keywords?: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Fiche de cours (CourseSheet)
// ─────────────────────────────────────────────────────────────────────────────

/** Fréquence d'apparition en examen BTS CI */
export type ExamFrequency = "very_high" | "high" | "medium" | "low";

/** Une fiche de cours — unité pédagogique au sein d'un module */
export interface CourseSheet {
  /** Identifiant unique, scopé au module (ex: "credoc-mecanisme") */
  id: string;

  /** Titre affiché (ex: "Le Crédit Documentaire (CREDOC)") */
  title: string;

  /** Sous-titre court pour le sommaire latéral */
  subtitle?: string;

  /** Blocs de contenu ordonnés */
  blocks: ContentBlock[];

  /** Fréquence d'apparition aux examens BTS CI */
  examFrequency: ExamFrequency;

  /** IDs de fiches liées (même module ou cross-module) */
  relatedSheets?: string[];

  /** Mots-clés pour recherche/filtrage */
  tags?: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Module de cours (CourseModule)
// ─────────────────────────────────────────────────────────────────────────────

/** Couleur thématique pour les cartes et en-têtes de module */
export type ModuleColor = "blue" | "cyan" | "indigo" | "emerald" | "amber";

/** Module de cours — conteneur de niveau supérieur */
export interface CourseModule {
  /** Identifiant unique du module */
  id: ModuleId;

  /** Numéro d'ordre (1-5) pour le tri */
  order: number;

  /** Titre du module (ex: "Logistique & Transport International") */
  title: string;

  /** Description courte pour les cartes du Dashboard */
  description: string;

  /** Nom d'icône Lucide (ex: "Truck", "Shield", "CreditCard") */
  icon: string;

  /** Couleur thématique */
  color: ModuleColor;

  /** Fiches de cours du module */
  sheets: CourseSheet[];

  /** Nombre de questions quiz disponibles (calculé au runtime ou stocké) */
  questionCount?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Progression par module (pour le store utilisateur)
// ─────────────────────────────────────────────────────────────────────────────

/** Suivi de progression d'un module pour un utilisateur */
export interface ModuleProgress {
  questionsAnswered: number;
  questionsCorrect: number;
  sheetsViewed: string[];
  lastActivityDate: string | null;
}
