'use client'

import { useState } from 'react'

interface GuideSection {
  id: string
  title: string
  icon: React.ReactNode
  content: React.ReactNode
}

// Icon components
const BookIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
)

const ChartIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)

const TargetIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const LightbulbIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
)

const ShieldIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
)

// Term definition component
function Term({ term, definition }: { term: string; definition: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 py-2 border-b border-white/5 last:border-0">
      <span className="text-primary font-mono font-bold min-w-[80px]">{term}</span>
      <span className="text-gray-300 text-sm">{definition}</span>
    </div>
  )
}

// Example box component
function ExampleBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/5 rounded-lg p-3 my-3">
      <div className="text-xs text-gray-400 mb-2">{title}</div>
      {children}
    </div>
  )
}

// Confidence badge display
function ConfidenceBadge({ level, description }: { level: 'HIGH' | 'MEDIUM' | 'LOW'; description: string }) {
  const colors = {
    HIGH: 'bg-green-500/20 text-green-400 border-green-500/30',
    MEDIUM: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    LOW: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }

  return (
    <div className={`rounded-lg p-3 border ${colors[level]} mb-2`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="font-bold text-sm">{level}</span>
        {level === 'HIGH' && (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        )}
      </div>
      <p className="text-xs text-gray-300">{description}</p>
    </div>
  )
}

export default function BettingGuide() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<string | null>(null)

  const sections: GuideSection[] = [
    {
      id: 'terminology',
      title: 'Terminology & Acronyms',
      icon: <BookIcon />,
      content: (
        <div className="space-y-1">
          <Term term="ML" definition="Moneyline - A bet on which team will win the game outright, regardless of point spread." />
          <Term term="ATS" definition="Against The Spread - Betting on whether a team will cover the point spread, not just win." />
          <Term term="O/U" definition="Over/Under (Totals) - Betting on whether the combined score will be over or under a set number." />
          <Term term="EV" definition="Expected Value - The average amount you can expect to win/lose per bet over time." />
          <Term term="+/- Odds" definition="Negative (-) odds show the favorite and how much to bet to win $100. Positive (+) odds show the underdog and how much you win on a $100 bet." />
          <Term term="Cover" definition="When a team beats the spread. If Lakers are -5 and win by 7, they 'covered'." />
          <Term term="Push" definition="When the result lands exactly on the spread. Your bet is refunded." />
          <Term term="Juice/Vig" definition="The sportsbook's commission, usually -110 (bet $110 to win $100)." />
          <Term term="B2B" definition="Back-to-Back - Playing games on consecutive days. Usually leads to fatigue." />
          <Term term="H2H" definition="Head-to-Head - Historical record between two specific teams." />
        </div>
      )
    },
    {
      id: 'reading-odds',
      title: 'How to Read Odds',
      icon: <ChartIcon />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="text-white font-semibold mb-2">Moneyline Odds</h4>
            <ExampleBox title="Negative Odds (Favorite)">
              <div className="text-white font-mono text-lg">Lakers -150</div>
              <p className="text-sm text-gray-400 mt-1">Bet $150 to win $100. Lakers are expected to win.</p>
            </ExampleBox>
            <ExampleBox title="Positive Odds (Underdog)">
              <div className="text-white font-mono text-lg">Celtics +150</div>
              <p className="text-sm text-gray-400 mt-1">Bet $100 to win $150. Celtics are the underdog.</p>
            </ExampleBox>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-2">Point Spreads</h4>
            <ExampleBox title="Spread Example">
              <div className="flex items-center gap-4">
                <div>
                  <div className="text-white font-mono">Lakers -3.5</div>
                  <p className="text-xs text-gray-400">Must win by 4+ to cover</p>
                </div>
                <div className="text-gray-500">vs</div>
                <div>
                  <div className="text-white font-mono">Celtics +3.5</div>
                  <p className="text-xs text-gray-400">Can lose by 3 and still cover</p>
                </div>
              </div>
            </ExampleBox>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-2">Totals (Over/Under)</h4>
            <ExampleBox title="Total Example">
              <div className="text-white font-mono text-lg">O/U 220.5</div>
              <p className="text-sm text-gray-400 mt-1">
                <span className="text-green-400">OVER</span>: Combined score 221+<br/>
                <span className="text-red-400">UNDER</span>: Combined score 220 or less
              </p>
            </ExampleBox>
          </div>
        </div>
      )
    },
    {
      id: 'reading-model',
      title: 'How to Read Our Model',
      icon: <TargetIcon />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="text-white font-semibold mb-2">Win Probability</h4>
            <p className="text-sm text-gray-300 mb-2">
              Our model calculates each team's chance of winning based on multiple factors.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-400">70%+ Strong Favorite</span>
              <span className="px-2 py-1 rounded text-xs bg-emerald-500/20 text-emerald-400">55-69% Favorite</span>
              <span className="px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-400">45-54% Toss-up</span>
              <span className="px-2 py-1 rounded text-xs bg-orange-500/20 text-orange-400">30-44% Underdog</span>
              <span className="px-2 py-1 rounded text-xs bg-red-500/20 text-red-400">&lt;30% Long Shot</span>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-2">Power Ratings</h4>
            <p className="text-sm text-gray-300 mb-2">
              A score where 100 = league average. Based on point differential, efficiency, form, and injuries.
            </p>
            <ExampleBox title="Power Rating Example">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-green-400 font-mono font-bold">112.5</span>
                  <span className="text-gray-400 text-xs ml-2">Elite team</span>
                </div>
                <div>
                  <span className="text-yellow-400 font-mono font-bold">100.0</span>
                  <span className="text-gray-400 text-xs ml-2">Average team</span>
                </div>
                <div>
                  <span className="text-red-400 font-mono font-bold">88.5</span>
                  <span className="text-gray-400 text-xs ml-2">Below average</span>
                </div>
              </div>
            </ExampleBox>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-2">Predicted Score & Spread</h4>
            <p className="text-sm text-gray-300">
              Our model predicts the final score and calculates a spread. When our spread differs significantly from Vegas, it may indicate value.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-2">Edge</h4>
            <p className="text-sm text-gray-300 mb-2">
              The difference between our predicted line and the market line. A larger edge suggests more potential value.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-400">5+ pts = Strong Edge</span>
              <span className="px-2 py-1 rounded text-xs bg-emerald-500/20 text-emerald-400">3-4 pts = Good Edge</span>
              <span className="px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-400">2-3 pts = Small Edge</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'when-to-bet',
      title: 'When to Bet (Decision Guide)',
      icon: <LightbulbIcon />,
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-primary/10 to-transparent rounded-lg p-4 border border-primary/20">
            <h4 className="text-primary font-semibold mb-2">Golden Rules</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-primary">1.</span>
                <span><strong>Edge Size Matters:</strong> Look for 5+ point spread edge or 5%+ moneyline edge</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">2.</span>
                <span><strong>Confidence Level:</strong> Prioritize HIGH confidence picks over MEDIUM/LOW</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">3.</span>
                <span><strong>Bankroll Management:</strong> Never bet more than 2-5% of your bankroll on a single game</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">4.</span>
                <span><strong>Understand Variance:</strong> Even good bets lose. Focus on long-term results.</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-2">Bet Sizing Guide</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-green-500/10 rounded border border-green-500/20">
                <span className="text-sm text-green-400">HIGH Confidence + 5+ pt Edge</span>
                <span className="text-xs text-white font-mono">3-5% bankroll</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-yellow-500/10 rounded border border-yellow-500/20">
                <span className="text-sm text-yellow-400">MEDIUM Confidence + 3-4 pt Edge</span>
                <span className="text-xs text-white font-mono">2-3% bankroll</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-500/10 rounded border border-gray-500/20">
                <span className="text-sm text-gray-400">LOW Confidence or Small Edge</span>
                <span className="text-xs text-white font-mono">1-2% or skip</span>
              </div>
            </div>
          </div>

          <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/20">
            <h4 className="text-red-400 font-semibold mb-1 text-sm">When NOT to Bet</h4>
            <ul className="text-xs text-gray-300 space-y-1">
              <li>- Edge is less than 2 points</li>
              <li>- Multiple key players are questionable (injury uncertainty)</li>
              <li>- Both teams on back-to-back (unpredictable)</li>
              <li>- You're chasing losses from previous bets</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'confidence-levels',
      title: 'Confidence Levels Explained',
      icon: <ShieldIcon />,
      content: (
        <div className="space-y-3">
          <p className="text-sm text-gray-300 mb-4">
            Our model assigns confidence levels based on multiple factors including data quality,
            injury impact, and statistical certainty.
          </p>

          <ConfidenceBadge
            level="HIGH"
            description="Strong statistical edge (8+ point power rating difference). Multiple factors align: favorable matchup, rest advantage, no major injuries. High data confidence. These are our best picks."
          />

          <ConfidenceBadge
            level="MEDIUM"
            description="Decent edge (4-7 point power rating difference). Some uncertainty exists: questionable players, mixed recent form, or conflicting factors. Still worth considering with smaller stakes."
          />

          <ConfidenceBadge
            level="LOW"
            description="Small edge or high variance expected. Limited recent game data, significant injury concerns, or too many unknowns. Proceed with caution or skip entirely."
          />

          <div className="mt-4 p-3 bg-white/5 rounded-lg">
            <h4 className="text-white font-semibold mb-2 text-sm">What Affects Confidence?</h4>
            <ul className="text-xs text-gray-400 space-y-1">
              <li><span className="text-red-400">Lowers:</span> Many injuries, limited game data, back-to-backs</li>
              <li><span className="text-green-400">Raises:</span> Large power differential, rest advantage, strong recent form</li>
            </ul>
          </div>
        </div>
      )
    }
  ]

  return (
    <>
      {/* Floating Help Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-primary to-secondary rounded-full shadow-lg hover:opacity-90 transition-all hover:scale-105"
      >
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-white font-medium text-sm hidden sm:inline">Betting Guide</span>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl max-h-[85vh] bg-dark-900 rounded-2xl shadow-2xl border border-white/10 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Betting Guide</h2>
                  <p className="text-sm text-gray-400">Learn how to read odds and use our predictions</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Section Tabs */}
              <div className="flex flex-wrap gap-2 mb-4">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeSection === section.id
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {section.icon}
                    <span className="hidden sm:inline">{section.title}</span>
                    <span className="sm:hidden">{section.title.split(' ')[0]}</span>
                  </button>
                ))}
              </div>

              {/* Active Section Content */}
              {activeSection ? (
                <div className="glass-card rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    {sections.find(s => s.id === activeSection)?.icon}
                    {sections.find(s => s.id === activeSection)?.title}
                  </h3>
                  {sections.find(s => s.id === activeSection)?.content}
                </div>
              ) : (
                <div className="space-y-3">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className="w-full glass-card rounded-xl p-4 text-left hover:bg-white/5 transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                            {section.icon}
                          </div>
                          <div>
                            <h3 className="text-white font-semibold">{section.title}</h3>
                            <p className="text-xs text-gray-500">Click to expand</p>
                          </div>
                        </div>
                        <svg className="w-5 h-5 text-gray-500 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 flex-shrink-0">
              <p className="text-xs text-gray-500 text-center">
                Remember: No model is perfect. Always gamble responsibly and never bet more than you can afford to lose.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Inline guide component for embedding in pages
export function InlineBettingGuide() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const quickTerms = [
    { term: 'ML', def: 'Moneyline (straight win bet)' },
    { term: 'ATS', def: 'Against The Spread' },
    { term: 'O/U', def: 'Over/Under total points' },
    { term: '-150', def: 'Bet $150 to win $100 (favorite)' },
    { term: '+150', def: 'Bet $100 to win $150 (underdog)' },
  ]

  return (
    <div className="glass-card rounded-xl p-4 mb-6">
      <button
        onClick={() => setExpandedSection(expandedSection ? null : 'quick')}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-white font-medium">Quick Reference Guide</span>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${expandedSection ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expandedSection && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
            {quickTerms.map(({ term, def }) => (
              <div key={term} className="text-center p-2 bg-white/5 rounded-lg">
                <div className="text-primary font-mono font-bold">{term}</div>
                <div className="text-[10px] text-gray-400">{def}</div>
              </div>
            ))}
          </div>

          <div className="grid sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="text-green-400 font-semibold mb-1">HIGH Confidence</div>
              <p className="text-gray-400">Strong edge, bet 3-5% bankroll</p>
            </div>
            <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <div className="text-yellow-400 font-semibold mb-1">MEDIUM Confidence</div>
              <p className="text-gray-400">Decent edge, bet 2-3% bankroll</p>
            </div>
            <div className="p-3 bg-gray-500/10 rounded-lg border border-gray-500/20">
              <div className="text-gray-400 font-semibold mb-1">LOW Confidence</div>
              <p className="text-gray-400">Small edge, consider skipping</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
