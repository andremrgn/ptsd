// Thin wrapper for backwards compatibility — bruk useSupabaseClient() direkte i nye filer
export function useSupabase() {
  return useSupabaseClient()
}
