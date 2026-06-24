---
name: vs-user-onboarding
title: vs-user-onboarding
description: "Guide a brand-new SearchCLI/vs user from first-time usage questions to sign-up, purchase of Viking AI Search, AK/SK setup, and a working authenticated CLI. Use when the user says they downloaded or installed SearchCLI/vs and asks how to use it, how to start, sign up, buy, or onboard."
category: workflow
applies_to: codex, agents, external-agent
requires_cli: ">=0.2.0"
keywords: onboarding, sign up, signup, register, purchase, buy, real-name, real name, access key, AK SK, first run, get started, first-time use, first time setup, how to use, start using, downloaded searchcli, installed searchcli, searchcli setup, search cli setup, just installed vs, viking ai search, 下载了searchcli, 安装了searchcli, 如何使用, 怎么使用, 怎么开始用, 刚装了vs, 刚安装vs, 我下载了searchcli，帮我看一下如何使用, 我下载了 searchcli，帮我看一下如何使用, 我下载了 searchcli， 帮我看一下如何使用
commands: auth status, auth login, auth import-env, doctor, skill list, skill show, purchase link, purchase order status, purchase order wait
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

The agent must route the user to the right entry point, guide the user through the console purchase page when needed, wait for explicit purchase completion, handle the root-account/sub-account key checkpoint, and then guide AK/SK creation or local CLI readiness. Order visibility checks are available only when local AK/SK already exists.

## Entry Paths

Choose one entry path before running the workflow, but always start the skill by running `vs auth status --json` so returning users are not forced through registration again.

| Entry path | Trigger | Start point |
|---|---|---|
| New-user purchase | The user asks to place an order, purchase, activate, open AI Search, or says they are in a new-user registration conversion flow | Step 1, then Step 2 or Step 3 based on auth status |
| Purchased but not configured | The user says they have purchased and needs AK/SK or local CLI setup | Step 5 |
| Missing-auth CLI recovery | A credential-required command fails with the CLI recovery message below | Use the recovery routing rules, then continue at Step 2, Step 5, or Step 6 |

Credential-required commands include product and runtime commands such as `vs item ...`, `vs search run`, `vs app ...`, `vs dataset ...`, `vs recommend ...`, and `vs purchase order wait`.

The CLI missing-auth recovery message is:

```text
You are not authenticated. To get started:
- If you already have AK/SK: run `vs auth login` or `vs auth import-env`.
- If you are new to Viking AI Search: run `vs skill show vs-user-onboarding`.
```

Recovery routing:

- If the user already has AK/SK, guide them to `vs auth login` or `vs auth import-env`, then continue at Step 6.
- If the user is new to Viking AI Search, continue at Step 2.
- If the user is unsure whether they purchased the product, continue at Step 2 and conservatively treat "not sure if bought" as not purchased.

## Preconditions

- The user is in the new-user registration conversion flow.
- The agent can ask the user which supported environment they are in and wait for explicit user confirmation.
- The user completes the actual purchase on the console web page; the agent does not create an order programmatically.
- `vs` CLI is installed. Purchase link retrieval does not require local AK/SK authentication. Order visibility checks require configured local AK/SK and are optional for this workflow unless the user already has credentials.

## Commands

- `purchase link`: print the onboarding purchase page link for the user's selected environment.
- `purchase order status`: check once whether the onboarding purchase order or billing instance is visible; requires local AK/SK.
- `purchase order wait`: wait until the onboarding purchase order is visible; requires local AK/SK and retries every 2 seconds, up to 5 attempts.
- `auth status`: inspect local auth and, when AK/SK exists, classify readiness through the purchase order status path.
- `doctor`: inspect local CLI environment if command execution fails before reaching the service.

## Workflow

### Step 1: Detect current authentication state
 
Always run `vs auth status --json` first and inspect the result. In CLI versions that expose structured status, this command first checks whether local AK/SK is configured; when AK/SK exists, it uses the same backend path as `vs purchase order status` to verify that the Viking AI Search billing instance is visible and healthy.
 
- **Authenticated and product enabled** (`status: "ok"`) -> run `vs doctor --json`; if it passes, go directly to Step 8 (early exit; do not force a returning user through registration again).
- **`reason: "unconfigured"`** -> go to Step 2; if the user already has AK/SK, Step 2 routes to Step 6.
- **`reason: "invalid"`** -> go to Step 6 and ask the user to reconfigure valid AK/SK.
- **`reason: "product-not-enabled"`** -> go to Step 3 because credentials may be valid but `purchase order status` cannot confirm a visible, enabled billing instance.
- **`reason: "network-error"`** -> ask the user to fix connectivity or endpoint configuration before continuing; do not start registration unless the user confirms they are a new buyer.
 
