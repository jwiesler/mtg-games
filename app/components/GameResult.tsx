import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Link from "@mui/material/Link";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";

import Placing from "./Placing";

function Duration({ seconds, sx }: { seconds: number; sx?: SxProps<Theme> }) {
  const minutes = (seconds / 60) % 60;
  const hours = Math.floor(seconds / 3600);
  const mins = `${minutes}min`;
  return <Chip label={hours == 0 ? mins : `${hours}h ${mins}`} sx={sx} />;
}

export default function GameResult({
  game,
}: {
  game: {
    plays: {
      place: number;
      deck: { id: number; name: string };
      player: { id: number; name: string };
    }[];
    comment: string;
    duration: number;
  };
}) {
  return (
    <>
      <Typography variant="h6" gutterBottom component="div">
        Ergebnis
        {game.duration > 0 && (
          <Duration seconds={game.duration} sx={{ float: "right" }} />
        )}
      </Typography>
      <Box sx={{ margin: 1 }}>
        <Table size="small">
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
                  <Placing place={play.place} />
                </TableCell>
                <TableCell>
                  <Link href={`/players/${play.player.id}`}>
                    {play.player.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/decks/${play.deck.id}`}>{play.deck.name}</Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {game.comment !== "" && (
          <Typography sx={{ fontStyle: "italic", paddingTop: 1 }}>
            {game.comment}
          </Typography>
        )}
      </Box>
    </>
  );
}
