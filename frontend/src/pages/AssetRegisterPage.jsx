import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import Layout from '../components/Layout'

const emptyDomesticRow = () => ({
  name: '',
  quantity: '',
  asset_category: '',
  broker: '',
  sector: '',
  industry: '',
})

const emptyForeignRow = () => ({
  symbol: '',
  name: '',
  quantity: '',
  asset_category: '',
  broker: '',
  sector: '',
  industry: '',
})

const emptyCashRow = () => ({
  name: '',
  amount: '',
  asset_category: '',
  broker: '',
  sector: '',
  industry: '',
})

const emptyGoldRow = () => ({
  name: '',
  quantity: '',
  asset_category: '금(Gold)',
  broker: '',
  sector: '',
  industry: '',
})

const EXTRA_FIELDS = [
  { key: 'asset_category', label: '자산 구분', placeholder: '예: 주식' },
  { key: 'broker', label: '증권사', placeholder: '예: 키움' },
  { key: 'sector', label: '섹터', placeholder: '예: IT' },
  { key: 'industry', label: '업종', placeholder: '예: 반도체' },
]

const CASH_EXTRA_FIELDS = [
  { key: 'asset_category', label: '자산 구분', placeholder: '예: 현금성' },
  { key: 'broker', label: '증권사', placeholder: '예: 키움' },
  { key: 'sector', label: '섹터', placeholder: '예: -' },
  { key: 'industry', label: '업종', placeholder: '예: -' },
]

function mapDomesticToRow(item) {
  return {
    name: item.name || '',
    quantity: String(item.quantity),
    asset_category: item.asset_category || '',
    broker: item.broker || '',
    sector: item.sector || '',
    industry: item.industry || '',
  }
}

function mapForeignToRow(item) {
  return {
    symbol: item.symbol || '',
    name: item.name || '',
    quantity: String(item.quantity),
    asset_category: item.asset_category || '',
    broker: item.broker || '',
    sector: item.sector || '',
    industry: item.industry || '',
  }
}

function mapCashToRow(item) {
  return {
    name: item.name || '',
    amount: String(item.amount),
    asset_category: item.asset_category || '',
    broker: item.broker || '',
    sector: item.sector || '',
    industry: item.industry || '',
  }
}

function mapGoldToRow(item) {
  return {
    name: item.name || '',
    quantity: String(item.quantity),
    asset_category: item.asset_category || '금(Gold)',
    broker: item.broker || '',
    sector: item.sector || '',
    industry: item.industry || '',
  }
}

