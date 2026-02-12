import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MatchCard } from './match-card'
import type { MatchInfo, Participant } from '@/lib/types/riot'

// Mock sub-components to isolate MatchCard logic
vi.mock('@/components/champion-icon', () => ({
  ChampionIcon: ({ championName }: { championName: string }) => (
    <div data-testid="champion-icon">{championName}</div>
  )
}))

vi.mock('@/components/item-icon', () => ({
  ItemIcon: ({ itemId }: { itemId: number }) => (
    <div data-testid="item-icon">{itemId}</div>
  )
}))

vi.mock('@/components/kda-display', () => ({
  KDADisplay: ({ kills, deaths, assists }: any) => (
    <div data-testid="kda-display">{kills}/{deaths}/{assists}</div>
  )
}))

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
}))

// Mock Date.now for stable "time ago" tests
const MOCK_NOW = 1700000000000 
const HOUR_MS = 3600000

describe('MatchCard', () => {
  const mockMatchInfo: MatchInfo = {
    gameId: '123',
    gameDuration: 1800, // 30 mins
    gameCreation: MOCK_NOW - (2 * HOUR_MS), // 2 hours ago
    queueId: 420, // Solo Queue
    gameMode: "CLASSIC",
    gameType: "MATCHED_GAME",
    gameVersion: "14.1.1",
    mapId: 11,
    platformId: "NA1",
    participants: [],
    teams: []
  }

  const mockParticipant: Participant = {
    puuid: 'test-puuid',
    summonerName: 'TestSummoner',
    championName: 'Ahri',
    win: true,
    kills: 10,
    deaths: 2,
    assists: 8,
    totalMinionsKilled: 200,
    neutralMinionsKilled: 10,
    visionScore: 35,
    item0: 1001,
    item1: 1002,
    item2: 0,
    item3: 0,
    item4: 0,
    item5: 0,
    item6: 0,
    individualPosition: 'MIDDLE',
    teamPosition: 'MIDDLE',
    // ... other required fields mocked as needed
  } as unknown as Participant

  it('renders win state correctly', () => {
    vi.setSystemTime(MOCK_NOW)
    render(
      <MatchCard
        matchId="NA1_123"
        participant={mockParticipant}
        matchInfo={mockMatchInfo}
        platform="na1"
        gameName="Test"
        tagLine="NA1"
      />
    )

    // Check WIN badge
    expect(screen.getByText('WIN')).toBeInTheDocument()
    
    // Check Champion
    expect(screen.getByTestId('champion-icon')).toHaveTextContent('Ahri')
    
    // Check KDA
    expect(screen.getByTestId('kda-display')).toHaveTextContent('10/2/8')

    // Check CS (210 total / 30 mins = 7.0)
    expect(screen.getByText('210 CS')).toBeInTheDocument()
    expect(screen.getByText('7.0/min')).toBeInTheDocument()

    // Check time ago (2 hours)
    expect(screen.getByText('2h ago')).toBeInTheDocument()
    vi.useRealTimers()
  })

  it('renders loss state correctly', () => {
    const lossParticipant = { ...mockParticipant, win: false }
    render(
      <MatchCard
        matchId="NA1_123"
        participant={lossParticipant}
        matchInfo={mockMatchInfo}
        platform="na1"
        gameName="Test"
        tagLine="NA1"
      />
    )

    expect(screen.getByText('LOSS')).toBeInTheDocument()
  })

  it('links to correct match detail page', () => {
    render(
      <MatchCard
        matchId="NA1_123"
        participant={mockParticipant}
        matchInfo={mockMatchInfo}
        platform="na1"
        gameName="Test"
        tagLine="TAG"
      />
    )

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/na1/Test/TAG/match/NA1_123')
  })
})
