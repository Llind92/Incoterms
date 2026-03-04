import React, { useMemo } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, FileText, AlertTriangle } from 'lucide-react';
import { getModuleById } from '../data/modules';
import { ContentBlockRenderer } from '../components/shared/ContentBlockRenderer';
import type { CourseSheet } from '../types/modules';

const examFrequencyBadge: Record<string, { label: string; color: string }> = {
    very_high: { label: 'Très fréquent', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
    high: { label: 'Fréquent', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
    medium: { label: 'Moyen', color: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300' },
    low: { label: 'Rare', color: 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400' },
};

export const ModuleCourseView: React.FC = () => {
    const { moduleId, sheetId } = useParams<{ moduleId: string; sheetId?: string }>();
    const navigate = useNavigate();

    const courseModule = useMemo(() => moduleId ? getModuleById(moduleId) : undefined, [moduleId]);

    // Redirect incoterms module to its dedicated view
    if (moduleId === 'incoterms-supply-chain') {
        return <Navigate to="/course/incoterms-supply-chain" replace />;
    }

    if (!courseModule) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400 dark:text-slate-500">
                <AlertTriangle size={48} className="mb-4" />
                <p className="text-xl font-medium">Module introuvable</p>
                <button onClick={() => navigate('/course')} className="mt-4 text-blue-600 dark:text-blue-400 hover:underline">
                    Retour aux modules
                </button>
            </div>
        );
    }

    const selectedSheet: CourseSheet | undefined = sheetId
        ? courseModule.sheets.find(s => s.id === sheetId)
        : courseModule.sheets[0];

    return (
        <div className="flex flex-col min-h-full pb-40 md:pb-8 p-4 md:p-8 md:flex-row gap-6 transition-colors duration-200">

            {/* LEFT SIDEBAR — Table of Contents */}
            <div className="w-full md:w-1/3 md:max-w-sm flex-shrink-0 flex flex-col relative w-screen -mx-4 px-4 md:w-auto md:mx-0 md:px-0">

                {/* Back + Title */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate('/course')}
                        className="flex items-center text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 mb-3 transition-colors"
                    >
                        <ArrowLeft size={16} className="mr-1" />
                        Tous les modules
                    </button>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2 transition-colors">
                        {courseModule.title}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm transition-colors">
                        {courseModule.description}
                    </p>
                </div>

                {/* Sheet List */}
                <div className="pr-2 pb-8 flex-1">
                    <div className="flex items-center text-slate-500 dark:text-slate-400 font-semibold mb-3 sticky top-0 bg-slate-50 dark:bg-slate-950 py-2 z-10 border-b border-slate-200 dark:border-slate-800 transition-colors">
                        <FileText size={18} className="mr-2" />
                        <h3>Fiches de cours</h3>
                    </div>
                    <div className="flex md:flex-col gap-3 overflow-x-auto pb-4 md:pb-0 snap-x snap-mandatory flex-nowrap w-full custom-scrollbar-hide">
                        {courseModule.sheets.map((sheet) => {
                            const isSelected = selectedSheet?.id === sheet.id;
                            const freq = examFrequencyBadge[sheet.examFrequency];

                            return (
                                <button
                                    key={sheet.id}
                                    onClick={() => navigate(`/course/${moduleId}/${sheet.id}`)}
                                    className={`shrink-0 w-[260px] md:w-full snap-start text-left p-4 rounded-xl border transition-all duration-200 ease-in-out group
                                        ${isSelected
                                            ? 'bg-blue-600 dark:bg-blue-700 border-blue-600 dark:border-blue-700 shadow-md shadow-blue-500/20'
                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-sm'}`}
                                >
                                    <div className={`font-bold text-base transition-colors ${isSelected ? 'text-white' : 'text-slate-900 dark:text-slate-100'}`}>
                                        {sheet.title}
                                    </div>
                                    {sheet.subtitle && (
                                        <div className={`text-xs mt-1 transition-colors ${isSelected ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>
                                            {sheet.subtitle}
                                        </div>
                                    )}
                                    {freq && !isSelected && (
                                        <span className={`inline-block mt-2 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${freq.color}`}>
                                            {freq.label}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {courseModule.sheets.length === 0 && (
                        <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                            <p className="text-sm">Contenu à venir</p>
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT PANEL — Sheet Content */}
            <div className="flex-1 pb-8 flex flex-col">
                <AnimatePresence mode="wait">
                    {selectedSheet && selectedSheet.blocks.length > 0 ? (
                        <motion.div
                            key={selectedSheet.id}
                            initial={{ opacity: 0, x: 20, filter: 'blur(4px)' }}
                            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, x: -20, filter: 'blur(4px)' }}
                            transition={{ duration: 0.3 }}
                            className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors"
                        >
                            {/* Sheet Header */}
                            <div className="p-4 sm:p-6 md:p-8 bg-blue-600 dark:bg-blue-700 text-white">
                                <div className="flex items-center gap-3 mb-2">
                                    {examFrequencyBadge[selectedSheet.examFrequency] && (
                                        <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold backdrop-blur-sm">
                                            {examFrequencyBadge[selectedSheet.examFrequency].label} en examen
                                        </span>
                                    )}
                                </div>
                                <h2 className="text-2xl sm:text-3xl font-extrabold mb-1">{selectedSheet.title}</h2>
                                {selectedSheet.subtitle && (
                                    <p className="text-lg font-medium opacity-90">{selectedSheet.subtitle}</p>
                                )}
                            </div>

                            {/* Sheet Content — rendered blocks */}
                            <div className="p-4 sm:p-6 md:p-8">
                                {selectedSheet.blocks.map((block, i) => (
                                    <ContentBlockRenderer key={i} block={block} />
                                ))}

                                {/* Tags */}
                                {selectedSheet.tags && selectedSheet.tags.length > 0 && (
                                    <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                                        <div className="flex flex-wrap gap-2">
                                            {selectedSheet.tags.map((tag, i) => (
                                                <span key={i} className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full transition-colors">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ) : selectedSheet && selectedSheet.blocks.length === 0 ? (
                        <div className="flex-1 flex flex-col py-20 items-center justify-center text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                            <div className="w-24 h-24 mb-6 opacity-20 bg-slate-200 dark:bg-slate-700 rounded-3xl flex items-center justify-center transition-colors">
                                <FileText size={48} className="text-slate-500 dark:text-slate-400" />
                            </div>
                            <p className="text-xl font-medium text-slate-600 dark:text-slate-300 mb-2 transition-colors">Contenu en cours de rédaction</p>
                            <p className="text-sm">Cette fiche sera bientôt disponible</p>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col py-20 items-center justify-center text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                            <p className="text-xl font-medium text-slate-600 dark:text-slate-300 mb-2 transition-colors">Sélectionnez une fiche</p>
                            <p className="text-sm">Choisissez une fiche dans le menu à gauche</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
