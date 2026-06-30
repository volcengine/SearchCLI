# Delegation Matrix

Use this matrix when the user's request is better handled by a specialized skill.

| Topic | Hand off to |
|---|---|
| Sign-up / purchase / pay / first AK/SK | `vs-user-onboarding` |
| Item data ingestion / dataset creation | `vs-item-onboarding` |
| Search tuning suggestions / tuning execution / interpreting tuning output | `vs-search-tuning` |
| Search runtime checks | `vs-search` |
| Chat runtime checks | `vs-chat` |
| Recommendation runtime checks | `vs-recommend` |

When delegating:

1. Briefly say which skill takes over and why.
2. Stop the `vs-product-qa` answer.
3. Do not continue with speculative product advice after delegation.
