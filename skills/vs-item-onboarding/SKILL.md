---
name: vs-item-onboarding
description: "V2 onboarding workflow for raw local item files and source-backed onboarding through JSONL export. Use it when the user wants to create a dataset or application from a local JSON, JSONL, or CSV file, or from mysql by first exporting a bootstrap JSONL file and then optionally enabling connector-based sync in Viking AI Search."
category: workflow
applies_to: codex, agents, external-agent
requires_cli: ">=0.2.0"
keywords: item onboarding v2, dataset onboarding v2, V2 OpenAPI, presigned upload, AddInferDatasetSchemaTaskV2, GetInferDatasetSchemaResultV2, CreateDatasetV2, AttachDatasetToApplicationV2, FieldDescMap, DataFieldConfig, data write, dry-run, attach-dataset, infer-result persistence, render-schema, schema confirmation, vs-schema-confirm, source export, database import, mysql import, connector sync
commands: dataset import-url, dataset infer-schema, dataset infer-result, dataset create, dataset ingest, data write, app create, app attach-dataset, connector export, connector init, connector run, connector status, connector stop, connector inspect
---

# Viking Item Onboarding (V2)

## Language Matching (apply throughout)

Match the language of the **user's most recent message** in every line of prose you write — confirmation prompts, status notes, hand-off summaries, questions, error explanations, **and any internal thinking / reasoning / planning output that the host may surface (e.g. `<thinking>` blocks, "thinking" panels, scratchpad notes, todo descriptions)**. If the user is writing in Chinese, every prose line and every reasoning line must also be in Chinese; if English, English; same for Japanese, etc. The fact that this skill file is written in English is for documentation only — at runtime translate all **prose and reasoning** into the user's language. Do not switch back to English mid-flow just because the surrounding skill text is English.

**Chinese-user priority (the most common case)** — when `current_query` or the most recent user message is in Chinese:

- All prose you write for the user (confirmation prompts, status notes, error explanations, final hand-off summaries) must be in Chinese.
- All internal thinking / reasoning / planning output (thinking blocks, scratchpad, todo descriptions) must also be in Chinese.
- For workspace artifacts you create, the description / comment portions (excluding CLI-contract English identifiers) should also prefer Chinese.

Do **not** translate the following — keep them verbatim so the contract stays machine-checkable:

- The verbatim CLI block between `<!-- vs-schema-confirm: BEGIN -->` and `<!-- vs-schema-confirm: END -->` (English section labels `**Metadata**` / `**Fields (N)**` / `**Field Roles**` / `**Warnings (N)**` and English warning text come straight from the CLI).
- CLI command names, flag names, JSON keys, enum values, field names, primary-key BizAttr identifiers (`ImagePK` / `VideoContentID` / `QueryPK` / `MultiModalID`), dataset IDs / app IDs / TaskIDs, and console URLs.
- The single literal token the user must reply to confirm — write it as `` `yes` `` in any language so the contract for advancing to step 8 is unambiguous (you may add a parenthetical native-language hint, e.g. `回复 \`yes\`（即"确认"）继续`).

If you are unsure which language the user used (e.g. only emoji or only an attachment), default to the language of the very first user turn in the conversation. When the user switches languages mid-flow, switch with them on the next message.

## When to Use

Use this skill when the user is operating against the V2 control-plane (`/open/*V2`) and wants to onboard a dataset (optionally followed by an application) from either:

- a raw local item file (`JSON` / `JSONL` / `CSV`), or
- a connected source (`mysql`) that should first be exported to a bootstrap `JSONL` file and may later continue with connector-based sync.

The hallmark of V2 is that schema inference is fully backend-driven: the CLI uploads the file, the backend infers the `Schema` (with `BizAttr` already set on the primary-key / title / URL fields) plus a per-field `FieldDescMap`, and the agent's only jobs are to (a) persist that inference artifact locally, (b) render it for one round of human confirmation, and (c) drive the remaining persistence + ingest steps without re-inventing field decisions.

Do not use this skill when:

