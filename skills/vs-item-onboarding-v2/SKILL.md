---
name: vs-item-onboarding-v2
description: "V2 item-level onboarding driven entirely by the V2 OpenAPI: GetPresignedImportUrlV2 → PUT upload → AddInferDatasetSchemaTaskV2 → GetInferDatasetSchemaResultV2 → CreateDatasetV2 → data write → CreateApplicationV2 → AttachDatasetToApplicationV2. Backend handles schema inference end-to-end and auto-picks the primary key from `BizAttr`; the agent persists the inferred artifact locally, confirms it once with the user, dry-runs, then drives create / write / attach using the same persisted artifact. Use this whenever the user wants the shortest path from a raw item file to a fully wired Viking AI Search dataset (and optional application)."
category: workflow
applies_to: codex, agents, external-agent
requires_cli: ">=0.2.0"
keywords: item onboarding v2, dataset onboarding v2, V2 OpenAPI, presigned upload, AddInferDatasetSchemaTaskV2, GetInferDatasetSchemaResultV2, CreateDatasetV2, AttachDatasetToApplicationV2, FieldDescMap, DataFieldConfig, data write, dry-run, attach-dataset, infer-result persistence, render-schema, schema confirmation, vs-schema-confirm
commands: dataset import-url, dataset infer-schema, dataset infer-result, dataset create, dataset ingest, data write, app create, app attach-dataset
---

# Viking Item Onboarding (V2)

## Language Matching (apply throughout)

Match the language of the **user's most recent message** in every line of prose you write — confirmation prompts, status notes, hand-off summaries, questions, error explanations, **and any internal thinking / reasoning / planning output that the host may surface (e.g. `<thinking>` blocks, "thinking" panels, scratchpad notes, todo descriptions)**. If the user is writing in Chinese, every prose line and every reasoning line must also be in Chinese; if English, English; same for Japanese, etc. The fact that this skill file is written in English is for documentation only — at runtime translate all **prose and reasoning** into the user's language. Do not switch back to English mid-flow just because the surrounding skill text is English.

**中文用户优先级（最常见的场景）**：当 `current_query` 或对话中最近一条用户消息为中文时：

- 你写给用户看的所有句子（确认提示、状态说明、报错解释、最终交付总结）必须用中文。
- 你内部的思考 / 推理 / 计划输出（thinking 块、scratchpad、待办描述等）也必须用中文。
- 工作区里你新建的中间文件、目录名（除了与 CLI 契约相关的英文标识外）的注释或描述部分，也尽量使用中文。

Do **not** translate the following — keep them verbatim so the contract stays machine-checkable:

- The verbatim CLI block between `<!-- vs-schema-confirm: BEGIN -->` and `<!-- vs-schema-confirm: END -->` (English section labels `**Metadata**` / `**Fields (N)**` / `**Field Roles**` / `**Warnings (N)**` and English warning text come straight from the CLI).
- CLI command names, flag names, JSON keys, enum values, field names, primary-key BizAttr identifiers (`ImagePK` / `VideoContentID` / `QueryPK` / `MultiModalID`), dataset IDs / app IDs / TaskIDs, and console URLs.
- The single literal token the user must reply to confirm — write it as `` `yes` `` in any language so the contract for advancing to step 6 is unambiguous (you may add a parenthetical native-language hint, e.g. `回复 \`yes\`（即"确认"）继续`).

If you are unsure which language the user used (e.g. only emoji or only an attachment), default to the language of the very first user turn in the conversation. When the user switches languages mid-flow, switch with them on the next message.

## When to Use

Use this skill when the user is operating against the V2 control-plane (`/open/*V2`) and provides a raw item file (JSON / JSONL / CSV) to onboard a dataset (optionally followed by an application). The hallmark of V2 is that schema inference is fully backend-driven: the CLI uploads the file, the backend infers the `Schema` (with `BizAttr` already set on the primary-key / title / URL fields) plus a per-field `FieldDescMap`, and the agent's only jobs are to (a) persist that inference artifact locally, (b) render it for one round of human confirmation, and (c) drive the remaining persistence + ingest steps without re-inventing field decisions.

