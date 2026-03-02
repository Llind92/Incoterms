import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, RotateCcw, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// ---------------------------------------------------------------------------
// TYPES ET INTERFACES
// ---------------------------------------------------------------------------
type TransportMode = 'maritime' | 'multimodal';

interface ScenarioData {
    exw: number;
    exportPackaging: number;
    preCarriage: number;
    exportCustoms: number;
    fobHandling: number; // Uniquement pour Maritime (THC)
    mainFreight: number;
    insuranceRate: number; // en pourcentage (ex: 0.5)
}

interface UserInputs {
    step1: string; // FCA ou FOB
    step2: string; // CPT ou CFR
    step3: string; // CIP ou CIF
}

// ---------------------------------------------------------------------------
// GESTION DU GÉNÉRATEUR ALÉATOIRE
// ---------------------------------------------------------------------------
const generateRandomScenario = (): { mode: TransportMode; data: ScenarioData } => {
    // Choix du mode
    const mode: TransportMode = Math.random() > 0.5 ? 'maritime' : 'multimodal';

    // Génération de coûts réalistes avec des arrondis propres
    const baseExw = Math.floor(Math.random() * 40) * 1000 + 10000; // Entre 10k et 50k

    return {
        mode,
        data: {
            exw: baseExw,
            exportPackaging: Math.floor(Math.random() * 5 + 1) * 100, // 100 à 600
            preCarriage: Math.floor(Math.random() * 8 + 2) * 100, // 200 à 1000
            exportCustoms: Math.floor(Math.random() * 3 + 1) * 50, // 50 à 200
            fobHandling: mode === 'maritime' ? Math.floor(Math.random() * 4 + 2) * 100 : 0, // 200 à 600
            mainFreight: Math.floor(Math.random() * 30 + 10) * 100, // 1000 à 4000
            insuranceRate: Number((Math.random() * 0.7 + 0.3).toFixed(2)), // 0.3% à 1.0%
        }
    };
};

