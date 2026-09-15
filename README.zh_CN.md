<p align="center">
  <img src="docs/assets/searchcli-logo.svg" alt="SearchCLI logo" width="560" />
</p>

# SearchCLI

[English README](README.md) | 中文

将稳定、可调优的搜索、推荐与对话检索能力接入你的 Agent 系统或业务系统。

[快速开始（开发者）](#快速开始开发者) · [AI Agent 接入](#快速开始ai-agent) · [完整 Agent 指南](docs/agent-quick-start.md) · [贡献指南](CONTRIBUTING.md) · [安全说明](SECURITY.md)

SearchCLI 是 AI Search on Volcengine 的开放 CLI。

如果你的 Agent 系统或业务系统需要稳定、可调优的信息分发服务，SearchCLI 提供了一条把生产可用的搜索、推荐和对话检索能力接入真实工作流的实际路径。

外部 Agent 通过集成 SearchCLI 和配套的 `Viking skills`，可以自己完成数据 onboarding、搜索与推荐链路搭建和验证、对话检索运行、策略调优、bad case 排查，以及检索效果的持续迭代，而且整个过程是稳定、可审阅、可验证的。

## SearchCLI 是什么

- AI Search on Volcengine 的命令行集成层。
- 外部系统接入搜索、推荐和对话检索能力的一条稳定路径。
- 面向 Agent 的工作流层，提供可安装 skills 和适合自动化消费的命令输出。
- 提供可审阅的执行模型，包含 dry-run、确认门槛和写后回读验证。

## 适用对象

- 需要把 AI 信息分发能力接入业务系统的开发者。
- 正在搭建 Agent 系统，且需要稳定、可配置的搜索、推荐和检索工作流的团队。
- 需要在生产前对数据接入、应用配置和运行验证进行显式审阅的运维、交付或解决方案团队。

## 它能支持什么

- 基于结构化业务数据的 item / catalog 搜索。
- 与应用场景和用户行为关联的推荐流程。
- 基于应用搜索能力的对话式检索体验。
- 由 Agent 自动完成数据接入、应用配置和运行验证的工作流。

## 核心能力

- 使用 `vs item profile | plan | apply` 完成结构化 item onboarding。
- 使用 `vs app`、`vs dataset`、`vs data` 管理应用和数据集。
- 使用 `vs search run`、`vs recommend run`、`vs chat run` 做运行时验证。
- 通过可安装的 `Viking skills` 让外部 Agent 使用同一套工作流。

## 环境要求

- Node.js 20 或更高版本
- `git`
- 具有 AI Search 访问权限的火山引擎 AK/SK

## 快速开始（开发者）

### 1. 安装

```bash
git clone <public-repo-url> viking_cli
cd viking_cli
bash ./scripts/install.sh
```

### 2. 鉴权

如果当前 shell 已经设置了 `VIKING_AK` 和 `VIKING_SK`：

```bash
vs auth import-env
vs auth status --json
vs doctor --json
```

否则请在真实终端中执行交互式登录：

```bash
vs auth login
```

### 3. 跑通第一条 Onboarding 流程

如果用户希望同时创建应用、完成 bind-time 字段配置确认，并做运行时验证，请走 `dataset+app` 路径：

```bash
vs item profile --file ./items.json --pretty
vs item plan --file ./items.json --goal "Build item search"
vs item apply --plan-dir ./.viking/item-plans/<plan> --dry-run
vs item apply --plan-dir ./.viking/item-plans/<plan> --confirm-review --wait-ready --run-trials
```

如果你只需要数据集创建和导入，请走 `dataset-only` 路径，在生成 plan 时加上 `--skip-app`，并在 `dataset create + ingest` 后结束：

```bash
vs item profile --file ./items.json --pretty
vs item plan --file ./items.json --goal "Build item search" --skip-app
vs dataset create --data @dataset-create.json
vs dataset ingest --dataset-id <dataset-id> --fields @<normalized-items-artifact>
```

如果 plan 已经产出了 `dataset-create.json`，优先使用它创建数据集，这样可以把 `Schema` 和 `DataFieldConfig` 一起提交。`--name <dataset-name> --type item --schema @schema.json` 仍然保留为没有完整 create payload 时的手动 schema-only 兜底方式。

当你已经有一个现成的 plan、但还想在执行阶段强制保持 `dataset-only` 边界时，`vs item provision` 和 `vs item apply` 也都支持 `--skip-app` 作为执行期保护开关。

如果你要创建的是视频数据集，不要依赖默认类型，必须显式传入 `--type video`：

对于 `dataset+app`：

```bash
vs item profile --file ./videos.jsonl --type video --pretty
vs item plan --file ./videos.jsonl --type video --goal "Build video search"
vs item apply --plan-dir ./.viking/item-plans/<plan> --dry-run
vs item apply --plan-dir ./.viking/item-plans/<plan> --confirm-review --wait-ready --run-trials
```

对于 `dataset-only`：

```bash
vs item profile --file ./videos.jsonl --type video --pretty
vs item plan --file ./videos.jsonl --type video --goal "Build video search" --skip-app
vs dataset create --data @dataset-create.json
vs dataset ingest --dataset-id <dataset-id> --fields @<normalized-items-artifact>
```

对于视频 `dataset-only` 流程，优先使用 `dataset-create.json` 发起创建请求，确保同时带上 `DataFieldConfig`；仅使用 `--schema @schema.json` 可能会触发 `MissingParameter.DefaultFieldStrategy`。

## 快速开始（AI Agent）

如果外部 Agent 需要通过本仓库操作 AI Search：

### 1. 安装 SearchCLI

```bash
git clone <public-repo-url> viking_cli
cd viking_cli
bash ./scripts/install.sh
```

### 2. 安装 Viking skills

```bash
npx skills add "<public-repo-url>" -y -g
```

默认公开 skill bundle 包括：

- `vs-shared`
- `vs-item-onboarding`
- `vs-search`
- `vs-chat`
- `vs-recommend`

### 3. 鉴权

如果当前 shell 已经设置了 `VIKING_AK` 和 `VIKING_SK`，优先执行：

```bash
vs auth import-env
```

否则执行：

```bash
vs auth login
```

### 4. 验证

```bash
vs --help
vs auth status --json
vs doctor --json
vs skill list
```

## 公开命令组

- `vs auth`
- `vs doctor`
- `vs skill`
- `vs item`
- `vs app`
- `vs dataset`
- `vs data`
- `vs search`
- `vs chat`
- `vs recommend`

## 文档

- [Agent 快速开始](docs/agent-quick-start.md)
- [贡献指南](CONTRIBUTING.md)
- [安全说明](SECURITY.md)

## 仓库维护工作流

如果你在维护开源仓库本身，可使用本地 skill tooling：

```bash
vs skill list
vs skill init viking-demo-skill
vs skill validate
vs skill install all
```

构建并运行仓库检查：

```bash
npm install
npm run validate:skills
npm run build
npm run test:acceptance:dist
```

## Contribution

请查看 [Contributing](CONTRIBUTING.md) 了解更多信息。

外部贡献者在 PR 被接受前，需要先完成 Contributor License Agreement (CLA)。

## Code of Conduct

请查看 [Code of Conduct](CODE_OF_CONDUCT.md) 了解更多信息。

## Security

如果你发现了潜在安全问题，或认为你可能发现了安全问题，请通过我们的 [security center](https://security.bytedance.com/src) 或 [vulnerability reporting email](mailto:sec@bytedance.com) 私下联系 Bytedance Security。

请**不要**创建公开 GitHub issue。

## License

本项目采用 [Apache-2.0 License](LICENSE)。
