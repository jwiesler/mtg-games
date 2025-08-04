import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import {
  type LoaderFunctionArgs,
  type MetaFunction,
  useLoaderData,
} from "react-router";

import RecentPlays from "~/components/RecentPlays";
import prisma from "~/db.server";
import { NotFound } from "~/responses";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = Number(params.id);
  if (Number.isNaN(id)) {
    throw NotFound();
  }
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

export default function Player() {
  const { user, games } = useLoaderData<typeof loader>();
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
        Spiele von {user.name}
      </Typography>
      <RecentPlays
        games={games}
        columnKey="deck"
        placingKey="player"
        placingId={user.id}
      />
    </Box>
  );
}
