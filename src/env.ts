import "dotenv/config";
import z from "zod";

export const envSchema = z.object({
  TELEGRAM_API_TOKEN: z.string(),
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
