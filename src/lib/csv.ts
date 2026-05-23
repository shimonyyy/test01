// 간단한 CSV 생성 + 다운로드 유틸. Excel 한글 호환을 위해 BOM 포함.

export function toCsv(rows: Array<Record<string, unknown>>, headers?: string[]): string {
  if (rows.length === 0) return ''
  const cols = headers ?? Object.keys(rows[0])
  const escape = (v: unknown) => {
    if (v == null) return ''
    const s = String(v)
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
  }
  const head = cols.join(',')
  const body = rows.map((r) => cols.map((c) => escape(r[c])).join(',')).join('\n')
  return `${head}\n${body}`
}

export function downloadCsv(filename: string, csv: string) {
  const bom = '﻿'
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
