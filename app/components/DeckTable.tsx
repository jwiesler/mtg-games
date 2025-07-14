import DeleteIcon from "@mui/icons-material/DeleteOutline";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

import type { Deck } from "~/generated/prisma/client";

export function DeckTable({
  decks,
  usersMap,
  onDelete,
}: {
  decks: Deck[];
  usersMap: Record<string, string>;
  onDelete: (id: number) => void;
}) {
  return (
    <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell width={"3em"}>#</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Besitzer</TableCell>
            <TableCell width={"5em"}></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {decks.map((deck, index) => (
            <TableRow
              key={deck.id}
              sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                {index + 1}
              </TableCell>
              <TableCell>
                <Link href={`/decks/${deck.id}`}>{deck.name}</Link>
              </TableCell>
              <TableCell>{usersMap[deck.ownerId]}</TableCell>
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
  );
}
