# Phase 4: Commitment & Trust Dynamics
## Integration Guide

**Priority**: Sprint 1 (Quick Wins)  
**Estimated Effort**: 2-3 days  
**Dependencies**: None (uses existing schema)

---

## Overview

Phase 4 surfaces hidden accountability signals from your existing Fathom Intelligence data. The system already captures commitment completion and stage duration data but doesn't visualize accountability or risk. These features require minimal new code and immediately surface actionable intelligence.

### What This Batch Delivers

1. **Commitment Scorecard**: See who owes what to whom, completion rates, and trust balance
2. **Stall Risk Alerts**: Identify relationships exceeding expected stage duration
3. **Temperature Velocity**: Track which relationships are heating up or cooling down

---

## File Structure

```
fathom-intelligence/
├── lib/
│   └── queries/
│       ├── commitments.ts      ← Commitment metrics query
│       ├── stall-risks.ts      ← Stall risk detection query
│       └── temperature-velocity.ts  ← Temperature momentum query
├── components/
│   └── dashboard/
│       ├── CommitmentScorecard.tsx   ← Commitment accountability UI
│       ├── StallRiskAlert.tsx        ← Risk alert UI
│       └── TemperatureVelocity.tsx   ← Temperature momentum UI
└── styles/
    └── phase4-variables.css    ← CSS design tokens
```

---

## Installation Steps

### Step 1: Add CSS Variables

Add the variables from `styles/phase4-variables.css` to your existing `globals.css`:

```css
/* In app/globals.css or styles/globals.css */
@import './phase4-variables.css';
```

Or copy the variables directly into your existing root CSS.

### Step 2: Copy Query Files

Copy the three query files to your `lib/queries/` directory:

```bash
cp lib/queries/commitments.ts /your-project/lib/queries/
cp lib/queries/stall-risks.ts /your-project/lib/queries/
cp lib/queries/temperature-velocity.ts /your-project/lib/queries/
```

### Step 3: Copy Components

Copy the dashboard components:

```bash
cp components/dashboard/CommitmentScorecard.tsx /your-project/components/dashboard/
cp components/dashboard/StallRiskAlert.tsx /your-project/components/dashboard/
cp components/dashboard/TemperatureVelocity.tsx /your-project/components/dashboard/
```

### Step 4: Update Supabase Client Import

Each query file assumes a Supabase client. Update the import path to match your project:

```typescript
// In each query file, update this import:
import { createClient } from '@supabase/supabase-js'

// If you have a shared client, change to:
import { supabase } from '@/lib/supabase'
```

---

## Dashboard Integration

### Main Dashboard (app/page.tsx)

Replace or augment your existing commitment display:

```tsx
import { CommitmentScorecard } from '@/components/dashboard/CommitmentScorecard'
import { StallRiskAlert } from '@/components/dashboard/StallRiskAlert'
import { TemperatureVelocityPanel } from '@/components/dashboard/TemperatureVelocity'

export default function DashboardPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main content area */}
      <div className="lg:col-span-2 space-y-6">
        {/* Your existing content */}
        
        {/* Add Stall Risk Alert below "Needs Attention" */}
        <StallRiskAlert />
      </div>

      {/* Right sidebar */}
      <div className="space-y-6">
        {/* Replace simple commitment count with scorecard */}
        <CommitmentScorecard />
        
        {/* Add temperature momentum panel */}
        <TemperatureVelocityPanel />
      </div>
    </div>
  )
}
```

### Using Demo Data for Development

Each component accepts a `useDemo` prop for development/preview:

```tsx
{/* Development mode */}
<CommitmentScorecard useDemo />
<StallRiskAlert useDemo />
<TemperatureVelocityPanel useDemo />
```

### Compact Mode for Sidebars

The CommitmentScorecard supports a compact layout:

```tsx
<CommitmentScorecard compact />
```

---

## Relationship Cards Integration

Add temperature velocity badges to your relationship cards:

```tsx
// In your RelationshipCard component
import { TemperatureVelocityBadge } from '@/components/dashboard/TemperatureVelocity'

function RelationshipCard({ relationship, velocity }) {
  return (
    <div className="card">
      <div className="flex items-center gap-2">
        <h3>{relationship.name}</h3>
        {velocity && (
          <TemperatureVelocityBadge 
            momentum={velocity.momentum} 
            showLabel 
          />
        )}
      </div>
      {/* ... rest of card */}
    </div>
  )
}
```

---

## Data Requirements

These components query your existing Supabase tables:

### commitments table
```sql
-- Required columns
id, call_id, owner, owner_name, description,
commitment_type, due_date, status, confidence,
completed_at, created_at, updated_at

-- owner values: 'us', 'ours', '360' (we owe them)
--               'them', 'theirs', 'partner', 'client' (they owe us)
-- status values: 'pending', 'completed'
```

### stage_transitions table
```sql
-- Required columns
id, relationship_id, from_stage, to_stage,
transition_date, days_in_previous_stage
```

### interactions table
```sql
-- Required columns
id, call_id, meeting_date, temperature_change, outcome

-- temperature_change values: 'warmer', 'cooler', 'stable'
```

### relationships table
```sql
-- Required columns
id, name, organization, relationship_temperature,
last_interaction_date, is_active
```

---

## Testing Checklist

- [ ] Commitment completion rate calculates correctly
- [ ] Overdue commitments display with correct day counts
- [ ] "We Owe Them" vs "They Owe Us" separates correctly
- [ ] Trust balance indicator reflects reciprocity
- [ ] Stall risk detection identifies relationships >1.5x average stage duration
- [ ] Risk levels (high/medium) sort correctly
- [ ] Temperature velocity identifies 2+ warming or cooling interactions
- [ ] All components handle empty data gracefully
- [ ] All components display loading states
- [ ] Demo data displays correctly when useDemo is true
- [ ] Real Supabase data displays correctly

---

## Success Criteria

After implementation, your dashboard should:

1. **Show commitment accountability** (not just pending count)
   - Split view: What we owe vs what they owe
   - Completion rates for both sides
   - Trust balance indicator

2. **Surface at-risk relationships immediately**
   - High/medium risk categorization
   - Days in stage vs average
   - Suggested next actions

3. **Inform prioritization with temperature trends**
   - Relationships heating up (momentum building)
   - Relationships cooling down (attention needed)
   - Recent interaction context

---

## Troubleshooting

### No data appearing
1. Check Supabase connection string in environment variables
2. Verify table names match your schema
3. Check for RLS policies that might restrict access
4. Try `useDemo` prop to confirm component renders

### Wrong commitment counts
1. Verify `owner` field values match expected strings ('us', 'them', etc.)
2. Check `status` field values ('pending', 'completed')

### Stall risks not detecting
1. Verify `stage_transitions` table has data
2. Check `transition_date` format (should be ISO date)
3. Verify relationships have `is_active = true`

### Temperature velocity not showing
1. Check `temperature_change` values in interactions ('warmer', 'cooler', 'stable')
2. Need 2+ interactions with same direction to trigger momentum

---

## Next Steps

After Phase 4 is running:

- **Phase 2**: Competitive & Objection Intelligence (different data domain)
- **Phase 3**: Proof Points & Network Effects (builds on relationships)
- **Phase 5**: Meeting Timing Optimization (adds predictive layer)

Each phase is independent and can be implemented in any order after Phase 4.
