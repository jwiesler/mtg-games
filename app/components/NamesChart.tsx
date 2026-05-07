import React from "react";

import GamesPieChart from "./GamesPieChart";

export interface Game {
  plays: {
    deck: {
      name: string;
      id: number;
    };
    player: {
      name: string;
      id: number;
    };
    place: number;
  }[];
}

export function NamesChart({
  filterById,
  filterBy,
  nameKey,
  games,
}: {
  filterById: number;
  filterBy: "player" | "deck";
  nameKey: "player" | "deck";
  games: Game[];
}) {
  const series = React.useMemo(() => {
    const names = new Map<number, string>();
    const groups = new Map<number, number>();
    games.forEach(g => {
      g.plays.forEach(p => {
        if (p[filterBy].id === filterById) {
          const w = p[nameKey];
          const e = groups.get(w.id);
          if (e !== undefined) {
            groups.set(w.id, e + 1);
          } else {
            names.set(w.id, w.name);
            groups.set(w.id, 1);
          }
        }
      });
    });
    const counts = Array.from(groups.entries());
    counts.sort((a, b) => a[1] - b[1]);
    return counts.map(([player, count], i) => {
      return {
        id: i,
        value: count,
        label: names.get(player) || "",
      };
    });
  }, [filterBy, filterById, nameKey, games]);
  return <GamesPieChart data={series} games={games.length} />;
}
