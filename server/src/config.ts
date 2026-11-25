import { z } from 'zod';

export type Env = Readonly<Record<string, string | undefined>>;

export interface AppConfig {
  port: number;
  aiConfigured: boolean;
  cloudSaveConfigured: boolean;
}

export const DEFAULT_PORT = 3001;

const portSchema = z.coerce.number().int().min(1).max(65535);

const envSchema = z.object({
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  PORT: z.string().optional(),
});

const isSet = (value: string | undefined): boolean => value !== undefined && value.trim() !== '';

// Pure on purpose: only entry files read process.env and pass it in.
export function parseConfig(env: Env): AppConfig {
  const parsed = envSchema.parse(env);
  return {
    port: portSchema.parse(isSet(parsed.PORT) ? parsed.PORT : DEFAULT_PORT),
    aiConfigured: isSet(parsed.GEMINI_API_KEY) && isSet(parsed.GEMINI_MODEL),
    cloudSaveConfigured: isSet(parsed.DATABASE_URL),
  };
}
