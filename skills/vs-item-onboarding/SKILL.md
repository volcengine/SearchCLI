---
name: vs-item-onboarding
description: "onboarding workflow for creating datasets and applications in Viking AI Search. Supports one-time import from local files (JSON, JSONL, CSV) and MySQL databases, plus scheduled incremental sync for append-only JSONL files and MySQL. All sources are first exported to a bootstrap JSONL file; backend-driven schema inference handles detection, and optional background sync keeps the dataset up to date as new data arrives."
category: workflow
applies_to: codex, agents, external-agent
requires_cli: ">=0.2.0"
keywords: item onboarding, dataset onboarding, multi_modal, presigned upload, AddInferDatasetSchemaTask, GetInferDatasetSchemaResult, CreateDataset, AttachDatasetToApplication, FieldDescMap, DataFieldConfig, ImageIndexFields, VideoIndexFields, ChatFields, ProcessConfig, data write, dry-run, attach-dataset, infer-result persistence, render-schema, schema confirmation, vs-schema-confirm, source export, database import, mysql import, jsonl import, file import, connector sync
commands: dataset import-url, dataset infer-schema, dataset infer-result, dataset create, dataset ingest, data write, app create, app attach-dataset, connector export, connector init, connector run, connector status, connector stop, connector inspect
---

# Viking Item Onboarding

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

- a local `JSONL` file, either as a one-time import or with ongoing incremental sync for append-only files (e.g. crawler output where new lines are continuously appended);
- a local `JSON` (array) or `CSV` file, as a one-time import only (ongoing sync is not supported for these formats);
- a MySQL database, either as a one-time snapshot import or with ongoing incremental sync.

The hallmark of V2 is that schema inference is fully backend-driven: the CLI uploads the file, the backend infers the `Schema` (with `BizAttr` already set on the primary-key / title / URL fields) plus a per-field `FieldDescMap`, and the agent's only jobs are to (a) persist that inference artifact locally, (b) render it for one round of human confirmation, and (c) drive the remaining persistence + ingest steps without re-inventing field decisions.

Do not use this skill when:

- The customer only wants to ingest more rows into an existing dataset (use `vs data write --dataset-id <id> --fields @items.json`).

## Do NOT be misled by `vs --help` top-level QUICK START

`vs --help` still lists `vs item profile / plan / apply` at the top of QUICK START for backwards compatibility (annotated `[Deprecated]`). That is the V1 path; this skill does **not** use it. The only legal path here is V2 — `vs dataset import-url → infer-schema → infer-result → dataset create → data write → app create → app attach-dataset` — and any check for a V2 command must be confirmed via `vs dataset --help`, `vs dataset infer-schema --help`, `vs app --help`, or `vs app attach-dataset --help`, never by falling back to `vs item ...`. The workspace path `./.viking/item-plans/<dataset-name>/` is reused for V2 artifacts only because the directory name happens to match; it does not imply V1 or item type. The moment the user's ask is "create a multi-modal dataset / application from a raw JSONL / JSON / CSV / MySQL source", jump straight to the V2 workflow (steps 3–14 below) without detouring through `item plan/apply`.

