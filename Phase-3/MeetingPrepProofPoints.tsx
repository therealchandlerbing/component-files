// components/intelligence/MeetingPrepProofPoints.tsx
// Compact proof point recommendations for meeting prep

'use client'

import { useEffect, useState } from 'react'
import { 
  getRecommendedProofPoints, 
  ProofPointPerformance 
} from '@/lib/queries/proof-points'
import { getCulturalPrepForMeeting } from '@/lib/queries/cultural-patterns'
import { 
  Target, 
  Copy, 
  Check, 
  ChevronRight, 
  ChevronDown,
  Star,
  Globe,
  Sparkles
} from 'lucide-react'

interface MeetingPrepProofPointsProps {
  relationshipId?: string
  personaType?: string
  geography?: string
  serviceId?: string
  onSelect?: (proofPoint: ProofPointPerformance) => void
}

export function MeetingPrepProofPoints({
  relationshipId,
  personaType,
  geography,
  serviceId,
  onSelect
}: MeetingPrepProofPointsProps) {
  const [proofPoints, setProofPoints] = useState<ProofPointPerformance[]>([])
  const [culturalPrep, setCulturalPrep] = useState<{
    geography: string
    approach: string | null
    avgMeetingsInRegion: number
    keyConsiderations: string[]
    previousCulturalNotes: string[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const pointsPromise = getRecommendedProofPoints(personaType, geography, serviceId)
        const culturalPromise = relationshipId 
          ? getCulturalPrepForMeeting(relationshipId)
          : Promise.resolve(null)
        
        const [points, cultural] = await Promise.all([pointsPromise, culturalPromise])
        setProofPoints(points)
        setCulturalPrep(cultural)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [relationshipId, personaType, geography, serviceId])

  const handleCopy = async (pp: ProofPointPerformance) => {
    const text = `${pp.name}\n\n${pp.description}${pp.quantifiedResult ? `\n\nResult: ${pp.quantifiedResult}` : ''}`
    await navigator.clipboard.writeText(text)
    setCopiedId(pp.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (loading) {
    return (
      <div className="p-4 bg-[var(--paper)]/50 rounded-lg animate-pulse">
        <div className="h-5 w-40 bg-[var(--surface)] rounded mb-3" />
        <div className="space-y-2">
          <div className="h-12 bg-[var(--surface)] rounded" />
          <div className="h-12 bg-[var(--surface)] rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Cultural Context Card */}
      {culturalPrep && culturalPrep.geography !== 'Global' && (
        <div className="p-4 bg-gradient-to-br from-[var(--frost)]/5 to-transparent rounded-lg border border-[var(--frost)]/20">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-4 h-4 text-[var(--frost)]" />
            <p className="text-xs text-[var(--frost)] uppercase tracking-wider font-medium">
              Cultural Context: {culturalPrep.geography}
            </p>
          </div>
          
          {culturalPrep.keyConsiderations.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-[var(--text-secondary)] mb-1">Key Considerations</p>
              <ul className="space-y-1">
                {culturalPrep.keyConsiderations.map((consideration, i) => (
                  <li key={i} className="text-sm text-[var(--text-primary)] flex items-start gap-2">
                    <span className="text-[var(--frost)]">•</span>
                    {consideration}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {culturalPrep.avgMeetingsInRegion > 0 && (
            <p className="text-xs text-[var(--text-secondary)]">
              Typically takes <span className="text-[var(--frost)] font-medium">
                ~{culturalPrep.avgMeetingsInRegion} meetings
              </span> to reach proposal stage in {culturalPrep.geography}
            </p>
          )}

          {culturalPrep.previousCulturalNotes.length > 0 && (
            <div className="mt-3 pt-3 border-t border-[var(--frost)]/20">
              <p className="text-xs text-[var(--text-secondary)] mb-2">From Previous Meetings</p>
              <ul className="space-y-1">
                {culturalPrep.previousCulturalNotes.slice(0, 2).map((note, i) => (
                  <li key={i} className="text-xs text-[var(--text-primary)] italic">
                    "{note}"
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Recommended Proof Points */}
      {proofPoints.length > 0 ? (
        <div className="p-4 bg-[var(--paper)]/50 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-[var(--verified)]" />
            <p className="text-xs text-[var(--verified)] uppercase tracking-wider font-medium">
              Recommended Proof Points
            </p>
          </div>

          <div className="space-y-2">
            {proofPoints.map((pp, index) => (
              <div 
                key={pp.id}
                className="border border-[var(--border-subtle)] rounded-lg overflow-hidden bg-[var(--surface)]"
              >
                <div className="p-3 flex items-center justify-between">
                  <button
                    onClick={() => setExpandedId(expandedId === pp.id ? null : pp.id)}
                    className="flex items-center gap-2 flex-1 text-left"
                  >
                    {expandedId === pp.id ? (
                      <ChevronDown className="w-3 h-3 text-[var(--text-secondary)]" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-[var(--text-secondary)]" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {index === 0 && (
                          <Star className="w-3 h-3 text-[var(--verified)]" />
                        )}
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                          {pp.name}
                        </p>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {pp.resonanceRate}% resonance • {pp.category}
                      </p>
                    </div>
                  </button>

                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() => handleCopy(pp)}
                      className="p-1.5 hover:bg-[var(--paper)] rounded transition-colors"
                      title="Copy talking points"
                    >
                      {copiedId === pp.id ? (
                        <Check className="w-3.5 h-3.5 text-[var(--verified)]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                      )}
                    </button>
                    {onSelect && (
                      <button
                        onClick={() => onSelect(pp)}
                        className="p-1.5 hover:bg-[var(--paper)] rounded transition-colors"
                        title="Use this proof point"
                      >
                        <ChevronRight className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                      </button>
                    )}
                  </div>
                </div>

                {expandedId === pp.id && (
                  <div className="px-3 pb-3">
                    <p className="text-sm text-[var(--text-primary)] mb-2">
                      {pp.description}
                    </p>
                    {pp.quantifiedResult && (
                      <div className="p-2 bg-[var(--verified)]/5 rounded text-xs">
                        <span className="text-[var(--text-secondary)]">Result: </span>
                        <span className="text-[var(--verified)] font-medium">
                          {pp.quantifiedResult}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4 bg-[var(--paper)]/50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-[var(--text-secondary)]" />
            <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">
              Proof Points
            </p>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">
            No specific proof points recommended for this meeting context. Browse all proof points in Intelligence.
          </p>
        </div>
      )}
    </div>
  )
}

// Compact version for quick reference (badges only)
export function ProofPointQuickPick({
  personaType,
  geography
}: {
  personaType?: string
  geography?: string
}) {
  const [topPoints, setTopPoints] = useState<ProofPointPerformance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getRecommendedProofPoints(personaType, geography)
      .then(points => setTopPoints(points.slice(0, 3)))
      .finally(() => setLoading(false))
  }, [personaType, geography])

  if (loading || topPoints.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5">
      {topPoints.map(pp => (
        <span 
          key={pp.id}
          className="px-2 py-1 bg-[var(--verified)]/10 text-[var(--verified)] text-xs rounded-full"
          title={`${pp.resonanceRate}% resonance`}
        >
          {pp.name}
        </span>
      ))}
    </div>
  )
}

// Inline version for relationship cards
export function InlineProofPointRecommendation({ 
  proofPoint 
}: { 
  proofPoint: ProofPointPerformance 
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const text = `${proofPoint.name}: ${proofPoint.description}`
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center justify-between p-2 bg-[var(--verified)]/5 rounded border border-[var(--verified)]/20">
      <div className="flex items-center gap-2">
        <Star className="w-3 h-3 text-[var(--verified)]" />
        <span className="text-xs text-[var(--text-primary)]">{proofPoint.name}</span>
        <span className="text-[10px] text-[var(--verified)]">
          {proofPoint.resonanceRate}% resonance
        </span>
      </div>
      <button
        onClick={handleCopy}
        className="p-1 hover:bg-[var(--verified)]/10 rounded transition-colors"
      >
        {copied ? (
          <Check className="w-3 h-3 text-[var(--verified)]" />
        ) : (
          <Copy className="w-3 h-3 text-[var(--text-secondary)]" />
        )}
      </button>
    </div>
  )
}
