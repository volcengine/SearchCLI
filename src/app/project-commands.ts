// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { spawn } from "node:child_process";
import {
  mkdir,
  readdir,
  readFile,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {
  PROJECT_WEB_TEMPLATE_FILES,
  PROJECT_WEB_TEMPLATE_VERSION,
} from "../project/embedded-project-template";
import { requireProjectFeatureEnabled } from "../core/feature-flags";
import { printOutput } from "../core/output-format";
import { resolveCliDefaults } from "../core/user-config";

const DEFAULT_PROJECT_NAME = "viking-web-app";
const PROJECT_MARKER_PATH = ".viking";
const PROJECT_FEATURES = ["search", "recommend", "chat"] as const;
const SUPPORTED_DEPLOYMENT_PROVIDERS = ["cloudflare"] as const;
export type ProjectFeature = (typeof PROJECT_FEATURES)[number];
export type DeploymentProvider =
  (typeof SUPPORTED_DEPLOYMENT_PROVIDERS)[number];

export interface ProjectCreateOptions {
  projectName?: string;
  appId: string;
  features?: string;
  profile?: string;
  searchSceneId?: string;
  searchDatasetId?: string;
  recSceneId?: string;
}

export interface ProjectDeployOptions {
  projectDir?: string;
  dryRun?: boolean;
  provider?: string;
}

interface CommandResult {
  stdout: string;
  stderr: string;
}

interface RunProjectCommandOptions {
  includeAuthGuidance?: boolean;
  streamOutput?: boolean;
}

type ProjectCreateAuth =
  | {
      authMode: "api-key";
      authSource: "api-key";
      apiKey: string;
      accessKeyId: "";
      secretKey: "";
      region: string;
      authProfile: string;
    }
  | {
      authMode: "ak-sk";
      authSource: "env" | "secure-store";
      apiKey: "";
      accessKeyId: string;
      secretKey: string;
      region: string;
      authProfile: string;
    };

export async function runProjectCreateCommand(
  options: ProjectCreateOptions,
): Promise<void> {
  requireProjectFeatureEnabled();
  const requestedProjectName = normalizeProjectName(options.projectName);
  const appId = normalizeTemplateValue(options.appId, "--app-id");
  const features = parseProjectFeatures(options.features);
  const auth = resolveProjectCreateAuth(options);
  const searchSceneId = normalizeOptionalTemplateValue(
    options.searchSceneId,
    "--search-scene-id",
  );
  const searchDatasetId = normalizeOptionalTemplateValue(
    options.searchDatasetId,
    "--search-dataset-id",
  );
  const recSceneId = normalizeOptionalTemplateValue(
    options.recSceneId,
    "--rec-scene-id",
  );
  validateProjectCreateFeatures(
    features,
    searchSceneId,
    searchDatasetId,
    recSceneId,
  );
  const projectName = hasExplicitProjectName(options.projectName)
    ? requestedProjectName
    : await resolveDefaultProjectName(requestedProjectName);
  const deploymentName = normalizeDeploymentName(projectName);
  const projectDir = path.resolve(projectName);
  await ensureCreatableProjectDir(projectDir);

  const replacements = {
    "{{APP_ID}}": appId,
    "{{AUTH_MODE}}": auth.authMode,
    "{{API_KEY}}": auth.apiKey,
    "{{ACCESS_KEY_ID}}": auth.accessKeyId,
    "{{SECRET_ACCESS_KEY}}": auth.secretKey,
    "{{REGION}}": auth.region,
    "{{FEATURES}}": features.join(","),
    "{{SEARCH_SCENE_ID}}": searchSceneId ?? "",
    "{{SEARCH_DATASET_ID}}": searchDatasetId ?? "",
    "{{REC_SCENE_ID}}": recSceneId ?? "",
    "{{PROJECT_NAME}}": projectName,
    "{{WORKER_NAME}}": deploymentName,
    "{{TEMPLATE_VERSION}}": PROJECT_WEB_TEMPLATE_VERSION,
    "{{COMPATIBILITY_DATE}}": new Date().toISOString().slice(0, 10),
  };

  await mkdir(projectDir, { recursive: true });
  for (const [relativePath, template] of Object.entries(
    PROJECT_WEB_TEMPLATE_FILES,
  )) {
    const targetPath = path.join(projectDir, relativePath);
    await mkdir(path.dirname(targetPath), { recursive: true });
    await writeFile(targetPath, renderTemplate(template, replacements), "utf8");
  }

  await printOutput({
    ok: true,
    result: {
      projectName,
      projectDir,
      template: "project-web",
      templateVersion: PROJECT_WEB_TEMPLATE_VERSION,
      deploymentName,
      features,
      authMode: auth.authMode,
      authSource: auth.authSource,
      authProfile: auth.authProfile,
      region: auth.region,
      nextSteps: [
        `cd ${projectName}`,
        "npm install",
        "npm run dev",
        "npm run build",
        "vs project deploy --provider cloudflare",
      ],
    },
  });
}

function resolveProjectCreateAuth(
  options: ProjectCreateOptions,
): ProjectCreateAuth {
  const defaults = resolveCliDefaults({ activeProfile: options.profile });

  if (defaults.apiKey) {
    return {
      authMode: "api-key",
      authSource: "api-key",
      apiKey: normalizeTemplateValue(defaults.apiKey, "resolved API key"),
      accessKeyId: "",
      secretKey: "",
      region: normalizeTemplateValue(defaults.region, "resolved region"),
      authProfile: defaults.activeProfile,
    };
  }

  if (!defaults.accessKeyId || !defaults.secretKey) {
    throw new Error(
      "Missing project auth. Set VIKING_API_KEY, or run `vs auth login` or `vs auth import-env`.",
    );
  }

  if (
    defaults.authSource !== "env" &&
    defaults.authSource !== "secure-store"
  ) {
    throw new Error(
      "Missing project auth. Set VIKING_API_KEY, or run `vs auth login` or `vs auth import-env`.",
    );
  }

  return {
    authMode: "ak-sk",
    authSource: defaults.authSource,
    apiKey: "",
    accessKeyId: normalizeTemplateValue(defaults.accessKeyId, "resolved AK"),
    secretKey: normalizeTemplateValue(defaults.secretKey, "resolved SK"),
    region: normalizeTemplateValue(defaults.region, "resolved region"),
    authProfile: defaults.activeProfile,
  };
}

export async function runProjectDeployCommand(
  options: ProjectDeployOptions,
): Promise<void> {
  requireProjectFeatureEnabled();
  const provider = normalizeDeploymentProvider(options.provider);
  const projectDir = path.resolve(options.projectDir ?? process.cwd());
  await loadAndValidateProjectMarker(projectDir);

  if (!(await projectDependencyDirExists(projectDir))) {
    await runProjectCommand("npm", ["install"], projectDir);
  }

  await runProjectCommand("npm", ["run", "build"], projectDir);

  const deployResult = await runDeploymentProviderCommand(
    provider,
    projectDir,
    options.dryRun,
  );
  const parsedUrls = parseDeploymentUrls(
    `${deployResult.stdout}\n${deployResult.stderr}`,
  );

  await printOutput({
    ok: true,
    result: {
      provider,
      projectDir,
      dryRun: Boolean(options.dryRun),
      deploymentUrl: parsedUrls.deploymentUrl ?? null,
      previewUrl: parsedUrls.previewUrl ?? null,
      urls: parsedUrls.allUrls,
    },
  });
}

async function runDeploymentProviderCommand(
  provider: DeploymentProvider,
  projectDir: string,
  dryRun: boolean | undefined,
): Promise<CommandResult> {
  switch (provider) {
    case "cloudflare":
      return runCloudflareDeployCommand(projectDir, dryRun);
  }
}

async function runCloudflareDeployCommand(
  projectDir: string,
  dryRun: boolean | undefined,
): Promise<CommandResult> {
  await ensureCloudflareWranglerLoggedIn(projectDir);
  const deployArgs = ["--yes", "wrangler", "deploy"];
  if (dryRun) deployArgs.push("--dry-run");
  return runProjectCommand("npx", deployArgs, projectDir);
}

async function ensureCloudflareWranglerLoggedIn(
  projectDir: string,
): Promise<void> {
  try {
    const result = await runProjectCommand(
      "npx",
      ["--yes", "wrangler", "whoami"],
      projectDir,
      {
        includeAuthGuidance: false,
        streamOutput: false,
      },
    );
    if (isCloudflareWranglerLoggedOut(`${result.stdout}\n${result.stderr}`)) {
      throw new Error(formatCloudflareWranglerLoginFailure());
    }
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith("Cloudflare Wrangler is not logged in")
    ) {
      throw error;
    }
    throw new Error(formatCloudflareWranglerLoginFailure());
  }
}

