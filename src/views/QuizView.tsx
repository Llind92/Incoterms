import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { PlayCircle, Zap, Check, Truck, Shield, CreditCard, TrendingUp, Globe } from 'lucide-react';
import { QuizEngine } from '../components/shared/QuizEngine';
import { QuizResults } from '../components/shared/QuizResults';
import { useQuizStore } from '../stores/useQuizStore';
import { useUserStore } from '../stores/useUserStore';
import { useTranslation } from 'react-i18next';
import { getAllQuestions } from '../data/modules';
import type { ModuleId } from '../types/modules';

const ALL_MODULE_IDS: ModuleId[] = [
    'logistique-transport',
    'douane-fiscalite',
    'paiements-financements',
    'risque-change-pays',
    'incoterms-supply-chain',
];

const moduleLabels: Record<ModuleId, { label: string; icon: React.ReactNode; color: string }> = {
    'logistique-transport': { label: 'Logistique & Transport', icon: <Truck size={18} />, color: 'blue' },
    'douane-fiscalite': { label: 'Douane & Fiscalité', icon: <Shield size={18} />, color: 'emerald' },
    'paiements-financements': { label: 'Paiements & Financements', icon: <CreditCard size={18} />, color: 'indigo' },
    'risque-change-pays': { label: 'Risque de Change & Pays', icon: <TrendingUp size={18} />, color: 'amber' },
    'incoterms-supply-chain': { label: 'Incoterms & Supply Chain', icon: <Globe size={18} />, color: 'cyan' },
};

const checkedColor: Record<string, string> = {
    blue: 'bg-blue-600 border-blue-600',
    emerald: 'bg-emerald-600 border-emerald-600',
    indigo: 'bg-indigo-600 border-indigo-600',
    amber: 'bg-amber-600 border-amber-600',
    cyan: 'bg-cyan-600 border-cyan-600',
};

type Phase = 'config' | 'active' | 'results';