- The customer only wants to ingest more rows into an existing dataset (use `vs data write --dataset-id <id> --fields @items.json`).

## Do NOT be misled by `vs --help` top-level QUICK START

`vs --help` still lists `vs item profile / plan / apply` at the top of QUICK START for backwards compatibility (annotated `[Deprecated]`). That is the V1 path; this skill does **not** use it. The only legal path here is V2 — `vs dataset import-url → infer-schema → infer-result → dataset create → data write → app create → app attach-dataset` — and any check for a V2 command must be confirmed via `vs dataset --help`, `vs dataset infer-schema --help`, `vs app --help`, or `vs app attach-dataset --help`, never by falling back to `vs item ...`. The workspace path `./.viking/item-plans/<dataset-name>/` is reused for V2 artifacts only because the directory name happens to match; it does not imply V1. The moment the user's ask is "create a dataset / application from a raw JSONL / JSON / CSV file", jump straight to the V2 workflow (steps 3–14 below) without detouring through `item plan/apply`.

**Forbidden in this skill:** `vs item profile`, `vs item plan`, `vs item apply`, `vs item review`, `vs item provision`, `vs item verify`.

## Preconditions

- `vs` CLI ≥ 0.2.0 installed, authentication is complete (`vs auth status` and `vs doctor` succeed).
- Input file is `JSON array`, `JSONL`, or `CSV` and is readable from a local path.
- The user has stated a business goal (e.g. "Build catalog search", "Build content search").
- The customer's account is provisioned for the V2 control-plane.

## Commands

| Stage | CLI command | Purpose |
|---|---|---|
| Upload URL | `vs dataset import-url --file-name <basename>` | Request a presigned PUT URL plus `FileKey` |
| PUT upload | `curl -X PUT --data-binary @<path> "<FileUrl>"` | Upload the local file to TOS (no auth header needed) |
| Submit inference | `vs dataset infer-schema --tos-key <FileKey> --type <item\|video\|user_event> --industry <e_commerce\|material\|video\|news\|social_platform\|other> --language <zh\|en\|ja> [--name ...]` | Kick off backend schema inference; returns `TaskID`. **Always pass the snake_case wire value** (e.g. `e_commerce`, not `ecommerce`); the CLI accepts aliases like `ecommerce` for `--industry` only as a courtesy, JSON payloads later require the wire value verbatim. |
| Poll inference | `vs dataset infer-result --task-id <TaskID>` | Poll until `Status=Success`; returns `Schema` + `DataFieldConfig` (the entire inference artifact) |
| Create dataset | `vs dataset create --data @dataset-create.json [--dry-run]` | Persist (or dry-run) the inferred schema. **Do not** flip `IsPK` — backend derives PK from `BizAttr` |
| Write data | `vs data write --dataset-id <DatasetId> --fields @items.json` | Push the actual records into the dataset |
| Source export | `vs connector export --source mysql ...` | Export a MySQL source snapshot into `/tmp/viking/connector/<job>/bootstrap/items.jsonl` |
| Connector sync config | `vs connector init --name <job> --source mysql --dataset-id <id> ...` | Persist the local connector job config for later sync |
| Connector sync run | `vs connector run --job <job> --daemon` | Start background incremental sync into the dataset |
| Create application | `vs app create --name <name> --industry <industry> --language <lang> [--description ...] [--color cyan\|blue\|purple\|pink] [--risk-check] [--dry-run]` | Optional, only when the user asks for app-level setup |
| Attach dataset | `vs app attach-dataset --data @attach.json [--dry-run]` | Optional, links a created dataset to an application. The `DataConfig` block is the `DataFieldConfig` straight out of the persisted infer artifact |

The "All-in-one" shortcut `vs dataset ingest --file <path> --type <type> --industry <industry> [--dry-run]` orchestrates upload + infer-schema + poll + create + write, **without** the Schema Confirmation pause. In agent mode you should still drive each step individually so you can pause at step 7 (Schema Confirmation).

## Workflow

