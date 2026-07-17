---
name: vs-crawler
description: "Crawl websites (news, blogs, papers, GitHub, product docs, RSS feeds) into a fixed-schema JSONL file, then create a dataset and a searchable application in Viking AI Search. Supports one-time crawl and scheduled recurring crawl with automatic incremental sync."
category: workflow
applies_to: codex, agents, external-agent
requires_cli: ">=0.2.0"
keywords: web crawler, scheduled crawl, content ingestion, news crawler, blog crawler, paper crawler, github crawler, docs crawler, rss crawler
commands: connector export, connector init, connector run, connector status, connector stop, dataset import-url, dataset infer-schema, dataset infer-result, dataset create, data write, app create, app attach-dataset
---

# Viking Content Crawler

## When to Use

Use this skill when the user wants to crawl content from websites and import it into Viking AI Search to build a searchable knowledge base. This covers news sites, blogs, academic papers, GitHub repositories, product documentation, RSS feeds, and similar web content sources.

The agent writes crawler code tailored to the target sites, outputs data in a fixed JSONL schema, and then hands off to the `vs-item-onboarding` skill for dataset creation and import.

Do not use this skill when:

- The user already has a local file ready to import (use `vs-item-onboarding` directly).
- The user wants to import from a database (use `vs-item-onboarding` directly with MySQL).

## Fixed Schema

All crawled records MUST conform to this schema. Every record is a flat JSON object written as one line in a JSONL file.

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | yes | Unique identifier. Use a SHA-256 hash of the canonical URL, or a source-native stable ID (e.g., arXiv ID, GitHub `owner/repo`). Must be deterministic so re-crawling the same URL produces the same ID. |
| `title` | string | yes | Content title (headline, post title, paper title, repo name, doc page title). |
| `summary` | string | yes | Short abstract or description (100-500 characters recommended). |
| `content` | string | yes | Full text body with HTML stripped to plain text. For GitHub repos, concatenate README content. |
| `category` | string | yes | One of: `news`, `blog`, `paper`, `github`, `docs`, `other`. |
| `source` | string | yes | Canonical URL of the content (source link). |
| `site` | string | no | Human-readable source site name, e.g. `"Hacker News"`, `"arXiv"`, `"Viking Docs"`. |
| `author` | string | no | Author name(s); multiple authors separated by commas. |
| `published_at` | string | no | ISO 8601 datetime, e.g. `"2026-07-16T10:30:00Z"`. Use crawl time if unavailable. |
| `tags` | array\<string\> | no | Tags, keywords, or topics. |
| `language` | string | no | ISO 639-1 code: `"en"`, `"zh"`, `"ja"`, etc. |
| `image_url` | string | no | Cover image or thumbnail URL. |
| `metadata` | object | no | Flexible source-specific key-value data (stars, citations, venue, read_time, etc.). Keep it flat. |

### Example Record

```json
{
  "id": "sha256:abc123...",
  "title": "Introducing Viking AI Search",
  "summary": "Viking AI Search is a new generation of hybrid search engine combining BM25 and vector search...",
  "content": "Full article text with HTML removed and paragraphs separated by newlines...",
  "category": "blog",
  "source": "https://example.com/blog/introducing-viking",
  "site": "Viking Blog",
  "author": "Jane Doe",
  "published_at": "2026-07-15T08:00:00Z",
  "tags": ["search", "vector database", "hybrid search"],
  "language": "en",
  "image_url": "https://example.com/images/cover.jpg",
  "metadata": { "read_time": "8 min" }
}
```

## Preconditions

- `vs` CLI >= 0.2.0 is installed and authenticated (`vs auth status` and `vs doctor` succeed).
- The crawl target is reachable from the execution environment.
- A suitable runtime is available (Python 3.8+ with `requests` and `beautifulsoup4` recommended).

## Commands

This skill delegates dataset creation and import to `vs-item-onboarding`. The crawler workflow itself uses:

| Stage | Action | Purpose |
|---|---|---|
| Crawl | Run agent-written crawler script | Fetch content and write JSONL |
| Onboard | Invoke `vs-item-onboarding` skill | Create dataset, infer schema, import data, optionally start sync |
| Schedule | Set up cron/launchd wrapper | For scheduled mode: periodically re-crawl and append new lines |

## Workflow

Run in strict order.

1. **Confirm crawl mode** — resolve whether the user wants one-time crawl or scheduled recurring crawl. **Only skip the question when the request contains an explicit, unambiguous signal** (apply detection to whatever language the user is writing in):
   - **Explicit one-time**: phrases carrying "once", "one-time", "just this time", or equivalent single-crawl semantics.
   - **Explicit scheduled**: phrases carrying "daily", "scheduled", "keep updated", "auto-crawl", "sync", "incremental", or equivalent recurring semantics.
   - If the request is **neutral** — e.g. "crawl X", bare "crawl", mentions target sites but says nothing about scheduling/once — **you MUST ask the user to choose**. The bare crawl verb is NOT a one-time signal; it is ambiguous. **Never silently default to one-time.**

2. **Identify crawl targets and write the crawler.** Based on the user's target sites, write a crawler script. The crawler MUST:
   - Output records conforming to the Fixed Schema as JSONL (one record per line).
   - Write output to a stable path: `/tmp/viking/crawler/<job-name>/items.jsonl`.
   - For scheduled mode: support incremental crawling — track the last crawl cursor (most recent `published_at` or last seen item IDs) in `/tmp/viking/crawler/<job-name>/state.json` so subsequent runs only fetch new content.
   - Deduplicate by `id` within each run and against previous state.
   - Strip HTML to plain text; never include raw HTML in `content`.
   - Be polite: set a descriptive User-Agent, respect `robots.txt`, add 1-3 second delays between requests, retry transient errors with backoff.
   - Prefer structured sources (RSS/Atom feeds > sitemap.xml > official APIs > HTML scraping).
   - Log per-URL errors and continue; do not abort on single-page failures.
   - Print a summary to stdout: crawled count, new count, output path.

