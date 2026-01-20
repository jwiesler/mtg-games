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
import NotificationSnack from "~/components/NotificationSnack";
import RecentPlays from "~/components/RecentPlays";
import prisma from "~/db.server";
import { NotFound, Validated } from "~/responses.server";
import { API as SCRYFALL } from "~/scryfall";

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

export default function Deck() {
  const { deck, card, users, games } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const actionData = useActionData<typeof action>();
  const [editDrawerOpen, _setEditDrawerOpen] = React.useState(false);
  const setEditDrawerOpen = (value: boolean) => {
    console.log("editDrawerOpen", value);
    _setEditDrawerOpen(value);
  };
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [editDeck, setEditDeck] = React.useState<DeckData>(deck);

  const handleDeleteClose = (confirmed: boolean) => {
    setDeleteOpen(false);
    if (confirmed) {
      submit({}, { method: "DELETE", replace: true });
    }
  };
  const image =
    card == null
      ? "https://cards.scryfall.io/border_crop/front/7/0/70e7ddf2-5604-41e7-bb9d-ddd03d3e9d0b.jpg?1559591549"
      : card.image_uris["border_crop"];
  const properties: Record<string, ReactElement | string> = {
    Commander: deck.commander,
    Besitzer: <Link href={`/players/${deck.owner.id}`}>{deck.owner.name}</Link>,
    Farben: deck.colors,
    Bracket: String(deck.bracket),
  };
  if (deck.url) {
    properties["Link"] = (
      <a href={deck.url} target="_blank">
        {deck.url}
      </a>
    );
  }
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
            <img
              src={image}
              alt={deck.commander}
              height="510px"
              width="360px"
            />
            <Box sx={{ flexGrow: 1, minWidth: "350px" }}>
              <Typography variant="h4" component="h1">
                {deck.name}
              </Typography>
              {deck.description && (
                <Typography sx={{ fontStyle: "italic", marginTop: 0.5 }}>
                  {deck.description}
                </Typography>
              )}
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
              <Box sx={{ float: "right", mb: 1 }}>
                <Button
                  type="submit"
                  color="warning"
                  onClick={() => {
                    setEditDeck(deck);
                    setEditDrawerOpen(true);
                  }}
                  sx={{ marginTop: 1 }}
                >
                  Bearbeiten
                </Button>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
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
    </div>
  );
}
