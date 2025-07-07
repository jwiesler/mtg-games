import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";

export function meta() {
  return [
    { title: "Magic" },
    {
      name: "description",
      content: "Unsere Magic commander sessions",
    },
  ];
}

export default function Home() {
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
          <Link href="/decks">Decks</Link>
        </Typography>
        <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
          <Link href="/players">Spieler</Link>
        </Typography>
      </Box>
    </Container>
  );
}