> If the CLI version exposes structured failure reasons (`unconfigured`,
> `invalid`, `product-not-enabled`, `network-error`), use them to skip steps
> where possible (e.g., `product-not-enabled` → skip account registration and
> jump to Step 3 with the purchase-page deeplink). If the CLI only reports
> "authenticated / not authenticated", proceed to Step 2's question.
 
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

- A or B -> Step 3
- C -> Step 5
- D -> Step 6
 
**Confirmation contract**: the user must reply with the option letter or its
plain equivalent ("A", "option A", "I don't have an account"). Free-text replies
that don't clearly map to an option require re-asking. If the user is unsure
("I'm not sure if I bought it"), conservatively pick the earlier option (treat
"not sure if bought" as B, not C).

### Step 3 and Step 4 - deliver purchase deep link and wait for purchase

1. Ask the user to choose exactly one supported environment:
   - `volcano-cn-beijing`
   - `volcano-ap-southeast-1`
   - `byteplus-ap-southeast-1`
2. After the user chooses an environment, run `vs purchase link --environment-id <environment-id>` and show the returned purchase page link.
3. Do not hardcode or rewrite the purchase page link in the agent response; use the command output as the source of truth.
4. Show this instruction together with the URL:
   `On the order page, complete: choose edition -> real-name verification (opened in-page; skipped if already verified) -> payment. Pay attention to the project selector on the order page; it usually defaults to default. After finishing, reply that the purchase is complete.`
   Use the term `项目` instead of `project` when the user's latest message is Chinese.
5. Wait for the user to clearly say that the purchase is complete, using wording such as `purchase completed`, `payment completed`, `order placed`, or `activation completed`.
6. Do not treat vague replies such as `ok`, `opened`, `I will check`, or `I am on the page` as purchase completion.
7. After the user explicitly confirms purchase completion, ask which project was selected on the order page. Use the term `项目` when the user's latest message is Chinese; otherwise use `project`.
8. Use a single question only. Do not ask a second follow-up input question for project name. The question should offer:
   - `default`
   - another-project free-text answer, where the user directly enters the exact project name in the same question
9. If the user selects `default`, or leaves the free-text answer empty, set `<project-name>` to `default`.
10. If the user enters another project name, use that exact value as `<project-name>` for later order checks and local verification.

### Optional order visibility check

This is an optional enhancement when local AK/SK already exists. It is not the gate for a brand-new user to proceed to AK/SK creation. If Step 1 already returned `status: "ok"`, the order/billing instance has already been verified through the purchase order status path and this check can be skipped unless the user asks for an explicit wait.

1. After the user explicitly confirms purchase completion, run this check only if the user already has AK/SK configured and Step 1 did not already return `status: "ok"`.
2. Run:
   `vs purchase order wait --project-name <project-name> --max-attempts 5 --poll-interval-ms 2000`
3. Interpret the command result as the source of truth for whether the order is visible:
   - success: the order is visible; continue to Step 5
   - not found during polling: the CLI retries every 2 seconds, up to 5 attempts
   - timeout after 5 attempts: report that order visibility is not confirmed; ask the user to re-check the console order page if they want to continue
   - any non-retryable error: surface the exact error and continue with the human checkpoint flow only if the user still confirms purchase completion
   - failed order / failed instance state: tell the user the order appears failed, then return to the purchase deep-link step
4. If local AK/SK is missing, skip this optional check and continue to Step 5 after the user's explicit purchase-complete confirmation. Do not ask the user for AK/SK in chat just to run this check.

### Step 5 - guide AK/SK creation

Ask the user this exact question: `Are you signed in as a root account or a sub-account?`

- **Root account**: send the key management link `https://console.volcengine.com/iam/keymanage`, then ask the user to create or retrieve AK/SK there. Tell the user not to paste AK/SK into chat.
- **Sub-account or unsure**: explain that sub-accounts usually cannot create AK/SK. The user must contact the enterprise administrator, and the administrator should create and assign the access key from the key management page. Wait until the user confirms that AK/SK is available; do not attempt privilege escalation or any bypass.

This is a human checkpoint. The agent must wait for explicit confirmation that the user has AK/SK available before moving to Step 6.

