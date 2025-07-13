import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Container,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import React from "react";
import {
  Form,
  useLoaderData,
  useSubmit,
  type ActionFunctionArgs,
} from "react-router";
import prisma from "~/db.server";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import type { User } from "~/generated/prisma/client";
import { IdInput } from "~/components/IdInput";
import z from "zod";
import DeleteIcon from "@mui/icons-material/Delete";

interface DeckDesc {
  id: number;
  name: string;
}

export const loader = async () => {
  return {
    decks: await prisma.deck.findMany({ select: { id: true, name: true } }),
    users: await prisma.user.findMany(),
    games: await prisma.game.findMany({
      select: {
        id: true,
        when: true,
        plays: {
          select: {
            player: { select: { name: true } },
            deck: { select: { name: true } },
          },
        },
      },
    }),
  };
};

async function createDeck(body: FormData) {
  const rawDeckIds = z
    .array(z.coerce.number())
    .safeParse(body.getAll("deckId"));
  const rawPlayerIds = z
    .array(z.coerce.number())
    .safeParse(body.getAll("playerId"));
  if (
    !rawDeckIds.success ||
    !rawPlayerIds.success ||
    rawDeckIds.data.length != rawPlayerIds.data.length
  ) {
    throw new Response("Bad request", { status: 400 });
  }
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
    data: { when: new Date(), plays: { createMany: { data: plays } } },
  });
}

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method == "POST") {
    const body = await request.formData();
    createDeck(body);
  } else if (request.method == "DELETE") {
    const body = await request.formData();
    const id = z.coerce.number().safeParse(body.get("id"));
    if (!id.success) {
      throw new Response("Bad request", { status: 400 });
    }
    await prisma.game.delete({ where: { id: id.data } });
  } else {
    throw new Response("Not found", { status: 404 });
  }
};

function CreateGame({ users, decks }: { users: User[]; decks: DeckDesc[] }) {
  const [expanded, setExpanded] = React.useState(false);
  const [plays, setPlays] = React.useState([
    { player: users[0], deck: decks[0] },
  ]);
  const replacePlay = (i: number, play: { player: User; deck: DeckDesc }) => {
    const copy = [...plays];
    copy[i] = play;
    setPlays(copy);
  };
  const removePlay = (i: number) => {
    const copy = [...plays];
    copy.splice(i, 1);
    setPlays(copy);
  };
  const addPlay = () => {
    setPlays([...plays, { player: users[0], deck: decks[0] }]);
  };
  const clear = () => {
    setPlays([{ player: users[0], deck: decks[0] }]);
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
        <Typography>Spiel erstellen</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Form method="post" onSubmit={clear}>
          <Grid container spacing={2}>
            <p>Date picker</p>
            {plays.map(({ player, deck }, i) => {
              return (
                <Grid key={i} size={12}>
                  <Paper elevation={3} key={i} sx={{ p: "0.75em" }}>
                    <Grid container spacing={2}>
                      <Grid size={12}>
                        <IdInput
                          value={player}
                          options={users}
                          onInputChange={value =>
                            replacePlay(i, { deck, player: value })
                          }
                          getOptionLabel={value => value.name}
                          name="player"
                          idName="playerId"
                          label="Spieler"
                          required={true}
                        />
                      </Grid>
                      <Grid size={12}>
                        <IdInput
                          value={deck}
                          options={decks}
                          onInputChange={value =>
                            replacePlay(i, { deck: value, player })
                          }
                          getOptionLabel={value => value.name}
                          name="deck"
                          idName="deckId"
                          label="Deck"
                          required={true}
                        />
                      </Grid>
                      <Grid size={12}>
                        <Button
                          color="error"
                          disabled={plays.length <= 1}
                          onClick={() => removePlay(i)}
                        >
                          Mitspieler löschen
                        </Button>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              );
            })}
            <Grid size={12}>
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
            </Grid>
          </Grid>
        </Form>
      </AccordionDetails>
    </Accordion>
  );
}

function GamesTable({
  games,
}: {
  games: Awaited<ReturnType<typeof loader>>["games"];
}) {
  const submit = useSubmit();
  return (
    <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
      <Table sx={{ minWidth: 650 }} stickyHeader={true}>
        <TableHead>
          <TableRow>
            <TableCell width={"3em"}>#</TableCell>
            <TableCell>Datum</TableCell>
            <TableCell>Mitspieler</TableCell>
            <TableCell width={"5em"}></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {games.map((game, index) => (
            <TableRow
              key={game.id}
              sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                {index + 1}
              </TableCell>
              <TableCell>{game.when.toLocaleString()}</TableCell>
              <TableCell>{game.plays.length}</TableCell>
              <TableCell>
                <IconButton
                  color="default"
                  onClick={() => {
                    submit({ id: game.id }, { method: "DELETE", replace: true });
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default function Games() {
  const { decks, users, games } = useLoaderData<typeof loader>();
  return (
    <Container maxWidth="lg">
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
    </Container>
  );
}
