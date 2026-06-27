import { CHART_COLORS, formatKRW } from './assetAggregation'

export { formatKRW }

const CATEGORY_SERIES = [
  { key: 'total_value_krw', label: '총 자산', color: '#3b82f6' },
  { key: 'domestic_value_krw', label: '국내주식', color: '#10b981' },
  { key: 'etf_value_krw', label: '국내 ETF', color: '#f59e0b' },
  { key: 'foreign_value_krw', label: '해외주식', color: '#ef4444' },
  { key: 'cash_value_krw', label: '현금성', color: '#8b5cf6' },
  { key: 'gold_value_krw', label: '금', color: '#eab308' },
]

export function formatChangePct(value) {
  if (value == null || Number.isNaN(value)) return '-'
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

export function formatChangeKRW(value) {
  if (value == null || Number.isNaN(value)) return '-'
  const sign = value > 0 ? '+' : value < 0 ? '-' : ''
  return `${sign}${Math.abs(Math.round(value)).toLocaleString('ko-KR')}원`
}

export function changeClassName(value) {
  if (value == null || value === 0) return 'change-neutral'
  return value > 0 ? 'change-positive' : 'change-negative'
}

export function formatShortDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  })
}

export function formatPeriodRange(fromAt, toAt) {
  if (!fromAt || !toAt) return '-'
  const from = new Date(fromAt).toLocaleString('ko-KR')
  const to = new Date(toAt).toLocaleString('ko-KR')
  return `${from} → ${to}`
}

export function buildTimelineChartData(timeline = []) {
  return timeline.map((point) => ({
    ...point,
    label: `v${point.snapshot_version}`,
    dateLabel: formatShortDate(point.snapshot_at),
  }))
}

export { CATEGORY_SERIES }
