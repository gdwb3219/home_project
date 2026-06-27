import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api } from '../api/client'
import Layout from '../components/Layout'
import {
  CATEGORY_SERIES,
  buildTimelineChartData,
  changeClassName,
  formatChangeKRW,
  formatChangePct,
  formatKRW,
  formatPeriodRange,
  formatShortDate,
} from '../utils/performance'

function PerformanceTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  const point = payload[0].payload
  return (
    <div className="chart-tooltip">
      <strong>
        v{point.snapshot_version} · {formatShortDate(point.snapshot_at)}
      </strong>
      {payload.map((entry) => (
        <span key={entry.dataKey}>
          {entry.name}: {formatKRW(entry.value)}
        </span>
      ))}
      {label && <span>{label}</span>}
    </div>
  )
}

function PerformanceComparisonCard({ title, comparison }) {
  if (!comparison) {
    return (
      <article className="stat-card">
        <span className="stat-label">{title}</span>
        <strong className="stat-value stat-value-sm">-</strong>
        <span className="stat-sub">비교할 이전 스냅샷이 없습니다.</span>
      </article>
    )
  }

  const { total, from_at: fromAt, to_at: toAt, days } = comparison
  const changeKrw = total?.change_krw
  const changePct = total?.change_pct

  return (
    <article className="stat-card">
      <span className="stat-label">{title}</span>
      <strong className={`stat-value stat-value-sm ${changeClassName(changeKrw)}`}>
        {formatChangeKRW(changeKrw)}
      </strong>
      <span className={`stat-sub ${changeClassName(changePct)}`}>{formatChangePct(changePct)}</span>
      <span className="stat-sub">{formatPeriodRange(fromAt, toAt)}</span>
      {days != null && <span className="stat-sub">{days}일 경과</span>}
    </article>
  )
}

