// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { spawn } from "node:child_process";
import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
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
const IGA_NPX_ARGS = ["-y", "@iga-pages/cli@latest"] as const;
export type ProjectFeature = (typeof PROJECT_FEATURES)[number];

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
  displayArgs?: string[];
  redactValues?: string[];
  streamOutput?: boolean;
}

interface DeploymentProvider {
  run: (
    projectDir: string,
    dryRun: boolean | undefined,
  ) => Promise<CommandResult>;
}

const DEPLOYMENT_PROVIDERS = new Map<string, DeploymentProvider>([
  ["volcengine-iga", { run: runVolcengineIgaDeployCommand }],
]);
const MANAGED_IGA_ENV_KEYS = [
  "VIKING_APP_ID",
  "VIKING_API_KEY",
  "VIKING_AK",
  "VIKING_SK",
  "VIKING_REGION",
  "VIKING_FEATURES",
  "VIKING_SEARCH_SCENE_ID",
  "VIKING_SEARCH_DATASET_ID",
  "VIKING_REC_SCENE_ID",
] as const;

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
    "{{TEMPLATE_VERSION}}": PROJECT_WEB_TEMPLATE_VERSION,
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
        "vs project deploy",
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
  const { name: provider, implementation } = resolveDeploymentProvider(
    options.provider,
  );
  const projectDir = path.resolve(options.projectDir ?? process.cwd());
  await loadAndValidateProjectMarker(projectDir);

  if (!(await projectDependencyDirExists(projectDir))) {
    await runProjectCommand("npm", ["install"], projectDir);
  }

  if (!options.dryRun) {
    await runProjectCommand("npm", ["run", "build"], projectDir);
  }

  const deployResult = await implementation.run(projectDir, options.dryRun);
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
      consoleUrl: parsedUrls.consoleUrl ?? null,
      urls: parsedUrls.allUrls,
    },
  });
}