async function ensureCreatableProjectDir(projectDir: string): Promise<void> {
  if (await isCreatableProjectDir(projectDir)) return;
  const projectPathStat = await stat(projectDir);
  if (!projectPathStat.isDirectory()) {
    throw new Error(
      `Project path already exists and is not a directory: ${projectDir}`,
    );
  }
  throw new Error(
    `Project directory already exists and is not empty: ${projectDir}`,
  );
}

async function resolveDefaultProjectName(baseName: string): Promise<string> {
  for (let suffix = 1; suffix < Number.MAX_SAFE_INTEGER; suffix += 1) {
    const candidate = suffix === 1 ? baseName : `${baseName}${suffix}`;
    if (await isCreatableProjectDir(path.resolve(candidate))) {
      return candidate;
    }
  }
  throw new Error(
    `Unable to find an available project directory name for ${baseName}.`,
  );
}

async function isCreatableProjectDir(projectDir: string): Promise<boolean> {
  let projectPathStat;
  try {
    projectPathStat = await stat(projectDir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return true;
    throw error;
  }

  if (!projectPathStat.isDirectory()) return false;
  const entries = await readdir(projectDir);
  return entries.length === 0;
}

async function loadAndValidateProjectMarker(projectDir: string): Promise<void> {
  const markerPath = path.join(projectDir, PROJECT_MARKER_PATH);
  let marker: string;
  try {
    marker = await readFile(markerPath, "utf8");
  } catch {
    throw new Error(
      `Only projects created by "vs project create" can be deployed. Missing ${markerPath}.`,
    );
  }

  if (marker.trim() !== `templateVersion=${PROJECT_WEB_TEMPLATE_VERSION}`) {
    throw new Error(
      `Only projects created by "vs project create" can be deployed. Invalid ${markerPath}.`,
    );
  }
}

async function runProjectCommand(
  command: string,
  args: string[],
  cwd: string,
  options: RunProjectCommandOptions = {},
): Promise<CommandResult> {
  const commandLine = [command, ...args].join(" ");
  process.stderr.write(`\n> ${commandLine}\n`);
  const includeAuthGuidance = options.includeAuthGuidance ?? true;
  const streamOutput = options.streamOutput ?? true;

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: process.env,
      shell: process.platform === "win32",
    });
    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    child.stdout.on("data", (chunk: Buffer) => {
      stdoutChunks.push(chunk);
      if (streamOutput) process.stderr.write(chunk);
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderrChunks.push(chunk);
      if (streamOutput) process.stderr.write(chunk);
    });
    child.on("error", (error) => {
      reject(
        new Error(
          formatCommandFailure(
            command,
            args,
            commandOutputError(error, stdoutChunks, stderrChunks),
            { includeAuthGuidance },
          ),
        ),
      );
    });
    child.on("close", (code, signal) => {
      const stdout = Buffer.concat(stdoutChunks).toString("utf8");
      const stderr = Buffer.concat(stderrChunks).toString("utf8");
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }
      reject(
        new Error(
          formatCommandFailure(
            command,
            args,
            {
              message: `Command exited with ${signal ? `signal ${signal}` : `status ${code ?? "unknown"}`}.`,
              stdout,
              stderr,
            },
            { includeAuthGuidance },
          ),
        ),
      );
    });
  });
}

