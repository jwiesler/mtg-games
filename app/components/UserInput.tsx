import {
  Autocomplete,
  TextField,
  type AutocompleteInputChangeReason,
} from "@mui/material";
import type { User } from "~/generated/prisma/client";

export interface UserInputProps {
  value: User;
  users: User[];
  name: string;
  label: string;
  required: boolean;
  onInputChange: (user: User) => void;
}

export function UserInput({
  value,
  users,
  name,
  label,
  required,
  onInputChange,
}: UserInputProps) {
  return (
    <Autocomplete
      disableClearable
      options={users}
      getOptionLabel={o => o.name}
      getOptionKey={o => o.id}
      value={value}
      onChange={(_, v) => onInputChange(v)}
      renderInput={params => (
        <TextField
          {...params}
          name={name}
          label={label}
          required={required}
          slotProps={{
            input: {
              ...params.InputProps,
              type: "search",
            },
          }}
        />
      )}
    />
  );
}
