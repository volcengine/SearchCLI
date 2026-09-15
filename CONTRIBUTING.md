# Contributing to SearchCLI

Thanks for contributing.

This repository is the public CLI and skill surface for Viking AI Search on Volcengine. Keep changes focused on the public product surface:

- `vs` CLI commands for auth, onboarding, app and dataset operations, and runtime verification
- public `Viking skills`
- documentation and examples for the public workflow

Do not widen the public surface casually. If a feature is not meant to be part of the public product, keep it out of this repository.

## Before You Start

Before opening a pull request:

1. Make sure the change belongs in the public repository.
2. Keep the PR focused on one problem or one feature.
3. Update user-facing docs when behavior or commands change.
4. If the change affects skills, update the corresponding `SKILL.md`.

## Contributor License Agreement (CLA)

Before we can accept a pull request, contributors must sign the Contributor License Agreement (CLA).

- If your pull request triggers a CLA check, open the link shown in the PR status or comment.
- Review the agreement and complete the signature flow with your GitHub account.
- You only need to sign once. Later pull requests from the same account do not require repeating the process.

If the CLA check is missing or looks incorrect, mention it in the pull request so a maintainer can investigate.

## Development Setup

Requirements:

- Node.js 20 or newer
- `git`

Clone and install:

```bash
git clone <public-repo-url> viking_cli
cd viking_cli
npm install
```

## Local Checks

Run these before opening a PR:

```bash
npm run validate:skills
npm run build
npm run test:acceptance:dist
```

If you changed binary packaging behavior, also run:

```bash
npm run test:acceptance:binary
```

## Skills

This repository treats skills as first-class product assets.

Common local workflows:

```bash
vs skill list
vs skill init viking-demo-skill
vs skill validate
vs skill install all
```

When editing a skill:

- keep the skill aligned with the current public CLI
- avoid referencing deleted or hidden commands
- prefer product language over backend implementation language
- keep onboarding instructions safe for external agents

## Pull Request Guidelines

- Keep PRs small and reviewable.
- Explain the user-facing impact.
- Include doc updates for any command, help, skill, or onboarding change.
- Do not mix unrelated cleanup with feature work.
- Prefer deleting dead public-code paths over keeping hidden, unused branches.

## Public Surface Discipline

This repository should stay focused on the public product. Be careful when adding:

- experimental or draft command groups
- product-specific debug surfaces that are not part of the supported CLI
- hidden command paths that are no longer referenced by docs or skills
- skill content that depends on local machine paths or private datasets

If a capability is being promoted into the public product, add it deliberately with command help, docs, skill updates, and acceptance coverage.
