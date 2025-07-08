import { Autocomplete, TextField } from "@mui/material";
import React from "react";
import { Fragment } from "react/jsx-runtime";

interface Input {
  id: number;
}

export interface InputProps<I extends Input> {
  value: I;
  options: I[];
  name: string;
  idName: string;
  label: string;
  required: boolean;
  onInputChange: (user: I) => void;
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
        disableClearable
        options={options}
        getOptionLabel={getOptionLabel}
        getOptionKey={o => o.id}
        value={value}
        onChange={(_, v) => {
          console.log(v);
          if (v == null) {
            return;
          }
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
        value={value.id}
        name={idName}
        readOnly
      ></input>
    </Fragment>
  );
}
