/**
 * QuizQuestion.ts
 * Interfaces TypeScript pour le moteur de quiz / QCM du BTS Commerce International
 * Structure compatible avec les annales officielles BTS CI (épreuves E4/E5/E6)
 */

import type { IncotermCode } from "./Incoterm";

// ─────────────────────────────────────────────────────────────────────────────
// Énumérations
// ─────────────────────────────────────────────────────────────────────────────

/** Type de question */
export type QuestionType =
  | "MCQ"           // QCM classique (1 ou plusieurs bonnes réponses)
  | "TRUE_FALSE"    // Vrai / Faux
  | "MATCHING"      // Association (relier colonnes)
  | "CASE_STUDY"    // Étude de cas avec calcul de cascade
  | "OPEN_ENDED";   // Question ouverte (correction manuelle)

/** Niveau de difficulté académique */
export type DifficultyLevel = "EASY" | "MEDIUM" | "HARD";

/**
 * Thèmes couverts dans le référentiel BTS CI (Incoterms 2020).
 * Permet le filtrage par chapitre/compétence.
 */
export type QuizTheme =
  | "RISK_TRANSFER"        // Transfert de risques
  | "COST_TRANSFER"        // Transfert de frais
  | "CUSTOMS_OBLIGATIONS"  // Obligations douanières
  | "INSURANCE"            // Obligations d'assurance
  | "TRANSPORT_MODE"       // Modes de transport autorisés
  | "PRICE_CASCADE"        // Cascade des prix / calcul de valeur
  | "CUSTOMS_VALUE"        // Valeur en douane (base de taxation)
  | "INCOTERM_CHOICE"      // Choix de l'Incoterm adapté à une situation
  | "INCOTERM_COMPARISON"; // Comparaison entre Incoterms

// ─────────────────────────────────────────────────────────────────────────────
// Interface principale : QuizQuestion
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Représente une question de l'application INCOMASTER.
 * Conçue pour couvrir tous les types de questions rencontrés en BTS CI.
 */
export interface QuizQuestion {
  /** Identifiant unique de la question (ex : "q_cif_risk_001") */
  id: string;

  /** Type de question */
  type: QuestionType;

  /** Niveau de difficulté */
  difficulty: DifficultyLevel;

  /** Thème(s) pédagogique(s) couvert(s) par la question */
  themes: QuizTheme[];

  /**
   * Code(s) Incoterm concerné(s) par la question.
   * Vide si la question est générale (ex : question sur la définition de "lieu nommé").
   */
  relatedIncoterms: IncotermCode[];

  /** Énoncé de la question (supporte le Markdown) */
  question: string;

  /**
   * Contexte/mise en situation (pour les études de cas).
   * Ex : "Une entreprise française exporte des machines-outils vers le Brésil..."
   */
  context?: string;

  /** Options de réponse (pour QCM, Vrai/Faux, Association) */
  options?: QuizOption[];

  /**
   * Réponse(s) correcte(s).
   * - Pour MCQ : tableau d'id d'options correctes
   * - Pour CASE_STUDY : résultat numérique attendu (ex : { value: 12500.50, unit: "EUR" })
   * - Pour OPEN_ENDED : null (correction manuelle)
   */
  correctAnswer: string[] | CaseStudyAnswer | null;

  /** Explication détaillée de la correction (supporte le Markdown) */
  explanation: string;

  /**
   * Référence académique (ex : source d'une annale BTS CI officielle).
   * Permet de citer l'origine de la question pour la crédibilité.
   */
  source?: string;

  /**
   * Données numériques pour les questions de type CASE_STUDY.
   * Contient tous les paramètres nécessaires au calcul de la cascade.
   */
  caseStudyData?: CaseStudyData;
}

// ─────────────────────────────────────────────────────────────────────────────
// Types auxiliaires
// ─────────────────────────────────────────────────────────────────────────────

/** Une option de réponse dans un QCM ou une association */
export interface QuizOption {
  /** Identifiant unique de l'option dans la question (ex : "A", "B", "C", "D") */
  id: string;
  /** Texte affiché pour cette option */
  label: string;
  /** Colonne cible pour les questions de type MATCHING (optionnel) */
  matchTarget?: string;
}

/** Réponse attendue pour une étude de cas avec calcul numérique */
export interface CaseStudyAnswer {
  /** Valeur numérique attendue (arrondie selon les règles académiques) */
  value: number;
  /** Unité monétaire (ex : "EUR", "USD") */
  unit: string;
  /** Tolérance d'arrondi acceptée (ex : 0.01 pour centimes) */
  tolerance: number;
  /** Détail du calcul attendu (étapes intermédiaires) */
  breakdown: CalculationStep[];
}

/** Une étape intermédiaire dans un calcul de cascade des prix */
export interface CalculationStep {
  /** Libellé de l'étape (ex : "Prix EXW", "Fret maritime") */
  label: string;
  /** Valeur numérique de cette étape */
  value: number;
  /** Formule utilisée (notation mathématique lisible, ex : "120 000 × 1.15") */
  formula?: string;
}

/**
 * Jeu de données numériques pour une étude de cas.
 * Ces valeurs sont les "entrées" du calculateur pour une question donnée.
 */
export interface CaseStudyData {
  /** Devise des montants */
  currency: string;
  /** Coût de production unitaire */
  productionCostPerUnit?: number;
  /** Quantité */
  quantity?: number;
  /** Marge bénéficiaire (coefficient multiplicateur, ex : 1.15 pour +15%) */
  marginCoefficient?: number;
  /** Coût d'emballage export */
  exportPackagingCost?: number;
  /** Coût du transport intérieur (pays d'export) */
  inlandTransportExportCost?: number;
  /** Frais de dédouanement export */
  exportCustomsFees?: number;
  /** Fret principal */
  mainFreightCost?: number;
  /** Taux d'assurance (en pourcentage, ex : 0.8 pour 0,8%) */
  insuranceRate?: number;
  /** Frais portuaires à destination */
  destinationPortFees?: number;
  /** Droits de douane import (en pourcentage de la valeur en douane) */
  importDutyRate?: number;
  /** Frais de dédouanement import */
  importCustomsFees?: number;
  /** Incoterm de départ (pour les questions de conversion) */
  fromIncoterm?: IncotermCode;
  /** Incoterm d'arrivée (pour les questions de conversion) */
  toIncoterm?: IncotermCode;
}
