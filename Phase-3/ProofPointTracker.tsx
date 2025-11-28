// components/intelligence/ProofPointTracker.tsx
// Proof Point Performance Tracker - See which case studies resonate

'use client'

import { useEffect, useState } from 'react'
import { 
  getProofPointIntelligence, 
  ProofPointIntelligence, 
  ProofPointPerformance 
} from '@/lib/queries/proof-points'
import { 
  Star, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronRight, 
  TrendingUp,
  Target,
  Globe,
  Users
} from 'lucide-react'

export function ProofPointTracker() {
  const [data, setData] = useState<ProofPointIntelligence | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>('all')

  useEffect(() => {
    getProofPointIntelligence()
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <TrackerSkeleton />
  
  if (!data || data.proofPoints.length === 0) {
    return (
      <div className="bg-[var(--surface)] rounded-lg border border-[var(--border-subtle)] p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-[var(--frost)]/10 flex items-center justify-center">
            <Target className="w-5 h-5 text-[var(--frost)]" />
          </div>
          <div>
            <h3 className="text-lg font-serif text-[var(--text-primary)]">
              Proof Point Performance
            </h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Track which case studies resonate
            </p>
          </div>
        </div>
        <div className="mt-6 p-4 bg-[var(--paper)]/30 rounded-lg border border-dashed border-[var(--border-subtle)]">
          <p className="text-sm text-[var(--text-secondary)] text-center">
            No proof points tracked yet. Add case studies and track their effectiveness in meetings.
          </p>
        </div>
      </div>
    )
  }

  const categories = Array.from(data.byCategory.keys())
  const filteredPoints = filterCategory === 'all'
    ? data.proofPoints
    : data.byCategory.get(filterCategory) || []

  const handleCopy = async (pp: ProofPointPerformance) => {
    const text = `${pp.name}\n\n${pp.description}${pp.quantifiedResult ? `\n\nResult: ${pp.quantifiedResult}` : ''}`
    await navigator.clipboard.writeText(text)
    setCopiedId(pp.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="bg-[var(--surface)] rounded-lg border border-[var(--border-subtle)] overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-[var(--border-subtle)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--frost)]/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-[var(--frost)]" />
            </div>
            <div>
              <h3 className="text-lg font-serif text-[var(--text-primary)]">
                Proof Point Performance
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                {data.totalProofPoints} proof points tracked
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[var(--verified)]" />
              <span className="text-2xl font-serif text-[var(--verified)]">
                {data.overallResonanceRate}%
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">overall resonance</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Top Performers */}
        {data.topPerformers.length > 0 && (
          <div className="p-4 bg-gradient-to-br from-[var(--verified)]/5 to-transparent rounded-lg border border-[var(--verified)]/20">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-[var(--verified)]" />
              <p className="text-xs text-[var(--verified)] uppercase tracking-wider font-medium">
                Top Performers (3+ uses)
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.topPerformers.map(pp => (
                <button 
                  key={pp.id}
                  onClick={() => setExpandedId(expandedId === pp.id ? null : pp.id)}
                  className="px-3 py-1.5 bg-[var(--verified)]/10 hover:bg-[var(--verified)]/20 text-[var(--verified)] rounded-full text-sm flex items-center gap-2 transition-colors"
                >
                  {pp.name}
                  <span className="opacity-70 text-xs">{pp.resonanceRate}%</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Category Filter */}
        {categories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                filterCategory === 'all'
                  ? 'bg-[var(--text-primary)] text-[var(--paper)] shadow-sm'
                  : 'bg-[var(--paper)]/50 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--paper)]'
              }`}
            >
              All ({data.proofPoints.length})
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                  filterCategory === cat
                    ? 'bg-[var(--text-primary)] text-[var(--paper)] shadow-sm'
                    : 'bg-[var(--paper)]/50 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--paper)]'
                }`}
              >
                {cat} ({data.byCategory.get(cat)?.length || 0})
              </button>
            ))}
          </div>
        )}

        {/* Proof Point Cards */}
        <div className="space-y-3">
          {filteredPoints.map(pp => (
            <ProofPointCard
              key={pp.id}
              proofPoint={pp}
              isExpanded={expandedId === pp.id}
              isCopied={copiedId === pp.id}
              onToggle={() => setExpandedId(expandedId === pp.id ? null : pp.id)}
              onCopy={() => handleCopy(pp)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function ProofPointCard({ 
  proofPoint: pp, 
  isExpanded, 
  isCopied,
  onToggle,
  onCopy 
}: { 
  proofPoint: ProofPointPerformance
  isExpanded: boolean
  isCopied: boolean
  onToggle: () => void
  onCopy: () => void
}) {
  return (
    <div className="border border-[var(--border-subtle)] rounded-lg overflow-hidden hover:border-[var(--border-hover)] transition-colors">
      {/* Summary Row */}
      <div className="p-4 flex items-center justify-between">
        <button
          onClick={onToggle}
          className="flex items-center gap-3 flex-1 text-left group"
        >
          <div className="w-5 h-5 flex items-center justify-center text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-[var(--text-primary)] truncate">{pp.name}</p>
            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <span>{pp.category}</span>
              {pp.canNamePublicly && (
                <>
                  <span className="text-[var(--border-subtle)]">•</span>
                  <span className="text-[var(--verified)]">Can name publicly</span>
                </>
              )}
            </div>
          </div>
        </button>

        <div className="flex items-center gap-3">
          {/* Resonance Badge */}
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getResonanceStyle(pp.resonanceRate)}`}>
            {pp.resonanceRate}%
            <span className="text-xs opacity-70 ml-1">
              ({pp.timesResonated}/{pp.timesUsed})
            </span>
          </div>

          {/* Copy Button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onCopy()
            }}
            className="p-2 hover:bg-[var(--paper)] rounded-lg transition-colors"
            title="Copy talking points"
          >
            {isCopied ? (
              <Check className="w-4 h-4 text-[var(--verified)]" />
            ) : (
              <Copy className="w-4 h-4 text-[var(--text-secondary)]" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-0">
          <div className="p-4 bg-[var(--paper)]/50 rounded-lg space-y-4">
            <p className="text-sm text-[var(--text-primary)] leading-relaxed">
              {pp.description}
            </p>

            {pp.quantifiedResult && (
              <div className="p-3 bg-[var(--verified)]/5 rounded-lg border border-[var(--verified)]/20">
                <p className="text-xs text-[var(--text-secondary)] mb-1">Quantified Result</p>
                <p className="text-sm text-[var(--verified)] font-medium">
                  {pp.quantifiedResult}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {pp.relevantPersonas.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Users className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                    <p className="text-xs text-[var(--text-secondary)]">Best With</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {pp.relevantPersonas.map((persona, i) => (
                      <span 
                        key={i}
                        className="px-2 py-0.5 bg-[var(--heat)]/10 text-[var(--heat)] text-xs rounded"
                      >
                        {persona}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {pp.relevantGeographies.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Globe className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                    <p className="text-xs text-[var(--text-secondary)]">Best In</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {pp.relevantGeographies.map((geo, i) => (
                      <span 
                        key={i}
                        className="px-2 py-0.5 bg-[var(--frost)]/10 text-[var(--frost)] text-xs rounded"
                      >
                        {geo}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Recent Usage */}
            {pp.recentUsage.length > 0 && (
              <div className="pt-4 border-t border-[var(--border-subtle)]">
                <p className="text-xs text-[var(--text-secondary)] mb-3">Recent Usage</p>
                <div className="space-y-2">
                  {pp.recentUsage.map((usage, i) => (
                    <div 
                      key={i}
                      className="flex items-center justify-between text-sm p-2 bg-[var(--surface)] rounded"
                    >
                      <span className="text-[var(--text-primary)]">
                        {usage.relationshipName}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        usage.resonated 
                          ? 'bg-[var(--verified)]/10 text-[var(--verified)]' 
                          : 'bg-[var(--signal-red)]/10 text-[var(--signal-red)]'
                      }`}>
                        {usage.resonated ? '✓ Resonated' : '✗ Didn\'t resonate'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function getResonanceStyle(rate: number): string {
  if (rate >= 70) return 'bg-[var(--verified)]/10 text-[var(--verified)]'
  if (rate >= 50) return 'bg-[var(--signal-yellow)]/10 text-[var(--signal-yellow)]'
  return 'bg-[var(--signal-red)]/10 text-[var(--signal-red)]'
}

function TrackerSkeleton() {
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
          <div className="h-8 w-16 bg-[var(--paper)] rounded mb-1" />
          <div className="h-3 w-20 bg-[var(--paper)] rounded" />
        </div>
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-[var(--paper)] rounded-lg" />
        ))}
      </div>
    </div>
  )
}
