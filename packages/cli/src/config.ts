import { randomUUID } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export interface RunicsConfig {
	url: string;
	apiKey?: string;
	tenantId: string;
	defaultLimit: number;
	defaultMinTrust: number;
}

interface PartialRunicsConfig {
	url?: string;
	apiKey?: string;
	tenantId?: string;
	defaultLimit?: number;
	defaultMinTrust?: number;
}

function getConfigPath(): string | null {
	// Try current working directory first
	const cwdConfigPath = join(process.cwd(), ".runicsrc.json");
	if (existsSync(cwdConfigPath)) {
		return cwdConfigPath;
	}

	// Try home directory
	const homeConfigPath = join(homedir(), ".runicsrc.json");
	if (existsSync(homeConfigPath)) {
		return homeConfigPath;
	}

	// Default to home directory for new config
	return join(homedir(), ".runicsrc.json");
}

function loadConfigFile(): PartialRunicsConfig {
	const configPath = getConfigPath();
	if (!configPath || !existsSync(configPath)) {
		return {};
	}

	try {
		const content = readFileSync(configPath, "utf-8");
		return JSON.parse(content);
	} catch (error) {
		// Ignore parse errors
		return {};
	}
}

function saveConfigFile(config: PartialRunicsConfig): void {
	const configPath = getConfigPath();
	if (!configPath) {
		return;
	}

	try {
		const content = JSON.stringify(config, null, 2);
		writeFileSync(configPath, content, "utf-8");
	} catch (error) {
		// Silently fail - don't interrupt the user's workflow
	}
}

export function loadConfig(): RunicsConfig {
	const fileConfig = loadConfigFile();

	// Generate and persist tenantId if not present
	let tenantId = process.env.RUNICS_TENANT_ID || fileConfig.tenantId;
	if (!tenantId) {
		tenantId = randomUUID();
		// Save the generated tenantId back to config file
		saveConfigFile({ ...fileConfig, tenantId });
	}

	// Apply environment variables
	const url = process.env.RUNICS_URL || fileConfig.url || "http://localhost:8787";
	const apiKey = process.env.RUNICS_API_KEY || fileConfig.apiKey;
	const defaultLimit = fileConfig.defaultLimit ?? 5;
	const defaultMinTrust = fileConfig.defaultMinTrust ?? 0.0;

	return {
		url,
		apiKey,
		tenantId,
		defaultLimit,
		defaultMinTrust,
	};
}

export interface ConfigOverrides {
	url?: string;
	apiKey?: string;
	tenantId?: string;
	limit?: number;
	minTrust?: number;
}

export function resolveConfig(
	cliFlags?: ConfigOverrides,
	envOverrides?: Partial<RunicsConfig>,
): RunicsConfig {
	const baseConfig = loadConfig();

	// Apply environment overrides
	if (envOverrides) {
		Object.assign(baseConfig, envOverrides);
	}

	// Apply CLI flag overrides (highest priority)
	if (cliFlags) {
		if (cliFlags.url) baseConfig.url = cliFlags.url;
		if (cliFlags.apiKey) baseConfig.apiKey = cliFlags.apiKey;
		if (cliFlags.tenantId) baseConfig.tenantId = cliFlags.tenantId;
		if (cliFlags.limit !== undefined) baseConfig.defaultLimit = cliFlags.limit;
		if (cliFlags.minTrust !== undefined) baseConfig.defaultMinTrust = cliFlags.minTrust;
	}

	return baseConfig;
}
