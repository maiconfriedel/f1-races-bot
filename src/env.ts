import "dotenv/config";
import z from "zod";

export const envSchema = z.object({
  TELEGRAM_API_TOKEN: z.string(),
  DATABASE_URL: z.string().min(1),
  ALERTS_CRON: z.string().default("0 9 * * *"),
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
