# 📋 INCOMASTER — Dossier de Fabrication (Source de Vérité)

> **Dernière mise à jour** : 4 mars 2026
> **Rôle du fichier** : Ce document est la **source de vérité unique** du projet. Tout agent ou développeur rejoignant le projet doit le lire en premier.

---

## 1. ÉTAT ACTUEL DU PROJET

IncoMaster est une application **macOS desktop** (Tauri 2 + React) de révision académique sur les **Incoterms CCI 2020** pour étudiants en BTS Commerce International.

### Fonctionnalités implémentées (✅ Production-ready)

| Route | Vue | Composant principal | Description |
|-------|-----|---------------------|-------------|
| `/#/` | Dashboard | `DashboardView.tsx` | Tableau de bord : progression globale, grille des 5 modules E5, accès rapide outils |
| `/#/course` | Index des modules | `CourseIndexView.tsx` | Grille de sélection des 5 modules E5 (MOI) avec nb fiches et questions |
| `/#/course/incoterms-supply-chain` | Fiches Incoterms | `CourseView.tsx` | Exploration des 11 Incoterms 2020 (vue dédiée 2 colonnes) |
| `/#/course/:moduleId` | Cours dynamique | `ModuleCourseView.tsx` | Vue cours par module : TOC latérale + rendu ContentBlock (exam_trap, formules, tableaux) |
| `/#/course/:moduleId/:sheetId` | Fiche de cours | `ModuleCourseView.tsx` | Deep-link vers une fiche spécifique |
| `/#/quiz` | Quiz | `QuizView.tsx` → `QuizEngine.tsx` → `QuizResults.tsx` | Quiz avec **écran de config** (sélection modules, difficulté, nb questions, mode examen blanc E5) |
| `/#/calculator` | Calculateur | `PriceCalculator.tsx` | Calculateur interactif de cascade des prix export (EXW → DDP) |
| `/#/practice` | Entraînement calculs | `CascadePracticeView.tsx` | Mode entraînement cascade avec scénarios aléatoires |
| `/#/settings` | Paramètres | `SettingsView.tsx` | Thème, Langue, Reset de progression |

---

## 2. ARCHITECTURE TECHNIQUE

### Stack

| Couche | Technologie | Version | Notes |
|--------|-------------|---------|-------|
| Shell natif | **Tauri** | 2.x | Fenêtre macOS, accès FS sécurisé |
| Frontend | **React** + **TypeScript** | 19.x / 5.x | Vite comme bundler |
| Styling | **Tailwind CSS** | **v4** | Attention : la syntaxe v4 diffère de v3 (pas de `tailwind.config.js`, config dans `index.css` via `@theme`) |
| State global | **Zustand** | 5.x | 2 stores : `useQuizStore` (éphémère) et `useUserStore` (persisté) |
| Routing | **React Router DOM** | `HashRouter` | `HashRouter` est obligatoire sous Tauri (survit aux `Cmd+R`) |
| Animations | **Framer Motion** | 12.x | Transitions de page, jauges, effets de shake |
| Icônes | **Lucide React** | — | Bibliothèque d'icônes SVG |
| i18n | **react-i18next** | — | Fichiers : `src/locales/fr/translation.json`, `src/locales/es/translation.json` |

### Arborescence clé

