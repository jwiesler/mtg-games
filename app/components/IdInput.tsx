import type { FilterOptionsState } from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { Fragment } from "react/jsx-runtime";
import { useRef } from "react";

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
  groupBy?: (value: I) => string;
  filterOptions?: (options: I[], state: FilterOptionsState<I>) => I[];
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
  groupBy,
  filterOptions,
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
        groupBy={groupBy}
        isOptionEqualToValue={(a, b) => a.id == b.id}
        filterOptions={filterOptions}
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
        onFocus={e => {
          e.target.scrollIntoView({
            behavior: 'smooth',
            block: "start",
          })
        }}
      />
      <input
        type="number"
        hidden
        value={value == null ? 0 : value.id}
        name={idName}
        readOnly
      ></input>
    </Fragment>
  );
}
