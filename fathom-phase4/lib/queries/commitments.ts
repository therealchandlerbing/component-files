// lib/queries/commitments.ts
// Phase 4: Commitment & Trust Dynamics - Commitment Metrics Query

import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client (use your existing client setup)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface Commitment {
  id: string
  call_id: string | null
  owner: string | null
  owner_name: string | null
  description: string
  commitment_type: string | null
  due_date: string | null
  status: string
  confidence: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface CommitmentMetrics {
  us: {
    pending: number
    overdue: number
    completionRate30d: number
    avgDaysToComplete: number
    overdueItems: Commitment[]
  }
  them: {
    pending: number
    overdue: number
    completionRate30d: number
    avgDaysToComplete: number
    overdueItems: Commitment[]
  }
  trustScore: {
    weDeliver: number      // Our completion rate (how trustworthy we are)
    theyDeliver: number    // Their completion rate (how reliable they are)
    reciprocityBalance: number // Ratio of our vs their commitments
  }
}

export async function getCommitmentMetrics(): Promise<CommitmentMetrics> {
  const today = new Date().toISOString().split('T')[0]
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]

  // Get all commitments
  const { data: commitments, error } = await supabase
    .from('commitments')
    .select('*')
    .order('due_date', { ascending: true })

  if (error) {
    console.error('Error fetching commitments:', error)
    return getEmptyMetrics()
  }

  if (!commitments || commitments.length === 0) {
    return getEmptyMetrics()
  }

  // Separate by owner
  // "us" / "ours" = commitments WE made TO them
  // "them" / "theirs" = commitments THEY made TO us
  const usCommitments = commitments.filter(c => 
    c.owner === 'us' || c.owner === 'ours' || c.owner === '360'
  )
  const themCommitments = commitments.filter(c => 
    c.owner === 'them' || c.owner === 'theirs' || c.owner === 'partner' || c.owner === 'client'
  )

  // Calculate metrics for each side
  const calculateMetrics = (items: Commitment[]) => {
    const pending = items.filter(c => c.status === 'pending')
    const overdue = pending.filter(c => c.due_date && c.due_date < today)
    
    // Completion rate: completed in last 30 days / total due in last 30 days
    const dueInPeriod = items.filter(c => 
      c.due_date && c.due_date >= thirtyDaysAgo && c.due_date <= today
    )
    const completedInPeriod = dueInPeriod.filter(c => c.status === 'completed')
    const completionRate = dueInPeriod.length > 0 
      ? Math.round((completedInPeriod.length / dueInPeriod.length) * 100)
      : 100 // Default to 100% if nothing was due

    // Average days to complete (for completed items with both dates)
    const completedWithDates = items.filter(c => 
      c.completed_at && c.created_at && c.status === 'completed'
    )
    const avgDays = completedWithDates.length > 0
      ? completedWithDates.reduce((sum, c) => {
          const created = new Date(c.created_at)
          const completed = new Date(c.completed_at!)
          return sum + (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
        }, 0) / completedWithDates.length
      : 0

    return {
      pending: pending.length,
      overdue: overdue.length,
      completionRate30d: completionRate,
      avgDaysToComplete: Math.round(avgDays),
      overdueItems: overdue.sort((a, b) => {
        // Sort by most overdue first
        const daysA = getDaysOverdue(a.due_date!)
        const daysB = getDaysOverdue(b.due_date!)
        return daysB - daysA
      })
    }
  }

  const usMetrics = calculateMetrics(usCommitments)
  const themMetrics = calculateMetrics(themCommitments)

  // Calculate trust indicators
  const totalUs = usCommitments.length
  const totalThem = themCommitments.length
  const reciprocityBalance = totalThem > 0 ? totalUs / totalThem : 1

  return {
    us: usMetrics,
    them: themMetrics,
    trustScore: {
      weDeliver: usMetrics.completionRate30d,
      theyDeliver: themMetrics.completionRate30d,
      reciprocityBalance: Math.round(reciprocityBalance * 100) / 100
    }
  }
}

// Get commitments by relationship
export async function getCommitmentsByRelationship(relationshipId: string): Promise<{
  us: Commitment[]
  them: Commitment[]
}> {
  const { data: commitments, error } = await supabase
    .from('commitments')
    .select('*')
    .eq('relationship_id', relationshipId)
    .order('due_date', { ascending: true })

  if (error || !commitments) {
    return { us: [], them: [] }
  }

  return {
    us: commitments.filter(c => c.owner === 'us' || c.owner === 'ours'),
    them: commitments.filter(c => c.owner === 'them' || c.owner === 'theirs')
  }
}

// Mark a commitment as complete
export async function completeCommitment(commitmentId: string): Promise<boolean> {
  const { error } = await supabase
    .from('commitments')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', commitmentId)

  return !error
}

// Helper functions
function getDaysOverdue(dueDate: string): number {
  const due = new Date(dueDate)
  const today = new Date()
  return Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
}

function getEmptyMetrics(): CommitmentMetrics {
  return {
    us: {
      pending: 0,
      overdue: 0,
      completionRate30d: 100,
      avgDaysToComplete: 0,
      overdueItems: []
    },
    them: {
      pending: 0,
      overdue: 0,
      completionRate30d: 100,
      avgDaysToComplete: 0,
      overdueItems: []
    },
    trustScore: {
      weDeliver: 100,
      theyDeliver: 100,
      reciprocityBalance: 1
    }
  }
}

// Demo data for development/preview
export function getDemoCommitmentMetrics(): CommitmentMetrics {
  const today = new Date()
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

  return {
    us: {
      pending: 7,
      overdue: 2,
      completionRate30d: 78,
      avgDaysToComplete: 4,
      overdueItems: [
        {
          id: 'demo-1',
          call_id: 'demo-call-1',
          owner: 'us',
          owner_name: 'Team',
          description: 'Send partnership proposal to Innovate Foundation',
          commitment_type: 'deliverable',
          due_date: lastWeek.toISOString().split('T')[0],
          status: 'pending',
          confidence: 'high',
          completed_at: null,
          created_at: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'demo-2',
          call_id: 'demo-call-2',
          owner: 'us',
          owner_name: 'Chandler',
          description: 'Follow up on intro request from Roberto',
          commitment_type: 'follow-up',
          due_date: yesterday.toISOString().split('T')[0],
          status: 'pending',
          confidence: 'medium',
          completed_at: null,
          created_at: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
    },
    them: {
      pending: 4,
      overdue: 1,
      completionRate30d: 65,
      avgDaysToComplete: 6,
      overdueItems: [
        {
          id: 'demo-3',
          call_id: 'demo-call-3',
          owner: 'them',
          owner_name: 'Maria (Impact Partners)',
          description: 'Send budget breakdown for Q1 engagement',
          commitment_type: 'information',
          due_date: lastWeek.toISOString().split('T')[0],
          status: 'pending',
          confidence: 'high',
          completed_at: null,
          created_at: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
    },
    trustScore: {
      weDeliver: 78,
      theyDeliver: 65,
      reciprocityBalance: 1.75
    }
  }
}
