import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Container,
  Typography,
} from "@mui/material";
import React from "react";
import { useLoaderData, type ActionFunctionArgs } from "react-router";
import { EditDeck } from "~/components/EditDeck";
import prisma from "~/db.server";
import { DeckSchema } from "~/types";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { DeckTable } from "~/components/DeckTable";

export const loader = async () => {
  return {
    decks: await prisma.deck.findMany(),
    users: await prisma.user.findMany(),
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const body = await request.formData();
  const form = body.get("form-id");
  if (form === "edit-deck") {
    const s = DeckSchema.safeParse(Object.fromEntries(body));
    if (!s.success) {
      throw new Response("Bad request", { status: 400 });
    }
    const data = s.data;
    let user = await prisma.user.findFirst({ where: { name: data.owner } });
    if (user == null) {
      user = await prisma.user.create({ data: { name: data.owner } });
    }
    await prisma.deck.create({
      data: {
        name: data.name,
        commander: data.commander,
        description: data.description,
        ownerId: user.id,
      },
    });
  } else {
    throw new Response("Not found", { status: 404 });
  }
};

function CreateDeck({ users }: { users: string[] }) {
  const [expanded, setExpanded] = React.useState(false);
  return (
    <Accordion
      expanded={expanded}
      onChange={(_, expanded) => setExpanded(expanded)}
      sx={{ width: "100%" }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls="panel1-content"
        id="panel1-header"
      >
        <Typography>Deck erstellen</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <EditDeck
          deck={{ name: "", owner: "", description: "", commander: "" }}
          users={users}
          clearOnSave={true}
        ></EditDeck>
      </AccordionDetails>
    </Accordion>
  );
}

export default function Decks() {
  const { decks, users } = useLoaderData<typeof loader>();
  const usersMap = Object.fromEntries(users.map(u => [u.id, u.name]));
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
          Decks
        </Typography>
        <CreateDeck users={users.map(u => u.name)} />
        <DeckTable decks={decks} usersMap={usersMap} />
      </Box>
    </Container>
  );
}