Do not use this skill when:

- The customer only wants to ingest more rows into an existing dataset (use `vs data write --dataset-id <id> --fields @items.json`).

## Do NOT be misled by `vs --help` top-level QUICK START

`vs --help` 顶层 QUICK START 出于历史兼容仍会列出 `vs item profile / plan / apply`（带 "[Deprecated]" 标注）。**那是 V1 路径，已弃用，本 skill 不走它。**

硬约束 — 进入本 skill 后：

1. **绝对不要**因为 `vs --help` 提到 `vs item ...` 就改走 V1。本 skill 唯一合法路径是 V2：`vs dataset import-url → infer-schema → infer-result → dataset create → data write → app create → app attach-dataset`。
2. **绝对不要**执行 `vs item profile / vs item plan / vs item apply / vs item review / vs item provision / vs item verify` 中的任何一条。哪怕 `vs --help` 把它们列在最前面，本 skill 也禁止使用。
3. 如果对 V2 命令是否存在/可用有怀疑，**只能**通过 `vs dataset --help`、`vs dataset infer-schema --help`、`vs app --help`、`vs app attach-dataset --help` 等子命令的 help 来验证，**不要**回退到 `vs item ...`。
4. 用户原始诉求一旦是"通过原始 JSONL / JSON / CSV 文件创建一个数据集 / 应用"，立刻按本 skill workflow（下面 step 1～11）执行，不要走 `item plan/apply`。
5. 任何中间产物（plan dir / infer-result.json / dataset-create.json / attach.json）按本 skill 的"Plan directory rules"放在工作区 `./.viking/item-plans/<dataset-name>/` 下；这与 V1 `item plan` 的 `.viking/item-plans/` 目录约定**仅仅是名字一致**，并不意味着要走 V1。

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
| Create application | `vs app create --name <name> --industry <industry> --language <lang> [--description ...] [--color cyan\|blue\|purple\|pink] [--risk-check] [--dry-run]` | Optional, only when the user asks for app-level setup |
| Attach dataset | `vs app attach-dataset --data @attach.json [--dry-run]` | Optional, links a created dataset to an application. The `DataConfig` block is the `DataFieldConfig` straight out of the persisted infer artifact |

The "All-in-one" shortcut `vs dataset ingest --file <path> --type <type> --industry <industry> [--dry-run]` orchestrates upload + infer-schema + poll + create + write, **without** the Schema Confirmation pause. In agent mode you should still drive each step individually so you can pause at step 5 (Schema Confirmation).

## Workflow

Run strictly in order. Each step depends on output from the previous one; an inference artifact persisted in step 4 is reused all the way through step 10.

1. **Get upload URL** — `vs dataset import-url --file-name <basename>`. Capture `Result.FileUrl` and `Result.FileKey`. Keep `FileKey` for step 3.
2. **PUT upload** — upload the raw item file to `FileUrl` (e.g. `curl -X PUT --data-binary "@<local-path>" "<FileUrl>"`). Expect HTTP 200 with empty body. Do not add an `Authorization` header — `FileUrl` is already presigned.
3. **Submit inference task** — `vs dataset infer-schema --tos-key <FileKey> --type <item|...> --industry <alias> --language <lang> --name <dataset-name>`. Capture `Result.TaskId`. Industry aliases follow the snake_case backend rules: `ecommerce`/`e-commerce` → `e_commerce`, `social-platform` → `social_platform`, plus `material`/`video`/`news`/`other`. The CLI converts the alias to the backend-expected snake_case automatically.
4. **Poll inference result + persist locally** — `vs dataset infer-result --task-id <TaskId>` until `Result.Status === "Success"` (poll roughly every 5s, max ~3 minutes). Then write `Result` verbatim to a **workspace-relative** artifact file so the rest of the workflow can read from it.

   **Plan directory rules (重要)**：

   - **必须**写到当前工作区相对路径：`./.viking/item-plans/<dataset-name>/infer-result.json`（即 `<cwd>/.viking/item-plans/<dataset-name>/...`）。
   - **禁止**写到 `~/.viking/`（即 `$HOME/.viking/`）下任何位置。`~/.viking/` 是 vs CLI 私有的配置/凭据目录（`config.json`、`credentials.json.enc`），不是 plan dir。很多 agent host 把 `~/` 放在沙箱之外，写过去会以 `EPERM: operation not permitted` 失败，并且即便写成功也会和 CLI 的私有文件混在一起。
   - 如果当前工作区根目录无法写（例如沙箱只允许临时目录）：fallback 优先级为 `${WORKSPACE_DIR}/.viking/item-plans/<dataset-name>/` → `${TMPDIR}/viking-item-plans/<dataset-name>/` → `./viking-item-plans/<dataset-name>/`。**绝不**改写到家目录 `~/.viking/`。
   - 一旦确定了 plan dir，把它存到一个本地变量（例如 `WORK`）并在后续 step 6/7/8/10 里复用同一个路径，**不要**在不同 step 之间切换 plan dir。

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

