import {
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import type { Deck } from "~/generated/prisma/client";

export function DeckTable({
  decks,
  usersMap,
}: {
  decks: Deck[];
  usersMap: Record<string, string>;
}) {
  return (
    <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
      <Table sx={{ minWidth: 650 }} stickyHeader={true}>
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
