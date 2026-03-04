/**
 * calculatorLogic.test.ts
 * Test unitaire standalone — Moteur de calcul Incoterms v2
 *
 * Exécution : npx tsx src/core/calculatorLogic.test.ts
 */

import { calculateIncoterms } from './calculatorLogic';

// ── Helpers ──────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(label: string, actual: number, expected: number, tolerance = 0.01) {
    if (Math.abs(actual - expected) <= tolerance) {
        console.log(`  ✅ ${label}: ${actual} (attendu ${expected})`);
        passed++;
    } else {
        console.error(`  ❌ ${label}: ${actual} ≠ ${expected} (écart: ${Math.abs(actual - expected).toFixed(4)})`);
        failed++;
    }
}

function section(title: string) {
    console.log(`\n━━━ ${title} ━━━`);
}

// ═════════════════════════════════════════════════════════════════════════════
// TEST 1 — FOB ne contient plus le B/L (frais documentaires)
// ═════════════════════════════════════════════════════════════════════════════
section('TEST 1 — FOB hors frais documentaires');
{
    const r = calculateIncoterms({
        mode: 'MARITIME',
        valeurMarchandise: 10000,
        emballageExport: 500,
        dedouanementPreAch: 1000,
        entreposage: 200,
        miseABord: 300,
        fraisDocumentaires: 150,  // B/L — ne doit PAS être dans le FOB
        fretBase: 2000,
        tauxAssurancePct: 0.5,
        majorationAssurancePct: 10,
    });

    // FOB = EXW + dédouanement + entreposage + mise à bord
    //     = (10000+500) + 1000 + 200 + 300 = 12000
    assert('EXW', r.exw, 10500);
    assert('FCA', r.fca, 11500);
    assert('FOB (sans B/L)', r.fob, 12000);
    // CFR = FOB + fretTotal + fraisDocumentaires = 12000 + 2000 + 150 = 14150
    assert('CFR (avec frais doc)', r.cfr, 14150);
}

// ═════════════════════════════════════════════════════════════════════════════
// TEST 2 — Rétro-compatibilité fraisBL → fraisDocumentaires
// ═════════════════════════════════════════════════════════════════════════════
section('TEST 2 — Rétro-compatibilité fraisBL');
{
    const r = calculateIncoterms({
        mode: 'MARITIME',
        valeurMarchandise: 10000,
        emballageExport: 500,
        dedouanementPreAch: 1000,
        entreposage: 200,
        miseABord: 300,
        fraisBL: 150,  // Ancien champ — doit être traité comme fraisDocumentaires
        fretBase: 2000,
        tauxAssurancePct: 0.5,
        majorationAssurancePct: 10,
    });

    assert('FOB (sans B/L même via alias)', r.fob, 12000);
    assert('CFR (avec frais via alias)', r.cfr, 14150);
    assert('fraisDocumentaires dans résultat', r.fraisDocumentaires, 150);
}

// ═════════════════════════════════════════════════════════════════════════════
// TEST 3 — Conversion de devise conditionnelle
// ═════════════════════════════════════════════════════════════════════════════
section('TEST 3 — Conversion devise conditionnelle');
{
    // 3a. isCurrencyConverted = false (défaut) → pas de conversion
    const r1 = calculateIncoterms({
        mode: 'MARITIME',
        valeurMarchandise: 10000,
        emballageExport: 500,
        dedouanementPreAch: 1000,
        entreposage: 200,
        miseABord: 300,
        tauxChange: 1.08,
        isCurrencyConverted: false,
        fretBase: 2000,
        tauxAssurancePct: 0.5,
        majorationAssurancePct: 10,
    });
    assert('Sans conversion: baseConvertie = FOB', r1.baseConvertie, 12000);
    assert('Sans conversion: tauxChange retourné = 1', r1.tauxChange, 1);

    // 3b. isCurrencyConverted = true → conversion appliquée
    const r2 = calculateIncoterms({
        mode: 'MARITIME',
        valeurMarchandise: 10000,
        emballageExport: 500,
        dedouanementPreAch: 1000,
        entreposage: 200,
        miseABord: 300,
        tauxChange: 1.08,
        isCurrencyConverted: true,
        fretBase: 2000,
        tauxAssurancePct: 0.5,
        majorationAssurancePct: 10,
    });
    // FOB = 12000 → 12000 × 1.08 = 12960
    assert('Avec conversion: baseConvertie = FOB × 1.08', r2.baseConvertie, 12960);
    assert('Avec conversion: tauxChange retourné = 1.08', r2.tauxChange, 1.08);
    // CFR = 12960 + 2000 = 14960
    assert('Avec conversion: CFR', r2.cfr, 14960);
}