Run strictly in order. Each step depends on output from the previous one; an inference artifact persisted in step 6 is reused all the way through step 13.

1. **Confirm input source and mode** — determine which branch applies:
   - **Local file** (`JSON` / `JSONL` / `CSV`): confirm the file path, dataset type, industry, and language. Continue at step 3.
   - **Connected source — new dataset — one-time import** (`mysql`): identify the table name, infer dataset name / dataset type / language / primary key, and require explicit confirmation before any real write. Continue at step 2.
   - **Connected source — new dataset — ongoing sync**: same as above, plus the user must explicitly confirm the incremental cursor field itself. After step 10 continue at step 11.
   - **Connected source — existing dataset — ongoing sync**: validate the dataset with `vs dataset get --id <DatasetId> --full`, confirm the source config (especially the incremental cursor field), then jump directly to step 11.
   - **Existing dataset + one-time source import**: not supported as a single workflow. Explain that the current CLI split supports either `connector export → file-style onboarding` for a new dataset or `connector init/run --daemon` for ongoing sync, then let the user choose which branch to switch to.

   Source environment configuration (applies to every source-backed branch):
   - Supported sources and their default environment variables:
     - `mysql`: `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`, optional `MYSQL_CHARSET`
   - Render a **bash export template snippet** with placeholder values (for example `MYSQL_PASSWORD=your_password`) and ask the user to fill in real values in their own terminal or shell session, then run `export` on each variable.
   - **Never** display actual database credential values in chat. **Never** ask the user to paste or submit database credentials into the chat dialog.
   - **Never** list "connection config" / "连接配置" blocks with concrete host/user/password values inside the chat. The only allowed format is a bash template with placeholder values.
   - The `vs connector export`, `vs connector init`, and `vs connector run` commands read source credentials **only from environment variables**. They do not accept credentials via flags or chat input.
   - This is a human checkpoint. Wait for explicit confirmation that the local source environment is configured before running `vs connector export`, `vs connector init`, or `vs connector run`.

2. **(Source-backed only) Export source snapshot to JSONL** — run `vs connector export --source mysql ...` to produce the bootstrap file. The file is always written to `/tmp/viking/connector/<job>/bootstrap/items.jsonl`. Do not use `--output` to try to override that path; `--output` only redirects the rendered command result. After export, use the emitted `items.jsonl` as the input file and continue at step 3.

