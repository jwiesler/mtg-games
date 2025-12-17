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

function getPlacings(
  games: Game[],
  playersFilter: boolean[],
  e: (p: Play) => number,
) {
  const placings = new Map<number, number[]>();
  games.forEach(g => {
    if (!playersFilter[g.plays.length - 1]) {
      return;
    }
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

function deckPlacings(games: Game[], playersFilter: boolean[]) {
  return getPlacings(games, playersFilter, p => p.deck.id);
}

function playerPlacings(games: Game[], playersFilter: boolean[]) {
  return getPlacings(games, playersFilter, p => p.player.id);
}

export function calculate(
  games: Game[],
  playersFilter: number[],
  minPlaysPerDeck: number,
  minPlaysPerPlayer: number,
) {
  const maxPlayers = Math.max(...games.map(g => g.plays.length));
  const playerCountFilter = Array.from({ length: maxPlayers }, () => false);
  for (const player of playersFilter) {
    playerCountFilter[player] = true;
  }
  return {
    decks: calculatePlayStats(
      deckPlacings(games, playerCountFilter),
      minPlaysPerDeck,
    ),
    players: calculatePlayStats(
      playerPlacings(games, playerCountFilter),
      minPlaysPerPlayer,
    ),
  };
}