// ═════════════════════════════════════════════════════════════════════════════
// TEST 4 — Double méthode d'assurance
// ═════════════════════════════════════════════════════════════════════════════
section('TEST 4 — Assurance circulaire CCI vs linéaire');
{
    const baseInput = {
        mode: 'MARITIME' as const,
        valeurMarchandise: 10000,
        emballageExport: 500,
        dedouanementPreAch: 1000,
        entreposage: 200,
        miseABord: 300,
        fretBase: 2000,
        tauxAssurancePct: 0.5,      // 0.5%
        majorationAssurancePct: 10,  // +10% → coeff 1.10
    };

    // 4a. Circulaire (défaut, isInsuranceCircular=true)
    // FOB=12000, CFR=14000
    // CIF = CFR / (1 - 1.10 × 0.005) = 14000 / (1 - 0.0055) = 14000 / 0.9945
    const rCirc = calculateIncoterms({ ...baseInput, isInsuranceCircular: true });
    const expectedCIFCirc = 14000 / (1 - 1.10 * 0.005);
    assert('Circulaire: CIF', rCirc.cif, Math.round(expectedCIFCirc * 100) / 100);
    assert('Circulaire: Assurance = CIF - CFR', rCirc.assurance, Math.round((expectedCIFCirc - 14000) * 100) / 100);
    assert('Circulaire: isInsuranceCircular', rCirc.isInsuranceCircular ? 1 : 0, 1);

    // 4b. Linéaire (isInsuranceCircular=false)
    // Ass = CFR × coeff × taux = 14000 × 1.10 × 0.005 = 77
    // CIF = 14000 + 77 = 14077
    const rLin = calculateIncoterms({ ...baseInput, isInsuranceCircular: false });
    assert('Linéaire: Assurance = CFR × 1.10 × 0.005', rLin.assurance, 77);
    assert('Linéaire: CIF = CFR + Ass', rLin.cif, 14077);
    assert('Linéaire: isInsuranceCircular', rLin.isInsuranceCircular ? 1 : 0, 0);
}

// ═════════════════════════════════════════════════════════════════════════════
// TEST 5 — Cascade BAF/CAF (frais documentaires hors cascade)
// ═════════════════════════════════════════════════════════════════════════════
section('TEST 5 — BAF/CAF en cascade, frais doc hors cascade');
{
    const r = calculateIncoterms({
        mode: 'MARITIME',
        valeurMarchandise: 10000,
        emballageExport: 500,
        dedouanementPreAch: 1000,
        entreposage: 200,
        miseABord: 300,
        fraisDocumentaires: 100,
        fretBase: 9300,
        bafPct: 3,
        cafPct: 2,
        tauxAssurancePct: 0.5,
        majorationAssurancePct: 10,
        isInsuranceCircular: false,
    });

    // BAF = 9300 × 0.03 = 279
    assert('BAF', r.bafAmount, 279);
    // CAF = (9300 + 279) × 0.02 = 9579 × 0.02 = 191.58
    assert('CAF', r.cafAmount, 191.58);
    // Fret Total = 9300 + 279 + 191.58 = 9770.58
    assert('Fret Total', r.fretTotal, 9770.58);
    // CFR = FOB + FretTotal + FraisDoc = 12000 + 9770.58 + 100 = 21870.58
    assert('CFR (fret + frais doc, sans BAF/CAF sur doc)', r.cfr, 21870.58);
    // Assurance linéaire = 21870.58 × 1.10 × 0.005 = 120.29 (arrondi)
    const expectedAss = Math.round(21870.58 * 1.10 * 0.005 * 100) / 100;
    assert('Assurance linéaire', r.assurance, expectedAss);
}

