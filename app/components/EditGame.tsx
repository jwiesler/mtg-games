import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { renderTimeViewClock } from "@mui/x-date-pickers/timeViewRenderers";
import { de } from "date-fns/locale";
import React from "react";
import { Form } from "react-router";

import { IdInput } from "./IdInput";
import Placing from "./Placing";
import type { User } from "~/generated/prisma/client";
import { compareBools } from "~/sort";

export interface DeckDesc {
  id: number;
  name: string;
  ownerId: number;
}

export interface GameData {
  id?: number;
  when: Date | null;
  duration: number | null;
  plays: { player: User | null; deck: DeckDesc | null }[];
}

function EditPlay({
  i,
  player,
  deck,
  replacePlay,
  decks,
  users,
  disallowDelete,
}: {
  i: number;
  player: User | null;
  deck: DeckDesc | null;
  replacePlay: (
    i: number,
    w: { player: User | null; deck: DeckDesc | null } | null,
  ) => void;
  users: User[];
  decks: DeckDesc[];
  disallowDelete: boolean;
}) {
  const [groupBy, sortedDecks] = React.useMemo(() => {
    if (player === null) {
      return [undefined, decks];
    }
    const copy = [...decks];
    copy.sort((a, b) =>
      compareBools(a.ownerId !== player.id, b.ownerId !== player.id),
    );
    const groupBy = (deck: DeckDesc) =>
      deck.ownerId === player.id ? `Decks von ${player.name}` : "Andere Decks";
    return [groupBy, copy];
  }, [player]);
  return (
    <Grid size={12}>
      <Paper elevation={3} sx={{ p: "0.75em" }}>
        <Stack
          spacing={2}
          direction="row"
          sx={{
            alignItems: "center",
          }}
        >
          <Placing place={i + 1} />
          <Divider orientation="vertical" variant="middle" flexItem />
          <Stack spacing={2} sx={{ flexGrow: 1 }}>
            <IdInput
              value={player}
              options={users}
              onInputChange={value => replacePlay(i, { deck, player: value })}
              getOptionLabel={value => value.name}
              name="player"
              idName="playerId"
              label="Spieler"
              required={true}
            />
            <IdInput
              value={deck}
              options={sortedDecks}
              onInputChange={value => replacePlay(i, { deck: value, player })}
              groupBy={groupBy}
              getOptionLabel={value => value.name}
              name="deck"
              idName="deckId"
              label="Deck"
              required={true}
            />
            <Button
              color="error"
              disabled={disallowDelete}
              onClick={() => replacePlay(i, null)}
            >
              Mitspieler löschen
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Grid>
  );
}

function secondsFromDate(d: Date) {
  return (d.getHours() * 60 + d.getMinutes()) * 60 + d.getSeconds();
}

function dateFromSeconds(s: number) {
  const date = new Date();
  const hours = s / 3600;
  const minutes = (s / 60) % 60;
  const seconds = s % 60;
  date.setHours(hours, minutes, seconds, 0);
  return date;
}

const DEFAULT_PLAY = {
  player: null,
  deck: null,
};

export const DEFAULT_PLAYS = [
  DEFAULT_PLAY,
  DEFAULT_PLAY,
  DEFAULT_PLAY,
  DEFAULT_PLAY,
];

export default function EditGame({
  game,
  setGame,
  users,
  decks,
  onSubmit,
  mode,
}: {
  game: GameData;
  setGame: (game: GameData) => void;
  users: User[];
  decks: DeckDesc[];
  onSubmit: () => void;
  mode: "create" | "edit";
}) {
  const replacePlay = (
    i: number,
    play: { player: User | null; deck: DeckDesc | null } | null,
  ) => {
    const plays = [...game.plays];
    if (play !== null) {
      plays[i] = play;
    } else {
      plays.splice(i, 1);
    }
    setGame({ ...game, plays });
  };
  const addPlay = () => {
    setGame({ ...game, plays: [...game.plays, DEFAULT_PLAY] });
  };
  if (mode == "edit" && game.id === undefined) {
    throw new Error("game.id is not set in edit mode");
  }
  return (
    <Form method="post" onSubmit={onSubmit}>
      <Stack spacing={2}>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={de}>
          <DateTimePicker
            value={game.when}
            onChange={v => v != null && setGame({ ...game, when: v })}
            timezone="Europe/Berlin"
            label="Zeit"
            viewRenderers={{
              hours: renderTimeViewClock,
              minutes: renderTimeViewClock,
              seconds: renderTimeViewClock,
            }}
          />
          <TimePicker
            timezone="Europe/Berlin"
            value={
              game.duration == null ? null : dateFromSeconds(game.duration)
            }
            onChange={v =>
              v != null && setGame({ ...game, duration: secondsFromDate(v) })
            }
            label="Dauer"
            viewRenderers={{
              hours: renderTimeViewClock,
              minutes: renderTimeViewClock,
            }}
          />
        </LocalizationProvider>
        <input
          name="when"
          value={game.when?.toISOString() || ""}
          type="hidden"
        />
        <input
          name="duration"
          value={game.duration == null ? "" : game.duration}
          type="hidden"
        />
        {mode == "edit" && <input name="id" type="hidden" value={game.id} />}
        {game.plays.map(({ player, deck }, i) => (
          <EditPlay
            key={i}
            i={i}
            player={player}
            deck={deck}
            replacePlay={replacePlay}
            users={users}
            decks={decks}
            disallowDelete={game.plays.length <= 1}
          />
        ))}
        <Stack direction="row">
          <Button color="warning" onClick={() => addPlay()}>
            Mitspieler hinzufügen
          </Button>

          <Button
            type="submit"
            disabled={game.plays.length <= 1}
            color="primary"
          >
            Speichern
          </Button>
        </Stack>
      </Stack>
    </Form>
  );
}
