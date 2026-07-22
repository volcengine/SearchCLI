# Worked Example (verified end-to-end)

Input: `/path/to/goods.jsonl` (10 apparel items, `product_id` string, `name`/`category`/`brand`/`color`/`size`/`material`/`style` strings or string arrays, `price`/`originalPrice`/`rating` floats, `stock`/`sales` ints, `image_url`/`description` strings). Backend inference correctly assigns `BizAttr: "MultiModalId"` to `product_id`, `BizAttr: "MultiModalTitle"` to `name`, `BizAttr: "MultiModalImageUrl"` to `image_url`, etc.

```bash
WORK=./.viking/item-plans/goods_demo

# 1. Upload URL
vs dataset import-url --file-name goods.jsonl > $WORK/01_import_url.json
FILE_KEY=$(jq -r '.Result.FileKey' $WORK/01_import_url.json)
FILE_URL=$(jq -r '.Result.FileUrl' $WORK/01_import_url.json)

# 2. PUT upload (no auth header)
curl -sS -X PUT --data-binary "@/path/to/goods.jsonl" "$FILE_URL"

# 3. Submit inference (multi_modal + e_commerce theme)
vs dataset infer-schema --tos-key "$FILE_KEY" --type multi_modal \
  --theme e_commerce --language zh --name goods_demo \
  > $WORK/02_infer_schema.json
TASK_ID=$(jq -r '.Result.TaskId' $WORK/02_infer_schema.json)

# 4. Poll + persist (repeat until Status=Success)
vs dataset infer-result --task-id "$TASK_ID" > $WORK/03_infer_result.json
jq '.Result' $WORK/03_infer_result.json > $WORK/infer-result.json  # ← persistent source of truth

# 5. Schema Confirmation: render with validate-schema, then confirm
#    (agent must surface the CLI output verbatim and wait for user `yes`)
vs dataset validate-schema --input $WORK/infer-result.json --dataset-type multi_modal

# 6. Build dataset-create.json from the persisted artifact and dry-run
#    NB: Theme must be the wire value "e_commerce", not "ecommerce".
jq '{
  Name: "goods_demo",
  Type: "multi_modal",
  Description: "Goods demo dataset",
  Language: "zh",
  Theme: "e_commerce",
  Schema: .Schema,
  FieldDescMap: .DataFieldConfig.FieldDescMap
}' $WORK/infer-result.json > $WORK/dataset-create.json
vs dataset create --data @$WORK/dataset-create.json --dry-run

# 7. Real create
vs dataset create --data @$WORK/dataset-create.json > $WORK/04_create.json
DATASET_ID=$(jq -r '.Result.Dataset.Id' $WORK/04_create.json)

# 8. Write data
vs data write --dataset-id "$DATASET_ID" --fields @/path/to/items.json

# 9. Optional: create app
vs app create --name goods_app --description "..." --language zh > $WORK/05_app.json
APP_ID=$(jq -r '.Result.Application.Id' $WORK/05_app.json)

# 10. Optional: attach — DataConfig comes verbatim from the persisted artifact
jq --arg app "$APP_ID" --arg ds "$DATASET_ID" '{
  ApplicationId: $app,
  DatasetId:     $ds,
  DataConfig:    .DataFieldConfig
}' $WORK/infer-result.json > $WORK/attach.json
vs app attach-dataset --data @$WORK/attach.json
```

Notice how `dataset-create.json`'s `Schema` is a verbatim copy from `infer-result.json` (no `IsPK` rewrites — the backend derives PK from `BizAttr`), and `attach.json`'s `DataConfig` is the entire `DataFieldConfig` block — the text-search fields, image-search fields, filter fields, etc. all flow through unchanged. That's the V2 contract.
