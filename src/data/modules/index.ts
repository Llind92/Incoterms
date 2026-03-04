/**
 * Module loader — Charge et exporte les 5 modules E5 (MOI) du BTS CI
 */
import type { CourseModule, CourseSheet, ModuleId } from '../../types/modules';
import type { QuizQuestion } from '../../components/shared/QuizEngine';

// ─── Métadonnées des modules ─────────────────────────────────────────────────
import logistiqueModule from './logistique-transport/module.json';
import douaneModule from './douane-fiscalite/module.json';
import paiementsModule from './paiements-financements/module.json';
import risqueModule from './risque-change-pays/module.json';
import incotermsModule from './incoterms-supply-chain/module.json';

// ─── Fiches de cours — Logistique & Transport ────────────────────────────────
import transportMaritime from './logistique-transport/sheets/transport-maritime.json';
import transportAerien from './logistique-transport/sheets/transport-aerien.json';
import transportRoutier from './logistique-transport/sheets/transport-routier.json';
import assuranceTransport from './logistique-transport/sheets/assurance-transport.json';

// ─── Fiches de cours — Douane & Fiscalité ────────────────────────────────────
import triptyqueEov from './douane-fiscalite/sheets/triptyque-eov.json';
import detteDouaniere from './douane-fiscalite/sheets/dette-douaniere.json';
import regimesParticuliers from './douane-fiscalite/sheets/regimes-particuliers.json';
import emebi from './douane-fiscalite/sheets/emebi.json';

// ─── Fiches de cours — Paiements & Financements ─────────────────────────────
import credocMecanisme from './paiements-financements/sheets/credoc-mecanisme.json';
import remiseDocumentaire from './paiements-financements/sheets/remise-documentaire.json';
import virementSwift from './paiements-financements/sheets/virement-swift.json';
import financementsExport from './paiements-financements/sheets/financements-export.json';

// ─── Fiches de cours — Risque de Change & Risque Pays ───────────────────────
import risqueDeChange from './risque-change-pays/sheets/risque-de-change.json';
import couvertureChange from './risque-change-pays/sheets/couverture-change.json';
import risquePays from './risque-change-pays/sheets/risque-pays.json';
import assuranceCreditExport from './risque-change-pays/sheets/assurance-credit-export.json';

// ─── Questions unifiées ──────────────────────────────────────────────────────
import allQuestions from '../quizQuestions.json';

const getQuestionsByModule = (moduleId: string) =>
  (allQuestions as QuizQuestion[]).filter(q => q.moduleId === moduleId);

// ─────────────────────────────────────────────────────────────────────────────
// Assemblage des modules
// ─────────────────────────────────────────────────────────────────────────────

const modules: CourseModule[] = [
  {
    ...logistiqueModule,
    sheets: [transportMaritime, transportAerien, transportRoutier, assuranceTransport] as CourseSheet[],
    questionCount: getQuestionsByModule('logistique-transport').length,
  },
  {
    ...douaneModule,
    sheets: [triptyqueEov, detteDouaniere, regimesParticuliers, emebi] as CourseSheet[],
    questionCount: getQuestionsByModule('douane-fiscalite').length,
  },
  {
    ...paiementsModule,
    sheets: [credocMecanisme, remiseDocumentaire, virementSwift, financementsExport] as CourseSheet[],
    questionCount: getQuestionsByModule('paiements-financements').length,
  },
  {
    ...risqueModule,
    sheets: [risqueDeChange, couvertureChange, risquePays, assuranceCreditExport] as CourseSheet[],
    questionCount: getQuestionsByModule('risque-change-pays').length,
  },
  {
    ...incotermsModule,
    sheets: [], // Utilise CourseView.tsx dédié
    questionCount: getQuestionsByModule('incoterms-supply-chain').length,
  },
] as CourseModule[];

export default modules;

/** Récupère un module par son ID */
export function getModuleById(id: string): CourseModule | undefined {
  return modules.find(m => m.id === id);
}

/** Récupère une fiche de cours par ID module + ID fiche */
export function getSheetById(moduleId: string, sheetId: string): CourseSheet | undefined {
  const mod = getModuleById(moduleId);
  return mod?.sheets.find(s => s.id === sheetId);
}

/** Récupère toutes les questions pour un ou plusieurs modules */
export function getAllQuestions(moduleIds?: ModuleId[]): QuizQuestion[] {
  const ids = moduleIds ?? (modules.map(m => m.id) as ModuleId[]);
  return (allQuestions as QuizQuestion[]).filter(q => ids.includes(q.moduleId as ModuleId));
}
