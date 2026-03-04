
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { ThemeProvider } from './components/layout/ThemeProvider';
import { DashboardView } from './views/DashboardView';
import { QuizView } from './views/QuizView';
import { PriceCalculator } from './components/shared/PriceCalculator';
import { CourseView } from './views/CourseView';
import { CourseIndexView } from './views/CourseIndexView';
import { ModuleCourseView } from './views/ModuleCourseView';
import { SettingsView } from './views/SettingsView';
import { CascadePracticeView } from './views/CascadePracticeView';
import { useUserStore } from './stores/useUserStore';
import i18n from './config/i18n';

function App() {
    const hasHydrated = useUserStore((state) => state._hasHydrated);
    const language = useUserStore((state) => state.language);

    useEffect(() => {
        if (hasHydrated && language && i18n.language !== language) {
            i18n.changeLanguage(language);
        }
    }, [hasHydrated, language]);

    if (!hasHydrated) {
        return null; // Attendre la réhydratation du store Tauri
    }

    return (
        <ThemeProvider>
            <HashRouter>
                <Routes>
                    {/* Layout Principal encapsulant toutes les vues */}
                    <Route path="/" element={<AppLayout />}>

                        {/* Routes de l'application */}
                        <Route index element={<DashboardView />} />
                        <Route path="calculator" element={<PriceCalculator />} />
                        <Route path="quiz" element={<QuizView />} />
                        <Route path="practice" element={<CascadePracticeView />} />
                        <Route path="settings" element={<SettingsView />} />

                        {/* Cours — index des modules */}
                        <Route path="course" element={<CourseIndexView />} />

                        {/* Cours — Incoterms (vue dédiée existante) */}
                        <Route path="course/incoterms-supply-chain" element={<CourseView />} />

                        {/* Cours — Vue dynamique par module */}
                        <Route path="course/:moduleId" element={<ModuleCourseView />} />
                        <Route path="course/:moduleId/:sheetId" element={<ModuleCourseView />} />

                        {/* Fallback (404 catch-all) */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Route>
                </Routes>
            </HashRouter>
        </ThemeProvider>
    );
}

export default App;
