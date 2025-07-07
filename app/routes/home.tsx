import * as React from "react";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import {
  Link as ReactRouterLink,
  useLoaderData,
  type ActionFunctionArgs,
} from "react-router";
import prisma from "~/db.server";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Collapse,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { EditDeck } from "~/components/EditDeck";
import { DeckSchema } from "~/types";

export function meta() {
  return [
    { title: "Magic" },
    {
      name: "description",
      content: "Unsere Magic commander sessions",
    },
  ];
}

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

export default function Home() {
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
                <TableCell>Besitzer</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {decks.map((deck, index) => (
                <TableRow
                  key={deck.name}
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    <Link href={`/deck/${deck.id}`}>{deck.name}</Link>
                  </TableCell>
                  <TableCell>{usersMap[deck.ownerId]}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Container>
  );
}
