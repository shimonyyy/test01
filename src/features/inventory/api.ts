import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export type InventoryRow = {
  id: string
  location_id: string
  item_id: string
  quantity: number
  updated_at: string
  location: { id: string; name: string; type: string }
  item: {
    id: string
    code: string
    name: string
    unit: string
    safety_stock: number
    spec: string
  }
}

export function useInventory(opts?: { locationId?: string }) {
  return useQuery<InventoryRow[]>({
    queryKey: ['inventory', opts?.locationId ?? 'all'],
    queryFn: async () => {
      let q = supabase
        .from('inventory')
        .select(`
          *,
          location:locations(id,name,type),
          item:items(id,code,name,unit,safety_stock,spec)
        `)
        .order('updated_at', { ascending: false })
      if (opts?.locationId) q = q.eq('location_id', opts.locationId)
      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as unknown as InventoryRow[]
    }
  })
}

export function useInventoryByLocationSummary() {
  return useQuery({
    queryKey: ['inventory', 'by-location-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select(`location_id, quantity, location:locations(id,name,type)`)
      if (error) throw error
      const map = new Map<
        string,
        { id: string; name: string; type: string; total: number; itemCount: number }
      >()
      for (const r of (data ?? []) as any[]) {
        const loc = r.location
        if (!loc) continue
        const cur = map.get(loc.id) ?? { id: loc.id, name: loc.name, type: loc.type, total: 0, itemCount: 0 }
        cur.total += Number(r.quantity)
        cur.itemCount += 1
        map.set(loc.id, cur)
      }
      return Array.from(map.values())
    }
  })
}
