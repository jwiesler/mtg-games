import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import React from "react";
import { type MetaFunction, useLoaderData } from "react-router";

import prisma from "~/db.server";
import { type PlayStats, calculate } from "~/stats";

export const meta: MetaFunction<typeof loader> = () => [
  {
    title: "Statistiken",
  },
];

export const loader = async () => {
  const [decks, users, games] = await prisma.$transaction([
    prisma.deck.findMany({ select: { id: true, name: true } }),
    prisma.user.findMany(),
    prisma.game.findMany({
      select: {
        id: true,
        plays: {
          select: {
            player: { select: { id: true } },
            deck: { select: { id: true } },
            place: true,
          },
        },
      },
    }),
  ]);
  return {
    decks,
    users,
    games,
  };
};

const NUMBER_FORMAT = new Intl.NumberFormat("de-DE", {
  maximumFractionDigits: 2,
});

const PERCENTAGE_FORMAT = new Intl.NumberFormat("de-DE", {
  style: "percent",
  maximumFractionDigits: 2,
});

function numberOrDash(n: number) {
  return Number.isNaN(n) ? "-" : NUMBER_FORMAT.format(n);
}

function StatsTable({
  values,
  stats,
}: {
  values: { id: number; name: string }[];
  stats: Map<number, PlayStats>;
}) {
  return (
    <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
      <Table
        stickyHeader={true}
        sx={{ "td:not(:nth-child(1))": { textAlign: "right" } }}
      >
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: "100%" }}>Name</TableCell>
            <TableCell>Wins</TableCell>
            <TableCell>Games</TableCell>
            <TableCell>Average</TableCell>
            <TableCell>Best</TableCell>
            <TableCell>Worst</TableCell>
            <TableCell>Median</TableCell>
            <TableCell>Mode</TableCell>
            <TableCell>Winrate</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {values.map(({ id, name }) => {
            let deck_stats = stats.get(id);
            if (deck_stats == undefined) {
              deck_stats = {
                games: NaN,
                wins: NaN,
                winRate: NaN,
                placing: {
                  best: NaN,
                  worst: NaN,
                  average: NaN,
                  median: NaN,
                  mode: NaN,
                },
              };
            }
            return (
              <TableRow
                key={id}
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  {name}
                </TableCell>
                <TableCell>{numberOrDash(deck_stats.wins)}</TableCell>
                <TableCell>{numberOrDash(deck_stats.games)}</TableCell>
                <TableCell>
                  {numberOrDash(deck_stats.placing.average)}
                </TableCell>
                <TableCell>{numberOrDash(deck_stats.placing.best)}</TableCell>
                <TableCell>{numberOrDash(deck_stats.placing.worst)}</TableCell>
                <TableCell>{numberOrDash(deck_stats.placing.median)}</TableCell>
                <TableCell>{numberOrDash(deck_stats.placing.mode)}</TableCell>
                <TableCell>{Number.isNaN(deck_stats.winRate) ? "-" : PERCENTAGE_FORMAT.format(deck_stats.winRate)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default function Stats() {
  const { decks, users, games } = useLoaderData<typeof loader>();
  const stats = React.useMemo(() => {
    return calculate(games);
  }, games);
  return (
    <Box
      sx={{
        my: 4,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        Statistiken
      </Typography>
      <Box
        sx={{
          my: 4,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: "2em",
          maxWidth: "100%",
        }}
      >
        <StatsTable values={decks} stats={stats.decks} />
        <StatsTable values={users} stats={stats.players} />
      </Box>
    </Box>
  );
}
