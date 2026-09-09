---
name: vs-user-onboarding
title: vs-user-onboarding
description: "Guide a brand-new SearchCLI/vs user from first-time usage questions to sign-up, purchase of Viking AI Search, AK/SK setup, and a working authenticated CLI. Use when the user says they downloaded or installed SearchCLI/vs and asks how to use it, how to start, sign up, buy, or onboard."
category: workflow
applies_to: codex, agents, external-agent
requires_cli: ">=0.2.0"
keywords: new user onboarding, sign up, register, purchase, buy, real-name verification, access key, ak sk, first run, first-time setup, get started, how to use, downloaded searchcli, installed searchcli, searchcli setup, vs setup, just installed vs, viking ai search
commands: auth status, auth login, auth import-env, doctor, skill list, skill show, purchase link, purchase order price, purchase order create, purchase order status
---

# vs-user-onboarding

# AI Search New User Purchase Onboarding

## When to Use

Use this skill when the agent detects that a user needs to complete AI Search purchase / order placement, recover from a missing-auth CLI error, configure local AK/SK, or start using SearchCLI/vs for the first time before continuing with later Viking AI Search workflows.

Common trigger phrases include:

- "I downloaded SearchCLI; how do I use it?"
- "I just installed vs; how do I get started?"
- "我下载了 SearchCLI，帮我看一下如何使用"
- "我刚装了 vs，怎么开始用"
- "我没有火山引擎账号，要怎么开始"
- "帮我接入 / 购买 Viking AI Search"

The agent must route the user to the right entry point, guide account registration and real-name verification as human checkpoints, help the user create AK/SK and configure the CLI, place the billing order through `vs purchase order create` after the user confirms a price quote, then query the current order status once. Order placement and status checks require local AK/SK; account registration, real-name verification, and AK/SK creation cannot be automated.

## Entry Paths

Choose one entry path before running the workflow, but always start the skill by running `vs auth status --json` so returning users are not forced through registration again.

| Entry path | Trigger | Start point |
|---|---|---|
| New-user purchase | The user asks to place an order, purchase, activate, open AI Search, or says they are in a new-user registration conversion flow | Step 1, then Step 2 for stage routing (A/B -> Steps 3-6) |
| Purchased but not configured | The user says they have purchased and needs AK/SK or local CLI setup | Step 4 |
| Missing-auth CLI recovery | A credential-required command fails with the CLI recovery message below | Use the recovery routing rules, then continue at Step 3, Step 5, or Step 6 |

Credential-required commands include product and runtime commands such as `vs item ...`, `vs search run`, `vs app ...`, `vs dataset ...`, `vs recommend ...`, `vs purchase order price`, `vs purchase order create`, and `vs purchase order status`.

The CLI missing-auth recovery message is:

```text
You are not authenticated. To get started:
- If you already have AK/SK: run `vs auth login` or `vs auth import-env`.
- If you are new to Viking AI Search: run `vs skill show vs-user-onboarding`.
```

Recovery routing:

- If the user already has AK/SK, guide them to `vs auth login` or `vs auth import-env` (Step 5), then check status at Step 6.
- If the user is new to Viking AI Search, continue at Step 2.
- If the user is unsure whether they purchased the product, continue at Step 2 and conservatively treat "not sure if bought" as not purchased.

## Version Check

Before starting this skill workflow, run `vs version check --json`. Continue only when `status` is `up-to-date`. If `status` is `update-available`, stop and tell the user to update the cloned `vs` repository, then run `git pull --ff-only`, `bash ./scripts/install.sh`, and `bash ./scripts/install-skills.sh all --target auto --force` (PowerShell: `scripts/install.ps1` and `scripts/install-skills.ps1`). If the status is `unknown`, stop and report that the CLI version could not be verified.

## Preconditions

