import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import frTranslations from '../locales/fr/translation.json';
import esTranslations from '../locales/es/translation.json';
import { useUserStore } from '../stores/useUserStore';

// Initialiser i18next
// IMPORTANT : PAS de LanguageDetector ici !
// Le LanguageDetector détecte la langue du navigateur (souvent 'fr' ou 'en')
// et écrase la valeur stockée dans Zustand AVANT que l'hydratation asynchrone
// du Tauri Store ait eu le temps de restaurer la vraie valeur ('es').
// La langue est gérée EXCLUSIVEMENT par le Zustand store (useUserStore).
i18n
    .use(initReactI18next)
    .init({
        resources: {
            fr: frTranslations,
            es: esTranslations
        },
        lng: 'fr', // Valeur par défaut, sera écrasée par le store Zustand via le useEffect dans App.tsx
        fallbackLng: 'fr',

        interpolation: {
            escapeValue: false, // React échappe déjà les valeurs (XSS protection)
        },
        debug: false,
    });

// Synchroniser avec Zustand
// Souscrire aux changements du store pour mettre à jour la langue i18n en temps réel
useUserStore.subscribe((state: any) => {
    if (state.language && state.language !== i18n.language) {
        i18n.changeLanguage(state.language);
    }
});

export default i18n;
