const CHART_COLORS = [
  '#1e3a5f',
  '#2563eb',
  '#3b82f6',
  '#60a5fa',
  '#93c5fd',
  '#0369a1',
  '#0284c7',
  '#334155',
  '#475569',
  '#64748b',
]

// 자산현황 엑셀(포트폴리오 탭 · 섹터별 비중 추이 차트)에서 추출한 섹터별 고정 색상
const SECTOR_COLORS = {
  CASH: '#548235',
  첨단제조: '#ED7D31',
  순환소비재: '#BDD7EE',
  '배당/금융': '#FF0000',
  전력인프라: '#FFFF00',
  테크: '#002060',
  GOLD: '#FFC000',
  필수소비재: '#9E480E',
  미국채: '#BFBFBF',
  코인: '#BF9000',
}

export function formatKRW(value) {
  if (value == null) return '-'
  return `${Math.round(value).toLocaleString('ko-KR')}원`
}

export function flattenDashboardAssets(dashboard) {
  if (!dashboard) return []

  const stocks = [
    ...(dashboard.domestic ?? []),
    ...(dashboard.etf ?? []),
    ...(dashboard.foreign ?? []),
  ]

  const stockItems = stocks.map((item) => ({
    name: item.name || item.symbol || '-',
    asset_category: item.asset_category || '',
    broker: item.broker || '',
    sector: item.sector || '',
    industry: item.industry || '',
    value_krw: item.value_krw || 0,
  }))

  const cashItems = (dashboard.cash ?? []).map((item) => ({
    name: item.name || '-',
    asset_category: item.asset_category || '',
    broker: item.broker || '',
    sector: item.sector || '',
    industry: item.industry || '',
    value_krw: item.value_krw || item.amount || 0,
  }))

  const goldItems = (dashboard.gold ?? []).map((item) => ({
    name: item.name || '-',
    asset_category: item.asset_category || '금(Gold)',
    broker: item.broker || '',
    sector: item.sector || '',
    industry: item.industry || '',
    value_krw: item.value_krw || 0,
  }))

  return [...stockItems, ...cashItems, ...goldItems].filter((item) => item.value_krw > 0)
}

export function aggregateByField(items, field, emptyLabel = '미분류', colorMap = null) {
  const totals = new Map()

  for (const item of items) {
    const key = item[field]?.trim() || emptyLabel
    totals.set(key, (totals.get(key) || 0) + item.value_krw)
  }

  const totalValue = Array.from(totals.values()).reduce((sum, value) => sum + value, 0)

  return Array.from(totals.entries())
    .map(([name, value], index) => ({
      name,
      value,
      percent: totalValue > 0 ? (value / totalValue) * 100 : 0,
      color: colorMap?.[name] ?? CHART_COLORS[index % CHART_COLORS.length],
    }))
    .sort((a, b) => b.value - a.value)
}

export function buildChartBreakdown(dashboard) {
  const items = flattenDashboardAssets(dashboard)

  return {
    items,
    totalValue: items.reduce((sum, item) => sum + item.value_krw, 0),
    byBroker: aggregateByField(items, 'broker'),
    bySector: aggregateByField(items, 'sector', '미분류', SECTOR_COLORS),
    byIndustry: aggregateByField(items, 'industry'),
    byAssetCategory: aggregateByField(items, 'asset_category'),
  }
}

export function buildSectorHistoryChartData(sectorHistory) {
  const sectors = sectorHistory?.sectors ?? []
  const timeline = sectorHistory?.timeline ?? []

  const sectorMeta = sectors.map((name, index) => ({
    name,
    color: SECTOR_COLORS[name] ?? CHART_COLORS[index % CHART_COLORS.length],
  }))

  const chartData = timeline.map((point) => {
    const row = {
      snapshot_version: point.snapshot_version,
      snapshot_at: point.snapshot_at,
      total_value_krw: point.total_value_krw,
    }
    for (const sector of sectors) {
      const entry = point.sectors?.[sector]
      row[sector] = entry?.percent ?? 0
      row[`${sector}__value`] = entry?.value_krw ?? 0
    }
    return row
  })

  return { sectorMeta, chartData }
}

export { CHART_COLORS }
