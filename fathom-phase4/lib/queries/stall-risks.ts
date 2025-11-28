// lib/queries/stall-risks.ts
// Phase 4: Commitment & Trust Dynamics - Stall Risk Detection Query

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface StallRisk {
  relationship: {
    id: string
    name: string
    organization: string
    temperature: string
  }
  currentStage: string
  daysInStage: number
  avgDaysForStage: number
  daysOverdue: number
  riskLevel: 'high' | 'medium' | 'low'
  riskFactors: string[]
  suggestedAction: string
  lastInteraction: string | null
}

export interface StallRiskSummary {
  totalAtRisk: number
  highRisk: number
  mediumRisk: number
  lowRisk: number
  risks: StallRisk[]
  stageHealthMap: Map<string, { healthy: number; atRisk: number }>
}

export async function getStallRisks(): Promise<StallRisk[]> {
  // Get the latest stage transition for each relationship
  const { data: transitions, error: transitionError } = await supabase
    .from('stage_transitions')
    .select(`
      *,
      relationships (
        id, name, organization, relationship_temperature, last_interaction_date
      )
    `)
    .order('transition_date', { ascending: false })

  if (transitionError) {
    console.error('Error fetching stage transitions:', transitionError)
    return []
  }

  if (!transitions || transitions.length === 0) {
    return []
  }

  // Group by relationship to get latest stage
  const latestByRelationship = new Map<string, typeof transitions[0]>()
  transitions.forEach(t => {
    if (!latestByRelationship.has(t.relationship_id)) {
      latestByRelationship.set(t.relationship_id, t)
    }
  })

  // Calculate average days per stage across all transitions
  const stageDurations = new Map<string, number[]>()
  transitions.forEach(t => {
    if (t.days_in_previous_stage && t.from_stage) {
      const existing = stageDurations.get(t.from_stage) || []
      existing.push(t.days_in_previous_stage)
      stageDurations.set(t.from_stage, existing)
    }
  })

  const stageAverages = new Map<string, number>()
  stageDurations.forEach((durations, stage) => {
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length
    stageAverages.set(stage, Math.round(avg))
  })

  // Default averages if insufficient data
  const defaultAverages: Record<string, number> = {
    'Identified': 14,
    'Engaged': 21,
    'Exploring': 21,
    'Qualified': 30,
    'Negotiating': 30,
    'Committed': 45,
    'Active': 60,
    'Nurturing': 30
  }

  // Find relationships at risk
  const today = new Date()
  const risks: StallRisk[] = []

  latestByRelationship.forEach((transition) => {
    if (!transition.relationships) return

    const transitionDate = new Date(transition.transition_date)
    const daysInStage = Math.floor(
      (today.getTime() - transitionDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    
    const avgDays = stageAverages.get(transition.to_stage) 
      || defaultAverages[transition.to_stage] 
      || 21

    const daysOverdue = daysInStage - avgDays

    // Only include if significantly overdue (>50% beyond average)
    if (daysInStage > avgDays * 1.5) {
      const riskLevel: 'high' | 'medium' | 'low' = 
        daysInStage > avgDays * 2 ? 'high' 
        : daysInStage > avgDays * 1.5 ? 'medium' 
        : 'low'

      // Identify risk factors
      const riskFactors: string[] = []
      if (daysInStage > avgDays * 2) {
        riskFactors.push('Significantly exceeded expected stage duration')
      }
      if (transition.relationships.relationship_temperature === 'cold' || 
          transition.relationships.relationship_temperature === 'cooling') {
        riskFactors.push('Relationship temperature is cold/cooling')
      }
      
      // Check for engagement gap
      const lastInteraction = transition.relationships.last_interaction_date
      if (lastInteraction) {
        const daysSinceContact = Math.floor(
          (today.getTime() - new Date(lastInteraction).getTime()) / (1000 * 60 * 60 * 24)
        )
        if (daysSinceContact > 14) {
          riskFactors.push(`No contact in ${daysSinceContact} days`)
        }
      }

      risks.push({
        relationship: {
          id: transition.relationships.id,
          name: transition.relationships.name || 'Unknown',
          organization: transition.relationships.organization || '',
          temperature: transition.relationships.relationship_temperature || 'unknown'
        },
        currentStage: transition.to_stage,
        daysInStage,
        avgDaysForStage: avgDays,
        daysOverdue,
        riskLevel,
        riskFactors,
        suggestedAction: getSuggestedAction(transition.to_stage, riskLevel),
        lastInteraction: transition.relationships.last_interaction_date
      })
    }
  })

  // Sort by risk level and days overdue
  return risks.sort((a, b) => {
    const riskOrder = { high: 0, medium: 1, low: 2 }
    if (riskOrder[a.riskLevel] !== riskOrder[b.riskLevel]) {
      return riskOrder[a.riskLevel] - riskOrder[b.riskLevel]
    }
    return b.daysOverdue - a.daysOverdue
  })
}

export async function getStallRiskSummary(): Promise<StallRiskSummary> {
  const risks = await getStallRisks()
  
  const highRisk = risks.filter(r => r.riskLevel === 'high').length
  const mediumRisk = risks.filter(r => r.riskLevel === 'medium').length
  const lowRisk = risks.filter(r => r.riskLevel === 'low').length

  // Build stage health map
  const stageHealthMap = new Map<string, { healthy: number; atRisk: number }>()
  risks.forEach(r => {
    const current = stageHealthMap.get(r.currentStage) || { healthy: 0, atRisk: 0 }
    current.atRisk++
    stageHealthMap.set(r.currentStage, current)
  })

  return {
    totalAtRisk: risks.length,
    highRisk,
    mediumRisk,
    lowRisk,
    risks,
    stageHealthMap
  }
}

function getSuggestedAction(stage: string, riskLevel: 'high' | 'medium' | 'low'): string {
  const stageActions: Record<string, Record<string, string>> = {
    'Identified': {
      high: 'Immediate outreach or archive if unresponsive',
      medium: 'Schedule initial discovery call',
      low: 'Send personalized follow-up'
    },
    'Engaged': {
      high: 'Executive escalation or decision-maker meeting',
      medium: 'Technical deep dive or needs assessment',
      low: 'Share relevant case study'
    },
    'Exploring': {
      high: 'Proposal or formal next steps discussion',
      medium: 'Address outstanding questions',
      low: 'Provide additional proof points'
    },
    'Qualified': {
      high: 'Executive alignment meeting ASAP',
      medium: 'Send formal proposal',
      low: 'Confirm decision timeline'
    },
    'Negotiating': {
      high: 'Address blockers directly',
      medium: 'Finalize terms and conditions',
      low: 'Clarify any remaining concerns'
    },
    'Committed': {
      high: 'Expedite contract finalization',
      medium: 'Schedule kickoff planning',
      low: 'Confirm start date and resources'
    }
  }

  return stageActions[stage]?.[riskLevel] || 'Schedule follow-up conversation'
}

// Demo data for development/preview
export function getDemoStallRisks(): StallRisk[] {
  return [
    {
      relationship: {
        id: 'demo-rel-1',
        name: 'Sarah Chen',
        organization: 'Innovate Foundation',
        temperature: 'warm'
      },
      currentStage: 'Qualified',
      daysInStage: 52,
      avgDaysForStage: 30,
      daysOverdue: 22,
      riskLevel: 'high',
      riskFactors: [
        'Significantly exceeded expected stage duration',
        'No contact in 18 days'
      ],
      suggestedAction: 'Executive alignment meeting ASAP',
      lastInteraction: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    },
    {
      relationship: {
        id: 'demo-rel-2',
        name: 'Marcus Rivera',
        organization: 'Global Impact Network',
        temperature: 'cooling'
      },
      currentStage: 'Engaged',
      daysInStage: 38,
      avgDaysForStage: 21,
      daysOverdue: 17,
      riskLevel: 'high',
      riskFactors: [
        'Significantly exceeded expected stage duration',
        'Relationship temperature is cold/cooling'
      ],
      suggestedAction: 'Executive escalation or decision-maker meeting',
      lastInteraction: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    },
    {
      relationship: {
        id: 'demo-rel-3',
        name: 'Ana Souza',
        organization: 'Instituto Brasil Futuro',
        temperature: 'warm'
      },
      currentStage: 'Exploring',
      daysInStage: 35,
      avgDaysForStage: 21,
      daysOverdue: 14,
      riskLevel: 'medium',
      riskFactors: [
        'No contact in 21 days'
      ],
      suggestedAction: 'Address outstanding questions',
      lastInteraction: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    },
    {
      relationship: {
        id: 'demo-rel-4',
        name: 'James Wright',
        organization: 'Community Partners Alliance',
        temperature: 'warm'
      },
      currentStage: 'Identified',
      daysInStage: 25,
      avgDaysForStage: 14,
      daysOverdue: 11,
      riskLevel: 'medium',
      riskFactors: [
        'No contact in 25 days'
      ],
      suggestedAction: 'Schedule initial discovery call',
      lastInteraction: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
  ]
}
