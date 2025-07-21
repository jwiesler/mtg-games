import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { Fragment } from "react/jsx-runtime";

interface Input {
  id: number;
}

export interface InputProps<I extends Input> {
  value: I | null;
  options: I[];
  name: string;
  idName: string;
  label: string;
  required: boolean;
  onInputChange: (user: I | null) => void;
  getOptionLabel: (value: I) => string;
}

export function IdInput<I extends Input>({
  value,
  options,
  name,
  idName,
  label,
  required,
  onInputChange,
  getOptionLabel,
}: InputProps<I>) {
  return (
    <Fragment>
      <Autocomplete
        blurOnSelect
        autoHighlight
        options={options}
        getOptionLabel={getOptionLabel}
        getOptionKey={o => o.id}
        value={value}
        onChange={(_, v) => {
          onInputChange(v);
        }}
        isOptionEqualToValue={(a, b) => a.id == b.id}
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
      <input
        type="number"
        hidden
        value={value?.id}
        name={idName}
        readOnly
      ></input>
    </Fragment>
  );
}
