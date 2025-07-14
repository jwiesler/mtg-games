import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Form,
  useLoaderData,
  useSubmit,
  type ActionFunctionArgs,
} from "react-router";
import prisma from "~/db.server";
import DestructionDialog from "~/components/DestructionDialog";
import React from "react";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import z from "zod";
import { Prisma } from "~/generated/prisma/client";
import { BadRequest, NotFound } from "~/responses";
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
      throw BadRequest("Form field 'name' not found");
    }
    await prisma.user.create({ data: { name: name.toString() } });
  } else if (request.method == "DELETE") {
    const body = await request.formData();
    const id = z.coerce.number().safeParse(body.get("id"));
    if (!id.success) {
      throw BadRequest("Failed to parse id");
    }
    try {
      await prisma.user.delete({ where: { id: id.data } });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === "P2003") {
          throw BadRequest(
            "A user with decks can't be deleted, delete the user's decks first",
          );
        }
      }
      throw e;
    }
  } else {
    throw NotFound();
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
            <Stack>
              <TextField
                name="name"
                label="Name"
                value={name}
                onChange={e => setName(e.target.value)}
                required={true}
              />
            </Stack>
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
                    size="small"
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
  );
}