3. **Get upload URL** — `vs dataset import-url --file-name <basename>`. Capture `Result.FileUrl` and `Result.FileKey`. Keep `FileKey` for step 5.
4. **PUT upload** — upload the raw item file to `FileUrl` (e.g. `curl -X PUT --data-binary "@<local-path>" "<FileUrl>"`). Expect HTTP 200 with empty body. Do not add an `Authorization` header — `FileUrl` is already presigned.
5. **Submit inference task** — `vs dataset infer-schema --tos-key <FileKey> --type <item|...> --industry <alias> --language <lang> --name <dataset-name>`. Capture `Result.TaskId`. Industry aliases follow the snake_case backend rules: `ecommerce`/`e-commerce` → `e_commerce`, `social-platform` → `social_platform`, plus `material`/`video`/`news`/`other`. The CLI converts the alias to the backend-expected snake_case automatically.
6. **Poll inference result + persist locally** — `vs dataset infer-result --task-id <TaskId>` until `Result.Status === "Success"` (poll roughly every 5s, max ~3 minutes). Then write `Result` verbatim to a **workspace-relative** artifact file so the rest of the workflow can read from it.

   **Plan directory rules (important)**:

   - **Must** write to the workspace-relative path: `./.viking/item-plans/<dataset-name>/infer-result.json` (i.e. `<cwd>/.viking/item-plans/<dataset-name>/...`).
   - **Forbidden** to write anywhere under `~/.viking/` (i.e. `$HOME/.viking/`). `~/.viking/` is the `vs` CLI's private config / credentials directory (`config.json`, `credentials.json.enc`), not a plan dir. Many agent hosts place `~/` outside the sandbox, so writes there fail with `EPERM: operation not permitted`; even when they succeed, your plan files end up mixed with the CLI's private files.
   - If the workspace root is not writable (e.g. the sandbox only allows temp dirs), fallback priority is `${WORKSPACE_DIR}/.viking/item-plans/<dataset-name>/` → `${TMPDIR}/viking-item-plans/<dataset-name>/` → `./viking-item-plans/<dataset-name>/`. **Never** redirect to the home directory `~/.viking/`.
   - Once the plan dir is decided, store it in a local variable (e.g. `WORK`) and reuse the same path across steps 8/9/10/13. **Do not** switch plan dirs between steps.

   The persisted object is:

   ```json
   {
     "Status": "Success",
     "Schema":  [ { "Name": "id", "Type": "int64", "BizAttr": "ImagePK", "IsPK": false, "Required": false, "Fields": [], "EnumerateMeta": [] }, ... ],
     "DataFieldConfig": {
       "IndexFields":      ["..."],            // text search fields
       "FilterFields":     ["..."],            // filter fields
       "SuggestFields":    ["..."],            // suggest fields
       "ImageIndexFields": ["..."],            // image search fields (nullable)
       "VideoIndexFields": ["..."],            // video search fields (nullable)
       "ChatFields":       ["..."],            // chat / QA fields
       "FilterFieldsMap":  { "enum": {"Fields": [...]}, "id": {...}, "num": {...} },
       "FieldDescMap":     { "id": "...", "name": "...", ... }
     },
     "Error": "",
     "ErrorCode": ""
   }
   ```

   This single artifact is the source-of-truth for every subsequent step. Do **not** regenerate it; do **not** edit `BizAttr` (those drive PK / title / URL detection on the backend). If the user requests semantic edits (e.g. tweak a `FieldDescMap` description, reorder `IndexFields`), edit this file in place and reuse it.

7. **Schema Confirmation (mandatory)** — show the persisted artifact to the user **using the CLI's deterministic renderer**, then surface it verbatim. _(Historically called "Stage A".)_

   ```bash
   vs dataset infer-result --task-id <TaskID> --render-schema
   ```

   The CLI emits a fixed four-section block (Metadata / Fields / Field Roles / Warnings) wrapped between `<!-- vs-schema-confirm: BEGIN -->` and `<!-- vs-schema-confirm: END -->` markers. It uses a real markdown table for fields (with backticked types like `` `array<string>` `` so chat UIs do not eat the angle brackets), and fenced code blocks for the other three sections. The output tolerates `Name`/`FieldName`, `Type`/`FieldType`, missing `Required`/`BizAttr`/`Description`, and missing or incomplete `DataFieldConfig`. The output is byte-stable: re-running the same task always produces identical bytes.

   **Your message to the user MUST be exactly this template** (BEGIN/END markers included, three parts only):

   ````
   Dataset <Name> · type=<Type> · industry=<Industry>

   <verbatim CLI stdout from the BEGIN marker through the END marker, character-for-character>

   <one-line confirmation prompt, written in the user's language — see Language Matching above and the templates below>
   ````

   **Confirmation prompt — pick the template matching the user's most recent message language. Do not paste the English template verbatim if the user is writing in Chinese.**

   - 中文（用户说中文时使用，**默认**）：
     `以上是 Schema 确认块。回复 \`yes\` 继续，或说明需要调整的字段（例如：把 \`description\` 加入文本检索字段、把 \`brand\` 加入 SuggestFields）。`
   - English (when the user is writing in English):
     `This is the Schema Confirmation block. Reply \`yes\` to continue, or describe which fields to adjust (e.g. "make \`description\` searchable", "add \`brand\` to SuggestFields").`
   - 日本語 / その他言語：translate the same intent, keep the token `` `yes` `` verbatim and keep field names / JSON keys (`description`, `SuggestFields`, ...) in English.

   **You MUST**:
   - Copy the CLI stdout between (and including) the `<!-- vs-schema-confirm: BEGIN -->` and `<!-- vs-schema-confirm: END -->` markers character-for-character.
   - Surface the **one-line metadata header above**, the **verbatim CLI block in the middle**, and the **one-line confirmation prompt at the bottom** — exactly three parts, in that order.
   - Wrap type values in backticks if you ever need to mention them outside the CLI block (e.g. `` `array<string>` ``). Chat UIs treat unwrapped `<…>` as HTML and silently drop them.

   **You MUST NOT**:
   - Re-render the field table yourself (no hand-typed markdown table, no bullet list of fields).
   - Replace the CLI block with a summary like "see CLI output above" / "tool result has full details". Tool-call output is collapsed by default in most chat clients — the user only sees what is in your own message.
   - Add extra commentary, bullet lists, "key fields are …" highlights, or any interpretation between the BEGIN/END markers.
   - Drop or trim the `**Warnings (N)**` section even when N is 0; deterministic structure beats brevity.

   Wait for an explicit positive confirmation (`yes` or equivalent) before moving to step 8. If the user requests changes, edit the persisted `infer-result.json` in place (do **not** re-run inference) and re-run `vs dataset infer-result --data @infer-result.json --render-schema`, then re-emit the same three-part template so the user sees the same deterministic structure.