function commandOutputError(
  error: Error,
  stdoutChunks: Buffer[],
  stderrChunks: Buffer[],
): Error & CommandResult {
  return Object.assign(error, {
    stdout: Buffer.concat(stdoutChunks).toString("utf8"),
    stderr: Buffer.concat(stderrChunks).toString("utf8"),
  });
}

function formatCommandFailure(
  command: string,
  args: string[],
  error: unknown,
  options: { includeAuthGuidance?: boolean } = {},
): string {
  const commandLine = [command, ...args].join(" ");
  const maybeError = error as {
    message?: string;
    stdout?: string;
    stderr?: string;
  };
  const stdout =
    typeof maybeError.stdout === "string" ? maybeError.stdout.trim() : "";
  const stderr =
    typeof maybeError.stderr === "string" ? maybeError.stderr.trim() : "";
  const output = [stdout, stderr].filter(Boolean).join("\n");
  const includeAuthGuidance = options.includeAuthGuidance ?? true;
  const authGuidance = includeAuthGuidance && needsDeploymentAuthGuidance(output)
    ? "\nCloudflare Wrangler authentication is required. Run `npx wrangler login` in the project directory, then retry."
    : "";
  if (authGuidance) {
    return `Command failed: ${commandLine}${authGuidance}`;
  }
  return `Command failed: ${commandLine}${output ? `\n${output}` : ""}${authGuidance || (maybeError.message ? `\n${maybeError.message}` : "")}`;
}