3. **Run the crawler** to produce the initial JSONL file at `/tmp/viking/crawler/<job-name>/items.jsonl`.

4. **Hand off to vs-item-onboarding.** Invoke the `vs-item-onboarding` skill with the following context:
   - Source type: **JSONL file**
   - File path: `/tmp/viking/crawler/<job-name>/items.jsonl`
   - Import mode: **one-time import** if the user chose one-time crawl; **one-time import + ongoing incremental sync** if the user chose scheduled crawl.
   - App creation: **required** — the user wants both a dataset AND an application so the crawled content is immediately searchable. Tell `vs-item-onboarding` to run through app creation and dataset attachment (steps 12–13) rather than stopping after dataset creation.
   - Schema confirmation: **auto-confirm** — the crawler outputs a fixed, well-defined schema (see Fixed Schema above). When `vs-item-onboarding` reaches the Schema Confirmation step (step 7), automatically reply `yes` to proceed without surfacing the confirmation prompt to the user. Only surface it if the backend returns warnings that indicate actual schema problems (e.g. missing PK BizAttr).
   - Readiness: **do NOT block waiting for Ready.** After `vs-item-onboarding` prints its hand-off block with console links, the workflow is complete. Do not run `vs app wait-ready`, do not poll for readiness, do not add any extra waiting steps. The user will check the console themselves.
   - Let `vs-item-onboarding` handle all subsequent steps (schema inference, confirmation, dataset creation, data write, app creation, dataset attach, optional sync start, console hand-off).
   - Do NOT re-implement the onboarding steps yourself — defer entirely to `vs-item-onboarding`.

5. **(Scheduled mode only) Set up recurring crawl + sync.** After `vs-item-onboarding` completes successfully and the dataset is created:
   - The JSONL connector sync (set up by `vs-item-onboarding` during step 4) already watches the JSONL file for new lines and imports them automatically. You do NOT need to separately configure `vs connector init/run` for the file — `vs-item-onboarding` handles this when it chooses the sync path.
   - Create a wrapper script that:
     1. Runs the crawler in incremental mode (using `state.json` to skip already-crawled content), appending new records to `/tmp/viking/crawler/<job-name>/items.jsonl`.
     2. Exits cleanly if no new records are found.
   - Schedule the wrapper script using the platform-appropriate mechanism:
     - **cron** (macOS/Linux): add a crontab entry. Recommended interval: 30 minutes to a few hours depending on how frequently the source updates.
     - **launchd** (macOS): create a LaunchAgent plist with `StartInterval`.
   - Surface the schedule info, log file path, and how to stop/inspect the job in the hand-off.

## Customer Environment Principle

- In customer environments, assume repository source code is unavailable.
- Execute tasks using only the installed skills, the packaged `vs` CLI surface (`--help`, command output, observed runtime behavior), and explicit user-provided information.
- If the installed CLI behavior conflicts with a skill, trust the installed CLI behavior first.

## Constraints

1. **Never write raw HTML into `content`.** Always strip to plain text.
2. **Never hardcode credentials** in crawler code. Use environment variables for API keys.
3. **Always generate a stable `id`** (deterministic hash of URL or source-native ID).
4. **All datetime values MUST be ISO 8601** (e.g., `"2026-07-16T10:30:00Z"`).
5. **All output MUST be valid JSONL**: one JSON object per line, UTF-8 encoded.
6. **The `category` field MUST use the predefined values** (`news`, `blog`, `paper`, `github`, `docs`, `other`).
7. **Dataset creation and import MUST go through `vs-item-onboarding`.** Do not call `vs dataset create`, `vs data write`, etc. directly from this skill.
8. **For scheduled mode, incremental sync is handled by the JSONL file connector** (configured by `vs-item-onboarding`). The scheduled job only needs to run the crawler to append new lines to the JSONL file; the connector daemon picks up new lines automatically.
9. **Respect rate limits and robots.txt.** Add polite delays between requests.
10. **Auto-confirm Schema Confirmation during onboarding.** The crawler produces records against the Fixed Schema defined above, which is stable and well-defined. When handing off to `vs-item-onboarding`, instruct it to automatically reply `yes` at the Schema Confirmation step without surfacing the prompt to the user. Only pause and surface schema details if the backend inference returns genuine errors (e.g. missing primary-key BizAttr) that require user intervention.
11. **Never block waiting for dataset/app readiness.** After `vs-item-onboarding` completes its hand-off (printing console links + readiness reminder), end your turn. Do NOT run `vs app wait-ready`, `vs dataset wait-ready`, or any polling loop to wait for the Ready state. Readiness is an asynchronous backend process; tell the user to check the console links themselves.
12. Before executing any concrete `vs ...` command, first consult `vs-product-qa` to verify the current command surface and required flags.

## Recovery Hints

- Crawler returns zero records → verify target URL/feed accessibility, check for rate limiting (HTTP 429), review error logs.
- Duplicate records appear → verify `id` generation is deterministic (same URL always produces same hash).
- Content extraction produces garbled text → ensure HTTP response encoding is correctly detected.
- Sync is not picking up new lines → verify the JSONL connector daemon is running via `vs connector status --job <job>`.
