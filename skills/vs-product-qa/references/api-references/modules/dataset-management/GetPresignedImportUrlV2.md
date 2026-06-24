# GetPresignedImportUrlV2

## 接口概览

- 模块分类：Dataset Management
- Service：DashboardServiceV2
- RPC：GetPresignedImportUrlV2
- HTTP Method：`POST`
- Request Path：`/open/GetPresignedImportUrlV2`
- Request Type：`dataset_v2.GetPresignedImportUrlReqV2`
- Response Type：`dataset_v2.GetPresignedImportUrlRespV2`
- Top Action：GetPresignedImportUrlV2
- Top Version：2025-03-01
- Service Path：dashboard_service_v2
- 源定义：`console/idl/handler.proto:1336`

## 接口说明

获取导入文件上传用的 TOS 预签名 URL。

## 请求参数

| 字段路径 | 类型 | 必填 | 位置 | 描述 | 校验/枚举 |
| --- | --- | --- | --- | --- | --- |
| FileName | string | 否 | body | 待上传文件名，支持任意文件类型；服务端会做 basename 提取和安全字符规整。 | - |
| ProjectName | string | 否 | body | 项目名称 | - |

## 请求示例

```json
{
  "FileName": "demo-items.csv",
  "ProjectName": "default"
}
```

## 响应格式说明

| 字段路径 | 类型 | 必填 | 位置 | 描述 | 校验/枚举 |
| --- | --- | --- | --- | --- | --- |
| FileUrl | string | 否 | body | PUT 上传的预签名 URL | - |
| FileKey | string | 否 | body | 上传后提交给后端的对象 key | - |

## 响应示例

```json
{
  "FileUrl": "https://example.com/upload",
  "FileKey": "dataset-import/2103180626/demo-items-abcd1234efgh5678"
}
```

## 错误码说明

| 错误名 | 错误码 | HTTP Code | Message | 说明 |
| --- | --- | --- | --- | --- |
| AccessDenied | AccessDenied | 403 | You are not authorized to perform this action. | 您无权执行此操作。 |
| InternalError | InternalError | 500 | The request has failed due to an unknown error. | 服务内部错误。 |
| InvalidParameter | InvalidParameter | 400 | The specified parameter '{parameter}' is invalid. | 参数不合法。 |

## 备注

- `FileName` 为空时，服务端生成的 key 形如 `dataset-import/{accountID}/{random16}`。
- `FileName` 非空时，服务端会先去掉文件后缀并做安全字符规整，再生成 `dataset-import/{accountID}/{stem}-{random16}`。
