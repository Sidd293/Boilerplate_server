import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('1h'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  MAILGUN_API_KEY: z.string().min(1).optional(),
  MAILGUN_DOMAIN: z.string().min(1).optional(),
  MAILGUN_FROM: z.string().min(1).optional()
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const fields = Object.keys(parsed.error.flatten().fieldErrors);
  const message = fields.length > 0 ? fields.join(', ') : 'unknown';
  throw new Error(`Invalid environment configuration: ${message}`);
}

export const env = parsed.data;

export const config = {
  env: env.NODE_ENV,
  port: env.PORT,
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN
  },
  databaseUrl: env.DATABASE_URL,
  mailgun: {
    apiKey: env.MAILGUN_API_KEY,
    domain: env.MAILGUN_DOMAIN,
    from: env.MAILGUN_FROM
  }
};
