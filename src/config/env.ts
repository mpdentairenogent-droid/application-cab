import { z } from 'zod';

const envSchema = z.object({
  EXPO_PUBLIC_SUPABASE_URL: z
    .string({ message: "EXPO_PUBLIC_SUPABASE_URL est manquant. Copie .env.example vers .env.local et renseigne ton projet Supabase." })
    .url('EXPO_PUBLIC_SUPABASE_URL doit être une URL valide (ex: https://xxxx.supabase.co)'),
  EXPO_PUBLIC_SUPABASE_ANON_KEY: z
    .string({ message: 'EXPO_PUBLIC_SUPABASE_ANON_KEY est manquant. Copie .env.example vers .env.local et renseigne ton projet Supabase.' })
    .min(20, 'EXPO_PUBLIC_SUPABASE_ANON_KEY semble invalide.'),
});

const parsed = envSchema.safeParse({
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
});

if (!parsed.success) {
  const message = parsed.error.issues.map((issue) => issue.message).join('\n');
  throw new Error(`Configuration invalide :\n${message}`);
}

export const env = parsed.data;
