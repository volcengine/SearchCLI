#!/usr/bin/env bash

# Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
# SPDX-License-Identifier: Apache-2.0

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
SKILLS_ROOT="${REPO_ROOT}/skills"

TARGET_MODE="auto"
FORCE=0
DEST=""
MODE="install"
declare -a REQUESTED=()

log() {
  printf '[viking-skills] %s\n' "$*"
}

fail() {
  printf '[viking-skills] ERROR: %s\n' "$*" >&2
  exit 1
}

usage() {
  cat <<'EOF'
USAGE
  bash ./scripts/install-skills.sh list
  bash ./scripts/install-skills.sh all [--target auto|codex|agents|both|trae|trae-cn] [--dest <dir>] [--force]
  bash ./scripts/install-skills.sh <skill-name> [<skill-name> ...] [--target auto|codex|agents|both|trae|trae-cn] [--dest <dir>] [--force]

DESCRIPTION
  Install repository skills into local agent skill directories.

DEFAULT TARGETS
  auto    install to ~/.codex/skills and/or ~/.agents/skills when those homes exist;
          if neither exists, default to ~/.codex/skills
  codex   install to $CODEX_HOME/skills or ~/.codex/skills
  agents  install to $AGENTS_HOME/skills or ~/.agents/skills
  both    install to both directories
  trae    install to $TRAE_HOME/skills or ~/.trae/skills
  trae-cn install to $TRAE_CN_HOME/skills or ~/.trae-cn/skills
EOF
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    fail "Command not found: $1"
  fi
}

parse_args() {
  while (($# > 0)); do
    case "$1" in
      list)
        MODE="list"
        shift
        ;;
      all)
        REQUESTED=("all")
        shift
        ;;
      --target)
        TARGET_MODE="${2:-}"
        [[ -n "${TARGET_MODE}" ]] || fail "--target requires a value"
        shift 2
        ;;
      --dest)
        DEST="${2:-}"
        [[ -n "${DEST}" ]] || fail "--dest requires a value"
        shift 2
        ;;
      --force)
        FORCE=1
        shift
        ;;
      --help|-h)
        usage
        exit 0
        ;;
      *)
        REQUESTED+=("$1")
        shift
        ;;
    esac
  done
}

list_skills() {
  require_cmd node
  node "${SCRIPT_DIR}/validate-skills.mjs" "${SKILLS_ROOT}" >/dev/null
  find "${SKILLS_ROOT}" -mindepth 1 -maxdepth 1 -type d -print | sort | while read -r dir; do
    printf '%s\n' "$(basename "${dir}")"
  done
}

resolve_targets() {
  if [[ -n "${DEST}" ]]; then
    printf '%s\n' "${DEST}"
    return
  fi

  local codex_home="${CODEX_HOME:-${HOME}/.codex}"
  local agents_home="${AGENTS_HOME:-${HOME}/.agents}"
  local trae_home="${TRAE_HOME:-${HOME}/.trae}"
  local trae_cn_home="${TRAE_CN_HOME:-${HOME}/.trae-cn}"
  local codex_dest="${codex_home}/skills"
  local agents_dest="${agents_home}/skills"
  local trae_dest="${trae_home}/skills"
  local trae_cn_dest="${trae_cn_home}/skills"

  case "${TARGET_MODE}" in
    auto)
      local any=0
      if [[ -d "${codex_home}" || -n "${CODEX_HOME:-}" ]]; then
        printf '%s\n' "${codex_dest}"
        any=1
      fi
      if [[ -d "${agents_home}" || -n "${AGENTS_HOME:-}" ]]; then
        printf '%s\n' "${agents_dest}"
        any=1
      fi
      if [[ "${any}" -eq 0 ]]; then
        printf '%s\n' "${codex_dest}"
      fi
      ;;
    codex)
      printf '%s\n' "${codex_dest}"
      ;;
    agents)
      printf '%s\n' "${agents_dest}"
      ;;
    both)
      printf '%s\n%s\n' "${codex_dest}" "${agents_dest}"
      ;;
    trae)
      printf '%s\n' "${trae_dest}"
      ;;
    trae-cn)
      printf '%s\n' "${trae_cn_dest}"
      ;;
    *)
      fail "Unsupported --target: ${TARGET_MODE}"
      ;;
  esac
}

install_one() {
  local skill_name="$1"
  local target_root="$2"
  local source_dir="${SKILLS_ROOT}/${skill_name}"
  local target_dir="${target_root}/${skill_name}"

  [[ -d "${source_dir}" ]] || fail "Skill not found: ${skill_name}"
  mkdir -p "${target_root}"
  if [[ -e "${target_dir}" ]]; then
    if [[ "${FORCE}" -ne 1 ]]; then
      fail "Target already exists: ${target_dir}. Use --force to overwrite."
    fi
    rm -rf "${target_dir}"
  fi
  rsync -a "${source_dir}/" "${target_dir}/"
  log "installed ${skill_name} -> ${target_dir}"
}

main() {
  parse_args "$@"
  [[ -d "${SKILLS_ROOT}" ]] || fail "Skills directory not found: ${SKILLS_ROOT}"

  if [[ "${MODE}" == "list" ]]; then
    list_skills
    return
  fi

  require_cmd node
  require_cmd rsync
  node "${SCRIPT_DIR}/validate-skills.mjs" "${SKILLS_ROOT}"

  local -a all_skills=()
  while IFS= read -r line; do
    [[ -n "${line}" ]] && all_skills+=("${line}")
  done < <(find "${SKILLS_ROOT}" -mindepth 1 -maxdepth 1 -type d -print | xargs -n 1 basename | sort)

  local -a selected=()
  if [[ "${#REQUESTED[@]}" -eq 0 || "${REQUESTED[0]}" == "all" ]]; then
    selected=("${all_skills[@]}")
  else
    selected=("${REQUESTED[@]}")
  fi

  local -a targets=()
  while IFS= read -r target; do
    [[ -n "${target}" ]] && targets+=("${target}")
  done < <(resolve_targets)

  [[ "${#targets[@]}" -gt 0 ]] || fail "No skill installation target directories were resolved"

  for target in "${targets[@]}"; do
    for skill_name in "${selected[@]}"; do
      install_one "${skill_name}" "${target}"
    done
  done

  log "done"
  log "restart your agent client to pick up new skills"
}

main "$@"
