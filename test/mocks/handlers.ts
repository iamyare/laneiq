import { http, HttpResponse } from 'msw'

export const handlers = [
  // Mock Account V1 - specific valid user
  http.get('https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/TestUser/NA1', () => {
    return HttpResponse.json({
      puuid: 'test-puuid-123',
      gameName: 'TestUser',
      tagLine: 'NA1',
    })
  }),

  // Mock Account V1 - not found
  http.get('https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/NotFound/NA1', () => {
    return new HttpResponse(null, { status: 404 })
  }),

  // Mock Summoner V4
  http.get('https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/test-puuid-123', () => {
    return HttpResponse.json({
      id: 'summoner-id-123',
      accountId: 'account-id-123',
      puuid: 'test-puuid-123',
      name: 'TestUser',
      profileIconId: 10,
      revisionDate: 1700000000000,
      summonerLevel: 100,
    })
  }),

  // Mock League V4
  http.get('https://na1.api.riotgames.com/lol/league/v4/entries/by-summoner/summoner-id-123', () => {
    return HttpResponse.json([
      {
        leagueId: 'league-id-123',
        queueType: 'RANKED_SOLO_5x5',
        tier: 'GOLD',
        rank: 'IV',
        summonerId: 'summoner-id-123',
        summonerName: 'TestUser',
        leaguePoints: 50,
        wins: 20,
        losses: 15,
        veteran: false,
        inactive: false,
        freshBlood: false,
        hotStreak: false,
      },
    ])
  }),
]
