import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import React from "react";
import {
  type ActionFunctionArgs,
  type MetaFunction,
  useLoaderData,
  useSubmit,
} from "react-router";
import z from "zod";

import { DeckTable } from "~/components/DeckTable";
import DestructionDialog from "~/components/DestructionDialog";
import { EditDeck } from "~/components/EditDeck";
import prisma from "~/db.server";
import { Prisma, type User } from "~/generated/prisma/client";
import { BadRequest, NotFound } from "~/responses";
import { DeckSchema } from "~/types";

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
    const s = DeckSchema.safeParse(Object.fromEntries(body));
    if (!s.success) {
      throw BadRequest("Failed to validate input");
    }
    const data = s.data;
    await prisma.deck.create({
      data: {
        name: data.name.trim() || data.commander.trim(),
        commander: data.commander.trim(),
        description: data.description.trim(),
        ownerId: data.ownerId,
        bracket: data.bracket,
        colors: data.colors.trim(),
        url: data.url.trim(),
      },
    });
  } else if (request.method == "DELETE") {
    const body = await request.formData();
    const id = z.coerce.number().safeParse(body.get("id"));
    if (!id.success) {
      throw BadRequest("Failed to validate input");
    }
    try {
      await prisma.deck.delete({ where: { id: id.data } });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === "P2003") {
          throw BadRequest(
            "A deck that was played can't be deleted. Delete those games first.",
          );
        }
      }
      throw e;
    }
  } else {
    throw NotFound();
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
        <Typography>Deck anlegen</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <EditDeck
          deck={{
            name: "",
            owner: null,
            description: "",
            commander: "",
            colors: "",
            bracket: 3,
            url: "",
          }}
          users={users}
          clearOnSave={true}
        ></EditDeck>
      </AccordionDetails>
    </Accordion>
  );
}

export default function Decks() {
  const { decks, users } = useLoaderData<typeof loader>();
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
  );
}