function PerformanceSection({ performance, loading }) {
  const timeline = performance?.timeline ?? []
  const periods = performance?.periods ?? []
  const chartData = useMemo(() => buildTimelineChartData(timeline), [timeline])
  const [activeSeries, setActiveSeries] = useState(['total_value_krw'])

  const toggleSeries = (key) => {
    setActiveSeries((prev) => {
      if (prev.includes(key)) {
        if (prev.length === 1) return prev
        return prev.filter((item) => item !== key)
      }
      return [...prev, key]
    })
  }

  if (loading) {
    return (
      <section className="panel performance-section">
        <div className="panel-header">
          <h2>기간별 자산 실적</h2>
          <p>스냅샷 저장 시점(snapshot_at) 기준 자산 변동을 확인합니다.</p>
        </div>
        <p className="empty-state">실적 데이터를 불러오는 중...</p>
      </section>
    )
  }

  if (timeline.length === 0) {
    return null
  }

  return (
    <section className="panel performance-section">
      <div className="panel-header">
        <h2>기간별 자산 실적</h2>
        <p>
          자산 등록 저장 시 기록되는 snapshot_at을 기준으로, 스냅샷 간 평가금액 변동을
          확인합니다.
        </p>
      </div>

      <div className="performance-summary-grid">
        <PerformanceComparisonCard title="직전 저장 대비" comparison={performance?.vs_previous} />
        <PerformanceComparisonCard title="최초 저장 대비" comparison={performance?.vs_first} />
        <article className="stat-card">
          <span className="stat-label">저장 이력</span>
          <strong className="stat-value">{performance?.snapshot_count ?? 0}회</strong>
          <span className="stat-sub">기간 구간 {periods.length}개</span>
        </article>
      </div>

      <div className="chart-tabs">
        {CATEGORY_SERIES.map((series) => (
          <button
            key={series.key}
            type="button"
            className={`chart-tab ${activeSeries.includes(series.key) ? 'active' : ''}`}
            onClick={() => toggleSeries(series.key)}
          >
            {series.label}
          </button>
        ))}
      </div>

      <div className="performance-chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
            <CartesianGrid stroke="rgba(148, 163, 184, 0.15)" strokeDasharray="3 3" />
            <XAxis
              dataKey="dateLabel"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${Math.round(value / 10000)}만`}
            />
            <Tooltip content={<PerformanceTooltip />} />
            <Legend />
            {CATEGORY_SERIES.filter((series) => activeSeries.includes(series.key)).map(
              (series) => (
                <Line
                  key={series.key}
                  type="monotone"
                  dataKey={series.key}
                  name={series.label}
                  stroke={series.color}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ),
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {periods.length > 0 ? (
        <div className="performance-table-wrap">
          <table className="performance-table">
            <thead>
              <tr>
                <th>구간</th>
                <th>기간</th>
                <th>일수</th>
                <th>시작 총자산</th>
                <th>종료 총자산</th>
                <th>증감액</th>
                <th>증감률</th>
              </tr>
            </thead>
            <tbody>
              {periods.map((period) => (
                <tr key={`${period.from_version}-${period.to_version}`}>
                  <td>
                    v{period.from_version} → v{period.to_version}
                  </td>
                  <td className="sub-label">{formatPeriodRange(period.from_at, period.to_at)}</td>
                  <td>{period.days ?? '-'}일</td>
                  <td>{formatKRW(period.total?.from_value_krw)}</td>
                  <td>{formatKRW(period.total?.to_value_krw)}</td>
                  <td className={changeClassName(period.total?.change_krw)}>
                    {formatChangeKRW(period.total?.change_krw)}
                  </td>
                  <td className={changeClassName(period.total?.change_pct)}>
                    {formatChangePct(period.total?.change_pct)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="empty-state">기간별 실적은 스냅샷을 2회 이상 저장하면 표시됩니다.</p>
      )}
    </section>
  )
}

function formatPrice(price, currency) {
  if (price == null) return '-'
  if (currency === 'USD') {
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  return `${Math.round(price).toLocaleString('ko-KR')}원`
}

function formatSnapshotDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleString('ko-KR')
}

function StockTable({ title, holdings, showUsdNote, usdKrwRate }) {
  if (holdings.length === 0) return null

  const subtotal = holdings.reduce((sum, item) => sum + (item.value_krw || 0), 0)

  return (
    <div className="holdings-block">
      <div className="panel-header">
        <h2>{title}</h2>
        {showUsdNote && usdKrwRate && (
          <p>스냅샷 기준 환율: 1 USD = {Math.round(usdKrwRate).toLocaleString('ko-KR')}원</p>
        )}
      </div>

      <table>
        <thead>
          <tr>
            <th>종목명</th>
            <th>종목코드</th>
            <th>자산 구분</th>
            <th>증권사</th>
            <th>섹터</th>
            <th>업종</th>
            <th>수량</th>
            <th>저장 시점가</th>
            <th>평가금액</th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((holding, index) => (
            <tr key={`${title}-${index}-${holding.symbol}-${holding.broker}`}>
              <td>{holding.name || '-'}</td>
              <td>{holding.symbol || '-'}</td>
              <td>{holding.asset_category || '-'}</td>
              <td>{holding.broker || '-'}</td>
              <td>{holding.sector || '-'}</td>
              <td>{holding.industry || '-'}</td>
              <td>{holding.quantity}</td>
              <td>
                {holding.price_error ? (
                  <span className="price-error">{holding.price_error}</span>
                ) : (
                  formatPrice(holding.price, holding.currency)
                )}
              </td>
              <td className="value-cell">{formatKRW(holding.value_krw)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={8} className="subtotal-label">
              {title} 소계
            </td>
            <td className="value-cell subtotal-value">{formatKRW(subtotal)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

function CashTable({ holdings }) {
  if (holdings.length === 0) return null

  const subtotal = holdings.reduce((sum, item) => sum + (item.value_krw || 0), 0)

  return (
    <div className="holdings-block">
      <div className="panel-header">
        <h2>현금성 자산</h2>
        <p>스냅샷 저장 시점 원화(KRW) 금액입니다.</p>
      </div>

      <table>
        <thead>
          <tr>
            <th>자산명</th>
            <th>자산 구분</th>
            <th>증권사</th>
            <th>섹터</th>
            <th>업종</th>
            <th>금액</th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((item, index) => (
            <tr key={`cash-${index}-${item.name}-${item.broker}`}>
              <td>{item.name}</td>
              <td>{item.asset_category || '-'}</td>
              <td>{item.broker || '-'}</td>
              <td>{item.sector || '-'}</td>
              <td>{item.industry || '-'}</td>
              <td className="value-cell">{formatKRW(item.amount)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={5} className="subtotal-label">
              현금성 자산 소계
            </td>
            <td className="value-cell subtotal-value">{formatKRW(subtotal)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

function GoldTable({ holdings, goldUsdPerOz, usdKrwRate }) {
  if (holdings.length === 0) return null

  const subtotal = holdings.reduce((sum, item) => sum + (item.value_krw || 0), 0)

  return (
    <div className="holdings-block">
      <div className="panel-header">
        <h2>금 (Gold)</h2>
        <p>
          COMEX 금 선물(USD/troy oz) → 원화/g 환산, 100원 단위 절사 가격입니다.
          {goldUsdPerOz != null && usdKrwRate != null && (
            <>
              {' '}
              (기준: ${goldUsdPerOz.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/oz,
              1 USD = {Math.round(usdKrwRate).toLocaleString('ko-KR')}원)
            </>
          )}
        </p>
      </div>

      <table>
        <thead>
          <tr>
            <th>자산명</th>
            <th>자산 구분</th>
            <th>증권사</th>
            <th>섹터</th>
            <th>업종</th>
            <th>보유량 (g)</th>
            <th>g당 가격</th>
            <th>평가금액</th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((item, index) => (
            <tr key={`gold-${index}-${item.name}-${item.broker}`}>
              <td>{item.name}</td>
              <td>{item.asset_category || '금(Gold)'}</td>
              <td>{item.broker || '-'}</td>
              <td>{item.sector || '-'}</td>
              <td>{item.industry || '-'}</td>
              <td>{item.quantity}</td>
              <td>
                {item.price_error ? (
                  <span className="price-error">{item.price_error}</span>
                ) : (
                  formatKRW(item.price)
                )}
              </td>
              <td className="value-cell">{formatKRW(item.value_krw)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={7} className="subtotal-label">
              금(Gold) 소계
            </td>
            <td className="value-cell subtotal-value">{formatKRW(subtotal)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

export default function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [health, setHealth] = useState(null)
  const [dashboard, setDashboard] = useState(null)
  const [snapshots, setSnapshots] = useState([])
  const [selectedVersion, setSelectedVersion] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadDashboard = async (version, isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const [healthData, snapshotList, dashboardData] = await Promise.all([
        api.getHealth(),
        api.getSnapshots(),
        api.getDashboard(version ? { version } : {}),
      ])
      setHealth(healthData)
      setSnapshots(snapshotList.snapshots ?? [])
      setDashboard(dashboardData)
      setSelectedVersion(
        dashboardData.snapshot_version != null ? String(dashboardData.snapshot_version) : '',
      )
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    const versionFromUrl = searchParams.get('version')
    loadDashboard(versionFromUrl || undefined)
  }, [])

  const handleVersionChange = (event) => {
    const version = event.target.value
    setSelectedVersion(version)
    if (version) {
      setSearchParams({ version })
    } else {
      setSearchParams({})
    }
    loadDashboard(version || undefined, true)
  }

  const summary = dashboard?.summary
  const totalCount =
    (summary?.domestic_count ?? 0) +
    (summary?.etf_count ?? 0) +
    (summary?.foreign_count ?? 0) +
    (summary?.cash_count ?? 0) +
    (summary?.gold_count ?? 0)
  const hasAssets = totalCount > 0

  return (
    <Layout>
      <header className="header">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>자산 대시보드</h1>
          <p className="subtitle">
            저장된 스냅샷 기준으로 자산을 확인합니다. 가격은 저장 시점 데이터입니다.
          </p>
        </div>
        <div className="header-actions">
          <Link to="/charts" className="btn-secondary chart-link-btn">
            차트 분석
          </Link>
          <div className={`status-badge ${health ? 'online' : 'offline'}`}>
            {loading ? '연결 확인 중...' : health ? 'API 연결됨' : 'API 오프라인'}
          </div>
        </div>
      </header>

      {error && <div className="alert">백엔드 연결 실패: {error}</div>}

      {!loading && snapshots.length > 0 && (
        <section className="panel snapshot-selector-panel">
          <div className="snapshot-selector">
            <label htmlFor="snapshot-version">스냅샷 이력</label>
            <select
              id="snapshot-version"
              value={selectedVersion}
              onChange={handleVersionChange}
              disabled={refreshing}
            >
              {snapshots.map((snap) => (
                <option key={snap.snapshot_id} value={snap.snapshot_version}>
                  v{snap.snapshot_version} · {formatSnapshotDate(snap.snapshot_at)} ·{' '}
                  {formatKRW(snap.total_value_krw)}
                </option>
              ))}
            </select>
            {dashboard?.snapshot_at && (
              <span className="snapshot-meta">
                저장 시점: {formatSnapshotDate(dashboard.snapshot_at)}
              </span>
            )}
            {selectedVersion && (
              <Link to={`/register?version=${selectedVersion}`} className="btn-secondary snapshot-edit-btn">
                v{selectedVersion} 수정
              </Link>
            )}
          </div>
        </section>
      )}

      <PerformanceSection performance={dashboard?.performance} loading={loading} />

      <section className="stats-grid">
        <article className="stat-card stat-card-highlight">
          <span className="stat-label">총 자산</span>
          <strong className="stat-value stat-value-sm">
            {loading ? '-' : formatKRW(summary?.total_value_krw)}
          </strong>
        </article>
        <article className="stat-card">
          <span className="stat-label">국내주식</span>
          <strong className="stat-value stat-value-sm">
            {loading ? '-' : formatKRW(summary?.domestic_value_krw)}
          </strong>
        </article>
        <article className="stat-card">
          <span className="stat-label">국내 ETF</span>
          <strong className="stat-value stat-value-sm">
            {loading ? '-' : formatKRW(summary?.etf_value_krw)}
          </strong>
        </article>
        <article className="stat-card">
          <span className="stat-label">해외주식</span>
          <strong className="stat-value stat-value-sm">
            {loading ? '-' : formatKRW(summary?.foreign_value_krw)}
          </strong>
        </article>
        <article className="stat-card">
          <span className="stat-label">현금성 자산</span>
          <strong className="stat-value stat-value-sm">
            {loading ? '-' : formatKRW(summary?.cash_value_krw)}
          </strong>
        </article>
        <article className="stat-card">
          <span className="stat-label">금 (Gold)</span>
          <strong className="stat-value stat-value-sm">
            {loading ? '-' : formatKRW(summary?.gold_value_krw)}
          </strong>
        </article>
      </section>

      <section className="panel">
        {loading ? (
          <p className="empty-state">스냅샷 데이터를 불러오는 중...</p>
        ) : !hasAssets ? (
          <p className="empty-state">
            저장된 스냅샷이 없습니다.{' '}
            <Link to="/register">자산 등록 페이지</Link>에서 저장해 주세요.
          </p>
        ) : (
          <>
            <StockTable
              title="국내주식"
              holdings={dashboard.domestic}
              usdKrwRate={dashboard.usd_krw_rate}
            />
            <StockTable
              title="국내 ETF"
              holdings={dashboard.etf}
              usdKrwRate={dashboard.usd_krw_rate}
            />
            <StockTable
              title="해외주식"
              holdings={dashboard.foreign}
              showUsdNote
              usdKrwRate={dashboard.usd_krw_rate}
            />
            <CashTable holdings={dashboard.cash} />
            <GoldTable
              holdings={dashboard.gold ?? []}
              goldUsdPerOz={dashboard.gold_usd_per_oz}
              usdKrwRate={dashboard.usd_krw_rate}
            />
            <div className="total-bar">
              <span>
                전체 자산
                {dashboard.snapshot_version != null && ` (v${dashboard.snapshot_version})`}
              </span>
              <strong>{formatKRW(summary?.total_value_krw)}</strong>
            </div>
          </>
        )}
      </section>
    </Layout>
  )
}
