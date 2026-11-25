import { z } from 'zod';

export type Env = Readonly<Record<string, string | undefined>>;

export interface AiConfig {
  apiKey: string;
  model: string;
}

export interface AppConfig {
  port: number;
  /** Absent unless both the key and the model are set (BACKEND.md). */
  ai?: AiConfig | undefined;
  aiConfigured: boolean;
  cloudSaveConfigured: boolean;
  /** Docker and end-to-end tests only (DEPLOYMENT.md). */
  staticDir?: string | undefined;
}

export const DEFAULT_PORT = 3001;

const portSchema = z.coerce.number().int().min(1).max(65535);

// Blank counts as not set. Trimmed, because a stray newline is not allowed in a header.
const settingSchema = z.string().trim().default('');

const envSchema = z.object({
  GEMINI_API_KEY: settingSchema,
  GEMINI_MODEL: settingSchema,
  DATABASE_URL: settingSchema,
  STATIC_DIR: settingSchema,
  PORT: settingSchema,
});

// Pure on purpose: only entry files read process.env and pass it in.
export function parseConfig(env: Env): AppConfig {
  const parsed = envSchema.parse(env);
  const { GEMINI_API_KEY: apiKey, GEMINI_MODEL: model } = parsed;
  const ai = apiKey && model ? { apiKey, model } : undefined;
  return {
    port: portSchema.parse(parsed.PORT || DEFAULT_PORT),
    ai,
    aiConfigured: ai !== undefined,
    cloudSaveConfigured: parsed.DATABASE_URL !== '',
    staticDir: parsed.STATIC_DIR || undefined,
  };
}
