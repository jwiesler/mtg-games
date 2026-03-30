import type { PieValueType } from "@mui/x-charts";
import { PieChart } from "@mui/x-charts/PieChart";
import React from "react";

import { PERCENTAGE } from "~/format";

export default function GamesPieChart({
  games,
  data,
}: {
  games: number;
  data: Readonly<PieValueType[]>;
}) {
  return (
    <PieChart
      series={[
        {
          data,
          valueFormatter: (item: { value: number }) =>
            `${PERCENTAGE.format(item.value / games)} (${item.value} ${item.value == 1 ? "Spiel" : "Spiele"})`,
          innerRadius: 50,
          arcLabel: item =>
            item.label == undefined
              ? ""
              : item.label.substring(0, item.label.indexOf(" ")),
        },
      ]}
      width={200}
      height={200}
      hideLegend={true}
    />
  );
}
