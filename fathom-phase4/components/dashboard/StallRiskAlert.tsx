// components/dashboard/StallRiskAlert.tsx
// Phase 4: Commitment & Trust Dynamics - Stall Risk Detection UI

'use client'

import { useEffect, useState } from 'react'
import { 
  getStallRisks, 
  getDemoStallRisks,
  StallRisk 
} from '@/lib/queries/stall-risks'
import { AlertTriangle, Clock, ArrowRight, Thermometer, Calendar } from 'lucide-react'

interface StallRiskAlertProps {
  useDemo?: boolean
  maxItems?: number
}

export function StallRiskAlert({ 
  useDemo = false, 
  maxItems = 5 
}: StallRiskAlertProps) {
  const [risks, setRisks] = useState<StallRisk[]>([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    if (useDemo) {
      setRisks(getDemoStallRisks())
      setLoading(false)
    } else {
      getStallRisks()
        .then(setRisks)
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [useDemo])

  if (loading) return <AlertSkeleton />
  if (risks.length === 0) return null // Hide entirely if no risks

  const highRisks = risks.filter(r => r.riskLevel === 'high')
  const mediumRisks = risks.filter(r => r.riskLevel === 'medium')
  const displayRisks = showAll ? risks : risks.slice(0, maxItems)

  return (
    <div className="bg-[var(--surface)] rounded-lg border border-[var(--signal-red)]/20 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--signal-red)]/10 bg-[var(--signal-red)]/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-[var(--signal-red)]" />
            <h3 className="text-sm font-medium text-[var(--signal-red)]">
              Stall Risk Alert
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {highRisks.length > 0 && (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-[var(--signal-red)]/10 text-[var(--signal-red)]">
                {highRisks.length} high
              </span>
            )}
            {mediumRisks.length > 0 && (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-[var(--signal-yellow)]/10 text-[var(--signal-yellow)]">
                {mediumRisks.length} at risk
              </span>
            )}
          </div>
        </div>
        <p className="text-xs text-[var(--text-secondary)] mt-1.5">
          Relationships exceeding expected stage duration
        </p>
      </div>

      {/* Risk Items */}
      <div className="divide-y divide-[var(--border-subtle)]">
        {/* High Risk Section */}
        {highRisks.length > 0 && (
          <div className="p-4">
            <p className="text-xs text-[var(--signal-red)] uppercase tracking-wider font-medium mb-3">
              High Risk ({highRisks.length})
            </p>
            <div className="space-y-2">
              {highRisks.slice(0, showAll ? undefined : 3).map(risk => (
                <RiskItem key={risk.relationship.id} risk={risk} />
              ))}
            </div>
          </div>
        )}

        {/* Medium Risk Section */}
        {mediumRisks.length > 0 && (
          <div className="p-4">
            <p className="text-xs text-[var(--signal-yellow)] uppercase tracking-wider font-medium mb-3">
              At Risk ({mediumRisks.length})
            </p>
            <div className="space-y-2">
              {mediumRisks.slice(0, showAll ? undefined : 2).map(risk => (
                <RiskItem key={risk.relationship.id} risk={risk} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* View All Button */}
      {risks.length > maxItems && (
        <div className="px-4 py-3 border-t border-[var(--border-subtle)] bg-[var(--surface-hover)]/50">
          <button 
            onClick={() => setShowAll(!showAll)}
            className="w-full flex items-center justify-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            {showAll ? 'Show less' : `View all ${risks.length} at-risk relationships`}
            <ArrowRight className={`w-3 h-3 transition-transform ${showAll ? 'rotate-90' : ''}`} />
          </button>
        </div>
      )}
    </div>
  )
}

function RiskItem({ risk }: { risk: StallRisk }) {
  const [expanded, setExpanded] = useState(false)
  
  return (
    <div 
      className="rounded-md border border-[var(--border-subtle)] overflow-hidden hover:border-[var(--border-hover)] transition-colors"
    >
      {/* Main row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 py-2.5 flex items-start justify-between text-left hover:bg-[var(--surface-hover)] transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-[var(--text-primary)] truncate">
              {risk.relationship.name}
            </p>
            <TemperatureBadge temp={risk.relationship.temperature} />
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            {risk.relationship.organization}
          </p>
        </div>
        
        <div className="text-right ml-3 flex-shrink-0">
          <div className="flex items-center gap-1.5 text-xs">
            <Clock className="w-3 h-3 text-[var(--text-tertiary)]" />
            <span className={`font-medium ${
              risk.riskLevel === 'high' 
                ? 'text-[var(--signal-red)]' 
                : 'text-[var(--signal-yellow)]'
            }`}>
              {risk.daysInStage}d
            </span>
            <span className="text-[var(--text-tertiary)]">
              in {risk.currentStage}
            </span>
          </div>
          <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">
            avg: {risk.avgDaysForStage}d
          </p>
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-3 py-2.5 bg-[var(--surface-hover)]/50 border-t border-[var(--border-subtle)]">
          {/* Risk factors */}
          {risk.riskFactors.length > 0 && (
            <div className="mb-2">
              <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                Risk Factors
              </p>
              <ul className="space-y-0.5">
                {risk.riskFactors.map((factor, i) => (
                  <li key={i} className="text-xs text-[var(--text-secondary)] flex items-start gap-1.5">
                    <span className="text-[var(--signal-red)]">•</span>
                    {factor}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Suggested action */}
          <div className="flex items-start gap-2 p-2 rounded bg-[var(--accent)]/5 border border-[var(--accent)]/10">
            <ArrowRight className="w-3.5 h-3.5 text-[var(--accent)] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] text-[var(--accent)] uppercase tracking-wider">
                Suggested Action
              </p>
              <p className="text-xs text-[var(--text-primary)] mt-0.5">
                {risk.suggestedAction}
              </p>
            </div>
          </div>

          {/* Last interaction */}
          {risk.lastInteraction && (
            <div className="flex items-center gap-1.5 mt-2 text-[10px] text-[var(--text-tertiary)]">
              <Calendar className="w-3 h-3" />
              Last contact: {formatDate(risk.lastInteraction)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function TemperatureBadge({ temp }: { temp: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    hot: { bg: 'bg-[var(--heat)]/10', text: 'text-[var(--heat)]', label: '🔥' },
    warm: { bg: 'bg-[var(--signal-yellow)]/10', text: 'text-[var(--signal-yellow)]', label: '☀️' },
    cool: { bg: 'bg-[var(--frost)]/10', text: 'text-[var(--frost)]', label: '❄️' },
    cold: { bg: 'bg-[var(--frost)]/10', text: 'text-[var(--frost)]', label: '🥶' },
    cooling: { bg: 'bg-[var(--frost)]/10', text: 'text-[var(--frost)]', label: '📉' },
  }

  const style = config[temp.toLowerCase()] || { 
    bg: 'bg-[var(--surface-hover)]', 
    text: 'text-[var(--text-tertiary)]', 
    label: '•' 
  }

  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  )
}

function AlertSkeleton() {
  return (
    <div className="bg-[var(--surface)] rounded-lg border border-[var(--border-subtle)] p-5 animate-pulse">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-4 h-4 bg-[var(--border-subtle)] rounded" />
        <div className="h-4 bg-[var(--border-subtle)] rounded w-28" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="p-3 rounded border border-[var(--border-subtle)]">
            <div className="h-4 bg-[var(--border-subtle)] rounded w-32 mb-2" />
            <div className="h-3 bg-[var(--border-subtle)] rounded w-24" />
          </div>
        ))}
      </div>
    </div>
  )
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  })
}

export default StallRiskAlert
