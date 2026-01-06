import Autocomplete from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { debounce } from "@mui/material/utils";
import React from "react";

import { IdInput } from "./IdInput";
import NumberField from "~/components/NumberField";
import type { User } from "~/generated/prisma/client";

export interface DeckData {
  id?: number;
  name: string;
  description: string;
  commander: string;
  owner: User | null;
  bracket: number | null;
  colors: string;
  url: string;
}

const autoCompletions = debounce(
  async (input: string, callback: (results: string[]) => void) => {
    const url = new URL("https://api.scryfall.com/cards/autocomplete");
    url.searchParams.append("q", input);
    const result = await (await fetch(url)).json();
    callback("data" in result ? (result.data as string[]) : []);
  },
  200,
);

export const EMPTY_DECK: DeckData = {
  name: "",
  owner: null,
  description: "",
  commander: "",
  bracket: 3,
  colors: "",
  url: "",
};

export function EditDeck({
  mode,
  deck,
  setDeck,
  users,
}: {
  mode: "create" | "edit";
  deck: DeckData;
  setDeck: (deck: DeckData) => void;
  users: User[];
}) {
  const [commanderCompletions, setCommanderCompletions] = React.useState<
    string[]
  >([]);
  const [loading, setLoading] = React.useState(false);
  React.useEffect(() => {
    let discardLoad = false;
    setLoading(true);
    autoCompletions(deck.commander, options => {
      if (discardLoad) {
        return;
      }
      setLoading(false);
      setCommanderCompletions(options);
    });
    return () => {
      discardLoad = true;
    };
  }, [deck.commander]);
  if (mode == "edit" && deck.id === undefined) {
    throw new Error("deck.id is not set in edit mode");
  }
  return (
    <Stack spacing={2}>
      <TextField
        name="name"
        label="Name"
        value={deck.name}
        onChange={e => setDeck({ ...deck, name: e.target.value })}
      />
      <Autocomplete
        autoHighlight
        autoComplete
        filterOptions={x => x}
        freeSolo
        options={commanderCompletions}
        value={deck.commander}
        onInputChange={(_, v) => {
          setDeck({ ...deck, commander: v });
        }}
        onChange={(_, v) => {
          setDeck({ ...deck, commander: v ?? "" });
        }}
        renderInput={params => (
          <TextField
            {...params}
            name={"commander"}
            label={"Commander"}
            required={true}
            slotProps={{
              input: {
                ...params.InputProps,
                type: "search",
                endAdornment: (
                  <React.Fragment>
                    {loading ? (
                      <CircularProgress color="inherit" size={20} />
                    ) : null}
                    {params.InputProps.endAdornment}
                  </React.Fragment>
                ),
              },
            }}
          />
        )}
      />
      <IdInput
        value={deck.owner}
        options={users}
        onInputChange={value => setDeck({ ...deck, owner: value })}
        getOptionLabel={value => value.name}
        name="owner"
        idName="ownerId"
        label="Besitzer"
        required={true}
      />
      <TextField
        name="colors"
        label="Farben"
        value={deck.colors}
        onChange={e => setDeck({ ...deck, colors: e.target.value })}
      />
      <NumberField
        name="bracket"
        label="Bracket"
        min={1}
        max={5}
        required={true}
        value={deck.bracket}
        onValueChange={v => setDeck({ ...deck, bracket: v })}
      />
      <TextField
        name="description"
        label="Beschreibung"
        value={deck.description}
        onChange={e => setDeck({ ...deck, description: e.target.value })}
      />
      <TextField
        name="url"
        label="Link"
        value={deck.url}
        onChange={e => setDeck({ ...deck, url: e.target.value })}
      />
      <Button type="submit" color="primary">
        Speichern
      </Button>
      {mode == "edit" && <input name="id" type="hidden" value={deck.id} />}
    </Stack>
  );
}
