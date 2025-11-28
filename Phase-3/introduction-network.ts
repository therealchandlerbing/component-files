// lib/queries/introduction-network.ts
// Introduction Network Intelligence - Track who's connecting you to value

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface IntroducerStats {
  id: string
  name: string
  organization: string
  introsMade: number
  introsReceived: number
  meetingsGenerated: number
  dealsGenerated: number
  totalValueGenerated: number
  conversionRate: number
  introductions: IntroductionRecord[]
}

export interface IntroductionRecord {
  id: string
  direction: 'made' | 'received'
  introducedName: string
  introducedOrg: string
  status: string
  madeAt: string | null
  firstMeetingAt: string | null
  outcome: string | null
  valueGenerated: number | null
}

export interface IntroductionFunnel {
  totalIntros: number
  meetingsSet: number
  activeDeals: number
  totalValue: number
  conversionRates: {
    introToMeeting: number
    meetingToDeal: number
    overall: number
  }
}

export interface IntroductionNetwork {
  funnel: IntroductionFunnel
  topIntroducers: IntroducerStats[]
  byDirection: {
    made: number
    received: number
  }
  recentIntroductions: IntroductionRecord[]
  networkValue: number
}

export async function getIntroductionNetwork(): Promise<IntroductionNetwork> {
  // Get introductions with relationship data
  const { data: introductions, error } = await supabase
    .from('introductions')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching introductions:', error)
    return {
      funnel: {
        totalIntros: 0,
        meetingsSet: 0,
        activeDeals: 0,
        totalValue: 0,
        conversionRates: { introToMeeting: 0, meetingToDeal: 0, overall: 0 }
      },
      topIntroducers: [],
      byDirection: { made: 0, received: 0 },
      recentIntroductions: [],
      networkValue: 0
    }
  }

  if (!introductions || introductions.length === 0) {
    return {
      funnel: {
        totalIntros: 0,
        meetingsSet: 0,
        activeDeals: 0,
        totalValue: 0,
        conversionRates: { introToMeeting: 0, meetingToDeal: 0, overall: 0 }
      },
      topIntroducers: [],
      byDirection: { made: 0, received: 0 },
      recentIntroductions: [],
      networkValue: 0
    }
  }

  // Fetch related relationships for introducer names
  const introducerIds = new Set<string>()
  const introducedIds = new Set<string>()
  
  introductions.forEach(intro => {
    if (intro.introducer_id) introducerIds.add(intro.introducer_id)
    if (intro.introduced_id) introducedIds.add(intro.introduced_id)
  })

  const allRelIds = [...introducerIds, ...introducedIds]
  const { data: relationships } = await supabase
    .from('relationships')
    .select('id, name, organization')
    .in('id', allRelIds)

  const relationshipMap = new Map(
    relationships?.map(r => [r.id, r]) || []
  )

  // Funnel metrics
  const totalIntros = introductions.length
  const meetingsSet = introductions.filter(i => i.first_meeting_at).length
  const activeDeals = introductions.filter(i => 
    i.outcome_relationship_id || i.outcome === 'active_deal' || i.outcome === 'converted'
  ).length
  const totalValue = introductions.reduce((sum, i) => sum + (i.value_generated || 0), 0)

  const funnel: IntroductionFunnel = {
    totalIntros,
    meetingsSet,
    activeDeals,
    totalValue,
    conversionRates: {
      introToMeeting: totalIntros > 0 ? Math.round((meetingsSet / totalIntros) * 100) : 0,
      meetingToDeal: meetingsSet > 0 ? Math.round((activeDeals / meetingsSet) * 100) : 0,
      overall: totalIntros > 0 ? Math.round((activeDeals / totalIntros) * 100) : 0
    }
  }

  // Group by introducer
  const introducerMap = new Map<string, IntroducerStats>()

  introductions.forEach(intro => {
    // Handle received introductions (someone introduced us)
    if (intro.direction === 'received' && intro.introducer_id) {
      const introducerId = intro.introducer_id
      const introducerRel = relationshipMap.get(introducerId)
      const introducedRel = intro.introduced_id ? relationshipMap.get(intro.introduced_id) : null
      
      const existing = introducerMap.get(introducerId) || {
        id: introducerId,
        name: introducerRel?.name || 'Unknown',
        organization: introducerRel?.organization || '',
        introsMade: 0,
        introsReceived: 0,
        meetingsGenerated: 0,
        dealsGenerated: 0,
        totalValueGenerated: 0,
        conversionRate: 0,
        introductions: []
      }

      existing.introsMade++ // They made intro to us
      if (intro.first_meeting_at) existing.meetingsGenerated++
      if (intro.outcome_relationship_id || intro.outcome === 'converted') {
        existing.dealsGenerated++
      }
      existing.totalValueGenerated += intro.value_generated || 0

      existing.introductions.push({
        id: intro.id,
        direction: 'received',
        introducedName: introducedRel?.name || intro.introduced_name || 'Unknown',
        introducedOrg: introducedRel?.organization || intro.introduced_organization || '',
        status: intro.status,
        madeAt: intro.made_at,
        firstMeetingAt: intro.first_meeting_at,
        outcome: intro.outcome,
        valueGenerated: intro.value_generated
      })

      introducerMap.set(introducerId, existing)
    }
  })

  // Calculate conversion rates
  introducerMap.forEach((stats, id) => {
    stats.conversionRate = stats.introsMade > 0
      ? Math.round((stats.dealsGenerated / stats.introsMade) * 100)
      : 0
    introducerMap.set(id, stats)
  })

  // Sort by value generated
  const topIntroducers = Array.from(introducerMap.values())
    .sort((a, b) => b.totalValueGenerated - a.totalValueGenerated)
    .slice(0, 10)

  // Direction counts
  const byDirection = {
    made: introductions.filter(i => i.direction === 'made').length,
    received: introductions.filter(i => i.direction === 'received').length
  }

  // Recent introductions
  const recentIntroductions = introductions.slice(0, 10).map(intro => {
    const introducedRel = intro.introduced_id ? relationshipMap.get(intro.introduced_id) : null
    return {
      id: intro.id,
      direction: intro.direction as 'made' | 'received',
      introducedName: introducedRel?.name || intro.introduced_name || 'Unknown',
      introducedOrg: introducedRel?.organization || intro.introduced_organization || '',
      status: intro.status,
      madeAt: intro.made_at,
      firstMeetingAt: intro.first_meeting_at,
      outcome: intro.outcome,
      valueGenerated: intro.value_generated
    }
  })

  return {
    funnel,
    topIntroducers,
    byDirection,
    recentIntroductions,
    networkValue: totalValue
  }
}

