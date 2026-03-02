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
   * Taux de la prime d'assurance transport (en décimal).
   * Ex: 0.008 pour 0,8%.
   * ATTENTION : s'applique sur la valeur CIF/CIP majorée de 10%.
   */
  insuranceRate: number;
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
 * Calcule la valeur à assurer selon la règle académique BTS CI.
 *
 * FORMULE BTS CI (RÈGLE ABSOLUE) :
 *   Valeur à assurer = Valeur CIF × (1 + 0,10)
 *                    = Valeur CIF × 1,10
 *
 * La majoration de 10% représente le bénéfice escompté (profit margin)
 * que l'acheteur perdrait en cas de sinistre. Elle garantit que l'acheteur
 * est intégralement indemnisé, y compris son profit attendu.
 *
 * SOURCE : Art. 128 du Code des Douanes de l'Union (CDU) et usage commercial
 * international. Formule exigée aux épreuves BTS CI.
 *
 * @param valueCIFBase - Valeur CIF de base (marchandise + fret + assurance NON incluse)
 * @returns Valeur à assurer (base de calcul de la prime)
 */
export function calcInsurableValue(valueCIFBase: number): number {
  const PROFIT_MARGIN_FACTOR = 1.10;
  return roundCurrency(valueCIFBase * PROFIT_MARGIN_FACTOR);
}

/**
 * Calcule la prime d'assurance transport.
 *
 * FORMULE :
 *   Prime d'assurance = Valeur à assurer × Taux d'assurance
 *                     = (Valeur CIF × 1,10) × taux
 *
 * FORMULE DÉVELOPPÉE (telle qu'attendue en examen BTS CI) :
 *   Valeur CIF finale = Valeur FOB + Fret + (Valeur CIF × 1,10 × taux)
 *
 * Cette formule est circulaire (CIF apparaît des deux côtés).
 * La résolution algébrique donne :
 *   CIF = (FOB + Fret) / (1 - 1,10 × taux)
 *
 * En pratique BTS CI, on utilise la valeur CFR/CPT comme approximation
 * de la "Valeur CIF base" (valeur avant assurance), ce qui est l'usage
 * académique standard.
 *
 * @param insurableValue - Valeur à assurer = Valeur CIF base × 1.10
 * @param insuranceRate  - Taux d'assurance (décimal, ex: 0.008 pour 0,8%)
 * @returns Prime d'assurance
 */
export function calcInsurancePremium(
  insurableValue: number,
  insuranceRate: number
): number {
  return roundCurrency(insurableValue * insuranceRate);
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
  const priceCPT = calcPriceCPT(priceFCA, inputs.mainFreightCost);
  const priceCFR = calcPriceCFR(priceFOB, inputs.mainFreightCost);

  // 6. CALCUL ASSURANCE
  // La valeur CIF de base = CFR (approximation académique BTS CI standard)
  const valueCIFBase = priceCFR;
  const insurableValue = calcInsurableValue(valueCIFBase);
  const insurancePremium = calcInsurancePremium(insurableValue, inputs.insuranceRate);

  // 7. GROUPE C (avec assurance) : CIF (maritime), CIP (tous modes)
  const priceCIF = calcPriceCIF(priceCFR, insurancePremium);
  const priceCIP = calcPriceCIP(priceCPT, insurancePremium);

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
      formula: `(${result.valueCIFBase} × 1,10) × ${(inputs.insuranceRate * 100).toFixed(3)}% = ${result.insurableValue} × ${inputs.insuranceRate}`,
    },
    {
      incotermCode: "CIF",
      label: "Prix CIF (Coût, Assurance, Fret — maritime)",
      cumulativeAmount: result.priceCIF,
      incrementAmount: roundCurrency(result.priceCIF - result.priceCFR),
      formula: `${result.priceCFR} + ${result.insurancePremium} (prime assurance)`,
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
    const cfr = fromPrice + inputs.mainFreightCost;
    const insurableVal = cfr * 1.10;
    const premium = insurableVal * inputs.insuranceRate;
    return roundCurrency(cfr + premium);
  }

  if (fromIncoterm === "CFR" && toIncoterm === "CIF") {
    if (inputs.insuranceRate === undefined) return null;
    const insurableVal = fromPrice * 1.10;
    const premium = insurableVal * inputs.insuranceRate;
    return roundCurrency(fromPrice + premium);
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