5. **Schema Confirmation (mandatory)** — show the persisted artifact to the user **using the CLI's deterministic renderer**, then surface it verbatim. _(Historically called "Stage A".)_

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

   Wait for an explicit positive confirmation (`yes` or equivalent) before moving to step 6. If the user requests changes, edit the persisted `infer-result.json` in place (do **not** re-run inference) and re-run `vs dataset infer-result --data @infer-result.json --render-schema`, then re-emit the same three-part template so the user sees the same deterministic structure.

6. **Dry-run create** — build `dataset-create.json` directly from the persisted artifact: copy `Schema` as-is (do **not** flip `IsPK`; the backend derives PK from `BizAttr`), copy `DataFieldConfig.FieldDescMap` as `FieldDescMap`, fill in `Name` / `Type` / `Industry` / `Language` / `Description`, set `DryRun: true`. Run `vs dataset create --data @dataset-create.json --dry-run`. Surface any validation errors and pause for correction. Useful payload shape:

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

7. **Real create** — re-run step 6 without `DryRun`. Capture `Result.Dataset.Id` as `DatasetId` and persist it next to the artifact (e.g. `./.viking/item-plans/<dataset-name>/dataset.json`).
8. **Write data** — `vs data write --dataset-id <DatasetId> --fields @items.json` to push the records (the same item file you uploaded in step 2, converted to a JSON array if it was JSONL). Expect a `request_id` in the response.
9. **Optional: create application** — only if the user explicitly asks for app-level setup: `vs app create --name <app-name> --description "<text>" --industry <alias> --language <lang>`. Capture `Result.Application.Id` as `AppId`.
10. **Optional: attach dataset** — read `DataFieldConfig` straight from the persisted artifact and assemble:

    ```json
    {
      "ApplicationId": "<AppId>",
      "DatasetId":     "<DatasetId>",
      "DataConfig":    <copy from infer-result.json DataFieldConfig>
    }
    ```

    Then call `vs app attach-dataset --data @attach.json`. Empty `Result` means success. This is the moment where the `IndexFields`/`FilterFields`/`ImageIndexFields`/etc. captured in step 4 are actually applied — never reinvent these arrays from the schema; always pull them from the persisted artifact.

