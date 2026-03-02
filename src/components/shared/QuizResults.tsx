import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Trophy, Target, RotateCcw, Home } from 'lucide-react';
import { useQuizStore } from '../../stores/useQuizStore';
import { useTranslation } from 'react-i18next';
import type { QuizQuestion } from './QuizEngine';

// ---------------------------------------------------------------------------
// Animation Variants
// ---------------------------------------------------------------------------
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.3,
        },
    },
};

const cardVariants = {
    hidden: { opacity: 0, y: 20, filter: 'blur(4px)' },
    visible: {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        transition: { duration: 0.4, ease: 'easeOut' as const },
    },
};

const headerVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
    },
};

// ---------------------------------------------------------------------------
// Circular Score Gauge
// ---------------------------------------------------------------------------
const ScoreGauge: React.FC<{ score: number; total: number }> = ({ score, total }) => {
    const percentage = total > 0 ? (score / total) * 100 : 0;
    const circumference = 2 * Math.PI * 58; // radius = 58
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    // Couleur conditionnelle
    let color = 'text-red-500 dark:text-red-400';
    let strokeColor = '#ef4444';
    if (percentage >= 80) { color = 'text-green-500 dark:text-green-400'; strokeColor = '#22c55e'; }
    else if (percentage >= 50) { color = 'text-amber-500 dark:text-amber-400'; strokeColor = '#f59e0b'; }

    return (
        <div className="relative w-[140px] h-[140px] sm:w-[200px] sm:h-[200px] mx-auto">
            <svg className="w-[140px] h-[140px] sm:w-[200px] sm:h-[200px] -rotate-90" viewBox="0 0 128 128">
                {/* Background circle */}
                <circle cx="64" cy="64" r="58" fill="none"
                    className="stroke-slate-200 dark:stroke-slate-800 transition-colors"
                    strokeWidth="8" />
                {/* Progress circle */}
                <motion.circle cx="64" cy="64" r="58" fill="none"
                    stroke={strokeColor}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                    className={`text-3xl font-extrabold ${color} transition-colors`}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8, duration: 0.4 }}
                >
                    {score}/{total}
                </motion.span>
            </div>
        </div>
    );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
interface QuizResultsProps {
    onRestart: () => void;
}

