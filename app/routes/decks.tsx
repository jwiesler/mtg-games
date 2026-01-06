import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import React from "react";
import {
  type ActionFunctionArgs,
  type MetaFunction,
  useActionData,
  useLoaderData,
} from "react-router";
import z from "zod";

import { DeckSchema, createDeck, deleteDeck } from "~/api.server";
import { DeckTable } from "~/components/DeckTable";
import { type DeckData, EMPTY_DECK, EditDeck } from "~/components/EditDeck";
import EditDrawer from "~/components/EditDrawer";
import NotificationSnack from "~/components/NotificationSnack";
import prisma from "~/db.server";
import { NotFound, Validated } from "~/responses.server";

export const meta: MetaFunction<typeof loader> = () => [
  {
    title: "Decks",
  },
];

export const loader = async () => {
  return {
    decks: await prisma.deck.findMany({
      orderBy: {
        name: "asc",
      },
      select: { id: true, name: true, owner: true },
    }),
    users: await prisma.user.findMany({
      orderBy: {
        name: "asc",
      },
    }),
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method == "POST") {
    const body = await request.formData();
    const deck = await createDeck(
      Validated(DeckSchema.safeParse(Object.fromEntries(body))),
    );
    return { type: "create", key: `create-${deck.id}`, name: deck.name };
  } else if (request.method == "DELETE") {
    const body = await request.formData();
    const id = Validated(z.coerce.number().safeParse(body.get("id")));
    const deck = await deleteDeck(id);
    return { type: "delete", key: `delete-${id}`, name: deck.name };
  } else {
    throw NotFound();
  }
};

export default function Decks() {
  const actionData = useActionData<typeof action>();
  const { decks, users } = useLoaderData<typeof loader>();
  const [editDrawerOpen, setEditDrawerOpen] = React.useState(false);
  const [deck, setDeck] = React.useState<DeckData>(EMPTY_DECK);
  const openEditDeck = () => {
    setDeck(EMPTY_DECK);
    setEditDrawerOpen(true);
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
        Decks
      </Typography>
      <Button onClick={openEditDeck}>Deck anlegen</Button>
      <DeckTable decks={decks} />

      <EditDrawer
        open={editDrawerOpen}
        setOpen={setEditDrawerOpen}
        onDelete={() => {}}
        mode="create"
        what="Deck"
      >
        <EditDeck mode="create" deck={deck} setDeck={setDeck} users={users} />
      </EditDrawer>

      {actionData && (
        <NotificationSnack
          key={actionData.key}
          message={`Deck ${actionData.name} ${actionData.type == "create" ? "angelegt" : "gelöscht"}`}
        />
      )}
    </Box>
  );
}
