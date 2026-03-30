import { medianSorted, modeSorted } from "simple-statistics";

export interface Play {
  player: { id: number };
  deck: { id: number };
  place: number;
}

export interface Game {
  id: number;
  plays: Play[];
}

export interface PlayStats {
  games: number;
  wins: number;
  winRate: number;
  placing_best: number;
  placing_worst: number;
  placing_average: number;
  placing_median: number;
  placing_mode: number;
}

function calculatePlayStats(
  placings: Map<number, number[]>,
  minPlacings: number,
) {
  const stats = new Map<number, PlayStats>();
  placings.forEach((placings, id) => {
    if (placings.length < minPlacings) {
      return;
    }
    placings.sort();
    let best = placings[0];
    let worst = placings[0];
    let sum = 0;
    let wins = 0;
    placings.forEach(p => {
      wins += p == 1 ? 1 : 0;
      best = Math.min(best, p);
      worst = Math.max(worst, p);
      sum += p;
    });
    const mode = modeSorted(placings);
    const median = medianSorted(placings);
    stats.set(id, {
      games: placings.length,
      wins,
      winRate: wins / placings.length,
      placing_best: best,
      placing_worst: worst,
      placing_average: sum / placings.length,
      placing_median: median,
      placing_mode: mode,
    });
  });
  return stats;
}

function normalizePlacing(
  place: number,
  players: number,
  toPlayers: number,
): number {
  const relativePlace = (place - 1) / (players - 1);
  return 1 + (toPlayers - 1) * relativePlace;
}

export function distinctCounts(values: number[]): Map<number, number> {
  const res = new Map<number, number>();
  for (const value of values) {
    const existing = res.get(value);
    if (existing !== undefined) {
      res.set(value, existing + 1);
    } else {
      res.set(value, 1);
    }
  }
  return res;
}

export function getPlacings(
  games: Game[],
  normalizeToPlayerCount: number | null,
  e: (p: Play) => number,
) {
  const placings = new Map<number, number[]>();
  games.forEach(g => {
    g.plays.forEach(p => {
      const id = e(p);
      const existing = placings.get(id);
      const place =
        normalizeToPlayerCount === null
          ? p.place
          : normalizePlacing(p.place, g.plays.length, normalizeToPlayerCount);
      if (existing !== undefined) {
        existing.push(place);
      } else {
        placings.set(id, [place]);
      }
    });
  });

  return placings;
}

export function filterGames<G extends Game>(games: G[], filter: Filter): G[] {
  const maxPlayers = Math.max(...filter.players);
  const playerCountFilter = Array.from({ length: maxPlayers }, () => false);
  for (const players of filter.players) {
    playerCountFilter[players] = true;
  }
  return games.filter(g => playerCountFilter[g.plays.length]);
}

export interface Filter {
  readonly existingPlayerCounts: number[];
  players: number[];
  minPlaysPerDeck: number;
  minPlaysPerPlayer: number;
  normalizeToPlayerCount: number | null;
}

export function createDefaultFilter(games: Game[]): Filter {
  const existingPlayerCounts = Array.from(
    new Set(games.map(g => g.plays.length)),
  );
  existingPlayerCounts.sort();
  return {
    existingPlayerCounts,
    players: existingPlayerCounts,
    minPlaysPerDeck: 3,
    minPlaysPerPlayer: 3,
    normalizeToPlayerCount: 4,
  };
}

export function calculate(games: Game[], filter: Filter) {
  const filteredGames = filterGames(games, filter);
  return {
    decks: calculatePlayStats(
      getPlacings(filteredGames, filter.normalizeToPlayerCount, p => p.deck.id),
      filter.minPlaysPerDeck,
    ),
    players: calculatePlayStats(
      getPlacings(
        filteredGames,
        filter.normalizeToPlayerCount,
        p => p.player.id,
      ),
      filter.minPlaysPerPlayer,
    ),
  };
}
