// lib/queries/cultural-patterns.ts
// Cultural Intelligence - Surface patterns from meeting notes and relationship context

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface CulturalPattern {
  geography: string
  relationshipCount: number
  commonApproaches: string[]
  avgMeetingsBeforeProposal: number
  keyInsights: string[]
  communicationStyle: string[]
}

export interface RelationshipCulturalContext {
  relationshipId: string
  name: string
  organization: string
  geography: string
  culturalApproach: string | null
  culturalInsights: string[]
  meetingCount: number
}

export async function getCulturalPatterns(): Promise<Map<string, CulturalPattern>> {
  // Get relationships with their interactions and cultural data
  const { data: relationships, error } = await supabase
    .from('relationships')
    .select(`
      id,
      name,
      organization,
      cultural_approach,
      interactions (
        cultural_context,
        meeting_type,
        meeting_date
      ),
      stage_transitions (
        to_stage,
        transition_date
      )
    `)
    .eq('is_active', true)

  if (error) {
    console.error('Error fetching relationships for cultural patterns:', error)
    return new Map()
  }

  if (!relationships) return new Map()

  // Group by geography (inferred from cultural_approach or organization patterns)
  const byGeography = new Map<string, typeof relationships>()

  relationships.forEach(rel => {
    // Infer geography from cultural_approach or organization
    let geography = 'Global'
    const approach = rel.cultural_approach?.toLowerCase() || ''
    const org = rel.organization?.toLowerCase() || ''
    const culturalNotes = (rel.interactions as any[])
      ?.map(i => i.cultural_context)
      .filter(Boolean)
      .join(' ')
      .toLowerCase() || ''

    // Geography inference rules
    if (approach.includes('brazil') || culturalNotes.includes('brazil') || culturalNotes.includes('brazilian')) {
      geography = 'Brazil'
    } else if (approach.includes('latam') || culturalNotes.includes('latin america')) {
      geography = 'Latin America'
    } else if (approach.includes('us') || approach.includes('american') || culturalNotes.includes('american')) {
      geography = 'United States'
    } else if (approach.includes('europe') || approach.includes('eu') || culturalNotes.includes('european')) {
      geography = 'Europe'
    } else if (approach.includes('uk') || approach.includes('british') || culturalNotes.includes('british')) {
      geography = 'United Kingdom'
    } else if (approach.includes('asia') || culturalNotes.includes('asian')) {
      geography = 'Asia-Pacific'
    } else if (approach.includes('japan') || culturalNotes.includes('japanese')) {
      geography = 'Japan'
    } else if (approach.includes('africa') || culturalNotes.includes('african')) {
      geography = 'Africa'
    } else if (approach.includes('middle east') || culturalNotes.includes('middle east')) {
      geography = 'Middle East'
    }

    const existing = byGeography.get(geography) || []
    existing.push(rel)
    byGeography.set(geography, existing)
  })

  // Build patterns per geography
  const patterns = new Map<string, CulturalPattern>()

  byGeography.forEach((rels, geography) => {
    // Common approaches
    const approaches = rels
      .map(r => r.cultural_approach)
      .filter(Boolean) as string[]
    const approachCounts = new Map<string, number>()
    approaches.forEach(a => {
      approachCounts.set(a, (approachCounts.get(a) || 0) + 1)
    })
    const commonApproaches = Array.from(approachCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([approach]) => approach)

    // Key insights from cultural_context
    const allInsights: string[] = []
    rels.forEach(rel => {
      (rel.interactions as any[])?.forEach((i: any) => {
        if (i.cultural_context) {
          // Extract key phrases (simple approach)
          const phrases = i.cultural_context
            .split(/[.!?]/)
            .filter((p: string) => p.trim().length > 10 && p.trim().length < 100)
            .slice(0, 2)
          allInsights.push(...phrases.map((p: string) => p.trim()))
        }
      })
    })
    const keyInsights = [...new Set(allInsights)].slice(0, 5)

    // Average meetings before "Qualified" or "Committed" stage
    let totalMeetings = 0
    let countWithStages = 0
    rels.forEach(rel => {
      const transitions = rel.stage_transitions as any[] || []
      const qualifiedTransition = transitions.find(
        (t: any) => t.to_stage === 'Qualified' || t.to_stage === 'Committed'
      )
      if (qualifiedTransition) {
        const interactions = rel.interactions as any[] || []
        const meetingsBefore = interactions.filter(
          (i: any) => new Date(i.meeting_date) <= new Date(qualifiedTransition.transition_date)
        ).length
        totalMeetings += meetingsBefore
        countWithStages++
      }
    })
    const avgMeetingsBeforeProposal = countWithStages > 0
      ? Math.round(totalMeetings / countWithStages * 10) / 10
      : 0

    // Communication style inference
    const communicationStyle: string[] = []
    if (commonApproaches.some(a => a.toLowerCase().includes('formal'))) {
      communicationStyle.push('Formal communication preferred')
    }
    if (commonApproaches.some(a => a.toLowerCase().includes('relationship'))) {
      communicationStyle.push('Relationship-first approach')
    }
    if (commonApproaches.some(a => a.toLowerCase().includes('direct'))) {
      communicationStyle.push('Direct communication style')
    }
    if (avgMeetingsBeforeProposal > 4) {
      communicationStyle.push('Extended relationship building')
    }

    patterns.set(geography, {
      geography,
      relationshipCount: rels.length,
      commonApproaches,
      avgMeetingsBeforeProposal,
      keyInsights,
      communicationStyle
    })
  })

  return patterns
}

