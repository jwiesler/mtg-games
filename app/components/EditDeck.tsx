import { Button, Grid, TextField } from "@mui/material";
import React from "react";
import { Form } from "react-router";
import { IdInput } from "./IdInput";
import type { User } from "~/generated/prisma/client";

interface Deck {
  name: string;
  description: string;
  commander: string;
  owner: User;
}

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
  const [owner, setOwner] = React.useState<User>(deck.owner);
  const [description, setDescription] = React.useState<string>(
    deck.description,
  );
  const [commander, setCommander] = React.useState<string>(deck.commander);
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
    setOwner(users[0]);
    setDescription("");
    setCommander("");
  };
  return (
    <Form action={action} method="post" onSubmit={clear}>
      <Grid container spacing={2}>
        <Grid size={12}>
          <TextField
            name="name"
            label="Name"
            value={name}
            onChange={e => setName(e.target.value)}
            required={true}
          />
        </Grid>
        <Grid size={12}>
          <TextField
            name="commander"
            label="Commander"
            value={commander}
            onChange={e => setCommander(e.target.value)}
            required={true}
          />
        </Grid>
        <Grid size={12}>
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
        </Grid>
        <Grid size={12}>
          <TextField
            name="description"
            label="Beschreibung"
            value={description}
            onChange={e => setDescription(e.target.value)}
            required={true}
          />
        </Grid>
        <Grid size={12}>
          <Button type="submit" color="primary">
            Speichern
          </Button>
        </Grid>
      </Grid>
    </Form>
  );
}
