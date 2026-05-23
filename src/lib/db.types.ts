// 수동으로 관리하는 DB 타입 (supabase gen types 대체)
// 마이그레이션과 일치해야 한다.

export type Role = 'admin' | 'user'

export interface Profile {
  id: string
  email: string
  name: string
  department: string
  phone: string
  role: Role
  is_approved: boolean
  default_location_id: string | null
  created_at: string
}

export interface Location {
  id: string
  name: string
  type: 'warehouse' | 'site'
  address: string
  memo: string
  created_at: string
}

export interface Item {
  id: string
  code: string
  name: string
  spec: string
  species: string
  color: string
  unit: string
  qty_per_box: number
  area_per_box: number
  safety_stock: number
  qr_payload: string | null
  memo: string
  created_at: string
}

export interface Inventory {
  id: string
  location_id: string
  item_id: string
  quantity: number
  updated_at: string
}

export type TransactionType = 'in' | 'out' | 'transfer'

export interface Transaction {
  id: string
  type: TransactionType
  location_id: string
  dest_location_id: string | null
  item_id: string
  quantity: number
  transaction_date: string
  partner: string
  memo: string
  photo_urls: string[]
  client_uuid: string | null
  created_by: string | null
  created_at: string
}
