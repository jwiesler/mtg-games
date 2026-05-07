import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import {
  type LoaderFunctionArgs,
  type MetaFunction,
  useLoaderData,
} from "react-router";

import { parseIdParam } from "~/api.server";
import { type Game, NamesChart } from "~/components/NamesChart";
import { PlacingsChart } from "~/components/PlacingsChart";
import PlayersChart from "~/components/PlayersChart";
import RecentPlays from "~/components/RecentPlays";
import prisma from "~/db.server";
import { NotFound } from "~/responses.server";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = parseIdParam(params.id);
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
    },
  });
  if (user == null) {
    throw NotFound();
  }
  const games = await prisma.game.findMany({
    where: {
      plays: {
        some: {
          playerId: id,
        },
      },
    },
    select: {
      id: true,
      when: true,
      duration: true,
      comment: true,
      plays: {
        orderBy: {
          place: "asc",
        },
        select: {
          place: true,
          deck: {
            select: {
              id: true,
              name: true,
            },
          },
          player: {
            select: {
              name: true,
              id: true,
            },
          },
        },
      },
    },
  });
  return {
    games,
    user,
  };
};

export const meta: MetaFunction<typeof loader> = () => [
  {
    title: "Spieler",
  },
];

function Stats({ games, playerId }: { games: Game[]; playerId: number }) {
  return (
    <Card>
      <CardContent
        sx={{
          display: "flex",
          flexWrap: "wrap",
          flexDirection: "row",
          justifyContent: "space-around",
        }}
      >
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h5" gutterBottom>
            Platzierungen
          </Typography>
          <PlacingsChart
            filterBy="player"
            filterById={playerId}
            games={games}
          />
        </Box>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h5" gutterBottom>
            Spieleranzahl
          </Typography>
          <PlayersChart games={games} />
        </Box>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h5" gutterBottom>
            Spieler
          </Typography>
          <NamesChart
            filterBy="player"
            filterById={playerId}
            nameKey="deck"
            games={games}
          />
        </Box>{" "}
      </CardContent>
      <div></div>
    </Card>
  );
}

export default function Player() {
  const { user, games } = useLoaderData<typeof loader>();
  return (
    <Box
      sx={{
        gap: "1em",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <Typography
        variant="h4"
        component="h1"
        sx={{ mb: 2, textAlign: "center" }}
      >
        Spiele von {user.name}
      </Typography>
      <Stats playerId={user.id} games={games} />
      <RecentPlays
        games={games}
        columnKey="deck"
        placingKey="player"
        placingId={user.id}
      />
    </Box>
  );
}
