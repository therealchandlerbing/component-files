# Fathom Intelligence: Phase 4
## Commitment & Trust Dynamics

Surface hidden accountability signals from your existing data. See who owes what to whom, identify stalled relationships, and track temperature momentum.

---

## Quick Start

```bash
# 1. Copy files to your project
cp -r lib/queries/* /your-project/lib/queries/
cp -r components/dashboard/* /your-project/components/dashboard/
cp styles/phase4-variables.css /your-project/styles/

# 2. Add CSS variables to your globals.css
@import './phase4-variables.css';

# 3. Add to your dashboard
```

```tsx
import { CommitmentScorecard } from '@/components/dashboard/CommitmentScorecard'
import { StallRiskAlert } from '@/components/dashboard/StallRiskAlert'
import { TemperatureVelocityPanel } from '@/components/dashboard/TemperatureVelocity'

// Use demo mode to preview without data
<CommitmentScorecard useDemo />
<StallRiskAlert useDemo />
<TemperatureVelocityPanel useDemo />
```

---

## What's Included

| File | Purpose |
|------|---------|
| `lib/queries/commitments.ts` | Completion rates, overdue tracking, trust balance |
| `lib/queries/stall-risks.ts` | Detects relationships stuck in stage too long |
| `lib/queries/temperature-velocity.ts` | Tracks heating/cooling momentum |
| `components/dashboard/CommitmentScorecard.tsx` | "We owe" vs "They owe" accountability view |
| `components/dashboard/StallRiskAlert.tsx` | Risk cards with suggested actions |
| `components/dashboard/TemperatureVelocity.tsx` | Heating/cooling relationship panel |
| `styles/phase4-variables.css` | Design tokens (colors, badges, animations) |

---

## Features

### Commitment Scorecard
- Split view: What we owe vs what they owe
- 30-day completion rates
- Trust balance indicator
- Overdue items with day counts

### Stall Risk Alerts
- High/medium risk categorization
- Days in stage vs historical average
- Risk factors (no contact, cooling temp)
- Suggested next actions per stage

### Temperature Velocity
- Relationships heating up (2+ warming interactions)
- Relationships cooling down (2+ cooling interactions)
- Recent interaction context
- Inline badges for relationship cards

---

## Data Requirements

Uses your existing Supabase tables:
- `commitments` (owner, status, due_date, completed_at)
- `stage_transitions` (relationship_id, to_stage, transition_date, days_in_previous_stage)
- `interactions` (temperature_change, meeting_date, outcome)
- `relationships` (name, organization, relationship_temperature)

No new tables or migrations required.

---

## Configuration

Update the Supabase client import in each query file:

```typescript
// Change this:
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// To your existing client:
import { supabase } from '@/lib/supabase'
```

---

## Props

### CommitmentScorecard
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `useDemo` | boolean | false | Use demo data instead of Supabase |
| `compact` | boolean | false | Compact layout for sidebars |

### StallRiskAlert
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `useDemo` | boolean | false | Use demo data |
| `maxItems` | number | 5 | Max items before "View all" |

### TemperatureVelocityPanel
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `useDemo` | boolean | false | Use demo data |

---

See `INTEGRATION-GUIDE.md` for detailed installation steps and troubleshooting.