function DomesticStockSection({ rows, onUpdate, onAdd, onRemove }) {
  return (
    <div className="holding-section">
      <div className="section-header">
        <h2>국내주식</h2>
        <p>종목명만 입력하면 됩니다. 종목코드는 자동으로 찾습니다. (예: 삼성전자, SK하이닉스)</p>
      </div>

      <div className="form-table-scroll">
        <div className="form-table form-table-domestic">
          <div className="form-row form-header form-row-domestic">
            <span>종목명</span>
            <span>수량</span>
            {EXTRA_FIELDS.map((field) => (
              <span key={field.key}>{field.label}</span>
            ))}
            <span />
          </div>

          {rows.map((row, index) => (
            <div className="form-row form-row-domestic" key={index}>
              <input
                type="text"
                placeholder="예: 삼성전자"
                value={row.name}
                onChange={(e) => onUpdate(index, 'name', e.target.value)}
                required={index === 0}
              />
              <input
                type="number"
                min="0"
                step="any"
                placeholder="0"
                value={row.quantity}
                onChange={(e) => onUpdate(index, 'quantity', e.target.value)}
              />
              {EXTRA_FIELDS.map((field) => (
                <input
                  key={field.key}
                  type="text"
                  placeholder={field.placeholder}
                  value={row[field.key]}
                  onChange={(e) => onUpdate(index, field.key, e.target.value)}
                />
              ))}
              <button
                type="button"
                className="btn-icon"
                onClick={() => onRemove(index)}
                aria-label="행 삭제"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      <button type="button" className="btn-secondary section-add-btn" onClick={onAdd}>
        + 국내주식 추가
      </button>
    </div>
  )
}

function DomesticEtfSection({ rows, onUpdate, onAdd, onRemove }) {
  return (
    <div className="holding-section">
      <div className="section-header">
        <h2>국내 ETF</h2>
        <p>
          ETF명만 입력하면 됩니다. KODEX, TIGER, RISE, SOL 등 국내 상장 ETF를 등록할 수 있습니다.
          (예: KODEX 미국AI전력핵심인프라)
        </p>
      </div>

      <div className="form-table-scroll">
        <div className="form-table form-table-domestic">
          <div className="form-row form-header form-row-domestic">
            <span>ETF명</span>
            <span>수량</span>
            {EXTRA_FIELDS.map((field) => (
              <span key={field.key}>{field.label}</span>
            ))}
            <span />
          </div>

          {rows.map((row, index) => (
            <div className="form-row form-row-domestic" key={index}>
              <input
                type="text"
                placeholder="예: KODEX 미국AI전력핵심인프라"
                value={row.name}
                onChange={(e) => onUpdate(index, 'name', e.target.value)}
                required={index === 0}
              />
              <input
                type="number"
                min="0"
                step="any"
                placeholder="0"
                value={row.quantity}
                onChange={(e) => onUpdate(index, 'quantity', e.target.value)}
              />
              {EXTRA_FIELDS.map((field) => (
                <input
                  key={field.key}
                  type="text"
                  placeholder={field.key === 'asset_category' ? '예: ETF' : field.placeholder}
                  value={row[field.key]}
                  onChange={(e) => onUpdate(index, field.key, e.target.value)}
                />
              ))}
              <button
                type="button"
                className="btn-icon"
                onClick={() => onRemove(index)}
                aria-label="행 삭제"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      <button type="button" className="btn-secondary section-add-btn" onClick={onAdd}>
        + 국내 ETF 추가
      </button>
    </div>
  )
}

function ForeignStockSection({ rows, onUpdate, onAdd, onRemove }) {
  return (
    <div className="holding-section">
      <div className="section-header">
        <h2>해외주식</h2>
        <p>티커 심볼을 입력합니다. (예: AAPL, TSLA, NVDA)</p>
      </div>

      <div className="form-table-scroll">
        <div className="form-table form-table-wide">
          <div className="form-row form-header form-row-wide">
            <span>티커</span>
            <span>종목명 (선택)</span>
            <span>수량</span>
            {EXTRA_FIELDS.map((field) => (
              <span key={field.key}>{field.label}</span>
            ))}
            <span />
          </div>

          {rows.map((row, index) => (
            <div className="form-row form-row-wide" key={index}>
              <input
                type="text"
                placeholder="예: AAPL"
                value={row.symbol}
                onChange={(e) => onUpdate(index, 'symbol', e.target.value)}
              />
              <input
                type="text"
                placeholder="종목명"
                value={row.name}
                onChange={(e) => onUpdate(index, 'name', e.target.value)}
              />
              <input
                type="number"
                min="0"
                step="any"
                placeholder="0"
                value={row.quantity}
                onChange={(e) => onUpdate(index, 'quantity', e.target.value)}
              />
              {EXTRA_FIELDS.map((field) => (
                <input
                  key={field.key}
                  type="text"
                  placeholder={field.placeholder}
                  value={row[field.key]}
                  onChange={(e) => onUpdate(index, field.key, e.target.value)}
                />
              ))}
              <button
                type="button"
                className="btn-icon"
                onClick={() => onRemove(index)}
                aria-label="행 삭제"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      <button type="button" className="btn-secondary section-add-btn" onClick={onAdd}>
        + 해외주식 추가
      </button>
    </div>
  )
}

function GoldSection({ rows, onUpdate, onAdd, onRemove, isEditMode = false }) {
  return (
    <div className="holding-section">
      <div className="section-header">
        <h2>금 (Gold)</h2>
        <p>
          보유량(g)을 입력합니다.
          {isEditMode
            ? ' 수정 저장 시 기존 g당 가격이 유지됩니다.'
            : ' 저장 시 COMEX 금 선물(USD/troy oz) → 원화/g 환산 후 100원 단위 절사 가격이 적용됩니다.'}
        </p>
      </div>

      <div className="form-table-scroll">
        <div className="form-table form-table-cash">
          <div className="form-row form-header form-row-cash">
            <span>자산명</span>
            <span>보유량 (g)</span>
            {CASH_EXTRA_FIELDS.map((field) => (
              <span key={field.key}>{field.label}</span>
            ))}
            <span />
          </div>

          {rows.map((row, index) => (
            <div className="form-row form-row-cash" key={index}>
              <input
                type="text"
                placeholder="예: 금 현물"
                value={row.name}
                onChange={(e) => onUpdate(index, 'name', e.target.value)}
              />
              <input
                type="number"
                min="0"
                step="any"
                placeholder="0"
                value={row.quantity}
                onChange={(e) => onUpdate(index, 'quantity', e.target.value)}
              />
              {CASH_EXTRA_FIELDS.map((field) => (
                <input
                  key={field.key}
                  type="text"
                  placeholder={field.placeholder}
                  value={row[field.key]}
                  onChange={(e) => onUpdate(index, field.key, e.target.value)}
                />
              ))}
              <button
                type="button"
                className="btn-icon"
                onClick={() => onRemove(index)}
                aria-label="행 삭제"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      <button type="button" className="btn-secondary section-add-btn" onClick={onAdd}>
        + 금(Gold) 추가
      </button>
    </div>
  )
}

function CashSection({ rows, onUpdate, onAdd, onRemove }) {
  return (
    <div className="holding-section">
      <div className="section-header">
        <h2>현금성 자산</h2>
        <p>원화(KRW) 금액으로 입력합니다. (예: CMA, MMF, 예금)</p>
      </div>

      <div className="form-table-scroll">
        <div className="form-table form-table-cash">
          <div className="form-row form-header form-row-cash">
            <span>자산명</span>
            <span>금액 (원)</span>
            {CASH_EXTRA_FIELDS.map((field) => (
              <span key={field.key}>{field.label}</span>
            ))}
            <span />
          </div>

          {rows.map((row, index) => (
            <div className="form-row form-row-cash" key={index}>
              <input
                type="text"
                placeholder="예: CMA"
                value={row.name}
                onChange={(e) => onUpdate(index, 'name', e.target.value)}
              />
              <input
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={row.amount}
                onChange={(e) => onUpdate(index, 'amount', e.target.value)}
              />
              {CASH_EXTRA_FIELDS.map((field) => (
                <input
                  key={field.key}
                  type="text"
                  placeholder={field.placeholder}
                  value={row[field.key]}
                  onChange={(e) => onUpdate(index, field.key, e.target.value)}
                />
              ))}
              <button
                type="button"
                className="btn-icon"
                onClick={() => onRemove(index)}
                aria-label="행 삭제"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      <button type="button" className="btn-secondary section-add-btn" onClick={onAdd}>
        + 현금성 자산 추가
      </button>
    </div>
  )
}

function formatSnapshotDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleString('ko-KR')
}

function applyAssetDataToForm(data, setters) {
  const {
    setDomesticRows,
    setEtfRows,
    setForeignRows,
    setCashRows,
    setGoldRows,
    setSnapshotAt,
  } = setters

  if (data.domestic?.length > 0) {
    setDomesticRows(data.domestic.map(mapDomesticToRow))
  }
  if (data.etf?.length > 0) {
    setEtfRows(data.etf.map(mapDomesticToRow))
  }
  if (data.foreign?.length > 0) {
    setForeignRows(data.foreign.map(mapForeignToRow))
  }
  if (data.cash?.length > 0) {
    setCashRows(data.cash.map(mapCashToRow))
  }
  if (data.gold?.length > 0) {
    setGoldRows(data.gold.map(mapGoldToRow))
  }
  setSnapshotAt(data.updated_at || data.snapshot_at || null)
}

export default function AssetRegisterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editVersionParam = searchParams.get('version')
  const editVersion =
    editVersionParam && /^\d+$/.test(editVersionParam) ? Number(editVersionParam) : null
  const isEditMode = editVersion != null

  const [domesticRows, setDomesticRows] = useState([emptyDomesticRow()])
  const [etfRows, setEtfRows] = useState([emptyDomesticRow()])
  const [foreignRows, setForeignRows] = useState([emptyForeignRow()])
  const [cashRows, setCashRows] = useState([emptyCashRow()])
  const [goldRows, setGoldRows] = useState([emptyGoldRow()])
  const [snapshotAt, setSnapshotAt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadAssets() {
      try {
        const data = isEditMode
          ? await api.getSnapshotAssets(editVersion)
          : await api.getAssets()
        applyAssetDataToForm(data, {
          setDomesticRows,
          setEtfRows,
          setForeignRows,
          setCashRows,
          setGoldRows,
          setSnapshotAt,
        })
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadAssets()
  }, [editVersion, isEditMode])

  const updateRows = (setter) => (index, field, value) => {
    setter((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
  }

  const removeDomesticRow = (index) => {
    setDomesticRows((prev) =>
      prev.length === 1 ? [emptyDomesticRow()] : prev.filter((_, i) => i !== index),
    )
  }

  const removeEtfRow = (index) => {
    setEtfRows((prev) =>
      prev.length === 1 ? [emptyDomesticRow()] : prev.filter((_, i) => i !== index),
    )
  }

  const removeForeignRow = (index) => {
    setForeignRows((prev) =>
      prev.length === 1 ? [emptyForeignRow()] : prev.filter((_, i) => i !== index),
    )
  }

  const removeCashRow = (index) => {
    setCashRows((prev) => (prev.length === 1 ? [emptyCashRow()] : prev.filter((_, i) => i !== index)))
  }

  const removeGoldRow = (index) => {
    setGoldRows((prev) => (prev.length === 1 ? [emptyGoldRow()] : prev.filter((_, i) => i !== index)))
  }

  const parseDomesticRows = (rows) =>
    rows
      .map((row) => ({
        name: row.name.trim(),
        quantity: Number(row.quantity),
        asset_category: row.asset_category.trim(),
        broker: row.broker.trim(),
        sector: row.sector.trim(),
        industry: row.industry.trim(),
      }))
      .filter((row) => row.name)

  const parseForeignRows = (rows) =>
    rows
      .map((row) => ({
        symbol: row.symbol.trim(),
        name: row.name.trim(),
        quantity: Number(row.quantity),
        asset_category: row.asset_category.trim(),
        broker: row.broker.trim(),
        sector: row.sector.trim(),
        industry: row.industry.trim(),
      }))
      .filter((row) => row.symbol)

  const parseCashRows = (rows) =>
    rows
      .map((row) => ({
        name: row.name.trim(),
        amount: Number(row.amount),
        asset_category: row.asset_category.trim(),
        broker: row.broker.trim(),
        sector: row.sector.trim(),
        industry: row.industry.trim(),
      }))
      .filter((row) => row.name)

  const parseGoldRows = (rows) =>
    rows
      .map((row) => ({
        name: row.name.trim(),
        quantity: Number(row.quantity),
        asset_category: row.asset_category.trim() || '금(Gold)',
        broker: row.broker.trim(),
        sector: row.sector.trim(),
        industry: row.industry.trim(),
      }))
      .filter((row) => row.name)

  const handleSave = async (event) => {
    event.preventDefault()
    setMessage(null)
    setError(null)

    const domestic = parseDomesticRows(domesticRows)
    const etf = parseDomesticRows(etfRows)
    const foreign = parseForeignRows(foreignRows)
    const cash = parseCashRows(cashRows)
    const gold = parseGoldRows(goldRows)
    const all = [...domestic, ...etf, ...foreign, ...cash, ...gold]

    if (all.length === 0) {
      setError('주식, ETF, 현금성 자산, 금 중 최소 1개 이상 입력해 주세요.')
      return
    }

    if (
      [...domestic, ...etf, ...foreign, ...gold].some(
        (row) => Number.isNaN(row.quantity) || row.quantity < 0,
      ) ||
      cash.some((row) => Number.isNaN(row.amount) || row.amount < 0)
    ) {
      setError('수량·금액은 0 이상의 숫자로 입력해 주세요.')
      return
    }

    setSaving(true)
    try {
      const payload = { domestic, etf, foreign, cash, gold }
      const result = isEditMode
        ? await api.updateSnapshotAssets(editVersion, payload)
        : await api.saveAssets(payload)
      setMessage(
        result.message ||
          (isEditMode
            ? `스냅샷 v${editVersion}이 수정되었습니다.`
            : `스냅샷 v${result.snapshot_version}이 저장되었습니다. 현재가가 함께 기록됩니다.`),
      )
      setTimeout(() => {
        navigate(isEditMode ? `/?version=${editVersion}` : '/')
      }, 1200)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Layout>
      <header className="header">
        <div>
          <p className="eyebrow">{isEditMode ? 'Snapshot Edit' : 'Asset Register'}</p>
          <h1>{isEditMode ? `스냅샷 v${editVersion} 수정` : '자산 등록'}</h1>
          <p className="subtitle">
            {isEditMode
              ? '선택한 스냅샷의 자산 내역을 수정합니다. snapshot_at과 저장 당시 가격은 유지되며, 수량 변경 시 기존 단가로 평가금액만 재계산됩니다.'
              : '저장 시 현재가 API로 가격을 조회해 새 스냅샷 버전으로 기록합니다.'}
          </p>
        </div>
        {isEditMode && (
          <div className="header-actions">
            <Link to={`/?version=${editVersion}`} className="btn-secondary">
              대시보드로
            </Link>
          </div>
        )}
      </header>

      {isEditMode && snapshotAt && (
        <div className="alert edit-mode-banner">
          v{editVersion} 수정 중 · 저장 시점(snapshot_at): {formatSnapshotDate(snapshotAt)}
        </div>
      )}

      {error && <div className="alert">{error}</div>}
      {message && <div className="alert success">{message}</div>}

      <section className="panel">
        {loading ? (
          <p className="empty-state">기존 데이터를 불러오는 중...</p>
        ) : (
          <form onSubmit={handleSave} className="register-form">
            <DomesticStockSection
              rows={domesticRows}
              onUpdate={updateRows(setDomesticRows)}
              onAdd={() => setDomesticRows((prev) => [...prev, emptyDomesticRow()])}
              onRemove={removeDomesticRow}
            />

            <DomesticEtfSection
              rows={etfRows}
              onUpdate={updateRows(setEtfRows)}
              onAdd={() => setEtfRows((prev) => [...prev, emptyDomesticRow()])}
              onRemove={removeEtfRow}
            />

            <ForeignStockSection
              rows={foreignRows}
              onUpdate={updateRows(setForeignRows)}
              onAdd={() => setForeignRows((prev) => [...prev, emptyForeignRow()])}
              onRemove={removeForeignRow}
            />

            <CashSection
              rows={cashRows}
              onUpdate={updateRows(setCashRows)}
              onAdd={() => setCashRows((prev) => [...prev, emptyCashRow()])}
              onRemove={removeCashRow}
            />

            <GoldSection
              rows={goldRows}
              onUpdate={updateRows(setGoldRows)}
              onAdd={() => setGoldRows((prev) => [...prev, emptyGoldRow()])}
              onRemove={removeGoldRow}
              isEditMode={isEditMode}
            />

            <div className="form-actions">
              {isEditMode && (
                <Link to={`/?version=${editVersion}`} className="btn-secondary">
                  취소
                </Link>
              )}
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? '저장 중...' : isEditMode ? '수정 저장' : '저장'}
              </button>
            </div>
          </form>
        )}
      </section>
    </Layout>
  )
}