### Step 6 - configure local credentials

Use only the supported CLI credential flows. Never ask the user to paste AK/SK into chat.

1. Build the auth command with the project selected during Step 3/4:
   - if `<project-name>` is `default`, the command may omit `--project-name`
   - if `<project-name>` is not `default`, the command must include `--project-name <project-name>`
2. If `VIKING_AK` and `VIKING_SK` are already set in the user's real shell, ask the user to run:
   - default project: `vs auth import-env`
   - non-default project: `vs auth import-env --project-name <project-name>`
3. Otherwise, if the user has an interactive terminal, ask the user to run:
   - default project: `vs auth login`
   - non-default project: `vs auth login --project-name <project-name>`
4. During region selection, explicitly tell the user:
   - Mainland China customers should choose `cn-beijing`.
   - Southeast Asia customers, including Indonesia, Singapore, and Malaysia, should choose `ap-southeast-1` (Johor).
   - The user chooses the region; the agent must not silently choose it.

### Step 7 - verify local readiness

After credentials are imported, run `vs auth status --json --project-name <project-name>` and `vs doctor --json --project-name <project-name>`.

- If both pass, authentication is complete.
- If `vs auth status --json --project-name <project-name>` reports `unconfigured` or `invalid`, return to Step 6.
- If it reports `product-not-enabled`, return to Step 3 and ask the user to confirm purchase/opening status.
- If it reports `network-error`, ask the user to fix connectivity or endpoint settings and retry Step 7.

### Step 8 - hand off to data onboarding

Tell the user that authentication is complete and they can continue with `vs-item-onboarding` for data ingestion and their first search experience. End this workflow after the handoff.

## Order Verification Behavior

- `purchase order wait --project-name <project-name>` exists so the agent can wait for order visibility when local AK/SK is already configured but `vs auth status --json --project-name <project-name>` still reports `product-not-enabled`.
- If the order is not found, `purchase order wait` retries every 2 seconds.
- If the order is still not found after 5 attempts, report order creation failure.
- If the command returns any non-retryable error, do not keep retrying; show the error to the user.
- If the returned order indicates failure, tell the user that the order exists but failed.
- On failed order state, show the purchase URL again and ask the user to confirm whether the page-side purchase succeeded.

## Constraints

- Before executing any concrete `vs ...` command in this onboarding and purchase workflow, first consult `vs-product-qa` to verify the current command surface, required flags, payload fields, input format, and allowed values. Only after that check may you finalize parameters and run the command.
- Always start with `vs auth status --json`; if it reports authenticated and `vs doctor --json` passes, early-exit to Step 8.
- Do not create an order programmatically; the user must purchase through the console page.
- Registration, real-name verification, payment, and key creation are always human checkpoints. The agent must wait for explicit user confirmation before moving past each checkpoint.
- Do not treat account registration, real-name verification, payment, or key creation as automatable CLI steps. Do not operate the console for the user.
- Do not proceed to AK/SK creation until the user explicitly says purchase/payment is complete. The optional order visibility check is not required for brand-new users who do not yet have AK/SK.
- Do not run `purchase order status` or `purchase order wait` without local AK/SK authentication.
- Do not accept vague replies like `ok`, `opened`, `I see it`, or `I entered the page` as purchase completion.
- Do not implement extra retry loops in the agent; the CLI command owns the polling behavior.
- Do not ask the user to paste AK/SK, SK, API keys, payment credentials, or identity documents into chat.
- If a sub-account cannot create keys, only instruct the user to contact the enterprise administrator. Do not attempt privilege escalation or permission bypass.
- Credential setup must use only `vs auth import-env` or `vs auth login`.
- If optional order verification times out or fails, report the failure and ask the user to confirm the console-side purchase state.
- Always obtain the purchase URL from `vs purchase link --environment-id <environment-id>`; do not hardcode the URL in the skill workflow or agent response.
- Treat the purchase link as product-owner maintained configuration exposed by the CLI. The actual console redirect may evolve, so tell users to follow the console's current page flow.
- Only the following environment ids are supported for purchase link selection: `volcano-cn-beijing`, `volcano-ap-southeast-1`, and `byteplus-ap-southeast-1`.
- If a purchase/onboarding failure or user follow-up turns into a product concept, capability, API field, console UI path, purchase, billing, or general troubleshooting question outside this purchase workflow, temporarily hand off to `vs-product-qa`; after that answer, return to this workflow only if the user still wants to continue purchasing.