**Forbidden in this skill:** `vs item profile`, `vs item plan`, `vs item apply`, `vs item review`, `vs item provision`, `vs item verify`, or passing any `--type` other than `multi_modal` to dataset onboarding commands.

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
| Submit inference | `vs dataset infer-schema --tos-key <FileKey> --type multi_modal --theme <general\|e_commerce\|content\|long_video> --language <zh\|en\|ko\|ja\|hi> [--name ...]` | Kick off backend schema inference; returns `TaskID`. `--theme` is **required** (default `general` when the user has no preference). The CLI accepts theme aliases such as `ecommerce` / `e-commerce` → `e_commerce`, `long-video` / `longvideo` → `long_video`, `common` / `default` → `general`. |
| Poll inference | `vs dataset infer-result --task-id <TaskID>` | Poll until `Status=Success`; returns `Schema` + `DataFieldConfig` (the entire inference artifact, including `ImageIndexFields` / `VideoIndexFields` / `ChatFields`) |
| Create dataset | `vs dataset create --data @dataset-create.json [--dry-run]` | Persist (or dry-run) the inferred schema. **Do not** flip `IsPK` — backend derives PK from `BizAttr`. The payload must include `Theme` and optionally `ProcessConfig` (abnormal image/video policy, video auto-delete). |
| Write data | `vs data write --dataset-id <DatasetId> --fields @items.json` | Push the actual records into the dataset |
| Export (MySQL) | `vs connector export --source mysql ...` | Export a MySQL table snapshot into `/tmp/viking/connector/<job>/bootstrap/items.jsonl` |
| Export (local file) | `vs connector export --source jsonl --file <path>` | Export a local JSONL file snapshot into the bootstrap directory. For `JSON` (array) or `CSV` inputs, convert to JSONL (one object per line) before running this command. |
| Sync config | `vs connector init --name <job> --source mysql\|jsonl --dataset-id <id> ...` | Persist the local sync job config for later incremental runs |
| Sync run | `vs connector run --job <job> --daemon` | Start background incremental sync into the dataset |
| Create application | `vs app create --name <name> --industry <industry> --language <lang> [--description ...] [--color cyan\|blue\|purple\|pink] [--risk-check] [--dry-run]` | Optional, only when the user asks for app-level setup. `--industry` here is an **application-level** attribute independent of the dataset; it is NOT passed to dataset create / infer-schema. |
| Attach dataset | `vs app attach-dataset --data @attach.json [--dry-run]` | Optional, links the created dataset to an application. The `DataConfig` block is the `DataFieldConfig` straight out of the persisted infer artifact (must include `ImageIndexFields` / `VideoIndexFields` / `ChatFields` verbatim) |

The "All-in-one" shortcut `vs dataset ingest --file <path> --type multi_modal --theme <theme> [--abnormal-image-policy skip|block] [--abnormal-video-policy skip|block] [--video-auto-delete] [--dry-run]` orchestrates upload + infer-schema + poll + create + write, **without** the Schema Confirmation pause. In agent mode you should still drive each step individually so you can pause at step 7 (Schema Confirmation).

## Workflow

Run strictly in order. Each step depends on output from the previous one; an inference artifact persisted in step 6 is reused all the way through step 13.

1. **Confirm input source, theme, and mode** — first identify the source type from the user's request, then resolve the multi-modal **Theme**, then **explicitly ask the user to choose the import mode** when multiple options exist. Do not silently pick any of these.

   **Source identification**:
   - If the user provided a database connection or table name → MySQL.
   - If the user provided a file path ending in `.jsonl` or described a line-delimited/append-only file → JSONL.
   - If the user provided a file path ending in `.json` (JSON array) or `.csv` → JSON/CSV (one-time only).
   - If the source is unclear, ask the user which source type they want to onboard from before proceeding.

   **Theme resolution (mandatory)** — this skill creates only `multi_modal` datasets, and the backend requires a valid `Theme`. Ask the user to pick one:
   - `e_commerce` — e-commerce products (with images, price, brand, tags)
   - `long_video` — long-form video (movies, series; with cover image, language, category)
   - `content` — general short-form content (posts, news articles with thumbnails, tags, categories)
   - `general` — other / generic multi-modal (default)
   If the user cannot decide, default to `general`. Record the chosen theme in a local variable and pass it to every subsequent command that accepts `--theme`.

   **Language**: ask for language if the user has not already stated it (`zh` / `en` / `ko` / `ja` / `hi`); default to `zh` for Chinese-speaking users, `en` otherwise.

   **Import mode selection**:
   - For **MySQL** and **JSONL**, resolve whether the user wants one-time import or one-time + ongoing sync. **Only skip the question when the request contains an explicit, unambiguous signal** for one side (apply this detection to whatever language the user is writing in — English, Chinese, etc.):
     - **Explicit one-time**: phrases carrying "once", "one-time", "snapshot only", "just this time", or equivalent single-import semantics.
     - **Explicit ongoing**: phrases carrying "sync", "keep in sync", "auto-import", "scheduled", "incremental", "keep updated", or equivalent recurring-sync semantics.
   - If the request is **neutral** — e.g. "import this file", "import this data", bare "import", mentions only a file path with an import verb but says nothing about scheduling/increment/once — **you MUST ask the user to choose**. The bare import verb is NOT a one-time signal; it is ambiguous. **Never silently default to one-time.**
   - For **JSON (array)** and **CSV**, only one-time import is supported. No question needed.

   After the source type, theme, language, and mode are confirmed, follow the matching branch:

   - **MySQL — one-time import**: identify the table name, infer dataset name and primary key, and require explicit confirmation before any real write. Continue at step 2.
   - **MySQL — ongoing sync**: same as above, plus the user must explicitly confirm the incremental cursor field itself. After step 10 continue at step 11.
   - **MySQL — existing dataset — ongoing sync**: validate the dataset with `vs dataset get --id <DatasetId> --full`, confirm the source config (especially the incremental cursor field), then jump directly to step 11.
   - **JSONL file — one-time import**: confirm the file path. Continue at step 2.
   - **JSONL file — ongoing sync**: confirm the file path. You MUST also **interactively ask the user to confirm** that new records will only be appended to the end of the file (append-only). Present the constraint clearly — sync only supports files that grow by adding new lines; edits or deletions of existing lines are not tracked and may cause duplicate or missing records. Wait for explicit user confirmation before proceeding. After step 10 continue at step 11.
   - **JSON (array) or CSV file — one-time import**: confirm the file path. These formats are one-time import only; ongoing sync is not supported because they do not provide a stable append-only cursor. Convert the input to JSONL (one JSON object per line) before continuing. Continue at step 2.
   - **Existing dataset + one-time source import**: not supported as a single workflow. Explain that the current CLI split supports either source export → new dataset onboarding for a one-time import, or background sync for ongoing updates, then let the user choose which branch to switch to.

   Source environment configuration (applies to MySQL branches only; local files require no credentials):
   - MySQL uses these environment variables by default: `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE` (optional: `MYSQL_CHARSET`).
   - Render a **bash export template snippet** with placeholder values (for example `MYSQL_PASSWORD=your_password`) and ask the user to fill in real values in their own terminal or shell session, then run `export` on each variable.
   - **Never** display actual database credential values in chat. **Never** ask the user to paste or submit database credentials into the chat dialog.
   - **Never** list "connection config" / "连接配置" blocks with concrete host/user/password values inside the chat. The only allowed format is a bash template with placeholder values.
   - The export, init, and run commands read MySQL credentials **only from environment variables**. They do not accept credentials via flags or chat input.
   - This is a human checkpoint. Wait for explicit confirmation that the local source environment is configured before proceeding.

