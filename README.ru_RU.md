<p align="center">
  <img src="docs/assets/searchcli-logo.svg" alt="SearchCLI logo" width="560" />
</p>

# SearchCLI

[English](README.md) | [简体中文](README.zh_CN.md) | [日本語](README.ja_JP.md) | [Deutsch](README.de_DE.md) | [한국어](README.ko_KR.md) | [Français](README.fr_FR.md) | Русский | [Italiano](README.it_IT.md) | [Español](README.es_ES.md) | [Português](README.pt_BR.md) | [Türkçe](README.tr_TR.md) | [ไทย](README.th_TH.md) | [Bahasa Indonesia](README.id_ID.md)

Подключайте стабильный, настраиваемый поиск, рекомендации и диалоговый retrieval к вашей Agent-системе или бизнес-системе.

[Быстрый старт (разработчики)](#быстрый-старт-разработчики) · [Настройка AI Agent](#быстрый-старт-ai-agents) · [Полное руководство для Agent](docs/agent-quick-start.md) · [Участие в разработке](CONTRIBUTING.md) · [Безопасность](SECURITY.md)

SearchCLI — это открытый CLI для AI Search on Volcengine.

Если вашей Agent-системе или бизнес-системе нужны стабильные и настраиваемые сервисы распределения информации, SearchCLI дает практичный путь для интеграции production-grade поиска, рекомендаций и диалогового retrieval в реальные рабочие процессы.

С SearchCLI и устанавливаемыми `Viking skills` внешние Agents могут онбордить данные, строить и проверять поисковые и рекомендательные потоки, запускать диалоговый retrieval, настраивать стратегические конфигурации, исследовать bad cases и последовательно улучшать качество retrieval стабильным и проверяемым способом.

## Что такое SearchCLI

- Командная поверхность интеграции для AI Search on Volcengine.
- Стабильный путь для внешних систем к возможностям поиска, рекомендаций и диалогового retrieval.
- Дружественный к Agent слой workflow, построенный вокруг устанавливаемых skills и безопасного для автоматизации вывода команд.
- Проверяемая модель выполнения с dry-run, контрольными точками подтверждения и проверкой read-after-write.

## Для кого это

- Для разработчиков, интегрирующих AI-powered распределение информации в бизнес-системы.
- Для команд, создающих Agent-системы, которым нужны стабильные и конфигурируемые workflow поиска, рекомендаций и retrieval.
- Для операционных, delivery- и solution-команд, которым нужен проверяемый способ онбординга данных, настройки приложений и проверки runtime-поведения перед production-использованием.

## Что это позволяет делать

- Поиск items и catalog на основе структурированных бизнес-данных.
- Рекомендательные потоки, связанные со сценами приложения и поведением пользователей.
- Диалоговый retrieval, основанный на поиске приложения.
- Agent-workflow, которые онбордят данные, настраивают приложения и проверяют runtime-поведение с явными шагами ревью.

## Основные возможности

- `vs item profile | plan | apply` для онбординга структурированных items.
- `vs app`, `vs dataset` и `vs data` для управления приложениями и датасетами.
- `vs search run`, `vs recommend run` и `vs chat run` для runtime-проверки.
- `vs search tune query-generate | plan | run | report` для первой версии автоматической оценки и настройки текстовой похожести.
- Устанавливаемые `Viking skills`, чтобы внешние Agents могли использовать те же workflow.

## Требования

- Node.js 20 или новее
- `git`
- Volcengine AK/SK с доступом к AI Search

## Быстрый старт (разработчики)

### 1. Установка

```bash
git clone git@github.com:volcengine/SearchCLI.git vs
cd vs
bash ./scripts/install.sh
```

### 2. Аутентификация

Если в текущем shell уже заданы `VIKING_AK` и `VIKING_SK`:

```bash
vs auth import-env
vs auth status --json
vs doctor --json
```

Иначе выполните интерактивный вход в реальном терминале:

```bash
vs auth login
```

Если вы будете использовать генерацию запросов для search tuning или LLM-оценку релевантности, настройте OpenAI-compatible LLM API без записи API key в открытый конфиг:

```bash
vs llm login
vs llm status --json
vs search tune llm-check --live --json
```

Если в текущем shell уже заданы `VIKING_LLM_BASE_URL`, `VIKING_LLM_API_KEY` и `VIKING_LLM_MODEL`, используйте вместо этого `vs llm import-env`. API key сохраняется в локальном защищенном хранилище учетных данных; base URL и model сохраняются как несекретная конфигурация.

### 3. Запуск первого onboarding flow

Если пользователю нужно создать новое приложение, выполнить bind-time review конфигурации и runtime-проверку, используйте путь `dataset+app`:

```bash
vs item profile --file ./items.json --pretty
vs item plan --file ./items.json --goal "Build item search"
vs item apply --plan-dir ./.viking/item-plans/<plan> --dry-run
vs item apply --plan-dir ./.viking/item-plans/<plan> --confirm-review --wait-ready --run-trials
```

Если нужно только подготовить датасет, используйте путь `dataset-only`, создайте dataset-only план с `--skip-app` и завершите после dataset create + ingest:

```bash
vs item profile --file ./items.json --pretty
vs item plan --file ./items.json --goal "Build item search" --skip-app
vs dataset create --data @dataset-create.json
vs dataset ingest --dataset-id <dataset-id> --fields @<normalized-items-artifact>
```

Предпочитайте `dataset-create.json`, если план его создал, чтобы при создании датасета вместе передавались `Schema` и `DataFieldConfig`. Форма `--name <dataset-name> --type item --schema @schema.json` остается ручным schema-only fallback, когда полный create payload недоступен или не подходит.

`--skip-app` также поддерживается в `vs item provision` и `vs item apply` как runtime-защита, когда нужно принудительно сохранить границу dataset-only для уже существующего плана.

Если нужен видеодатасет, не полагайтесь на тип по умолчанию. Всегда явно передавайте `--type video`:

Для `dataset+app`:

```bash
vs item profile --file ./videos.jsonl --type video --pretty
vs item plan --file ./videos.jsonl --type video --goal "Build video search"
vs item apply --plan-dir ./.viking/item-plans/<plan> --dry-run
vs item apply --plan-dir ./.viking/item-plans/<plan> --confirm-review --wait-ready --run-trials
```

Для `dataset-only`:

```bash
vs item profile --file ./videos.jsonl --type video --pretty
vs item plan --file ./videos.jsonl --type video --goal "Build video search" --skip-app
vs dataset create --data @dataset-create.json
vs dataset ingest --dataset-id <dataset-id> --fields @<normalized-items-artifact>
```

Для dataset-only подготовки видеодатасета предпочитайте `dataset-create.json`, чтобы запрос включал `DataFieldConfig`; одного `--schema @schema.json` может быть недостаточно и он может привести к `MissingParameter.DefaultFieldStrategy`.

## Быстрый старт (AI Agents)

Если внешний Agent должен работать с AI Search через этот репозиторий:

### 1. Установите SearchCLI

```bash
git clone git@github.com:volcengine/SearchCLI.git vs
cd vs
bash ./scripts/install.sh
```

### 2. Установите Viking skills

```bash
npx skills add "git@github.com:volcengine/SearchCLI.git" -y -g
```

Стандартный публичный skill bundle включает:

- `vs-shared`
- `vs-item-onboarding`
- `vs-search`
- `vs-search-tuning`
- `vs-chat`
- `vs-recommend`

### 3. Аутентификация

Если в текущем shell уже заданы `VIKING_AK` и `VIKING_SK`, предпочтительно выполнить:

```bash
vs auth import-env
```

Иначе:

```bash
vs auth login
```

### 4. Проверка

```bash
vs --help
vs auth status --json
vs llm status --json
vs doctor --json
vs skill list
```

## Публичные группы команд

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

## Документация

- [Agent Quick Start](docs/agent-quick-start.md)
- [Contributing](CONTRIBUTING.md)
- [Security](SECURITY.md)

## Workflow для maintainers

Если вы поддерживаете сам open-source репозиторий, локальные skill-инструменты:

```bash
vs skill list
vs skill init viking-demo-skill
vs skill validate
vs skill install all
```

Сборка и проверки репозитория:

```bash
npm install
npm run validate:skills
npm run build
npm run test:acceptance:dist
```

## Участие в разработке

Подробности см. в [Contributing](CONTRIBUTING.md).

Внешние контрибьюторы должны подписать Contributor License Agreement (CLA), прежде чем pull request может быть принят.

## Кодекс поведения

Подробности см. в [Code of Conduct](CODE_OF_CONDUCT.md).

## Безопасность

Если вы обнаружили потенциальную проблему безопасности в этом проекте или считаете, что могли ее обнаружить, сообщите Bytedance Security через наш [security center](https://security.bytedance.com/src) или [vulnerability reporting email](mailto:sec@bytedance.com).

Пожалуйста, не создавайте публичный GitHub issue.

## Лицензия

Проект распространяется по лицензии [Apache-2.0 License](LICENSE).
