/**
 * calculatorLogic.ts
 * Moteur de calcul de la Cascade des Prix — Incoterms 2020
 *
 * Ce module contient des fonctions mathématiques PURES (sans effets de bord)
 * conformes aux règles académiques du BTS Commerce International (France)
 * et aux prescriptions de la CCI (Chambre de Commerce Internationale).
 *
 * RÉFÉRENCE ACADÉMIQUE :
 * - Règlement UE n°952/2013 (Code des Douanes de l'Union) : Art. 70-72 (Valeur en douane)
 * - ICC Incoterms® 2020
 * - Référentiel BTS Commerce International — Épreuves E4/E5
 */

import type { IncotermCode } from "../types/Incoterm";

// ─────────────────────────────────────────────────────────────────────────────
// Types & Interfaces du module Calculateur
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Paramètres d'entrée pour le calcul de la cascade complète.
 * Tous les montants sont exprimés dans la même devise (ex: EUR).
 * Les taux sont en valeur décimale (ex: 0.15 pour 15%).
 */
export interface CascadeInputs {
  /** Coût de production unitaire (ex: coût de revient usine) */
  productionCostPerUnit: number;
  /** Quantité d'unités */
  quantity: number;
  /**
   * Coefficient de marge bénéficiaire (multiplicateur).
   * Ex: 1.20 = marge de 20% sur coût de revient.
   * Formule: Prix EXW = Coût de revient total × coefficientMarge
   */
  marginCoefficient: number;
  /** Coût d'emballage adapté à l'export (total commande) */
  exportPackagingCost: number;
  /** Coût du transport intérieur de l'usine jusqu'au départ (port/aéroport/gare) */
  inlandTransportExportCost: number;
  /**
   * Frais de dédouanement à l'exportation.
   * Inclut : déclaration en douane, frais de transit, etc.
   */
  exportCustomsFees: number;
  /**
   * Frais portuaires au départ (Terminal Handling Charges départ).
   * Applicables pour FOB, CFR, CIF, et autres Incoterms maritimes.
   */
  originPortFees: number;
  /**
   * Fret principal (transport international).
   * Maritime, aérien, routier, ferroviaire selon mode de transport.
   */
  mainFreightCost: number;
  /**
   * Taux BAF — Bunker Adjustment Factor (en décimal, ex: 0.03 pour 3%).
   * S'applique sur le fret de base. Maritime uniquement.
   * Défaut : 0 si non applicable.
   */
  bafRate: number;
  /**
   * Taux CAF — Currency Adjustment Factor (en décimal, ex: 0.02 pour 2%).
   * S'applique en CASCADE sur (fret de base + BAF). Maritime uniquement.
   * ATTENTION : BAF et CAF ne sont PAS additifs.
   */
  cafRate: number;
  /**
   * Taux de la prime d'assurance transport (en décimal).
   * Ex: 0.008 pour 0,8%.
   * S'applique sur la valeur CIF/CIP majorée du coefficient de surcharge.
   */
  insuranceRate: number;
  /**
   * Coefficient de majoration de la valeur assurée (en décimal).
   * Ex: 1.10 pour +10% (standard), 1.12 pour +12%, 1.14 pour +14%, etc.
   * Couvre le bénéfice escompté de l'acheteur.
   * Défaut : 1.10 (majoration standard de 10%).
   */
  insuranceSurchargeCoeff: number;
  /** Frais portuaires à destination (THC arrivée, manutention) */
  destinationPortFees: number;
  /** Coût du déchargement à destination (DPU uniquement) */
  unloadingCost: number;
  /** Coût du transport intérieur dans le pays d'importation */
  inlandTransportImportCost: number;
  /** Frais de dédouanement à l'importation */
  importCustomsFees: number;
  /**
   * Taux des droits de douane à l'importation (en décimal).
   * Ex: 0.10 pour 10% du tarif douanier.
   * S'applique sur la valeur en douane (= valeur CIF pour l'UE).
   */
  importDutyRate: number;
}

/**
 * Résultat complet de la cascade des prix.
 * Chaque propriété représente le prix de vente franco selon un Incoterm donné.
 * Tous les montants sont en valeur totale commande (quantité incluse).
 */
export interface CascadeResult {
  /** Coût de revient total (base de calcul) */
  totalProductionCost: number;
  /** Prix EXW — Ex Works (minimum vendeur) */
  priceEXW: number;
  /** Prix FCA — Franco Transporteur */
  priceFCA: number;
  /** Prix FOB — Franco à Bord (maritime) */
  priceFOB: number;
  /** Prix CPT — Port Payé Jusqu'à (tous modes, sans assurance) */
  priceCPT: number;
  /** Prix CFR — Coût et Fret (maritime, sans assurance) */
  priceCFR: number;
  /**
   * Valeur CIF brute (avant majoration assurance).
   * = Prix FOB + Fret maritime.
   * Utilisée comme base pour la valeur en douane UE.
   */
  valueCIFBase: number;
  /**
   * Valeur à assurer (base de calcul de la prime).
   * = Valeur CIF × 1.10 (majoration de 10% pour bénéfice escompté).
   * Règle académique BTS CI absolue.
   */
  insurableValue: number;
  /** Prime d'assurance calculée */
  insurancePremium: number;
  /** Prix CIF — Coût, Assurance et Fret (maritime) */
  priceCIF: number;
  /** Prix CIP — Port Payé, Assurance Comprise (tous modes) */
  priceCIP: number;
  /**
   * Valeur en douane UE.
   * = Prix CIF au premier port d'entrée UE.
   * Base de calcul des droits de douane à l'importation.
   */
  customsValue: number;
  /** Montant des droits de douane à l'importation */
  importDutiesAmount: number;
  /** Prix DAP — Rendu au Lieu de Destination */
  priceDAP: number;
  /** Prix DPU — Rendu au Lieu de Destination Déchargé */
  priceDPU: number;
  /** Prix DDP — Rendu Droits Acquittés (maximum vendeur) */
  priceDDP: number;
}

