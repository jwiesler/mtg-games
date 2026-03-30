import React from "react";

import GamesPieChart from "~/components/GamesPieChart";
import { distinctCounts } from "~/stats";

export default function PlayersChart({
  games,
}: {
  games: { plays: unknown[] }[];
}) {
  const series = React.useMemo(() => {
    const placings = games.map(g => g.plays.length) || [];
    const counts = Array.from(distinctCounts(placings).entries());
    counts.sort((a, b) => a[0] - b[0]);
    return counts.map(([players, count], i) => {
      return {
        id: i,
        value: count,
        players: players,
        label: `${players} Spieler`,
      };
    });
  }, [games]);
  return <GamesPieChart games={games.length} data={series} />;
}
