import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Container,
  IconButton,
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
import {
  Form,
  useLoaderData,
  useSubmit,
  type ActionFunctionArgs,
} from "react-router";
import prisma from "~/db.server";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DestructionDialog from "~/components/DestructionDialog";
import React from "react";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import z from "zod";
export const loader = async () => {
  return {
    users: await prisma.user.findMany(),
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method == "POST") {
    const body = await request.formData();
    const name = body.get("name");
    if (name == null) {
      throw new Response("Bad request", { status: 400 });
    }
    await prisma.user.create({ data: { name: name.toString() } });
  } else if (request.method == "DELETE") {
    const body = await request.formData();
    const id = z.coerce.number().safeParse(body.get("id"));
    if (!id.success) {
      throw new Response("Bad request", { status: 400 });
    }
    await prisma.user.delete({ where: { id: id.data } });
  } else {
    throw new Response("Not found", { status: 404 });
  }
};

export default function Users() {
  const { users } = useLoaderData<typeof loader>();
  const [expanded, setExpanded] = React.useState(false);
  const [name, setName] = React.useState("");
  const submit = useSubmit();
  const [open, setOpen] = React.useState(false);
  const [deleteUserId, setDeleteUserId] = React.useState<number | null>(null);
  const handleClose = (confirmed: boolean) => {
    setOpen(false);
    if (confirmed && deleteUserId) {
      submit({ id: deleteUserId }, { method: "DELETE", replace: true });
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
          Spieler
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
          <Table stickyHeader={true}>
            <TableHead>
              <TableRow>
                <TableCell width={"3em"}>#</TableCell>
                <TableCell>Name</TableCell>
                <TableCell width={"5em"}></TableCell>
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
                  <TableCell>
                    <IconButton
                      color="default"
                      onClick={() => {
                        setDeleteUserId(user.id);
                        setOpen(true);
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <DestructionDialog
          open={open}
          handleClose={handleClose}
          title={"Möchtest du diesen Spieler wirklich löschen?"}
        />
      </Box>
    </Container>
  );
}
