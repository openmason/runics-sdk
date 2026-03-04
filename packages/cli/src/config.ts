import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export interface RunicsConfig {
	url: string;
	apiKey?: string;
	defaultLimit: number;
	defaultMinTrust: number;
}

interface PartialRunicsConfig {
	url?: string;
	apiKey?: string;
	defaultLimit?: number;
	defaultMinTrust?: number;
}

function loadConfigFile(): PartialRunicsConfig {
	// Try current working directory first
	const cwdConfigPath = join(process.cwd(), ".runicsrc.json");
	if (existsSync(cwdConfigPath)) {
		try {
			const content = readFileSync(cwdConfigPath, "utf-8");
			return JSON.parse(content);
		} catch (error) {
			// Ignore parse errors, fall through to next location
		}
	}

	// Try home directory
	const homeConfigPath = join(homedir(), ".runicsrc.json");
	if (existsSync(homeConfigPath)) {
		try {
			const content = readFileSync(homeConfigPath, "utf-8");
			return JSON.parse(content);
		} catch (error) {
			// Ignore parse errors
		}
	}

	return {};
}

export function loadConfig(): RunicsConfig {
	const fileConfig = loadConfigFile();

	// Apply environment variables
	const url = process.env.RUNICS_URL || fileConfig.url || "http://localhost:8787";
	const apiKey = process.env.RUNICS_API_KEY || fileConfig.apiKey;
	const defaultLimit = fileConfig.defaultLimit ?? 5;
	const defaultMinTrust = fileConfig.defaultMinTrust ?? 0.0;

	return {
		url,
		apiKey,
		defaultLimit,
		defaultMinTrust,
	};
}

export interface ConfigOverrides {
	url?: string;
	apiKey?: string;
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
		if (cliFlags.limit !== undefined) baseConfig.defaultLimit = cliFlags.limit;
		if (cliFlags.minTrust !== undefined) baseConfig.defaultMinTrust = cliFlags.minTrust;
	}

	return baseConfig;
}