- The user is in the new-user registration conversion flow.
- The agent can ask the user which region/environment they use and must wait for explicit user confirmation at every human checkpoint.
- The agent places billing orders through the CLI (`vs purchase order create`) only after the user confirms the price quote from `vs purchase order price`, then calls `vs purchase order status` once. Account registration, real-name verification, and AK/SK creation remain human checkpoints the agent must not automate.
- `vs` CLI is installed. Order placement and order visibility checks require configured local AK/SK because the console OpenAPI is signed. Account registration and real-name verification happen on the console web page before AK/SK can be created.

## Commands

- `purchase order price`: quote a purchase/renew/modify price through the console OpenAPI without creating an order; requires local AK/SK.
- `purchase order create`: create a billing order through the console OpenAPI; requires local AK/SK.
- `purchase order status`: check once whether the billing instance is visible; requires local AK/SK.
- `purchase link`: fallback flow that prints the console web purchase page link and does not require AK/SK; use when the user prefers the web page or a plan-eligibility error must be handled on the console.
- `auth status`: inspect local auth and, when AK/SK exists, classify readiness through the purchase order status path.
- `doctor`: inspect local CLI environment if command execution fails before reaching the service.

## Workflow

### Step 1: Detect current authentication state
 
Always run `vs auth status --json` first and inspect the result. In CLI versions that expose structured status, this command first checks whether local AK/SK is configured; when AK/SK exists, it uses the same backend path as `vs purchase order status` to verify that the Viking AI Search billing instance is visible and healthy.
 
- **Authenticated and product enabled** (`status: "ok"`) -> run `vs doctor --json`; if it passes, go directly to Step 7 (early exit; do not force a returning user through registration again). A post-paid instance (including the free post-paid tier) also reports as enabled here, so do not push a post-paid user back through the purchase flow.
- **`reason: "unconfigured"`** -> go to Step 2; if the user already has AK/SK, Step 2 routes to Step 5.
- **`reason: "invalid"`** -> go to Step 5 and ask the user to reconfigure valid AK/SK.
- **`reason: "product-not-enabled"`** -> credentials are valid but the product is not purchased; go to Step 2. A user who already has an account and AK/SK routes as option B and proceeds to order placement (Step 6).
- **`reason: "network-error"`** -> ask the user to fix connectivity or endpoint configuration before continuing; do not start registration unless the user confirms they are a new buyer.
 
> If the CLI version exposes structured failure reasons (`unconfigured`,
> `invalid`, `product-not-enabled`, `network-error`), use them to skip steps
> where possible (e.g., `product-not-enabled` with valid credentials means
> registration and real-name verification are likely already done; after the
> Step 2 routing confirms option B, proceed to AK/SK setup and CLI ordering).
> If the CLI only reports "authenticated / not authenticated", proceed to
> Step 2's question.
 
### Step 2: Ask the user which state they are in (Stage A confirmation)
 
Present this exact table to the user and ask them to pick one option. Do not show
the internal next-step routing to the user.
 
| Option | Your state                                          |
|--------|-----------------------------------------------------|
| A      | I don't have a Volcengine account yet               |
| B      | I have an account but haven't purchased Viking AI Search |
| C      | I've already purchased; I need to get my AK/SK       |
| D      | I already have AK/SK, just need to configure the CLI |

Internal routing after the user answers:

- A -> Step 3 (register and verify), then Steps 4-6
- B -> Step 4 (create AK/SK), then Steps 5-6
- C -> Step 4 (create AK/SK), then Steps 5-6
- D -> Step 5 (configure the CLI), then Step 6
 
**Confirmation contract**: the user must reply with the option letter or its
plain equivalent ("A", "option A", "I don't have an account"). Free-text replies
that don't clearly map to an option require re-asking. If the user is unsure
("I'm not sure if I bought it"), conservatively pick the earlier option (treat
"not sure if bought" as B, not C).

### Step 3 - account registration and real-name verification (entry path A only)

For users without a Volcengine/BytePlus account (option A), registration and real-name verification happen on the console web page. There is no CLI/API for them, so this is a human checkpoint and the agent must not operate the console for the user.