8. **Dry-run create** — build `dataset-create.json` directly from the persisted artifact: copy `Schema` as-is (do **not** flip `IsPK`; the backend derives PK from `BizAttr`), copy `DataFieldConfig.FieldDescMap` as `FieldDescMap`, fill in `Name` / `Type` / `Industry` / `Language` / `Description`, set `DryRun: true`. Run `vs dataset create --data @dataset-create.json --dry-run`. Surface any validation errors and pause for correction. Useful payload shape:

   ```json
   {
     "Name": "<dataset-name>",
     "Type": "item",
     "Description": "<one-line description>",
     "Industry": "ecommerce",
     "Language": "zh",
     "Schema":       <copy from infer-result.json Schema>,
     "FieldDescMap": <copy from infer-result.json DataFieldConfig.FieldDescMap>
   }
   ```

9. **Real create** — re-run step 8 without `DryRun`. Capture `Result.Dataset.Id` as `DatasetId` and persist it next to the artifact (e.g. `./.viking/item-plans/<dataset-name>/dataset.json`).
10. **Write data** — `vs data write --dataset-id <DatasetId> --fields @items.json` to push the records (the same item file you uploaded in step 4, converted to a JSON array if it was JSONL). Expect a `request_id` in the response.
11. **(Source-backed sync mode only) Start background incremental sync** — run `vs connector init --name <job> --source mysql --dataset-id <DatasetId> ...` to persist the job config, then `vs connector run --job <job> --daemon` to start the background sync. In the hand-off, surface `job`, `pid`, `trace.ndjson`, `imported-records.log`, `vs connector status --job <job>`, and `vs connector stop --job <job>`. Skip this step for one-time import or local-file workflows.
12. **Optional: create application** — only if the user explicitly asks for app-level setup: `vs app create --name <app-name> --description "<text>" --industry <alias> --language <lang>`. Capture `Result.Application.Id` as `AppId`.
13. **Optional: attach dataset** — read `DataFieldConfig` straight from the persisted artifact and assemble:

    ```json
    {
      "ApplicationId": "<AppId>",
      "DatasetId":     "<DatasetId>",
      "DataConfig":    <copy from infer-result.json DataFieldConfig>
    }
    ```

    Then call `vs app attach-dataset --data @attach.json`. Empty `Result` means success. This is the moment where the `IndexFields`/`FilterFields`/`ImageIndexFields`/etc. captured in step 6 are actually applied — never reinvent these arrays from the schema; always pull them from the persisted artifact.

