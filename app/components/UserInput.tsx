import {
  Autocomplete,
  TextField,
  type AutocompleteInputChangeReason,
} from "@mui/material";

export interface UserInputProps {
  value: string;
  options: string[];
  name: string;
  label: string;
  required: boolean;
  onInputChange: (
    event: React.SyntheticEvent,
    value: string,
    reason: AutocompleteInputChangeReason,
  ) => void;
}

export function UserInput({
  value,
  options,
  name,
  label,
  required,
  onInputChange,
}: UserInputProps) {
  return (
    <Autocomplete
      freeSolo
      disableClearable
      options={options}
      value={value}
      onInputChange={onInputChange}
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
