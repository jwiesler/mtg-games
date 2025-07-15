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
  placing: {
    best: number;
    worst: number;
    average: number;
    median: number;
    mode: number;
  };
}

function calcluatePlayStats(placings: Map<number, number[]>) {
  const stats = new Map<number, PlayStats>();
  placings.forEach((placings, deck) => {
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
      placing: {
        best,
        worst,
        average: sum / placings.length,
        median: median,
        mode: mode,
      },
    });
  });
  return stats;
}

function deckPlacings(games: Game[]) {
  const placings = new Map<number, number[]>();
  games.forEach(g => {
    g.plays.forEach(p => {
      const existing = placings.get(p.deck.id);
      if (existing !== undefined) {
        existing.push(p.place);
      } else {
        placings.set(p.deck.id, [p.place]);
      }
    });
  });
  return placings;
}

function playerPlacings(games: Game[]) {
  const placings = new Map<number, number[]>();
  games.forEach(g => {
    g.plays.forEach(p => {
      const existing = placings.get(p.player.id);
      if (existing !== undefined) {
        existing.push(p.place);
      } else {
        placings.set(p.player.id, [p.place]);
      }
    });
  });
  return placings;
}

export function calculate(games: Game[]) {
  return {
    decks: calcluatePlayStats(deckPlacings(games)),
    players: calcluatePlayStats(playerPlacings(games)),
  };
}
