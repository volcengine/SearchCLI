---
name: vs-item-onboarding-v2
description: "V2 item-level onboarding driven entirely by the V2 OpenAPI: GetPresignedImportUrlV2 → PUT upload → AddInferDatasetSchemaTaskV2 → GetInferDatasetSchemaResultV2 → CreateDatasetV2 → data write → CreateApplicationV2 → AttachDatasetToApplicationV2. Backend handles schema inference end-to-end and auto-picks the primary key from `BizAttr`; the agent persists the inferred artifact locally, confirms it once with the user, dry-runs, then drives create / write / attach using the same persisted artifact. Use this whenever the user wants the shortest path from a raw item file to a fully wired Viking AI Search dataset (and optional application)."
category: workflow
applies_to: codex, agents, external-agent
requires_cli: ">=0.2.0"
keywords: item onboarding v2, dataset onboarding v2, V2 OpenAPI, presigned upload, AddInferDatasetSchemaTaskV2, GetInferDatasetSchemaResultV2, CreateDatasetV2, AttachDatasetToApplicationV2, FieldDescMap, DataFieldConfig, data write, dry-run, attach-dataset, infer-result persistence, render-schema, Stage A confirmation
commands: dataset import-url, dataset infer-schema, dataset infer-result, dataset create, dataset ingest, data write, app create, app attach-dataset
---

# Viking Item Onboarding (V2)

## When to Use

Use this skill when the user is operating against the V2 control-plane (`/open/*V2`) and provides a raw item file (JSON / JSONL / CSV) to onboard a dataset (optionally followed by an application). The hallmark of V2 is that schema inference is fully backend-driven: the CLI uploads the file, the backend infers the `Schema` (with `BizAttr` already set on the primary-key / title / URL fields) plus a per-field `FieldDescMap`, and the agent's only jobs are to (a) persist that inference artifact locally, (b) render it for one round of human confirmation, and (c) drive the remaining persistence + ingest steps without re-inventing field decisions.

Do not use this skill when:

- The customer only wants to ingest more rows into an existing dataset (use `vs data write --dataset-id <id> --fields @items.json`).

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
| Submit inference | `vs dataset infer-schema --tos-key <FileKey> --type <item\|video\|user_event\|document\|multi_modal> --industry <e_commerce\|material\|video\|news\|social_platform\|other> --language <zh\|en\|ja> [--name ...] [--theme ...]` | Kick off backend schema inference; returns `TaskID`. **Always pass the snake_case wire value** (e.g. `e_commerce`, not `ecommerce`); the CLI accepts aliases like `ecommerce` for `--industry` only as a courtesy, JSON payloads later require the wire value verbatim. |
| Poll inference | `vs dataset infer-result --task-id <TaskID>` | Poll until `Status=Success`; returns `Schema` + `DataFieldConfig` (the entire inference artifact) |
| Create dataset | `vs dataset create --data @dataset-create.json [--dry-run]` | Persist (or dry-run) the inferred schema. **Do not** flip `IsPK` — backend derives PK from `BizAttr` |
| Write data | `vs data write --dataset-id <DatasetId> --fields @items.json` | Push the actual records into the dataset |
| Create application | `vs app create --name <name> --industry <industry> --language <lang> [--description ...] [--color cyan\|blue\|purple\|pink] [--risk-check] [--dry-run]` | Optional, only when the user asks for app-level setup |
| Attach dataset | `vs app attach-dataset --data @attach.json [--dry-run]` | Optional, links a created dataset to an application. The `DataConfig` block is the `DataFieldConfig` straight out of the persisted infer artifact |

The "All-in-one" shortcut `vs dataset ingest --file <path> --type <type> --industry <industry> [--dry-run]` orchestrates upload + infer-schema + poll + create + write, **without** the Stage A confirmation. In agent mode you should still drive each step individually so you can pause at Stage A.

## Workflow

Run strictly in order. Each step depends on output from the previous one; an inference artifact persisted in step 4 is reused all the way through step 10.