// Get cultural context for a specific relationship
export async function getRelationshipCulturalContext(
  relationshipId: string
): Promise<RelationshipCulturalContext | null> {
  const { data: relationship, error } = await supabase
    .from('relationships')
    .select(`
      id,
      name,
      organization,
      cultural_approach,
      interactions (
        cultural_context,
        meeting_date
      )
    `)
    .eq('id', relationshipId)
    .single()

  if (error || !relationship) return null

  // Infer geography
  const approach = relationship.cultural_approach?.toLowerCase() || ''
  let geography = 'Global'
  
  if (approach.includes('brazil')) geography = 'Brazil'
  else if (approach.includes('latam')) geography = 'Latin America'
  else if (approach.includes('us') || approach.includes('american')) geography = 'United States'
  else if (approach.includes('europe') || approach.includes('eu')) geography = 'Europe'
  else if (approach.includes('asia')) geography = 'Asia-Pacific'

  // Extract cultural insights from interactions
  const culturalInsights = (relationship.interactions as any[])
    ?.filter(i => i.cultural_context)
    .map(i => i.cultural_context)
    .slice(0, 5) || []

  return {
    relationshipId: relationship.id,
    name: relationship.name,
    organization: relationship.organization || '',
    geography,
    culturalApproach: relationship.cultural_approach,
    culturalInsights,
    meetingCount: (relationship.interactions as any[])?.length || 0
  }
}

// Get cultural preparation notes for a meeting
export async function getCulturalPrepForMeeting(
  relationshipId: string
): Promise<{
  geography: string
  approach: string | null
  avgMeetingsInRegion: number
  keyConsiderations: string[]
  previousCulturalNotes: string[]
}> {
  const context = await getRelationshipCulturalContext(relationshipId)
  if (!context) {
    return {
      geography: 'Global',
      approach: null,
      avgMeetingsInRegion: 0,
      keyConsiderations: [],
      previousCulturalNotes: []
    }
  }

  const patterns = await getCulturalPatterns()
  const regionPattern = patterns.get(context.geography)

  return {
    geography: context.geography,
    approach: context.culturalApproach,
    avgMeetingsInRegion: regionPattern?.avgMeetingsBeforeProposal || 0,
    keyConsiderations: regionPattern?.communicationStyle || [],
    previousCulturalNotes: context.culturalInsights
  }
}

// Get all unique geographies with relationship counts
export async function getGeographyDistribution(): Promise<Map<string, number>> {
  const patterns = await getCulturalPatterns()
  const distribution = new Map<string, number>()
  
  patterns.forEach((pattern, geography) => {
    distribution.set(geography, pattern.relationshipCount)
  })

  return distribution
}
