import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/lib/db.types'
import { useAuth } from './AuthProvider'

export function useProfile() {
  const { user } = useAuth()
  return useQuery<Profile | null>({
    queryKey: ['profile', user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return null
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      if (error) throw error
      return data as Profile
    }
  })
}

export function useIsAdmin() {
  const { data } = useProfile()
  return data?.role === 'admin'
}