1. **Get upload URL** — `vs dataset import-url --file-name <basename>`. Capture `Result.FileUrl` and `Result.FileKey`. Keep `FileKey` for step 3.
2. **PUT upload** — upload the raw item file to `FileUrl` (e.g. `curl -X PUT --data-binary "@<local-path>" "<FileUrl>"`). Expect HTTP 200 with empty body. Do not add an `Authorization` header — `FileUrl` is already presigned.
3. **Submit inference task** — `vs dataset infer-schema --tos-key <FileKey> --type <item|...> --industry <alias> --language <lang> --name <dataset-name> [--theme "<short biz description>"]`. Capture `Result.TaskId`. Industry aliases follow the snake_case backend rules: `ecommerce`/`e-commerce` → `e_commerce`, `social-platform` → `social_platform`, plus `material`/`video`/`news`/`other`. The CLI converts the alias to the backend-expected snake_case automatically.
4. **Poll inference result + persist locally** — `vs dataset infer-result --task-id <TaskId>` until `Result.Status === "Success"` (poll roughly every 5s, max ~3 minutes). Then write `Result` verbatim to a local artifact file — e.g. `./.viking/item-plans/<dataset-name>/infer-result.json` — so the rest of the workflow can read from it. The persisted object is:

   ```json
   {
     "Status": "Success",
     "Schema":  [ { "Name": "id", "Type": "int64", "BizAttr": "ImagePK", "IsPK": false, "Required": false, "Fields": [], "EnumerateMeta": [] }, ... ],
     "DataFieldConfig": {
       "IndexFields":      ["..."],            // 文本检索字段
       "FilterFields":     ["..."],            // 过滤字段
       "SuggestFields":    ["..."],            // suggest 字段
       "ImageIndexFields": ["..."],            // 图搜字段（可空）
       "VideoIndexFields": ["..."],            // 视频搜索字段（可空）
       "ChatFields":       ["..."],            // 对话/问答字段
       "FilterFieldsMap":  { "enum": {"Fields": [...]}, "id": {...}, "num": {...} },
       "FieldDescMap":     { "id": "...", "name": "...", ... }
     },
     "Error": "",
     "ErrorCode": ""
   }
   ```

   This single artifact is the source-of-truth for every subsequent step. Do **not** regenerate it; do **not** edit `BizAttr` (those drive PK / title / URL detection on the backend). If the user requests semantic edits (e.g. tweak a `FieldDescMap` description, reorder `IndexFields`), edit this file in place and reuse it.

5. **Stage A — Confirmation (mandatory)** — render the persisted artifact for the user **using the CLI's deterministic renderer**, not by hand-assembling markdown from the JSON:

   ```bash
   vs dataset infer-result --task-id <TaskID> --render-schema
   ```

   This emits a fixed Stage-A block (Summary / Fields table / Field Roles / Warnings) that tolerates `Name`/`FieldName`, `Type`/`FieldType`, missing `Required`/`BizAttr`/`Description`, and missing or incomplete `DataFieldConfig`. The output is byte-stable: re-running the same task always produces the exact same table, so the user-visible schema view never drifts between renders.

   - Dataset name (proposed), industry, language, type — print these once above the CLI block.
   - The CLI's `Fields` table has columns `name | type | BizAttr | required | description`.
   - The CLI's `Field Roles` block lists `IndexFields` (text search), `FilterFields`, `SuggestFields`, `ImageIndexFields`, `VideoIndexFields`, `ChatFields`, and `FilterFieldsMap` enum/id/num buckets.
   - The CLI's `Warnings` block flags: missing `FieldDescMap` entries, no PK-class `BizAttr`, empty `IndexFields`, and any role field that references a name absent from the schema.

   Ask exactly one question, e.g. *"以上 schema 与字段角色配置是否符合预期？回复 `yes` 继续，或回复需要修改的字段。"* Only proceed to step 6 after a positive confirmation. If the user requests changes, edit the persisted artifact in place — do not re-run inference, and do not re-format the table yourself. Re-run `vs dataset infer-result --task-id <id> --render-schema` (or feed the edited artifact via `--data @infer-result.json --render-schema`) so the user keeps seeing the same deterministic view.

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

    Print the URLs only for the resources that actually exist in this run (dataset is always present; app/attach are only present if the user opted in). For example, on Volc `cn-beijing`:

    ```
    ✓ 数据集已创建：DatasetId=<DatasetId>
      控制台链接：https://console.volcengine.com/aisearch/platform/region:aisearch-platform+cn-beijing/home/dataset/<DatasetId>

    ✓ 应用已创建并绑定数据集：AppId=<AppId>
      控制台链接：https://console.volcengine.com/aisearch/platform/region:aisearch-platform+cn-beijing/app/<AppId>

    数据需要后台处理后才能查询。请打开上面链接关注数据集 / 应用的「生效状态」（Ready）。
    生效之后即可使用 `vs search`、`vs chat`、`vs recommend` 等运行时接口进行体验。
    ```

    Same shape on BytePlus, with the byteplus URL pattern. The agent must surface this block as the final output of the workflow; do not omit it even if the user has not asked. If only the dataset was created (no app branch), still print the dataset link and the readiness reminder (chat / search will require attaching to an app afterwards).

