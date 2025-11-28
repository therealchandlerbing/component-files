// lib/queries/temperature-velocity.ts
// Phase 4: Commitment & Trust Dynamics - Temperature Momentum Tracking

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface TemperatureChange {
  date: string
  change: 'warmer' | 'cooler' | 'stable'
  context: string
}

export interface TemperatureVelocity {
  relationshipId: string
  currentTemp: string
  momentum: 'heating' | 'cooling' | 'stable'
  momentumStrength: 'strong' | 'moderate' | 'weak'
  recentChanges: TemperatureChange[]
  consecutiveDirection: number // How many consecutive interactions in same direction
}

export interface TemperatureVelocityDashboard {
  heating: Array<{
    relationshipId: string
    name: string
    organization: string
    currentTemp: string
    momentum: 'heating'
    recentChanges: TemperatureChange[]
  }>
  cooling: Array<{
    relationshipId: string
    name: string
    organization: string
    currentTemp: string
    momentum: 'cooling'
    recentChanges: TemperatureChange[]
  }>
  summary: {
    totalActive: number
    heating: number
    cooling: number
    stable: number
  }
}

export async function getTemperatureVelocity(
  relationshipId: string
): Promise<TemperatureVelocity | null> {
  // Get relationship with recent interactions
  const { data: relationship, error } = await supabase
    .from('relationships')
    .select(`
      id,
      relationship_temperature,
      interactions (
        meeting_date,
        temperature_change,
        outcome
      )
    `)
    .eq('id', relationshipId)
    .single()

  if (error || !relationship) {
    console.error('Error fetching relationship:', error)
    return null
  }

  const recentInteractions = (relationship.interactions || [])
    .filter((i: any) => i.temperature_change)
    .sort((a: any, b: any) => 
      new Date(b.meeting_date).getTime() - new Date(a.meeting_date).getTime()
    )
    .slice(0, 5) // Look at last 5 interactions for momentum

  if (recentInteractions.length === 0) {
    return {
      relationshipId,
      currentTemp: relationship.relationship_temperature || 'unknown',
      momentum: 'stable',
      momentumStrength: 'weak',
      recentChanges: [],
      consecutiveDirection: 0
    }
  }

  // Determine momentum from recent interactions
  const changes = recentInteractions.map((i: any) => i.temperature_change)
  const warmerCount = changes.filter((c: string) => c === 'warmer').length
  const coolerCount = changes.filter((c: string) => c === 'cooler').length

  let momentum: 'heating' | 'cooling' | 'stable' = 'stable'
  let momentumStrength: 'strong' | 'moderate' | 'weak' = 'weak'
  
  // Calculate consecutive direction
  let consecutiveDirection = 0
  const firstChange = changes[0]
  for (const change of changes) {
    if (change === firstChange) {
      consecutiveDirection++
    } else {
      break
    }
  }

  // Determine momentum
  if (warmerCount > coolerCount) {
    momentum = 'heating'
    if (warmerCount >= 3 || consecutiveDirection >= 3) {
      momentumStrength = 'strong'
    } else if (warmerCount >= 2) {
      momentumStrength = 'moderate'
    }
  } else if (coolerCount > warmerCount) {
    momentum = 'cooling'
    if (coolerCount >= 3 || consecutiveDirection >= 3) {
      momentumStrength = 'strong'
    } else if (coolerCount >= 2) {
      momentumStrength = 'moderate'
    }
  }

  return {
    relationshipId,
    currentTemp: relationship.relationship_temperature || 'unknown',
    momentum,
    momentumStrength,
    recentChanges: recentInteractions.map((i: any) => ({
      date: i.meeting_date,
      change: i.temperature_change as 'warmer' | 'cooler' | 'stable',
      context: i.outcome || ''
    })),
    consecutiveDirection: momentum === 'stable' ? 0 : consecutiveDirection
  }
}

// Batch version for dashboard
export async function getAllTemperatureVelocities(): Promise<Map<string, TemperatureVelocity>> {
  const { data: relationships, error } = await supabase
    .from('relationships')
    .select(`
      id,
      relationship_temperature,
      interactions (
        meeting_date,
        temperature_change,
        outcome
      )
    `)
    .eq('is_active', true)

  if (error || !relationships) {
    console.error('Error fetching relationships:', error)
    return new Map()
  }

  const velocities = new Map<string, TemperatureVelocity>()

  relationships.forEach((rel: any) => {
    const recentInteractions = (rel.interactions || [])
      .filter((i: any) => i.temperature_change)
      .sort((a: any, b: any) => 
        new Date(b.meeting_date).getTime() - new Date(a.meeting_date).getTime()
      )
      .slice(0, 5)

    const changes = recentInteractions.map((i: any) => i.temperature_change)
    const warmerCount = changes.filter((c: string) => c === 'warmer').length
    const coolerCount = changes.filter((c: string) => c === 'cooler').length

    let momentum: 'heating' | 'cooling' | 'stable' = 'stable'
    let momentumStrength: 'strong' | 'moderate' | 'weak' = 'weak'
    
    let consecutiveDirection = 0
    if (changes.length > 0) {
      const firstChange = changes[0]
      for (const change of changes) {
        if (change === firstChange) {
          consecutiveDirection++
        } else {
          break
        }
      }
    }

    if (warmerCount > coolerCount) {
      momentum = 'heating'
      if (warmerCount >= 3 || consecutiveDirection >= 3) {
        momentumStrength = 'strong'
      } else if (warmerCount >= 2) {
        momentumStrength = 'moderate'
      }
    } else if (coolerCount > warmerCount) {
      momentum = 'cooling'
      if (coolerCount >= 3 || consecutiveDirection >= 3) {
        momentumStrength = 'strong'
      } else if (coolerCount >= 2) {
        momentumStrength = 'moderate'
      }
    }

    velocities.set(rel.id, {
      relationshipId: rel.id,
      currentTemp: rel.relationship_temperature || 'unknown',
      momentum,
      momentumStrength,
      recentChanges: recentInteractions.map((i: any) => ({
        date: i.meeting_date,
        change: i.temperature_change as 'warmer' | 'cooler' | 'stable',
        context: i.outcome || ''
      })),
      consecutiveDirection: momentum === 'stable' ? 0 : consecutiveDirection
    })
  })

  return velocities
}