```text
src/
├── App.tsx                          # Routes, ThemeProvider, Hydration guard
├── main.tsx                         # Point d'entrée React
├── index.css                        # Tokens Tailwind v4 (@theme)
├── components/
│   ├── layout/
│   │   └── AppLayout.tsx            # Sidebar nav + contenu (Outlet)
│   └── shared/
│       ├── ContentBlockRenderer.tsx # Renderer de blocs de contenu (cours modulaires)
│       ├── PriceCalculator.tsx      # Calculateur cascade des prix
│       ├── QuizEngine.tsx           # Moteur de quiz (interface QuizQuestion ici)
│       └── QuizResults.tsx          # Écran résultats détaillés
├── config/
│   └── i18n.ts                      # Configuration i18next
├── core/
│   ├── calculatorLogic.ts           # Logique mathématique pure (v2 — BTS CI strict)
│   └── calculatorLogic.test.ts      # Tests unitaires moteur (7 suites, 38 assertions)
├── data/
│   ├── incoterms2020Data.json       # Base de données des 11 Incoterms
│   ├── quizQuestions.json           # 353 questions unifiées et validées BTS CI
│   ├── quiz_batch{1-4}.json         # Archives brutes (ne PAS utiliser directement)
│   └── modules/                     # Architecture modulaire E5 — MOI
│       ├── index.ts                 # Loader : exporte modules[], getModuleById(), getAllQuestions()
│       ├── logistique-transport/    # Module 1 : Transport international
│       │   ├── module.json
│       │   ├── sheets/*.json        # 4 fiches de cours (CourseSheet)
│       │   └── questions.json       # Questions quiz du module
│       ├── douane-fiscalite/        # Module 2 : Douane & Fiscalité
│       │   ├── module.json
│       │   ├── sheets/*.json        # 4 fiches (EOV, dette douanière, EMEBI, régimes)
│       │   └── questions.json
│       ├── paiements-financements/  # Module 3 : Paiements internationaux
│       │   ├── module.json
│       │   ├── sheets/*.json        # 4 fiches (CREDOC, REMDOC, SWIFT, financements)
│       │   └── questions.json
│       ├── risque-change-pays/      # Module 4 : Risque de change & pays
│       │   ├── module.json
│       │   ├── sheets/*.json        # 4 fiches (change, couverture, pays, assurance-crédit)
│       │   └── questions.json
│       └── incoterms-supply-chain/  # Module 5 : Incoterms (base existante)
│           ├── module.json
│           └── questions.json       # Vide — utilise quizQuestions.json
├── locales/
│   ├── fr/translation.json
│   └── es/translation.json
├── stores/
│   ├── useQuizStore.ts              # État quiz ÉPHÉMÈRE (+ mode examen)
│   └── useUserStore.ts              # État utilisateur PERSISTÉ (+ moduleProgress)
├── types/
│   ├── Incoterm.ts                  # Interfaces TypeScript des Incoterms
│   ├── QuizQuestion.ts             # Interfaces enrichies (type-level)
│   └── modules.ts                   # ModuleId, ContentBlock, CourseSheet, CourseModule
└── views/
    ├── CascadePracticeView.tsx
    ├── CourseIndexView.tsx           # Grille de sélection des 5 modules E5
    ├── CourseView.tsx                # Vue dédiée Incoterms (2 colonnes)
    ├── DashboardView.tsx             # Dashboard avec cartes modules + outils
    ├── ModuleCourseView.tsx          # Vue cours dynamique (TOC + ContentBlockRenderer)
    ├── QuizView.tsx                  # Quiz avec écran config (modules, difficulté, nb questions)
    └── SettingsView.tsx
```

### Persistance asynchrone sécurisée (Zustand + Tauri Store)

Le `useUserStore` utilise le middleware `persist` de Zustand avec un **storage adapter Tauri** asynchrone (`@tauri-apps/plugin-store`). Cela implique :

1. **Le store est asynchrone** : au lancement, React rend l'UI AVANT que Tauri ait chargé les données depuis le disque.
2. **Flag `_hasHydrated`** : Un booléen dans le store permet de bloquer le rendu de `App.tsx` tant que l'hydratation n'est pas terminée.
3. **Sync i18next** : Un `useEffect` dans `App.tsx` force la synchronisation de `i18next.changeLanguage()` avec `useUserStore.language` **après** l'hydratation, pour éviter le reset de la langue au refresh.

> ⚠️ **Ne jamais** utiliser `MemoryRouter` (perd la route au refresh). Toujours `HashRouter`.

---

## 3. LOGIQUE MÉTIER CERTIFIÉE — Le « Cœur du Réacteur »

Ces règles sont issues des **normes CCI 2020** et validées par les **annales officielles BTS CI**. Toute modification doit respecter ces invariants.

### 3.1 Règle FCA — Dédouanement Export

> **À partir de FCA (inclus), le dédouanement export est TOUJOURS à la charge du vendeur.** EXW est le SEUL Incoterm où le dédouanement export incombe à l'acheteur.

```
EXW → [Dédouanement Export = ACHETEUR]
FCA, FAS, FOB, CFR, CIF, CPT, CIP, DAP, DPU, DDP → [Dédouanement Export = VENDEUR]
```

### 3.2 Classification des 11 Incoterms 2020

| Famille | Incoterms | Usage |
|---------|-----------|-------|
| **Multimodal** (tous transports) | EXW, FCA, CPT, CIP, DAP, DPU, DDP | Route, air, fer, maritime conteneurisé |
| **Maritime & fluvial uniquement** | FAS, FOB, CFR, CIF | Vrac, conventionnel, déconseillé en conteneur |

### 3.3 Moteur de calcul `calculateIncoterms()` — Règles v2 (BTS CI strict)

Fichier : `src/core/calculatorLogic.ts` — Fonction pure, testé par `calculatorLogic.test.ts` (**38 assertions, 7 suites**).

#### Cascade des prix (étapes)

