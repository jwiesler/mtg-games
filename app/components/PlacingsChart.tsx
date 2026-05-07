import React from "react";

import GamesPieChart from "./GamesPieChart";
import type { Game } from "./NamesChart";
import { distinctCounts, getPlacings } from "~/stats";

export function PlacingsChart({
  filterBy,
  filterById,
  games,
}: {
  filterBy: "deck" | "player";
  filterById: number;
  games: Game[];
}) {
  const series = React.useMemo(() => {
    const placings =
      getPlacings(games, null, p => p[filterBy].id).get(filterById) || [];
    const counts = Array.from(distinctCounts(placings).entries());
    counts.sort((a, b) => a[0] - b[0]);
    return counts.map(([place, count], i) => {
      return {
        id: i,
        value: count,
        label: `${place}. Platz`,
      };
    });
  }, [filterBy, filterById, games]);
  return <GamesPieChart data={series} games={games.length} />;
}