## Stage A — Confirmation Checklist

Before asking the user to confirm:

1. Print dataset metadata: `Name`, `Type`, `Industry`, `Language`.
2. Print the field table: `name | type | BizAttr | description | required`.
3. Print the `DataFieldConfig` field-role summary side by side: text-search fields, image-search fields, video-search fields, filter fields (and `FilterFieldsMap` enum / id / num buckets), suggest fields, chat fields.
4. Flag anomalies: empty `FieldDescMap` entries, no field with `BizAttr: ImagePK` / `VideoContentID` / `QueryPK` / `MultiModalID` (means backend has no PK to derive), empty `IndexFields`, or empty image/video index fields when the user's goal is image/video search.

Ask exactly one question and wait for `yes` (or per-field corrections). On corrections, edit the persisted `infer-result.json` in place and re-render — do not re-run inference.

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
| `Type` (dataset) | `item` / `video` / `user-event` / `document` / `multi-modal` / `query` | same, snake_case |
| `Type` (field) | `string` / `int32` / `int64` / `float` / `bool` / `array<string>` / `array<int64>` / `array<float>` / `object` / `array<object>` | identical string |

Do not pass numeric codes to any V2 API. The CLI keeps a one-way alias map and an int→string fallback for legacy payloads, but agents should emit strings only.

## Backend-driven Primary Key

In V2, the agent does **not** set the primary key. The backend computes `IsPK` from `BizAttr` (truthy when `BizAttr ∈ {ImagePK, VideoContentID, QueryPK, MultiModalID}`) regardless of the `IsPK` value on the wire. Schema inference already assigns the right `BizAttr`, so:

- Forward the inferred `Schema` to `CreateDatasetV2` verbatim. `IsPK` can stay `false` everywhere.
- Never strip / rewrite `BizAttr`. Doing so will cause the backend's `pkCount==1` check to fail.
- If inference returned no field with a PK-class `BizAttr` (very rare; usually means the input file has no obvious identifier column), surface that to the user in Stage A — they likely need to fix the source data, not patch the schema by hand.

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
2. **Never flip `IsPK`.** Backend derives PK from `BizAttr`. Modifying `IsPK` (or stripping `BizAttr`) on the wire is a code smell and can fail validation.
3. **Never skip Stage A.** Schema persistence (step 6 onward) requires an explicit human "yes" on the inferred schema and field roles.
4. **Always dry-run once.** Run `dataset create --dry-run` before the real create. Surface backend validation errors to the user before retrying.
5. **String enums only.** Pass `Type` and `Industry` as their string values (PascalCase alias accepted on input, snake_case is what the backend expects on wire). Numeric codes will be rejected.
6. **No backtrack flags.** `attach-dataset` (V2) does not accept `BacktrackReq`. If the user needs historical backtrack, treat it as a separate workflow.
7. **Preserve `FieldDescMap` and `DataConfig`.** Forward the inferred `FieldDescMap` to `CreateDatasetV2`, and forward the inferred `DataConfig` verbatim to `AttachDatasetToApplicationV2`. Do not regenerate or strip them locally.
8. **No `Authorization` header on the TOS PUT.** `FileUrl` is presigned; adding auth headers will break the upload.
9. **Always end with the console hand-off block.** The agent's final message in this workflow must include the dataset (and app, if created) console URLs derived from the active profile (`volcengine.com` for Volc, `byteplus.com` for BytePlus) plus a reminder that runtime APIs (`search`, `chat`, recommend) can only be used once the console shows the resource as Ready. Never skip this step — the user has no other clue where to monitor readiness.

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

# 5. Stage A: render & confirm (agent renders the table from $WORK/infer-result.json)

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
