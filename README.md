# IncoMaster

Application macOS de revision des **Incoterms 2020** (CCI) pour etudiants en **BTS Commerce International**.

Construite avec **Tauri 2** + **React 19** + **TypeScript** + **Tailwind CSS v4**.

---

## Fonctionnalites

| Module | Description |
|--------|-------------|
| **Fiches de cours** | 11 Incoterms 2020 avec transfert des risques, frais, douane, assurance. Vue split-pane Multimodal / Maritime. |
| **Calculateur de cascade** | Calcul interactif EXW -> DDP avec formule circulaire assurance (110%), valeur en douane UE. |
| **Quiz** | 87 questions (67 annales officielles BTS CI 2009-2025 + 20 entrainement). Correction detaillee avec regles CCI. |
| **Exercices pratiques** | Scenarios aleatoires avec saisie libre et correction automatique pas a pas. |
| **Dashboard** | Progression, statistiques, acces rapide aux modules. |

---

## Stack technique

| Categorie | Technologie | Version |
|-----------|-------------|---------|
| Runtime desktop | Tauri | 2.x |
| UI | React | 19.2 |
| Langage | TypeScript | 5.9 |
| Styling | Tailwind CSS | 4.2 (v4) |
| State | Zustand | 5.0 |
| Animations | Framer Motion | 12.x |
| i18n | react-i18next | 16.x |
| Icones | Lucide React | 0.575 |
| Bundler | Vite | 7.3 |

---

## Prerequis

- **Node.js** >= 20 LTS
- **Rust** (via [rustup](https://rustup.rs)) pour la compilation Tauri
- **Xcode Command Line Tools** (`xcode-select --install`)

---

## Installation

```bash
git clone https://github.com/Llind92/Incoterms.git
cd Incoterms
npm install
```

---

## Lancement

```bash
# Frontend seul (navigateur, mode dev)
npm run dev

# Application macOS complete (Tauri + React)
npm run tauri dev
```

---

## Build de production

```bash
npm run tauri build
# Sortie : src-tauri/target/release/bundle/macos/IncoMaster.app
```

---

## Structure du projet

```
src/
├── views/                    # Pages de l'application
│   ├── DashboardView.tsx     # Accueil + progression
│   ├── CourseView.tsx        # Fiches Incoterms (split-pane)
│   ├── QuizView.tsx          # Module quiz (10 questions)
│   ├── CascadePracticeView.tsx # Exercices pratiques
│   └── SettingsView.tsx      # Theme, langue, reset
├── components/
│   ├── layout/               # AppLayout, ThemeProvider
│   └── shared/               # PriceCalculator, QuizEngine, QuizResults
├── core/
│   └── calculatorLogic.ts    # Fonctions mathematiques pures (750+ lignes)
├── data/
│   ├── incoterms2020Data.json # 11 Incoterms 2020 (CCI)
│   └── quizQuestions.json     # 87 questions validees
├── stores/
│   ├── useUserStore.ts       # Etat persistant (Tauri Store)
│   └── useQuizStore.ts       # Etat ephemere du quiz
├── types/
│   ├── Incoterm.ts           # Interfaces TypeScript Incoterm
│   └── QuizQuestion.ts       # Interfaces TypeScript Quiz
├── locales/                  # Traductions FR / ES
├── config/i18n.ts            # Configuration i18next
├── lib/persistence.ts        # Adaptateur Tauri Store / localStorage
├── App.tsx                   # Routeur (HashRouter)
└── main.tsx                  # Point d'entree React
```

---

## Regles academiques implementees

| Regle | Implementation |
|-------|---------------|
| **Valeur en douane UE** | CIF au premier port d'entree UE (Art. 70 CDU) |
| **Assurance 110%** | Valeur a assurer = CIF x 1,10 |
| **CIP 2020** | Assurance ICC(A) Toutes Risques (vs ICC(C) en 2010) |
| **CIF** | Assurance minimum ICC(C) |
| **DPU** | Seul Incoterm avec transfert de risque apres dechargement |
| **EXW** | Dedouanement export a la charge de l'acheteur |
| **Formule circulaire** | CIF = CFR / (1 - 1,10 x taux) |

---

## Scripts

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur Vite (port 1420) |
| `npm run build` | Compilation TypeScript + Vite |
| `npm run type-check` | Verification des types (`tsc --noEmit`) |
| `npm run tauri dev` | Application macOS en mode dev |
| `npm run tauri build` | Build de production (.app / .dmg) |

---

## References academiques

- **ICC Incoterms 2020** — Chambre de Commerce Internationale ([iccwbo.org](https://iccwbo.org))
- **Code des Douanes de l'Union (CDU)** — Reglement UE 952/2013, Art. 70-72
- **TARIC** — Tarif Integre des Communautes Europeennes
- **Referentiel BTS Commerce International** — Epreuves E4/E5

---

## Licence

Usage educatif. Les donnees Incoterms sont basees sur les regles publiees par la CCI.
