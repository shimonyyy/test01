import * as XLSX from 'xlsx'
import { todayFileStamp } from '@/lib/format'

export type InventoryExportRow = {
  위치: string
  자재코드: string
  자재명: string
  규격: string
  단위: string
  수량: number
  안전재고: number
  최종업데이트: string
}

export function exportInventoryXlsx(rows: InventoryExportRow[]) {
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows)
  XLSX.utils.book_append_sheet(wb, ws, '재고')
  const filename = `${todayFileStamp()}_BERTI_재고리스트.xlsx`
  XLSX.writeFile(wb, filename)
}

export type TransactionExportRow = {
  일자: string
  등록일시: string
  구분: string
  위치: string
  도착지: string
  자재코드: string
  자재명: string
  수량: number
  단위: string
  거래처사용처: string
  비고: string
  입력자: string
}

export function exportTransactionsXlsx(rows: TransactionExportRow[]) {
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows)
  XLSX.utils.book_append_sheet(wb, ws, '입출고')
  const filename = `${todayFileStamp()}_BERTI_입출고이력.xlsx`
  XLSX.writeFile(wb, filename)
}

// 임의의 시트 데이터를 객체 배열로 읽기
export async function readSheet(file: File): Promise<Array<Record<string, unknown>>> {
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array' })
  const sheetName = wb.SheetNames[0]
  const ws = wb.Sheets[sheetName]
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })
}

