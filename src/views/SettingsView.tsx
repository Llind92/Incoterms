import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, Moon, Sun, Globe, AlertTriangle, RefreshCcw, Check } from 'lucide-react';
import { useUserStore } from '../stores/useUserStore';
import { useTranslation } from 'react-i18next';

export const SettingsView: React.FC = () => {
    const { t } = useTranslation();
    const { theme, language, setTheme, setLanguage, resetProgress, stats } = useUserStore();
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);

    // Options configuration
    const themeOptions = [
        { value: 'light', label: t('settings.theme_light'), icon: Sun },
        { value: 'dark', label: t('settings.theme_dark'), icon: Moon },
        { value: 'system', label: t('settings.theme_system'), icon: Monitor },
    ] as const;

    const languageOptions = [
        { value: 'fr', label: 'Français' },
        { value: 'es', label: 'Español' },
    ] as const;

    // Handlers
    const handleReset = () => {
        resetProgress();
        setIsConfirmOpen(false);
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200 p-4 md:p-8">
            <div className="max-w-2xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{t('nav.settings')}</h1>
                    <p className="text-slate-500 dark:text-slate-400">{t('settings.subtitle')}</p>
                </div>

                <div className="space-y-6">
                    {/* Section: Apparence */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">{t('settings.appearance')}</h2>
                        </div>
                        <div className="p-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <div className="font-semibold text-slate-900 dark:text-white">{t('settings.theme_title')}</div>
                                    <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('settings.theme_desc')}</div>
                                </div>
                                <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                                    {themeOptions.map((option) => {
                                        const Icon = option.icon;
                                        const isActive = theme === option.value;
                                        return (
                                            <button
                                                key={option.value}
                                                onClick={() => setTheme(option.value)}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                                                    ${isActive
                                                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
                                            >
                                                <Icon size={16} />
                                                <span className="hidden sm:inline">{option.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section: Langue */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">{t('settings.localization')}</h2>
                        </div>
                        <div className="p-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <div className="mt-1 p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-300">
                                        <Globe size={20} />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-slate-900 dark:text-white">{t('settings.language_title')}</div>
                                        <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('settings.language_desc')}</div>
                                    </div>
                                </div>
                                <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                                    {languageOptions.map((option) => {
                                        const isActive = language === option.value;
                                        return (
                                            <button
                                                key={option.value}
                                                onClick={() => setLanguage(option.value)}
                                                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200
                                                    ${isActive
                                                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
                                            >
                                                {option.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section: Données & Danger Zone */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border-2 border-red-100 dark:border-red-900/30 overflow-hidden">
                        <div className="px-6 py-4 border-b border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10">
                            <h2 className="text-sm font-bold text-red-800 dark:text-red-400 uppercase tracking-wider flex items-center gap-2">
                                <AlertTriangle size={16} /> {t('settings.danger_zone')}
                            </h2>
                        </div>
                        <div className="p-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div>
                                    <div className="font-semibold text-slate-900 dark:text-white">{t('settings.reset_title')}</div>
                                    <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                        {t('settings.reset_desc')}
                                        <div className="mt-2 text-xs font-mono bg-slate-100 dark:bg-slate-900 p-2 rounded-md inline-block">
                                            {t('settings.answered_stats', { count: stats.totalAnswered })}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsConfirmOpen(true)}
                                    className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 font-medium rounded-xl transition-colors shadow-sm whitespace-nowrap"
                                >
                                    {t('settings.reset_btn')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de Confirmation */}
            <AnimatePresence>
                {isConfirmOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white dark:bg-slate-800 rounded-2xl p-6 md:p-8 shadow-xl max-w-md w-full border border-slate-200 dark:border-slate-700"
                        >
                            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center mb-4">
                                <AlertTriangle size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t('settings.modal_title')}</h3>
                            <p className="text-slate-500 dark:text-slate-400 mb-8">
                                {t('settings.modal_desc')}
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setIsConfirmOpen(false)}
                                    className="px-5 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                >
                                    {t('settings.modal_cancel')}
                                </button>
                                <button
                                    onClick={handleReset}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors shadow-sm"
                                >
                                    <RefreshCcw size={16} /> {t('settings.modal_confirm')}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Toast de succès */}
                {showSuccessToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-4 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-full shadow-xl"
                    >
                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white">
                            <Check size={14} />
                        </div>
                        <span className="font-medium text-sm">{t('settings.toast_success')}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
