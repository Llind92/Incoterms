import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Calculator, PlayCircle, Award, PenTool } from 'lucide-react';
import { useUserStore } from '../stores/useUserStore';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const DashboardView: React.FC = () => {
    const { t } = useTranslation();
    // TODO: Fix linter complaining of undefined UserStats / add real data connection
    const stats = useUserStore((state) => state.stats);

    const totalAnswered = stats?.totalAnswered || 0;
    const totalCorrect = stats?.totalCorrect || 0;

    // Règle BTS CI : Il faut au moins 70% pour maîtriser (score arbitraire)
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

            {/* MODULES CARDS (GRID) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                <DashboardCard
                    icon={<BookOpen size={32} />}
                    title={t('nav.course')}
                    description={t('course.subtitle')}
                    color="blue"
                    linkTo="/course"
                    actionText={t('dashboard.btn_course')}
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
                    icon={<PlayCircle size={32} />}
                    title={t('nav.quiz')}
                    description={t('quiz.subtitle', { count: 35 })}
                    color="indigo"
                    linkTo="/quiz"
                    actionText={t('dashboard.btn_quiz')}
                    badge="Pratique"
                />

                <DashboardCard
                    icon={<PenTool size={32} />}
                    title={t('nav.practice')}
                    description={t('practice.dashboard_desc')}
                    color="cyan"
                    linkTo="/practice"
                    actionText={t('dashboard.btn_practice')}
                    badge="Nouveau"
                />

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
