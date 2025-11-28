// lib/queries/proof-points.ts
// Proof Point Intelligence - Track which case studies resonate with which personas/geographies

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface ProofPointPerformance {
  id: string
  name: string
  category: string
  description: string
  quantifiedResult: string | null
  sourceClient: string | null
  canNamePublicly: boolean
  timesUsed: number
  timesResonated: number
  resonanceRate: number
  relevantPersonas: string[]
  relevantGeographies: string[]
  relevantServices: string[]
  recentUsage: Array<{
    relationshipName: string
    date: string
    resonated: boolean
    reactionNotes: string | null
  }>
  bestWithPersonas: string[]
  bestInGeographies: string[]
}

export interface ProofPointIntelligence {
  totalProofPoints: number
  overallResonanceRate: number
  proofPoints: ProofPointPerformance[]
  topPerformers: ProofPointPerformance[]
  byCategory: Map<string, ProofPointPerformance[]>
  personaEffectiveness: Map<string, { proofPoint: string; rate: number }[]>
}

export async function getProofPointIntelligence(): Promise<ProofPointIntelligence> {
  // Get proof points with usage data
  const { data: proofPoints, error } = await supabase
    .from('proof_points')
    .select(`
      *,
      proof_point_usage (
        resonated,
        reaction_notes,
        created_at,
        relationship_id
      )
    `)
    .order('resonance_rate', { ascending: false })

  if (error) {
    console.error('Error fetching proof points:', error)
    return {
      totalProofPoints: 0,
      overallResonanceRate: 0,
      proofPoints: [],
      topPerformers: [],
      byCategory: new Map(),
      personaEffectiveness: new Map()
    }
  }

  if (!proofPoints || proofPoints.length === 0) {
    return {
      totalProofPoints: 0,
      overallResonanceRate: 0,
      proofPoints: [],
      topPerformers: [],
      byCategory: new Map(),
      personaEffectiveness: new Map()
    }
  }

  // Fetch relationship names for usage records
  const relationshipIds = new Set<string>()
  proofPoints.forEach(pp => {
    pp.proof_point_usage?.forEach((u: any) => {
      if (u.relationship_id) relationshipIds.add(u.relationship_id)
    })
  })

  const { data: relationships } = await supabase
    .from('relationships')
    .select('id, name, organization')
    .in('id', Array.from(relationshipIds))

  const relationshipMap = new Map(
    relationships?.map(r => [r.id, r]) || []
  )

  // Transform to performance objects
  const performances: ProofPointPerformance[] = proofPoints.map(pp => {
    const usage = pp.proof_point_usage || []
    
    // Recent usage (last 5)
    const recentUsage = usage
      .sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 5)
      .map((u: any) => {
        const rel = relationshipMap.get(u.relationship_id)
        return {
          relationshipName: rel?.name || 'Unknown',
          date: u.created_at,
          resonated: u.resonated || false,
          reactionNotes: u.reaction_notes
        }
      })

    return {
      id: pp.id,
      name: pp.name,
      category: pp.category || 'Uncategorized',
      description: pp.description,
      quantifiedResult: pp.quantified_result,
      sourceClient: pp.source_client,
      canNamePublicly: pp.can_name_publicly || false,
      timesUsed: pp.times_used || usage.length,
      timesResonated: pp.times_resonated || usage.filter((u: any) => u.resonated).length,
      resonanceRate: pp.resonance_rate || 0,
      relevantPersonas: pp.relevant_personas || [],
      relevantGeographies: pp.relevant_geographies || [],
      relevantServices: pp.relevant_services || [],
      recentUsage,
      bestWithPersonas: pp.relevant_personas || [],
      bestInGeographies: pp.relevant_geographies || []
    }
  })

  // Overall stats
  const totalUsed = performances.reduce((sum, p) => sum + p.timesUsed, 0)
  const totalResonated = performances.reduce((sum, p) => sum + p.timesResonated, 0)
  const overallResonanceRate = totalUsed > 0
    ? Math.round((totalResonated / totalUsed) * 100)
    : 0

  // Top performers (min 3 uses, sorted by resonance rate)
  const topPerformers = performances
    .filter(p => p.timesUsed >= 3)
    .sort((a, b) => b.resonanceRate - a.resonanceRate)
    .slice(0, 5)

  // Group by category
  const byCategory = new Map<string, ProofPointPerformance[]>()
  performances.forEach(p => {
    const existing = byCategory.get(p.category) || []
    existing.push(p)
    byCategory.set(p.category, existing)
  })

  // Persona effectiveness
  const personaEffectiveness = new Map<string, { proofPoint: string; rate: number }[]>()
  performances.forEach(p => {
    p.relevantPersonas.forEach(persona => {
      const existing = personaEffectiveness.get(persona) || []
      existing.push({ proofPoint: p.name, rate: p.resonanceRate })
      personaEffectiveness.set(persona, existing)
    })
  })
  // Sort each persona's proof points by rate
  personaEffectiveness.forEach((points, persona) => {
    personaEffectiveness.set(
      persona,
      points.sort((a, b) => b.rate - a.rate).slice(0, 3)
    )
  })

  return {
    totalProofPoints: proofPoints.length,
    overallResonanceRate,
    proofPoints: performances,
    topPerformers,
    byCategory,
    personaEffectiveness
  }
}

// Helper to get recommended proof points for a meeting
export async function getRecommendedProofPoints(
  personaType?: string,
  geography?: string,
  serviceId?: string
): Promise<ProofPointPerformance[]> {
  const intelligence = await getProofPointIntelligence()
  
  return intelligence.proofPoints
    .filter(pp => {
      // Match criteria with scoring
      let score = pp.resonanceRate
      
      if (personaType && pp.relevantPersonas.includes(personaType)) {
        score += 20
      }
      if (geography && pp.relevantGeographies.includes(geography)) {
        score += 15
      }
      if (serviceId && pp.relevantServices.includes(serviceId)) {
        score += 15
      }
      
      return score > pp.resonanceRate // Has at least one match
    })
    .sort((a, b) => {
      // Sort by match quality + resonance rate
      const aScore = a.resonanceRate + 
        (personaType && a.relevantPersonas.includes(personaType) ? 20 : 0) +
        (geography && a.relevantGeographies.includes(geography) ? 15 : 0) +
        (serviceId && a.relevantServices.includes(serviceId) ? 15 : 0)
      const bScore = b.resonanceRate +
        (personaType && b.relevantPersonas.includes(personaType) ? 20 : 0) +
        (geography && b.relevantGeographies.includes(geography) ? 15 : 0) +
        (serviceId && b.relevantServices.includes(serviceId) ? 15 : 0)
      return bScore - aScore
    })
    .slice(0, 5)
}

// Get proof points by category for selection UI
export async function getProofPointsByCategory(): Promise<Map<string, ProofPointPerformance[]>> {
  const intelligence = await getProofPointIntelligence()
  return intelligence.byCategory
}

// Get best proof points for a specific persona
export async function getBestProofPointsForPersona(
  personaName: string
): Promise<ProofPointPerformance[]> {
  const intelligence = await getProofPointIntelligence()
  
  return intelligence.proofPoints
    .filter(pp => pp.relevantPersonas.includes(personaName))
    .sort((a, b) => b.resonanceRate - a.resonanceRate)
    .slice(0, 5)
}