export const QuizView: React.FC = () => {
    const { t } = useTranslation();
    const { questions, isFinished, startQuiz, resetQuiz } = useQuizStore();
    const addScore = useUserStore((state) => state.addScore);

    const [phase, setPhase] = useState<Phase>('config');
    const [selectedModules, setSelectedModules] = useState<Set<ModuleId>>(new Set(ALL_MODULE_IDS));
    const [selectedDifficulties, setSelectedDifficulties] = useState<Set<string>>(new Set(['easy', 'medium', 'hard']));
    const [questionCount, setQuestionCount] = useState(10);

    const toggleModule = (id: ModuleId) => {
        setSelectedModules(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                if (next.size > 1) next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const toggleDifficulty = (d: string) => {
        setSelectedDifficulties(prev => {
            const next = new Set(prev);
            if (next.has(d)) {
                if (next.size > 1) next.delete(d);
            } else {
                next.add(d);
            }
            return next;
        });
    };

    const availableCount = getAllQuestions([...selectedModules])
        .filter(q => selectedDifficulties.has(q.difficulty))
        .length;

    const launchQuiz = useCallback((examMode = false) => {
        const pool = getAllQuestions([...selectedModules])
            .filter(q => selectedDifficulties.has(q.difficulty));

        const count = examMode ? Math.min(30, pool.length) : Math.min(questionCount, pool.length);
        const shuffled = [...pool].sort(() => 0.5 - Math.random());
        startQuiz(shuffled.slice(0, count), examMode);
        setPhase('active');
    }, [selectedModules, selectedDifficulties, questionCount, startQuiz]);

    // Detect quiz finish
    useEffect(() => {
        if (isFinished && phase === 'active') {
            const finalScore = useQuizStore.getState().score;
            addScore(finalScore, questions.length);
            setPhase('results');
        }
    }, [isFinished, phase, addScore, questions.length]);

    const handleRestart = () => {
        resetQuiz();
        setPhase('config');
    };

    // ─── RESULTS SCREEN ───
    if (phase === 'results') {
        return <QuizResults onRestart={handleRestart} />;
    }

    // ─── ACTIVE QUIZ ───
    if (phase === 'active') {
        return (
            <div className="py-8 pb-40 md:pb-8">
                <div className="max-w-3xl mx-auto px-4 md:px-6 mb-8">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white transition-colors">{t('quiz.title')}</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 transition-colors">{t('quiz.subtitle', { count: questions.length })}</p>
                </div>

                {questions.length > 0 ? (
                    <QuizEngine />
                ) : (
                    <div className="flex justify-center p-12">
                        <div className="w-8 h-8 rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-blue-600 dark:border-t-blue-500 animate-spin"></div>
                    </div>
                )}
            </div>
        );
    }

    // ─── CONFIG SCREEN ───
    return (
        <div className="max-w-2xl mx-auto p-4 md:p-8 pt-8 pb-40 md:pb-8">
            <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-2 transition-colors">
                    {t('quiz.title')}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-lg transition-colors">
                    Configurez votre session de révision
                </p>
            </div>

            {/* Module Selection */}
            <div className="mb-8">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                    Modules
                </h2>
                <div className="space-y-2">
                    {ALL_MODULE_IDS.map(id => {
                        const info = moduleLabels[id];
                        const isSelected = selectedModules.has(id);
                        const questions = getAllQuestions([id]).filter(q => selectedDifficulties.has(q.difficulty));

                        return (
                            <button
                                key={id}
                                onClick={() => toggleModule(id)}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left
                                    ${isSelected
                                        ? 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 shadow-sm'
                                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60'}`}
                            >
                                {/* Checkbox */}
                                <div className={`w-5 h-5 rounded flex items-center justify-center border-2 shrink-0 transition-all
                                    ${isSelected ? `${checkedColor[info.color]} text-white` : 'border-slate-300 dark:border-slate-600'}`}>
                                    {isSelected && <Check size={12} strokeWidth={3} />}
                                </div>

                                <div className="text-slate-600 dark:text-slate-400 shrink-0">
                                    {info.icon}
                                </div>

                                <span className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-200 transition-colors">
                                    {info.label}
                                </span>

                                <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
                                    {questions.length} q.
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Difficulty */}
            <div className="mb-8">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                    Difficulté
                </h2>
                <div className="flex gap-2">
                    {[
                        { key: 'easy', label: 'Facile', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700' },
                        { key: 'medium', label: 'Moyen', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700' },
                        { key: 'hard', label: 'Difficile', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700' },
                    ].map(d => (
                        <button
                            key={d.key}
                            onClick={() => toggleDifficulty(d.key)}
                            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all
                                ${selectedDifficulties.has(d.key) ? d.color : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 opacity-60'}`}
                        >
                            {d.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Question Count */}
            <div className="mb-10">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                    Nombre de questions
                </h2>
                <div className="flex gap-2">
                    {[10, 20, 30].map(n => (
                        <button
                            key={n}
                            onClick={() => setQuestionCount(n)}
                            className={`px-5 py-2.5 rounded-lg border text-sm font-medium transition-all
                                ${questionCount === n
                                    ? 'bg-blue-600 dark:bg-blue-700 border-blue-600 dark:border-blue-700 text-white shadow-sm'
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-500'}`}
                        >
                            {n}
                        </button>
                    ))}
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                    {availableCount} question{availableCount > 1 ? 's' : ''} disponible{availableCount > 1 ? 's' : ''} avec ces filtres
                </p>
            </div>

            {/* Launch Buttons */}
            <div className="space-y-3">
                <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => launchQuiz(false)}
                    disabled={availableCount === 0}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-semibold rounded-2xl shadow-sm transition-colors"
                >
                    <PlayCircle size={22} />
                    Lancer le Quiz ({Math.min(questionCount, availableCount)} questions)
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => {
                        setSelectedModules(new Set(ALL_MODULE_IDS));
                        setSelectedDifficulties(new Set(['easy', 'medium', 'hard']));
                        setTimeout(() => launchQuiz(true), 0);
                    }}
                    disabled={availableCount === 0}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white dark:bg-slate-800 border-2 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-400 font-semibold rounded-2xl shadow-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/20 disabled:opacity-50 transition-colors"
                >
                    <Zap size={22} />
                    Examen Blanc E5 (30 questions · 45 min)
                </motion.button>
            </div>
        </div>
    );
};
