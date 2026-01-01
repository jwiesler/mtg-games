import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import QuestionMark from "@mui/icons-material/QuestionMark";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import React from "react";
import { type MetaFunction, useLoaderData } from "react-router";

import { NumberSelect } from "~/components/NumberSelect";
import { SortTableHead } from "~/components/SortTableHead";
import prisma from "~/db.server";
import { comparingBy, useSortingStates } from "~/sort";
import {
  type Filter,
  type PlayStats,
  calculate,
  createDefaultFilter,
  filterGames,
} from "~/stats";

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
        when: true,
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

type Deck = { id: number; name: string };

const HEADINGS: [keyof PlayStats, string][] = [
  ["wins", "Wins"],
  ["games", "Games"],
  ["placing_average", "Average"],
  ["placing_best", "Best"],
  ["placing_worst", "Worst"],
  ["placing_median", "Median"],
  ["placing_mode", "Common place"],
  ["winRate", "Winrate"],
];

function StatsTable({
  values,
  stats,
  linkPrefix,
}: {
  values: Deck[];
  stats: Map<number, PlayStats>;
  linkPrefix?: string;
}) {
  const [order, orderBy, onRequestSort] = useSortingStates<
    "name" | keyof PlayStats
  >("asc", "name");
  const sortedValues = React.useMemo(() => {
    let extract;
    if (orderBy == "name") {
      extract = (v: Deck) => v.name;
    } else {
      extract = (v: Deck) => {
        const s = stats.get(v.id);
        return s == undefined ? Number.MIN_SAFE_INTEGER : s[orderBy];
      };
    }
    return [...values].sort(comparingBy<Deck, number | string>(order, extract));
  }, [order, orderBy, values]);
  return (
    <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
      <Table
        stickyHeader={true}
        sx={{ "td:not(:nth-child(1))": { textAlign: "right" } }}
      >
        <TableHead>
          <TableRow>
            <SortTableHead
              key="name"
              order={order}
              orderBy={orderBy}
              sortKey="name"
              onRequestSort={onRequestSort}
              sx={{ width: "100%" }}
            >
              Name
            </SortTableHead>
            {HEADINGS.map(([key, heading]) => {
              return (
                <SortTableHead
                  key={key}
                  order={order}
                  orderBy={orderBy}
                  sortKey={key}
                  onRequestSort={onRequestSort}
                >
                  {heading}
                </SortTableHead>
              );
            })}
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedValues.map(({ id, name }) => {
            let deck_stats = stats.get(id);
            if (deck_stats == undefined) {
              deck_stats = {
                games: NaN,
                wins: NaN,
                winRate: NaN,
                placing_best: NaN,
                placing_worst: NaN,
                placing_average: NaN,
                placing_median: NaN,
                placing_mode: NaN,
              };
            }
            return (
              <TableRow
                key={id}
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  {linkPrefix === undefined ? (
                    <span>{name}</span>
                  ) : (
                    <Link href={`${linkPrefix}${id}`}>{name}</Link>
                  )}
                </TableCell>
                <TableCell>{numberOrDash(deck_stats.wins)}</TableCell>
                <TableCell>{numberOrDash(deck_stats.games)}</TableCell>
                <TableCell>
                  {numberOrDash(deck_stats.placing_average)}
                </TableCell>
                <TableCell>{numberOrDash(deck_stats.placing_best)}</TableCell>
                <TableCell>{numberOrDash(deck_stats.placing_worst)}</TableCell>
                <TableCell>{numberOrDash(deck_stats.placing_median)}</TableCell>
                <TableCell>{numberOrDash(deck_stats.placing_mode)}</TableCell>
                <TableCell>
                  {Number.isNaN(deck_stats.winRate)
                    ? "-"
                    : PERCENTAGE_FORMAT.format(deck_stats.winRate)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

type PartialFilter = Partial<Filter> & Pick<Filter, "existingPlayerCounts">;

function GamesFilter({
  filter,
  setFilter,
}: {
  filter: PartialFilter;
  setFilter: (value: PartialFilter) => void;
}) {
  return (
    <Stack spacing={2}>
      <NumberSelect
        label="Anzahl Spieler"
        values={filter.existingPlayerCounts}
        selected={filter.players || []}
        setSelected={players => setFilter({ ...filter, players })}
      />
      <TextField
        label="Mindestens X Spiele / Spieler"
        value={filter.minPlaysPerPlayer || null}
        type="number"
        required={true}
        onChange={e =>
          setFilter({
            ...filter,
            minPlaysPerPlayer: Number(e.target.value),
          })
        }
      />
      <TextField
        label="Mindestens X Spiele / Deck"
        value={filter.minPlaysPerDeck || null}
        type="number"
        required={true}
        onChange={e =>
          setFilter({
            ...filter,
            minPlaysPerDeck:
              e.target.value === "" ? undefined : Number(e.target.value),
          })
        }
      />
    </Stack>
  );
}

function roundTime(date: Date) {
  if (date.getHours() <= 5) {
    date.setDate(date.getDate() - 1);
  }
  date.setHours(0, 0, 0, 0);
  return date;
}

function GeneralStats({
  games,
  filter,
}: {
  games: Awaited<ReturnType<typeof loader>>["games"];
  filter: Filter;
}) {
  const stats = React.useMemo(() => {
    const filtered = filterGames(games, filter);
    const uniqueDays = new Set(filtered.map(g => roundTime(g.when).getTime()))
      .size;
    return [
      { name: "Spiele", value: filtered.length },
      {
        name: "Tage",
        value: uniqueDays,
        hint: "Tage an denen gespielt wurde, Spiele bis 5 Uhr morgens gehören zum vorherigen Tag",
      },
    ];
  }, [games, filter]);
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "1.5em",
      }}
    >
      {stats.map(({ name, value, hint }, i) => (
        <Paper key={i} variant="outlined" sx={{ p: "1em", width: "12em" }}>
          <Stack spacing={2} sx={{ alignItems: "center" }}>
            <Typography variant="h4" component="h1">
              {value}
            </Typography>
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "0.5em",
              }}
            >
              <Typography variant="h5" component="h1">
                {name}
              </Typography>
              {hint && (
                <Tooltip title={hint}>
                  <QuestionMark sx={{ fontSize: "1em" }} color="action" />
                </Tooltip>
              )}
            </Box>
          </Stack>
        </Paper>
      ))}
    </Box>
  );
}

export default function Stats() {
  const { decks, users, games } = useLoaderData<typeof loader>();
  const defaultFilter = React.useMemo(
    () => createDefaultFilter(games),
    [games],
  );
  const [partialFilter, setFilter] = React.useState<PartialFilter>(defaultFilter);
  const filter = { ...defaultFilter, partialFilter };
  const stats = React.useMemo(() => calculate(games, filter), [games, filter]);
  const [expanded, setExpanded] = React.useState(false);
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
        <Accordion
          expanded={expanded}
          onChange={(_, expanded) => setExpanded(expanded)}
          sx={{ width: "100%" }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Filter</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <GamesFilter filter={partialFilter} setFilter={setFilter} />
            <Button
              onClick={() => setFilter(defaultFilter)}
              color="error"
              sx={{ marginTop: "0.5em" }}
            >
              Reset
            </Button>
          </AccordionDetails>
        </Accordion>

        <GeneralStats games={games} filter={filter} />
        <StatsTable values={decks} stats={stats.decks} linkPrefix="/decks/" />
        <StatsTable
          values={users}
          stats={stats.players}
          linkPrefix="/players/"
        />
      </Box>
    </Box>
  );
}