function formatCloudflareWranglerLoginFailure(): string {
  return [
    "Cloudflare Wrangler is not logged in, so deployment was not started.",
    "Run `npx wrangler login` in the project directory, then retry `vs project deploy --provider cloudflare`.",
  ].join("\n");
}

function parseDeploymentUrls(output: string): {
  deploymentUrl?: string;
  previewUrl?: string;
  allUrls: string[];
} {
  const allUrls = extractUrls(output);
  const previewUrl = output
    .split(/\r?\n/)
    .find((line) => /preview/i.test(line))
    ?.match(/https?:\/\/[^\s)>\]]+/)?.[0]
    ?.replace(/[.,;:]+$/, "");
  const deploymentUrl = allUrls.find((url) => url !== previewUrl) ?? allUrls[0];
  return { deploymentUrl, previewUrl, allUrls };
}

function extractUrls(output: string): string[] {
  const matches = output.match(/https?:\/\/[^\s)>\]]+/g) ?? [];
  return [...new Set(matches.map((url) => url.replace(/[.,;:]+$/, "")))];
}

function needsDeploymentAuthGuidance(output: string): boolean {
  return /api[_\s-]?token|wrangler login|not authenticated|not logged in|authentication|unauthorized/i.test(
    output,
  );
}

function isCloudflareWranglerLoggedOut(output: string): boolean {
  return /not authenticated|not logged in|please run [`']?wrangler login[`']?/i.test(
    output,
  );
}

function normalizeDeploymentProvider(provider?: string): DeploymentProvider {
  if (!provider || !provider.trim()) {
    throw new Error(
      `Missing required flag: --provider. Supported providers: ${SUPPORTED_DEPLOYMENT_PROVIDERS.join(", ")}.\nExample: \`vs project deploy --provider cloudflare\``,
    );
  }
  const normalized = provider.trim().toLowerCase();
  if (
    (SUPPORTED_DEPLOYMENT_PROVIDERS as readonly string[]).includes(normalized)
  ) {
    return normalized as DeploymentProvider;
  }
  throw new Error(
    `Unsupported deployment provider: ${provider}. Supported providers: ${SUPPORTED_DEPLOYMENT_PROVIDERS.join(", ")}.`,
  );
}

function renderTemplate(
  template: string,
  replacements: Record<string, string>,
): string {
  return Object.entries(replacements).reduce(
    (rendered, [key, value]) => rendered.split(key).join(value),
    template,
  );
}

function normalizeProjectName(value?: string): string {
  const name = value?.trim() || DEFAULT_PROJECT_NAME;
  if (name.includes("/") || name.includes("\\")) {
    throw new Error("Project name must be a directory name, not a path.");
  }
  validateTemplateSafeValue(name, "project-name");
  return name;
}

