import Dexie, { type Table } from 'dexie'

export type QueuedTxKind = 'inbound' | 'outbound'

export interface QueuedTransaction {
  id?: number
  client_uuid: string
  kind: QueuedTxKind
  payload: Record<string, unknown>
  created_at: number
  retries: number
  last_error?: string
  // 사용자 표시용
  item_name?: string
  location_name?: string
  quantity?: number
}

class BertiDB extends Dexie {
  transactions!: Table<QueuedTransaction, number>

  constructor() {
    super('berti')
    this.version(1).stores({
      transactions: '++id, client_uuid, kind, created_at'
    })
  }
}

export const offlineDB = new BertiDB()
