import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

import Placing from "./Placing";

export default function GameResult({
  game,
}: {
  game: {
    plays: { deck: { id: number; name: string }; player: { name: string } }[];
  };
}) {
  return (
    <>
      <Typography variant="h6" gutterBottom component="div">
        Ergebnis
      </Typography>
      <Box sx={{ margin: 1 }}>
        <Table size="small" aria-label="purchases">
          <TableHead>
            <TableRow>
              <TableCell width="2.5em"></TableCell>
              <TableCell>Spieler</TableCell>
              <TableCell>Deck</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {game.plays.map((play, i) => (
              <TableRow key={i}>
                <TableCell component="th" scope="row">
                  <Placing place={i + 1} />
                </TableCell>
                <TableCell>{play.player.name}</TableCell>
                <TableCell>
                  <Link href={`/decks/${play.deck.id}`}>{play.deck.name}</Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </>
  );
}
