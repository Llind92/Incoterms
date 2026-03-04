import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Truck, Shield, CreditCard, TrendingUp, Globe, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import modules from '../data/modules';
import type { CourseModule } from '../types/modules';

const iconMap: Record<string, React.ReactNode> = {
    Truck: <Truck size={28} />,
    Shield: <Shield size={28} />,
    CreditCard: <CreditCard size={28} />,
    TrendingUp: <TrendingUp size={28} />,
    Globe: <Globe size={28} />,
};

const colorStyles: Record<string, { bg: string; text: string; border: string; iconBg: string }> = {
    blue: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        text: 'text-blue-600 dark:text-blue-400',
        border: 'border-blue-200 dark:border-blue-800/50 hover:border-blue-400 dark:hover:border-blue-600',
        iconBg: 'bg-blue-100 dark:bg-blue-900/40',
    },
    emerald: {
        bg: 'bg-emerald-50 dark:bg-emerald-900/20',
        text: 'text-emerald-600 dark:text-emerald-400',
        border: 'border-emerald-200 dark:border-emerald-800/50 hover:border-emerald-400 dark:hover:border-emerald-600',
        iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    },
    indigo: {
        bg: 'bg-indigo-50 dark:bg-indigo-900/20',
        text: 'text-indigo-600 dark:text-indigo-400',
        border: 'border-indigo-200 dark:border-indigo-800/50 hover:border-indigo-400 dark:hover:border-indigo-600',
        iconBg: 'bg-indigo-100 dark:bg-indigo-900/40',
    },
    amber: {
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        text: 'text-amber-600 dark:text-amber-400',
        border: 'border-amber-200 dark:border-amber-800/50 hover:border-amber-400 dark:hover:border-amber-600',
        iconBg: 'bg-amber-100 dark:bg-amber-900/40',
    },
    cyan: {
        bg: 'bg-cyan-50 dark:bg-cyan-900/20',
        text: 'text-cyan-600 dark:text-cyan-400',
        border: 'border-cyan-200 dark:border-cyan-800/50 hover:border-cyan-400 dark:hover:border-cyan-600',
        iconBg: 'bg-cyan-100 dark:bg-cyan-900/40',
    },
};

export const CourseIndexView: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 pt-8 pb-40 md:pb-8">
            {/* Header */}
            <div className="mb-10">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-2 transition-colors">
                    {t('course.index_title', 'Modules E5 — MOI')}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-lg transition-colors">
                    {t('course.index_subtitle', 'Choisissez un module pour accéder aux fiches de cours')}
                </p>
            </div>

            {/* Module Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modules
                    .sort((a, b) => a.order - b.order)
                    .map((mod: CourseModule, index: number) => {
                        const styles = colorStyles[mod.color] || colorStyles.blue;
                        const linkTo = mod.id === 'incoterms-supply-chain'
                            ? '/course/incoterms-supply-chain'
                            : `/course/${mod.id}`;

                        return (
                            <Link key={mod.id} to={linkTo} className="block group">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`h-full bg-white dark:bg-slate-800 p-6 rounded-3xl border shadow-sm hover:shadow-md transition-all relative overflow-hidden ${styles.border}`}
                                >
                                    {/* Module number badge */}
                                    <span className="absolute top-5 right-5 text-xs font-bold uppercase tracking-wider px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full">
                                        Module {mod.order}
                                    </span>

                                    {/* Icon */}
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${styles.iconBg} ${styles.text}`}>
                                        {iconMap[mod.icon] || <Globe size={28} />}
                                    </div>

                                    {/* Title */}
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors pr-16">
                                        {mod.title}
                                    </h2>

                                    {/* Description */}
                                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-4">
                                        {mod.description}
                                    </p>

                                    {/* Stats row */}
                                    <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
                                        <span>{mod.sheets.length} fiche{mod.sheets.length > 1 ? 's' : ''}</span>
                                        {(mod.questionCount ?? 0) > 0 && (
                                            <span>{mod.questionCount} question{(mod.questionCount ?? 0) > 1 ? 's' : ''}</span>
                                        )}
                                    </div>

                                    {/* Arrow */}
                                    <div className="mt-6 flex items-center text-sm font-semibold text-slate-400 dark:text-slate-500 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
                                        Accéder <ChevronRight size={16} className="ml-1" />
                                    </div>
                                </motion.div>
                            </Link>
                        );
                    })}
            </div>
        </div>
    );
};