2. **Export source snapshot to JSONL** — run `vs connector export` for the selected source to produce a bootstrap JSONL file:
   - MySQL: `vs connector export --source mysql --source-table <table> --id-field <field> --cursor-field <field> [other flags]`
   - Local file: `vs connector export --source jsonl --file <path/to/items.jsonl> [other flags]` (convert JSON arrays or CSV to JSONL first if needed)

   The bootstrap file is always written to `/tmp/viking/connector/<job>/bootstrap/items.jsonl`. Do not use `--output` to try to override that path; `--output` only redirects the rendered command result. After export, use the emitted `items.jsonl` as the input file and continue at step 3.

3. **Get upload URL** — `vs dataset import-url --file-name <basename>`. Capture `Result.FileUrl` and `Result.FileKey`. Keep `FileKey` for step 5.
4. **PUT upload** — upload the raw item file to `FileUrl` (e.g. `curl -X PUT --data-binary "@<local-path>" "<FileUrl>"`). Expect HTTP 200 with empty body. Do not add an `Authorization` header — `FileUrl` is already presigned.
5. **Submit inference task** — `vs dataset infer-schema --tos-key <FileKey> --type multi_modal --theme <general|e_commerce|content|long_video> --language <lang> --name <dataset-name>`. Capture `Result.TaskId`. Theme values accept alias normalization: `ecommerce`/`e-commerce` → `e_commerce`, `long-video`/`longvideo` → `long_video`, `common`/`default` → `general`.
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
   Dataset <Name> · type=multi_modal · theme=<Theme>

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

8. **Dry-run create** — build `dataset-create.json` directly from the persisted artifact: copy `Schema` as-is (do **not** flip `IsPK`; the backend derives PK from `BizAttr`), copy `DataFieldConfig.FieldDescMap` as `FieldDescMap`, fill in `Name` / `Type: "multi_modal"` / `Language` / `Description`, set `Theme` to the chosen theme, optionally set `ProcessConfig`, then set `DryRun: true`. Run `vs dataset create --data @dataset-create.json --dry-run`. Surface any validation errors and pause for correction. Standard payload shape:

   ```json
   {
     "Name": "<dataset-name>",
     "Type": "multi_modal",
     "Description": "<one-line description>",
     "Language": "zh",
     "Theme": "<general|e_commerce|content|long_video>",
     "Schema":       <copy from infer-result.json Schema>,
     "FieldDescMap": <copy from infer-result.json DataFieldConfig.FieldDescMap>
   }
   ```

