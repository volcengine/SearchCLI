<p align="center">
  <img src="docs/assets/searchcli-logo.svg" alt="SearchCLI logo" width="560" />
</p>

# SearchCLI

[English](README.md) | [简体中文](README.zh_CN.md) | [日本語](README.ja_JP.md) | [Deutsch](README.de_DE.md) | [한국어](README.ko_KR.md) | Français | [Русский](README.ru_RU.md) | [Italiano](README.it_IT.md) | [Español](README.es_ES.md) | [Português](README.pt_BR.md) | [Türkçe](README.tr_TR.md) | [ไทย](README.th_TH.md) | [Bahasa Indonesia](README.id_ID.md)

Connectez une recherche stable et ajustable, des recommandations et une recherche conversationnelle à votre système Agent ou à votre système métier.

[Communauté](#communauté) · [Démarrage rapide (développeurs)](#démarrage-rapide-développeurs) · [Configuration AI Agent](#démarrage-rapide-ai-agents) · [Guide Agent complet](docs/agent-quick-start.md) · [Contribution](CONTRIBUTING.md) · [Sécurité](SECURITY.md)

SearchCLI est la CLI ouverte pour AI Search on Volcengine.

Si votre système Agent ou votre système métier a besoin de services de distribution d'information stables et ajustables, SearchCLI fournit un chemin pratique pour intégrer des fonctionnalités de recherche, de recommandation et de recherche conversationnelle de niveau production dans de vrais workflows.

Avec SearchCLI et ses `Viking skills` installables, les Agents externes peuvent onboarder des données, construire et valider des flux de recherche et de recommandation, exécuter la recherche conversationnelle, ajuster la configuration des stratégies, inspecter les bad cases et améliorer la qualité de recherche de façon stable et vérifiable.

## Communauté

<p align="center">
  <strong>Rejoignez le groupe d'utilisateurs SearchCLI sur WeChat</strong><br />
  Scannez le code QR ci-dessous avec WeChat pour échanger avec les utilisateurs et les mainteneurs.<br />
  <sub>Le code QR est actualisé régulièrement. S'il a expiré, revenez consulter sa dernière version.</sub>
</p>

<p align="center">
  <a href="docs/assets/wechat-group-qr.jpg">
    <img src="docs/assets/wechat-group-qr.jpg" alt="Code QR du groupe d'utilisateurs SearchCLI sur WeChat" width="320" />
  </a>
</p>

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

```bash
vs dataset import-url --file-name items.jsonl
curl -X PUT --data-binary "@./items.jsonl" "<FileUrl from previous step>"
vs dataset infer-schema --tos-key <FileKey> --type multi_modal --theme e_commerce --language zh --name <dataset-name>
vs dataset infer-result --task-id <TaskID> --render-schema
vs dataset create --data @dataset-create.json
vs data write --dataset-id <DatasetId> --fields @items.jsonl
vs app create --name <app-name> --industry e_commerce --language zh
vs app attach-dataset --data @attach.json
```

Si vous n'avez besoin que d'un jeu de données (sans application), arrêtez-vous après `vs data write`.

Pour les jeux de données d'événements utilisateur, utilisez `--type user_event` et omettez `--theme`.

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
