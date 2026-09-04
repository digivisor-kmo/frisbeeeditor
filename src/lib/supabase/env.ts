function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Omgevingsvariabele ${name} ontbreekt. Zie .env.example en de projectinstellingen in Vercel.`,
    )
  }
  return value
}

export const supabaseUrl = () =>
  required('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL)

export const supabaseKey = () =>
  required(
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  )