9. **Real create** — re-run step 8 without `DryRun`. Capture `Result.Dataset.Id` as `DatasetId` and persist it next to the artifact (e.g. `./.viking/item-plans/<dataset-name>/dataset.json`).
10. **Write data** — `vs data write --dataset-id <DatasetId> --fields @/tmp/viking/connector/<job>/bootstrap/items.jsonl` to push the records from the bootstrap JSONL file. Expect a `request_id` in the response.
11. **(Ongoing sync mode only) Start background incremental sync** — run `vs connector init --name <job> --source <mysql|jsonl> --dataset-id <DatasetId> ...` to persist the job config, then `vs connector run --job <job> --daemon` to start the background sync. For MySQL, pass `--source-table`, `--id-field`, `--cursor-field`; for local files, pass `--file <path>`. In the hand-off, surface `job`, `pid`, `trace.ndjson`, `imported-records.log`, `vs connector status --job <job>`, and `vs connector stop --job <job>`. Skip this step for one-time import workflows.
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
## Enum Reference

enum fields are **strings**. Pass the CLI alias (case-insensitive) and let the CLI normalize to the backend wire value.

| Field | CLI alias (recommended) | Backend wire value (snake_case) |
|---|---|---|
| `Type` (dataset) | `multi_modal` (use `multi-modal` / `multimodal` as aliases) | `multi_modal` |
| `Theme` | `general` / `common` / `default` | `general` |
| `Theme` | `ecommerce` / `e-commerce` | `e_commerce` |
| `Theme` | `content` | `content` |
| `Theme` | `long-video` / `longvideo` | `long_video` |
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
6. **String enums only.** Pass `Type` as `"multi_modal"` and `Theme` as one of `general|e_commerce|content|long_video`. Do not pass numeric enum codes. App-level `--industry` is only used for `vs app create`; never pass it to dataset create / infer-schema.
7. **No backtrack flags.** `attach-dataset` (V2) does not accept `BacktrackReq`. If the user needs historical backtrack, treat it as a separate workflow.
8. **Preserve `FieldDescMap` and `DataConfig`.** Forward the inferred `FieldDescMap` to `CreateDatasetV2`, and forward the inferred `DataConfig` verbatim to `AttachDatasetToApplicationV2`. Do not regenerate or strip them locally.
9. **No `Authorization` header on the TOS PUT.** `FileUrl` is presigned; adding auth headers will break the upload.
10. **Always end with the console hand-off block.** The agent's final message in this workflow must include the dataset (and app, if created) console URLs derived from the active profile (`volcengine.com` for Volc, `byteplus.com` for BytePlus) plus a reminder that runtime APIs (`search`, `chat`, recommend) can only be used once the console shows the resource as Ready. Never skip this step — the user has no other clue where to monitor readiness.
11. **All new-dataset onboarding must go through the export step.** Both MySQL and local file sources must first be exported to a bootstrap JSONL file via `vs connector export`. Do not claim `dataset ingest --source ...` exists in the supported workflow, and do not bypass the export step by uploading the raw user file directly. After export, reuse the emitted bootstrap file path in the normal V2 onboarding flow.
12. **Ongoing sync must go through the sync lifecycle commands.** Use `connector init` + `connector run --daemon`, then surface runtime artifacts (`trace.ndjson`, `imported-records.log`, `runtime.json`, `state.json`) plus the status/stop commands. This applies to both MySQL and local file sources.
13. **Incremental cursor confirmation is a hard gate for MySQL sync.** In MySQL `sync` mode, never silently accept an inferred cursor field. Show the basis for the guess and require explicit user confirmation before starting the background job. For local file sync, new lines appended to the file are automatically detected; no cursor field confirmation is needed.
14. **Append-only confirmation is a hard gate for JSONL file sync.** In JSONL `ongoing sync` mode, you MUST interactively ask the user to confirm that the file will only grow by appending new lines. Explain clearly that edits or deletions of existing lines are not tracked and may cause duplicate or missing records. Do not start the background sync job until the user explicitly confirms this constraint. This confirmation must be an interactive question — never silently assume the file is append-only.
15. **Resolve import mode before proceeding for MySQL and JSONL.** Only skip the question when the request contains an explicit one-time or ongoing signal. The bare import verb without further qualification is neutral and you MUST ask. Never silently default to one-time. JSON/CSV are one-time only with no question needed.
16. **Do not invent a one-shot source import into an existing dataset.** If the user wants `existing_dataset + once`, explain the current CLI split and let them choose between creating a new dataset from exported JSONL or enabling connector-based sync.
17. **Never block waiting for readiness.** After printing the hand-off block, end your turn immediately. Do NOT run `vs app wait-ready`, `vs dataset wait-ready`, or any polling loop. Readiness is an asynchronous backend process; tell the user to check the console links themselves.
18. **Theme is mandatory.** You MUST pass `--theme` (one of `general|e_commerce|content|long_video`) to both `dataset infer-schema` and `dataset create`. If the user has no preference, default to `general`. Do not leave Theme unset.
19. **Multi-modal BizAttrs are backend-assigned; do not hand-edit them.** Schema inference automatically assigns the correct `MultiModal*` BizAttr codes (e.g. `MultiModalId`=80, `MultiModalImageUrl`=83, `MultiModalVideoUrl`=84, `MultiModalCategory`=85, `MultiModalPrice`=88). Do not add, remove, or remap these BizAttrs manually. If inference returns Warnings about missing required BizAttrs for the chosen Theme, fix the source data (add the missing column) rather than patching BizAttr by hand.
20. **Preserve multi-modal DataFieldConfig sub-fields.** When attaching the dataset to an application, the `DataConfig` in `attach.json` MUST include `ImageIndexFields`, `VideoIndexFields`, and `ChatFields` exactly as returned by inference (they may be empty arrays, but must not be dropped). These fields drive image search, video search, and multimodal chat respectively; stripping them silently disables those capabilities.
21. **Do not call GetSchemaTemplate from the CLI.** The frontend (DonaldTrump) calls `GetSchemaTemplate(TemplateCode=theme)` to get per-theme BizAttrConstraint lists; the CLI does not wrap this API. For CLI-driven onboarding, trust the backend's schema inference to assign required fields correctly; the Schema Confirmation Warnings block will surface any missing required fields, which the agent should relay to the user. Do not add a CLI call to fetch or validate templates.

