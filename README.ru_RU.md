<p align="center">
  <img src="docs/assets/searchcli-logo.svg" alt="SearchCLI logo" width="560" />
</p>

# SearchCLI

[English](README.md) | [简体中文](README.zh_CN.md) | [日本語](README.ja_JP.md) | [Deutsch](README.de_DE.md) | [한국어](README.ko_KR.md) | [Français](README.fr_FR.md) | Русский | [Italiano](README.it_IT.md) | [Español](README.es_ES.md) | [Português](README.pt_BR.md) | [Türkçe](README.tr_TR.md) | [ไทย](README.th_TH.md) | [Bahasa Indonesia](README.id_ID.md)

Подключайте стабильный, настраиваемый поиск, рекомендации и диалоговый retrieval к вашей Agent-системе или бизнес-системе.

[Сообщество](#сообщество) · [Быстрый старт (разработчики)](#быстрый-старт-разработчики) · [Настройка AI Agent](#быстрый-старт-ai-agents) · [Полное руководство для Agent](docs/agent-quick-start.md) · [Участие в разработке](CONTRIBUTING.md) · [Безопасность](SECURITY.md)

SearchCLI — это открытый CLI для AI Search on Volcengine.

Если вашей Agent-системе или бизнес-системе нужны стабильные и настраиваемые сервисы распределения информации, SearchCLI дает практичный путь для интеграции production-grade поиска, рекомендаций и диалогового retrieval в реальные рабочие процессы.

С SearchCLI и устанавливаемыми `Viking skills` внешние Agents могут онбордить данные, строить и проверять поисковые и рекомендательные потоки, запускать диалоговый retrieval, настраивать стратегические конфигурации, исследовать bad cases и последовательно улучшать качество retrieval стабильным и проверяемым способом.

## Сообщество

<p align="center">
  <strong>Присоединяйтесь к группе пользователей SearchCLI в WeChat</strong><br />
  Отсканируйте QR-код ниже в WeChat, чтобы общаться с пользователями и сопровождающими проекта.<br />
  <sub>QR-код периодически обновляется. Если срок его действия истёк, вернитесь позже за актуальной версией.</sub>
</p>

<p align="center">
  <a href="docs/assets/wechat-group-qr.jpg">
    <img src="docs/assets/wechat-group-qr.jpg" alt="QR-код группы пользователей SearchCLI в WeChat" width="320" />
  </a>
</p>

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

Если вам нужен только датасет (без приложения), остановитесь после `vs data write`.

Для датасетов пользовательских событий используйте `--type user_event` и не указывайте `--theme`.

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