11. **Hand-off — print console links + readiness reminder (mandatory).** After the last successful step (data write, or attach when the app branch ran), the agent must render a short summary block telling the user (a) where to monitor readiness in the console, and (b) that runtime APIs (`search`, `chat`, recommend) can only be exercised once readiness reports OK. Pick the console host from the active profile's `baseUrl` / `controlPlaneBaseUrl`:

    - Host contains `volcengineapi.com` / `volces.com` → **火山引擎**, use `https://console.volcengine.com/aisearch/platform/region:aisearch-platform+<region>/...`. `<region>` is the active profile region (e.g. `cn-beijing`).
    - Host contains `byteplus.com` → **BytePlus**, use `https://console.byteplus.com/aisearch/region:aisearch+ap-southeast-1/...` (BytePlus today only exposes the `ap-southeast-1` region; do not fabricate other regions).

    Print the URLs only for the resources that actually exist in this run (dataset is always present; app/attach are only present if the user opted in). Render the prose lines (✓ markers, readiness reminder, runtime-API tip) in the **user's current language** per the **Language Matching** rule; keep IDs and URLs verbatim. Examples for the same Volc `cn-beijing` run, one per language:

    **中文用户**:
    ```
    ✓ 数据集已创建：DatasetId=<DatasetId>
      控制台链接：https://console.volcengine.com/aisearch/platform/region:aisearch-platform+cn-beijing/home/dataset/<DatasetId>

    ✓ 应用已创建并绑定数据集：AppId=<AppId>
      控制台链接：https://console.volcengine.com/aisearch/platform/region:aisearch-platform+cn-beijing/app/<AppId>

    数据需要后台处理后才能查询。请打开上面链接关注数据集 / 应用的「生效状态」（Ready）。
    生效之后即可使用 `vs search`、`vs chat`、`vs recommend` 等运行时接口进行体验。
    ```

    **English user**:
    ```
    ✓ Dataset created: DatasetId=<DatasetId>
      Console link: https://console.volcengine.com/aisearch/platform/region:aisearch-platform+cn-beijing/home/dataset/<DatasetId>

    ✓ Application created and dataset attached: AppId=<AppId>
      Console link: https://console.volcengine.com/aisearch/platform/region:aisearch-platform+cn-beijing/app/<AppId>

    Data must finish backend processing before it is queryable. Open the links above and watch for the "Ready" state on the dataset / application.
    Once they report Ready, you can exercise the runtime APIs via `vs search`, `vs chat`, `vs recommend`.
    ```

    **日本語ユーザ**:
    ```
    ✓ データセットを作成しました: DatasetId=<DatasetId>
      コンソールリンク: https://console.volcengine.com/aisearch/platform/region:aisearch-platform+cn-beijing/home/dataset/<DatasetId>

    ✓ アプリケーションを作成しデータセットを紐付けました: AppId=<AppId>
      コンソールリンク: https://console.volcengine.com/aisearch/platform/region:aisearch-platform+cn-beijing/app/<AppId>

    データが利用可能になるにはバックエンド処理の完了が必要です。上記リンクからデータセット / アプリケーションの「Ready」状態を確認してください。
    Ready になると `vs search` / `vs chat` / `vs recommend` などのランタイム API を利用できます。
    ```

    Same shape on BytePlus, with the byteplus URL pattern. The agent must surface this block as the final output of the workflow; do not omit it even if the user has not asked. If only the dataset was created (no app branch), still print the dataset link and the readiness reminder (chat / search will require attaching to an app afterwards).

## Schema Confirmation — Output Contract

Step 5 is the only step where the agent's chat message _is_ the user experience. The CLI does the rendering; the agent only frames the question. Your message MUST follow the three-part template below — exactly three parts, in this order:

1. **One-line metadata header** (above the CLI block):

   ```
   Dataset <Name> · type=<Type> · industry=<Industry>
   ```

2. **Verbatim CLI block** between `<!-- vs-schema-confirm: BEGIN -->` and `<!-- vs-schema-confirm: END -->`. Copy character-for-character from the stdout of `vs dataset infer-result --task-id <id> --render-schema` (or `--data @infer-result.json --render-schema` after edits). The CLI produces a four-section block: `**Metadata**` / `**Fields (N)**` / `**Field Roles**` / `**Warnings (N)**`, with the field table rendered as a real markdown table and types wrapped in backticks (e.g. `` `array<string>` ``) so chat UIs do not strip the angle brackets.

3. **One-line confirmation prompt** (below the CLI block):

   ```
   <one-line confirmation prompt, written in the user's language — Chinese for Chinese users, English for English users, etc. See the per-language templates in step 5 above. The literal token `` `yes` `` and field / JSON key names stay in English.>
   ```

### Do

