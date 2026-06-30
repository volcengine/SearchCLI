<p align="center">
  <img src="docs/assets/searchcli-logo.svg" alt="SearchCLI logo" width="560" />
</p>

# SearchCLI

[English](README.md) | [简体中文](README.zh_CN.md) | [日本語](README.ja_JP.md) | [Deutsch](README.de_DE.md) | [한국어](README.ko_KR.md) | [Français](README.fr_FR.md) | [Русский](README.ru_RU.md) | [Italiano](README.it_IT.md) | Español | [Português](README.pt_BR.md) | [Türkçe](README.tr_TR.md) | [ไทย](README.th_TH.md) | [Bahasa Indonesia](README.id_ID.md)

Conecta búsqueda estable y ajustable, recomendaciones y retrieval conversacional a tu sistema Agent o sistema de negocio.

[Inicio rápido (desarrolladores)](#inicio-rápido-desarrolladores) · [Configuración de AI Agent](#inicio-rápido-ai-agents) · [Guía completa para Agent](docs/agent-quick-start.md) · [Contribuir](CONTRIBUTING.md) · [Seguridad](SECURITY.md)

SearchCLI es la CLI abierta para AI Search on Volcengine.

Si tu sistema Agent o sistema de negocio necesita servicios de distribución de información estables y ajustables, SearchCLI ofrece una ruta práctica para integrar búsqueda, recomendaciones y retrieval conversacional de nivel production en workflows reales.

Con SearchCLI y sus `Viking skills` instalables, los Agents externos pueden hacer onboarding de datos, construir y validar flujos de búsqueda y recomendación, ejecutar retrieval conversacional, ajustar configuraciones de estrategia, investigar bad cases e iterar sobre la calidad del retrieval de forma estable y verificable.

## Qué es SearchCLI

- La superficie de integración de línea de comandos para AI Search on Volcengine.
- Una ruta estable para que los sistemas externos accedan a capacidades de búsqueda, recomendación y retrieval conversacional.
- Una capa de workflow apta para Agents, construida alrededor de skills instalables y salida de comandos segura para automatización.
- Un modelo de ejecución revisable con dry-runs, puntos de confirmación y verificación read-after-write.

## Para quién es

- Desarrolladores que integran distribución de información impulsada por AI en sistemas de negocio.
- Equipos que construyen sistemas Agent y necesitan workflows de búsqueda, recomendación y retrieval estables y configurables.
- Equipos de operaciones, delivery y soluciones que necesitan una forma revisable de hacer onboarding de datos, configurar aplicaciones y verificar el comportamiento runtime antes del uso en producción.

## Qué habilita

- Búsqueda de items y catálogos sobre datos de negocio estructurados.
- Flujos de recomendación conectados a escenas de aplicación y comportamiento de usuarios.
- Experiencias de retrieval conversacional basadas en la búsqueda de la aplicación.
- Workflows Agent que pueden hacer onboarding de datos, configurar aplicaciones y validar el comportamiento runtime con pasos explícitos de revisión.

## Capacidades principales

- `vs item profile | plan | apply` para onboarding de items estructurados.
- `vs app`, `vs dataset` y `vs data` para gestión de aplicaciones y datasets.
- `vs search run`, `vs recommend run` y `vs chat run` para verificación runtime.
- `vs search tune query-generate | plan | run | report` para una primera versión de evaluación y ajuste automatizados de similitud textual.
- `Viking skills` instalables para que los Agents externos puedan usar los mismos workflows.

## Requisitos

- Node.js 20 o posterior
- `git`
- Volcengine AK/SK con acceso a AI Search

## Inicio rápido (desarrolladores)

### 1. Instalar

```bash
git clone git@github.com:volcengine/SearchCLI.git vs
cd vs
bash ./scripts/install.sh
```

### 2. Autenticarse

Si la shell actual ya tiene `VIKING_AK` y `VIKING_SK`:

```bash
vs auth import-env
vs auth status --json
vs doctor --json
```

De lo contrario, ejecuta el inicio de sesión interactivo en una terminal real:

```bash
vs auth login
```

Si vas a usar generación de consultas para search tuning o evaluación de relevancia mediante LLM, configura una API LLM compatible con OpenAI sin colocar la API key en texto plano dentro de la configuración:

```bash
vs llm login
vs llm status --json
vs search tune llm-check --live --json
```

Si la shell actual ya tiene `VIKING_LLM_BASE_URL`, `VIKING_LLM_API_KEY` y `VIKING_LLM_MODEL`, puedes usar `vs llm import-env` en su lugar. La API key se almacena en el almacén local seguro de credenciales; base URL y model se guardan como configuración no secreta.

### 3. Ejecutar el primer flujo de onboarding

Si el usuario quiere una nueva app con revisión de configuración en el momento del bind y verificación runtime, usa la ruta `dataset+app`:

```bash
vs item profile --file ./items.json --pretty
vs item plan --file ./items.json --goal "Build item search"
vs item apply --plan-dir ./.viking/item-plans/<plan> --dry-run
vs item apply --plan-dir ./.viking/item-plans/<plan> --confirm-review --wait-ready --run-trials
```

Si solo necesitas aprovisionamiento de dataset, usa la ruta `dataset-only`, genera un plan dataset-only con `--skip-app` y termina después de dataset create + ingest:

```bash
vs item profile --file ./items.json --pretty
vs item plan --file ./items.json --goal "Build item search" --skip-app
vs dataset create --data @dataset-create.json
vs dataset ingest --dataset-id <dataset-id> --fields @<normalized-items-artifact>
```

Prefiere `dataset-create.json` cuando el plan lo genere, para que la creación del dataset mantenga `Schema` y `DataFieldConfig` juntos. La forma `--name <dataset-name> --type item --schema @schema.json` sigue siendo el fallback manual schema-only cuando no hay un payload de creación completo disponible o adecuado.

`--skip-app` también es aceptado por `vs item provision` y `vs item apply` como guard rail de ejecución cuando necesitas imponer el límite dataset-only desde un plan existente.

Si necesitas un dataset de video, no dependas del tipo predeterminado. Pasa siempre `--type video` explícitamente:

Para `dataset+app`:

```bash
vs item profile --file ./videos.jsonl --type video --pretty
vs item plan --file ./videos.jsonl --type video --goal "Build video search"
vs item apply --plan-dir ./.viking/item-plans/<plan> --dry-run
vs item apply --plan-dir ./.viking/item-plans/<plan> --confirm-review --wait-ready --run-trials
```

Para `dataset-only`:

```bash
vs item profile --file ./videos.jsonl --type video --pretty
vs item plan --file ./videos.jsonl --type video --goal "Build video search" --skip-app
vs dataset create --data @dataset-create.json
vs dataset ingest --dataset-id <dataset-id> --fields @<normalized-items-artifact>
```

Para aprovisionamiento dataset-only de video, prefiere `dataset-create.json` para que la solicitud incluya `DataFieldConfig`; usar solo `--schema @schema.json` puede fallar con `MissingParameter.DefaultFieldStrategy`.

## Inicio rápido (AI Agents)

Si un Agent externo necesita operar AI Search a través de este repositorio:

### 1. Instalar SearchCLI

```bash
git clone git@github.com:volcengine/SearchCLI.git vs
cd vs
bash ./scripts/install.sh
```

### 2. Instalar Viking skills

```bash
npx skills add "git@github.com:volcengine/SearchCLI.git" -y -g
```

El paquete público predeterminado de skills incluye:

- `vs-shared`
- `vs-item-onboarding`
- `vs-search`
- `vs-search-tuning`
- `vs-chat`
- `vs-recommend`

### 3. Autenticarse

Si la shell actual ya tiene `VIKING_AK` y `VIKING_SK`, se recomienda:

```bash
vs auth import-env
```

De lo contrario:

```bash
vs auth login
```

### 4. Verificar

```bash
vs --help
vs auth status --json
vs llm status --json
vs doctor --json
vs skill list
```

## Grupos de comandos públicos

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

## Documentación

- [Agent Quick Start](docs/agent-quick-start.md)
- [Contributing](CONTRIBUTING.md)
- [Security](SECURITY.md)

## Workflow de maintainers

Si mantienes el repositorio open-source, el tooling local de skills es:

```bash
vs skill list
vs skill init viking-demo-skill
vs skill validate
vs skill install all
```

Construir y ejecutar las comprobaciones del repositorio:

```bash
npm install
npm run validate:skills
npm run build
npm run test:acceptance:dist
```

## Contribuir

Consulta [Contributing](CONTRIBUTING.md) para más detalles.

Los contribuidores externos deben completar el Contributor License Agreement (CLA) antes de que una pull request pueda ser aceptada.

## Código de conducta

Consulta [Code of Conduct](CODE_OF_CONDUCT.md) para más detalles.

## Seguridad

Si descubres un posible problema de seguridad en este proyecto, o crees haber descubierto uno, te pedimos que notifiques a Bytedance Security mediante nuestro [security center](https://security.bytedance.com/src) o el [vulnerability reporting email](mailto:sec@bytedance.com).

No crees una issue pública de GitHub.

## Licencia

Este proyecto está licenciado bajo la [Apache-2.0 License](LICENSE).