// Get introduction stats for a specific relationship (as introducer)
export async function getIntroducerStats(relationshipId: string): Promise<IntroducerStats | null> {
  const network = await getIntroductionNetwork()
  return network.topIntroducers.find(i => i.id === relationshipId) || null
}

// Get pending introductions that need follow-up
export async function getPendingIntroductions(): Promise<IntroductionRecord[]> {
  const { data: introductions, error } = await supabase
    .from('introductions')
    .select('*')
    .in('status', ['discussed', 'requested', 'pending'])
    .order('created_at', { ascending: false })

  if (error || !introductions) return []

  // Fetch relationship names
  const relIds = new Set<string>()
  introductions.forEach(i => {
    if (i.introduced_id) relIds.add(i.introduced_id)
  })

  const { data: relationships } = await supabase
    .from('relationships')
    .select('id, name, organization')
    .in('id', Array.from(relIds))

  const relMap = new Map(relationships?.map(r => [r.id, r]) || [])

  return introductions.map(intro => {
    const rel = intro.introduced_id ? relMap.get(intro.introduced_id) : null
    return {
      id: intro.id,
      direction: intro.direction as 'made' | 'received',
      introducedName: rel?.name || intro.introduced_name || 'Unknown',
      introducedOrg: rel?.organization || intro.introduced_organization || '',
      status: intro.status,
      madeAt: intro.made_at,
      firstMeetingAt: intro.first_meeting_at,
      outcome: intro.outcome,
      valueGenerated: intro.value_generated
    }
  })
}

// Calculate network ROI metrics
export async function getNetworkROI(): Promise<{
  totalIntroductionsReceived: number
  totalValueGenerated: number
  avgValuePerIntro: number
  topIntroducerName: string | null
  topIntroducerValue: number
}> {
  const network = await getIntroductionNetwork()
  
  const receivedIntros = network.byDirection.received
  const avgValuePerIntro = receivedIntros > 0 
    ? Math.round(network.networkValue / receivedIntros)
    : 0

  const topIntroducer = network.topIntroducers[0] || null

  return {
    totalIntroductionsReceived: receivedIntros,
    totalValueGenerated: network.networkValue,
    avgValuePerIntro,
    topIntroducerName: topIntroducer?.name || null,
    topIntroducerValue: topIntroducer?.totalValueGenerated || 0
  }
}