- Surface the metadata header, the verbatim CLI block, and the confirmation prompt — nothing else, in that order.
- Wrap any type or field reference you mention outside the CLI block in backticks; chat UIs render unwrapped `<…>` as HTML and silently drop them.
- Wait for an explicit positive confirmation (`yes` or equivalent) before moving to step 6.
- On user-requested corrections, edit the persisted `infer-result.json` in place and re-run `vs dataset infer-result --data @infer-result.json --render-schema` — do not re-run inference, do not patch the table by hand.

### Do not

- Re-render the field table yourself or replace it with a bullet list, condensed summary, "key fields are …" highlights, or any other paraphrase.
- Write phrases like "see CLI output above" / "tool result has the full table" / "full details in the tool call". Tool-call output is collapsed by default in trae-cn / cursor / claude-code, so the user only sees what is in your own message.
- Drop the `**Warnings (N)**` section even when N is 0 — deterministic structure beats brevity.
- Touch `IsPK` or strip `BizAttr` when the user asks you to "fix" a field; explain that backend derives PK from `BizAttr` and only allow edits to `FieldDescMap` / role arrays in `DataFieldConfig`.

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

1. **Persist the inference artifact.** Write the entire `Result` from `dataset infer-result` to a local file in step 4 and re-read it in steps 6, 7, and 10. Do not pass field roles inline from memory; always source them from the persisted file so create + attach stay consistent.
2. **Plan dir 必须在工作区内。** 所有 plan/artifact 文件（`infer-result.json` / `dataset-create.json` / `attach.json` 等）必须写到 **工作区相对路径** `./.viking/item-plans/<dataset-name>/`（或在沙箱受限时按 step 4 的 fallback 顺序：`${WORKSPACE_DIR}/.viking/...` → `${TMPDIR}/viking-item-plans/...` → `./viking-item-plans/...`）。**绝不允许**写到 `~/.viking/`（即 `$HOME/.viking/`），那是 vs CLI 私有的 config/credentials 目录、且大多数 agent 沙箱不放行家目录写入，会触发 `EPERM: operation not permitted`。
3. **Never flip `IsPK`.** Backend derives PK from `BizAttr`. Modifying `IsPK` (or stripping `BizAttr`) on the wire is a code smell and can fail validation.
4. **Never skip Schema Confirmation (step 5).** Schema persistence (step 6 onward) requires an explicit human "yes" on the inferred schema and field roles.
5. **Always dry-run once.** Run `dataset create --dry-run` before the real create. Surface backend validation errors to the user before retrying.
6. **String enums only.** Pass `Type` and `Industry` as their string values (PascalCase alias accepted on input, snake_case is what the backend expects on wire). Numeric codes will be rejected.
7. **No backtrack flags.** `attach-dataset` (V2) does not accept `BacktrackReq`. If the user needs historical backtrack, treat it as a separate workflow.
8. **Preserve `FieldDescMap` and `DataConfig`.** Forward the inferred `FieldDescMap` to `CreateDatasetV2`, and forward the inferred `DataConfig` verbatim to `AttachDatasetToApplicationV2`. Do not regenerate or strip them locally.
9. **No `Authorization` header on the TOS PUT.** `FileUrl` is presigned; adding auth headers will break the upload.
10. **Always end with the console hand-off block.** The agent's final message in this workflow must include the dataset (and app, if created) console URLs derived from the active profile (`volcengine.com` for Volc, `byteplus.com` for BytePlus) plus a reminder that runtime APIs (`search`, `chat`, recommend) can only be used once the console shows the resource as Ready. Never skip this step — the user has no other clue where to monitor readiness.

## Recovery Hints

- `infer-result` returns `Status=Failed` → read the `Error` / `ErrorCode` fields, fix the input file (encoding, JSONL formatting, header row), re-upload via step 1.
- `dataset create` rejects with `InvalidParameter.PrimaryKeyCount` → check the persisted artifact: at least one field must carry a PK-class `BizAttr` (`ImagePK` / `VideoContentID` / `QueryPK` / `MultiModalID`). If none does, inference effectively failed; re-run with a cleaner input.
- `dataset create` rejects with `InvalidParameter.Request` → most common causes: (a) field `Type` sent as a number instead of a string, (b) `Industry` sent in PascalCase like `ECommerce` instead of the alias `ecommerce`, (c) `BizAttr` accidentally stripped during local editing. Fix locally and dry-run again; no need to re-run inference.
- `attach-dataset` errors after a successful create → run `vs app diagnose --application-id <AppId>` to inspect the runtime state before retrying.
- `data write` returns a HTTP error → confirm the dataset is in the `Ready` state via `vs app status --application-id <AppId>` (if attached), or `vs dataset get --id <DatasetId> --full` for unattached writes.

