const CHART_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
  '#84cc16',
  '#f97316',
  '#6366f1',
]

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

  return [...stockItems, ...cashItems].filter((item) => item.value_krw > 0)
}

export function aggregateByField(items, field, emptyLabel = '미분류') {
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
      color: CHART_COLORS[index % CHART_COLORS.length],
    }))
    .sort((a, b) => b.value - a.value)
}

export function buildChartBreakdown(dashboard) {
  const items = flattenDashboardAssets(dashboard)

  return {
    items,
    totalValue: items.reduce((sum, item) => sum + item.value_krw, 0),
    byBroker: aggregateByField(items, 'broker'),
    bySector: aggregateByField(items, 'sector'),
    byIndustry: aggregateByField(items, 'industry'),
    byAssetCategory: aggregateByField(items, 'asset_category'),
  }
}

export { CHART_COLORS }
