import Check from "@mui/icons-material/Check";
import Delete from "@mui/icons-material/Delete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import React from "react";
import {
  type ActionFunctionArgs,
  Form,
  type MetaFunction,
  useActionData,
  useBeforeUnload,
  useLoaderData,
  useSubmit,
} from "react-router";
import z from "zod";

import CollapseRow from "~/components/CollapseRow";
import DateElement from "~/components/DateElement";
import DestructionDialog from "~/components/DestructionDialog";
import Drawer from "~/components/Drawer";
import type { GameData } from "~/components/EditGame";
import EditGame, { DEFAULT_PLAYS } from "~/components/EditGame";
import GameResult from "~/components/GameResult";
import NotificationSnack from "~/components/NotificationSnack";
import { SortTableHead } from "~/components/SortTableHead";
import prisma from "~/db.server";
import { NotFound, Validated } from "~/responses.server";
import { comparingBy, useSortingStates } from "~/sort";

export const meta: MetaFunction<typeof loader> = () => [
  {
    title: "Spiele",
  },
];

export const loader = async () => {
  return {
    decks: await prisma.deck.findMany({
      orderBy: {
        name: "asc",
      },
      select: { id: true, name: true, ownerId: true, commander: true },
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
        comment: true,
        duration: true,
        plays: {
          orderBy: {
            place: "asc",
          },
          select: {
            place: true,
            player: { select: { name: true, id: true } },
            deck: {
              select: { name: true, id: true, ownerId: true, commander: true },
            },
          },
        },
      },
    }),
  };
};

const SCHEMA = z.object({
  when: z.iso.datetime(),
  deckId: z.array(z.coerce.number()),
  playerId: z.array(z.coerce.number()),
  duration: z.coerce.number(),
  comment: z.string(),
});

async function createOrEditGame(body: FormData) {
  const raw = {
    when: body.get("when"),
    deckId: body.getAll("deckId"),
    playerId: body.getAll("playerId"),
    duration: body.get("duration"),
    comment: body.get("comment"),
  };
  const { when, duration, deckId, playerId, comment } = Validated(
    SCHEMA.safeParse(raw),
  );
  const plays = deckId.map((deckId, i) => {
    return {
      deckId,
      playerId: playerId[i],
      place: i + 1,
    };
  });
  const rawId = body.get("id");
  if (rawId !== null) {
    const id = Validated(z.coerce.number().safeParse(rawId));
    const [, game] = await prisma.$transaction([
      prisma.game.delete({ where: { id } }),
      prisma.game.create({
        data: {
          when,
          duration,
          comment,
          plays: { createMany: { data: plays } },
        },
        select: { id: true },
      }),
    ]);
    return { type: "update", key: `update-${game.id}` };
  } else {
    const game = await prisma.game.create({
      data: { when, duration, comment, plays: { createMany: { data: plays } } },
      select: { id: true },
    });
    return { type: "create", key: `create-${game.id}` };
  }
}

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method == "POST") {
    const body = await request.formData();
    return await createOrEditGame(body);
  } else if (request.method == "DELETE") {
    const body = await request.formData();
    const id = Validated(z.coerce.number().safeParse(body.get("id")));
    await prisma.game.delete({ where: { id } });
    return { type: "delete", key: `delete-${id}` };
  } else {
    throw NotFound();
  }
};

function GameRow({
  game,
  onEdit,
}: {
  onEdit: (game: Game) => void;
  game: Game;
}) {
  return (
    <CollapseRow
      cells={[
        <TableCell key="0">
          <DateElement date={game.when} />
        </TableCell>,
        <TableCell key="1">{game.plays.length}</TableCell>,
      ]}
      inner={
        <>
          <GameResult game={game} />
          <Box sx={{ float: "right", mb: 1 }}>
            <Button
              color="warning"
              style={{ marginRight: "1em" }}
              onClick={() => onEdit(game)}
            >
              Bearbeiten
            </Button>
          </Box>
        </>
      }
    />
  );
}

type Game = Awaited<ReturnType<typeof loader>>["games"][0];

