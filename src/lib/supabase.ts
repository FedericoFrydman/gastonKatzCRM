import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env['VITE_SUPABASE_URL']
const supabaseAnonKey = import.meta.env['VITE_SUPABASE_ANON_KEY']

const getValidatedSupabaseUrl = (value: string) => {
  let parsedUrl: URL

  try {
    parsedUrl = new URL(value)
  } catch {
    throw new Error(
      'Invalid VITE_SUPABASE_URL. Expected a full URL like https://your-project.supabase.co.',
    )
  }

  const isDashboardUrl =
    parsedUrl.hostname === 'supabase.com' && parsedUrl.pathname.startsWith('/dashboard/project/')

  if (isDashboardUrl) {
    throw new Error(
      'Invalid VITE_SUPABASE_URL. Use your project API URL like https://your-project.supabase.co, not a Supabase dashboard URL.',
    )
  }

  return parsedUrl.toString().replace(/\/$/, '')
}

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env.local file.')
}

export const supabase = createClient<Database>(
  getValidatedSupabaseUrl(supabaseUrl),
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
)
