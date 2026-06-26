import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import Layout from '../components/Layout'

function formatKRW(value) {
  if (value == null) return '-'
  return `${Math.round(value).toLocaleString('ko-KR')}원`
}

function formatPrice(price, currency) {
  if (price == null) return '-'
  if (currency === 'USD') {
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  return `${Math.round(price).toLocaleString('ko-KR')}원`
}

function StockTable({ title, holdings, showUsdNote, usdKrwRate }) {
  if (holdings.length === 0) return null

  const subtotal = holdings.reduce((sum, item) => sum + (item.value_krw || 0), 0)

  return (
    <div className="holdings-block">
      <div className="panel-header">
        <h2>{title}</h2>
        {showUsdNote && usdKrwRate && (
          <p>환율 기준: 1 USD = {Math.round(usdKrwRate).toLocaleString('ko-KR')}원</p>
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
            <th>현재가</th>
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
        <p>원화(KRW) 기준 금액입니다.</p>
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

export default function DashboardPage() {
  const [health, setHealth] = useState(null)
  const [dashboard, setDashboard] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadDashboard = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const [healthData, dashboardData] = await Promise.all([
        api.getHealth(),
        api.getDashboard(),
      ])
      setHealth(healthData)
      setDashboard(dashboardData)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const summary = dashboard?.summary
  const totalCount =
    (summary?.domestic_count ?? 0) +
    (summary?.foreign_count ?? 0) +
    (summary?.cash_count ?? 0)
  const hasAssets = totalCount > 0

  return (
    <Layout>
      <header className="header">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>자산 대시보드</h1>
          <p className="subtitle">주식 현재가와 현금성 자산을 합산해 총 자산을 확인합니다.</p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => loadDashboard(true)}
            disabled={loading || refreshing}
          >
            {refreshing ? '갱신 중...' : '현재가 새로고침'}
          </button>
          <div className={`status-badge ${health ? 'online' : 'offline'}`}>
            {loading ? '연결 확인 중...' : health ? 'API 연결됨' : 'API 오프라인'}
          </div>
        </div>
      </header>

      {error && <div className="alert">백엔드 연결 실패: {error}</div>}

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
      </section>

      <section className="panel">
        {loading ? (
          <p className="empty-state">데이터를 불러오는 중...</p>
        ) : !hasAssets ? (
          <p className="empty-state">
            등록된 자산이 없습니다.{' '}
            <Link to="/register">자산 등록 페이지</Link>에서 추가해 주세요.
          </p>
        ) : (
          <>
            <StockTable
              title="국내주식"
              holdings={dashboard.domestic}
              usdKrwRate={dashboard.usd_krw_rate}
            />
            <StockTable
              title="해외주식"
              holdings={dashboard.foreign}
              showUsdNote
              usdKrwRate={dashboard.usd_krw_rate}
            />
            <CashTable holdings={dashboard.cash} />
            <div className="total-bar">
              <span>전체 자산</span>
              <strong>{formatKRW(summary?.total_value_krw)}</strong>
            </div>
          </>
        )}
      </section>
    </Layout>
  )
}
