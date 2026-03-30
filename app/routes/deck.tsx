import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Link from "@mui/material/Link";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import React, { type ReactElement } from "react";
import {
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  type MetaFunction,
  redirect,
  useActionData,
  useLoaderData,
  useSubmit,
} from "react-router";

import { DeckSchema, deleteDeck, parseIdParam, updateDeck } from "~/api.server";
import DestructionDialog from "~/components/DestructionDialog";
import { type DeckData, EditDeck } from "~/components/EditDeck";
import EditDrawer from "~/components/EditDrawer";
import GamesPieChart from "~/components/GamesPieChart";
import NotificationSnack from "~/components/NotificationSnack";
import PlayersChart from "~/components/PlayersChart";
import RecentPlays from "~/components/RecentPlays";
import prisma from "~/db.server";
import { NotFound, Validated } from "~/responses.server";
import { API as SCRYFALL } from "~/scryfall";
import { distinctCounts, getPlacings } from "~/stats";

export const meta: MetaFunction<typeof loader> = ({ loaderData }) => [
  {
    title: loaderData ? loaderData.deck.name : "Not found",
  },
];

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = parseIdParam(params.id);
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
  const card = await SCRYFALL.card(deck.commander);
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
      comment: true,
      plays: {
        orderBy: {
          place: "asc",
        },
        select: {
          place: true,
          deck: {
            select: {
              id: true,
              name: true,
            },
          },
          player: {
            select: {
              id: true,
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
    const deck = await updateDeck(
      parseIdParam(params.id),
      Validated(DeckSchema.safeParse(Object.fromEntries(body))),
    );
    return { type: "update", key: deck.updatedAt.toISOString() };
  } else if (request.method === "DELETE") {
    const id = parseIdParam(params.id);
    await deleteDeck(id);
    return redirect("/decks");
  } else {
    throw NotFound();
  }
};

type Deck = Awaited<ReturnType<typeof loader>>["deck"];
type Game = Awaited<ReturnType<typeof loader>>["games"][0];
type CardData = Awaited<ReturnType<typeof loader>>["card"];

function Properties({ deck, card }: { deck: Deck; card: CardData }) {
  const properties: Record<string, ReactElement | string> = {
    Commander:
      card == null ? (
        deck.commander
      ) : (
        <Link href={card.scryfall_uri} target="_blank">
          {deck.commander}
        </Link>
      ),
    Besitzer: <Link href={`/players/${deck.owner.id}`}>{deck.owner.name}</Link>,

    Bracket: String(deck.bracket),
  };
  if (deck.colors !== "") {
    properties["Farben"] = deck.colors;
  }
  if (deck.url) {
    properties["Link"] = (
      <Link href={deck.url} target="_blank">
        {deck.url}
      </Link>
    );
  }
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell sx={{ textAlign: "right" }}></TableCell>
          <TableCell></TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {Object.entries(properties).map(([name, element], i) => (
          <TableRow key={i}>
            <TableCell component="th" scope="row">
              {name}
            </TableCell>
            <TableCell>{element}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function DeckCard({
  deck,
  card,
  onEdit,
}: {
  deck: Deck;
  card: CardData;
  onEdit: () => void;
}) {
  const image =
    card == null
      ? "https://cards.scryfall.io/border_crop/front/7/0/70e7ddf2-5604-41e7-bb9d-ddd03d3e9d0b.jpg?1559591549"
      : card.image_uris["border_crop"];
  return (
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
          <img src={image} alt={deck.commander} height="510px" width="360px" />
          <Box sx={{ flexGrow: 1, minWidth: "350px" }}>
            <Typography variant="h4" component="h1">
              {deck.name}
            </Typography>
            {deck.description && (
              <Typography sx={{ fontStyle: "italic", marginTop: 0.5 }}>
                {deck.description}
              </Typography>
            )}
            <Properties deck={deck} card={card} />
            <Box sx={{ float: "right" }}>
              <Button
                type="submit"
                color="warning"
                onClick={onEdit}
                sx={{ marginTop: 1 }}
              >
                Bearbeiten
              </Button>
            </Box>
          </Box>
        </Box>
      </CardContent>
      <div></div>
    </Card>
  );
}

function PlacingsChart({ deck, games }: { deck: number; games: Game[] }) {
  const series = React.useMemo(() => {
    const placings = getPlacings(games, null, p => p.deck.id).get(deck) || [];
    const counts = Array.from(distinctCounts(placings).entries());
    counts.sort((a, b) => a[0] - b[0]);
    return counts.map(([place, count], i) => {
      return {
        id: i,
        value: count,
        label: `${place}. Platz`,
      };
    });
  }, [deck, games]);
  return <GamesPieChart data={series} games={games.length} />;
}

function Stats({ games, placingId }: { games: Game[]; placingId: number }) {
  return (
    <Card>
      <CardContent
        sx={{
          display: "flex",
          flexWrap: "wrap",
          flexDirection: "row",
          justifyContent: "space-around",
        }}
      >
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h5" gutterBottom>
            Platzierungen
          </Typography>
          <PlacingsChart deck={placingId} games={games} />
        </Box>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h5" gutterBottom>
            Spieleranzahl
          </Typography>
          <PlayersChart games={games} />
        </Box>{" "}
      </CardContent>
      <div></div>
    </Card>
  );
}

export default function Deck() {
  const { deck, card, users, games } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const actionData = useActionData<typeof action>();
  const [editDrawerOpen, setEditDrawerOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [editDeck, setEditDeck] = React.useState<DeckData>(deck);

  const handleDeleteClose = (confirmed: boolean) => {
    setDeleteOpen(false);
    if (confirmed) {
      submit({}, { method: "DELETE", replace: true });
    }
  };

  return (
    <Box sx={{ display: "flex", gap: "1em", flexDirection: "column" }}>
      <DeckCard
        deck={deck}
        card={card}
        onEdit={() => {
          setEditDeck(deck);
          setEditDrawerOpen(true);
        }}
      />
      <Stats games={games} placingId={deck.id} />
      <RecentPlays
        games={games}
        columnKey="player"
        placingKey="deck"
        placingId={deck.id}
      />
      <EditDrawer
        open={editDrawerOpen}
        setOpen={setEditDrawerOpen}
        onDelete={() => {
          setDeleteOpen(true);
        }}
        mode="edit"
        what="Deck"
      >
        <EditDeck
          mode="edit"
          deck={editDeck}
          setDeck={setEditDeck}
          users={users}
        />
      </EditDrawer>
      <DestructionDialog
        open={deleteOpen}
        handleClose={handleDeleteClose}
        title={"Möchtest du dieses Deck wirklich löschen?"}
      />
      {actionData && (
        <NotificationSnack key={actionData.key} message={"Deck gespeichert"} />
      )}
    </Box>
  );
}
