// components/intelligence/IntroductionNetworkTracker.tsx
// Introduction Network ROI Tracker - See who's connecting you to value

'use client'

import { useEffect, useState } from 'react'
import { 
  getIntroductionNetwork, 
  IntroductionNetwork, 
  IntroducerStats 
} from '@/lib/queries/introduction-network'
import { 
  Users, 
  ArrowRight, 
  TrendingUp, 
  DollarSign, 
  ChevronDown, 
  ChevronRight,
  Network,
  Handshake
} from 'lucide-react'

export function IntroductionNetworkTracker() {
  const [data, setData] = useState<IntroductionNetwork | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedIntroducer, setExpandedIntroducer] = useState<string | null>(null)

  useEffect(() => {
    getIntroductionNetwork()
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <NetworkSkeleton />
  
  if (!data || data.funnel.totalIntros === 0) {
    return (
      <div className="bg-[var(--surface)] rounded-lg border border-[var(--border-subtle)] p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-[var(--heat)]/10 flex items-center justify-center">
            <Network className="w-5 h-5 text-[var(--heat)]" />
          </div>
          <div>
            <h3 className="text-lg font-serif text-[var(--text-primary)]">
              Introduction Network
            </h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Track your network's ROI
            </p>
          </div>
        </div>
        <div className="mt-6 p-4 bg-[var(--paper)]/30 rounded-lg border border-dashed border-[var(--border-subtle)]">
          <p className="text-sm text-[var(--text-secondary)] text-center">
            No introductions tracked yet. Start tracking who's connecting you to valuable relationships.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[var(--surface)] rounded-lg border border-[var(--border-subtle)] overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-[var(--border-subtle)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--heat)]/10 flex items-center justify-center">
              <Network className="w-5 h-5 text-[var(--heat)]" />
            </div>
            <div>
              <h3 className="text-lg font-serif text-[var(--text-primary)]">
                Introduction Network
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Track your network's ROI
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[var(--heat)]" />
              <span className="text-2xl font-serif text-[var(--heat)]">
                {formatValue(data.networkValue)}
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">network value</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Introduction Funnel */}
        <div className="p-4 bg-gradient-to-br from-[var(--paper)]/80 to-[var(--paper)]/30 rounded-lg">
          <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-4 font-medium">
            Introduction Funnel
          </p>
          
          <div className="flex items-center justify-between">
            <FunnelStage 
              label="Introductions"
              value={data.funnel.totalIntros}
              color="text-[var(--text-primary)]"
            />
            <div className="flex flex-col items-center">
              <ArrowRight className="w-4 h-4 text-[var(--text-tertiary)]" />
              <span className="text-[10px] text-[var(--verified)] mt-0.5">
                {data.funnel.conversionRates.introToMeeting}%
              </span>
            </div>
            <FunnelStage 
              label="Meetings"
              value={data.funnel.meetingsSet}
              color="text-[var(--signal-yellow)]"
            />
            <div className="flex flex-col items-center">
              <ArrowRight className="w-4 h-4 text-[var(--text-tertiary)]" />
              <span className="text-[10px] text-[var(--verified)] mt-0.5">
                {data.funnel.conversionRates.meetingToDeal}%
              </span>
            </div>
            <FunnelStage 
              label="Deals"
              value={data.funnel.activeDeals}
              color="text-[var(--verified)]"
            />
            <div className="flex flex-col items-center">
              <ArrowRight className="w-4 h-4 text-[var(--text-tertiary)]" />
            </div>
            <FunnelStage 
              label="Value"
              value={formatValue(data.funnel.totalValue)}
              color="text-[var(--heat)]"
              isValue
            />
          </div>

          <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] flex justify-between items-center">
            <div className="flex items-center gap-4 text-xs">
              <span className="text-[var(--text-secondary)]">
                Overall Conversion: 
                <span className={`ml-1 font-medium ${
                  data.funnel.conversionRates.overall >= 20 
                    ? 'text-[var(--verified)]' 
                    : data.funnel.conversionRates.overall >= 10
                    ? 'text-[var(--signal-yellow)]'
                    : 'text-[var(--text-primary)]'
                }`}>
                  {data.funnel.conversionRates.overall}%
                </span>
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[var(--frost)]" />
                Made: {data.byDirection.made}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[var(--heat)]" />
                Received: {data.byDirection.received}
              </span>
            </div>
          </div>
        </div>

        {/* Top Introducers */}
        {data.topIntroducers.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Handshake className="w-4 h-4 text-[var(--text-secondary)]" />
              <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-medium">
                Top Connectors
              </p>
            </div>
            <div className="space-y-2">
              {data.topIntroducers.map(introducer => (
                <IntroducerCard
                  key={introducer.id}
                  introducer={introducer}
                  isExpanded={expandedIntroducer === introducer.id}
                  onToggle={() => setExpandedIntroducer(
                    expandedIntroducer === introducer.id ? null : introducer.id
                  )}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function FunnelStage({ 
  label, 
  value, 
  color, 
  isValue 
}: { 
  label: string
  value: number | string
  color: string
  isValue?: boolean
}) {
  return (
    <div className="text-center min-w-[60px]">
      <p className={`text-xl font-medium ${color}`}>
        {value}
      </p>
      <p className="text-xs text-[var(--text-secondary)]">{label}</p>
    </div>
  )
}

function IntroducerCard({ 
  introducer, 
  isExpanded, 
  onToggle 
}: { 
  introducer: IntroducerStats
  isExpanded: boolean
  onToggle: () => void
}) {
  return (
    <div className="border border-[var(--border-subtle)] rounded-lg overflow-hidden hover:border-[var(--border-hover)] transition-colors">
      <button
        onClick={onToggle}
        className="w-full p-3 flex items-center justify-between hover:bg-[var(--paper)]/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 flex items-center justify-center text-[var(--text-secondary)]">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </div>
          <div className="text-left">
            <p className="font-medium text-[var(--text-primary)]">{introducer.name}</p>
            {introducer.organization && (
              <p className="text-xs text-[var(--text-secondary)]">{introducer.organization}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <StatBadge 
            value={introducer.introsMade} 
            label="intros"
            color="text-[var(--text-primary)]"
          />
          <StatBadge 
            value={introducer.dealsGenerated} 
            label="deals"
            color="text-[var(--verified)]"
          />
          <StatBadge 
            value={formatValue(introducer.totalValueGenerated)} 
            label="value"
            color="text-[var(--heat)]"
          />
          {introducer.conversionRate > 0 && (
            <div className={`px-2 py-0.5 rounded text-xs font-medium ${
              introducer.conversionRate >= 30 
                ? 'bg-[var(--verified)]/10 text-[var(--verified)]'
                : 'bg-[var(--paper)] text-[var(--text-secondary)]'
            }`}>
              {introducer.conversionRate}%
            </div>
          )}
        </div>
      </button>

      {isExpanded && introducer.introductions.length > 0 && (
        <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--paper)]/30">
          <div className="space-y-2">
            {introducer.introductions.map(intro => (
              <div 
                key={intro.id}
                className="flex items-center justify-between text-sm p-2 bg-[var(--surface)] rounded"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-[var(--text-primary)] truncate block">
                    {intro.introducedName}
                  </span>
                  {intro.introducedOrg && (
                    <span className="text-xs text-[var(--text-secondary)]">
                      {intro.introducedOrg}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-3">
                  {intro.firstMeetingAt && (
                    <span className="text-xs text-[var(--verified)] px-2 py-0.5 bg-[var(--verified)]/10 rounded">
                      Meeting set
                    </span>
                  )}
                  {intro.valueGenerated && intro.valueGenerated > 0 && (
                    <span className="text-xs text-[var(--heat)] font-medium">
                      {formatValue(intro.valueGenerated)}
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded text-xs capitalize ${
                    intro.outcome === 'converted' 
                      ? 'bg-[var(--verified)]/10 text-[var(--verified)]' 
                      : intro.status === 'active' 
                      ? 'bg-[var(--signal-yellow)]/10 text-[var(--signal-yellow)]'
                      : 'bg-[var(--paper)] text-[var(--text-secondary)]'
                  }`}>
                    {intro.outcome || intro.status || 'pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatBadge({ 
  value, 
  label, 
  color 
}: { 
  value: number | string
  label: string
  color: string 
}) {
  return (
    <div className="text-center min-w-[50px]">
      <p className={`text-sm font-medium ${color}`}>{value}</p>
      <p className="text-[10px] text-[var(--text-secondary)]">{label}</p>
    </div>
  )
}

function formatValue(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}k`
  }
  return `$${value}`
}

function NetworkSkeleton() {
  return (
    <div className="bg-[var(--surface)] rounded-lg border border-[var(--border-subtle)] p-6 animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--paper)]" />
          <div>
            <div className="h-5 w-40 bg-[var(--paper)] rounded mb-2" />
            <div className="h-4 w-24 bg-[var(--paper)] rounded" />
          </div>
        </div>
        <div className="text-right">
          <div className="h-8 w-20 bg-[var(--paper)] rounded mb-1" />
          <div className="h-3 w-16 bg-[var(--paper)] rounded" />
        </div>
      </div>
      <div className="h-32 bg-[var(--paper)] rounded-lg mb-6" />
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-14 bg-[var(--paper)] rounded-lg" />
        ))}
      </div>
    </div>
  )
}