/**
 * Détail d'une étape intermédiaire de calcul.
 * Utile pour l'affichage pédagogique de la cascade.
 */
export interface CascadeStep {
  incotermCode: IncotermCode | "BASE" | "INSURANCE" | "CUSTOMS_VALUE";
  label: string;
  cumulativeAmount: number;
  incrementAmount: number;
  formula: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Fonctions utilitaires
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Arrondit un montant à 2 décimales (précision monétaire standard).
 * Utilise la méthode "arrondi commercial" (0.5 → vers le haut).
 */
export function roundCurrency(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * Valide que tous les paramètres d'entrée sont des nombres positifs ou nuls.
 * @throws Error si un paramètre est invalide.
 */
export function validateInputs(inputs: CascadeInputs): void {
  const errors: string[] = [];

  if (inputs.productionCostPerUnit <= 0)
    errors.push("Le coût de production unitaire doit être positif.");
  if (inputs.quantity <= 0)
    errors.push("La quantité doit être un entier positif.");
  if (inputs.marginCoefficient < 1)
    errors.push("Le coefficient de marge doit être ≥ 1 (ex: 1.20 pour +20%).");
  if (inputs.insuranceRate < 0 || inputs.insuranceRate > 0.2)
    errors.push("Le taux d'assurance doit être compris entre 0 et 20%.");
  if (inputs.insuranceSurchargeCoeff < 1 || inputs.insuranceSurchargeCoeff > 1.5)
    errors.push("Le coefficient de majoration assurance doit être entre 1.00 et 1.50 (ex: 1.10 pour +10%).");
  if (inputs.bafRate < 0 || inputs.bafRate > 0.5)
    errors.push("Le taux BAF doit être compris entre 0 et 50%.");
  if (inputs.cafRate < 0 || inputs.cafRate > 0.5)
    errors.push("Le taux CAF doit être compris entre 0 et 50%.");
  if (inputs.importDutyRate < 0 || inputs.importDutyRate > 2)
    errors.push("Le taux des droits de douane doit être compris entre 0 et 200%.");

  const nonNegativeFields: Array<keyof CascadeInputs> = [
    "exportPackagingCost",
    "inlandTransportExportCost",
    "exportCustomsFees",
    "originPortFees",
    "mainFreightCost",
    "destinationPortFees",
    "unloadingCost",
    "inlandTransportImportCost",
    "importCustomsFees",
  ];

  for (const field of nonNegativeFields) {
    if ((inputs[field] as number) < 0) {
      errors.push(`Le champ '${field}' ne peut pas être négatif.`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Paramètres invalides :\n${errors.join("\n")}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Calculs atomiques (fonctions pures)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcule le coût de revient total de la commande.
 * @param productionCostPerUnit - Coût unitaire de production
 * @param quantity - Nombre d'unités
 * @returns Coût de revient total
 */
export function calcProductionCost(
  productionCostPerUnit: number,
  quantity: number
): number {
  return roundCurrency(productionCostPerUnit * quantity);
}

/**
 * Calcule le prix EXW (Ex Works).
 *
 * FORMULE : Prix EXW = Coût de revient total × coefficient de marge
 *
 * Le prix EXW représente le prix de vente minimum du vendeur.
 * Il inclut uniquement le coût de production et la marge bénéficiaire.
 *
 * @param totalProductionCost - Coût de revient total commande
 * @param marginCoefficient   - Coefficient multiplicateur de marge (ex: 1.15)
 * @returns Prix EXW
 */
export function calcPriceEXW(
  totalProductionCost: number,
  marginCoefficient: number
): number {
  return roundCurrency(totalProductionCost * marginCoefficient);
}

/**
 * Calcule le prix FCA (Free Carrier).
 *
 * FORMULE : Prix FCA = Prix EXW
 *                    + Emballage export
 *                    + Transport intérieur export
 *                    + Frais de dédouanement export
 *
 * @param priceEXW                    - Prix EXW calculé
 * @param exportPackagingCost         - Coût emballage export
 * @param inlandTransportExportCost   - Fret intérieur pays export
 * @param exportCustomsFees           - Frais douaniers export
 * @returns Prix FCA
 */
export function calcPriceFCA(
  priceEXW: number,
  exportPackagingCost: number,
  inlandTransportExportCost: number,
  exportCustomsFees: number
): number {
  return roundCurrency(
    priceEXW + exportPackagingCost + inlandTransportExportCost + exportCustomsFees
  );
}

/**
 * Calcule le prix FOB (Free On Board) — maritime uniquement.
 *
 * FORMULE : Prix FOB = Prix FCA + Frais portuaires départ (THC départ)
 *
 * Le prix FOB inclut les frais de mise à bord au port d'embarquement.
 *
 * @param priceFCA       - Prix FCA calculé
 * @param originPortFees - THC départ et frais portuaires d'embarquement
 * @returns Prix FOB
 */
export function calcPriceFOB(
  priceFCA: number,
  originPortFees: number
): number {
  return roundCurrency(priceFCA + originPortFees);
}

/**
 * Calcule le prix CPT (Carriage Paid To) — tous modes de transport.
 *
 * FORMULE : Prix CPT = Prix FCA + Fret principal
 *
 * Note : CPT est l'équivalent tous modes de CFR.
 * Pour CPT, les frais portuaires peuvent être inclus dans le fret selon contrat.
 * Ici, on suppose que le fret inclut les THC départ (cas standard multimodal).
 *
 * @param priceFCA       - Prix FCA calculé
 * @param mainFreightCost - Fret principal (international)
 * @returns Prix CPT
 */
export function calcPriceCPT(
  priceFCA: number,
  mainFreightCost: number
): number {
  return roundCurrency(priceFCA + mainFreightCost);
}

/**
 * Calcule le prix CFR (Cost and Freight) — maritime uniquement.
 *
 * FORMULE : Prix CFR = Prix FOB + Fret maritime
 *
 * @param priceFOB        - Prix FOB calculé
 * @param mainFreightCost - Fret maritime principal
 * @returns Prix CFR
 */
export function calcPriceCFR(
  priceFOB: number,
  mainFreightCost: number
): number {
  return roundCurrency(priceFOB + mainFreightCost);
}

/**
 * Calcule le fret total avec surcharges BAF et CAF en cascade.
 *
 * RÈGLE CRITIQUE (Examen BTS CI — Transport Maritime) :
 *   Les surcharges BAF et CAF ne sont PAS additives.
 *   BAF s'applique sur le fret de base,
 *   puis CAF s'applique sur (Fret de base + BAF).
 *
 * Exemple : Fret = 9 300, BAF = 3%, CAF = 2%
 *   BAF = 9 300 × 0,03 = 279
 *   Sous-total = 9 300 + 279 = 9 579
 *   CAF = 9 579 × 0,02 = 191,58
 *   Fret total = 9 300 + 279 + 191,58 = 9 770,58
 *
 * @param baseFreight - Fret de base (transport principal)
 * @param bafRate     - Taux BAF (décimal, ex: 0.03 pour 3%)
 * @param cafRate     - Taux CAF (décimal, ex: 0.02 pour 2%)
 * @returns Fret total après surcharges
 */
export function calcFreightWithSurcharges(
  baseFreight: number,
  bafRate: number,
  cafRate: number
): number {
  const baf = roundCurrency(baseFreight * bafRate);
  const subtotal = baseFreight + baf;
  const caf = roundCurrency(subtotal * cafRate);
  return roundCurrency(baseFreight + baf + caf);
}

/**
 * Calcule le prix CIF/CIP exact avec la FORMULE CIRCULAIRE.
 *
 * FORMULE EXACTE (conforme aux annales BTS CI) :
 *   CIF = CFR / (1 - coeff × taux)
 *
 * Dérivation :
 *   CIF = CFR + Assurance
 *   Assurance = CIF × coeff × taux  (formule circulaire)
 *   CIF = CFR + CIF × coeff × taux
 *   CIF - CIF × coeff × taux = CFR
 *   CIF × (1 - coeff × taux) = CFR
 *   CIF = CFR / (1 - coeff × taux)
 *
 * @param priceBeforeInsurance - Prix CFR (maritime) ou CPT (multimodal)
 * @param insuranceRate        - Taux d'assurance (décimal, ex: 0.005 pour 0,5%)
 * @param surchargeCoeff       - Coefficient de majoration (ex: 1.10 pour +10%)
 * @returns { priceCIForCIP, insurancePremium, insurableValue }
 */
export function calcExactInsurance(
  priceBeforeInsurance: number,
  insuranceRate: number,
  surchargeCoeff: number
): { priceCIForCIP: number; insurancePremium: number; insurableValue: number } {
  if (insuranceRate === 0) {
    return {
      priceCIForCIP: roundCurrency(priceBeforeInsurance),
      insurancePremium: 0,
      insurableValue: roundCurrency(priceBeforeInsurance * surchargeCoeff),
    };
  }
  const divider = Math.max(0.001, 1 - surchargeCoeff * insuranceRate);
  const priceCIForCIP = roundCurrency(priceBeforeInsurance / divider);
  const insurancePremium = roundCurrency(priceCIForCIP - priceBeforeInsurance);
  const insurableValue = roundCurrency(priceCIForCIP * surchargeCoeff);
  return { priceCIForCIP, insurancePremium, insurableValue };
}

/**
 * Calcule le prix CIF (Cost Insurance and Freight) — maritime uniquement.
 *
 * FORMULE : Prix CIF = Prix CFR + Prime d'assurance
 *
 * Rappel : le prix CIF sert de BASE pour le calcul de la valeur en douane UE.
 *
 * @param priceCFR         - Prix CFR calculé
 * @param insurancePremium - Prime d'assurance calculée
 * @returns Prix CIF
 */
export function calcPriceCIF(
  priceCFR: number,
  insurancePremium: number
): number {
  return roundCurrency(priceCFR + insurancePremium);
}

/**
 * Calcule le prix CIP (Carriage and Insurance Paid To) — tous modes.
 *
 * FORMULE : Prix CIP = Prix CPT + Prime d'assurance
 *
 * Note : CIP est l'équivalent tous modes de CIF.
 * En 2020, l'assurance CIP est de niveau ICC(A) — Toutes risques (contre ICC(C) pour CIF).
 *
 * @param priceCPT         - Prix CPT calculé
 * @param insurancePremium - Prime d'assurance calculée
 * @returns Prix CIP
 */
export function calcPriceCIP(
  priceCPT: number,
  insurancePremium: number
): number {
  return roundCurrency(priceCPT + insurancePremium);
}

/**
 * Calcule la valeur en douane de l'Union Européenne.
 *
 * RÈGLE LÉGALE (Art. 70 CDU - Code des Douanes de l'Union) :
 *   Valeur en douane UE = Valeur transactionnelle CIF au premier point d'entrée UE
 *   = Prix de la marchandise + Fret + Assurance (jusqu'au premier point d'entrée UE)
 *
 * C'est la BASE de calcul des droits de douane à l'importation dans l'UE.
 *
 * IMPORTANT : Pour les Incoterms "D" (DAP, DPU, DDP), la valeur en douane
 * est recalculée en retranchant les frais post-frontière UE si le lieu de
 * livraison est à l'intérieur de l'UE. En pratique BTS CI, on utilise CIF
 * au premier port UE comme valeur en douane.
 *
 * @param priceCIF - Prix CIF au premier port d'entrée de l'UE
 * @returns Valeur en douane
 */
export function calcCustomsValue(priceCIF: number): number {
  // La valeur en douane UE = Prix CIF au premier port d'entrée UE
  // (méthode de la valeur transactionnelle, Art. 70 CDU)
  return roundCurrency(priceCIF);
}

/**
 * Calcule le montant des droits de douane à l'importation.
 *
 * FORMULE : Droits de douane = Valeur en douane × Taux du tarif douanier (TDC)
 *
 * Le taux est issu du Tarif Douanier Commun (TDC) pour l'UE,
 * consultable via TARIC (Tarif Intégré des Communautés Européennes).
 *
 * @param customsValue   - Valeur en douane calculée
 * @param importDutyRate - Taux du TDC (ex: 0.065 pour 6,5%)
 * @returns Montant des droits de douane
 */
export function calcImportDuties(
  customsValue: number,
  importDutyRate: number
): number {
  return roundCurrency(customsValue * importDutyRate);
}

/**
 * Calcule le prix DAP (Delivered At Place).
 *
 * FORMULE : Prix DAP = Prix CIF
 *                    + Frais portuaires destination
 *                    + Transport intérieur import
 *
 * Note : Le déchargement et le dédouanement import restent à la charge de l'acheteur.
 *
 * @param priceCIF                   - Prix CIF calculé
 * @param destinationPortFees        - THC arrivée et frais portuaires à destination
 * @param inlandTransportImportCost  - Transport du port vers entrepôt/client
 * @returns Prix DAP
 */
export function calcPriceDAP(
  priceCIF: number,
  destinationPortFees: number,
  inlandTransportImportCost: number
): number {
  return roundCurrency(priceCIF + destinationPortFees + inlandTransportImportCost);
}

/**
 * Calcule le prix DPU (Delivered at Place Unloaded).
 *
 * FORMULE : Prix DPU = Prix DAP + Frais de déchargement
 *
 * DPU est le SEUL Incoterm où le risque se transfère après déchargement.
 * Le vendeur prend en charge le déchargement à destination.
 *
 * @param priceDAP      - Prix DAP calculé
 * @param unloadingCost - Coût du déchargement au lieu de destination
 * @returns Prix DPU
 */
export function calcPriceDPU(
  priceDAP: number,
  unloadingCost: number
): number {
  return roundCurrency(priceDAP + unloadingCost);
}

/**
 * Calcule le prix DDP (Delivered Duty Paid).
 *
 * FORMULE : Prix DDP = Prix DAP + Frais dédouanement import + Droits de douane
 *
 * DDP représente le MAXIMUM d'obligations pour le vendeur.
 * Le vendeur supporte tous les frais jusqu'à la livraison, y compris les droits de douane.
 *
 * Note : Le déchargement reste à la charge de l'acheteur en DDP.
 * Note : La TVA à l'importation est généralement incluse en DDP,
 *        sauf mention contraire dans le contrat ("DDP hors TVA").
 *
 * @param priceDAP         - Prix DAP calculé
 * @param importCustomsFees - Frais de dédouanement import (honoraires transitaire)
 * @param importDutiesAmount - Montant des droits de douane
 * @returns Prix DDP
 */
export function calcPriceDDP(
  priceDAP: number,
  importCustomsFees: number,
  importDutiesAmount: number
): number {
  return roundCurrency(priceDAP + importCustomsFees + importDutiesAmount);
}

// ─────────────────────────────────────────────────────────────────────────────
// Fonction principale : calcul de la cascade complète
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcule la cascade complète des prix pour tous les Incoterms 2020.
 *
 * Cette fonction orchestre tous les calculs atomiques dans l'ordre de la cascade,
 * du prix EXW (minimum vendeur) au prix DDP (maximum vendeur).
 *
 * ORDRE DE LA CASCADE (BTS CI) :
 *   EXW → FCA → FOB / FCA → CPT/CIF → DAP → DPU → DDP
 *
 * @param inputs - Paramètres d'entrée validés
 * @returns Résultat complet avec tous les prix Incoterms et valeurs intermédiaires
 * @throws Error si les paramètres d'entrée sont invalides
 */
export function calculateFullCascade(inputs: CascadeInputs): CascadeResult {
  // 1. Validation des entrées
  validateInputs(inputs);

  // 2. BASE : Coût de revient total
  const totalProductionCost = calcProductionCost(
    inputs.productionCostPerUnit,
    inputs.quantity
  );

  // 3. GROUPE E : Prix EXW
  const priceEXW = calcPriceEXW(totalProductionCost, inputs.marginCoefficient);

  // 4. GROUPE F : Prix FCA (tous modes), FOB (maritime)
  const priceFCA = calcPriceFCA(
    priceEXW,
    inputs.exportPackagingCost,
    inputs.inlandTransportExportCost,
    inputs.exportCustomsFees
  );

  const priceFOB = calcPriceFOB(priceFCA, inputs.originPortFees);

  // 5. GROUPE C (sans assurance) : CPT (tous modes), CFR (maritime)
  // Fret total = fret de base + surcharges BAF/CAF en cascade
  const totalFreight = calcFreightWithSurcharges(
    inputs.mainFreightCost,
    inputs.bafRate,
    inputs.cafRate
  );
  const priceCPT = calcPriceCPT(priceFCA, totalFreight);
  const priceCFR = calcPriceCFR(priceFOB, totalFreight);

  // 6. CALCUL ASSURANCE — FORMULE EXACTE CIRCULAIRE
  // CIF = CFR / (1 - coeff × taux)  (conforme annales BTS CI)
  const surchargeCoeff = inputs.insuranceSurchargeCoeff;
  const cifResult = calcExactInsurance(priceCFR, inputs.insuranceRate, surchargeCoeff);
  const cipResult = calcExactInsurance(priceCPT, inputs.insuranceRate, surchargeCoeff);

  const valueCIFBase = priceCFR;
  const insurableValue = cifResult.insurableValue;
  const insurancePremium = cifResult.insurancePremium;

  // 7. GROUPE C (avec assurance) : CIF (maritime), CIP (tous modes)
  const priceCIF = cifResult.priceCIForCIP;
  const priceCIP = cipResult.priceCIForCIP;

  // 8. VALEUR EN DOUANE (UE)
  // Base légale : Art. 70 CDU — valeur CIF au premier port d'entrée UE
  const customsValue = calcCustomsValue(priceCIF);
  const importDutiesAmount = calcImportDuties(customsValue, inputs.importDutyRate);

  // 9. GROUPE D : DAP, DPU, DDP
  const priceDAP = calcPriceDAP(
    priceCIF,
    inputs.destinationPortFees,
    inputs.inlandTransportImportCost
  );

  const priceDPU = calcPriceDPU(priceDAP, inputs.unloadingCost);

  const priceDDP = calcPriceDDP(
    priceDAP,
    inputs.importCustomsFees,
    importDutiesAmount
  );

  return {
    totalProductionCost,
    priceEXW,
    priceFCA,
    priceFOB,
    priceCPT,
    priceCFR,
    valueCIFBase,
    insurableValue,
    insurancePremium,
    priceCIF,
    priceCIP,
    customsValue,
    importDutiesAmount,
    priceDAP,
    priceDPU,
    priceDDP,
  };
}

/**
 * Génère le détail pédagogique de la cascade (étapes numérotées avec formules).
 * Utile pour afficher la progression pas à pas à l'étudiant.
 *
 * @param inputs  - Paramètres d'entrée
 * @param result  - Résultat de calculateFullCascade
 * @returns Tableau d'étapes ordonnées avec formules et montants
 */
export function buildCascadeSteps(
  inputs: CascadeInputs,
  result: CascadeResult
): CascadeStep[] {
  return [
    {
      incotermCode: "BASE",
      label: "Coût de revient total",
      cumulativeAmount: result.totalProductionCost,
      incrementAmount: result.totalProductionCost,
      formula: `${inputs.productionCostPerUnit} × ${inputs.quantity} unités`,
    },
    {
      incotermCode: "EXW",
      label: "Prix EXW (Ex Works)",
      cumulativeAmount: result.priceEXW,
      incrementAmount: roundCurrency(result.priceEXW - result.totalProductionCost),
      formula: `${result.totalProductionCost} × ${inputs.marginCoefficient} (marge)`,
    },
    {
      incotermCode: "FCA",
      label: "Prix FCA (Franco Transporteur)",
      cumulativeAmount: result.priceFCA,
      incrementAmount: roundCurrency(result.priceFCA - result.priceEXW),
      formula: `${result.priceEXW} + ${inputs.exportPackagingCost} (emballage) + ${inputs.inlandTransportExportCost} (transport int.) + ${inputs.exportCustomsFees} (douane export)`,
    },
    {
      incotermCode: "FOB",
      label: "Prix FOB (Franco à Bord — maritime)",
      cumulativeAmount: result.priceFOB,
      incrementAmount: roundCurrency(result.priceFOB - result.priceFCA),
      formula: `${result.priceFCA} + ${inputs.originPortFees} (THC départ)`,
    },
    {
      incotermCode: "CFR",
      label: "Prix CFR (Coût et Fret — maritime)",
      cumulativeAmount: result.priceCFR,
      incrementAmount: roundCurrency(result.priceCFR - result.priceFOB),
      formula: `${result.priceFOB} + ${inputs.mainFreightCost} (fret maritime)`,
    },
    {
      incotermCode: "INSURANCE",
      label: "Prime d'assurance",
      cumulativeAmount: result.insurancePremium,
      incrementAmount: result.insurancePremium,
      formula: `CIF = ${result.valueCIFBase} / (1 - ${inputs.insuranceSurchargeCoeff} × ${(inputs.insuranceRate * 100).toFixed(3)}%) = ${result.priceCIF} → Prime = ${result.insurancePremium}`,
    },
    {
      incotermCode: "CIF",
      label: "Prix CIF (Coût, Assurance, Fret — maritime)",
      cumulativeAmount: result.priceCIF,
      incrementAmount: roundCurrency(result.priceCIF - result.priceCFR),
      formula: `${result.priceCFR} / (1 - ${inputs.insuranceSurchargeCoeff} × ${inputs.insuranceRate}) = ${result.priceCIF}`,
    },
    {
      incotermCode: "CUSTOMS_VALUE",
      label: "Valeur en douane UE (= Prix CIF au premier port UE)",
      cumulativeAmount: result.customsValue,
      incrementAmount: 0,
      formula: `= ${result.priceCIF} (Art. 70 CDU — valeur transactionnelle CIF)`,
    },
    {
      incotermCode: "DAP",
      label: "Prix DAP (Rendu au Lieu de Destination)",
      cumulativeAmount: result.priceDAP,
      incrementAmount: roundCurrency(result.priceDAP - result.priceCIF),
      formula: `${result.priceCIF} + ${inputs.destinationPortFees} (THC dest.) + ${inputs.inlandTransportImportCost} (transport int. import)`,
    },
    {
      incotermCode: "DPU",
      label: "Prix DPU (Rendu Lieu de Destination Déchargé)",
      cumulativeAmount: result.priceDPU,
      incrementAmount: roundCurrency(result.priceDPU - result.priceDAP),
      formula: `${result.priceDAP} + ${inputs.unloadingCost} (déchargement)`,
    },
    {
      incotermCode: "DDP",
      label: "Prix DDP (Rendu Droits Acquittés)",
      cumulativeAmount: result.priceDDP,
      incrementAmount: roundCurrency(result.priceDDP - result.priceDAP),
      formula: `${result.priceDAP} + ${inputs.importCustomsFees} (douane import) + ${result.importDutiesAmount} (droits douane = ${result.customsValue} × ${(inputs.importDutyRate * 100).toFixed(1)}%)`,
    },
  ];
}

/**
 * Convertit un prix d'un Incoterm vers un autre en ajoutant ou retranchant les composantes.
 *
 * USAGE : Permet de répondre aux questions de type "Convertissez ce prix FOB en prix CIF".
 *
 * @param fromPrice      - Prix de départ (Incoterm source)
 * @param fromIncoterm   - Code Incoterm source
 * @param toIncoterm     - Code Incoterm cible
 * @param inputs         - Coûts des composantes intermédiaires
 * @returns Prix converti ou null si la conversion n'est pas directement calculable
 */
export function convertIncotermPrice(
  fromPrice: number,
  fromIncoterm: IncotermCode,
  toIncoterm: IncotermCode,
  inputs: Partial<CascadeInputs>
): number | null {
  // Recalcul partiel selon la route de conversion demandée
  // Conversions courantes en exercices BTS CI

  if (fromIncoterm === "FOB" && toIncoterm === "CFR") {
    if (inputs.mainFreightCost === undefined) return null;
    return roundCurrency(fromPrice + inputs.mainFreightCost);
  }

  if (fromIncoterm === "FOB" && toIncoterm === "CIF") {
    if (inputs.mainFreightCost === undefined || inputs.insuranceRate === undefined) return null;
    const coeff = inputs.insuranceSurchargeCoeff ?? 1.10;
    const cfr = fromPrice + inputs.mainFreightCost;
    const divider = Math.max(0.001, 1 - coeff * inputs.insuranceRate);
    return roundCurrency(cfr / divider);
  }

  if (fromIncoterm === "CFR" && toIncoterm === "CIF") {
    if (inputs.insuranceRate === undefined) return null;
    const coeff = inputs.insuranceSurchargeCoeff ?? 1.10;
    const divider = Math.max(0.001, 1 - coeff * inputs.insuranceRate);
    return roundCurrency(fromPrice / divider);
  }

  if (fromIncoterm === "CIF" && toIncoterm === "DAP") {
    if (inputs.destinationPortFees === undefined || inputs.inlandTransportImportCost === undefined) return null;
    return roundCurrency(fromPrice + inputs.destinationPortFees + inputs.inlandTransportImportCost);
  }

  if (fromIncoterm === "CIF" && toIncoterm === "DDP") {
    if (
      inputs.destinationPortFees === undefined ||
      inputs.inlandTransportImportCost === undefined ||
      inputs.importCustomsFees === undefined ||
      inputs.importDutyRate === undefined
    ) return null;
    const dap = fromPrice + inputs.destinationPortFees + inputs.inlandTransportImportCost;
    const duties = roundCurrency(fromPrice * inputs.importDutyRate); // valeur en douane ≈ CIF
    return roundCurrency(dap + (inputs.importCustomsFees) + duties);
  }

  // Conversion non prise en charge directement
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// SPRINT BACKEND v2 — Moteur de calcul expert standalone (BTS CI strict)
// ─────────────────────────────────────────────────────────────────────────────

/** Arrondi bancaire à 2 décimales (évite les flottants JS) */
const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

// ── Interface d'entrée ──────────────────────────────────────────────────────

export interface IncotermsInput {
  /** Mode de transport */
  mode: 'MARITIME' | 'MULTIMODAL';

  // ── Coûts de base (Devise 1) ──
  /** Valeur de la marchandise (coût de revient, prix catalogue…) */
  valeurMarchandise: number;
  /** Emballage adapté à l'export */
  emballageExport: number;

  // ── Frais de dédouanement & pré-acheminement (Devise 1) ──
  /** Dédouanement export + pré-acheminement (ou séparés si besoin) */
  dedouanementPreAch: number;

  // ── Frais annexes départ — Maritime uniquement (Devise 1) ──
  /** Entreposage portuaire */
  entreposage?: number;
  /** Frais de mise à bord (THC départ, manutention…) */
  miseABord?: number;

  /**
   * Frais documentaires (B/L, LTA, etc.).
   * NE font PAS partie du FOB.
   * S'ajoutent au CFR APRÈS le fret (hors BAF/CAF).
   * La devise dépend de `isBilledInBaseCurrency`.
   */
  fraisDocumentaires?: number;
  /**
   * Si VRAI (défaut), les frais documentaires sont en Devise 1 (base)
   * et seront automatiquement convertis via tauxChange.
   * Si FAUX, les frais sont déjà saisis en Devise 2 (devise d'arrivée).
   * N'a d'effet que si `isCurrencyConverted === true`.
   */
  isBilledInBaseCurrency?: boolean;
  /**
   * @deprecated Utiliser `fraisDocumentaires` à la place.
   * Conservé comme alias rétro-compatible : si `fraisDocumentaires` n'est
   * pas fourni, la valeur de `fraisBL` sera utilisée à sa place.
   */
  fraisBL?: number;

  // ── Conversion de devises ──
  /** Taux de change : 1 Devise 1 = X Devise 2 (défaut 1) */
  tauxChange?: number;
  /**
   * Active la conversion de devise.
   * Si FAUX (défaut), tauxChange est ignoré et baseConvertie = base.
   * Si VRAI, baseConvertie = base × tauxChange.
   */
  isCurrencyConverted?: boolean;

  // ── Fret principal (Devise 2) ──
  /** Fret de base (dans la devise cible) */
  fretBase: number;

  // ── Surcharges maritimes (%) ──
  /** BAF — Bunker Adjustment Factor (ex: 3 pour 3%) */
  bafPct?: number;
  /** CAF — Currency Adjustment Factor (ex: 2 pour 2%) */
  cafPct?: number;

  // ── Assurance (%) ──
  /** Taux d'assurance (ex: 1 pour 1%) */
  tauxAssurancePct: number;
  /** Majoration d'assurance (ex: 12 pour +12%, soit coefficient 1.12) */
  majorationAssurancePct: number;
  /**
   * Méthode de calcul de l'assurance.
   * - VRAI (défaut) = Formule circulaire CCI :
   *     CIF = CFR / (1 - coeff × taux)
   *     Assurance = CIF - CFR
   * - FAUX = Formule linéaire (exception d'examen) :
   *     Assurance = CFR × coeff × taux
   *     CIF = CFR + Assurance
   */
  isInsuranceCircular?: boolean;

  // ── Frais d'arrivée (Devise 2) — Optionnel ──
  /** Post-acheminement intérieur destination */
  postAcheminement?: number;
  /** Frais de déchargement destination */
  dechargementDestination?: number;
  /** Droits de douane import + frais dédouanement */
  douaneImport?: number;
}

// ── Interface de sortie ─────────────────────────────────────────────────────

export interface IncotermsResult {
  // ── Devise 1 ──
  exw: number;
  fca: number;
  /** Maritime uniquement */
  fob: number;

  // ── Point de conversion ──
  tauxChange: number;
  isCurrencyConverted: boolean;
  /** FOB (maritime) ou FCA (multimodal) converti en Devise 2 */
  baseConvertie: number;

  // ── Devise 2 ──
  /** Détail du fret **/
  fretBase: number;
  bafAmount: number;
  cafAmount: number;
  fretTotal: number;

  /** Frais documentaires (B/L, LTA…) ajoutés au CFR hors BAF/CAF */
  fraisDocumentaires: number;
  /** Frais documentaires convertis en Devise 2 (après conversion si applicable) */
  fraisDocumentairesConverted: number;
  /** Les frais doc sont-ils facturés en devise de base ? */
  isBilledInBaseCurrency: boolean;

  cfr: number;
  /** Méthode d'assurance utilisée */
  isInsuranceCircular: boolean;
  assurance: number;
  cif: number;

  /** Multimodal aliases */
  cpt: number;
  cip: number;

  // ── Frais arrivée (Devise 2) — si fournis ──
  dap: number;
  dpu: number;
  ddp: number;
}

/**
 * Calcule la cascade complète des Incoterms 2020.
 *
 * RÈGLES MATHÉMATIQUES (BTS CI strict — v2) :
 *
 * 1. EXW = Valeur + Emballage
 * 2. FCA = EXW + Dédouanement/Pré-acheminement
 * 3. FOB = FCA + Entreposage + Mise à Bord  (maritime)
 *    ⚠ B/L (frais documentaires) n'est PLUS dans le FOB.
 *
 * 4. Conversion : si isCurrencyConverted → base × tauxChange ; sinon = base
 *
 * 5. Fret Maritime Total :
 *    BAF_Amount = Fret de base × (BAF% / 100)
 *    CAF_Amount = (Fret de base + BAF_Amount) × (CAF% / 100)
 *    Fret_Total = Fret de base + BAF_Amount + CAF_Amount
 *
 * 6. CFR = Base convertie + Fret_Total + Frais documentaires
 *    ⚠ Les frais documentaires ne subissent PAS la BAF/CAF.
 *
 * 7. Assurance (double méthode) :
 *    a) Circulaire CCI (défaut) :
 *       CIF = CFR / (1 - coeff × taux)
 *       Assurance = CIF - CFR
 *    b) Linéaire (exception examen) :
 *       Assurance = CFR × coeff × taux
 *       CIF = CFR + Assurance
 *
 * 8. DAP / DPU / DDP en cascade
 */
export function calculateIncoterms(input: IncotermsInput): IncotermsResult {
  // ── Valeurs par défaut ──
  const tc = input.tauxChange ?? 1;
  const isCurrencyConverted = input.isCurrencyConverted ?? false;
  const isInsuranceCircular = input.isInsuranceCircular ?? true;
  const isBilledInBaseCurrency = input.isBilledInBaseCurrency ?? true;
  const entreposage = input.entreposage ?? 0;
  const miseABord = input.miseABord ?? 0;
  // Rétro-compatibilité : fraisDocumentaires a priorité sur fraisBL
  const fraisDocumentaires = input.fraisDocumentaires ?? input.fraisBL ?? 0;
  const bafPct = input.bafPct ?? 0;
  const cafPct = input.cafPct ?? 0;
  const postAch = input.postAcheminement ?? 0;
  const dechargement = input.dechargementDestination ?? 0;
  const douaneImp = input.douaneImport ?? 0;

  // ═══════════════════════════════════════
  // ÉTAPE 1 — EXW (Devise 1)
  // ═══════════════════════════════════════
  const exw = round2(input.valeurMarchandise + input.emballageExport);

  // ═══════════════════════════════════════
  // ÉTAPE 2 — FCA (Devise 1)
  // ═══════════════════════════════════════
  const fca = round2(exw + input.dedouanementPreAch);

  // ═══════════════════════════════════════
  // ÉTAPE 3 — FOB (Maritime, Devise 1)
  // Le B/L NE fait PLUS partie du FOB.
  // ═══════════════════════════════════════
  let fob = 0;
  if (input.mode === 'MARITIME') {
    fob = round2(fca + entreposage + miseABord);
  }

  // ═══════════════════════════════════════
  // ÉTAPE 4 — BASCULE DE DEVISE
  // Conditionnelle : uniquement si isCurrencyConverted === true
  // ═══════════════════════════════════════
  const baseDevise1 = input.mode === 'MARITIME' ? fob : fca;
  const baseConvertie = isCurrencyConverted
    ? round2(baseDevise1 * tc)
    : baseDevise1;

  // ═══════════════════════════════════════
  // ÉTAPE 5 — Fret + Surcharges (Devise 2)
  // BAF sur fret de base, puis CAF sur (fret + BAF)
  // ═══════════════════════════════════════
  const bafAmount = round2(input.fretBase * (bafPct / 100));
  const fretCorrigeBaf = round2(input.fretBase + bafAmount);
  const cafAmount = round2(fretCorrigeBaf * (cafPct / 100));
  const fretTotal = round2(input.fretBase + bafAmount + cafAmount);

  // ═══════════════════════════════════════
  // ÉTAPE 6 — CFR / CPT (Devise 2)
  // Frais documentaires ajoutés ICI, hors BAF/CAF.
  // Si isCurrencyConverted ET isBilledInBaseCurrency : conversion des frais doc.
  // ═══════════════════════════════════════
  const fraisDocConverted = (isCurrencyConverted && isBilledInBaseCurrency)
    ? round2(fraisDocumentaires * tc)
    : fraisDocumentaires;
  const cfr = round2(baseConvertie + fretTotal + fraisDocConverted);

  // ═══════════════════════════════════════
  // ÉTAPE 7 — ASSURANCE (Double méthode)
  // ═══════════════════════════════════════
  const coeffMaj = 1 + input.majorationAssurancePct / 100;
  const tauxAss = input.tauxAssurancePct / 100;

  let assurance: number;
  let cif: number;

  if (isInsuranceCircular) {
    // ── Méthode circulaire CCI (défaut) ──
    // CIF = CFR / (1 - coeff × taux)
    // Assurance = CIF - CFR
    const diviseur = Math.max(0.0001, 1 - coeffMaj * tauxAss);
    cif = round2(cfr / diviseur);
    assurance = round2(cif - cfr);
  } else {
    // ── Méthode linéaire (exception d'examen) ──
    // Assurance = CFR × coeff × taux
    // CIF = CFR + Assurance
    assurance = round2(cfr * coeffMaj * tauxAss);
    cif = round2(cfr + assurance);
  }

  // ═══════════════════════════════════════
  // ÉTAPES 8-10 — DAP / DPU / DDP (Devise 2)
  // ═══════════════════════════════════════
  const dap = round2(cif + postAch);
  const dpu = round2(dap + dechargement);
  const ddp = round2(dpu + douaneImp);

  return {
    exw,
    fca,
    fob,
    tauxChange: isCurrencyConverted ? tc : 1,
    isCurrencyConverted,
    baseConvertie,
    fretBase: input.fretBase,
    bafAmount,
    cafAmount,
    fretTotal,
    fraisDocumentaires,
    fraisDocumentairesConverted: fraisDocConverted,
    isBilledInBaseCurrency,
    cfr,
    isInsuranceCircular,
    assurance,
    cif,
    cpt: input.mode === 'MULTIMODAL' ? cfr : 0,
    cip: input.mode === 'MULTIMODAL' ? cif : 0,
    dap,
    dpu,
    ddp,
  };
}
