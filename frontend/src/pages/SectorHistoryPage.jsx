import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
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
import { api } from '../api/client'
import Layout from '../components/Layout'
import { buildSectorHistoryChartData, formatKRW } from '../utils/assetAggregation'
import { formatShortDate } from '../utils/performance'

function SectorHistoryTooltip({ active, payload, label, sectorMeta, selectedSector }) {
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
        <span
          key={row.name}
          style={{ fontWeight: selectedSector === row.name ? 700 : 400 }}
        >
          <span className="legend-dot" style={{ background: row.color, marginRight: 6 }} />
          {row.name}: {row.percent.toFixed(1)}% ({formatKRW(row.value)})
        </span>
      ))}
    </div>
  )
}

export default function SectorHistoryPage() {
  const [searchParams] = useSearchParams()
  const selectedSector = searchParams.get('sector')

  const [dashboard, setDashboard] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getDashboard()
        setDashboard(data)
        setError(null)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const { sectorMeta, chartData } = useMemo(
    () => buildSectorHistoryChartData(dashboard?.sector_history),
    [dashboard],
  )

  const displayData = useMemo(
    () =>
      chartData.map((point) => ({
        ...point,
        dateLabel: `v${point.snapshot_version} · ${formatShortDate(point.snapshot_at)}`,
      })),
    [chartData],
  )

  return (
    <Layout>
      <header className="header">
        <div>
          <p className="eyebrow">Sector History</p>
          <h1>섹터별 비중 추이</h1>
          <p className="subtitle">
            스냅샷별 총 자산을 100%로 두고, 섹터별 비중 변화를 영역 차트로 확인합니다.
          </p>
        </div>
        <div className="header-actions">
          <Link to="/charts" className="btn-secondary chart-link-btn">
            차트 분석으로
          </Link>
        </div>
      </header>

      {error && <div className="alert">백엔드 연결 실패: {error}</div>}

      <section className="panel">
        {loading ? (
          <p className="empty-state">데이터를 불러오는 중...</p>
        ) : displayData.length < 2 ? (
          <p className="empty-state">추이를 표시하려면 스냅샷을 2회 이상 저장해야 합니다.</p>
        ) : (
          <div style={{ width: '100%', height: 420 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={displayData} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid stroke="rgba(15, 23, 42, 0.07)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="dateLabel"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  content={
                    <SectorHistoryTooltip sectorMeta={sectorMeta} selectedSector={selectedSector} />
                  }
                />
                <Legend />
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
        )}
      </section>
    </Layout>
  )
}
