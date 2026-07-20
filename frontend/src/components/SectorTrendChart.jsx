import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { buildSectorHistoryChartData, formatKRW } from '../utils/assetAggregation'
import { formatShortDate } from '../utils/performance'

function SectorTrendTooltip({ active, payload, label, sectorMeta, selectedSector }) {
  if (!active || !payload?.length) return null

  const point = payload[0]?.payload
  const rows = sectorMeta
    .map((meta) => ({
      ...meta,
      percent: point?.[meta.name] ?? 0,
      value: point?.[`${meta.name}__value`] ?? 0,
    }))
    .sort((a, b) => b.value - a.value)

  return (
    <div className="chart-tooltip">
      <strong>
        {label} · 총 {formatKRW(point?.total_value_krw)}
      </strong>
      {rows.map((row) => (
        <span key={row.name} style={{ fontWeight: selectedSector === row.name ? 700 : 400 }}>
          <span className="legend-dot" style={{ background: row.color, marginRight: 6 }} />
          {row.name}: {row.percent.toFixed(1)}% ({formatKRW(row.value)})
        </span>
      ))}
    </div>
  )
}

export default function SectorTrendChart({
  sectorHistory,
  height = 420,
  selectedSector = null,
  showLegend = true,
}) {
  const { sectorMeta, chartData } = useMemo(
    () => buildSectorHistoryChartData(sectorHistory),
    [sectorHistory],
  )

  const displayData = useMemo(
    () =>
      chartData.map((point) => ({
        ...point,
        dateLabel: `v${point.snapshot_version} · ${formatShortDate(point.snapshot_at)}`,
      })),
    [chartData],
  )

  if (displayData.length < 2) {
    return <p className="empty-state">추이를 표시하려면 스냅샷을 2회 이상 저장해야 합니다.</p>
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={displayData} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid stroke="rgba(15, 23, 42, 0.07)" strokeDasharray="3 3" />
          <XAxis dataKey="dateLabel" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
            tick={{ fill: '#64748b', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            content={
              <SectorTrendTooltip sectorMeta={sectorMeta} selectedSector={selectedSector} />
            }
          />
          {showLegend && <Legend />}
          {sectorMeta.map((meta) => (
            <Area
              key={meta.name}
              type="monotone"
              dataKey={meta.name}
              name={meta.name}
              stackId="sector"
              stroke={meta.color}
              fill={meta.color}
              fillOpacity={selectedSector && selectedSector !== meta.name ? 0.25 : 0.85}
              strokeWidth={selectedSector === meta.name ? 2.5 : 1}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
