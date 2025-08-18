import DeleteIcon from "@mui/icons-material/DeleteOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import React from "react";
import {
  type ActionFunctionArgs,
  Form,
  type MetaFunction,
  useActionData,
  useLoaderData,
  useSubmit,
} from "react-router";
import z from "zod";

import DestructionDialog from "~/components/DestructionDialog";
import NotificationSnack from "~/components/NotificationSnack";
import { SortTableHead } from "~/components/SortTableHead";
import prisma from "~/db.server";
import { Prisma, type User } from "~/generated/prisma/client";
import { BadRequest, NotFound, Validated } from "~/responses";
import { comparingBy, useSortingStates } from "~/sort";

export const meta: MetaFunction<typeof loader> = () => [
  {
    title: "Spieler",
  },
];

export const loader = async () => {
  return {
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
    const name = Validated(z.string().safeParse(body.get("name")));
    const user = await prisma.user.create({ data: { name } });
    return { type: "create", key: `create-${user.id}`, name: user.name };
  } else if (request.method == "DELETE") {
    const body = await request.formData();
    const id = Validated(z.coerce.number().safeParse(body.get("id")));
    try {
      const user = await prisma.user.delete({
        select: { name: true },
        where: { id },
      });
      return { type: "delete", key: `delete-${id}`, name: user.name };
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
  const actionData = useActionData<typeof action>();
  const [order, orderBy, onRequestSort] = useSortingStates("asc", "name");
  const sortedUsers = React.useMemo(() => {
    const extract = (v: User) => v.name;
    return [...users].sort(comparingBy(order, extract));
  }, [users, order, orderBy]);
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
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const sortedUsersSlice = sortedUsers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );
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
      <TableContainer component={Paper}>
        <Table stickyHeader={true}>
          <TableHead>
            <TableRow>
              <TableCell width={"3em"}>#</TableCell>
              <SortTableHead
                order={order}
                orderBy={orderBy}
                sortKey="name"
                onRequestSort={onRequestSort}
              >
                Name
              </SortTableHead>
              <TableCell width={"5em"}></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedUsersSlice.map((user, index) => (
              <TableRow
                key={user.id}
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  {page * rowsPerPage + index + 1}
                </TableCell>
                <TableCell>
                  <Link href={`/players/${user.id}`}>{user.name}</Link>
                </TableCell>
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
      <TablePagination
        rowsPerPageOptions={[10, 25, 50]}
        component="div"
        count={sortedUsers.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        onRowsPerPageChange={p => {
          setRowsPerPage(parseInt(p.target.value, 10));
          setPage(0);
        }}
      />
      <DestructionDialog
        open={open}
        handleClose={handleClose}
        title={"Möchtest du diesen Spieler wirklich löschen?"}
      />

      {actionData && (
        <NotificationSnack
          key={actionData.key}
          message={
            actionData.type == "create"
              ? `Spieler '${actionData.name}' angelegt`
              : `Spieler '${actionData.name}' gelöscht`
          }
        />
      )}
    </Box>
  );
}
