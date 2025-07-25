import DeleteIcon from "@mui/icons-material/DeleteOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Collapse from "@mui/material/Collapse";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { renderTimeViewClock } from "@mui/x-date-pickers/timeViewRenderers";
import { de } from "date-fns/locale/de";
import React, { Fragment, useMemo } from "react";
import {
  type ActionFunctionArgs,
  Form,
  type MetaFunction,
  useLoaderData,
  useSubmit,
} from "react-router";
import z from "zod";

import DestructionDialog from "~/components/DestructionDialog";
import { IdInput } from "~/components/IdInput";
import Placing from "~/components/Placing";
import { SortTableHead } from "~/components/SortTableHead";
import prisma from "~/db.server";
import type { User } from "~/generated/prisma/client";
import { BadRequest, NotFound } from "~/responses";
import { compareBools, comparingBy, useSortingStates } from "~/sort";

export const meta: MetaFunction<typeof loader> = () => [
  {
    title: "Spiele",
  },
];

interface DeckDesc {
  id: number;
  name: string;
  ownerId: number;
}

export const loader = async () => {
  return {
    decks: await prisma.deck.findMany({
      orderBy: {
        name: "asc",
      },
      select: { id: true, name: true, ownerId: true },
    }),
    users: await prisma.user.findMany({
      orderBy: {
        name: "asc",
      },
    }),
    games: await prisma.game.findMany({
      orderBy: {
        when: "desc",
      },
      select: {
        id: true,
        when: true,
        plays: {
          select: {
            player: { select: { name: true } },
            deck: { select: { name: true, id: true } },
          },
        },
      },
    }),
  };
};

async function createGame(body: FormData) {
  const rawWhen = z.iso.datetime().safeParse(body.get("when"));
  const rawDeckIds = z
    .array(z.coerce.number())
    .safeParse(body.getAll("deckId"));
  const rawPlayerIds = z
    .array(z.coerce.number())
    .safeParse(body.getAll("playerId"));
  if (
    !rawWhen.success ||
    !rawDeckIds.success ||
    !rawPlayerIds.success ||
    rawDeckIds.data.length != rawPlayerIds.data.length
  ) {
    throw BadRequest("Failed to validate input");
  }
  const when = rawWhen.data;
  const deckIds = rawDeckIds.data;
  const playerIds = rawPlayerIds.data;
  const plays = deckIds.map((deckId, i) => {
    return {
      deckId,
      playerId: playerIds[i],
      place: i + 1,
    };
  });
  await prisma.game.create({
    data: { when, plays: { createMany: { data: plays } } },
  });
}

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method == "POST") {
    const body = await request.formData();
    createGame(body);
  } else if (request.method == "DELETE") {
    const body = await request.formData();
    const id = z.coerce.number().safeParse(body.get("id"));
    if (!id.success) {
      throw BadRequest("Failed to validate input");
    }
    await prisma.game.delete({ where: { id: id.data } });
  } else {
    throw NotFound();
  }
};

const DEFAULT_PLAY = {
  player: null,
  deck: null,
};

const DEFAULT_PLAYS = [DEFAULT_PLAY, DEFAULT_PLAY, DEFAULT_PLAY, DEFAULT_PLAY];

function EditPlay({
  i,
  player,
  deck,
  replacePlay,
  decks,
  users,
  disallowDelete,
}: {
  i: number;
  player: User | null;
  deck: DeckDesc | null;
  replacePlay: (
    i: number,
    w: { player: User | null; deck: DeckDesc | null } | null,
  ) => void;
  users: User[];
  decks: DeckDesc[];
  disallowDelete: boolean;
}) {
  const [groupBy, sortedDecks] = useMemo(() => {
    if (player === null) {
      return [undefined, decks];
    }
    const copy = [...decks];
    copy.sort((a, b) =>
      compareBools(a.ownerId !== player.id, b.ownerId !== player.id),
    );
    const groupBy = (deck: DeckDesc) =>
      deck.ownerId === player.id ? `Decks von ${player.name}` : "Andere Decks";
    return [groupBy, copy];
  }, [player]);
  return (
    <Grid size={12}>
      <Paper elevation={3} sx={{ p: "0.75em" }}>
        <Stack
          spacing={2}
          direction="row"
          sx={{
            alignItems: "center",
          }}
        >
          <Placing place={i + 1} />
          <Divider orientation="vertical" variant="middle" flexItem />
          <Stack spacing={2} sx={{ flexGrow: 1 }}>
            <IdInput
              value={player}
              options={users}
              onInputChange={value => replacePlay(i, { deck, player: value })}
              getOptionLabel={value => value.name}
              name="player"
              idName="playerId"
              label="Spieler"
              required={true}
            />
            <IdInput
              value={deck}
              options={sortedDecks}
              onInputChange={value => replacePlay(i, { deck: value, player })}
              groupBy={groupBy}
              getOptionLabel={value => value.name}
              name="deck"
              idName="deckId"
              label="Deck"
              required={true}
            />
            <Button
              color="error"
              disabled={disallowDelete}
              onClick={() => replacePlay(i, null)}
            >
              Mitspieler löschen
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Grid>
  );
}

