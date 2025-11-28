// components/dashboard/TemperatureVelocity.tsx
// Phase 4: Commitment & Trust Dynamics - Temperature Momentum UI

'use client'

import { useEffect, useState } from 'react'
import { 
  getTemperatureVelocityDashboard, 
  getDemoTemperatureVelocityDashboard,
  TemperatureVelocityDashboard,
  TemperatureVelocity
} from '@/lib/queries/temperature-velocity'
import { TrendingUp, TrendingDown, Minus, Flame, Snowflake, ArrowRight } from 'lucide-react'

interface TemperatureVelocityPanelProps {
  useDemo?: boolean
}

export function TemperatureVelocityPanel({ useDemo = false }: TemperatureVelocityPanelProps) {
  const [data, setData] = useState<TemperatureVelocityDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'heating' | 'cooling'>('heating')

  useEffect(() => {
    if (useDemo) {
      setData(getDemoTemperatureVelocityDashboard())
      setLoading(false)
    } else {
      getTemperatureVelocityDashboard()
        .then(setData)
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [useDemo])

  if (loading) return <VelocitySkeleton />
  if (!data) return null

  const { heating, cooling, summary } = data
  const hasSignificantMovement = heating.length > 0 || cooling.length > 0

  if (!hasSignificantMovement) {
    return (
      <div className="bg-[var(--surface)] rounded-lg border border-[var(--border-subtle)] p-5">
        <div className="flex items-center gap-2 mb-2">
          <Minus className="w-4 h-4 text-[var(--text-secondary)]" />
          <h3 className="text-sm font-medium text-[var(--text-primary)]">
            Temperature Stable
          </h3>
        </div>
        <p className="text-xs text-[var(--text-secondary)]">
          All {summary.totalActive} active relationships are holding steady
        </p>
      </div>
    )
  }

  return (
    <div className="bg-[var(--surface)] rounded-lg border border-[var(--border-subtle)] overflow-hidden">
      {/* Header with summary */}
      <div className="px-5 py-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-[var(--text-primary)]">
            Relationship Momentum
          </h3>
          <div className="flex items-center gap-3">
            {heating.length > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-[var(--heat)]">
                <Flame className="w-3.5 h-3.5" />
                {heating.length} heating
              </span>
            )}
            {cooling.length > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-[var(--frost)]">
                <Snowflake className="w-3.5 h-3.5" />
                {cooling.length} cooling
              </span>
            )}
          </div>
        </div>
        
        {/* Tab toggle */}
        <div className="flex gap-1 p-0.5 rounded-md bg-[var(--surface-hover)]">
          <TabButton 
            active={activeTab === 'heating'} 
            onClick={() => setActiveTab('heating')}
            icon={<Flame className="w-3.5 h-3.5" />}
            label={`Heating (${heating.length})`}
            color="heat"
          />
          <TabButton 
            active={activeTab === 'cooling'} 
            onClick={() => setActiveTab('cooling')}
            icon={<Snowflake className="w-3.5 h-3.5" />}
            label={`Cooling (${cooling.length})`}
            color="frost"
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'heating' && (
          <div className="space-y-3">
            {heating.length === 0 ? (
              <p className="text-xs text-[var(--text-tertiary)] text-center py-4">
                No relationships showing consistent warming
              </p>
            ) : (
              heating.map(rel => (
                <VelocityCard key={rel.relationshipId} relationship={rel} type="heating" />
              ))
            )}
          </div>
        )}
        
        {activeTab === 'cooling' && (
          <div className="space-y-3">
            {cooling.length === 0 ? (
              <p className="text-xs text-[var(--text-tertiary)] text-center py-4">
                No relationships showing consistent cooling
              </p>
            ) : (
              cooling.map(rel => (
                <VelocityCard key={rel.relationshipId} relationship={rel} type="cooling" />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Velocity card for individual relationship
function VelocityCard({ 
  relationship, 
  type 
}: { 
  relationship: TemperatureVelocityDashboard['heating'][0] | TemperatureVelocityDashboard['cooling'][0]
  type: 'heating' | 'cooling'
}) {
  const [expanded, setExpanded] = useState(false)
  const Icon = type === 'heating' ? TrendingUp : TrendingDown
  const color = type === 'heating' ? 'var(--heat)' : 'var(--frost)'

  return (
    <div className="rounded-md border border-[var(--border-subtle)] overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-[var(--surface-hover)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${color}15` }}
          >
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {relationship.name}
            </p>
            <p className="text-xs text-[var(--text-secondary)]">
              {relationship.organization}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <TemperaturePill temp={relationship.currentTemp} />
          <ArrowRight className={`w-3.5 h-3.5 text-[var(--text-tertiary)] transition-transform ${
            expanded ? 'rotate-90' : ''
          }`} />
        </div>
      </button>

      {/* Expanded: Recent interactions */}
      {expanded && relationship.recentChanges.length > 0 && (
        <div className="px-3 py-2.5 bg-[var(--surface-hover)]/50 border-t border-[var(--border-subtle)]">
          <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
            Recent Interactions
          </p>
          <div className="space-y-2">
            {relationship.recentChanges.map((change, i) => (
              <div key={i} className="flex items-start gap-2">
                <ChangeIndicator change={change.change} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[var(--text-primary)] truncate">
                    {change.context || 'Interaction recorded'}
                  </p>
                  <p className="text-[10px] text-[var(--text-tertiary)]">
                    {formatDate(change.date)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Inline badge for relationship cards
export function TemperatureVelocityBadge({ 
  momentum,
  showLabel = false
}: { 
  momentum: 'heating' | 'cooling' | 'stable'
  showLabel?: boolean
}) {
  if (momentum === 'stable') return null

  const config = {
    heating: {
      icon: <TrendingUp className="w-3 h-3" />,
      label: 'Heating',
      className: 'bg-[var(--heat)]/10 text-[var(--heat)] border-[var(--heat)]/20'
    },
    cooling: {
      icon: <TrendingDown className="w-3 h-3" />,
      label: 'Cooling',
      className: 'bg-[var(--frost)]/10 text-[var(--frost)] border-[var(--frost)]/20'
    }
  }

  const { icon, label, className } = config[momentum]

  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs border ${className}`}>
      {icon}
      {showLabel && <span>{label}</span>}
    </span>
  )
}

// Sub-components

function TabButton({ 
  active, 
  onClick, 
  icon, 
  label, 
  color 
}: { 
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  color: 'heat' | 'frost'
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${
        active 
          ? `bg-[var(--surface)] text-[var(--${color})] shadow-sm` 
          : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

function TemperaturePill({ temp }: { temp: string }) {
  const config: Record<string, { bg: string; text: string }> = {
    hot: { bg: 'bg-[var(--heat)]/15', text: 'text-[var(--heat)]' },
    warm: { bg: 'bg-[var(--signal-yellow)]/15', text: 'text-[var(--signal-yellow)]' },
    cool: { bg: 'bg-[var(--frost)]/15', text: 'text-[var(--frost)]' },
    cold: { bg: 'bg-[var(--frost)]/15', text: 'text-[var(--frost)]' },
  }

  const style = config[temp.toLowerCase()] || { 
    bg: 'bg-[var(--surface-hover)]', 
    text: 'text-[var(--text-tertiary)]' 
  }

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${style.bg} ${style.text}`}>
      {temp}
    </span>
  )
}

function ChangeIndicator({ change }: { change: 'warmer' | 'cooler' | 'stable' }) {
  const config = {
    warmer: { icon: <TrendingUp className="w-3 h-3" />, color: 'text-[var(--heat)]' },
    cooler: { icon: <TrendingDown className="w-3 h-3" />, color: 'text-[var(--frost)]' },
    stable: { icon: <Minus className="w-3 h-3" />, color: 'text-[var(--text-tertiary)]' }
  }

  const { icon, color } = config[change] || config.stable

  return (
    <span className={`mt-0.5 ${color}`}>{icon}</span>
  )
}

function VelocitySkeleton() {
  return (
    <div className="bg-[var(--surface)] rounded-lg border border-[var(--border-subtle)] p-5 animate-pulse">
      <div className="h-4 bg-[var(--border-subtle)] rounded w-36 mb-4" />
      <div className="flex gap-2 mb-4">
        <div className="h-8 bg-[var(--border-subtle)] rounded flex-1" />
        <div className="h-8 bg-[var(--border-subtle)] rounded flex-1" />
      </div>
      <div className="space-y-3">
        {[1, 2].map(i => (
          <div key={i} className="p-3 rounded border border-[var(--border-subtle)]">
            <div className="h-4 bg-[var(--border-subtle)] rounded w-28 mb-2" />
            <div className="h-3 bg-[var(--border-subtle)] rounded w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  })
}

export default TemperatureVelocityPanel
