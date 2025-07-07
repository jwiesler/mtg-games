import * as React from "react";
import {
  Form,
  redirect,
  useLoaderData,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import prisma from "~/db.server";
import { API } from "~/scryfall";
import {
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  TextField,
} from "@mui/material";
import Item from "@mui/material/Stack";
import type { Deck } from "~/types";
import { DeckSchema } from "~/types";
import { EditDeck } from "~/components/EditDeck";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = Number(params.id);
  if (Number.isNaN(id)) {
    throw new Response("Not Found", { status: 404 });
  }
  const deck = await prisma.deck.findUnique({ where: { id: id } });
  if (deck == null) {
    throw new Response("Not Found", { status: 404 });
  }
  const owner = await prisma.user.findUnique({ where: { id: deck.ownerId } });
  if (owner == null) {
    throw new Response("Owner not found", { status: 500 });
  }
  const users = await prisma.user.findMany();
  const card = await API.card(deck.commander);
  return {
    deck,
    owner,
    card,
    users,
  };
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const body = await request.formData();
  if (request.method === "POST") {
    const s = DeckSchema.safeParse(Object.fromEntries(body));
    if (!s.success) {
      throw new Response("Bad request", { status: 400 });
    }
    const data = s.data;
    let user = await prisma.user.findFirst({ where: { name: data.owner } });
    if (user == null) {
      user = await prisma.user.create({ data: { name: data.owner } });
    }
    await prisma.deck.update({
      data: {
        name: data.name,
        commander: data.commander,
        description: data.description,
        ownerId: user.id,
      },
      where: { id: Number(params.id) },
    });
  } else if (request.method === "DELETE") {
    await prisma.deck.delete({ where: { id: Number(params.id) } });
    return redirect("/");
  } else {
    throw new Response("Not found", { status: 404 });
  }
};

export default function Deck() {
  const { deck, owner, card, users } = useLoaderData<typeof loader>();
  const image =
    card == null
      ? "https://cards.scryfall.io/border_crop/front/7/0/70e7ddf2-5604-41e7-bb9d-ddd03d3e9d0b.jpg?1559591549"
      : card.image_uris["border_crop"];
  return (
    <Card>
      <CardContent>
        <Stack spacing={2} direction="row">
          <Item>
            <img src={image} height={"500px"}></img>
          </Item>
          <Item flexGrow={1}>
            <EditDeck
              deck={{ ...deck, owner: owner.name }}
              users={users.map(u => u.name)}
              clearOnSave={false}
            />
            <Form method="delete" onSubmit={() => redirect("/")}>
              <Stack spacing={2}>
                <Button type="submit" color="error">
                  Löschen
                </Button>
              </Stack>
            </Form>
          </Item>
        </Stack>
      </CardContent>
    </Card>
  );
}
