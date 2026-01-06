import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import React from "react";
import {
  type ActionFunctionArgs,
  Form,
  type LoaderFunctionArgs,
  type MetaFunction,
  redirect,
  useActionData,
  useLoaderData,
} from "react-router";

import { DeckSchema, deleteDeck, parseIdParam, updateDeck } from "~/api.server";
import { EditDeck } from "~/components/EditDeck";
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
  const actionData = useActionData<typeof action>();
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
      <RecentPlays
        games={games}
        columnKey="player"
        placingKey="deck"
        placingId={deck.id}
      />
      {actionData && (
        <NotificationSnack key={actionData.key} message={"Deck gespeichert"} />
      )}
    </div>
  );
}
