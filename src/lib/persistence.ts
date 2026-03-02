import { LazyStore } from '@tauri-apps/plugin-store';
import { StateStorage } from 'zustand/middleware';

// Détection de l'environnement Tauri
// window.__TAURI_INTERNALS__ est injecté par Tauri dans sa webview native
const isTauri = typeof window !== 'undefined' && !!(window as any).__TAURI_INTERNALS__;

// Création de l'instance du store Tauri (uniquement si disponible)
const tauriStore = isTauri ? new LazyStore('incomaster-data.json') : null;

/**
 * Adapter personnalisé avec fallback localStorage.
 * - En mode Tauri natif : utilise le plugin @tauri-apps/plugin-store (fichier JSON natif)
 * - En mode navigateur (npm run dev) : utilise localStorage comme fallback
 *   pour permettre la persistance du state (langue, thème, scores) en développement.
 */
export const tauriStorage: StateStorage = {
    getItem: async (name: string): Promise<string | null> => {
        try {
            if (tauriStore) {
                const value = await tauriStore.get<string>(name);
                return value || null;
            }
            // Fallback localStorage pour le dev navigateur
            return localStorage.getItem(name);
        } catch (error) {
            console.error(`Erreur Storage (Lecture de la clé: ${name}):`, error);
            // Dernier recours : tenter localStorage
            try { return localStorage.getItem(name); } catch { return null; }
        }
    },

    setItem: async (name: string, value: string): Promise<void> => {
        try {
            if (tauriStore) {
                await tauriStore.set(name, value);
                await tauriStore.save();
            } else {
                // Fallback localStorage
                localStorage.setItem(name, value);
            }
        } catch (error) {
            console.error(`Erreur Storage (Écriture de la clé: ${name}):`, error);
            try { localStorage.setItem(name, value); } catch { /* noop */ }
        }
    },

    removeItem: async (name: string): Promise<void> => {
        try {
            if (tauriStore) {
                await tauriStore.delete(name);
                await tauriStore.save();
            } else {
                localStorage.removeItem(name);
            }
        } catch (error) {
            console.error(`Erreur Storage (Suppression de la clé: ${name}):`, error);
            try { localStorage.removeItem(name); } catch { /* noop */ }
        }
    },
};
