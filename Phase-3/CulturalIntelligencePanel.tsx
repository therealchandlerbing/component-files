// components/intelligence/CulturalIntelligencePanel.tsx
// Cultural Intelligence Panel - Surface patterns from meeting notes by geography

'use client'

import { useEffect, useState } from 'react'
import { getCulturalPatterns, CulturalPattern } from '@/lib/queries/cultural-patterns'
import { 
  Globe, 
  Users, 
  Calendar, 
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Lightbulb
} from 'lucide-react'

export function CulturalIntelligencePanel() {
  const [patterns, setPatterns] = useState<Map<string, CulturalPattern>>(new Map())
  const [loading, setLoading] = useState(true)
  const [expandedGeo, setExpandedGeo] = useState<string | null>(null)

  useEffect(() => {
    getCulturalPatterns()
      .then(setPatterns)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PanelSkeleton />
  
  if (patterns.size === 0) {
    return (
      <div className="bg-[var(--surface)] rounded-lg border border-[var(--border-subtle)] p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-[var(--frost)]/10 flex items-center justify-center">
            <Globe className="w-5 h-5 text-[var(--frost)]" />
          </div>
          <div>
            <h3 className="text-lg font-serif text-[var(--text-primary)]">
              Cultural Patterns
            </h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Insights by geography
            </p>
          </div>
        </div>
        <div className="mt-6 p-4 bg-[var(--paper)]/30 rounded-lg border border-dashed border-[var(--border-subtle)]">
          <p className="text-sm text-[var(--text-secondary)] text-center">
            Cultural insights are detected from meeting notes and relationship context. Add cultural notes to your interactions to see patterns emerge.
          </p>
        </div>
      </div>
    )
  }

  // Sort patterns by relationship count
  const sortedPatterns = Array.from(patterns.entries())
    .sort((a, b) => b[1].relationshipCount - a[1].relationshipCount)

  return (
    <div className="bg-[var(--surface)] rounded-lg border border-[var(--border-subtle)] overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--frost)]/10 flex items-center justify-center">
            <Globe className="w-5 h-5 text-[var(--frost)]" />
          </div>
          <div>
            <h3 className="text-lg font-serif text-[var(--text-primary)]">
              Cultural Patterns
            </h3>
            <p className="text-sm text-[var(--text-secondary)]">
              {sortedPatterns.length} {sortedPatterns.length === 1 ? 'region' : 'regions'} tracked
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-3">
          {sortedPatterns.map(([geo, pattern]) => (
            <GeographyCard 
              key={geo} 
              pattern={pattern}
              isExpanded={expandedGeo === geo}
              onToggle={() => setExpandedGeo(expandedGeo === geo ? null : geo)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function GeographyCard({ 
  pattern,
  isExpanded,
  onToggle
}: { 
  pattern: CulturalPattern
  isExpanded: boolean
  onToggle: () => void
}) {
  const geoEmoji: Record<string, string> = {
    'Brazil': '🇧🇷',
    'Latin America': '🌎',
    'United States': '🇺🇸',
    'Europe': '🇪🇺',
    'United Kingdom': '🇬🇧',
    'Asia-Pacific': '🌏',
    'Japan': '🇯🇵',
    'Africa': '🌍',
    'Middle East': '🌙',
    'Global': '🌐'
  }

  return (
    <div className="border border-[var(--border-subtle)] rounded-lg overflow-hidden hover:border-[var(--border-hover)] transition-colors">
      {/* Summary Row */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-[var(--paper)]/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 flex items-center justify-center text-[var(--text-secondary)]">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">{geoEmoji[pattern.geography] || '🌐'}</span>
            <span className="font-medium text-[var(--text-primary)]">
              {pattern.geography}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-sm text-[var(--text-primary)]">
              {pattern.relationshipCount}
            </span>
            <span className="text-xs text-[var(--text-secondary)] ml-1">
              {pattern.relationshipCount === 1 ? 'relationship' : 'relationships'}
            </span>
          </div>
          {pattern.avgMeetingsBeforeProposal > 0 && (
            <div className="px-2 py-1 bg-[var(--paper)] rounded text-xs text-[var(--text-secondary)]">
              ~{pattern.avgMeetingsBeforeProposal} meetings to proposal
            </div>
          )}
        </div>
      </button>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--paper)]/30">
          <div className="grid grid-cols-2 gap-4">
            {/* Communication Style */}
            {pattern.communicationStyle.length > 0 && (
              <div className="p-3 bg-[var(--surface)] rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-[var(--frost)]" />
                  <p className="text-xs text-[var(--text-secondary)] font-medium">
                    Communication Style
                  </p>
                </div>
                <ul className="space-y-1">
                  {pattern.communicationStyle.map((style, i) => (
                    <li key={i} className="text-sm text-[var(--text-primary)]">
                      • {style}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Common Approaches */}
            {pattern.commonApproaches.length > 0 && (
              <div className="p-3 bg-[var(--surface)] rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-[var(--heat)]" />
                  <p className="text-xs text-[var(--text-secondary)] font-medium">
                    Common Approaches
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {pattern.commonApproaches.map((approach, i) => (
                    <span 
                      key={i}
                      className="px-2 py-0.5 bg-[var(--heat)]/10 text-[var(--heat)] text-xs rounded capitalize"
                    >
                      {approach.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Key Insights */}
          {pattern.keyInsights.length > 0 && (
            <div className="mt-4 p-3 bg-[var(--surface)] rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-[var(--signal-yellow)]" />
                <p className="text-xs text-[var(--text-secondary)] font-medium">
                  Key Insights from Meetings
                </p>
              </div>
              <ul className="space-y-2">
                {pattern.keyInsights.slice(0, 4).map((insight, i) => (
                  <li 
                    key={i} 
                    className="text-sm text-[var(--text-primary)] pl-4 border-l-2 border-[var(--signal-yellow)]/30"
                  >
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Meeting Timing */}
          {pattern.avgMeetingsBeforeProposal > 0 && (
            <div className="mt-4 p-3 bg-gradient-to-r from-[var(--verified)]/5 to-transparent rounded-lg border border-[var(--verified)]/20">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-[var(--verified)]" />
                <div>
                  <p className="text-sm text-[var(--text-primary)]">
                    <span className="font-medium text-[var(--verified)]">
                      {pattern.avgMeetingsBeforeProposal}
                    </span>
                    {' '}average meetings before reaching proposal stage
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Based on relationships that progressed to Qualified or Committed
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function PanelSkeleton() {
  return (
    <div className="bg-[var(--surface)] rounded-lg border border-[var(--border-subtle)] p-6 animate-pulse">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-[var(--paper)]" />
        <div>
          <div className="h-5 w-36 bg-[var(--paper)] rounded mb-2" />
          <div className="h-4 w-24 bg-[var(--paper)] rounded" />
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

// Compact version for sidebar or meeting prep
export function CulturalInsightBadge({ 
  geography,
  compact = false
}: { 
  geography: string
  compact?: boolean
}) {
  const geoEmoji: Record<string, string> = {
    'Brazil': '🇧🇷',
    'Latin America': '🌎',
    'United States': '🇺🇸',
    'Europe': '🇪🇺',
    'United Kingdom': '🇬🇧',
    'Asia-Pacific': '🌏',
    'Japan': '🇯🇵',
    'Africa': '🌍',
    'Middle East': '🌙',
    'Global': '🌐'
  }

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--frost)]/10 text-[var(--frost)] text-xs rounded">
        <span>{geoEmoji[geography] || '🌐'}</span>
        <span>{geography}</span>
      </span>
    )
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--frost)]/10 rounded-lg">
      <span className="text-lg">{geoEmoji[geography] || '🌐'}</span>
      <span className="text-sm text-[var(--frost)] font-medium">{geography}</span>
    </div>
  )
}
