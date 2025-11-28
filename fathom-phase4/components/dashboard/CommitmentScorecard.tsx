// components/dashboard/CommitmentScorecard.tsx
// Phase 4: Commitment & Trust Dynamics - Commitment Accountability UI

'use client'

import { useEffect, useState } from 'react'
import { 
  getCommitmentMetrics, 
  getDemoCommitmentMetrics,
  CommitmentMetrics, 
  Commitment 
} from '@/lib/queries/commitments'
import { CheckCircle2, Clock, AlertCircle, ArrowRight, Scale } from 'lucide-react'

interface CommitmentScorecardProps {
  useDemo?: boolean
  compact?: boolean
}

export function CommitmentScorecard({ 
  useDemo = false, 
  compact = false 
}: CommitmentScorecardProps) {
  const [metrics, setMetrics] = useState<CommitmentMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (useDemo) {
      setMetrics(getDemoCommitmentMetrics())
      setLoading(false)
    } else {
      getCommitmentMetrics()
        .then(setMetrics)
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [useDemo])

  if (loading) return <ScoreCardSkeleton compact={compact} />
  if (!metrics) return null

  const hasOverdue = metrics.us.overdue > 0 || metrics.them.overdue > 0
  const totalOverdue = metrics.us.overdue + metrics.them.overdue

  return (
    <div className="bg-[var(--surface)] rounded-lg border border-[var(--border-subtle)] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Scale className="w-4 h-4 text-[var(--text-secondary)]" />
          <h3 className="text-sm font-medium text-[var(--text-primary)] tracking-tight">
            Commitment Accountability
          </h3>
        </div>
        {hasOverdue && (
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--signal-red)]/10 text-[var(--signal-red)]">
            {totalOverdue} overdue
          </span>
        )}
      </div>
      
      {/* Main Content */}
      <div className="p-5">
        <div className={`grid ${compact ? 'grid-cols-1 gap-4' : 'grid-cols-2 gap-6'}`}>
          {/* We Owe Them */}
          <CommitmentSide
            label="We Owe Them"
            pending={metrics.us.pending}
            overdue={metrics.us.overdue}
            completionRate={metrics.us.completionRate30d}
            avgDays={metrics.us.avgDaysToComplete}
            isUs={true}
            compact={compact}
          />

          {/* They Owe Us */}
          <CommitmentSide
            label="They Owe Us"
            pending={metrics.them.pending}
            overdue={metrics.them.overdue}
            completionRate={metrics.them.completionRate30d}
            avgDays={metrics.them.avgDaysToComplete}
            isUs={false}
            compact={compact}
          />
        </div>

        {/* Trust Balance Indicator */}
        {!compact && (
          <TrustBalanceIndicator trustScore={metrics.trustScore} />
        )}

        {/* Overdue Items (expandable) */}
        {hasOverdue && (
          <div className="mt-5 pt-4 border-t border-[var(--border-subtle)]">
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center justify-between text-xs text-[var(--signal-red)] uppercase tracking-wider hover:text-[var(--signal-red)]/80 transition-colors"
            >
              <span className="flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5" />
                Overdue Commitments
              </span>
              <ArrowRight className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`} />
            </button>
            
            {expanded && (
              <div className="mt-3 space-y-1 max-h-48 overflow-y-auto">
                {/* Our overdue */}
                {metrics.us.overdueItems.slice(0, 3).map(item => (
                  <OverdueItem key={item.id} item={item} isOurs={true} />
                ))}
                {/* Their overdue */}
                {metrics.them.overdueItems.slice(0, 3).map(item => (
                  <OverdueItem key={item.id} item={item} isOurs={false} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Sub-components

function CommitmentSide({
  label,
  pending,
  overdue,
  completionRate,
  avgDays,
  isUs,
  compact
}: {
  label: string
  pending: number
  overdue: number
  completionRate: number
  avgDays: number
  isUs: boolean
  compact: boolean
}) {
  return (
    <div className={compact ? '' : ''}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[var(--text-secondary)] text-sm">{label}</span>
        {overdue > 0 && (
          <span className={`px-2 py-0.5 rounded text-xs ${
            isUs 
              ? 'bg-[var(--signal-red)]/10 text-[var(--signal-red)]' 
              : 'bg-[var(--signal-yellow)]/10 text-[var(--signal-yellow)]'
          }`}>
            {overdue} overdue
          </span>
        )}
      </div>
      
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-3xl font-serif text-[var(--text-primary)]">
          {pending}
        </span>
        <span className="text-sm text-[var(--text-secondary)]">pending</span>
      </div>
      
      <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
        <span className="flex items-center gap-1.5">
          <CompletionIndicator rate={completionRate} />
          <span className={getCompletionColor(completionRate)}>
            {completionRate}%
          </span>
          <span className="text-[var(--text-tertiary)]">completion</span>
        </span>
        {avgDays > 0 && !compact && (
          <span className="text-[var(--text-tertiary)]">
            ~{avgDays}d avg
          </span>
        )}
      </div>
    </div>
  )
}

function CompletionIndicator({ rate }: { rate: number }) {
  if (rate >= 80) {
    return <CheckCircle2 className="w-3.5 h-3.5 text-[var(--verified)]" />
  }
  if (rate >= 60) {
    return <Clock className="w-3.5 h-3.5 text-[var(--signal-yellow)]" />
  }
  return <AlertCircle className="w-3.5 h-3.5 text-[var(--signal-red)]" />
}

function TrustBalanceIndicator({ trustScore }: { trustScore: CommitmentMetrics['trustScore'] }) {
  const balanceStatus = trustScore.reciprocityBalance > 1.5 
    ? 'We are over-committed'
    : trustScore.reciprocityBalance < 0.67 
    ? 'They are over-committed' 
    : 'Balanced'
  
  const balanceColor = trustScore.reciprocityBalance > 1.5 || trustScore.reciprocityBalance < 0.67
    ? 'text-[var(--signal-yellow)]'
    : 'text-[var(--verified)]'

  return (
    <div className="mt-5 pt-4 border-t border-[var(--border-subtle)]">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">
          Trust Balance
        </span>
        <span className={`text-xs ${balanceColor}`}>
          {balanceStatus}
        </span>
      </div>
      
      {/* Visual balance bar */}
      <div className="mt-2 h-1.5 bg-[var(--border-subtle)] rounded-full overflow-hidden flex">
        <div 
          className="h-full bg-[var(--accent)]"
          style={{ 
            width: `${Math.min(50 * trustScore.reciprocityBalance, 100)}%` 
          }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-[var(--text-tertiary)]">
        <span>We deliver: {trustScore.weDeliver}%</span>
        <span>They deliver: {trustScore.theyDeliver}%</span>
      </div>
    </div>
  )
}

function OverdueItem({ item, isOurs }: { item: Commitment; isOurs: boolean }) {
  const daysOverdue = getDaysOverdue(item.due_date!)
  
  return (
    <div className="flex items-start justify-between py-2 px-3 rounded-md hover:bg-[var(--surface-hover)] transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[var(--text-primary)] truncate">
          {item.description}
        </p>
        <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
          {isOurs ? 'We owe' : 'They owe'} • {item.owner_name || item.owner}
        </p>
      </div>
      <span className={`text-xs font-medium ml-3 whitespace-nowrap ${
        isOurs ? 'text-[var(--signal-red)]' : 'text-[var(--signal-yellow)]'
      }`}>
        {daysOverdue}d overdue
      </span>
    </div>
  )
}

function ScoreCardSkeleton({ compact }: { compact: boolean }) {
  return (
    <div className="bg-[var(--surface)] rounded-lg border border-[var(--border-subtle)] p-5 animate-pulse">
      <div className="h-4 bg-[var(--border-subtle)] rounded w-40 mb-4" />
      <div className={`grid ${compact ? 'grid-cols-1 gap-4' : 'grid-cols-2 gap-6'}`}>
        <div>
          <div className="h-3 bg-[var(--border-subtle)] rounded w-20 mb-2" />
          <div className="h-8 bg-[var(--border-subtle)] rounded w-16 mb-2" />
          <div className="h-3 bg-[var(--border-subtle)] rounded w-24" />
        </div>
        <div>
          <div className="h-3 bg-[var(--border-subtle)] rounded w-20 mb-2" />
          <div className="h-8 bg-[var(--border-subtle)] rounded w-16 mb-2" />
          <div className="h-3 bg-[var(--border-subtle)] rounded w-24" />
        </div>
      </div>
    </div>
  )
}

// Helpers
function getCompletionColor(rate: number): string {
  if (rate >= 80) return 'text-[var(--verified)]'
  if (rate >= 60) return 'text-[var(--signal-yellow)]'
  return 'text-[var(--signal-red)]'
}

function getDaysOverdue(dueDate: string): number {
  const due = new Date(dueDate)
  const today = new Date()
  return Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
}

export default CommitmentScorecard
