import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

export function fmtDate(d: string | Date | null | undefined) {
  if (!d) return ''
  return format(new Date(d), 'yyyy-MM-dd', { locale: ko })
}

export function fmtDateTime(d: string | Date | null | undefined) {
  if (!d) return ''
  return format(new Date(d), 'yyyy-MM-dd HH:mm', { locale: ko })
}

export function fmtNumber(n: number | null | undefined, digits = 2) {
  if (n == null || Number.isNaN(n)) return '-'
  return n.toLocaleString('ko-KR', { maximumFractionDigits: digits })
}

export function todayDateString() {
  return format(new Date(), 'yyyy-MM-dd')
}

export function todayFileStamp() {
  return format(new Date(), 'yyMMdd')
}
