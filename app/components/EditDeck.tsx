import { Autocomplete, Button, Stack, TextField } from "@mui/material";
import React from "react";
import { Form } from "react-router";
import type { Deck } from "~/types";
import { UserInput } from "./UserInput";

export function EditDeck({
  deck,
  action,
  users,
  clearOnSave,
}: {
  deck: Deck;
  action?: string;
  users: string[];
  clearOnSave: boolean;
}) {
  const [name, setName] = React.useState(deck.name);
  const [owner, setOwner] = React.useState(deck.owner);
  const [description, setDescription] = React.useState(deck.description);
  const [commander, setCommander] = React.useState(deck.commander);
  React.useEffect(() => {
    setName(deck.name);
    setOwner(deck.owner);
    setDescription(deck.description);
    setCommander(deck.commander);
  }, []);
  const clear = () => {
    if (!clearOnSave) {
      return;
    }
    setName("");
    setOwner("");
    setDescription("");
    setCommander("");
  };
  return (
    <Form action={action} method="post" onSubmit={clear}>
      <Stack spacing={2}>
        <input name="form-id" hidden defaultValue="edit-deck" />
        <TextField
          name="name"
          label="Name"
          value={name}
          onChange={e => setName(e.target.value)}
          required={true}
        />
        <TextField
          name="commander"
          label="Commander"
          value={commander}
          onChange={e => setCommander(e.target.value)}
          required={true}
        />
        <UserInput
          options={users}
          value={owner}
          onInputChange={(_, value) => setOwner(value)}
          name="owner"
          label="Besitzer"
          required={true}
        />
        <TextField
          name="description"
          label="Beschreibung"
          value={description}
          onChange={e => setDescription(e.target.value)}
          required={true}
        />
        <Button type="submit" color="primary">
          Speichern
        </Button>
      </Stack>
    </Form>
  );
}
