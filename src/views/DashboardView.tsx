import React from 'react';
import { motion } from 'framer-motion';
import { Calculator, PlayCircle, Award, PenTool, Truck, Shield, CreditCard, TrendingUp, Globe, ChevronRight } from 'lucide-react';
import { useUserStore } from '../stores/useUserStore';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import modules from '../data/modules';
import type { CourseModule, ModuleId } from '../types/modules';

const iconMap: Record<string, React.ReactNode> = {
    Truck: <Truck size={24} />,
    Shield: <Shield size={24} />,
    CreditCard: <CreditCard size={24} />,
    TrendingUp: <TrendingUp size={24} />,
    Globe: <Globe size={24} />,
};

const moduleColorStyles: Record<string, string> = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    cyan: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400',
};

const progressBarColors: Record<string, string> = {
    blue: 'bg-blue-500',
    emerald: 'bg-emerald-500',
    indigo: 'bg-indigo-500',
    amber: 'bg-amber-500',
    cyan: 'bg-cyan-500',
};

export const DashboardView: React.FC = () => {
    const { t } = useTranslation();
    const stats = useUserStore((state) => state.stats);

    const totalAnswered = stats?.totalAnswered || 0;
    const totalCorrect = stats?.totalCorrect || 0;
    const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 pt-8 pb-40 md:pb-8">
            {/* HEADER SECTION */}
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-2 transition-colors">
                        {t('dashboard.welcome')}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-lg transition-colors">
                        {t('dashboard.welcome_subtitle')}
                    </p>
                </div>

                {/* PROGRESS MINIATURE */}
                <div className="bg-white dark:bg-slate-800 px-5 py-3 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4 shrink-0 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <Award size={24} />
                    </div>
                    <div>
                        <div className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t('dashboard.progression')}</div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-slate-900 dark:text-white">{accuracy}%</span>
                            <span className="text-sm text-slate-400 dark:text-slate-500">({totalCorrect}/{totalAnswered})</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODULES E5 — SECTION */}
            <div className="mb-10">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 transition-colors">
                    Modules E5 — MOI
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {modules
                        .sort((a, b) => a.order - b.order)
                        .map((mod: CourseModule, index: number) => {
                            const modProgress = stats?.moduleProgress?.[mod.id as ModuleId];
                            const answered = modProgress?.questionsAnswered ?? 0;
                            const correct = modProgress?.questionsCorrect ?? 0;
                            const modAccuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;
                            const linkTo = mod.id === 'incoterms-supply-chain'
                                ? '/course/incoterms-supply-chain'
                                : `/course/${mod.id}`;

                            return (
                                <Link key={mod.id} to={linkTo} className="block group">
                                    <motion.div
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.25, delay: index * 0.04 }}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="h-full bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all"
                                    >
                                        <div className="flex items-start gap-4">
                                            {/* Icon */}
                                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${moduleColorStyles[mod.color] || moduleColorStyles.blue}`}>
                                                {iconMap[mod.icon] || <Globe size={24} />}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors truncate">
                                                    {mod.title}
                                                </h3>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                    {mod.sheets.length} fiche{mod.sheets.length > 1 ? 's' : ''}
                                                    {(mod.questionCount ?? 0) > 0 && ` · ${mod.questionCount} questions`}
                                                </p>

                                                {/* Progress bar */}
                                                {answered > 0 && (
                                                    <div className="mt-3">
                                                        <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 mb-1">
                                                            <span>{modAccuracy}% correct</span>
                                                            <span>{answered} rép.</span>
                                                        </div>
                                                        <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all ${progressBarColors[mod.color] || progressBarColors.blue}`}
                                                                style={{ width: `${modAccuracy}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <ChevronRight size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 mt-1 shrink-0 transition-colors" />
                                        </div>
                                    </motion.div>
                                </Link>
                            );
                        })}
                </div>
            </div>

            {/* OUTILS — SECTION */}
            <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 transition-colors">
                    {t('nav.tools', 'Outils')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <DashboardCard
                        icon={<PlayCircle size={32} />}
                        title={t('nav.quiz')}
                        description={t('quiz.subtitle', { count: 35 })}
                        color="indigo"
                        linkTo="/quiz"
                        actionText={t('dashboard.btn_quiz')}
                    />

                    <DashboardCard
                        icon={<Calculator size={32} />}
                        title={t('nav.calculator')}
                        description={t('calculator.subtitle')}
                        color="cyan"
                        linkTo="/calculator"
                        actionText={t('dashboard.btn_calculator')}
                        badge="Incontournable"
                    />

                    <DashboardCard
                        icon={<PenTool size={32} />}
                        title={t('nav.practice')}
                        description={t('practice.dashboard_desc')}
                        color="blue"
                        linkTo="/practice"
                        actionText={t('dashboard.btn_practice')}
                    />
                </div>
            </div>
        </div>
    );
};

// --- Composant Carte Interne ---

interface DashboardCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    color: 'blue' | 'cyan' | 'indigo';
    linkTo: string;
    actionText?: string;
    badge?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ icon, title, description, color, linkTo, actionText = "Go →", badge }) => {
    const colorStyles = {
        blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/50 hover:border-blue-400 dark:hover:border-blue-700 focus:ring-blue-500",
        cyan: "bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800/50 hover:border-cyan-400 dark:hover:border-cyan-700 focus:ring-cyan-500",
        indigo: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/50 hover:border-indigo-400 dark:hover:border-indigo-700 focus:ring-indigo-500",
    };

    return (
        <Link to={linkTo} className="block group">
            <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="h-full text-left bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
            >
                {/* Badge Top Right */}
                {badge && (
                    <span className="absolute top-5 right-5 text-xs font-bold uppercase tracking-wider px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full">
                        {badge}
                    </span>
                )}

                {/* Icon Wrapper */}
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-colors ${colorStyles[color].split(' ')[0]} ${colorStyles[color].split(' ')[1]} ${colorStyles[color].split(' ')[2]} ${colorStyles[color].split(' ')[3]}`}>
                    {icon}
                </div>

                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                    {title}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm transition-colors">
                    {description}
                </p>

                {/* Fake minimal button at bottom */}
                <div className="mt-8 flex items-center text-sm font-semibold text-slate-400 dark:text-slate-500 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
                    {actionText}
                </div>
            </motion.div>
        </Link>
    );
};