14. **Hand-off — print console links + readiness reminder (mandatory).** After the last successful step (data write, background sync start, or attach when the app branch ran), the agent must render a short summary block telling the user (a) where to monitor readiness in the console, and (b) that runtime APIs (`search`, `chat`, recommend) can only be exercised once readiness reports OK. Pick the console host from the active profile's `baseUrl` / `controlPlaneBaseUrl`, and assemble URLs using these exact path templates (do **not** invent other paths like `/dataset/detail/<id>` or `/application/detail/<id>` — those are wrong):

    - Host contains `volcengineapi.com` / `volces.com` → **Volc Engine**, base = `https://console.volcengine.com/aisearch/platform/region:aisearch-platform+<region>`. `<region>` is the active profile region (e.g. `cn-beijing`).
      - Dataset URL: `<base>/home/dataset/<DatasetId>`
      - App URL: `<base>/app/<AppId>`
    - Host contains `byteplus.com` → **BytePlus**, base = `https://console.byteplus.com/aisearch/region:aisearch+ap-southeast-1` (BytePlus today only exposes the `ap-southeast-1` region; do not fabricate other regions).
      - Dataset URL: `<base>/home/dataset/<DatasetId>`
      - App URL: `<base>/app/<AppId>`

    Print the URLs only for the resources that actually exist in this run (dataset is always present; app/attach are only present if the user opted in). Render the prose lines (✓ markers, readiness reminder, runtime-API tip) in the **user's current language** per the **Language Matching** rule; keep IDs and URLs verbatim.

    **Template (translate the labels per the table below; keep `DatasetId=...`, `AppId=...`, URLs, and `vs ...` commands verbatim):**

    ```
    ✓ <DATASET_LABEL>: DatasetId=<DatasetId>
      <LINK_LABEL>: <dataset console URL>

    ✓ <APP_LABEL>: AppId=<AppId>            # only when the app branch ran
      <LINK_LABEL>: <app console URL>       # only when the app branch ran

    ✓ <SYNC_LABEL>: job=<job>  pid=<pid>    # only when source-backed sync mode ran
      <TRACE_LABEL>: <trace path>
      <LOG_LABEL>: <import log path>
      <STATUS_CMD>: vs connector status --job <job>
      <STOP_CMD>: vs connector stop --job <job>

    <READINESS_NOTE>
    <RUNTIME_NOTE>
    ```

    **Per-language label table:**

    | Slot | 中文 (default) | English | 日本語 |
    |---|---|---|---|
    | `<DATASET_LABEL>` | `数据集已创建` | `Dataset created` | `データセットを作成しました` |
    | `<APP_LABEL>` | `应用已创建并绑定数据集` | `Application created and dataset attached` | `アプリケーションを作成しデータセットを紐付けました` |
    | `<LINK_LABEL>` | `控制台链接` | `Console link` | `コンソールリンク` |
    | `<SYNC_LABEL>` | `后台同步已启动` | `Background sync started` | `バックグラウンド同期を開始しました` |
    | `<TRACE_LABEL>` | `trace 文件` | `trace file` | `トレースファイル` |
    | `<LOG_LABEL>` | `导入日志` | `import log` | `インポートログ` |
    | `<STATUS_CMD>` | `查看状态` | `check status` | `ステータス確認` |
    | `<STOP_CMD>` | `停止同步` | `stop sync` | `同期停止` |
    | `<READINESS_NOTE>` | `数据需要后台处理后才能查询。请打开上面链接关注数据集 / 应用的「生效状态」（Ready）。` | `Data must finish backend processing before it is queryable. Open the links above and watch for the "Ready" state on the dataset / application.` | `データが利用可能になるにはバックエンド処理の完了が必要です。上記リンクからデータセット / アプリケーションの「Ready」状態を確認してください。` |
    | `<RUNTIME_NOTE>` | `` 生效之后即可使用 `vs search`、`vs chat`、`vs recommend` 等运行时接口进行体验。 `` | `` Once they report Ready, you can exercise the runtime APIs via `vs search`, `vs chat`, `vs recommend`. `` | `` Ready になると `vs search` / `vs chat` / `vs recommend` などのランタイム API を利用できます。 `` |

    For other languages, translate the same intent and keep IDs / URLs / `vs ...` commands verbatim. The agent must surface this block as the final output of the workflow; do not omit it even if the user has not asked. If only the dataset was created (no app branch, no sync), still print the dataset link and the readiness reminder (chat / search will require attaching to an app afterwards).
