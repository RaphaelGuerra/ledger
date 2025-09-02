import { z } from 'zod'

// Allow missing in production without crashing; validate if present
const schema = z.object({
  VITE_API_URL: z.string().url().optional(),
})

const parsed = schema.safeParse(import.meta.env)
if (!parsed.success) {
  // Non-fatal: log a warning, export partial env
  console.warn('Env validation warning:', parsed.error.flatten().fieldErrors)
}

export const env = parsed.success ? parsed.data : { VITE_API_URL: undefined }