```
EXW = Marchandise + Emballage
FCA = EXW + Dédouanement + Pré-acheminement
FOB = FCA + Entreposage + Mise à bord                     (Maritime uniquement)
──── BASCULE DEVISE (si isCurrencyConverted) ────
baseConvertie = FOB|FCA × tauxChange
Fret Total = Fret de base + BAF + CAF                       (cascade, pas addition)
fraisDocConverted = fraisDoc × tauxChange                   (si isBilledInBaseCurrency)
CFR|CPT = baseConvertie + Fret Total + fraisDocConverted
CIF|CIP = Assurance (circulaire ou linéaire)
DAP = CIF|CIP + Post-acheminement
DPU = DAP + Déchargement
DDP = DPU + Droits & Taxes
```

#### Paramètres avancés

| Paramètre | Type | Défaut | Effet |
|-----------|------|--------|-------|
| `isCurrencyConverted` | `boolean` | `false` | Active la multiplication par `tauxChange` au point FOB/FCA |
| `isBilledInBaseCurrency` | `boolean` | `true` | Frais doc en devise de base → convertis × tauxChange avant CFR |
| `isInsuranceCircular` | `boolean` | `true` | Circulaire CCI : `CIF = CFR / (1 - coeff × taux)`. Linéaire : `Ass = CFR × coeff × taux` |
| `majorationAssurancePct` | `number` | `10` | Coefficient de majoration (ex : 10 → 1.10) |
| `bafPct` / `cafPct` | `number` | `0` | BAF/CAF en cascade (Maritime). BAF sur fret, CAF sur fret+BAF |
| `fraisDocumentaires` | `number` | `0` | B/L, LTA… Ajoutés au CFR **hors BAF/CAF** |

> ⚠️ Le B/L (**fraisDocumentaires**) n'est **PAS** dans le FOB. Il est ajouté au CFR après le fret.

### 3.4 Formule d'assurance — Double méthode

