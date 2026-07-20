import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import Layout from '../components/Layout'
import SectorTrendChart from '../components/SectorTrendChart'

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
        ) : (
          <SectorTrendChart
            sectorHistory={dashboard?.sector_history}
            selectedSector={selectedSector}
            height={420}
          />
        )}
      </section>
    </Layout>
  )
}
