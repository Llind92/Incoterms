import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { tauriStorage } from '../lib/persistence';
import type { ModuleId, ModuleProgress } from '../types/modules';

// Typage des statistiques et de la progression
export interface UserStats {
    totalCorrect: number;
    totalAnswered: number;
    modulesCompleted: string[];
    lastQuizDate: string | null;
    moduleProgress: Partial<Record<ModuleId, ModuleProgress>>;
}

// Séparation de l'état (State)
interface UserState {
    stats: UserStats;
    language: 'fr' | 'es';
    theme: 'light' | 'dark' | 'system';
    _hasHydrated: boolean;
}

// Séparation des actions (Actions)
interface UserActions {
    addScore: (correct: number, total: number) => void;
    addModuleScore: (moduleId: ModuleId, correct: number, total: number) => void;
    markSheetViewed: (moduleId: ModuleId, sheetId: string) => void;
    markModuleCompleted: (moduleId: string) => void;
    setLanguage: (lang: 'fr' | 'es') => void;
    setTheme: (theme: 'light' | 'dark' | 'system') => void;
    resetProgress: () => void;
    setHasHydrated: (state: boolean) => void;
}

// Combinaison des deux pour le Store Zustand
export type UserStore = UserState & UserActions;

const initialStats: UserStats = {
    totalCorrect: 0,
    totalAnswered: 0,
    modulesCompleted: [],
    lastQuizDate: null,
    moduleProgress: {},
};

const getModuleProgress = (stats: UserStats, moduleId: ModuleId): ModuleProgress => {
    return stats.moduleProgress[moduleId] ?? {
        questionsAnswered: 0,
        questionsCorrect: 0,
        sheetsViewed: [],
        lastActivityDate: null,
    };
};

// Création du store persisté via Tauri Store Plugin
export const useUserStore = create<UserStore>()(
    persist(
        (set) => ({
            // --- ÉTAT INITIAL ---
            stats: initialStats,
            language: 'fr',
            theme: 'system',
            _hasHydrated: false,

            // --- ACTIONS ---
            addScore: (correct, total) =>
                set((state) => ({
                    stats: {
                        ...state.stats,
                        totalCorrect: state.stats.totalCorrect + correct,
                        totalAnswered: state.stats.totalAnswered + total,
                        lastQuizDate: new Date().toISOString(),
                    },
                })),

            addModuleScore: (moduleId, correct, total) =>
                set((state) => {
                    const prev = getModuleProgress(state.stats, moduleId);
                    return {
                        stats: {
                            ...state.stats,
                            totalCorrect: state.stats.totalCorrect + correct,
                            totalAnswered: state.stats.totalAnswered + total,
                            lastQuizDate: new Date().toISOString(),
                            moduleProgress: {
                                ...state.stats.moduleProgress,
                                [moduleId]: {
                                    ...prev,
                                    questionsAnswered: prev.questionsAnswered + total,
                                    questionsCorrect: prev.questionsCorrect + correct,
                                    lastActivityDate: new Date().toISOString(),
                                },
                            },
                        },
                    };
                }),

            markSheetViewed: (moduleId, sheetId) =>
                set((state) => {
                    const prev = getModuleProgress(state.stats, moduleId);
                    if (prev.sheetsViewed.includes(sheetId)) return state;
                    return {
                        stats: {
                            ...state.stats,
                            moduleProgress: {
                                ...state.stats.moduleProgress,
                                [moduleId]: {
                                    ...prev,
                                    sheetsViewed: [...prev.sheetsViewed, sheetId],
                                    lastActivityDate: new Date().toISOString(),
                                },
                            },
                        },
                    };
                }),

            markModuleCompleted: (moduleId) =>
                set((state) => {
                    if (state.stats.modulesCompleted.includes(moduleId)) {
                        return state; // Pas de mise à jour inutile
                    }
                    return {
                        stats: {
                            ...state.stats,
                            modulesCompleted: [...state.stats.modulesCompleted, moduleId],
                        },
                    };
                }),

            setLanguage: (lang) => set({ language: lang }),

            setTheme: (theme) => set({ theme }),

            resetProgress: () =>
                set({
                    stats: initialStats,
                }),

            setHasHydrated: (state) => set({ _hasHydrated: state }),
        }),
        {
            name: 'incomaster-user-storage', // Clé sous laquelle les données sont enregistrées
            storage: createJSONStorage(() => tauriStorage), // Injection de l'adapter Tauri
            // Partialize permet de choisir ce qu'on sauvegarde (ici on sauvegarde tout l'état)
            partialize: (state) => ({
                stats: state.stats,
                language: state.language,
                theme: state.theme,
            }),
            onRehydrateStorage: () => (state) => {
                // Migration : s'assurer que moduleProgress existe après hydratation
                if (state && !state.stats.moduleProgress) {
                    state.stats.moduleProgress = {};
                }
                state?.setHasHydrated(true);
            },
        }
    )
);
