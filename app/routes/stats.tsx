import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Link from "@mui/material/Link";
import MenuItem from "@mui/material/MenuItem";
import OutlinedInput from "@mui/material/OutlinedInput";
import Paper from "@mui/material/Paper";
import Select, { type SelectChangeEvent } from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import React from "react";
import { type MetaFunction, useLoaderData } from "react-router";

import { SortTableHead } from "~/components/SortTableHead";
import prisma from "~/db.server";
import { comparingBy, useSortingStates } from "~/sort";
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

function NumberSelect({
  label,
  selected,
  setSelected,
}: {
  label: string;
  selected: boolean[];
  setSelected: (selected: boolean[]) => void;
}) {
  const handleChange = (event: SelectChangeEvent<number[]>) => {
    const {
      target: { value },
    } = event;
    const values: number[] =
      typeof value === "string" ? value.split(",").map(v => Number(v)) : value;
    const res: boolean[] = Array(selected.length).fill(false);
    for (let i = 0; i < values.length; i++) {
      res[values[i]] = true;
    }
    setSelected(res);
  };

  const value: number[] = [];
  for (let i = 0; i < selected.length; i++) {
    if (selected[i]) {
      value.push(i);
    }
  }

  return (
    <div>
      <FormControl sx={{ width: "100%" }}>
        <InputLabel>{label}</InputLabel>
        <Select
          multiple
          value={value}
          onChange={handleChange}
          input={<OutlinedInput label={label} />}
          // MenuProps={MenuProps}
        >
          {selected.map((v, j) => {
            const i = j + 1;
            return (
              <MenuItem key={i} value={j}>
                {i}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
    </div>
  );
}

export default function Stats() {
  const { decks, users, games } = useLoaderData<typeof loader>();
  const maxPlayers = Math.max(...games.map(g => g.plays.length));
  const [playersFilter, setPlayersFilter] = React.useState<boolean[]>(
    Array(maxPlayers).fill(true),
  );
  const [minPlaysPerDeck, setMinPlaysPerDeck] = React.useState(3);
  const [minPlaysPerPlayer, setMinPlaysPerPlayer] = React.useState(3);
  const stats = React.useMemo(() => {
    return calculate(games, playersFilter, minPlaysPerDeck, minPlaysPerPlayer);
  }, [games, playersFilter, minPlaysPerDeck, minPlaysPerPlayer]);
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
            <Stack spacing={2}>
              <NumberSelect
                label="Anzahl Spieler"
                selected={playersFilter}
                setSelected={setPlayersFilter}
              />
              <TextField
                label="Mindestens X Spiele / Spieler"
                value={minPlaysPerPlayer}
                onChange={e => setMinPlaysPerPlayer(Number(e.target.value))}
              />
              <TextField
                label="Mindestens X Spiele / Deck"
                value={minPlaysPerDeck}
                onChange={e => setMinPlaysPerDeck(Number(e.target.value))}
              />
            </Stack>
          </AccordionDetails>
        </Accordion>

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
