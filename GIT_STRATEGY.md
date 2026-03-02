# Stratégie Git — INCOMASTER BTS CI

## Modèle de Branches (GitFlow Simplifié)

```
main
 └── develop
      ├── feat/data-models
      ├── feat/calculator-engine
      └── feat/quiz-engine
```

### Rôle de chaque branche

| Branche | Rôle | Règles |
|---------|------|--------|
| `main` | Code de production stable — version livrée | Jamais de commit direct. Merge depuis `develop` uniquement via PR. Tag de version obligatoire. |
| `develop` | Branche d'intégration principale | Les feature branches sont mergées ici. Doit toujours compiler (`npm run build` OK). |
| `feat/data-models` | Création des interfaces TypeScript et du JSON Incoterms | Base : `develop`. Merge dans `develop` une fois les types et données validés. |
| `feat/calculator-engine` | Moteur de calcul de la cascade des prix | Base : `develop`. Dépend de `feat/data-models` (types nécessaires). |
| `feat/quiz-engine` | Structure de données des questions / annales | Base : `develop`. Dépend de `feat/data-models` (types `QuizQuestion`). |

---

## Initialisation du dépôt

```bash
git init
git checkout -b main
git add .
git commit -m "chore: initial project scaffold"

git checkout -b develop
git checkout -b feat/data-models
# ... travail sur les types et JSON ...
git checkout develop
git merge feat/data-models --no-ff -m "feat: add Incoterms 2020 data models and JSON"

git checkout -b feat/calculator-engine
# ... travail sur le moteur de calcul ...
git checkout develop
git merge feat/calculator-engine --no-ff -m "feat: add price cascade calculator engine"

git checkout -b feat/quiz-engine
# ... travail sur le quiz ...
git checkout develop
git merge feat/quiz-engine --no-ff -m "feat: add quiz question data structures"

# Merge final vers main (release)
git checkout main
git merge develop --no-ff -m "release: v1.0.0 — MVP Incomaster BTS CI"
git tag v1.0.0
```

---

## Convention des Messages de Commit (Conventional Commits)

```
<type>(<scope>): <description courte>

[corps optionnel]

[footer optionnel]
```

### Types autorisés

| Type | Usage |
|------|-------|
| `feat` | Nouvelle fonctionnalité |
| `fix` | Correction de bug |
| `chore` | Tâche de maintenance (config, deps) |
| `docs` | Documentation uniquement |
| `test` | Ajout ou modification de tests |
| `refactor` | Refactoring sans changement de comportement |
| `style` | Formatage (pas de changement fonctionnel) |

### Exemples

```bash
git commit -m "feat(data): add all 11 Incoterms 2020 to JSON database"
git commit -m "feat(calculator): implement CIF insurance formula with 10% uplift"
git commit -m "fix(calculator): correct customs value calculation for DDP"
git commit -m "docs: update README with Tauri installation instructions"
git commit -m "test(calculator): add unit tests for calcInsurancePremium"
```

---

## Règles de protection (à configurer sur GitHub/GitLab)

- **`main`** : Protection stricte — review obligatoire, CI doit passer (build + tests)
- **`develop`** : Review recommandée pour les merges de features
- Aucun `git push --force` sur `main` ou `develop`