- **Circulaire CCI** (défaut) : `CIF = CFR / (1 - coeff × taux)` — Assurance = CIF - CFR
- **Linéaire** (exception d'examen) : `Assurance = CFR × coeff × taux` — CIF = CFR + Assurance
- Le `coeff` = `1 + majorationAssurancePct/100` (ex : 10% → 1.10)

### 3.5 Assurance obligatoire CIP vs CIF (PIÈGE EXAMEN 2020)

| Incoterm | Assurance minimum (2010) | Assurance minimum (2020) |
|----------|--------------------------|--------------------------|
| **CIF** | ICC(C) — restreinte | **ICC(C)** — restreinte (inchangé) |
| **CIP** | ICC(C) — restreinte | **ICC(A)** — Tous Risques ← NOUVEAUTÉ |

> 🎓 C'est la question la plus testée aux épreuves BTS CI depuis 2020.

### 3.6 Valeur en douane UE (Art. 70 CDU)

```
Valeur en douane = CIF (ou CIP) au PREMIER POINT D'ENTRÉE dans l'UE
```

- Les frais **postérieurs** à l'arrivée (THC arrivée, transport interne UE, dédouanement) sont **EXCLUS**.
- Si l'Incoterm est CIP avec destination au-delà du port d'entrée UE (ex : CIP Strasbourg via Hambourg), **déduire** les frais Hambourg→Strasbourg.

### 3.7 DPU — L'Incoterm unique

DPU (ex-DAT) est le **seul** Incoterm où le risque se transfère **APRÈS le déchargement** à destination. Pour tous les autres (DAP, DDP), le risque passe avant le déchargement.

### 3.8 THC dans la cascade multimodale

- **THC départ** (Terminal Handling Charges au port de chargement) : **incluses** dans la cascade entre FCA et CPT/CIP.
- **THC arrivée** (au port de destination) : **exclues** du prix CIF/CIP. À la charge de l'acheteur.

---

## 4. DONNÉES — QUIZ & FICHES DE COURS

### 4.1 Fichier `quizQuestions.json` — 353 questions

Répartition structurée (minimum 60 par module) :
- Incoterms & Supply Chain : 103
- Logistique & Transport : 70
- Douane & Fiscalité : 60
- Paiements & Financements : 60
- Risque de Change & Pays : 60

L'interface TypeScript est définie dans `QuizEngine.tsx` :

```typescript
export interface QuizQuestion {
  id: string;
  type: "multiple_choice" | "case_study" | "calculation";
  difficulty: "easy" | "medium" | "hard";
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  source?: string;  // ← NOUVEAU
}
```

#### Champ `source` — Traçabilité

| Valeur | Signification | Quantité |
|--------|---------------|----------|
| `"Annale Officielle BTS CI"` | Question issue ou inspirée d'une annale BTS CI réelle | 67 |
| `"Entraînement IncoMaster"` | Question originale créée pour l'entraînement | 26 |

Le `source` est affiché dans le quiz sous forme d'un **badge conditionnel** :
- **Annale** → Badge amber avec icône `Award` (Lucide)
- **Entraînement** → Badge slate neutre

#### Fichiers archives `quiz_batch{1-4}.json`

Ces fichiers sont des **sources brutes** qui ont été fusionnées dans `quizQuestions.json`. Ne les modifier que pour ajouter de nouvelles questions en batch, puis re-fusionner.

### 4.2 Fichier `incoterms2020Data.json` — 11 Incoterms

Structure complète de chaque Incoterm : nom, description, mode de transport, obligations vendeur/acheteur, transfert de risque et de frais. Consommé exclusivement par `CourseView.tsx`.

### 4.3 i18n — Langues

- Les **clés UI** (boutons, titres, libellés) sont traduites en FR et ES dans `src/locales/`.
- Le **contenu des JSON** (questions quiz, fiches Incoterms) reste en **français uniquement**. La traduction du contenu data n'a pas encore été implémentée.

---

## 5. GUIDE UI/UX

### 5.1 Rich Text Renderer (`formatRichText`)

Fonction utilitaire dans `QuizEngine.tsx` qui parse les strings brutes du JSON pour un affichage enrichi :

| Détection | Rendu | Exemple |
|-----------|-------|---------|
| Montants financiers (regex) | `<strong>` bleu semibold | `125 000 EUR`, `95,15 USD` |
| Pourcentages (regex) | `<strong>` violet semibold | `0,5 %`, `110 %` |
| Incoterms (liste des 11 + DAT) | `<span>` badge indigo inline | `CIF`, `FCA`, `DPU` |
| Sauts de ligne `\n` | `<p>` avec marge | — |

### 5.2 Conteneurs visuels du Quiz

- **Énoncé** : Fond slate clair, bordure gauche bleue 4px, coins arrondis xl, ombre douce.
- **Explication** : Fond indigo/violet léger, icône Info, texte détaillé avec formules en gras.
- **Boutons de réponse** : ❌ NE PAS MODIFIER. Design finalisé et validé.

### 5.3 Dark Mode

Le thème est géré par `SettingsView.tsx` → `useUserStore.theme` → classe `dark` sur `<html>`.

Directives :
- Tout composant DOIT supporter `dark:` prefix Tailwind.
- Fonds principaux : `bg-white dark:bg-slate-950`, `bg-slate-50 dark:bg-slate-900`.
- Texte principal : `text-slate-800 dark:text-slate-200`.
- Bordures : `border-slate-200 dark:border-slate-800`.
- Les CSS variables Tailwind v4 sont définies dans `index.css` via `@theme`.

### 5.4 Design System — Principes

- Style **académique Apple** : sobre, professionnel, espaces généreux.
- Typographie : polices système macOS natives.
- Composants : Tailwind utility-first, pas de bibliothèque de composants externe (pas de Shadcn).
- Animations : Framer Motion pour les transitions de page et les feedbacks interactifs.

---

## 6. BACKLOG — Prochaines étapes

### Priorité 1 — Quick wins

- [ ] **Export PDF / Copier** du calculateur de cascade des prix
- [ ] **Raccourcis clavier macOS** (ex : `Cmd+1` pour Dashboard, `Cmd+Q` pour quitter proprement)
- [ ] **Icônes natives `.icns`** pour la barre Dock et la fenêtre Tauri

### Priorité 2 — Améliorations fonctionnelles

- [ ] **Traduction du contenu data** : Dupliquer ou structurer `quizQuestions.json` et `incoterms2020Data.json` pour le contenu espagnol
- [ ] **Filtrage des questions** par difficulté, par source, ou par Incoterm
- [ ] **Mode examen chronométré** avec timer et score final sous pression
- [ ] **Statistiques avancées** dans le Dashboard (taux de réussite par type d'Incoterm, courbe de progression)
- [ ] **Enrichissement fiches de cours** : Documents à fournir, mention emballage, procédure PCRD CIF/CIP

### Priorité 3 — Polish

- [ ] **Lint error** `App.tsx` : `Cannot find module './views/SettingsView'` — vérifier les imports
- [ ] **Code-splitting** : Lazy loading des vues avec `React.lazy()` pour réduire le bundle
- [x] **Tests unitaires** : `calculatorLogic.test.ts` — 7 suites, 38 assertions ✅

---

## 7. COMMANDES ESSENTIELLES

```bash
# Développement (Vite + HMR)
npm run dev

# Build de production (TypeScript check + Vite)
npm run build

# Lancement Tauri (desktop natif)
npm run tauri dev

# Build Tauri pour distribution
npm run tauri build
```

---

> 📌 **Convention** : tout nouveau fichier de données doit être ajouté dans `src/data/`. Toute nouvelle vue doit être ajoutée dans `src/views/` et enregistrée dans le routeur de `App.tsx` et la sidebar de `AppLayout.tsx`.