function CreateGame({ users, decks }: { users: User[]; decks: DeckDesc[] }) {
  const [expanded, setExpanded] = React.useState(false);
  const [plays, setPlays] =
    React.useState<{ player: User | null; deck: DeckDesc | null }[]>(
      DEFAULT_PLAYS,
    );
  const [when, setWhen] = React.useState<Date | null>(() => {
    const date = new Date();
    date.setMinutes(date.getMinutes() - (date.getMinutes() % 5));
    date.setSeconds(0);
    date.setMilliseconds(0);
    return date;
  });
  const replacePlay = (
    i: number,
    play: { player: User | null; deck: DeckDesc | null } | null,
  ) => {
    const copy = [...plays];
    if (play !== null) {
      copy[i] = play;
    } else {
      copy.splice(i, 1);
    }
    setPlays(copy);
  };
  const addPlay = () => {
    setPlays([...plays, DEFAULT_PLAY]);
  };
  const clear = () => {
    setPlays(DEFAULT_PLAYS);
  };
  return (
    <Accordion
      expanded={expanded}
      onChange={(_, expanded) => setExpanded(expanded)}
      sx={{ width: "100%" }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls="panel-content"
      >
        <Typography>Spiel anlegen</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Form method="post" onSubmit={clear}>
          <Stack spacing={2}>
            <LocalizationProvider
              dateAdapter={AdapterDateFns}
              adapterLocale={de}
            >
              <DateTimePicker
                value={when}
                onChange={v => setWhen(v)}
                timezone="Europe/Berlin"
                label="Zeit"
                minutesStep={5}
                viewRenderers={{
                  hours: renderTimeViewClock,
                  minutes: renderTimeViewClock,
                  seconds: renderTimeViewClock,
                }}
              />
            </LocalizationProvider>
            <input
              name="when"
              value={when?.toISOString() || ""}
              type="hidden"
            />
            {plays.map(({ player, deck }, i) => (
              <EditPlay
                key={i}
                i={i}
                player={player}
                deck={deck}
                replacePlay={replacePlay}
                users={users}
                decks={decks}
                disallowDelete={plays.length <= 1}
              />
            ))}
            <Stack direction="row">
              <Button color="warning" onClick={() => addPlay()}>
                Mitspieler hinzufügen
              </Button>

              <Button
                type="submit"
                disabled={plays.length <= 1}
                color="primary"
              >
                Speichern
              </Button>
            </Stack>
          </Stack>
        </Form>
      </AccordionDetails>
    </Accordion>
  );
}

const FORMAT = new Intl.DateTimeFormat("de", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function GameRow({
  game,
  onDelete,
}: {
  onDelete: (id: number) => void;
  game: Awaited<ReturnType<typeof loader>>["games"][0];
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <Fragment>
      <TableRow sx={{ "& > *": { borderBottom: "unset !important" } }}>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>{FORMAT.format(game.when)}</TableCell>
        <TableCell>{game.plays.length}</TableCell>
        <TableCell>
          <IconButton
            size="small"
            color="default"
            onClick={() => onDelete(game.id)}
          >
            <DeleteIcon />
          </IconButton>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Typography variant="h6" gutterBottom component="div">
              Ergebnis
            </Typography>
            <Box sx={{ margin: 1 }}>
              <Table size="small" aria-label="purchases">
                <TableHead>
                  <TableRow>
                    <TableCell width="2.5em"></TableCell>
                    <TableCell>Spieler</TableCell>
                    <TableCell>Deck</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {game.plays.map((play, i) => (
                    <TableRow key={i}>
                      <TableCell component="th" scope="row">
                        <Placing place={i + 1} />
                      </TableCell>
                      <TableCell>{play.player.name}</TableCell>
                      <TableCell>
                        <Link href={`/decks/${play.deck.id}`}>
                          {play.deck.name}
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </Fragment>
  );
}

type Game = Awaited<ReturnType<typeof loader>>["games"][0];

function GamesTable({ games }: { games: Game[] }) {
  const submit = useSubmit();
  const [open, setOpen] = React.useState(false);
  const [deleteGameId, setDeleteGameId] = React.useState<number | null>(null);
  const [order, orderBy, onRequestSort] = useSortingStates("desc", "when");
  const sortedGames = React.useMemo(() => {
    let extract;
    if (orderBy == "when") {
      extract = (v: Game) => v.when;
    } else {
      extract = (v: Game) => v.plays.length;
    }
    return [...games].sort(comparingBy<Game, number | Date>(order, extract));
  }, [order, orderBy, games]);
  const handleClose = (confirmed: boolean) => {
    setOpen(false);
    if (confirmed && deleteGameId) {
      submit({ id: deleteGameId }, { method: "DELETE", replace: true });
    }
  };
  return (
    <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
      <Table stickyHeader={true}>
        <TableHead>
          <TableRow>
            <TableCell width={"5em"} />
            <SortTableHead
              order={order}
              orderBy={orderBy}
              sortKey="when"
              onRequestSort={onRequestSort}
            >
              Datum
            </SortTableHead>
            <SortTableHead
              order={order}
              orderBy={orderBy}
              sortKey="players"
              onRequestSort={onRequestSort}
            >
              Spieler
            </SortTableHead>
            <TableCell width={"5em"}></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedGames.map(game => (
            <GameRow
              key={game.id}
              game={game}
              onDelete={() => {
                setDeleteGameId(game.id);
                setOpen(true);
              }}
            />
          ))}
        </TableBody>
      </Table>
      <DestructionDialog
        open={open}
        handleClose={handleClose}
        title={"Möchtest du dieses Spiel wirklich löschen?"}
      />
    </TableContainer>
  );
}

export default function Games() {
  const { decks, users, games } = useLoaderData<typeof loader>();
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
        Spiele
      </Typography>
      {decks.length == 0 ? (
        "Es muss erst mindestens ein Deck eingetragen sein"
      ) : users.length == 0 ? (
        "Es muss erst mindestens ein Spieler eingetragen sein"
      ) : (
        <CreateGame users={users} decks={decks} />
      )}
      {games.length > 0 && <GamesTable games={games} />}
    </Box>
  );
}
