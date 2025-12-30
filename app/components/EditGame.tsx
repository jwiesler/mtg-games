import DownIcon from "@mui/icons-material/KeyboardArrowDown";
import UpIcon from "@mui/icons-material/KeyboardArrowUp";
import { createFilterOptions } from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
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
import { compareBools } from "~/sort";

export interface DeckDesc {
  id: number;
  name: string;
  commander: string;
  ownerId: number;
}

export interface UserDesc {
  name: string;
  id: number;
}

export interface GameData {
  id?: number;
  when: Date | null;
  duration: number | null;
  comment: string;
  plays: { player: UserDesc | null; deck: DeckDesc | null }[];
}

function EditPlay({
  i,
  player,
  deck,
  replacePlay,
  swap,
  decks,
  users,
  disallowDelete,
  up,
  down,
}: {
  i: number;
  player: UserDesc | null;
  deck: DeckDesc | null;
  replacePlay: (
    i: number,
    w: { player: UserDesc | null; deck: DeckDesc | null } | null,
  ) => void;
  swap: (i: number, dir: "up" | "down") => void;
  users: UserDesc[];
  decks: DeckDesc[];
  disallowDelete: boolean;
  up: boolean;
  down: boolean;
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
          <Stack spacing={2} sx={{ alignItems: "center" }}>
            <IconButton
              sx={{ visibility: up ? "visible" : "hidden" }}
              onClick={() => swap(i, "up")}
            >
              <UpIcon />
            </IconButton>
            <Placing place={i + 1} />
            <IconButton
              sx={{ visibility: down ? "visible" : "hidden" }}
              onClick={() => swap(i, "down")}
            >
              <DownIcon />
            </IconButton>
          </Stack>
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
              filterOptions={createFilterOptions({
                stringify: value => `${value.name} ${value.commander}`,
              })}
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
  onDelete,
  mode,
}: {
  game: GameData;
  setGame: (game: GameData) => void;
  users: UserDesc[];
  decks: DeckDesc[];
  onSubmit: () => void;
  onDelete: () => void;
  mode: "create" | "edit";
}) {
  const replacePlay = (
    i: number,
    play: { player: UserDesc | null; deck: DeckDesc | null } | null,
  ) => {
    const plays = [...game.plays];
    if (play !== null) {
      plays[i] = play;
    } else {
      plays.splice(i, 1);
    }
    setGame({ ...game, plays });
  };
  const swap = (i: number, dir: "up" | "down") => {
    const target = i + (dir === "up" ? -1 : 1);
    const plays = [...game.plays];
    const copy = plays[i];
    plays[i] = plays[target];
    plays[target] = copy;
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
        <TextField
          name="comment"
          label="Kommentar"
          value={game.comment}
          onChange={e => setGame({ ...game, comment: e.target.value })}
        ></TextField>
        {game.plays.map(({ player, deck }, i) => (
          <EditPlay
            key={i}
            i={i}
            player={player}
            deck={deck}
            replacePlay={replacePlay}
            swap={swap}
            users={users}
            decks={decks}
            disallowDelete={game.plays.length <= 1}
            up={i > 0}
            down={i < game.plays.length - 1}
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