async function runVolcengineIgaDeployCommand(
  projectDir: string,
  dryRun: boolean | undefined,
): Promise<CommandResult> {
  if (!dryRun) {
    await ensureIgaProjectLinked(projectDir);
    await syncIgaEnvironmentVariables(projectDir);
    return runProjectCommand(
      "npx",
      [...IGA_NPX_ARGS, "pages", "deploy"],
      projectDir,
    );
  }

  const outputDir = await mkdtemp(
    path.join(os.tmpdir(), "viking-iga-build-"),
  );
  try {
    return await runProjectCommand(
      "npx",
      [
        ...IGA_NPX_ARGS,
        "pages",
        "build",
        "--output",
        outputDir,
      ],
      projectDir,
    );
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
}

async function ensureIgaProjectLinked(projectDir: string): Promise<void> {
  try {
    await stat(path.join(projectDir, ".iga", "project.json"));
    return;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  await runProjectCommand(
    "npx",
    [...IGA_NPX_ARGS, "pages", "link", "-y"],
    projectDir,
  );
}

async function syncIgaEnvironmentVariables(
  projectDir: string,
): Promise<void> {
  const localValues = await readManagedIgaEnvironmentVariables(projectDir);
  const listResult = await runProjectCommand(
    "npx",
    [...IGA_NPX_ARGS, "pages", "env", "list", "--format=json"],
    projectDir,
  );
  const existingKeys = parseIgaEnvironmentKeys(listResult.stdout);

  for (const key of MANAGED_IGA_ENV_KEYS) {
    const action = existingKeys.has(key) ? "update" : "add";
    const value = localValues.get(key) ?? "";
    const args = [
      ...IGA_NPX_ARGS,
      "pages",
      "env",
      action,
      key,
      "--value",
      value,
      "-y",
    ];
    await runProjectCommand("npx", args, projectDir, {
      displayArgs: [
        ...IGA_NPX_ARGS,
        "pages",
        "env",
        action,
        key,
        "--value",
        "[REDACTED]",
        "-y",
      ],
      redactValues: value ? [value] : [],
      streamOutput: false,
    });
  }
}

async function readManagedIgaEnvironmentVariables(
  projectDir: string,
): Promise<Map<string, string>> {
  const envPath = path.join(projectDir, ".env.local");
  let content: string;
  try {
    content = await readFile(envPath, "utf8");
  } catch {
    throw new Error(
      `Cannot deploy without generated runtime configuration. Missing ${envPath}.`,
    );
  }

  const allowedKeys = new Set<string>(MANAGED_IGA_ENV_KEYS);
  const values = new Map<string, string>();
  for (const line of content.split(/\r?\n/)) {
    const normalized = line.trim();
    if (!normalized || normalized.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    if (!allowedKeys.has(key)) continue;
    values.set(key, line.slice(separator + 1));
  }

  const missingKeys = MANAGED_IGA_ENV_KEYS.filter((key) => !values.has(key));
  if (missingKeys.length > 0) {
    throw new Error(
      `Generated runtime configuration is incomplete in ${envPath}. Missing: ${missingKeys.join(", ")}.`,
    );
  }
  return values;
}

function parseIgaEnvironmentKeys(output: string): Set<string> {
  let payload: unknown;
  try {
    payload = JSON.parse(output);
  } catch {
    throw new Error(
      "Unable to read IGA environment variables: expected JSON output from `iga pages env list --format=json`.",
    );
  }
  const env = (payload as { env?: unknown }).env;
  if (!Array.isArray(env)) {
    throw new Error(
      "Unable to read IGA environment variables: response does not contain an env list.",
    );
  }
  return new Set(
    env.flatMap((item) => {
      const key = (item as { key?: unknown })?.key;
      return typeof key === "string" ? [key] : [];
    }),
  );
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
  const displayArgs = options.displayArgs ?? args;
  const commandLine = [command, ...displayArgs].join(" ");
  process.stderr.write(`\n> ${commandLine}\n`);
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
            displayArgs,
            commandOutputError(error, stdoutChunks, stderrChunks),
            options.redactValues,
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
            displayArgs,
            {
              message: `Command exited with ${signal ? `signal ${signal}` : `status ${code ?? "unknown"}`}.`,
              stdout,
              stderr,
            },
            options.redactValues,
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
  redactValues: string[] = [],
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
  const output = redactSensitiveValues(
    [stdout, stderr].filter(Boolean).join("\n"),
    redactValues,
  );
  const authGuidance = needsIgaAuthenticationGuidance(command, args, output)
    ? "\nIGA authentication is required. Run `npx -y @iga-pages/cli@latest login` in an interactive terminal, then retry."
    : "";
  return `Command failed: ${commandLine}${output ? `\n${output}` : maybeError.message ? `\n${maybeError.message}` : ""}${authGuidance}`;
}

function redactSensitiveValues(
  text: string,
  values: string[],
): string {
  return values.reduce(
    (redacted, value) => redacted.split(value).join("[REDACTED]"),
    text,
  );
}

function needsIgaAuthenticationGuidance(
  command: string,
  args: string[],
  output: string,
): boolean {
  if (command !== "npx" || !args.includes("@iga-pages/cli@latest")) {
    return false;
  }
  return /not logged in|please run [`'"]?iga login|authentication (?:is )?required|credentials? (?:were )?not found/i.test(
    output,
  );
}

function parseDeploymentUrls(output: string): {
  deploymentUrl?: string;
  previewUrl?: string;
  consoleUrl?: string;
  allUrls: string[];
} {
  const allUrls = extractUrls(output);
  const lines = output.split(/\r?\n/);
  const previewUrl = extractLabeledUrl(lines, /preview\s+url/i);
  const consoleUrl = extractLabeledUrl(lines, /\bconsole\b/i);
  return {
    deploymentUrl: previewUrl,
    previewUrl,
    consoleUrl,
    allUrls,
  };
}

function extractLabeledUrl(
  lines: string[],
  label: RegExp,
): string | undefined {
  return lines
    .find((line) => label.test(line))
    ?.match(/https?:\/\/[^\s)>\]]+/)?.[0]
    ?.replace(/[.,;:]+$/, "");
}

function extractUrls(output: string): string[] {
  const matches = output.match(/https?:\/\/[^\s)>\]]+/g) ?? [];
  return [...new Set(matches.map((url) => url.replace(/[.,;:]+$/, "")))];
}

function resolveDeploymentProvider(provider?: string): {
  name: string;
  implementation: DeploymentProvider;
} {
  const normalized = provider?.trim().toLowerCase() || "volcengine-iga";
  const implementation = DEPLOYMENT_PROVIDERS.get(normalized);
  if (implementation) {
    return { name: normalized, implementation };
  }
  const supportedProviders = [...DEPLOYMENT_PROVIDERS.keys()];
  if (supportedProviders.length === 0) {
    throw new Error(
      `Unsupported deployment provider: ${provider}. No deployment providers are currently available.`,
    );
  }
  throw new Error(
    `Unsupported deployment provider: ${provider}. Supported providers: ${supportedProviders.join(", ")}.`,
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
