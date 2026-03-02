import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Composants fantômes simulant Shadcn/UI (à remplacer par de vrais composants plus tard)
const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
        {...props}
        className={`flex h-10 w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 focus:border-transparent ${props.className || ''}`}
    />
);

const Label = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-700 dark:text-slate-300 ${className || ''}`}>
        {children}
    </label>
);

// Types internes pour la démo
export type TransportMode = 'MULTIMODAL' | 'MARITIME';

export const PriceCalculator: React.FC = () => {
    const { t } = useTranslation();
    // --- ÉTAT DU FORMULAIRE ---
    const [mode, setMode] = useState<'MULTIMODAL' | 'MARITIME'>('MULTIMODAL');
    const [activeTab, setActiveTab] = useState<'saisie' | 'resultats'>('saisie');

    // -- COÛTS DE BASE --(en euros pour simplifier)
    const [coutRevient, setCoutRevient] = useState<number>(10000);
    const [emballageExport, setEmballageExport] = useState<number>(200);
    const [preAcheminement, setPreAcheminement] = useState<number>(500);
    const [douaneExport, setDouaneExport] = useState<number>(150);
    // Frais propres au maritime (THC, passage portuaire)
    const [miseFob, setMiseFob] = useState<number>(300);

    const [fretPrincipal, setFretPrincipal] = useState<number>(1200);
    const [tauxAssurance, setTauxAssurance] = useState<number>(0.5); // 0.5%

    const [postAcheminement, setPostAcheminement] = useState<number>(400);
    const [dechargementDestination, setDechargementDestination] = useState<number>(100);
    const [douaneImport, setDouaneImport] = useState<number>(850);

    // --- LOGIQUE MÉTIER SIMPLIFIÉE (CASCADE) ---
    const cascade = useMemo(() => {
        // 1. EXW (Ex Works)
        const exw = coutRevient + emballageExport;

        // 2. FCA (Free Carrier) — Inclut la douane export (obligation vendeur dès FCA, CCI 2020)
        const fca = exw + preAcheminement + douaneExport;

        let fob = 0;
        let cfr = 0;
        let cif = 0;
        let cpt = 0;
        let cip = 0;

        if (mode === 'MARITIME') {
            // 3. FAS / FOB (Maritime uniquement)
            const fas = fca; // FAS = FCA en maritime (douane déjà incluse dans FCA)
            fob = fas + miseFob; // Mise à bord (THC départ)

            // 4. CFR (Cost and Freight)
            cfr = fob + fretPrincipal;

            // 5. CIF (Cost, Insurance and Freight)
            // Prime = CIF * 1.10 * taux
            // => CIF = CFR / (1 - 1.10 * taux/100)
            const divider = Math.max(0.01, 1 - (1.10 * (tauxAssurance / 100)));
            cif = cfr / divider;
        } else {
            // 3. CPT (Carriage Paid To) - Multimodal
            // Pas de THC départ distinct en multimodal, le fret couvre le principal
            cpt = fca + fretPrincipal;

            // 4. CIP (Carriage and Insurance Paid To)
            // Prime = CIP * 1.10 * taux
            const divider = Math.max(0.01, 1 - (1.10 * (tauxAssurance / 100)));
            cip = cpt / divider;
        }

        // Valeur d'arrivée avant frais locaux (DAP Basis)
        const basisArrivee = mode === 'MARITIME' ? cif : cip;

        // 5. DAP (Delivered at Place)
        // On ajoute le post-acheminement (sans décharger)
        const dap = basisArrivee + postAcheminement;

        // 6. DPU (Delivered at Place Unloaded)
        // On ajoute le déchargement
        const dpu = dap + dechargementDestination;

        // 7. DDP (Delivered Duty Paid)
        // On ajoute le dédouanement import et les droits
        const ddp = dpu + douaneImport;

        return {
            EXW: exw,
            FCA: fca,
            FOB: fob,
            CFR: cfr,
            CIF: cif,
            CPT: cpt,
            CIP: cip,
            DAP: dap,
            DPU: dpu,
            DDP: ddp,
        };
    }, [mode, coutRevient, emballageExport, preAcheminement, douaneExport, miseFob, fretPrincipal, tauxAssurance, postAcheminement, dechargementDestination, douaneImport]);

    // Formatage monétaire
    const formatEUR = (val: number) =>
        new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val);

    // Helper pour les lignes de la cascade
    const Row = ({ label, value, isCustoms = false, isMaritime = false }: { label: string, value: number, isCustoms?: boolean, isMaritime?: boolean }) => {
        if (value <= 0) return null;

        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className={`flex justify-between items-center p-3 sm:p-4 border-l-4 rounded-r-lg mb-2 shadow-sm transition-colors ${isCustoms
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : isMaritime
                        ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20'
                        : 'border-slate-800 dark:border-slate-400 bg-white dark:bg-slate-800'
                    }`}
            >
                <div className="flex items-center gap-3">
                    <span className={`font-bold text-lg ${isCustoms ? 'text-blue-800 dark:text-blue-400' : isMaritime ? 'text-cyan-800 dark:text-cyan-400' : 'text-slate-800 dark:text-slate-200'}`}>
                        {label}
                    </span>
                    {isCustoms && (
                        <span className="text-xs font-semibold px-2 py-1 bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-200 rounded-full">
                            {t('calculator.eu_customs_value')}
                        </span>
                    )}
                </div>
                <span className={`font-mono font-medium text-lg ${isCustoms ? 'text-blue-900 dark:text-blue-300' : 'text-slate-900 dark:text-white'}`}>
                    {formatEUR(value)}
                </span>
            </motion.div>
        );
    };

    return (
        <div className="w-full max-w-6xl mx-auto pb-32 md:pb-8 p-4 md:p-8 bg-slate-50 dark:bg-slate-900 transition-colors duration-200 min-h-screen font-sans">
            <div className="mb-6 sm:mb-8 flex flex-col md:flex-row md:items-start justify-between gap-3 sm:gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2 transition-colors">{t('calculator.title')}</h1>
                    <p className="text-slate-500 dark:text-slate-400 transition-colors">{t('calculator.subtitle')}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => {
                            setMode('MULTIMODAL');
                            setCoutRevient(10000);
                            setEmballageExport(200);
                            setPreAcheminement(500);
                            setDouaneExport(150);
                            setMiseFob(300);
                            setFretPrincipal(1200);
                            setTauxAssurance(0.5);
                            setPostAcheminement(400);
                            setDechargementDestination(100);
                            setDouaneImport(850);
                        }}
                        className="flex items-center px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 focus:ring-offset-2"
                    >
                        <RotateCcw size={16} className="mr-2" /> {t('calculator.reset')}
                    </button>
                    <Link to="/" className="flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 focus:ring-offset-2">
                        <ArrowLeft size={16} className="mr-2" /> {t('nav.dashboard')}
                    </Link>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">

                {/* MOBILE TABS (sm and md only) */}
                <div className="flex lg:hidden bg-slate-200 dark:bg-slate-800 p-1 rounded-xl mb-4">
                    <button
                        onClick={() => setActiveTab('saisie')}
                        className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'saisie' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}
                    >
                        Saisie des Coûts
                    </button>
                    <button
                        onClick={() => setActiveTab('resultats')}
                        className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'resultats' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}
                    >
                        Résultats Cascade
                    </button>
                </div>

                {/* COLONNE GAUCHE : INPUTS */}
                <div className={`w-full lg:w-1/3 space-y-6 ${activeTab === 'saisie' ? 'block' : 'hidden lg:block'}`}>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
                        <h2 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700 pb-2 transition-colors">{t('calculator.base_params')}</h2>

                        {/* Toggle Mode */}
                        <div className="mb-6">
                            <Label className="mb-2 block">{t('calculator.mode_transport')}</Label>
                            <div className="flex rounded-md shadow-sm">
                                <button
                                    onClick={() => setMode('MULTIMODAL')}
                                    className={`flex-1 py-2 text-sm font-medium rounded-l-md border transition-colors ${mode === 'MULTIMODAL' ? 'bg-slate-900 dark:bg-slate-700 text-white border-slate-900 dark:border-slate-700' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                >
                                    {t('calculator.mode_multimodal')}
                                </button>
                                <button
                                    onClick={() => setMode('MARITIME')}
                                    className={`flex-1 py-2 text-sm font-medium rounded-r-md border-t border-b border-r transition-colors ${mode === 'MARITIME' ? 'bg-cyan-700 dark:bg-cyan-600 text-white border-cyan-700 dark:border-cyan-600' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                >
                                    {t('calculator.mode_maritime')}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <Label>{t('calculator.exw_cost')}</Label>
                                <div className="mt-1"><Input type="number" value={coutRevient} onChange={e => setCoutRevient(Number(e.target.value))} /></div>
                            </div>
                            <div>
                                <Label>{t('calculator.export_packaging')}</Label>
                                <div className="mt-1"><Input type="number" value={emballageExport} onChange={e => setEmballageExport(Number(e.target.value))} /></div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
                        <h2 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700 pb-2 transition-colors">{t('calculator.logistics_departure')}</h2>
                        <div className="space-y-4">
                            <div>
                                <Label>{t('calculator.pre_carriage')}</Label>
                                <div className="mt-1"><Input type="number" value={preAcheminement} onChange={e => setPreAcheminement(Number(e.target.value))} /></div>
                            </div>
                            <div>
                                <Label>{t('calculator.export_customs')}</Label>
                                <div className="mt-1"><Input type="number" value={douaneExport} onChange={e => setDouaneExport(Number(e.target.value))} /></div>
                            </div>

                            <AnimatePresence>
                                {mode === 'MARITIME' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <Label className="text-cyan-800">{t('calculator.fob_handling')}</Label>
                                        <div className="mt-1"><Input type="number" value={miseFob} onChange={e => setMiseFob(Number(e.target.value))} className="border-cyan-300 focus:ring-cyan-500" /></div>
                                        <p className="text-xs text-slate-500 mt-1">S'ajoute uniquement pour atteindre le statut FOB.</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div>
                                <Label>{t('calculator.main_freight')}</Label>
                                <div className="mt-1"><Input type="number" value={fretPrincipal} onChange={e => setFretPrincipal(Number(e.target.value))} /></div>
                            </div>
                            <div>
                                <Label>{t('calculator.insurance_rate')}</Label>
                                <div className="mt-1"><Input type="number" step="0.1" value={tauxAssurance} onChange={e => setTauxAssurance(Number(e.target.value))} /></div>
                                <p className="text-xs text-slate-500 mt-1">Calcul: 110% de la valeur CIF/CIP</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
                        <h2 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700 pb-2 transition-colors">{t('calculator.logistics_arrival')}</h2>
                        <div className="space-y-4">
                            <div>
                                <Label>{t('calculator.post_carriage')}</Label>
                                <div className="mt-1"><Input type="number" value={postAcheminement} onChange={e => setPostAcheminement(Number(e.target.value))} /></div>
                            </div>
                            <div>
                                <Label>{t('calculator.unloading')}</Label>
                                <div className="mt-1"><Input type="number" value={dechargementDestination} onChange={e => setDechargementDestination(Number(e.target.value))} /></div>
                            </div>
                            <div>
                                <Label>{t('calculator.import_customs')}</Label>
                                <div className="mt-1"><Input type="number" value={douaneImport} onChange={e => setDouaneImport(Number(e.target.value))} /></div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* COLONNE DROITE : CASCADE */}
                <div className={`w-full lg:w-2/3 ${activeTab === 'resultats' ? 'block' : 'hidden lg:block'}`}>
                    <div className="bg-slate-100 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 sticky top-8 transition-colors">
                        <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-white border-b-2 border-slate-300 dark:border-slate-700 pb-2 transition-colors">{t('calculator.price_cascade')}</h2>

                        <div className="relative">
                            {/* Ligne visuelle connectant la cascade */}
                            <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-slate-300 dark:bg-slate-700 z-0 hidden sm:block"></div>

                            <div className="relative z-10 flex flex-col gap-1 overflow-x-auto pb-4 sm:pb-0 custom-scrollbar-hide">
                                <AnimatePresence mode="popLayout">
                                    <Row key="EXW" label="EXW" value={cascade.EXW} />

                                    {cascade.FCA > cascade.EXW && (
                                        <Row key="FCA" label="FCA" value={cascade.FCA} />
                                    )}

                                    {mode === 'MARITIME' ? (
                                        <>
                                            {cascade.FOB > cascade.FCA && <Row key="FOB" label="FOB" value={cascade.FOB} isMaritime />}
                                            {cascade.CFR > cascade.FOB && <Row key="CFR" label="CFR" value={cascade.CFR} isMaritime />}
                                            {cascade.CIF > cascade.CFR && <Row key="CIF" label="CIF" value={cascade.CIF} isCustoms isMaritime />}
                                        </>
                                    ) : (
                                        <>
                                            {cascade.CPT > cascade.FCA && <Row key="CPT" label="CPT" value={cascade.CPT} />}
                                            {cascade.CIP > cascade.CPT && <Row key="CIP" label="CIP" value={cascade.CIP} isCustoms />}
                                        </>
                                    )}

                                    {cascade.DAP > (mode === 'MARITIME' ? cascade.CIF : cascade.CIP) && (
                                        <Row key="DAP" label="DAP" value={cascade.DAP} />
                                    )}

                                    {cascade.DPU > cascade.DAP && (
                                        <Row key="DPU" label="DPU" value={cascade.DPU} />
                                    )}

                                    {cascade.DDP > cascade.DPU && (
                                        <Row key="DDP" label="DDP" value={cascade.DDP} />
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