## Recovery Hints

- `infer-result` returns `Status=Failed` → read the `Error` / `ErrorCode` fields, fix the input file (encoding, JSONL formatting, header row), re-upload via step 3.
- `dataset create` rejects with `InvalidParameter.PrimaryKeyCount` → check the persisted artifact: at least one field must carry a PK-class `BizAttr` (`ImagePK` / `VideoContentID` / `QueryPK` / `MultiModalID`). If none does, inference effectively failed; re-run with a cleaner input that includes a stable identifier column.
- `dataset create` rejects with `InvalidParameter.Theme` or `InvalidParameter.UnsupportedTheme` → the `--theme` value is invalid; use one of `general|e_commerce|content|long_video`.
- `dataset create` rejects with `InvalidParameter.Request` → most common causes: (a) field `Type` sent as a number instead of a string, (b) `BizAttr` accidentally stripped during local editing, (c) `Theme` was missing or empty. Fix locally and dry-run again; no need to re-run inference.
- `dataset create` rejects with multi-modal BizAttr errors (e.g. missing required `MultiModalImageUrl` for `e_commerce` theme) → the inferred schema is missing a required field for the chosen theme. Add the missing column to the source data and re-run from step 3 (re-upload + re-infer); do NOT patch BizAttr by hand.
- `attach-dataset` errors after a successful create → run `vs app diagnose --application-id <AppId>` to inspect the runtime state before retrying. If the error is `OperationDenied.ImageAndVideoDatasetNotSupport` (code 340023), the application already has a dataset of a conflicting modality (image-text vs video cannot be bound together); create a separate application instead.
- `attach-dataset` errors with `OperationDenied.VideoDatasetFieldsInsufficient` (code 340025) → a multi-modal video dataset requires descriptive text/array<string> fields beyond numeric fields; add title/content/description columns to the source data.
- `data write` returns a HTTP error → confirm the dataset is in the `Ready` state via `vs app status --application-id <AppId>` (if attached), or `vs dataset get --id <DatasetId> --full` for unattached writes.

## Worked Example

See [references/worked-example.md](references/worked-example.md) for an end-to-end verified bash transcript (10-item apparel `goods.jsonl` → dataset + app + attach), including the `jq` recipes used to build `dataset-create.json` and `attach.json` from the persisted `infer-result.json`.