## V2 Enum Reference

V2 enum fields are **strings**. Pass the CLI alias (case-insensitive) and let the CLI normalize to the backend wire value.

| Field | CLI alias (recommended) | Backend wire value (snake_case) |
|---|---|---|
| `Industry` | `ecommerce` / `e-commerce` | `e_commerce` |
| `Industry` | `material` | `material` |
| `Industry` | `video` | `video` |
| `Industry` | `news` | `news` |
| `Industry` | `social-platform` / `social` | `social_platform` |
| `Industry` | `other` | `other` |
| `Industry` | `none` | `""` (empty) |
| `Type` (dataset, `infer-schema`) | `item` / `video` / `user_event` (use `user-event` as a courtesy alias) | same, snake_case |
| `Type` (dataset, `create`) | `item` / `video` / `user_event` / `document` | same, snake_case |
| `Type` (field) | `string` / `int32` / `int64` / `float` / `bool` / `array<string>` / `array<int64>` / `array<float>` / `object` / `array<object>` | identical string |

Do not pass numeric codes to any V2 API. The CLI keeps a one-way alias map and an int→string fallback for legacy payloads, but agents should emit strings only.

## Backend-driven Primary Key

In V2, the agent does **not** set the primary key. The backend computes `IsPK` from `BizAttr` (truthy when `BizAttr ∈ {ImagePK, VideoContentID, QueryPK, MultiModalID}`) regardless of the `IsPK` value on the wire. Schema inference already assigns the right `BizAttr`, so:

