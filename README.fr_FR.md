<p align="center">
  <img src="docs/assets/searchcli-logo.svg" alt="SearchCLI logo" width="560" />
</p>

# SearchCLI

[English](README.md) | [简体中文](README.zh_CN.md) | [日本語](README.ja_JP.md) | [Deutsch](README.de_DE.md) | [한국어](README.ko_KR.md) | Français | [Русский](README.ru_RU.md) | [Italiano](README.it_IT.md) | [Español](README.es_ES.md) | [Português](README.pt_BR.md) | [Türkçe](README.tr_TR.md) | [ไทย](README.th_TH.md) | [Bahasa Indonesia](README.id_ID.md)

Connectez une recherche stable et ajustable, des recommandations et une recherche conversationnelle à votre système Agent ou à votre système métier.

[Démarrage rapide (développeurs)](#démarrage-rapide-développeurs) · [Configuration AI Agent](#démarrage-rapide-ai-agents) · [Guide Agent complet](docs/agent-quick-start.md) · [Contribution](CONTRIBUTING.md) · [Sécurité](SECURITY.md)

SearchCLI est la CLI ouverte pour AI Search on Volcengine.

Si votre système Agent ou votre système métier a besoin de services de distribution d'information stables et ajustables, SearchCLI fournit un chemin pratique pour intégrer des fonctionnalités de recherche, de recommandation et de recherche conversationnelle de niveau production dans de vrais workflows.

Avec SearchCLI et ses `Viking skills` installables, les Agents externes peuvent onboarder des données, construire et valider des flux de recherche et de recommandation, exécuter la recherche conversationnelle, ajuster la configuration des stratégies, inspecter les bad cases et améliorer la qualité de recherche de façon stable et vérifiable.

## Ce qu'est SearchCLI

- La surface d'intégration en ligne de commande pour AI Search on Volcengine.
- Un chemin stable permettant aux systèmes externes d'accéder aux fonctionnalités de recherche, de recommandation et de recherche conversationnelle.
- Une couche de workflow adaptée aux Agents, basée sur des skills installables et des sorties de commande sûres pour l'automatisation.
- Un modèle d'exécution vérifiable avec dry-runs, points de confirmation et validation par relecture après écriture.

## À qui s'adresse SearchCLI

- Aux développeurs qui intègrent la distribution d'information propulsée par l'IA dans des systèmes métier.
- Aux équipes qui construisent des systèmes Agent et ont besoin de workflows de recherche, de recommandation et de recherche stables et configurables.
- Aux équipes d'exploitation, de delivery et de solutions qui doivent vérifier explicitement l'onboarding des données, la configuration des applications et le comportement d'exécution avant la production.

## Ce que SearchCLI permet

- La recherche d'items et de catalogues sur des données métier structurées.
- Des flux de recommandation connectés aux scènes applicatives et au comportement utilisateur.
- Des expériences de recherche conversationnelle ancrées dans la recherche applicative.
- Des workflows Agent capables d'onboarder des données, de configurer des applications et de valider le comportement d'exécution avec des étapes de revue explicites.

## Fonctionnalités principales

- `vs item profile | plan | apply` pour l'onboarding d'items structurés.
- `vs app`, `vs dataset` et `vs data` pour la gestion des applications et des jeux de données.
- `vs search run`, `vs recommend run` et `vs chat run` pour la validation à l'exécution.
- `vs search tune query-generate | plan | run | report` pour une première version d'évaluation et d'ajustement automatisés de la similarité textuelle.
- Des `Viking skills` installables pour que les Agents externes puissent utiliser les mêmes workflows.

## Prérequis

- Node.js 20 ou version ultérieure
- `git`
- Des AK/SK Volcengine avec accès à AI Search

## Démarrage rapide (développeurs)

### 1. Installer

```bash
git clone git@github.com:volcengine/SearchCLI.git vs
cd vs
bash ./scripts/install.sh
```

### 2. S'authentifier

Si le shell actuel dispose déjà de `VIKING_AK` et `VIKING_SK`:

```bash
vs auth import-env
vs auth status --json
vs doctor --json
```

Sinon, lancez la connexion interactive dans un vrai terminal:

```bash
vs auth login
```

Si vous utilisez la génération de requêtes pour l'ajustement de la recherche ou l'évaluation de pertinence par LLM, configurez une API LLM compatible OpenAI sans placer la clé API en clair dans la configuration:

```bash
vs llm login
vs llm status --json
vs search tune llm-check --live --json
```

Si le shell actuel dispose déjà de `VIKING_LLM_BASE_URL`, `VIKING_LLM_API_KEY` et `VIKING_LLM_MODEL`, vous pouvez utiliser `vs llm import-env` à la place. La clé API est stockée dans le magasin local sécurisé d'identifiants; l'URL de base et le modèle sont stockés comme configuration non secrète.

### 3. Exécuter le premier flux d'onboarding

Si l'utilisateur veut une nouvelle application avec revue de configuration au moment du bind et validation à l'exécution, utilisez le chemin `dataset+app`:

```bash
vs item profile --file ./items.json --pretty
vs item plan --file ./items.json --goal "Build item search"
vs item apply --plan-dir ./.viking/item-plans/<plan> --dry-run
vs item apply --plan-dir ./.viking/item-plans/<plan> --confirm-review --wait-ready --run-trials
```

Si seule la mise à disposition du jeu de données est nécessaire, utilisez le chemin `dataset-only`, générez un plan dataset-only avec `--skip-app`, puis arrêtez-vous après dataset create + ingest:

```bash
vs item profile --file ./items.json --pretty
vs item plan --file ./items.json --goal "Build item search" --skip-app
vs dataset create --data @dataset-create.json
vs dataset ingest --dataset-id <dataset-id> --fields @<normalized-items-artifact>
```

Préférez `dataset-create.json` lorsque le plan l'a généré, afin que `Schema` et `DataFieldConfig` soient transmis ensemble lors de la création du jeu de données. La forme `--name <dataset-name> --type item --schema @schema.json` reste le fallback manuel schema-only lorsqu'un payload de création complet est indisponible ou inadapté.

`--skip-app` est également accepté par `vs item provision` et `vs item apply` comme garde-fou d'exécution lorsque vous devez imposer la limite dataset-only à partir d'un plan existant.

Si vous avez besoin d'un jeu de données vidéo, ne vous fiez pas au type par défaut. Passez toujours explicitement `--type video`:

Pour `dataset+app`:

```bash
vs item profile --file ./videos.jsonl --type video --pretty
vs item plan --file ./videos.jsonl --type video --goal "Build video search"
vs item apply --plan-dir ./.viking/item-plans/<plan> --dry-run
vs item apply --plan-dir ./.viking/item-plans/<plan> --confirm-review --wait-ready --run-trials
```

Pour `dataset-only`:

```bash
vs item profile --file ./videos.jsonl --type video --pretty
vs item plan --file ./videos.jsonl --type video --goal "Build video search" --skip-app
vs dataset create --data @dataset-create.json
vs dataset ingest --dataset-id <dataset-id> --fields @<normalized-items-artifact>
```

Pour la mise à disposition dataset-only de jeux de données vidéo, préférez `dataset-create.json` afin que la demande contienne `DataFieldConfig`; `--schema @schema.json` seul peut échouer avec `MissingParameter.DefaultFieldStrategy`.

## Démarrage rapide (AI Agents)

Si un Agent externe doit utiliser AI Search via ce dépôt:

### 1. Installer SearchCLI

```bash
git clone git@github.com:volcengine/SearchCLI.git vs
cd vs
bash ./scripts/install.sh
```

### 2. Installer les Viking skills

```bash
npx skills add "git@github.com:volcengine/SearchCLI.git" -y -g
```

Le bundle public de skills par défaut contient:

- `vs-shared`
- `vs-item-onboarding`
- `vs-search`
- `vs-search-tuning`
- `vs-chat`
- `vs-recommend`

### 3. S'authentifier

Si le shell actuel dispose déjà de `VIKING_AK` et `VIKING_SK`, privilégiez:

```bash
vs auth import-env
```

Sinon:

```bash
vs auth login
```

### 4. Vérifier

```bash
vs --help
vs auth status --json
vs llm status --json
vs doctor --json
vs skill list
```

## Groupes de commandes publics

- `vs auth`
- `vs llm`
- `vs doctor`
- `vs skill`
- `vs item`
- `vs app`
- `vs dataset`
- `vs data`
- `vs search`
- `vs chat`
- `vs recommend`

## Documentation

- [Agent Quick Start](docs/agent-quick-start.md)
- [Contributing](CONTRIBUTING.md)
- [Security](SECURITY.md)

## Workflow mainteneur

Si vous maintenez le dépôt open-source lui-même, l'outillage local de skills est:

```bash
vs skill list
vs skill init viking-demo-skill
vs skill validate
vs skill install all
```

Construire et exécuter les vérifications du dépôt:

```bash
npm install
npm run validate:skills
npm run build
npm run test:acceptance:dist
```

## Contribution

Veuillez consulter [Contributing](CONTRIBUTING.md) pour plus de détails.

Les contributeurs externes doivent compléter le Contributor License Agreement (CLA) avant qu'une pull request puisse être acceptée.

## Code de conduite

Veuillez consulter le [Code of Conduct](CODE_OF_CONDUCT.md) pour plus de détails.

## Sécurité

Si vous découvrez un problème de sécurité potentiel dans ce projet, ou pensez en avoir découvert un, nous vous demandons de le signaler à Bytedance Security via notre [security center](https://security.bytedance.com/src) ou notre [vulnerability reporting email](mailto:sec@bytedance.com).

Veuillez ne pas créer d'issue GitHub publique.

## Licence

Ce projet est sous licence [Apache-2.0 License](LICENSE).