export const CascadePracticeView: React.FC = () => {
    const { t, i18n } = useTranslation();
    const formatter = new Intl.NumberFormat(i18n.language === 'es' ? 'es-ES' : 'fr-FR', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 2
    });

    // ---------------------------------------------------------------------------
    // ETAT DU COMPOSANT
    // ---------------------------------------------------------------------------
    const [mode, setMode] = useState<TransportMode>('multimodal');
    const [scenario, setScenario] = useState<ScenarioData | null>(null);
    const [inputs, setInputs] = useState<UserInputs>({ step1: '', step2: '', step3: '' });
    const [isValidated, setIsValidated] = useState(false);

    // Initialisation
    useEffect(() => {
        handleNewExercise();
    }, []);

    const handleNewExercise = () => {
        const generated = generateRandomScenario();
        setMode(generated.mode);
        setScenario(generated.data);
        setInputs({ step1: '', step2: '', step3: '' });
        setIsValidated(false);
    };

    if (!scenario) return null;

    // ---------------------------------------------------------------------------
    // MOTEUR DE CALCUL (LA VÉRITÉ ABSOLUE)
    // ---------------------------------------------------------------------------
    let trueStep1 = 0; // FCA ou FOB
    let trueStep2 = 0; // CPT ou CFR
    let trueStep3 = 0; // CIP ou CIF

    if (mode === 'multimodal') {
        trueStep1 = scenario.exw + scenario.exportPackaging + scenario.preCarriage + scenario.exportCustoms; // FCA
        trueStep2 = trueStep1 + scenario.mainFreight; // CPT
        // CIP = CPT / (1 - (1.10 * Taux/100))
        const insuranceCoef = 1.10 * (scenario.insuranceRate / 100);
        trueStep3 = trueStep2 / (1 - insuranceCoef);
    } else {
        trueStep1 = scenario.exw + scenario.exportPackaging + scenario.preCarriage + scenario.exportCustoms + scenario.fobHandling; // FOB
        trueStep2 = trueStep1 + scenario.mainFreight; // CFR
        // CIF = CFR / (1 - (1.10 * Taux/100))
        const insuranceCoef = 1.10 * (scenario.insuranceRate / 100);
        trueStep3 = trueStep2 / (1 - insuranceCoef);
    }

    // ---------------------------------------------------------------------------
    // VALIDATION DES INPUTS
    // ---------------------------------------------------------------------------
    const isStep1Correct = Math.abs(Number(inputs.step1) - trueStep1) <= 1.0;
    const isStep2Correct = Math.abs(Number(inputs.step2) - trueStep2) <= 1.0;
    const isStep3Correct = Math.abs(Number(inputs.step3) - trueStep3) <= 1.0;

    const allCorrect = isStep1Correct && isStep2Correct && isStep3Correct;

    // Lignes de l'énoncé
    const statementLines = [
        { label: t('calculator.exw_cost'), value: scenario.exw },
        { label: t('calculator.export_packaging'), value: scenario.exportPackaging },
        { label: t('calculator.pre_carriage'), value: scenario.preCarriage },
        { label: t('calculator.export_customs'), value: scenario.exportCustoms },
        ...(mode === 'maritime' ? [{ label: t('calculator.fob_handling'), value: scenario.fobHandling }] : []),
        { label: t('calculator.main_freight'), value: scenario.mainFreight },
        { label: t('calculator.insurance_rate'), value: `${scenario.insuranceRate}%` },
    ];

    // Noms des étapes selon le mode
    const step1Name = mode === 'multimodal' ? 'FCA' : 'FOB';
    const step2Name = mode === 'multimodal' ? 'CPT' : 'CFR';
    const step3Name = mode === 'multimodal' ? 'CIP' : 'CIF';

    return (
        <div className="py-8">
            <div className="max-w-6xl mx-auto px-4 md:px-6">

                {/* HEADER */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-slate-200 dark:border-slate-800 transition-colors">
                    <div className="flex items-center gap-4 mb-4 md:mb-0">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl transition-colors">
                            <Calculator size={28} />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white transition-colors">{t('practice.title')}</h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 transition-colors">
                                {t('practice.subtitle')}
                            </p>
                        </div>
                    </div>
                    <div>
                        <button
                            onClick={handleNewExercise}
                            className="flex items-center px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm"
                        >
                            <RotateCcw size={16} className="mr-2" />
                            {t('practice.new_exercise')}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* ========================================================= */}
                    {/* COLONNE GAUCHE : ÉNONCÉ                                     */}
                    {/* ========================================================= */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors"
                    >
                        {/* Type de scénario Badge */}
                        <div className={`px-6 py-4 flex justify-between items-center transition-colors ${mode === 'maritime'
                            ? 'bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-800/50'
                            : 'bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-100 dark:border-emerald-800/50'
                            }`}>
                            <span className="font-semibold text-slate-900 dark:text-white transition-colors">
                                {t('practice.statement')}
                            </span>
                            <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full transition-colors ${mode === 'maritime'
                                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                }`}>
                                {mode === 'maritime' ? t('calculator.mode_maritime') : t('calculator.mode_multimodal')}
                            </span>
                        </div>

                        {/* Liste des coûts */}
                        <div className="p-6 md:p-8">
                            <p className="text-slate-600 dark:text-slate-400 mb-6 italic transition-colors">
                                {t('practice.statement_desc', { mode: mode === 'maritime' ? t('calculator.mode_maritime') : t('calculator.mode_multimodal') })}
                            </p>
                            <div className="space-y-4">
                                {statementLines.map((line, idx) => (
                                    <div key={idx} className="flex justify-between items-center pb-2 border-b border-dashed border-slate-200 dark:border-slate-700 transition-colors">
                                        <span className="text-slate-700 dark:text-slate-300 font-medium transition-colors">{line.label}</span>
                                        <span className="font-mono text-slate-900 dark:text-white font-semibold transition-colors">
                                            {typeof line.value === 'number' ? formatter.format(line.value) : line.value}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 transition-colors">
                                <p className="text-sm text-slate-700 dark:text-slate-300 transition-colors">
                                    <strong>{t('practice.mission_title')} :</strong> {t('practice.mission_desc', { s1: step1Name, s2: step2Name, s3: step3Name })}
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* ========================================================= */}
                    {/* COLONNE DROITE : FORMULAIRE ET CORRECTION                   */}
                    {/* ========================================================= */}
                    <div className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 md:p-8 transition-colors"
                        >
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 transition-colors border-b border-slate-100 dark:border-slate-800 pb-4">
                                {t('practice.your_calculations')}
                            </h2>

                            <div className="space-y-6">
                                {/* INPUT 1 */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 transition-colors">
                                        {t('practice.calculate')} {step1Name}
                                    </label>
                                    <div className="relative flex items-center">
                                        <span className="absolute left-4 font-bold text-slate-400 dark:text-slate-500 transition-colors">{step1Name} =</span>
                                        <input
                                            type="number"
                                            value={inputs.step1}
                                            onChange={(e) => setInputs({ ...inputs, step1: e.target.value })}
                                            disabled={isValidated}
                                            className="w-full pl-20 pr-12 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:opacity-75"
                                            placeholder="Ex: 15400.00"
                                        />
                                        <div className="absolute right-4 text-slate-400 font-medium">€</div>
                                        {isValidated && (
                                            <div className="absolute -right-8">
                                                {isStep1Correct ? <CheckCircle2 className="text-green-500" /> : <XCircle className="text-red-500" />}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-center text-slate-300 dark:text-slate-600">
                                    <ArrowRight className="rotate-90" size={20} />
                                </div>

                                {/* INPUT 2 */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 transition-colors">
                                        {t('practice.calculate')} {step2Name}
                                    </label>
                                    <div className="relative flex items-center">
                                        <span className="absolute left-4 font-bold text-slate-400 dark:text-slate-500 transition-colors">{step2Name} =</span>
                                        <input
                                            type="number"
                                            value={inputs.step2}
                                            onChange={(e) => setInputs({ ...inputs, step2: e.target.value })}
                                            disabled={isValidated}
                                            className="w-full pl-20 pr-12 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:opacity-75"
                                            placeholder="Ex: 18400.00"
                                        />
                                        <div className="absolute right-4 text-slate-400 font-medium">€</div>
                                        {isValidated && (
                                            <div className="absolute -right-8">
                                                {isStep2Correct ? <CheckCircle2 className="text-green-500" /> : <XCircle className="text-red-500" />}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-center text-slate-300 dark:text-slate-600">
                                    <ArrowRight className="rotate-90" size={20} />
                                </div>

                                {/* INPUT 3 */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 transition-colors">
                                        {t('practice.calculate')} {step3Name}
                                    </label>
                                    <div className="relative flex items-center">
                                        <span className="absolute left-4 font-bold text-slate-400 dark:text-slate-500 transition-colors">{step3Name} =</span>
                                        <input
                                            type="number"
                                            value={inputs.step3}
                                            onChange={(e) => setInputs({ ...inputs, step3: e.target.value })}
                                            disabled={isValidated}
                                            className="w-full pl-20 pr-12 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:opacity-75"
                                            placeholder="Ex: 18550.45"
                                        />
                                        <div className="absolute right-4 text-slate-400 font-medium">€</div>
                                        {isValidated && (
                                            <div className="absolute -right-8">
                                                {isStep3Correct ? <CheckCircle2 className="text-green-500" /> : <XCircle className="text-red-500" />}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {!isValidated && (
                                    <button
                                        onClick={() => setIsValidated(true)}
                                        disabled={!inputs.step1 || !inputs.step2 || !inputs.step3}
                                        className="w-full mt-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 dark:disabled:bg-blue-900/40 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-md transition-all uppercase tracking-wide text-sm"
                                    >
                                        {t('practice.verify_btn')}
                                    </button>
                                )}
                            </div>
                        </motion.div>

                        {/* MODE CORRECTION - Le Calcul Posé */}
                        <AnimatePresence>
                            {isValidated && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className={`rounded-2xl border overflow-hidden shadow-sm transition-colors ${allCorrect
                                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/40'
                                        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/40'
                                        }`}
                                >
                                    <div className="p-6 md:p-8">
                                        <div className="flex items-center gap-3 mb-6">
                                            {allCorrect ? (
                                                <CheckCircle2 size={24} className="text-green-600 dark:text-green-400" />
                                            ) : (
                                                <XCircle size={24} className="text-red-600 dark:text-red-400" />
                                            )}
                                            <h3 className={`text-lg font-bold ${allCorrect ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>
                                                {allCorrect ? t('practice.feedback_perfect') : t('practice.feedback_errors')}
                                            </h3>
                                        </div>

                                        <div className="space-y-4">
                                            <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase text-xs tracking-wider transition-colors">
                                                {t('practice.detailed_correction')}
                                            </h4>

                                            {/* Step 1 Correction */}
                                            <div className="bg-white/60 dark:bg-slate-900/40 p-4 rounded-lg border border-slate-200 dark:border-slate-700/50 overflow-x-auto text-sm transition-colors">
                                                <div className="text-slate-500 dark:text-slate-400 mb-1">
                                                    {step1Name} = EXW + Emballage + Pré-acheminement + Douane Exp.{mode === 'maritime' ? ' + Manutention Dép.' : ''}
                                                </div>
                                                <div className="font-mono text-slate-900 dark:text-white font-medium text-xs sm:text-sm break-all sm:break-normal">
                                                    <span className="font-bold text-blue-600 dark:text-blue-400">{step1Name}</span> = {scenario.exw} + {scenario.exportPackaging} + {scenario.preCarriage} + {scenario.exportCustoms}{mode === 'maritime' ? ` + ${scenario.fobHandling}` : ''} = <span className={isStep1Correct ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400 font-bold'}>{formatter.format(trueStep1)}</span>
                                                </div>
                                            </div>

                                            {/* Step 2 Correction */}
                                            <div className="bg-white/60 dark:bg-slate-900/40 p-4 rounded-lg border border-slate-200 dark:border-slate-700/50 overflow-x-auto text-sm transition-colors">
                                                <div className="text-slate-500 dark:text-slate-400 mb-1">
                                                    {step2Name} = {step1Name} + Fret Principal
                                                </div>
                                                <div className="font-mono text-slate-900 dark:text-white font-medium text-xs sm:text-sm break-all sm:break-normal">
                                                    <span className="font-bold text-blue-600 dark:text-blue-400">{step2Name}</span> = {trueStep1} + {scenario.mainFreight} = <span className={isStep2Correct ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400 font-bold'}>{formatter.format(trueStep2)}</span>
                                                </div>
                                            </div>

                                            {/* Step 3 Correction */}
                                            <div className="bg-white/60 dark:bg-slate-900/40 p-4 rounded-lg border border-slate-200 dark:border-slate-700/50 overflow-x-auto text-sm transition-colors">
                                                <div className="text-slate-500 dark:text-slate-400 mb-1">
                                                    {step3Name} = {step2Name} / (1 - (1.10 × Assurance))
                                                </div>
                                                <div className="font-mono text-slate-900 dark:text-white font-medium text-xs sm:text-sm break-all sm:break-normal">
                                                    <span className="font-bold text-blue-600 dark:text-blue-400">{step3Name}</span> = {trueStep2} / (1 - (1.10 × {scenario.insuranceRate / 100})) = <span className={isStep3Correct ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400 font-bold'}>{formatter.format(trueStep3)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {!allCorrect && (
                                            <button
                                                onClick={() => setIsValidated(false)}
                                                className="mt-6 w-full py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors uppercase tracking-wide text-sm"
                                            >
                                                {t('practice.try_again')}
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                </div>
            </div>
        </div>
    );
};
