/**
 * ARCHITECTURAL ENVIRONMENT VALIDATOR & RUNTIME TELEMETRY
 * Role: Validates kernel environment variables, ensures required API credentials exist, 
 *       and securely masks secrets for diagnostic telemetry reporting.
 * Integration: Connected with diagnostic engine and AI agent execution core.
 * Siphoned from: craighckby-stack/AI_Agent_OS
 */

export interface EnvConfig {
  geminiApiKey: string;
  appUrl: string;
  nodeEnv: 'development' | 'production' | 'test';
  openAiApiKey?: string;
  deepSeekApiKey?: string;
  anthropicApiKey?: string;
  localLlmEndpoint?: string;
  consensusWeightThreshold: number;
  sandboxMemoryLimitMb: number;
  enableTelemetry: boolean;
  memoryStorePath: string;
}

export interface EnvValidationResult {
  isValid: boolean;
  missingRequired: string[];
  warnings: string[];
  config: EnvConfig;
  sanitizedSnapshot: Record<string, string>;
}

/**
 * Masks secret keys for diagnostic logs and UI display
 */
export function maskSecret(secret?: string, visibleChars = 4): string {
  if (!secret || secret.trim() === '') return '[NOT_CONFIGURED]';
  if (secret.length <= visibleChars * 2) return '********';
  return `${secret.slice(0, visibleChars)}...${secret.slice(-visibleChars)}`;
}

/**
 * Parses and strictly validates runtime environment variables.
 */
export function validateEnvironment(): EnvValidationResult {
  const missingRequired: string[] = [];
  const warnings: string[] = [];

  // Check for GEMINI_API_KEY (or NEXT_PUBLIC_ / VITE_ prefixes if in browser context)
  const geminiKey =
    (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_GEMINI_API_KEY) ||
    (typeof (globalThis as any).GEMINI_API_KEY === 'string' ? (globalThis as any).GEMINI_API_KEY : '');

  if (!geminiKey || geminiKey === 'MY_GEMINI_API_KEY') {
    missingRequired.push('GEMINI_API_KEY');
  }

  const appUrl =
    (typeof process !== 'undefined' && process.env?.APP_URL) ||
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_APP_URL) ||
    'http://localhost:3000';

  const rawNodeEnv =
    (typeof process !== 'undefined' && process.env?.NODE_ENV) || 'development';
  const nodeEnv: 'development' | 'production' | 'test' =
    rawNodeEnv === 'production' || rawNodeEnv === 'test' ? rawNodeEnv : 'development';

  const consensusThreshold = parseFloat(
    (typeof process !== 'undefined' && process.env?.CONSENSUS_WEIGHT_THRESHOLD) || '0.75'
  );

  const sandboxMemoryLimitMb = parseInt(
    (typeof process !== 'undefined' && process.env?.SANDBOX_MEMORY_LIMIT_MB) || '512',
    10
  );

  const enableTelemetry =
    (typeof process !== 'undefined' && process.env?.ENABLE_TELEMETRY) !== 'false';

  const memoryStorePath =
    (typeof process !== 'undefined' && process.env?.MEMORY_STORE_PATH) || './memory';

  const openAiApiKey = typeof process !== 'undefined' ? process.env?.OPENAI_API_KEY : undefined;
  const deepSeekApiKey = typeof process !== 'undefined' ? process.env?.DEEPSEEK_API_KEY : undefined;
  const anthropicApiKey = typeof process !== 'undefined' ? process.env?.ANTHROPIC_API_KEY : undefined;
  const localLlmEndpoint = typeof process !== 'undefined' ? process.env?.LOCAL_LLM_ENDPOINT : undefined;

  if (!openAiApiKey && !deepSeekApiKey && !localLlmEndpoint) {
    warnings.push('No secondary/fallback LLM providers configured (OpenAI, DeepSeek, or Local). System will operate in single-provider Gemini mode.');
  }

  const config: EnvConfig = {
    geminiApiKey: geminiKey,
    appUrl,
    nodeEnv,
    openAiApiKey,
    deepSeekApiKey,
    anthropicApiKey,
    localLlmEndpoint,
    consensusWeightThreshold: isNaN(consensusThreshold) ? 0.75 : consensusThreshold,
    sandboxMemoryLimitMb: isNaN(sandboxMemoryLimitMb) ? 512 : sandboxMemoryLimitMb,
    enableTelemetry,
    memoryStorePath,
  };

  const sanitizedSnapshot: Record<string, string> = {
    NODE_ENV: config.nodeEnv,
    APP_URL: config.appUrl,
    GEMINI_API_KEY: maskSecret(config.geminiApiKey),
    OPENAI_API_KEY: maskSecret(config.openAiApiKey),
    DEEPSEEK_API_KEY: maskSecret(config.deepSeekApiKey),
    ANTHROPIC_API_KEY: maskSecret(config.anthropicApiKey),
    LOCAL_LLM_ENDPOINT: config.localLlmEndpoint || '[NOT_CONFIGURED]',
    CONSENSUS_WEIGHT_THRESHOLD: config.consensusWeightThreshold.toString(),
    SANDBOX_MEMORY_LIMIT_MB: `${config.sandboxMemoryLimitMb}MB`,
    ENABLE_TELEMETRY: config.enableTelemetry ? 'ENABLED' : 'DISABLED',
    MEMORY_STORE_PATH: config.memoryStorePath,
  };

  return {
    isValid: missingRequired.length === 0,
    missingRequired,
    warnings,
    config,
    sanitizedSnapshot,
  };
}
