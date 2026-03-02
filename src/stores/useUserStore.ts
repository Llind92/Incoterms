import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { tauriStorage } from '../lib/persistence';

// Typage des statistiques et de la progression
export interface UserStats {
    totalCorrect: number;
    totalAnswered: number;
    modulesCompleted: string[];
    lastQuizDate: string | null;
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
                state?.setHasHydrated(true);
            },
        }
    )
);
