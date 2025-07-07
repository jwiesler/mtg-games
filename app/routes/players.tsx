import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import { Form, useLoaderData, type ActionFunctionArgs } from "react-router";
import { EditDeck } from "~/components/EditDeck";
import prisma from "~/db.server";
import { DeckSchema } from "~/types";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { DeckTable } from "~/components/DeckTable";
import type { User } from "~/generated/prisma/client";

export const loader = async () => {
  return {
    users: await prisma.user.findMany(),
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const body = await request.formData();
  const name = body.get("name");
  if (name == null) {
    throw new Response("Bad request", { status: 400 });
  }
  await prisma.user.create({ data: { name: name.toString() } });
};

export default function Users() {
  const { users } = useLoaderData<typeof loader>();
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState("");
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
            <Typography>Spieler anlegen</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Form method="post" onSubmit={() => setName("")}>
              <TextField
                name="name"
                label="Name"
                value={name}
                onChange={e => setName(e.target.value)}
                required={true}
              />
            </Form>
          </AccordionDetails>
        </Accordion>
        <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
          <Table
            sx={{ minWidth: 650 }}
            aria-label="simple table"
            stickyHeader={true}
          >
            <TableHead>
              <TableRow>
                <TableCell width={"3em"}>#</TableCell>
                <TableCell>Name</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user, index) => (
                <TableRow
                  key={user.id}
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    {index + 1}
                  </TableCell>
                  <TableCell>{user.name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Container>
  );
}
