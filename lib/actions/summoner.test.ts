import { describe, it, expect, vi } from 'vitest'
import { fetchSummonerProfile } from './summoner'

describe('fetchSummonerProfile', () => {
  it('returns complete profile data for valid user', async () => {
    const result = await fetchSummonerProfile('TestUser', 'NA1', 'na1')

    expect(result).toBeDefined()
    // Account validation
    expect(result.account).toMatchObject({
      gameName: 'TestUser',
      tagLine: 'NA1',
      puuid: 'test-puuid-123'
    })
    // Summoner validation
    expect(result.summoner).toMatchObject({
      id: 'summoner-id-123',
      summonerLevel: 100
    })
    // League validation
    expect(result.leagues).toHaveLength(1)
    expect(result.leagues[0]).toMatchObject({
      tier: 'GOLD',
      rank: 'IV',
      leaguePoints: 50,
      wins: 20,
      losses: 15
    })
  })

  it('throws error when summoner not found', async () => {
    await expect(fetchSummonerProfile('NotFound', 'NA1', 'na1'))
      .rejects.toThrow("Summoner not found")
  })

  it('throws error for invalid platform', async () => {
    // @ts-expect-error Testing invalid input
    await expect(fetchSummonerProfile('TestUser', 'NA1', 'INVALID'))
      .rejects.toThrow("Invalid platform: INVALID")
  })

  it('throws error for missing parameters', async () => {
    await expect(fetchSummonerProfile('', 'NA1', 'na1'))
      .rejects.toThrow("Missing required params")
  })
})
