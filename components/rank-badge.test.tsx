import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { RankBadge } from './rank-badge'

describe('RankBadge', () => {
  it('renders Unranked when no tier is provided', () => {
    render(<RankBadge />)
    expect(screen.getByText('Unranked')).toBeInTheDocument()
  })

  it('renders full badge with correct info', () => {
    render(
      <RankBadge
        tier="GOLD"
        rank="IV"
        lp={50}
        queueType="RANKED_SOLO_5x5"
        wins={10}
        losses={10}
      />
    )

    // Check tier and rank
    expect(screen.getByText('GOLD IV')).toBeInTheDocument()
    // Check LP
    expect(screen.getByText('50 LP')).toBeInTheDocument()
    // Check queue type label mapping
    expect(screen.getByText('Solo/Duo')).toBeInTheDocument()
    // Check win/loss/ratio
    expect(screen.getByText('10W')).toBeInTheDocument()
    expect(screen.getByText('10L')).toBeInTheDocument()
    expect(screen.getByText('(50%)')).toBeInTheDocument()
  })

  it('renders compact mode correctly', () => {
    render(
      <RankBadge
        tier="DIAMOND"
        rank="I"
        compact={true}
      />
    )

    const badge = screen.getByText((content) => content.includes('DIAMOND I'))
    expect(badge).toBeInTheDocument()
    // Compact mode shouldn't show LP or W/L
    expect(screen.queryByText('LP')).not.toBeInTheDocument()
  })

  it('calculates winrate correctly', () => {
    render(
      <RankBadge
        tier="PLATINUM"
        wins={3}
        losses={1}
      />
    )
    // 3 wins, 1 loss = 4 total. 3/4 = 75%
    expect(screen.getByText('(75%)')).toBeInTheDocument()
  })
})
