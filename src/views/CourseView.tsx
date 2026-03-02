import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ship, Truck, Info, ShieldCheck, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import incotermsData from '../data/incoterms2020Data.json';

// Types déduits depuis le JSON
type TransportMode = 'ALL' | 'SEA';
type ObligatedParty = 'SELLER' | 'BUYER' | 'NONE';

interface Incoterm {
    code: string;
    fullNameEN: string;
    fullNameFR: string;
    group: string;
    transportMode: TransportMode;
    riskTransferPoint: { description: string; namedPlace: string };
    costTransferPoint: { description: string; namedPlace: string };
    customsObligations: { exportClearance: ObligatedParty; importClearance: ObligatedParty; importDutiesPaidBy: ObligatedParty };
    insuranceObligation: { obligatedParty: ObligatedParty; minimumCoverage: string; note: string };
    academicNotes: string[];
}

const allIncoterms = incotermsData.incoterms as Incoterm[];

export const CourseView: React.FC = () => {
    const { t } = useTranslation();
    const [selectedCode, setSelectedCode] = useState<string | null>(null);

    const multimodal = allIncoterms.filter(i => i.transportMode === 'ALL');
    const maritime = allIncoterms.filter(i => i.transportMode === 'SEA');

    const selectedIncoterm = allIncoterms.find(i => i.code === selectedCode);

    // Composant Helper pour les obligations
    const ObligationRow = ({ label, party }: { label: string, party: ObligatedParty }) => (
        <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors">
            <span className="text-sm text-slate-700 dark:text-slate-300 transition-colors">{label}</span>
            {party === 'SELLER' ? (
                <span className="flex items-center text-xs font-semibold px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full transition-colors">
                    <CheckCircle2 size={12} className="mr-1" /> {t('course.seller')}
                </span>
            ) : party === 'BUYER' ? (
                <span className="flex items-center text-xs font-semibold px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full transition-colors">
                    <CheckCircle2 size={12} className="mr-1" /> {t('course.buyer')}
                </span>
            ) : (
                <span className="flex items-center text-xs font-semibold px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full transition-colors">
                    <XCircle size={12} className="mr-1" /> {t('course.none')}
                </span>
            )}
        </div>
    );

    return (
        <div className="p-4 md:p-8 flex flex-col md:flex-row gap-6 transition-colors duration-200">

            {/* Colonne de Gauche : Liste de navigation */}
            <div className="w-full md:w-1/3 max-w-sm flex-shrink-0 flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-6rem)] relative">

                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 transition-colors">{t('course.title')}</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm transition-colors">{t('course.subtitle')}</p>
                </div>

                <div className="overflow-y-auto pr-2 pb-8 flex-1 custom-scrollbar">
                    {/* Multimodal Section */}
                    <div className="mb-8">
                        <div className="flex items-center text-slate-500 dark:text-slate-400 font-semibold mb-3 sticky top-0 bg-slate-50 dark:bg-slate-950 py-2 z-10 border-b border-slate-200 dark:border-slate-800 transition-colors">
                            <Truck size={18} className="mr-2" />
                            <h3>{t('course.multimodal')}</h3>
                        </div>
                        <div className="space-y-2">
                            {multimodal.map(incoterm => (
                                <button
                                    key={incoterm.code}
                                    onClick={() => setSelectedCode(incoterm.code)}
                                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ease-in-out flex items-center justify-between group
                                        ${selectedCode === incoterm.code
                                            ? 'bg-blue-600 dark:bg-blue-700 border-blue-600 dark:border-blue-700 shadow-md shadow-blue-500/20'
                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-sm'}`}
                                >
                                    <div>
                                        <div className={`font-bold text-lg transition-colors ${selectedCode === incoterm.code ? 'text-white' : 'text-slate-900 dark:text-slate-100 group-hover:dark:text-blue-400'}`}>
                                            {incoterm.code}
                                        </div>
                                        <div className={`text-xs mt-1 transition-colors ${selectedCode === incoterm.code ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>
                                            {incoterm.fullNameFR}
                                        </div>
                                    </div>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors
                                        ${selectedCode === incoterm.code ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 group-hover:text-blue-500 dark:group-hover:text-blue-400'}`}>
                                        {incoterm.group}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Maritime Section */}
                    <div>
                        <div className="flex items-center text-slate-500 dark:text-slate-400 font-semibold mb-3 sticky top-0 bg-slate-50 dark:bg-slate-950 py-2 z-10 border-b border-slate-200 dark:border-slate-800 transition-colors">
                            <Ship size={18} className="mr-2" />
                            <h3>{t('course.maritime')}</h3>
                        </div>
                        <div className="space-y-2">
                            {maritime.map(incoterm => (
                                <button
                                    key={incoterm.code}
                                    onClick={() => setSelectedCode(incoterm.code)}
                                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ease-in-out flex items-center justify-between group
                                        ${selectedCode === incoterm.code
                                            ? 'bg-cyan-700 dark:bg-cyan-800 border-cyan-700 dark:border-cyan-800 shadow-md shadow-cyan-500/20'
                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-cyan-300 dark:hover:border-cyan-600 hover:shadow-sm'}`}
                                >
                                    <div>
                                        <div className={`font-bold text-lg transition-colors ${selectedCode === incoterm.code ? 'text-white' : 'text-slate-900 dark:text-slate-100 group-hover:dark:text-cyan-400'}`}>
                                            {incoterm.code}
                                        </div>
                                        <div className={`text-xs mt-1 transition-colors ${selectedCode === incoterm.code ? 'text-cyan-100' : 'text-slate-500 dark:text-slate-400'}`}>
                                            {incoterm.fullNameFR}
                                        </div>
                                    </div>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors
                                        ${selectedCode === incoterm.code ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 group-hover:bg-cyan-50 dark:group-hover:bg-cyan-900/30 group-hover:text-cyan-600 dark:group-hover:text-cyan-400'}`}>
                                        {incoterm.group}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Colonne de Droite : Fiche Détaillée */}
            <div className="flex-1 overflow-y-auto h-[calc(100vh-4rem)] md:h-[calc(100vh-6rem)] custom-scrollbar pb-8">
                <AnimatePresence mode="wait">
                    {selectedIncoterm ? (
                        <motion.div
                            key={selectedIncoterm.code}
                            initial={{ opacity: 0, x: 20, filter: 'blur(4px)' }}
                            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, x: -20, filter: 'blur(4px)' }}
                            transition={{ duration: 0.3 }}
                            className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors"
                        >
                            {/* Header Fiche */}
                            <div className={`p-6 md:p-8 text-white ${selectedIncoterm.transportMode === 'ALL' ? 'bg-blue-600' : 'bg-cyan-700'}`}>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold backdrop-blur-sm">
                                        {t('course.group')} {selectedIncoterm.group}
                                    </span>
                                    <span className="flex items-center px-3 py-1 bg-white/20 rounded-full text-xs font-semibold backdrop-blur-sm">
                                        {selectedIncoterm.transportMode === 'ALL' ? <><Truck size={14} className="mr-1" /> {t('course.multimodal')}</> : <><Ship size={14} className="mr-1" /> {t('course.maritime')}</>}
                                    </span>
                                </div>
                                <h2 className="text-4xl font-extrabold mb-1">{selectedIncoterm.code}</h2>
                                <p className="text-xl font-medium opacity-90">{selectedIncoterm.fullNameFR}</p>
                                <p className="text-sm opacity-70 mt-1 italic">{selectedIncoterm.fullNameEN}</p>
                            </div>

                            <div className="p-6 md:p-8 space-y-8">

                                {/* Transfert des Risques (CRITIQUE BTS) */}
                                <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl p-5 border border-amber-200 dark:border-amber-800/50 relative overflow-hidden transition-colors">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 dark:bg-amber-600"></div>
                                    <h3 className="text-lg font-bold text-amber-900 dark:text-amber-500 flex items-center mb-3 transition-colors">
                                        <AlertTriangle size={20} className="mr-2 text-amber-600 dark:text-amber-500" />
                                        {t('course.risk_transfer')}
                                    </h3>
                                    <p className="text-amber-800 dark:text-amber-200/90 leading-relaxed mb-3 transition-colors">
                                        {selectedIncoterm.riskTransferPoint.description}
                                    </p>
                                    <div className="bg-white dark:bg-slate-900 rounded-lg p-3 inline-block border border-amber-100 dark:border-amber-800/30 shadow-sm transition-colors">
                                        <span className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500 block mb-1 transition-colors">{t('course.named_place')}</span>
                                        <span className="font-medium text-slate-800 dark:text-slate-200 transition-colors">{selectedIncoterm.riskTransferPoint.namedPlace}</span>
                                    </div>
                                </div>

                                {/* Répartition des Obligations */}
                                <div className="grid md:grid-cols-2 gap-8">

                                    {/* Douanes */}
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center border-b border-slate-200 dark:border-slate-700 pb-2 transition-colors">
                                            <ShieldCheck size={20} className="mr-2 text-slate-500 dark:text-slate-400" />
                                            {t('course.customs')}
                                        </h3>
                                        <div className="space-y-1">
                                            <ObligationRow label={t('course.export_clearance')} party={selectedIncoterm.customsObligations.exportClearance} />
                                            <ObligationRow label={t('course.import_clearance')} party={selectedIncoterm.customsObligations.importClearance} />
                                            <ObligationRow label={t('course.import_duties')} party={selectedIncoterm.customsObligations.importDutiesPaidBy} />
                                        </div>
                                    </div>

                                    {/* Assurance */}
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center border-b border-slate-200 dark:border-slate-700 pb-2 transition-colors">
                                            <Info size={20} className="mr-2 text-slate-500 dark:text-slate-400" />
                                            {t('course.insurance')}
                                        </h3>
                                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-100 dark:border-slate-800 transition-colors">
                                            <div className="mb-2">
                                                <span className="text-sm text-slate-500 dark:text-slate-400 block mb-1 transition-colors">{t('course.insurance_obligation')}</span>
                                                {selectedIncoterm.insuranceObligation.obligatedParty === 'SELLER' ? (
                                                    <span className="inline-flex items-center text-sm font-semibold px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md transition-colors">{t('course.seller')}</span>
                                                ) : selectedIncoterm.insuranceObligation.obligatedParty === 'BUYER' ? (
                                                    <span className="inline-flex items-center text-sm font-semibold px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-md transition-colors">{t('course.buyer')}</span>
                                                ) : (
                                                    <span className="inline-flex items-center text-sm font-medium px-2 py-1 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md transition-colors">{t('course.insurance_none')}</span>
                                                )}
                                            </div>
                                            {selectedIncoterm.insuranceObligation.minimumCoverage !== 'NONE' && (
                                                <div className="mb-2">
                                                    <span className="text-sm text-slate-500 dark:text-slate-400 block mb-1 transition-colors">{t('course.insurance_min_coverage')}</span>
                                                    <span className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200 transition-colors">{selectedIncoterm.insuranceObligation.minimumCoverage.replace('_', ' ')}</span>
                                                </div>
                                            )}
                                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 leading-relaxed transition-colors">
                                                {selectedIncoterm.insuranceObligation.note}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Notes Académiques */}
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 border-b border-slate-200 dark:border-slate-700 pb-2 transition-colors">
                                        {t('course.academic_notes')}
                                    </h3>
                                    <ul className="space-y-3">
                                        {selectedIncoterm.academicNotes.map((note, index) => (
                                            <li key={index} className="flex items-start">
                                                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300 font-bold text-xs mr-3 mt-0.5 transition-colors">
                                                    {index + 1}
                                                </div>
                                                <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm md:text-base transition-colors">
                                                    {note.split(/(BTS|ATTENTION|PIÈGE|NOUVEAUTÉ INCOTERMS 2020|NOUVEAUTÉ 2020 MAJEURE|POINT CLÉ|CONSEIL|FORMULE)/i).map((part, i) =>
                                                        ['BTS', 'ATTENTION', 'PIÈGE', 'NOUVEAUTÉ INCOTERMS 2020', 'NOUVEAUTÉ 2020 MAJEURE', 'POINT CLÉ', 'CONSEIL', 'FORMULE'].includes(part.toUpperCase())
                                                            ? <strong key={i} className="text-red-600 font-bold">{part}</strong>
                                                            : part
                                                    )}
                                                </p>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                            </div>
                        </motion.div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                            <div className="w-24 h-24 mb-6 opacity-20 bg-slate-200 dark:bg-slate-700 rounded-3xl flex items-center justify-center transition-colors">
                                <Info size={48} className="text-slate-500 dark:text-slate-400" />
                            </div>
                            <p className="text-xl font-medium text-slate-600 dark:text-slate-300 mb-2 transition-colors">{t('course.no_selection_title')}</p>
                            <p className="text-sm">{t('course.no_selection_desc')}</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>

        </div>
    );
};