function hasExplicitProjectName(value?: string): boolean {
  return value !== undefined && value.trim().length > 0;
}

function normalizeTemplateValue(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`Missing required value: ${label}`);
  }
  validateTemplateSafeValue(normalized, label);
  return normalized;
}

function normalizeOptionalTemplateValue(
  value: string | undefined,
  label: string,
): string | undefined {
  if (value === undefined) return undefined;
  const normalized = value.trim();
  if (!normalized) return undefined;
  validateTemplateSafeValue(normalized, label);
  return normalized;
}

function parseProjectFeatures(value: string | undefined): ProjectFeature[] {
  if (!value?.trim()) {
    throw new Error(
      [
        "Missing required flag: --features.",
        projectFeaturesGuidance(),
      ].join("\n"),
    );
  }

  const tokens = value.split(",").map((entry) => entry.trim().toLowerCase());
  if (tokens.some((entry) => entry.length === 0)) {
    throw new Error(
      ["Invalid --features value.", projectFeaturesGuidance()].join("\n"),
    );
  }

  const invalid = [...new Set(tokens)].filter(
    (entry) => !(PROJECT_FEATURES as readonly string[]).includes(entry),
  );
  if (invalid.length > 0) {
    throw new Error(
      [
        `Unsupported project feature${invalid.length === 1 ? "" : "s"}: ${invalid.join(", ")}.`,
        projectFeaturesGuidance(),
      ].join("\n"),
    );
  }

  const selected = new Set(tokens as ProjectFeature[]);
  return PROJECT_FEATURES.filter((feature) => selected.has(feature));
}

function projectFeaturesGuidance(): string {
  return [
    `Supported values: ${PROJECT_FEATURES.join(", ")}.`,
    "Examples:",
    "  --features search",
    "  --features recommend",
    "  --features chat",
    "  --features search,recommend",
    "  --features search,recommend,chat",
  ].join("\n");
}

function validateProjectCreateFeatures(
  features: readonly ProjectFeature[],
  searchSceneId: string | undefined,
  searchDatasetId: string | undefined,
  recSceneId: string | undefined,
): void {
  const hasSearchScene = hasString(searchSceneId);
  const hasSearchDataset = hasString(searchDatasetId);
  const hasPartialSearch = hasSearchScene !== hasSearchDataset;
  const hasSearchConfig = hasSearchScene && hasSearchDataset;
  const hasRecommendConfig = hasString(recSceneId);
  const searchEnabled = features.includes("search");
  const recommendEnabled = features.includes("recommend");

  if (hasPartialSearch) {
    throw new Error(
      "--search-scene-id and --search-dataset-id must be provided together.",
    );
  }
  if (searchEnabled && !hasSearchConfig) {
    throw new Error(
      'Feature "search" requires --search-scene-id and --search-dataset-id.',
    );
  }
  if (!searchEnabled && hasSearchConfig) {
    throw new Error(
      '--search-scene-id and --search-dataset-id require "search" in --features.',
    );
  }
  if (recommendEnabled && !hasRecommendConfig) {
    throw new Error(
      'Feature "recommend" requires --rec-scene-id.',
    );
  }
  if (!recommendEnabled && hasRecommendConfig) {
    throw new Error(
      '--rec-scene-id requires "recommend" in --features.',
    );
  }
}

function validateTemplateSafeValue(value: string, label: string): void {
  if (/["\\\r\n]/.test(value)) {
    throw new Error(
      `${label} cannot contain double quotes, backslashes, or newlines.`,
    );
  }
}

function normalizeDeploymentName(projectName: string): string {
  const slug = normalizeAsciiSlug(projectName);
  return (
    (slug || DEFAULT_PROJECT_NAME).slice(0, 63).replace(/-+$/g, "") ||
    DEFAULT_PROJECT_NAME
  );
}

function normalizeAsciiSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function projectDependencyDirExists(projectDir: string): Promise<boolean> {
  const filePath = path.join(projectDir, "node_modules");
  try {
    const filePathStat = await stat(filePath);
    return filePathStat.isDirectory();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
}

function hasString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
