import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

export default function AssetRegisterPage() {
  const navigate = useNavigate()
  const [domesticRows, setDomesticRows] = useState([emptyDomesticRow()])
  const [etfRows, setEtfRows] = useState([emptyDomesticRow()])
  const [foreignRows, setForeignRows] = useState([emptyForeignRow()])
  const [cashRows, setCashRows] = useState([emptyCashRow()])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadAssets() {
      try {
        const data = await api.getAssets()
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
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadAssets()
  }, [])

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

  const handleSave = async (event) => {
    event.preventDefault()
    setMessage(null)
    setError(null)

    const domestic = parseDomesticRows(domesticRows)
    const etf = parseDomesticRows(etfRows)
    const foreign = parseForeignRows(foreignRows)
    const cash = parseCashRows(cashRows)
    const all = [...domestic, ...etf, ...foreign, ...cash]

    if (all.length === 0) {
      setError('주식, ETF 또는 현금성 자산 중 최소 1개 이상 입력해 주세요.')
      return
    }

    if (
      [...domestic, ...etf, ...foreign].some((row) => Number.isNaN(row.quantity) || row.quantity < 0) ||
      cash.some((row) => Number.isNaN(row.amount) || row.amount < 0)
    ) {
      setError('수량·금액은 0 이상의 숫자로 입력해 주세요.')
      return
    }

    setSaving(true)
    try {
      await api.saveAssets({ domestic, etf, foreign, cash })
      setMessage('저장되었습니다.')
      setTimeout(() => navigate('/'), 800)
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
          <p className="eyebrow">Asset Register</p>
          <h1>자산 등록</h1>
          <p className="subtitle">
            국내주식·국내 ETF는 이름만 입력하고, 해외주식은 티커 심볼을 입력합니다.
          </p>
        </div>
      </header>

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

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </form>
        )}
      </section>
    </Layout>
  )
}
