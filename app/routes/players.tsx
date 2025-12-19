import EditIcon from "@mui/icons-material/Edit";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
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
import Drawer from "~/components/Drawer";
import NotificationSnack from "~/components/NotificationSnack";
import { SortTableHead } from "~/components/SortTableHead";
import prisma from "~/db.server";
import { Prisma } from "~/generated/prisma/client";
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

export const UserSchema = z.object({
  name: z.string(),
  id: z.string().optional(),
});

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method == "POST") {
    const body = await request.formData();
    const requestedUser = Validated(
      UserSchema.safeParse(Object.fromEntries(body)),
    );
    let user: { name: string; id: number };
    if (requestedUser.id !== undefined) {
      user = await prisma.user.update({
        where: { id: Number(requestedUser.id) },
        data: { name: requestedUser.name },
      });
    } else {
      user = await prisma.user.create({ data: { name: requestedUser.name } });
    }

    const mode = requestedUser.id === undefined ? "create" : "update";
    return { type: mode, key: `${mode}-${user.id}`, name: user.name };
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

interface UserData {
  id?: number;
  name: string;
}

function EditUser({
  user,
  setUser,
  onSubmit,
  onDelete,
  mode,
}: {
  user: UserData;
  setUser: (user: UserData) => void;
  onSubmit: () => void;
  onDelete: () => void;
  mode: "create" | "edit";
}) {
  if (mode == "edit" && user.id === undefined) {
    throw new Error("user.id is not set in edit mode");
  }
  return (
    <Form method="post" onSubmit={onSubmit}>
      <Stack spacing={2}>
        <TextField
          name="name"
          label="Name"
          value={user.name}
          onChange={e => setUser({ ...user, name: e.target.value })}
          required={true}
        />
        {mode == "edit" && <input name="id" type="hidden" value={user.id} />}
        <Stack direction="row">
          <Button type="submit" disabled={user.name.length < 3} color="primary">
            Speichern
          </Button>
          {mode == "edit" && (
            <Button color="error" onClick={onDelete}>
              Löschen
            </Button>
          )}
        </Stack>
      </Stack>
    </Form>
  );
}

type User = Awaited<ReturnType<typeof loader>>["users"][0];

function UsersTable({
  users,
  onUserEditClick,
}: {
  users: User[];
  onUserEditClick: (user: User) => void;
}) {
  const [order, orderBy, onRequestSort] = useSortingStates("asc", "name");
  const sortedUsers = React.useMemo(() => {
    const extract = (v: User) => v.name;
    return [...users].sort(comparingBy(order, extract));
  }, [users, order, orderBy]);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(25);
  const sortedUsersSlice = sortedUsers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );
  return (
    <>
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
                    onClick={() => onUserEditClick(user)}
                  >
                    <EditIcon />
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
    </>
  );
}

export default function Users() {
  const { users } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();
  const [mode, setMode] = React.useState<"edit" | "create">("create");
  const [user, setUser] = React.useState<UserData>({ name: "" });
  const [userDrawerOpen, setUserDrawerOpen] = React.useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [deleteUserId, setDeleteUserId] = React.useState<number | null>(null);
  const handleClose = (confirmed: boolean) => {
    setDeleteModalOpen(false);
    setUserDrawerOpen(false);
    if (confirmed && deleteUserId) {
      submit({ id: deleteUserId }, { method: "DELETE", replace: true });
    }
  };

  const openEditUser = (user: UserData, mode: "edit" | "create") => {
    setUser(user);
    setMode(mode);
    setUserDrawerOpen(true);
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
      <Button onClick={() => openEditUser({ name: "" }, "create")}>
        Spieler anlegen
      </Button>
      <Drawer
        title={mode == "create" ? "Spieler anlegen" : "Spieler bearbeiten"}
        open={userDrawerOpen}
        onClose={() => setUserDrawerOpen(false)}
      >
        <EditUser
          user={user}
          setUser={setUser}
          onSubmit={() => setUserDrawerOpen(false)}
          onDelete={() => {
            setDeleteUserId(user.id as number);
            setDeleteModalOpen(true);
          }}
          mode={mode}
        />
      </Drawer>
      <UsersTable
        users={users}
        onUserEditClick={user => {
          openEditUser(user, "edit");
        }}
      />
      <DestructionDialog
        open={deleteModalOpen}
        handleClose={handleClose}
        title={"Möchtest du diesen Spieler wirklich löschen?"}
      />

      {actionData && (
        <NotificationSnack
          key={actionData.key}
          message={
            actionData.type == "create"
              ? `Spieler '${actionData.name}' angelegt`
              : actionData.type == "update"
                ? `Spieler '${actionData.name}' gespeichert`
                : `Spieler '${actionData.name}' gelöscht`
          }
        />
      )}
    </Box>
  );
}