// ═════════════════════════════════════════════════════════════════════════════
// TEST 6 — Cas d'examen complet (Multimodal avec conversion)
// ═════════════════════════════════════════════════════════════════════════════
section('TEST 6 — Cas complet multimodal avec conversion');
{
    const r = calculateIncoterms({
        mode: 'MULTIMODAL',
        valeurMarchandise: 15000,
        emballageExport: 800,
        dedouanementPreAch: 1200,
        fraisDocumentaires: 200,
        tauxChange: 1.12,
        isCurrencyConverted: true,
        // isBilledInBaseCurrency = true (défaut) → fraisDoc convertis: 200 × 1.12 = 224
        fretBase: 3000,
        tauxAssurancePct: 0.8,
        majorationAssurancePct: 12,
        isInsuranceCircular: true,
        postAcheminement: 500,
        dechargementDestination: 300,
        douaneImport: 1500,
    });

    // EXW = 15000 + 800 = 15800
    assert('EXW', r.exw, 15800);
    // FCA = 15800 + 1200 = 17000
    assert('FCA', r.fca, 17000);
    // FOB = 0 (multimodal)
    assert('FOB (multimodal)', r.fob, 0);
    // Base convertie = FCA × 1.12 = 19040
    assert('Base convertie', r.baseConvertie, 19040);
    // fraisDoc convertis = 200 × 1.12 = 224
    assert('Frais doc convertis', r.fraisDocumentairesConverted, 224);
    // CPT = 19040 + 3000 + 224 = 22264
    const expectedCPT = 22264;
    assert('CPT', r.cpt, expectedCPT);
    // CIF circulaire: coeff=1.12, taux=0.008
    const expectedCIP = Math.round(expectedCPT / (1 - 1.12 * 0.008) * 100) / 100;
    assert('CIP (circulaire)', r.cip, expectedCIP);
    // DAP = CIP + 500
    assert('DAP', r.dap, Math.round((expectedCIP + 500) * 100) / 100);
}

// ═════════════════════════════════════════════════════════════════════════════
// TEST 7 — Devise mixte frais documentaires (isBilledInBaseCurrency)
// ═════════════════════════════════════════════════════════════════════════════
section('TEST 7 — Frais documentaires : devise base vs devise cible');
{
    const baseInput = {
        mode: 'MARITIME' as const,
        valeurMarchandise: 10000,
        emballageExport: 500,
        dedouanementPreAch: 1000,
        entreposage: 200,
        miseABord: 300,
        fraisDocumentaires: 100,
        tauxChange: 1.10,
        isCurrencyConverted: true,
        fretBase: 2000,
        tauxAssurancePct: 0.5,
        majorationAssurancePct: 10,
        isInsuranceCircular: false,
    };

    // 7a. isBilledInBaseCurrency = true → fraisDoc convertis : 100 × 1.10 = 110
    // FOB = 12000, baseConvertie = 12000 × 1.10 = 13200
    // CFR = 13200 + 2000 + 110 = 15310
    const r1 = calculateIncoterms({ ...baseInput, isBilledInBaseCurrency: true });
    assert('Base currency: fraisDocConverted', r1.fraisDocumentairesConverted, 110);
    assert('Base currency: CFR', r1.cfr, 15310);
    assert('Base currency: isBilledInBaseCurrency', r1.isBilledInBaseCurrency ? 1 : 0, 1);

    // 7b. isBilledInBaseCurrency = false → fraisDoc déjà en devise cible : 100
    // CFR = 13200 + 2000 + 100 = 15300
    const r2 = calculateIncoterms({ ...baseInput, isBilledInBaseCurrency: false });
    assert('Target currency: fraisDocConverted', r2.fraisDocumentairesConverted, 100);
    assert('Target currency: CFR', r2.cfr, 15300);
    assert('Target currency: isBilledInBaseCurrency', r2.isBilledInBaseCurrency ? 1 : 0, 0);

    // 7c. Si isCurrencyConverted = false, isBilledInBaseCurrency n'a aucun effet
    const r3 = calculateIncoterms({ ...baseInput, isCurrencyConverted: false, isBilledInBaseCurrency: true });
    assert('Sans conversion: fraisDocConverted = brut', r3.fraisDocumentairesConverted, 100);
}

// ═════════════════════════════════════════════════════════════════════════════
// RÉSUMÉ
// ═════════════════════════════════════════════════════════════════════════════
console.log(`\n${'═'.repeat(50)}`);
console.log(`RÉSULTATS : ${passed} ✅  /  ${failed} ❌  (Total : ${passed + failed})`);
if (failed === 0) {
    console.log('🏆 TOUS LES TESTS PASSENT !');
} else {
    console.log('⚠️  DES TESTS ONT ÉCHOUÉ. Vérifiez le moteur de calcul.');
    process.exit(1);
}