1. Send the user to the official console registration page matching the environment they will use (Volcano Engine for `volcano-cn-beijing` / `volcano-ap-southeast-1`, BytePlus for `byteplus-ap-southeast-1`).
2. Tell the user to complete real-name verification. Some plans have eligibility constraints visible only during ordering, e.g. the free trial requires an enterprise account and the first-month trial requires verification status.
3. Wait until the user explicitly confirms registration and verification are complete, then continue at Step 4.

Entry path B users (already have an account) skip this step and start at Step 4.

### Step 4 - create AK/SK (entry paths A, B, and C)

Ask the user this exact question: `Are you signed in as a root account or a sub-account?`

- **Root account**: send the key management link `https://console.volcengine.com/iam/keymanage`, then ask the user to create or retrieve AK/SK there. Tell the user not to paste AK/SK into chat.
- **Sub-account or unsure**: explain that sub-accounts usually cannot create AK/SK. The user must contact the enterprise administrator, and the administrator should create and assign the access key from the key management page. Wait until the user confirms that AK/SK is available; do not attempt privilege escalation or any bypass.

This is a human checkpoint. The agent must wait for explicit confirmation that the user has AK/SK available before moving to Step 5. Entry path D users (already have AK/SK) skip to Step 5.

### Step 5 - configure local credentials

Use only the supported CLI credential flows. Never ask the user to paste AK/SK into chat.

1. If `VIKING_AK` and `VIKING_SK` are already set in the user's real shell, ask the user to run `vs auth import-env`; otherwise, if the user has an interactive terminal, ask the user to run `vs auth login`.
2. During region selection, explicitly tell the user:
   - Mainland China customers should choose `cn-beijing`.
   - Southeast Asia customers, including Indonesia, Singapore, and Malaysia, should choose `ap-southeast-1` (Johor).
   - BytePlus customers should choose the BytePlus environment endpoints.
   - The user chooses the region; the agent must not silently choose it. The region determines the billing environment and currency (CNY for China regions, USD otherwise), so it must match the account used for purchase.
3. The project defaults to `default`. If the user places the order under another project, pass `--project-name <project-name>` on the order commands and later verification commands.
4. After credentials are configured, entry paths A and B continue to Step 6 to place the order; entry paths C and D continue to Step 6 for a direct status check.

### Step 6 - create order and query status

Order placement and status checks call the console OpenAPI, so they require the AK/SK configured in Step 5. Entry paths C and D skip items 1-6 and run the status check in item 7 below.

1. Before presenting the plan-selection table, query the current one-month standard-plan price:

   ```bash
   vs purchase order price \
     --scene purchase \
     --configuration-code ai_search_standard_monthly \
     --purchase-months 1
   ```

   Read `Result.PayableAmount` and `Result.Currency` from the response. Use the result to render the Standard plan's one-month price in the table. Do not show a placeholder or reuse a previous quote. If the query fails, report the error and do not present a stale price.

   Render the following numbered Markdown table. Translate the visible plan names and descriptions to the user's language, but keep `ConfigurationCode` values verbatim:

   | # | Plan | `ConfigurationCode` | One-month price | Description |
   |---:|---|---|---|---|
   | 1 | Post-paid | `ai_search_post_paid` | Usage-based | Usage-based pricing, unlimited applications, LLM-generated index configuration, and usage-based billing for search, chat, and recommendation APIs. |
   | 2 | Standard | `ai_search_standard_monthly` | `<PayableAmount> <Currency>` | Larger data capacity, 20 applications, 50 datasets, 2 VSU storage, 10 VPU data processing, 5 VRU API calls, and 10 vaka Knowledge Assistant seats. |

2. Ask the user to reply with plan option `1` or `2`. Do not ask for a free-form plan name.

