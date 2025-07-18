import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import {
  type ActionFunctionArgs,
  Form,
  type LoaderFunctionArgs,
  type MetaFunction,
  redirect,
  useLoaderData,
} from "react-router";

import { EditDeck } from "~/components/EditDeck";
import prisma from "~/db.server";
import { BadRequest, NotFound } from "~/responses";
import { API } from "~/scryfall";
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
      name: true,
      description: true,
      commander: true,
      owner: true,
    },
  });
  if (deck == null) {
    throw NotFound();
  }
  const users = await prisma.user.findMany();
  const card = await API.card(deck.commander);
  return {
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
    await prisma.deck.update({
      data: {
        name: data.name.trim() || data.commander.trim(),
        commander: data.commander.trim(),
        description: data.description.trim(),
        ownerId: data.ownerId,
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

export default function Deck() {
  const { deck, card, users } = useLoaderData<typeof loader>();
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
  );
}
