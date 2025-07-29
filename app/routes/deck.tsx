import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import React from "react";
import {
  type ActionFunctionArgs,
  Form,
  type LoaderFunctionArgs,
  type MetaFunction,
  redirect,
  useLoaderData,
} from "react-router";

import CollapseRow from "~/components/CollapseRow";
import { EditDeck } from "~/components/EditDeck";
import GameResult from "~/components/GameResult";
import Placing from "~/components/Placing";
import { SortTableHead } from "~/components/SortTableHead";
import prisma from "~/db.server";
import { FORMAT } from "~/format";
import { BadRequest, NotFound } from "~/responses";
import { API } from "~/scryfall";
import { comparingBy, useSortingStates } from "~/sort";
import type { Deck } from "~/types";
import { DeckSchema } from "~/types";

export const meta: MetaFunction<typeof loader> = ({ data }) => [
  {
    title: data ? data.deck.name : "Not found",
  },
];

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = Number(params.id);
  if (Number.isNaN(id)) {
    throw NotFound();
  }
  const deck = await prisma.deck.findUnique({
    where: { id: id },
    select: {
      id: true,
      name: true,
      description: true,
      commander: true,
      owner: true,
      url: true,
      bracket: true,
      colors: true,
    },
  });
  if (deck == null) {
    throw NotFound();
  }
  const users = await prisma.user.findMany();
  const card = await API.card(deck.commander);
  const games = await prisma.game.findMany({
    where: {
      plays: {
        some: {
          deckId: id,
        },
      },
    },
    select: {
      id: true,
      when: true,
      duration: true,
      plays: {
        select: {
          deck: {
            select: {
              id: true,
              name: true,
            },
          },
          player: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });
  return {
    games,
    deck,
    card,
    users,
  };
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const body = await request.formData();
  if (request.method === "POST") {
    const s = DeckSchema.safeParse(Object.fromEntries(body));
    if (!s.success) {
      throw BadRequest("Failed to validate input");
    }
    const data = s.data;
    if (data.colors.trim() == "") {
      const card = await API.card(data.commander);
      if (card != null) {
        data.colors = "{" + card.color_identity.join("}{") + "}";
      }
    }
    await prisma.deck.update({
      data: {
        name: data.name.trim() || data.commander.trim(),
        commander: data.commander.trim(),
        description: data.description.trim(),
        ownerId: data.ownerId,
        bracket: data.bracket,
        colors: data.colors.trim(),
        url: data.url.trim(),
      },
      where: { id: Number(params.id) },
    });
  } else if (request.method === "DELETE") {
    await prisma.deck.delete({ where: { id: Number(params.id) } });
    return redirect("/decks");
  } else {
    throw NotFound();
  }
};

type Game = Awaited<ReturnType<typeof loader>>["games"][0];

function RecentPlays({ games, deck }: { games: Game[]; deck: number }) {
  const [order, orderBy, onRequestSort] = useSortingStates("desc", "when");
  const sortedGames = React.useMemo(() => {
    let extract;
    const copy = games.map(g => {
      const index = g.plays.findIndex(p => p.deck.id === deck);
      return { ...g, deckPlay: index === -1 ? 0 : index };
    });
    if (orderBy == "when") {
      extract = (v: (typeof copy)[0]) => v.when;
    } else if (orderBy == "player") {
      extract = (v: (typeof copy)[0]) => v.plays[v.deckPlay].player.name;
    } else {
      extract = (v: (typeof copy)[0]) => v.deckPlay;
    }
    return copy.sort(
      comparingBy<(typeof copy)[0], number | Date | string>(order, extract),
    );
  }, [order, orderBy, games]);
  return (
    <TableContainer component={Paper}>
      <Table stickyHeader={true}>
        <TableHead>
          <TableRow>
            <TableCell width={"5em"} />
            <SortTableHead
              width={"4em"}
              order={order}
              orderBy={orderBy}
              sortKey="place"
              onRequestSort={onRequestSort}
            >
              Platz
            </SortTableHead>
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
              sortKey="player"
              onRequestSort={onRequestSort}
            >
              Spieler
            </SortTableHead>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedGames.map(game => {
            return (
              <CollapseRow
                key={game.id}
                cells={[
                  <TableCell key="0">
                    <Placing place={game.deckPlay + 1} />
                  </TableCell>,
                  <TableCell key="1">{FORMAT.format(game.when)}</TableCell>,
                  <TableCell key="2">
                    {game.plays[game.deckPlay].player.name}
                  </TableCell>,
                ]}
                inner={<GameResult game={game} />}
              />
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default function Deck() {
  const { deck, card, users, games } = useLoaderData<typeof loader>();
  const image =
    card == null
      ? "https://cards.scryfall.io/border_crop/front/7/0/70e7ddf2-5604-41e7-bb9d-ddd03d3e9d0b.jpg?1559591549"
      : card.image_uris["border_crop"];
  return (
    <div>
      <Card>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1.5em",
            }}
          >
            <img src={image} height="500px" />
            <Box sx={{ flexGrow: 1, minWidth: "350px" }}>
              <EditDeck deck={deck} users={users} clearOnSave={false} />
              <Form method="delete" onSubmit={() => redirect("/")}>
                <Stack spacing={2}>
                  <Button type="submit" color="error">
                    Löschen
                  </Button>
                </Stack>
              </Form>
            </Box>
          </Box>
        </CardContent>
      </Card>
      <RecentPlays games={games} deck={deck.id} />
    </div>
  );
}
