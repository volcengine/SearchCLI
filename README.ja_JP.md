<p align="center">
  <img src="docs/assets/searchcli-logo.svg" alt="SearchCLI logo" width="560" />
</p>

# SearchCLI

[English](README.md) | [简体中文](README.zh_CN.md) | 日本語 | [Deutsch](README.de_DE.md) | [한국어](README.ko_KR.md) | [Français](README.fr_FR.md) | [Русский](README.ru_RU.md) | [Italiano](README.it_IT.md) | [Español](README.es_ES.md) | [Português](README.pt_BR.md) | [Türkçe](README.tr_TR.md) | [ไทย](README.th_TH.md) | [Bahasa Indonesia](README.id_ID.md)

安定して調整可能な検索、推薦、会話型検索を Agent システムや業務システムに接続します。

[クイックスタート（開発者）](#クイックスタート開発者) · [AI Agent セットアップ](#クイックスタートai-agent) · [Agent 向け完全ガイド](docs/agent-quick-start.md) · [コントリビューション](CONTRIBUTING.md) · [セキュリティ](SECURITY.md)

SearchCLI は AI Search on Volcengine のためのオープン CLI です。

Agent システムや業務システムで、安定して調整可能な情報配信サービスが必要な場合、SearchCLI は本番運用を見据えた検索、推薦、会話型検索を実際のワークフローへ統合するための実用的な経路を提供します。

SearchCLI とインストール可能な `Viking skills` を組み合わせることで、外部 Agent はデータのオンボーディング、検索・推薦フローの構築と検証、会話型検索の実行、戦略設定の調整、bad case の調査、検索品質の継続的な改善を、安定してレビュー可能な形で進められます。

## SearchCLI とは

- AI Search on Volcengine のコマンドライン統合レイヤーです。
- 外部システムが検索、推薦、会話型検索へアクセスするための安定した経路です。
- インストール可能な skills と自動化しやすいコマンド出力を備えた、Agent フレンドリーなワークフローレイヤーです。
- dry-run、確認ゲート、書き込み後の読み戻し検証を備えた、レビュー可能な実行モデルです。

## 対象ユーザー

- AI による情報配信機能を業務システムへ統合する開発者。
- 安定して設定可能な検索、推薦、検索ワークフローを必要とする Agent システム開発チーム。
- 本番利用前にデータ接続、アプリ設定、実行時の挙動を明示的にレビューしたい運用、導入、ソリューションチーム。

## できること

- 構造化された業務データ上での item / catalog 検索。
- アプリケーションのシーンやユーザー行動に接続された推薦フロー。
- アプリケーション検索を基盤にした会話型検索体験。
- Agent によるデータ接続、アプリ設定、実行時検証の自動化ワークフロー。

## 主な機能

- `vs item profile | plan | apply` による構造化 item のオンボーディング。
- `vs app`、`vs dataset`、`vs data` によるアプリケーションとデータセットの管理。
- `vs search run`、`vs recommend run`、`vs chat run` による実行時検証。
- `vs search tune query-generate | plan | run | report` による初期版のテキスト類似度自動評価とチューニング。
- 外部 Agent が同じワークフローを利用できる、インストール可能な `Viking skills`。

## 要件

- Node.js 20 以降
- `git`
- AI Search へアクセスできる Volcengine AK/SK

## クイックスタート（開発者）

### 1. インストール

```bash
git clone git@github.com:volcengine/SearchCLI.git vs
cd vs
bash ./scripts/install.sh
```

### 2. 認証

現在の shell に `VIKING_AK` と `VIKING_SK` が設定済みの場合:

```bash
vs auth import-env
vs auth status --json
vs doctor --json
```

未設定の場合は、実際のターミナルで対話型ログインを実行します。

```bash
vs auth login
```

検索チューニングのクエリ生成や、LLM による関連性判定を使う場合は、API key を平文設定に置かずに OpenAI-compatible LLM API を設定します。

```bash
vs llm login
vs llm status --json
vs search tune llm-check --live --json
```

現在の shell に `VIKING_LLM_BASE_URL`、`VIKING_LLM_API_KEY`、`VIKING_LLM_MODEL` が設定済みの場合は、代わりに `vs llm import-env` を使用できます。API key はローカルの安全な認証情報ストアに保存され、base URL と model は非機密の設定として保存されます。

### 3. 最初のオンボーディングフローを実行

新しいアプリ作成、bind-time の設定レビュー、実行時検証まで必要な場合は、`dataset+app` パスを使います。

```bash
vs item profile --file ./items.json --pretty
vs item plan --file ./items.json --goal "Build item search"
vs item apply --plan-dir ./.viking/item-plans/<plan> --dry-run
vs item apply --plan-dir ./.viking/item-plans/<plan> --confirm-review --wait-ready --run-trials
```

データセット作成と取り込みだけが必要な場合は、`dataset-only` パスを使います。plan 作成時に `--skip-app` を指定し、`dataset create + ingest` の後で完了します。

```bash
vs item profile --file ./items.json --pretty
vs item plan --file ./items.json --goal "Build item search" --skip-app
vs dataset create --data @dataset-create.json
vs dataset ingest --dataset-id <dataset-id> --fields @<normalized-items-artifact>
```

plan が `dataset-create.json` を出力した場合は、それを優先して使うことで `Schema` と `DataFieldConfig` をまとめて送信できます。完全な create payload がない場合や適さない場合は、`--name <dataset-name> --type item --schema @schema.json` 形式を手動の schema-only フォールバックとして使えます。

既存 plan から実行する場合でも、`dataset-only` の境界を強制したいときは、`vs item provision` と `vs item apply` の実行時ガードとして `--skip-app` を指定できます。

動画データセットを作成する場合は、デフォルト型に依存せず、必ず `--type video` を明示してください。

`dataset+app` の場合:

```bash
vs item profile --file ./videos.jsonl --type video --pretty
vs item plan --file ./videos.jsonl --type video --goal "Build video search"
vs item apply --plan-dir ./.viking/item-plans/<plan> --dry-run
vs item apply --plan-dir ./.viking/item-plans/<plan> --confirm-review --wait-ready --run-trials
```

`dataset-only` の場合:

```bash
vs item profile --file ./videos.jsonl --type video --pretty
vs item plan --file ./videos.jsonl --type video --goal "Build video search" --skip-app
vs dataset create --data @dataset-create.json
vs dataset ingest --dataset-id <dataset-id> --fields @<normalized-items-artifact>
```

動画の `dataset-only` フローでは、`DataFieldConfig` も含めるために `dataset-create.json` を優先して使用してください。`--schema @schema.json` だけでは `MissingParameter.DefaultFieldStrategy` が発生する可能性があります。

## クイックスタート（AI Agent）

外部 Agent がこのリポジトリ経由で AI Search を操作する場合:

### 1. SearchCLI をインストール

```bash
git clone git@github.com:volcengine/SearchCLI.git vs
cd vs
bash ./scripts/install.sh
```

### 2. Viking skills をインストール

```bash
npx skills add "git@github.com:volcengine/SearchCLI.git" -y -g
```

デフォルトの公開 skill bundle は以下です。

- `vs-shared`
- `vs-item-onboarding`
- `vs-search`
- `vs-search-tuning`
- `vs-chat`
- `vs-recommend`

### 3. 認証

現在の shell に `VIKING_AK` と `VIKING_SK` が設定済みの場合は、次を推奨します。

```bash
vs auth import-env
```

それ以外の場合:

```bash
vs auth login
```

### 4. 検証

```bash
vs --help
vs auth status --json
vs llm status --json
vs doctor --json
vs skill list
```

## 公開コマンドグループ

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

## ドキュメント

- [Agent Quick Start](docs/agent-quick-start.md)
- [Contributing](CONTRIBUTING.md)
- [Security](SECURITY.md)

## メンテナー向けワークフロー

オープンソースリポジトリ自体をメンテナンスする場合、ローカルの skill tooling は以下です。

```bash
vs skill list
vs skill init viking-demo-skill
vs skill validate
vs skill install all
```

ビルドとリポジトリチェックを実行します。

```bash
npm install
npm run validate:skills
npm run build
npm run test:acceptance:dist
```

## Contribution

詳しくは [Contributing](CONTRIBUTING.md) を確認してください。

外部コントリビューターは、pull request が受け入れられる前に Contributor License Agreement (CLA) を完了する必要があります。

## Code of Conduct

詳しくは [Code of Conduct](CODE_OF_CONDUCT.md) を確認してください。

## Security

潜在的なセキュリティ問題を発見した場合、または発見した可能性がある場合は、[security center](https://security.bytedance.com/src) または [vulnerability reporting email](mailto:sec@bytedance.com) から Bytedance Security へ非公開で連絡してください。

公開 GitHub issue は作成しないでください。

## License

このプロジェクトは [Apache-2.0 License](LICENSE) の下でライセンスされています。
