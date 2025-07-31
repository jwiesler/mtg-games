import DeleteIcon from "@mui/icons-material/DeleteOutline";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import React from "react";

import { SortTableHead } from "./SortTableHead";
import type { User } from "~/generated/prisma/client";
import { comparingBy, useSortingStates } from "~/sort";

interface Deck {
  name: string;
  id: number;
  owner: User;
}

export function DeckTable({
  decks,
  onDelete,
}: {
  decks: Deck[];
  onDelete: (id: number) => void;
}) {
  const [order, orderBy, onRequestSort] = useSortingStates("asc", "name");
  const sortedDecks = React.useMemo(() => {
    let extract;
    if (orderBy == "name") {
      extract = (v: Deck) => v.name;
    } else {
      extract = (v: Deck) => v.owner.name;
    }
    return [...decks].sort(comparingBy(order, extract));
  }, [order, orderBy, decks]);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const sortedDecksSlice = sortedDecks.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );
  return (
    <>
      <TableContainer component={Paper}>
        <Table stickyHeader>
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
              <SortTableHead
                order={order}
                orderBy={orderBy}
                sortKey="owner"
                onRequestSort={onRequestSort}
              >
                Besitzer
              </SortTableHead>
              <TableCell width={"5em"}></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedDecksSlice.map((deck, index) => (
              <TableRow
                key={deck.id}
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  {page * rowsPerPage + index + 1}
                </TableCell>
                <TableCell>
                  <Link href={`/decks/${deck.id}`}>{deck.name}</Link>
                </TableCell>
                <TableCell>{deck.owner.name}</TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    color="default"
                    onClick={() => onDelete(deck.id)}
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
        count={sortedDecks.length}
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
