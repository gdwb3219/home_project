import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  buildRebalancePlan,
  formatKRW,
  loadRebalanceTargets,
  saveRebalanceTargets,
} from '../utils/assetAggregation'

const DRIFT_THRESHOLD_PCT = 3

function DiffTooltip({ active, payload }) {
  if (!active || !payload?.length) return null

  const item = payload[0].payload
  return (
    <div className="chart-tooltip">
      <strong>{item.name}</strong>
      <span>
        현재 {item.currentPercent.toFixed(1)}% → 목표 {item.targetPercent.toFixed(1)}%
      </span>
      <span>
        {item.diffValue >= 0 ? '매수 필요' : '매도 필요'} {formatKRW(Math.abs(item.diffValue))}
      </span>
    </div>
  )
}

export default function RebalancePanel({ sectorData, totalValue }) {
  const [targets, setTargets] = useState(() => loadRebalanceTargets())

  useEffect(() => {
    saveRebalanceTargets(targets)
  }, [targets])

  const plan = useMemo(
    () => buildRebalancePlan(sectorData, targets, totalValue),
    [sectorData, targets, totalValue],
  )

  const targetSum = plan.reduce((sum, row) => sum + (row.targetPercent || 0), 0)

  function handleTargetChange(name, value) {
    const numeric = value === '' ? 0 : Number(value)
    setTargets((prev) => ({ ...prev, [name]: Number.isNaN(numeric) ? 0 : numeric }))
  }

  function handleEqualizeTargets() {
    if (sectorData.length === 0) return
    const equal = Math.round((100 / sectorData.length) * 10) / 10
    const next = {}
    sectorData.forEach((item) => {
      next[item.name] = equal
    })
    setTargets(next)
  }

  function handleUseCurrentAsTarget() {
    const next = {}
    sectorData.forEach((item) => {
      next[item.name] = Math.round(item.percent * 10) / 10
    })
    setTargets(next)
  }

  if (sectorData.length === 0) return null

  return (
    <article className="chart-panel rebalance-panel">
      <div className="panel-header">
        <h2>리밸런싱 플래너</h2>
        <p>섹터별 목표 비중을 입력하면 현재 비중과의 차이, 매수·매도 필요 금액을 계산합니다.</p>
      </div>

      <div className="rebalance-actions">
        <button type="button" className="btn-secondary" onClick={handleEqualizeTargets}>
          균등 비중으로 설정
        </button>
        <button type="button" className="btn-secondary" onClick={handleUseCurrentAsTarget}>
          현재 비중을 목표로 저장
        </button>
        <span className={`rebalance-target-sum ${Math.abs(targetSum - 100) > 0.1 ? 'is-off' : ''}`}>
          목표 비중 합계: {targetSum.toFixed(1)}%
        </span>
      </div>

      <div className="rebalance-table-wrap">
        <table>
          <thead>
            <tr>
              <th>섹터</th>
              <th>현재 비중</th>
              <th>목표 비중</th>
              <th>차이</th>
              <th>조정 금액</th>
              <th>액션</th>
            </tr>
          </thead>
          <tbody>
            {plan.map((row) => {
              const needsAction = Math.abs(row.diffPercent) >= DRIFT_THRESHOLD_PCT
              return (
                <tr key={row.name} className={needsAction ? 'rebalance-row-alert' : ''}>
                  <td>
                    <span className="legend-dot" style={{ background: row.color, marginRight: 6 }} />
                    {row.name}
                  </td>
                  <td>
                    {row.currentPercent.toFixed(1)}%
                    <span className="sub-label"> · {formatKRW(row.currentValue)}</span>
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={row.targetPercent}
                      onChange={(e) => handleTargetChange(row.name, e.target.value)}
                      className="rebalance-target-input"
                    />
                    %
                  </td>
                  <td className={row.diffPercent >= 0 ? 'change-positive' : 'change-negative'}>
                    {row.diffPercent >= 0 ? '+' : ''}
                    {row.diffPercent.toFixed(1)}%p
                  </td>
                  <td className={row.diffValue >= 0 ? 'change-positive' : 'change-negative'}>
                    {row.diffValue >= 0 ? '+' : ''}
                    {formatKRW(row.diffValue)}
                  </td>
                  <td>
                    {needsAction ? (
                      <span className={`rebalance-tag ${row.diffValue >= 0 ? 'buy' : 'sell'}`}>
                        {row.diffValue >= 0 ? '매수' : '매도'}
                      </span>
                    ) : (
                      <span className="rebalance-tag hold">유지</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="chart-wrap" style={{ marginTop: '1.5rem' }}>
        <ResponsiveContainer width="100%" height={Math.max(220, plan.length * 40)}>
          <BarChart data={plan} layout="vertical" margin={{ left: 8, right: 24 }}>
            <XAxis
              type="number"
              tickFormatter={(value) => `${value}%p`}
              tick={{ fill: '#64748b', fontSize: 12 }}
            />
            <YAxis type="category" dataKey="name" width={88} tick={{ fill: '#64748b', fontSize: 12 }} />
            <Tooltip content={<DiffTooltip />} />
            <Bar dataKey="diffPercent" radius={[0, 6, 6, 0]}>
              {plan.map((row) => (
                <Cell key={row.name} fill={row.diffPercent >= 0 ? '#16a34a' : '#dc2626'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </article>
  )
}