## Worked Example (verified end-to-end)

Input: `/path/to/goods.jsonl` (10 apparel items, `id` int, `name`/`category`/`brand`/`color`/`size`/`material`/`style` strings or string arrays, `price`/`originalPrice`/`rating` floats, `stock`/`sales` ints, `imageUrl`/`description` strings). Backend inference correctly assigns `BizAttr: "ImagePK"` to `id`, `BizAttr: "ImageTitle"` to `name`, `BizAttr: "ImageURL"` to `imageUrl`, etc.

```bash
WORK=./.viking/item-plans/goods_demo

# 1. Upload URL
vs dataset import-url --file-name goods.jsonl > $WORK/01_import_url.json
FILE_KEY=$(jq -r '.Result.FileKey' $WORK/01_import_url.json)
FILE_URL=$(jq -r '.Result.FileUrl' $WORK/01_import_url.json)

# 2. PUT upload (no auth header)
curl -sS -X PUT --data-binary "@/path/to/goods.jsonl" "$FILE_URL"

# 3. Submit inference
vs dataset infer-schema --tos-key "$FILE_KEY" --type item \
  --name goods_demo --industry e_commerce --language zh \
  --theme "服装电商商品库" > $WORK/02_infer_schema.json
TASK_ID=$(jq -r '.Result.TaskId' $WORK/02_infer_schema.json)

# 4. Poll + persist (repeat until Status=Success)
vs dataset infer-result --task-id "$TASK_ID" > $WORK/03_infer_result.json
jq '.Result' $WORK/03_infer_result.json > $WORK/infer-result.json  # ← persistent source of truth

# 5. Schema Confirmation: render & confirm (agent must surface `vs dataset infer-result --task-id <id> --render-schema` verbatim and wait for user `yes`)

# 6. Build dataset-create.json from the persisted artifact and dry-run
#    NB: Industry must be the wire value "e_commerce", not "ecommerce".
jq '{
  Name: "goods_demo",
  Type: "item",
  Description: "Goods demo dataset",
  Industry: "e_commerce",
  Language: "zh",
  Schema: .Schema,
  FieldDescMap: .DataFieldConfig.FieldDescMap
}' $WORK/infer-result.json > $WORK/dataset-create.json
vs dataset create --data @$WORK/dataset-create.json --dry-run

# 7. Real create
vs dataset create --data @$WORK/dataset-create.json > $WORK/04_create.json
DATASET_ID=$(jq -r '.Result.Dataset.Id' $WORK/04_create.json)

# 8. Write data
vs data write --dataset-id "$DATASET_ID" --fields @/path/to/items.json

# 9. Optional: create app (same wire-value rule applies)
vs app create --name goods_app --description "..." --industry e_commerce --language zh > $WORK/05_app.json
APP_ID=$(jq -r '.Result.Application.Id' $WORK/05_app.json)

# 10. Optional: attach — DataConfig comes verbatim from the persisted artifact
jq --arg app "$APP_ID" --arg ds "$DATASET_ID" '{
  ApplicationId: $app,
  DatasetId:     $ds,
  DataConfig:    .DataFieldConfig
}' $WORK/infer-result.json > $WORK/attach.json
vs app attach-dataset --data @$WORK/attach.json
```

Notice how `dataset-create.json`'s `Schema` is a verbatim copy from `infer-result.json` (no `IsPK` rewrites), and `attach.json`'s `DataConfig` is the entire `DataFieldConfig` block — the text-search fields, image-search fields, filter fields, etc. all flow through unchanged. That's the V2 contract.