export const QuizResults: React.FC<QuizResultsProps> = ({ onRestart }) => {
    const { t } = useTranslation();
    const { questions, answers, score } = useQuizStore();
    const total = questions.length;
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

    // Message d'encouragement dynamique
    const getMessage = () => {
        if (percentage === 100) return t('quiz.results_perfect');
        if (percentage >= 80) return t('quiz.results_excellent');
        if (percentage >= 60) return t('quiz.results_good');
        if (percentage >= 40) return t('quiz.results_average');
        return t('quiz.results_needs_work');
    };

    // Icône dynamique
    const getHeaderIcon = () => {
        if (percentage >= 80) return <Trophy className="text-amber-500" size={32} />;
        return <Target className="text-blue-500" size={32} />;
    };

    // Regex pour mettre en gras les termes techniques dans les explications
    const highlightTerms = (text: string) => {
        return text.split(/(CCI 2020|ICC\(A\)|ICC\(C\)|110%|DAT|DPU|DAP|EXW|FCA|FAS|FOB|CFR|CIF|CPT|CIP|DDP|Art\. 70 CDU)/g).map((part, i) =>
            ['CCI 2020', 'ICC(A)', 'ICC(C)', '110%', 'DAT', 'DPU', 'DAP', 'EXW', 'FCA', 'FAS', 'FOB', 'CFR', 'CIF', 'CPT', 'CIP', 'DDP', 'Art. 70 CDU'].includes(part)
                ? <strong key={i} className="text-slate-900 dark:text-white font-bold bg-slate-200 dark:bg-slate-700 px-1 rounded transition-colors">{part}</strong>
                : part
        );
    };

    return (
        <div className="w-full max-w-3xl mx-auto p-4 md:p-6 pb-16 font-sans">

            {/* ============================================================ */}
            {/* HEADER : Score + Message                                      */}
            {/* ============================================================ */}
            <motion.div
                variants={headerVariants}
                initial="hidden"
                animate="visible"
                className="text-center py-8 mb-8"
            >
                <div className="mb-4">{getHeaderIcon()}</div>
                <ScoreGauge score={score} total={total} />
                <motion.h2
                    className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mt-6 mb-2 transition-colors"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    {getMessage()}
                </motion.h2>
                <motion.p
                    className="text-slate-500 dark:text-slate-400 transition-colors"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                >
                    {t('quiz.results_summary', { score, total, percentage })}
                </motion.p>
            </motion.div>

            {/* ============================================================ */}
            {/* LISTE DÉTAILLÉE DES QUESTIONS                                */}
            {/* ============================================================ */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-4"
            >
                <motion.h3
                    variants={cardVariants}
                    className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2 transition-colors"
                >
                    {t('quiz.results_detail_title')}
                </motion.h3>

                {questions.map((question: QuizQuestion, index: number) => {
                    const answer = answers.find(a => a.questionId === question.id);
                    const isCorrect = answer?.isCorrect ?? false;
                    const selectedIndex = answer?.selectedOptionIndex ?? -1;

                    return (
                        <motion.div
                            key={question.id}
                            variants={cardVariants}
                            className={`rounded-2xl border overflow-hidden transition-colors ${isCorrect
                                ? 'bg-white dark:bg-slate-900 border-green-200 dark:border-green-800/40'
                                : 'bg-white dark:bg-slate-900 border-red-200 dark:border-red-800/40'
                                }`}
                        >
                            {/* Question Header */}
                            <div className="p-4 sm:p-5 md:p-6">
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 mt-0.5">
                                        {isCorrect ? (
                                            <CheckCircle2 size={22} className="text-green-500 dark:text-green-400" />
                                        ) : (
                                            <XCircle size={22} className="text-red-500 dark:text-red-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider transition-colors">
                                                Q{index + 1}
                                            </span>
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isCorrect
                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                                } transition-colors`}>
                                                {isCorrect ? t('quiz.results_correct') : t('quiz.results_incorrect')}
                                            </span>
                                        </div>
                                        <p className="text-sm md:text-base font-medium text-slate-900 dark:text-slate-100 leading-relaxed transition-colors">
                                            {question.question}
                                        </p>

                                        {/* Réponses : affichage détaillé si faux */}
                                        {!isCorrect && (
                                            <div className="mt-4 space-y-2">
                                                {/* Mauvaise réponse de l'étudiant */}
                                                <div className="flex items-start gap-2">
                                                    <XCircle size={14} className="text-red-400 dark:text-red-500 mt-0.5 flex-shrink-0" />
                                                    <p className="text-sm text-red-600 dark:text-red-400 line-through opacity-80 transition-colors">
                                                        {selectedIndex >= 0 ? question.options[selectedIndex] : '—'}
                                                    </p>
                                                </div>
                                                {/* Bonne réponse */}
                                                <div className="flex items-start gap-2">
                                                    <CheckCircle2 size={14} className="text-green-500 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                                    <p className="text-sm text-green-700 dark:text-green-400 font-medium transition-colors">
                                                        {question.options[question.correctAnswerIndex]}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Explication Pédagogique */}
                            <div className="bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 px-4 sm:px-5 md:px-6 py-3 sm:py-4 transition-colors">
                                <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed transition-colors">
                                    <span className="font-semibold text-slate-700 dark:text-slate-300 mr-1 transition-colors">
                                        💡
                                    </span>
                                    {highlightTerms(question.explanation)}
                                </p>
                            </div>
                        </motion.div>
                    );
                })}
            </motion.div>

            {/* ============================================================ */}
            {/* FOOTER : Actions                                              */}
            {/* ============================================================ */}
            <motion.div
                className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
            >
                <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={onRestart}
                    className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-md w-full sm:w-auto justify-center"
                >
                    <RotateCcw size={18} />
                    {t('quiz.results_restart')}
                </motion.button>
                <Link
                    to="/"
                    className="flex items-center gap-2 px-8 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold rounded-xl transition-colors shadow-sm w-full sm:w-auto justify-center"
                >
                    <Home size={18} />
                    {t('quiz.results_back_dashboard')}
                </Link>
            </motion.div>
        </div>
    );
};
