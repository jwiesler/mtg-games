import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Container,
  Typography,
} from "@mui/material";
import React from "react";
import {
  useLoaderData,
  useSubmit,
  type ActionFunctionArgs,
} from "react-router";
import { EditDeck } from "~/components/EditDeck";
import prisma from "~/db.server";
import { DeckSchema } from "~/types";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { DeckTable } from "~/components/DeckTable";
import type { User } from "~/generated/prisma/client";
import DestructionDialog from "~/components/DestructionDialog";
import z from "zod";
export const loader = async () => {
  return {
    decks: await prisma.deck.findMany(),
    users: await prisma.user.findMany(),
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method == "POST") {
    const body = await request.formData();
    const s = DeckSchema.safeParse(Object.fromEntries(body));
    if (!s.success) {
      throw new Response("Bad request", { status: 400 });
    }
    const data = s.data;
    await prisma.deck.create({
      data: {
        name: data.name,
        commander: data.commander,
        description: data.description,
        ownerId: data.ownerId,
      },
    });
  } else if (request.method == "DELETE") {
    const body = await request.formData();
    const id = z.coerce.number().safeParse(body.get("id"));
    if (!id.success) {
      throw new Response("Bad request", { status: 400 });
    }
    await prisma.deck.delete({ where: { id: id.data } });
  } else {
    throw new Response("Not found", { status: 404 });
  }
};

function CreateDeck({ users }: { users: User[] }) {
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
          deck={{ name: "", owner: users[0], description: "", commander: "" }}
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
  const submit = useSubmit();
  const [open, setOpen] = React.useState(false);
  const [deleteDeckId, setDeleteDeckId] = React.useState<number | null>(null);
  const handleClose = (confirmed: boolean) => {
    setOpen(false);
    if (confirmed && deleteDeckId) {
      submit({ id: deleteDeckId }, { method: "DELETE", replace: true });
    }
  };
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
        <CreateDeck users={users} />
        <DeckTable
          decks={decks}
          usersMap={usersMap}
          onDelete={id => {
            setDeleteDeckId(id);
            setOpen(true);
          }}
        />
        <DestructionDialog
          open={open}
          handleClose={handleClose}
          title={"Möchtest du dieses Deck wirklich löschen?"}
        />
      </Box>
    </Container>
  );
}
