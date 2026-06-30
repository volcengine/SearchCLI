<p align="center">
  <img src="docs/assets/searchcli-logo.svg" alt="SearchCLI logo" width="560" />
</p>

# SearchCLI

[English](README.md) | [简体中文](README.zh_CN.md) | [日本語](README.ja_JP.md) | [Deutsch](README.de_DE.md) | 한국어 | [Français](README.fr_FR.md) | [Русский](README.ru_RU.md) | [Italiano](README.it_IT.md) | [Español](README.es_ES.md) | [Português](README.pt_BR.md) | [Türkçe](README.tr_TR.md) | [ไทย](README.th_TH.md) | [Bahasa Indonesia](README.id_ID.md)

안정적이고 조정 가능한 검색, 추천, 대화형 검색 기능을 Agent 시스템 또는 비즈니스 시스템에 연결합니다.

[빠른 시작(개발자)](#빠른-시작개발자) · [AI Agent 설정](#빠른-시작ai-agents) · [전체 Agent 가이드](docs/agent-quick-start.md) · [기여](CONTRIBUTING.md) · [보안](SECURITY.md)

SearchCLI는 AI Search on Volcengine을 위한 오픈 CLI입니다.

Agent 시스템이나 비즈니스 시스템에 안정적이고 조정 가능한 정보 배포 서비스가 필요하다면, SearchCLI는 프로덕션 수준의 검색, 추천, 대화형 검색 기능을 실제 워크플로에 통합할 수 있는 실용적인 경로를 제공합니다.

SearchCLI와 설치 가능한 `Viking skills`를 함께 사용하면 외부 Agent가 데이터를 온보딩하고, 검색 및 추천 흐름을 구축하고 검증하며, 대화형 검색을 실행하고, 전략 구성을 조정하고, bad case를 조사하고, 검색 품질을 안정적이고 검토 가능한 방식으로 지속적으로 개선할 수 있습니다.

## SearchCLI란

- AI Search on Volcengine을 위한 명령줄 통합 인터페이스입니다.
- 외부 시스템이 검색, 추천, 대화형 검색 기능에 접근할 수 있는 안정적인 경로입니다.
- 설치 가능한 skills와 자동화에 안전한 명령 출력으로 구성된 Agent 친화적 워크플로 계층입니다.
- dry-run, 확인 게이트, 쓰기 후 읽기 검증을 갖춘 검토 가능한 실행 모델입니다.

## 대상 사용자

- AI 기반 정보 배포 기능을 비즈니스 시스템에 통합하는 개발자.
- 안정적이고 구성 가능한 검색, 추천, 검색 워크플로가 필요한 Agent 시스템 구축 팀.
- 프로덕션 사용 전에 데이터 온보딩, 애플리케이션 구성, 런타임 동작을 검토 가능한 방식으로 확인해야 하는 운영, 딜리버리, 솔루션 팀.

## 지원하는 작업

- 구조화된 비즈니스 데이터 기반의 item 및 catalog 검색.
- 애플리케이션 장면과 사용자 행동에 연결된 추천 흐름.
- 애플리케이션 검색을 기반으로 한 대화형 검색 경험.
- Agent가 데이터 온보딩, 애플리케이션 구성, 런타임 동작 검증을 수행하는 워크플로.

## 핵심 기능

- `vs item profile | plan | apply`를 통한 구조화된 item 온보딩.
- `vs app`, `vs dataset`, `vs data`를 통한 애플리케이션 및 데이터 세트 관리.
- `vs search run`, `vs recommend run`, `vs chat run`을 통한 런타임 검증.
- `vs search tune query-generate | plan | run | report`를 통한 초기 버전의 자동 텍스트 유사도 평가 및 튜닝.
- 외부 Agent가 동일한 워크플로를 사용할 수 있게 해 주는 설치 가능한 `Viking skills`.

## 요구 사항

- Node.js 20 이상
- `git`
- AI Search 접근 권한이 있는 Volcengine AK/SK

## 빠른 시작(개발자)

### 1. 설치

```bash
git clone git@github.com:volcengine/SearchCLI.git vs
cd vs
bash ./scripts/install.sh
```

### 2. 인증

현재 shell에 `VIKING_AK`와 `VIKING_SK`가 이미 설정되어 있다면:

```bash
vs auth import-env
vs auth status --json
vs doctor --json
```

그렇지 않다면 실제 터미널에서 대화형 로그인을 실행합니다.

```bash
vs auth login
```

검색 튜닝 쿼리 생성이나 LLM 기반 관련성 평가를 사용하려면, API key를 일반 설정 파일에 평문으로 저장하지 않고 OpenAI-compatible LLM API를 구성합니다.

```bash
vs llm login
vs llm status --json
vs search tune llm-check --live --json
```

현재 shell에 `VIKING_LLM_BASE_URL`, `VIKING_LLM_API_KEY`, `VIKING_LLM_MODEL`가 이미 설정되어 있다면 대신 `vs llm import-env`를 사용할 수 있습니다. API key는 로컬 보안 자격 증명 저장소에 저장되며, base URL과 model은 비밀이 아닌 설정으로 저장됩니다.

### 3. 첫 온보딩 플로 실행

새 애플리케이션 생성, bind-time 구성 검토, 런타임 검증이 모두 필요하다면 `dataset+app` 경로를 사용합니다.

```bash
vs item profile --file ./items.json --pretty
vs item plan --file ./items.json --goal "Build item search"
vs item apply --plan-dir ./.viking/item-plans/<plan> --dry-run
vs item apply --plan-dir ./.viking/item-plans/<plan> --confirm-review --wait-ready --run-trials
```

데이터 세트 프로비저닝만 필요하다면 `dataset-only` 경로를 사용하고, `--skip-app`으로 dataset-only plan을 생성한 뒤 dataset create + ingest 이후에 마무리합니다.

```bash
vs item profile --file ./items.json --pretty
vs item plan --file ./items.json --goal "Build item search" --skip-app
vs dataset create --data @dataset-create.json
vs dataset ingest --dataset-id <dataset-id> --fields @<normalized-items-artifact>
```

plan이 `dataset-create.json`을 생성했다면 이 파일을 우선 사용해 `Schema`와 `DataFieldConfig`를 함께 데이터 세트 생성 요청에 포함합니다. 전체 create payload가 없거나 적합하지 않은 경우에는 `--name <dataset-name> --type item --schema @schema.json` 형식을 수동 schema-only 대체 방식으로 사용할 수 있습니다.

기존 plan에서 dataset-only 경계를 실행 시점에 강제해야 할 때는 `vs item provision`과 `vs item apply`에서도 실행 가드레일로 `--skip-app`을 사용할 수 있습니다.

비디오 데이터 세트가 필요하다면 기본 타입에 의존하지 말고 항상 `--type video`를 명시적으로 전달합니다.

`dataset+app`의 경우:

```bash
vs item profile --file ./videos.jsonl --type video --pretty
vs item plan --file ./videos.jsonl --type video --goal "Build video search"
vs item apply --plan-dir ./.viking/item-plans/<plan> --dry-run
vs item apply --plan-dir ./.viking/item-plans/<plan> --confirm-review --wait-ready --run-trials
```

`dataset-only`의 경우:

```bash
vs item profile --file ./videos.jsonl --type video --pretty
vs item plan --file ./videos.jsonl --type video --goal "Build video search" --skip-app
vs dataset create --data @dataset-create.json
vs dataset ingest --dataset-id <dataset-id> --fields @<normalized-items-artifact>
```

비디오 dataset-only 프로비저닝에서는 요청에 `DataFieldConfig`가 포함되도록 `dataset-create.json` 사용을 우선합니다. `--schema @schema.json`만 사용하면 `MissingParameter.DefaultFieldStrategy` 오류가 발생할 수 있습니다.

## 빠른 시작(AI Agents)

외부 Agent가 이 저장소를 통해 AI Search를 조작해야 한다면:

### 1. SearchCLI 설치

```bash
git clone git@github.com:volcengine/SearchCLI.git vs
cd vs
bash ./scripts/install.sh
```

### 2. Viking skills 설치

```bash
npx skills add "git@github.com:volcengine/SearchCLI.git" -y -g
```

기본 공개 skill bundle은 다음과 같습니다.

- `vs-shared`
- `vs-item-onboarding`
- `vs-search`
- `vs-search-tuning`
- `vs-chat`
- `vs-recommend`

### 3. 인증

현재 shell에 `VIKING_AK`와 `VIKING_SK`가 이미 설정되어 있다면 다음을 권장합니다.

```bash
vs auth import-env
```

그렇지 않다면:

```bash
vs auth login
```

### 4. 검증

```bash
vs --help
vs auth status --json
vs llm status --json
vs doctor --json
vs skill list
```

## 공개 명령 그룹

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

## 문서

- [Agent Quick Start](docs/agent-quick-start.md)
- [Contributing](CONTRIBUTING.md)
- [Security](SECURITY.md)

## Maintainer 워크플로

오픈 소스 저장소 자체를 유지 관리한다면 로컬 skill tooling은 다음과 같습니다.

```bash
vs skill list
vs skill init viking-demo-skill
vs skill validate
vs skill install all
```

저장소 검사를 빌드하고 실행합니다.

```bash
npm install
npm run validate:skills
npm run build
npm run test:acceptance:dist
```

## 기여

자세한 내용은 [Contributing](CONTRIBUTING.md)을 확인해 주세요.

외부 기여자는 pull request가 승인되기 전에 Contributor License Agreement(CLA)를 완료해야 합니다.

## 행동 강령

자세한 내용은 [Code of Conduct](CODE_OF_CONDUCT.md)를 확인해 주세요.

## 보안

이 프로젝트에서 잠재적 보안 문제를 발견했거나 보안 문제를 발견했다고 생각한다면 [security center](https://security.bytedance.com/src) 또는 [vulnerability reporting email](mailto:sec@bytedance.com)을 통해 Bytedance Security에 알려 주세요.

공개 GitHub issue를 생성하지 마세요.

## 라이선스

이 프로젝트는 [Apache-2.0 License](LICENSE)에 따라 라이선스가 부여됩니다.