- Forward the inferred `Schema` to `CreateDatasetV2` verbatim. `IsPK` can stay `false` everywhere.
- Never strip / rewrite `BizAttr`. Doing so will cause the backend's `pkCount==1` check to fail.
- If inference returned no field with a PK-class `BizAttr` (very rare; usually means the input file has no obvious identifier column), surface that to the user in the Schema Confirmation block (the CLI's `**Warnings (N)**` section already calls it out) — they likely need to fix the source data, not patch the schema by hand.

## V2 API Surface (reference)

| Stage | OpenAPI | CLI command |
|---|---|---|
| Upload URL | `POST /open/GetPresignedImportUrlV2` | `vs dataset import-url` |
| Submit inference | `POST /open/AddInferDatasetSchemaTaskV2` | `vs dataset infer-schema` |
| Poll inference | `POST /open/GetInferDatasetSchemaResultV2` | `vs dataset infer-result` |
| Create dataset | `POST /open/CreateDatasetV2` | `vs dataset create` |
| Write data | runtime `dataWrite` | `vs data write` |
| Create app | `POST /open/CreateApplicationV2` | `vs app create` |
| Attach dataset | `POST /open/AttachDatasetToApplicationV2` | `vs app attach-dataset` |

## Customer Environment Principle

- In customer environments, assume repository source code is unavailable.
- Execute tasks using only the installed skills, the packaged `vs` CLI surface (`--help`, command output, observed runtime behavior), and explicit user-provided information.
- All HTTP requests issued by `vs` automatically carry `User-Agent: Search-Cli`; do not attempt to forge or strip this header.

## Constraints

1. **Persist the inference artifact.** Write the entire `Result` from `dataset infer-result` to a local file in step 6 and re-read it in steps 8, 9, and 13. Do not pass field roles inline from memory; always source them from the persisted file so create + attach stay consistent.
2. **Plan dir must live in the workspace.** All plan / artifact files (`infer-result.json` / `dataset-create.json` / `attach.json`, etc.) must be written under the **workspace-relative** path `./.viking/item-plans/<dataset-name>/` (or, when the sandbox restricts that, follow the step-6 fallback order: `${WORKSPACE_DIR}/.viking/...` → `${TMPDIR}/viking-item-plans/...` → `./viking-item-plans/...`). **Never** write to `~/.viking/` (i.e. `$HOME/.viking/`) — that is the `vs` CLI's private config / credentials directory, and most agent sandboxes deny home-directory writes, which surfaces as `EPERM: operation not permitted`.
3. **Never flip `IsPK`.** Backend derives PK from `BizAttr`. Modifying `IsPK` (or stripping `BizAttr`) on the wire is a code smell and can fail validation.
4. **Never skip Schema Confirmation (step 7).** Schema persistence (step 8 onward) requires an explicit human "yes" on the inferred schema and field roles.
5. **Always dry-run once.** Run `dataset create --dry-run` before the real create. Surface backend validation errors to the user before retrying.
6. **String enums only.** Pass `Type` and `Industry` as their string values (PascalCase alias accepted on input, snake_case is what the backend expects on wire). Numeric codes will be rejected.
7. **No backtrack flags.** `attach-dataset` (V2) does not accept `BacktrackReq`. If the user needs historical backtrack, treat it as a separate workflow.
8. **Preserve `FieldDescMap` and `DataConfig`.** Forward the inferred `FieldDescMap` to `CreateDatasetV2`, and forward the inferred `DataConfig` verbatim to `AttachDatasetToApplicationV2`. Do not regenerate or strip them locally.
9. **No `Authorization` header on the TOS PUT.** `FileUrl` is presigned; adding auth headers will break the upload.
10. **Always end with the console hand-off block.** The agent's final message in this workflow must include the dataset (and app, if created) console URLs derived from the active profile (`volcengine.com` for Volc, `byteplus.com` for BytePlus) plus a reminder that runtime APIs (`search`, `chat`, recommend) can only be used once the console shows the resource as Ready. Never skip this step — the user has no other clue where to monitor readiness.
11. **Source-backed new-dataset onboarding must go through `connector export`.** Do not claim `dataset ingest --source ...` exists in the supported workflow. First export to JSONL, then reuse the emitted file path in the normal V2 onboarding flow.
12. **Source-backed sync must go through connector lifecycle commands.** Use `connector init` + `connector run --daemon`, then surface runtime artifacts (`trace.ndjson`, `imported-records.log`, `runtime.json`, `state.json`) plus the status/stop commands.
13. **Incremental cursor confirmation is a hard gate.** In `sync` mode, never silently accept an inferred cursor field. Show the basis for the guess and require explicit user confirmation before starting the background job.
14. **Do not invent a one-shot source import into an existing dataset.** If the user wants `existing_dataset + once`, explain the current CLI split and let them choose between creating a new dataset from exported JSONL or enabling connector-based sync.

## Recovery Hints

- `infer-result` returns `Status=Failed` → read the `Error` / `ErrorCode` fields, fix the input file (encoding, JSONL formatting, header row), re-upload via step 3.
- `dataset create` rejects with `InvalidParameter.PrimaryKeyCount` → check the persisted artifact: at least one field must carry a PK-class `BizAttr` (`ImagePK` / `VideoContentID` / `QueryPK` / `MultiModalID`). If none does, inference effectively failed; re-run with a cleaner input.
- `dataset create` rejects with `InvalidParameter.Request` → most common causes: (a) field `Type` sent as a number instead of a string, (b) `Industry` sent in PascalCase like `ECommerce` instead of the alias `ecommerce`, (c) `BizAttr` accidentally stripped during local editing. Fix locally and dry-run again; no need to re-run inference.
- `attach-dataset` errors after a successful create → run `vs app diagnose --application-id <AppId>` to inspect the runtime state before retrying.
- `data write` returns a HTTP error → confirm the dataset is in the `Ready` state via `vs app status --application-id <AppId>` (if attached), or `vs dataset get --id <DatasetId> --full` for unattached writes.

## Worked Example

See [references/worked-example.md](references/worked-example.md) for an end-to-end verified bash transcript (10-item apparel `goods.jsonl` → dataset + app + attach), including the `jq` recipes used to build `dataset-create.json` and `attach.json` from the persisted `infer-result.json`.