// Dashboard summary with names
export async function getTemperatureVelocityDashboard(): Promise<TemperatureVelocityDashboard> {
  const { data: relationships, error } = await supabase
    .from('relationships')
    .select(`
      id,
      name,
      organization,
      relationship_temperature,
      interactions (
        meeting_date,
        temperature_change,
        outcome
      )
    `)
    .eq('is_active', true)

  if (error || !relationships) {
    return {
      heating: [],
      cooling: [],
      summary: { totalActive: 0, heating: 0, cooling: 0, stable: 0 }
    }
  }

  const heating: TemperatureVelocityDashboard['heating'] = []
  const cooling: TemperatureVelocityDashboard['cooling'] = []
  let stableCount = 0

  relationships.forEach((rel: any) => {
    const recentInteractions = (rel.interactions || [])
      .filter((i: any) => i.temperature_change)
      .sort((a: any, b: any) => 
        new Date(b.meeting_date).getTime() - new Date(a.meeting_date).getTime()
      )
      .slice(0, 3)

    if (recentInteractions.length === 0) {
      stableCount++
      return
    }

    const changes = recentInteractions.map((i: any) => i.temperature_change)
    const warmerCount = changes.filter((c: string) => c === 'warmer').length
    const coolerCount = changes.filter((c: string) => c === 'cooler').length

    const recentChanges = recentInteractions.map((i: any) => ({
      date: i.meeting_date,
      change: i.temperature_change as 'warmer' | 'cooler' | 'stable',
      context: i.outcome || ''
    }))

    if (warmerCount > coolerCount && warmerCount >= 2) {
      heating.push({
        relationshipId: rel.id,
        name: rel.name,
        organization: rel.organization,
        currentTemp: rel.relationship_temperature,
        momentum: 'heating',
        recentChanges
      })
    } else if (coolerCount > warmerCount && coolerCount >= 2) {
      cooling.push({
        relationshipId: rel.id,
        name: rel.name,
        organization: rel.organization,
        currentTemp: rel.relationship_temperature,
        momentum: 'cooling',
        recentChanges
      })
    } else {
      stableCount++
    }
  })

  return {
    heating,
    cooling,
    summary: {
      totalActive: relationships.length,
      heating: heating.length,
      cooling: cooling.length,
      stable: stableCount
    }
  }
}

// Demo data
export function getDemoTemperatureVelocityDashboard(): TemperatureVelocityDashboard {
  return {
    heating: [
      {
        relationshipId: 'demo-heat-1',
        name: 'Elena Rodrigues',
        organization: 'Fundação Esperança',
        currentTemp: 'warm',
        momentum: 'heating',
        recentChanges: [
          { date: '2024-01-15', change: 'warmer', context: 'Strong alignment on partnership model' },
          { date: '2024-01-08', change: 'warmer', context: 'Positive intro to board chair' },
          { date: '2024-01-02', change: 'stable', context: 'Initial scoping call' }
        ]
      },
      {
        relationshipId: 'demo-heat-2',
        name: 'David Park',
        organization: 'Pacific Innovation Lab',
        currentTemp: 'hot',
        momentum: 'heating',
        recentChanges: [
          { date: '2024-01-18', change: 'warmer', context: 'Verbal commitment on pilot' },
          { date: '2024-01-10', change: 'warmer', context: 'Budget approved' }
        ]
      }
    ],
    cooling: [
      {
        relationshipId: 'demo-cool-1',
        name: 'Jennifer Walsh',
        organization: 'Northern Civic Foundation',
        currentTemp: 'cooling',
        momentum: 'cooling',
        recentChanges: [
          { date: '2024-01-12', change: 'cooler', context: 'Budget constraints mentioned' },
          { date: '2024-01-05', change: 'cooler', context: 'Key champion left org' },
          { date: '2023-12-20', change: 'stable', context: 'Holiday check-in' }
        ]
      }
    ],
    summary: {
      totalActive: 24,
      heating: 2,
      cooling: 1,
      stable: 21
    }
  }
}
