import Autocomplete from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { debounce } from "@mui/material/utils";
import React from "react";
import { Form } from "react-router";

import { IdInput } from "./IdInput";
import NumberField from "~/components/NumberField";
import type { User } from "~/generated/prisma/client";

interface Deck {
  name: string;
  description: string;
  commander: string;
  owner: User | null;
  bracket: number;
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

export function EditDeck({
  deck,
  action,
  users,
  clearOnSave,
}: {
  deck: Deck;
  action?: string;
  users: User[];
  clearOnSave: boolean;
}) {
  const [name, setName] = React.useState<string>(deck.name);
  const [owner, setOwner] = React.useState<User | null>(deck.owner);
  const [bracket, setBracket] = React.useState<number | null>(deck.bracket);
  const [colors, setColors] = React.useState<string>(deck.colors);
  const [url, setUrl] = React.useState<string>(deck.url);
  const [description, setDescription] = React.useState<string>(
    deck.description,
  );
  const [commanderCompletions, setCommanderCompletions] = React.useState<
    string[]
  >([]);
  const [loading, setLoading] = React.useState(false);
  const [commander, setCommander] = React.useState<string>(deck.commander);
  const clear = () => {
    if (!clearOnSave) {
      return;
    }
    setName("");
    setOwner(null);
    setDescription("");
    setCommander("");
    setBracket(3);
    setColors("");
    setUrl("");
  };
  React.useEffect(() => {
    let discardLoad = false;
    setLoading(true);
    autoCompletions(commander, options => {
      if (discardLoad) {
        return;
      }
      setLoading(false);
      setCommanderCompletions(options);
    });
    return () => {
      discardLoad = true;
    };
  }, [commander]);
  return (
    <Form action={action} method="post" onSubmit={clear}>
      <Stack spacing={2}>
        <TextField
          name="name"
          label="Name"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <Autocomplete
          autoHighlight
          autoComplete
          filterOptions={x => x}
          freeSolo
          options={commanderCompletions}
          value={commander}
          onInputChange={(_, v) => {
            setCommander(v);
          }}
          onChange={(_, v) => {
            setCommander(v ?? "");
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
          value={owner}
          options={users}
          onInputChange={value => setOwner(value)}
          getOptionLabel={value => value.name}
          name="owner"
          idName="ownerId"
          label="Besitzer"
          required={true}
        />
        <TextField
          name="colors"
          label="Farben"
          value={colors}
          onChange={e => setColors(e.target.value)}
        />
        <NumberField
          name="bracket"
          label="Bracket"
          min={1}
          max={5}
          required={true}
          value={bracket}
          onValueChange={v => setBracket(v)}
        />
        <TextField
          name="description"
          label="Beschreibung"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
        <TextField
          name="url"
          label="Link"
          value={url}
          onChange={e => setUrl(e.target.value)}
        />
        <Button type="submit" color="primary">
          Speichern
        </Button>
      </Stack>
    </Form>
  );
}