function GamesTable({
  games,
  onEdit,
}: {
  games: Game[];
  onEdit: (game: Game) => void;
}) {
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
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(25);
  const sortedGamesSlice = sortedGames.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );
  return (
    <>
      <TableContainer component={Paper}>
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
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedGamesSlice.map(game => (
              <GameRow key={game.id} game={game} onEdit={onEdit} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 25, 50]}
        component="div"
        count={games.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        onRowsPerPageChange={p => {
          setRowsPerPage(parseInt(p.target.value, 10));
          setPage(0);
        }}
      />
    </>
  );
}

function EditDrawer({
  open,
  setOpen,
  onSubmit,
  onDelete,
  ...args
}: {
  open: boolean;
  setOpen: (value: boolean) => void;
  onSubmit: () => void;
  onDelete: () => void;
} & Parameters<typeof EditGame>[0]) {
  return (
    <Drawer.Root open={open} onClose={() => setOpen(false)}>
      <Form method="post" onSubmit={onSubmit}>
        <Drawer.Header
          onClose={() => setOpen(false)}
          title={args.mode == "create" ? "Spiel anlegen" : "Spiel bearbeiten"}
        >
          {args.mode == "edit" && (
            <IconButton onClick={onDelete}>
              <Delete />
            </IconButton>
          )}
          <IconButton type="submit" color="primary">
            <Check />
          </IconButton>
        </Drawer.Header>
        <Drawer.Body>
          <EditGame {...args} />
        </Drawer.Body>
      </Form>
    </Drawer.Root>
  );
}

export default function Games() {
  const { decks, users, games } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [open, setOpen] = React.useState(false);
  useBeforeUnload(e => {
    if (open) {
      e.preventDefault();
    }
  });
  const [mode, setMode] = React.useState<"create" | "edit">("create");
  const createGame = () => {
    const plays = DEFAULT_PLAYS;
    const when = new Date();
    when.setMinutes(when.getMinutes() - (when.getMinutes() % 5), 0, 0);
    return {
      plays,
      when,
      comment: "",
      duration: null,
    };
  };
  const [game, setGame] = React.useState<GameData>(createGame);
  const resetEditGame = () => {
    setGame(createGame());
    setMode("create");
    setOpen(false);
  };
  const openEditGame = (game: GameData, mode: "create" | "edit") => {
    setMode(mode);
    setGame(game);
    setOpen(true);
  };
  const submit = useSubmit();
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteGameId, setDeleteGameId] = React.useState<number | null>(null);
  const handleClose = (confirmed: boolean) => {
    setDeleteOpen(false);
    if (confirmed) {
      setOpen(false);
    }
    if (confirmed && deleteGameId) {
      submit({ id: deleteGameId }, { method: "DELETE", replace: true });
    }
  };
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
      <Button onClick={() => openEditGame(createGame(), "create")}>
        Spiel anlegen
      </Button>

      {decks.length == 0 ? (
        "Es muss erst mindestens ein Deck eingetragen sein"
      ) : users.length == 0 ? (
        "Es muss erst mindestens ein Spieler eingetragen sein"
      ) : (
        <EditDrawer
          open={open}
          setOpen={setOpen}
          onSubmit={resetEditGame}
          mode={mode}
          game={game}
          setGame={setGame}
          users={users}
          decks={decks}
          onDelete={() => {
            setDeleteGameId(game.id as number);
            setDeleteOpen(true);
          }}
        />
      )}
      {games.length > 0 && (
        <GamesTable games={games} onEdit={g => openEditGame(g, "edit")} />
      )}
      <DestructionDialog
        open={deleteOpen}
        handleClose={handleClose}
        title={"Möchtest du dieses Spiel wirklich löschen?"}
      />
      {actionData && (
        <NotificationSnack
          key={actionData.key}
          message={`Spiel ${
            actionData.type == "create"
              ? "angelegt"
              : actionData.type == "update"
                ? "bearbeitet"
                : "gelöscht"
          }`}
        />
      )}
    </Box>
  );
}
