import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api } from '../api/client'
import Layout from '../components/Layout'
import { buildChartBreakdown, formatKRW } from '../utils/assetAggregation'

const DIMENSIONS = [
  { key: 'byBroker', label: '증권사별', description: '증권사 기준 자산 비중' },
  { key: 'bySector', label: '섹터별', description: '섹터 기준 자산 비중' },
  { key: 'byIndustry', label: '업종별', description: '업종 기준 자산 비중' },
  { key: 'byAssetCategory', label: '자산 구분별', description: '자산 구분 기준 자산 비중' },
]

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null

  const item = payload[0].payload
  return (
    <div className="chart-tooltip">
      <strong>{item.name}</strong>
      <span>{formatKRW(item.value)}</span>
      <span>{item.percent.toFixed(1)}%</span>
    </div>
  )
}

function BreakdownPanel({ title, description, data }) {
  if (data.length === 0) {
    return (
      <article className="chart-panel">
        <div className="panel-header">
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <p className="empty-state">표시할 데이터가 없습니다.</p>
      </article>
    )
  }

  return (
    <article className="chart-panel">
      <div className="panel-header">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>

      <div className="chart-panel-body">
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={58}
                outerRadius={96}
                paddingAngle={2}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-wrap chart-wrap-bar">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data} layout="vertical" margin={{ left: 8, right: 8 }}>
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                width={88}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <ul className="chart-legend">
        {data.map((item) => (
          <li key={item.name}>
            <span className="legend-dot" style={{ background: item.color }} />
            <span className="legend-name">{item.name}</span>
            <span className="legend-value">{formatKRW(item.value)}</span>
            <span className="legend-percent">{item.percent.toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </article>
  )
}

export default function ChartDashboardPage() {
  const [dashboard, setDashboard] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeDimension, setActiveDimension] = useState('byBroker')

  useEffect(() => {
    async function loadDashboard() {
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

    loadDashboard()
  }, [])

  const breakdown = useMemo(() => buildChartBreakdown(dashboard), [dashboard])
  const activeData = breakdown[DIMENSIONS.find((d) => d.key === activeDimension)?.key] ?? []
  const activeMeta = DIMENSIONS.find((d) => d.key === activeDimension)

  return (
    <Layout>
      <header className="header">
        <div>
          <p className="eyebrow">Chart Dashboard</p>
          <h1>차트 분석</h1>
          <p className="subtitle">
            증권사, 섹터, 업종, 자산 구분 기준으로 자산 비중을 차트로 확인합니다.
          </p>
        </div>
      </header>

      {error && <div className="alert">백엔드 연결 실패: {error}</div>}

      <section className="stats-grid">
        <article className="stat-card stat-card-highlight">
          <span className="stat-label">총 자산</span>
          <strong className="stat-value stat-value-sm">
            {loading ? '-' : formatKRW(breakdown.totalValue)}
          </strong>
        </article>
        <article className="stat-card">
          <span className="stat-label">분류 항목 수</span>
          <strong className="stat-value">{loading ? '-' : breakdown.items.length}</strong>
        </article>
        <article className="stat-card">
          <Link to="/" className="link-button">
            테이블 대시보드
          </Link>
        </article>
      </section>

      {loading ? (
        <section className="panel">
          <p className="empty-state">차트 데이터를 불러오는 중...</p>
        </section>
      ) : breakdown.items.length === 0 ? (
        <section className="panel">
          <p className="empty-state">
            등록된 자산이 없습니다.{' '}
            <Link to="/register">자산 등록 페이지</Link>에서 추가해 주세요.
          </p>
        </section>
      ) : (
        <>
          <section className="panel chart-tabs-panel">
            <div className="chart-tabs">
              {DIMENSIONS.map((dimension) => (
                <button
                  key={dimension.key}
                  type="button"
                  className={`chart-tab ${activeDimension === dimension.key ? 'active' : ''}`}
                  onClick={() => setActiveDimension(dimension.key)}
                >
                  {dimension.label}
                </button>
              ))}
            </div>

            <BreakdownPanel
              title={activeMeta.label}
              description={activeMeta.description}
              data={activeData}
            />
          </section>

          <section className="chart-grid">
            {DIMENSIONS.map((dimension) => (
              <BreakdownPanel
                key={dimension.key}
                title={dimension.label}
                description={dimension.description}
                data={breakdown[dimension.key]}
              />
            ))}
          </section>
        </>
      )}
    </Layout>
  )
}
