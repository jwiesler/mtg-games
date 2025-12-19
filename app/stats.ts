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
  placings.forEach((placings, deck) => {
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
    stats.set(deck, {
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

function getPlacings(games: Game[], e: (p: Play) => number) {
  const placings = new Map<number, number[]>();
  games.forEach(g => {
    g.plays.forEach(p => {
      const id = e(p);
      const existing = placings.get(id);
      if (existing !== undefined) {
        existing.push(p.place);
      } else {
        placings.set(id, [p.place]);
      }
    });
  });
  return placings;
}

function deckPlacings(games: Game[]) {
  return getPlacings(games, p => p.deck.id);
}

function playerPlacings(games: Game[]) {
  return getPlacings(games, p => p.player.id);
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
  };
}

export function calculate(games: Game[], filter: Filter) {
  const filteredGames = filterGames(games, filter);
  return {
    decks: calculatePlayStats(
      deckPlacings(filteredGames),
      filter.minPlaysPerDeck,
    ),
    players: calculatePlayStats(
      playerPlacings(filteredGames),
      filter.minPlaysPerPlayer,
    ),
  };
}
