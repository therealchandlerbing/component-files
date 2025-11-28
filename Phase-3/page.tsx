// app/intelligence/page.tsx
// Intelligence Dashboard - Proof Points, Network ROI, Cultural Patterns

import { 
  ProofPointTracker, 
  IntroductionNetworkTracker, 
  CulturalIntelligencePanel 
} from '@/components/intelligence'

export const metadata = {
  title: 'Intelligence | Fathom',
  description: 'Proof points, network ROI, and cultural patterns'
}

export default function IntelligencePage() {
  return (
    <div className="min-h-screen bg-[var(--paper)]">
      {/* Header */}
      <header className="border-b border-[var(--border-subtle)] bg-[var(--surface)]">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-serif text-[var(--text-primary)]">
            Intelligence
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Track what works, who connects, and how to approach
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Proof Points (full width on mobile, half on desktop) */}
          <div className="lg:col-span-1">
            <ProofPointTracker />
          </div>

          {/* Right Column - Network & Cultural */}
          <div className="lg:col-span-1 space-y-6">
            <IntroductionNetworkTracker />
            <CulturalIntelligencePanel />
          </div>
        </div>

        {/* Summary Stats Row */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickStat 
            label="Proof Point Resonance"
            sublabel="Average across all uses"
            color="frost"
          />
          <QuickStat 
            label="Network Conversion"
            sublabel="Intros to deals"
            color="verified"
          />
          <QuickStat 
            label="Top Connector"
            sublabel="By value generated"
            color="heat"
          />
          <QuickStat 
            label="Regions Tracked"
            sublabel="Cultural patterns"
            color="text-primary"
          />
        </div>
      </main>
    </div>
  )
}

// Placeholder for quick stats (these would pull from the queries)
function QuickStat({ 
  label, 
  sublabel,
  color 
}: { 
  label: string
  sublabel: string
  color: string
}) {
  return (
    <div className="bg-[var(--surface)] rounded-lg border border-[var(--border-subtle)] p-4">
      <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className={`text-2xl font-serif text-[var(--${color})]`}>
        --
      </p>
      <p className="text-xs text-[var(--text-tertiary)] mt-1">
        {sublabel}
      </p>
    </div>
  )
}