3. If the user selects Standard, render a second numbered Markdown table for the purchase period:

   | # | Purchase period | `--purchase-months` |
   |---:|---|---:|
   | 1 | 1 month | 1 |
   | 2 | 3 months | 3 |
   | 3 | 12 months | 12 |

   Ask the user to reply with period option `1`, `2`, or `3`, then render a separate numbered table for auto-renew:

   | # | Auto-renew | Order flag |
   |---:|---|---|
   | 1 | Enable | `--auto-renew` |
   | 2 | Disable | Omit `--auto-renew` |

   Ask the user to reply with auto-renew option `1` or `2`. If the user selects Post-paid, skip both tables and omit `--purchase-months`.

4. After the plan and purchase period are selected, query the final purchase price before asking for purchase confirmation:
   `vs purchase order price --scene purchase --configuration-code <configuration-code> [--purchase-months <n>] [--project-name <project-name>]`
   - For the standard monthly plan, use the selected period-table value as `--purchase-months <n>`.
   - For post-paid, omit `--purchase-months`.
   - Treat the response's `PayableAmount` and `Currency` (`CNY` or `USD`) as the source of truth.
   - Render the final amount, currency, purchase period, selected plan, and auto-renew setting in a Markdown summary table.

5. Render a numbered Markdown confirmation table and ask the user to reply with option `1` or `2`:

   | # | Action |
   |---:|---|
   | 1 | Confirm |
   | 2 | Cancel |

   Do not create the order before the user selects option `1`.
6. Create the order:
   `vs purchase order create --scene purchase --configuration-code <configuration-code> [--purchase-months <n>] [--auto-renew] [--project-name <project-name>]`
   - `--client-token` is auto-generated for idempotency; if the command fails and must be retried for the same intended purchase, reuse the same client token so the order is not duplicated.
7. Immediately run:
   `vs purchase order status [--project-name <project-name>]`
   - enabled: continue to Step 7;
   - `unconfigured` or `invalid`: return to Step 5;
   - `product-not-enabled` or another non-enabled state: report the returned status and stop. Do not call `purchase order wait` or add a polling loop;
   - network or other errors: surface the exact error.
8. Fallback: if order creation returns a plan-eligibility error that must be handled on the console web page, run `vs purchase link --environment-id <environment-id>` and let the user finish there.

### Step 7 - hand off to data onboarding

Tell the user that authentication is complete and they can continue with `vs-item-onboarding` for data ingestion and their first search experience. End this workflow after the handoff.

## Constraints

- Always respond in the language used by the user who asked the question. Use that language for explanations, questions, confirmation requests, error messages, and handoff instructions.
- This purchase workflow must use numbered Markdown tables for plan selection, Standard purchase periods, auto-renew, and final confirmation. Ask the user to reply with the table option number at each checkpoint. Do not use interactive cards, dense combined paragraphs, or free-form plan names.
- Before executing any concrete `vs ...` command in this onboarding and purchase workflow, first consult `vs-product-qa` to verify the current command surface, required flags, payload fields, input format, and allowed values. Only after that check may you finalize parameters and run the command.
- Always start with `vs auth status --json`; if it reports authenticated and `vs doctor --json` passes, early-exit to Step 7.
- Do not run `purchase order price`, `purchase order create`, or `purchase order status` before local AK/SK is configured. Create an order only after the user confirms the current price quote, then query status once.
- Account registration, real-name verification, and AK/SK creation are human checkpoints. Never operate the console for the user; credential setup uses only `vs auth import-env` or `vs auth login`.
- Do not call `purchase order wait` or add a polling loop. Reuse the same client token when retrying the same intended purchase.
- Never ask the user to paste secrets, payment credentials, or identity documents into chat. For a sub-account that cannot create keys, direct the user to the enterprise administrator; do not escalate or bypass permissions.
- Use `vs purchase link --environment-id <environment-id>` only as the fallback web flow. Never hardcode the URL; supported environment IDs are `volcano-cn-beijing`, `volcano-ap-southeast-1`, and `byteplus-ap-southeast-1`.
- If a purchase/onboarding failure or user follow-up turns into a product concept, capability, API field, console UI path, purchase, billing, or general troubleshooting question outside this purchase workflow, temporarily hand off to `vs-product-qa`; after that answer, return to this workflow only if the user still wants to continue purchasing.
