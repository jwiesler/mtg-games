import Check from "@mui/icons-material/Check";
import Delete from "@mui/icons-material/Delete";
import IconButton from "@mui/material/IconButton";
import React from "react";
import { Form } from "react-router";

import Drawer from "~/components/Drawer";

export default function EditDrawer({
  open,
  setOpen,
  onDelete,
  mode,
  what,
  children,
}: {
  open: boolean;
  setOpen: (value: boolean) => void;
  onDelete: () => void;
  mode: "create" | "edit";
  what: string;
  children: React.ReactNode;
}) {
  return (
    <Drawer.Root open={open} onClose={() => setOpen(false)}>
      <Form method="post">
        <Drawer.Header
          onClose={() => setOpen(false)}
          title={mode == "create" ? `${what} anlegen` : `${what} bearbeiten`}
        >
          {mode == "edit" && (
            <IconButton onClick={onDelete}>
              <Delete />
            </IconButton>
          )}
          <IconButton type="submit" color="primary">
            <Check />
          </IconButton>
        </Drawer.Header>
        <Drawer.Body>{children}</Drawer.Body>
      </Form>
    </Drawer.Root>
  );
}
